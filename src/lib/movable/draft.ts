const DRAFT_KEY = "movable:onboarding-draft:v1";

/** Only the free-text draft crosses the marketing → onboarding boundary. */
const storageKey = (scope: string) => scope === "local" ? DRAFT_KEY : `${DRAFT_KEY}:${scope}`;
export function saveOnboardingDraft(text: string, scope = "local"): void {
  if (typeof window === "undefined") return;
  try { window.sessionStorage.setItem(storageKey(scope), text); } catch { /* URL fallback retains the draft. */ }
}

export function readOnboardingDraft(scope = "local"): string {
  if (typeof window === "undefined") return "";
  try { return window.sessionStorage.getItem(storageKey(scope)) ?? ""; } catch { return ""; }
}

export function clearOnboardingDraft(scope = "local"): void {
  if (typeof window === "undefined") return;
  try { window.sessionStorage.removeItem(storageKey(scope)); } catch { /* Nothing persisted. */ }
}

export function onboardingHref(text = "", scope = "local"): string {
  saveOnboardingDraft(text, scope);
  return text ? `/onboarding?draft=${encodeURIComponent(text)}` : "/onboarding";
}
