import { SignUp } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { Brand } from "@/components/movable/brand";

export default function SignUpPage() {
  if (process.env.NEXT_PUBLIC_MOVABLE_MODE !== "live") redirect("/onboarding");
  return <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col items-center gap-8 px-4 py-12"><Brand /><h1 className="text-center text-3xl font-semibold tracking-tight">A place for your next chapter.</h1><SignUp routing="path" path="/sign-up" signInUrl="/sign-in" fallbackRedirectUrl="/onboarding" /></main>;
}
