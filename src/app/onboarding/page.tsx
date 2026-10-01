import { Suspense } from "react";
import type { Metadata } from "next";
import { EnvironmentNotice } from "@/components/movable/environment-notice";
import { OnboardingLoading, OnboardingPage } from "@/features/onboarding/onboarding-page";

export const metadata: Metadata = { title: "Plan your move" };

export default function Page() {
  return <Suspense fallback={<><EnvironmentNotice /><OnboardingLoading /></>}><OnboardingPage /></Suspense>;
}
