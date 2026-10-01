"use client";
import { MovableProvider } from "@/lib/movable/client";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LiveProvider } from "@/components/movable/live-provider";
export function Providers({ children }: { children: React.ReactNode }) {
  const mode = process.env.NEXT_PUBLIC_MOVABLE_MODE === "live" ? "live" : "local";
  const content = <>{children}<Toaster theme="light" richColors /></>;
  return <TooltipProvider>{mode === "live" ? <LiveProvider>{content}</LiveProvider> : <MovableProvider mode="local">{content}</MovableProvider>}</TooltipProvider>;
}
