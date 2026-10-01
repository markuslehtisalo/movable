import type { ConvexReactClient } from "convex/react";
import { ConvexError } from "convex/values";
import { api } from "../../../convex/_generated/api";
import { snapshotSchema, type MovableAdapter, type MoveSnapshot } from "./contracts";

function readableError(error: unknown): Error {
  if (error instanceof ConvexError && typeof error.data === "string") return new Error(error.data);
  return new Error("We couldn’t reach your saved move. Check your connection and retry.");
}

export function createLiveAdapter(client: ConvexReactClient, authenticated: boolean): MovableAdapter & { dispose(): void } {
  const initial: MoveSnapshot = { mode: "live", phase: authenticated ? "loading" : "empty", move: null, tasks: [], messages: [], sources: [], error: null };
  let snapshot = initial;
  let unsubscribe: (() => void) | undefined;
  const listeners = new Set<() => void>();
  const emit = (next: MoveSnapshot) => { snapshot = next; listeners.forEach((listener) => listener()); };
  async function command<T>(run: () => Promise<T>): Promise<T> {
    if (!authenticated) throw new Error("Sign in to save your move.");
    try { return await run(); } catch (error) { throw readableError(error); }
  }
  return {
    getSnapshot: () => snapshot, getServerSnapshot: () => initial,
    subscribe(listener) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    hydrate() {
      if (!authenticated || unsubscribe) return;
      const watch = client.watchQuery(api.workspace.snapshot, {});
      const update = () => {
        try { const value = watch.localQueryResult(); if (value !== undefined) emit(snapshotSchema.parse(value)); }
        catch (error) { emit({ ...snapshot, phase: "error", error: readableError(error).message }); }
      };
      unsubscribe = watch.onUpdate(update);
      update();
    },
    dispose() { unsubscribe?.(); unsubscribe = undefined; },
    commands: {
      extractProfile: (text) => command(() => client.action(api.ai.extractProfile, { text, requestId: crypto.randomUUID() })),
      createMove: (profile, requestId) => command(() => client.mutation(api.workspace.createMove, { profile, requestId })),
      generatePlan: async (moveId, requestId) => { await command(() => client.action(api.ai.generatePlan, { moveId, requestId })); },
      updateProfile: (moveId, patch, requestId) => command(() => client.mutation(api.workspace.updateProfile, { moveId, patch, requestId })),
      setTaskStatus: (taskId, status, requestId) => command(() => client.mutation(api.workspace.setTaskStatus, { taskId, status, requestId })),
      sendMessage: async (moveId, text, selectedTaskId, requestId) => { await command(() => client.action(api.ai.sendMessage, { moveId, text, selectedTaskId, requestId })); },
      resetDemo() { throw new Error("Only the public example can be reset."); },
    },
  };
}
