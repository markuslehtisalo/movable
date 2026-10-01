import { v, ConvexError } from "convex/values";
import { internalMutation } from "./_generated/server";

// Admin-only cleanup for identities created by scripts/smoke-live.mjs.
export const removeSmokeData = internalMutation({ args: { owner: v.string() }, handler: async (ctx, { owner }) => {
  if (!owner.startsWith("https://movable-smoke.invalid|")) throw new ConvexError("Only smoke-test identities can be cleaned up.");
  const moves = await ctx.db.query("moves").withIndex("by_owner_active", (q) => q.eq("owner", owner)).collect();
  for (const move of moves) {
    for (const table of ["tasks", "messages"] as const) {
      const rows = await ctx.db.query(table).withIndex("by_move", (q) => q.eq("moveId", move._id)).collect();
      for (const row of rows) await ctx.db.delete(row._id);
    }
    await ctx.db.delete(move._id);
  }
  const requests = await ctx.db.query("requests").withIndex("by_owner_request", (q) => q.eq("owner", owner)).collect();
  for (const request of requests) await ctx.db.delete(request._id);
  return null;
} });
