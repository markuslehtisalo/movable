import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest, type NextFetchEvent } from "next/server";

const personalRoute = createRouteMatcher(["/app(.*)", "/onboarding(.*)"]);
const withClerk = clerkMiddleware(async (auth, request) => {
  if (personalRoute(request)) await auth.protect();
}, { signInUrl: "/sign-in", signUpUrl: "/sign-up" });

export default function proxy(request: NextRequest, event: NextFetchEvent) {
  if (process.env.NEXT_PUBLIC_MOVABLE_MODE !== "live") return NextResponse.next();
  return withClerk(request, event);
}
export const config = {
  matcher: ["/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|webmanifest)).*)", "/(api|trpc)(.*)"],
};
