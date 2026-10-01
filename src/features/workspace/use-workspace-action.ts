"use client";

import { useRef, useState } from "react";
import { newRequestId } from "@/lib/movable/client";

/** Keep the request identity on failure so a retry cannot apply an action twice. */
export function useWorkspaceAction() {
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [failedKey, setFailedKey] = useState<string | null>(null);
  const inFlight = useRef(false);
  const requests = useRef(new Map<string, string>());

  async function run<T>(key: string, action: (requestId: string) => Promise<T>) {
    if (inFlight.current) return { ok: false as const };
    inFlight.current = true;
    setPending(key);
    setError(null);
    setFailedKey(null);
    const requestId = requests.current.get(key) ?? newRequestId();
    requests.current.set(key, requestId);
    try {
      const value = await action(requestId);
      requests.current.delete(key);
      return { ok: true as const, value };
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong. Please try again.");
      setFailedKey(key);
      return { ok: false as const };
    } finally {
      inFlight.current = false;
      setPending(null);
    }
  }

  return { run, pending, error, failedKey, clearError: () => { setError(null); setFailedKey(null); } };
}
