import { ConvexError, v } from "convex/values";
import { query, mutation, internalQuery, internalMutation, type QueryCtx, type MutationCtx, type ActionCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { completeProfileSchema, messageSchema, snapshotSchema, taskSchema, type MoveSnapshot, type Task, type ActionReceipt } from "../src/lib/movable/contracts";
import { answerSchema, applyPlanChanges, changeProfile, personalizeTasks, validatedProfile } from "../src/lib/movable/live-logic";
import { liveTaskTemplates, sourcesForProfile } from "../src/lib/movable/source-pack";

type ReadCtx = QueryCtx | MutationCtx;
export async function requireOwner(ctx: Pick<ActionCtx, "auth">): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new ConvexError("Sign in to open your move.");
  return identity.tokenIdentifier;
}

async function ownedMove(ctx: ReadCtx, owner: string, moveId: string) {
  const id = ctx.db.normalizeId("moves", moveId);
  const move = id ? await ctx.db.get(id) : null;
  if (!move || move.owner !== owner || !move.active) throw new ConvexError("This move is no longer available. Open your current workspace.");
  return move;
}
async function taskRows(ctx: ReadCtx, moveId: Id<"moves">) {
  return ctx.db.query("tasks").withIndex("by_move", (q) => q.eq("moveId", moveId)).collect();
}
async function snapshotFor(ctx: ReadCtx, move: Doc<"moves"> | null): Promise<MoveSnapshot> {
  if (!move) return { mode: "live", phase: "empty", move: null, tasks: [], messages: [], sources: [], error: null };
  const rows = await taskRows(ctx, move._id);
  const messages = await ctx.db.query("messages").withIndex("by_move", (q) => q.eq("moveId", move._id)).order("desc").take(100);
  const profile = completeProfileSchema.parse(move.profile);
  return snapshotSchema.parse({ mode: "live", phase: rows.length ? "ready" : "empty",
    move: { id: move._id, profile, createdAt: move.createdAt, updatedAt: move.updatedAt },
    tasks: rows.map((row) => taskSchema.parse(row.data)).sort((a, b) => a.priority - b.priority),
    messages: messages.reverse().map((row) => messageSchema.parse(row.data)), sources: sourcesForProfile(profile), error: null });
}
function validateRequest(requestId: string) {
  if (!requestId || requestId.length > 120) throw new ConvexError("Invalid request identifier.");
}
async function previous(ctx: ReadCtx, owner: string, requestId: string, fingerprint: string) {
  validateRequest(requestId);
  const record = await ctx.db.query("requests").withIndex("by_owner_request", (q) => q.eq("owner", owner).eq("requestId", requestId)).unique();
  if (record && record.fingerprint !== fingerprint) throw new ConvexError("This retry belongs to another action. Start a new request.");
  return record;
}
async function remember(ctx: MutationCtx, owner: string, requestId: string, fingerprint: string, result: unknown) {
  await ctx.db.insert("requests", { owner, requestId, fingerprint, result, kind: "mutation", state: "done", startedAt: Date.now(), lease: 0, token: "" });
}
async function writeTasks(ctx: MutationCtx, moveId: Id<"moves">, tasks: Task[]) {
  const existing = await taskRows(ctx, moveId);
  for (const task of tasks) {
    const data = taskSchema.parse(task);
    const row = existing.find((item) => item.key === task.key);
    if (row) await ctx.db.patch(row._id, { data });
    else await ctx.db.insert("tasks", { moveId, key: task.key, data });
  }
}
export const snapshot = query({ args: {}, handler: async (ctx): Promise<MoveSnapshot> => {
  const owner = await requireOwner(ctx);
  const move = await ctx.db.query("moves").withIndex("by_owner_active", (q) => q.eq("owner", owner).eq("active", true)).unique();
  return snapshotFor(ctx, move);
} });
export const createMove = mutation({ args: { profile: v.any(), requestId: v.string() }, handler: async (ctx, args): Promise<{ moveId: string }> => {
  const owner = await requireOwner(ctx);
  const profile = validatedProfile(args.profile);
  const fingerprint = JSON.stringify(["create", profile]);
  const prior = await previous(ctx, owner, args.requestId, fingerprint);
  if (prior) return prior.result;
  const current = await ctx.db.query("moves").withIndex("by_owner_active", (q) => q.eq("owner", owner).eq("active", true)).unique();
  if (current) await ctx.db.patch(current._id, { active: false });
  const now = new Date().toISOString();
  const moveId = await ctx.db.insert("moves", { owner, profile, active: true, revision: 0, createdAt: now, updatedAt: now });
  const result = { moveId };
  await remember(ctx, owner, args.requestId, fingerprint, result);
  return result;
} });
export const updateProfile = mutation({ args: { moveId: v.string(), patch: v.any(), requestId: v.string() }, handler: async (ctx, args): Promise<ActionReceipt[]> => {
  const owner = await requireOwner(ctx);
  const move = await ownedMove(ctx, owner, args.moveId);
  const fingerprint = JSON.stringify(["profile", args.moveId, args.patch]);
  const prior = await previous(ctx, owner, args.requestId, fingerprint);
  if (prior) return prior.result;
  const current = await snapshotFor(ctx, move);
  const next = changeProfile(move._id, current.move!.profile, current.tasks, args.patch, args.requestId);
  await ctx.db.patch(move._id, { profile: next.profile, revision: move.revision + 1, updatedAt: new Date().toISOString() });
  await writeTasks(ctx, move._id, next.tasks);
  await remember(ctx, owner, args.requestId, fingerprint, next.receipts);
  return next.receipts;
} });
export const setTaskStatus = mutation({ args: { taskId: v.string(), status: v.union(v.literal("todo"), v.literal("done")), requestId: v.string() }, handler: async (ctx, args): Promise<ActionReceipt> => {
  const owner = await requireOwner(ctx);
  const move = await ctx.db.query("moves").withIndex("by_owner_active", (q) => q.eq("owner", owner).eq("active", true)).unique();
  if (!move) throw new ConvexError("Open your current move first.");
  const fingerprint = JSON.stringify(["task", args.taskId, args.status]);
  const prior = await previous(ctx, owner, args.requestId, fingerprint);
  if (prior) return prior.result;
  const rows = await taskRows(ctx, move._id);
  const row = rows.find((item) => item.data.id === args.taskId);
  if (!row) throw new ConvexError("This task is not in your current move.");
  const task = taskSchema.parse(row.data);
  const receipt: ActionReceipt = { id: `${args.requestId}:task`, type: "task_updated", targetId: task.id, label: task.title, before: task.status, after: args.status };
  await ctx.db.patch(row._id, { data: taskSchema.parse({ ...task, status: args.status }) });
  await ctx.db.patch(move._id, { revision: move.revision + 1, updatedAt: new Date().toISOString() });
  await remember(ctx, owner, args.requestId, fingerprint, receipt);
  return receipt;
} });

