import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// DTO payloads are parsed with the shared Zod schemas before every write.
// Keeping DTOs together avoids a second, drifting copy of the frozen UI contract.
export default defineSchema({
  moves: defineTable({
    owner: v.string(), active: v.boolean(), revision: v.number(),
    profile: v.any(), createdAt: v.string(), updatedAt: v.string(),
  }).index("by_owner_active", ["owner", "active"]),
  tasks: defineTable({ moveId: v.id("moves"), key: v.string(), data: v.any() })
    .index("by_move", ["moveId"]),
  messages: defineTable({ moveId: v.id("moves"), data: v.any() })
    .index("by_move", ["moveId"]),
  requests: defineTable({
    owner: v.string(), requestId: v.string(), fingerprint: v.string(),
    kind: v.string(), state: v.union(v.literal("pending"), v.literal("done"), v.literal("failed")),
    startedAt: v.number(), lease: v.number(), token: v.string(), result: v.any(),
  }).index("by_owner_request", ["owner", "requestId"])
    .index("by_owner_time", ["owner", "startedAt"]),
});
