"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClerkProvider, useAuth, UserButton } from "@clerk/nextjs";
import { ConvexReactClient, useConvex, useConvexAuth } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { MovableProvider } from "@/lib/movable/client";
import { createLiveAdapter } from "@/lib/movable/live-adapter";
import { Button } from "@/components/ui/button";

export function LiveProvider({ children }: { children: ReactNode }) {
  const [convex] = useState(() => process.env.NEXT_PUBLIC_CONVEX_URL ? new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL) : null);
  if (!convex || !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return <main className="mx-auto max-w-xl p-8"><h1 className="text-2xl font-semibold">Live setup needs attention</h1><p className="mt-4">Set the Convex URL and Clerk publishable key, or switch back to local mode.</p></main>;
  }
  return <ClerkProvider signInUrl="/sign-in" signUpUrl="/sign-up" signInFallbackRedirectUrl="/app" signUpFallbackRedirectUrl="/onboarding">
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}><AuthenticatedWorkspace>{children}</AuthenticatedWorkspace></ConvexProviderWithClerk>
  </ClerkProvider>;
}

function AuthenticatedWorkspace({ children }: { children: ReactNode }) {
  const convex = useConvex();
  const { userId, isLoaded, isSignedIn } = useAuth();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const pathname = usePathname();
  const personal = pathname === "/app" || pathname.startsWith("/app/") || pathname === "/onboarding" || pathname.startsWith("/onboarding/");
  const adapter = useMemo(() => createLiveAdapter(convex, isAuthenticated && !!userId), [convex, isAuthenticated, userId]);
  useEffect(() => { adapter.hydrate(); return () => adapter.dispose(); }, [adapter]);
  const [waitingTooLong, setWaitingTooLong] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setWaitingTooLong(true), 15000);
    return () => clearTimeout(timer);
  }, []);
  let content = children;
  if (personal && (!isLoaded || isLoading || (isSignedIn && !isAuthenticated))) {
    content = <main className="mx-auto max-w-xl px-6 py-20"><h1 className="text-2xl font-semibold">Connecting your account</h1><p role="status" className="mt-4 text-muted-foreground">{waitingTooLong ? "The secure connection is taking longer than expected. Check that Clerk’s Convex integration is activated, then reload." : "Opening your saved move…"}</p>{waitingTooLong && <Button className="mt-6" onClick={() => window.location.reload()}>Try again</Button>}</main>;
  } else if (personal && !isSignedIn) {
    content = <main className="mx-auto max-w-xl px-6 py-20"><h1 className="text-2xl font-semibold">Your next chapter, saved.</h1><p className="mt-4 text-muted-foreground">Sign in to plan your move and return to your progress.</p><Button asChild className="mt-6"><Link href="/sign-in">Sign in</Link></Button></main>;
  }
  return <MovableProvider key={`${userId ?? "guest"}:${isAuthenticated}`} mode="live" adapter={adapter}>
    {personal && isSignedIn && <div className="flex items-center justify-end gap-3 border-b bg-card px-5 py-2 text-xs text-muted-foreground"><span>Your account</span><UserButton /></div>}
    {content}
  </MovableProvider>;
}