export const actionContext = internalQuery({ args: { owner: v.string(), moveId: v.string() }, handler: async (ctx, args): Promise<{ snapshot: MoveSnapshot; revision: number }> => {
  const move = await ownedMove(ctx, args.owner, args.moveId);
  return { snapshot: await snapshotFor(ctx, move), revision: move.revision };
} });
export const beginAI = internalMutation({ args: { owner: v.string(), requestId: v.string(), fingerprint: v.string(), kind: v.string(), token: v.string() }, handler: async (ctx, args) => {
  const prior = await previous(ctx, args.owner, args.requestId, args.fingerprint);
  if (prior?.state === "done") return { done: true, result: prior.result };
  const now = Date.now();
  if (prior?.state === "pending" && prior.lease > now) throw new ConvexError("That request is still running. Wait a moment, then retry.");
  const recent = await ctx.db.query("requests").withIndex("by_owner_time", (q) => q.eq("owner", args.owner).gte("startedAt", now - 3600000)).collect();
  if (recent.filter((row) => row.kind !== "mutation").length >= 40 && !prior) throw new ConvexError("You’ve reached the prototype’s hourly AI limit. Please try again later.");
  const data = { ...args, state: "pending" as const, startedAt: now, lease: now + 180000, result: null };
  if (prior) await ctx.db.replace(prior._id, data);
  else await ctx.db.insert("requests", data);
  return { done: false, result: null };
} });
export const failAI = internalMutation({ args: { owner: v.string(), requestId: v.string(), token: v.string() }, handler: async (ctx, args) => {
  const record = await ctx.db.query("requests").withIndex("by_owner_request", (q) => q.eq("owner", args.owner).eq("requestId", args.requestId)).unique();
  if (record?.state === "pending" && record.token === args.token) await ctx.db.patch(record._id, { state: "failed", lease: 0 });
} });
export const finishAI = internalMutation({ args: {
  owner: v.string(), requestId: v.string(), token: v.string(), moveId: v.union(v.string(), v.null()),
  revision: v.number(), result: v.any(), userText: v.string(), selectedTaskId: v.union(v.string(), v.null()),
}, handler: async (ctx, args) => {
  const record = await ctx.db.query("requests").withIndex("by_owner_request", (q) => q.eq("owner", args.owner).eq("requestId", args.requestId)).unique();
  if (!record || record.token !== args.token || record.state !== "pending") throw new ConvexError("This request expired. Please retry.");
  if (args.moveId) {
    const move = await ownedMove(ctx, args.owner, args.moveId);
    if (move.revision !== args.revision) throw new ConvexError("Your move changed while the assistant was working. Please retry against the latest plan.");
    const current = await snapshotFor(ctx, move);
    if (record.kind === "plan") {
      const generated = personalizeTasks(liveTaskTemplates(move._id, current.move!.profile), args.result);
      const tasks = generated.map((task) => current.tasks.find((old) => old.key === task.key && old.status === "done") ?? task);
      await writeTasks(ctx, move._id, tasks);
    } else if (record.kind === "message") {
      if (args.selectedTaskId && !current.tasks.some((task) => task.id === args.selectedTaskId)) throw new ConvexError("That task is no longer available.");
      const next = applyPlanChanges(move._id, current.move!.profile, current.tasks, args.result.changes, args.requestId);
      const answer = answerSchema.parse(args.result.answer);
      await writeTasks(ctx, move._id, next.tasks);
      await ctx.db.patch(move._id, { profile: next.profile });
      const createdAt = new Date().toISOString();
      for (const data of [
        { id: `${args.requestId}:user`, moveId: move._id, role: "user", text: args.userText, createdAt, selectedTaskId: args.selectedTaskId, receipts: [], draft: null },
        { id: `${args.requestId}:assistant`, moveId: move._id, role: "assistant", text: answer.text, createdAt, selectedTaskId: args.selectedTaskId, receipts: next.receipts, draft: answer.draft },
      ]) await ctx.db.insert("messages", { moveId: move._id, data: messageSchema.parse(data) });
    } else throw new ConvexError("Invalid operation.");
    await ctx.db.patch(move._id, { revision: move.revision + 1, updatedAt: new Date().toISOString() });
  }
  await ctx.db.patch(record._id, { state: "done", lease: 0, result: record.kind === "extract" ? args.result : null });
  return record.kind === "extract" ? args.result : null;
} });
