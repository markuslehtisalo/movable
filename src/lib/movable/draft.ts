const DRAFT_KEY = "movable:onboarding-draft:v1";

/** Only the free-text draft crosses the marketing → onboarding boundary. */
export function saveOnboardingDraft(text: string): void {
  if (typeof window === "undefined") return;
  try { window.sessionStorage.setItem(DRAFT_KEY, text); } catch { /* URL fallback retains the draft. */ }
}

export function readOnboardingDraft(): string {
  if (typeof window === "undefined") return "";
  try { return window.sessionStorage.getItem(DRAFT_KEY) ?? ""; } catch { return ""; }
}

export function clearOnboardingDraft(): void {
  if (typeof window === "undefined") return;
  try { window.sessionStorage.removeItem(DRAFT_KEY); } catch { /* Nothing persisted. */ }
}

export function onboardingHref(text = ""): string {
  saveOnboardingDraft(text);
  return text ? `/onboarding?draft=${encodeURIComponent(text)}` : "/onboarding";
}
