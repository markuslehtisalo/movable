import { SignIn } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { Brand } from "@/components/movable/brand";

export default function SignInPage() {
  if (process.env.NEXT_PUBLIC_MOVABLE_MODE !== "live") redirect("/onboarding");
  return <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col items-center gap-8 px-4 py-12"><Brand /><div className="text-center"><h1 className="text-3xl font-semibold tracking-tight">Your next chapter, saved.</h1><p className="mt-3 text-muted-foreground">Sign in to keep your move and progress together.</p></div><SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" fallbackRedirectUrl="/app" /></main>;
}
