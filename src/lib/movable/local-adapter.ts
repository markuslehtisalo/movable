import { z } from "zod";
import {
  completeProfileSchema, profileDraftSchema, snapshotSchema,
  type ActionReceipt, type MovableAdapter, type MoveSnapshot, type ProfileDraft, type RuntimeMode,
} from "./contracts";
import { createDemoSnapshot, createFixtureTasks, DEMO_PROFILE, EXAMPLE_PROMPT } from "./fixtures";
import { getNextTasks, isSupportedProfile, rescheduleTasks, shiftDate } from "./selectors";

export const LOCAL_STORAGE_KEY = "movable:local-workspace:v1";
const persistedSchema = z.object({ snapshot: snapshotSchema, requests: z.array(z.tuple([z.string(), z.unknown()])) });
type StoragePort = Pick<Storage, "getItem" | "setItem">;
export const newRequestId = () => crypto.randomUUID();

export function createLocalAdapter(mode: RuntimeMode, getStorage?: () => StoragePort): MovableAdapter {
  const empty: MoveSnapshot = {
    mode, phase: mode === "live" ? "error" : "empty", move: null, tasks: [], messages: [], sources: [],
    error: mode === "live" ? "Live authentication, Convex, and OpenAI are not connected yet. Use /demo to explore the example." : null,
  };
  let snapshot: MoveSnapshot = mode === "demo" ? createDemoSnapshot() : empty;
  const serverSnapshot = snapshot;
  const listeners = new Set<() => void>();
  let requests = new Map<string, unknown>();
  let hydrated = false;
  const storage = () => getStorage ? getStorage() : typeof window !== "undefined" ? window.localStorage : undefined;

  function available() {
    if (mode === "live") throw new Error(empty.error!);
  }
  function getMove(id: string) {
    available();
    if (!snapshot.move || snapshot.move.id !== id) throw new Error("This move is no longer available. Reload your workspace.");
    return snapshot.move;
  }
  function commit(next: MoveSnapshot, requestId?: string, result?: unknown) {
    snapshot = next;
    if (requestId) requests.set(requestId, result ?? null);
    requests = new Map([...requests].slice(-128));
    if (mode === "local") {
      try { storage()?.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ snapshot, requests: [...requests] })); }
      catch { snapshot = { ...snapshot, error: "Browser storage is unavailable. Changes work in this tab but may not survive a reload." }; }
    }
    listeners.forEach((listener) => listener());
  }
  function applyProfile(patch: ProfileDraft): { next: MoveSnapshot; receipts: ActionReceipt[] } {
    const move = snapshot.move!;
    const profile = completeProfileSchema.parse({ ...move.profile, ...profileDraftSchema.parse(patch) });
    if (!isSupportedProfile(profile)) throw new Error("This local prototype supports Finnish exchange students moving to Amsterdam. Broader coverage is not connected yet.");
    const receipts: ActionReceipt[] = Object.entries(patch)
      .filter(([key, value]) => value !== undefined && move.profile[key as keyof typeof profile] !== value)
      .map(([key, value]) => ({ id: newRequestId(), type: "profile_updated", targetId: move.id, label: key, before: String(move.profile[key as keyof typeof profile] ?? ""), after: String(value ?? "") }));
    return { next: { ...snapshot, move: { ...move, profile, updatedAt: new Date().toISOString() }, tasks: rescheduleTasks(snapshot.tasks, profile.arrivalDate) }, receipts };
  }

  const adapter: MovableAdapter = {
    getSnapshot: () => snapshot,
    getServerSnapshot: () => serverSnapshot,
    subscribe: (listener) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    hydrate() {
      if (hydrated) return;
      hydrated = true;
      if (mode !== "local") return;
      try {
        const raw = storage()?.getItem(LOCAL_STORAGE_KEY);
        if (!raw) return;
        const saved = persistedSchema.parse(JSON.parse(raw));
        if (saved.snapshot.mode !== "local") throw new Error("Unexpected workspace mode");
        requests = new Map(saved.requests);
        snapshot = saved.snapshot;
      } catch {
        snapshot = { ...empty, error: "Your previous local preview could not be restored. You can start a new move." };
      }
      listeners.forEach((listener) => listener());
    },
    commands: {
      async extractProfile(text) {
        available();
        if (text.trim() === EXAMPLE_PROMPT) return { ...DEMO_PROFILE };
        // Deliberately limited local parsing. This is never presented as an AI response.
        const draft: ProfileDraft = {};
        if (/\bFinnish\b/i.test(text)) draft.citizenship = "FI";
        if (/\bfrom Helsinki\b/i.test(text)) { draft.originCity = "Helsinki"; draft.originCountry = "FI"; }
        if (/\bto Amsterdam\b/i.test(text)) { draft.destinationCity = "Amsterdam"; draft.destinationCountry = "NL"; }
        if (/\bexchange\b/i.test(text)) draft.studyType = "exchange";
        if (/\bUniversity of Amsterdam\b/i.test(text)) draft.university = "University of Amsterdam";
        const date = text.match(/\b\d{4}-\d{2}-\d{2}\b/)?.[0];
        if (date && profileDraftSchema.safeParse({ arrivalDate: date }).success) draft.arrivalDate = date;
        if (/\bsix.month\b/i.test(text)) { draft.stayType = "fixed"; draft.durationMonths = 6; }
        return draft;
      },
      async createMove(input, requestId) {
        available();
        if (requests.has(requestId)) return requests.get(requestId) as { moveId: string };
        const profile = completeProfileSchema.parse(input);
        const now = new Date().toISOString();
        const moveId = newRequestId();
        const result = { moveId };
        commit({ ...empty, move: { id: moveId, profile, createdAt: now, updatedAt: now } }, requestId, result);
        return result;
      },
      async generatePlan(moveId, requestId) {
        const move = getMove(moveId);
        if (requests.has(requestId)) return;
        if (!isSupportedProfile(move.profile)) throw new Error("This example currently covers Finnish exchange students moving to Amsterdam. Choose the supported example to continue.");
        const existing = new Map(snapshot.tasks.map((task) => [task.key, task]));
        const tasks = createFixtureTasks(move.id, move.profile).map((task) => existing.get(task.key) ?? task);
        commit({ ...snapshot, tasks, phase: "ready", error: null }, requestId);
      },
      async updateProfile(moveId, patch, requestId) {
        getMove(moveId);
        if (requests.has(requestId)) return requests.get(requestId) as ActionReceipt[];
        const { next, receipts } = applyProfile(patch);
        commit(next, requestId, receipts);
        return receipts;
      },
      async setTaskStatus(taskId, status, requestId) {
        available();
        if (requests.has(requestId)) return requests.get(requestId) as ActionReceipt;
        if (status !== "todo" && status !== "done") throw new Error("Invalid task status.");
        const task = snapshot.tasks.find((item) => item.id === taskId);
        if (!task) throw new Error("Task not found.");
        const receipt: ActionReceipt = { id: newRequestId(), type: "task_updated", targetId: task.id, label: task.title, before: task.status, after: status };
        commit({ ...snapshot, tasks: snapshot.tasks.map((item) => item.id === taskId ? { ...item, status } : item) }, requestId, receipt);
        return receipt;
      },
      async sendMessage(moveId, input, selectedTaskId, requestId) {
        const move = getMove(moveId);
        if (requests.has(requestId)) return;
        const text = input.trim();
        if (!text || text.length > 4000) throw new Error("Enter a message of 1–4,000 characters.");
        const selected = selectedTaskId ? snapshot.tasks.find((task) => task.id === selectedTaskId) : undefined;
        if (selectedTaskId && !selected) throw new Error("The selected task is no longer available.");
        let next = snapshot;
        const receipts: ActionReceipt[] = [];
        if (/two weeks later/i.test(text)) {
          const change = applyProfile({ arrivalDate: shiftDate(move.profile.arrivalDate, 14) });
          next = change.next;
          receipts.push(...change.receipts);
        }
        if (/found housing|found (?:a|my) (?:home|place)|secured housing/i.test(text)) {
          const task = next.tasks.find((item) => item.key === "find-housing");
          if (task && task.status !== "done") {
            receipts.push({ id: newRequestId(), type: "task_updated", targetId: task.id, label: task.title, before: task.status, after: "done" });
            next = { ...next, tasks: next.tasks.map((item) => item.id === task.id ? { ...item, status: "done" } : item) };
          }
        }
        const nextTask = getNextTasks(next.tasks, 1)[0];
        const answer = receipts.length
          ? "Example interaction: I've updated this local plan. Review the saved changes below."
          : selected
            ? `Example guidance: ${selected.explanation} ${selected.steps.join(" ")} This content has not been verified against official sources.`
            : /next/i.test(text) && nextTask
              ? `In this example, your next action is: ${nextTask.title}. ${nextTask.explanation}`
              : "This is a scripted preview, not a connected AI assistant. Try “I'm arriving two weeks later, and I've found housing,” select a task to explore, or ask what to do next.";
        const createdAt = new Date().toISOString();
        commit({ ...next, messages: [...next.messages,
          { id: `${requestId}:user`, moveId, role: "user", text, createdAt, selectedTaskId, receipts: [], draft: null },
          { id: `${requestId}:assistant`, moveId, role: "assistant", text: answer, createdAt, selectedTaskId, receipts, draft: null },
        ] }, requestId);
      },
      resetDemo() {
        if (mode !== "demo") throw new Error("Reset example is only available in demo mode.");
        requests.clear();
        commit(createDemoSnapshot());
      },
    },
  };
  return adapter;
}
