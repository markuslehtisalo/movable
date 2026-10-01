"use client";
import { useMovable } from "@/lib/movable/client";
export function EnvironmentNotice() {
  const { mode, error } = useMovable();
  return <div className="border-b bg-muted px-4 py-2 text-center text-xs leading-relaxed text-muted-foreground" role="status">
    {mode === "demo" ? "Example move · Scripted interactions · Illustrative guidance" : mode === "local" ? "Local prototype · Saved in this browser · AI and account sync are not connected" : "Connected prototype · Saved to your account · AI guidance needs checking"}
    {error && <p className="mt-1 text-destructive">{error}</p>}
  </div>;
}
