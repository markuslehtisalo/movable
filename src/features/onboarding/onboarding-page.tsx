"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, CircleCheck, FileText, LoaderCircle, MapPin, Pencil, Route } from "lucide-react";
import { Brand } from "@/components/movable/brand";
import { EnvironmentNotice } from "@/components/movable/environment-notice";
import { MoveSummary } from "@/components/movable/move-summary";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMovable, newRequestId } from "@/lib/movable/client";
import type { MoveProfile } from "@/lib/movable/contracts";
import { EXAMPLE_PROMPT } from "@/lib/movable/fixtures";
import { clearOnboardingDraft, readOnboardingDraft, saveOnboardingDraft } from "@/lib/movable/draft";
import { formatDate, isSupportedProfile } from "@/lib/movable/selectors";
import { cn } from "@/lib/utils";
import { ProfileForm } from "./profile-form";
import { continuePlan } from "./build-plan";
import { countryName, DETAILS_KEY, fieldsFromProfile, restoreDetails, validateFields, type BuildAttempt, type FieldErrors, type ProfileFields, type Step } from "./profile-fields";

const STEPS = [
  { key: "describe", label: "Your move" },
  { key: "details", label: "The details" },
  { key: "review", label: "Your plan" },
] as const;
const subscribeToHydration = () => () => {};

export function OnboardingPage() {
  // Browser-only draft reads happen in the child, after the server render hydrates.
  const hydrated = useSyncExternalStore(subscribeToHydration, () => true, () => false);
  return <><EnvironmentNotice />{hydrated ? <OnboardingFlow /> : <OnboardingLoading />}</>;
}

export function OnboardingLoading() {
  return <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
    <Brand /><p role="status" className="mt-16 flex items-center gap-3 text-muted-foreground"><LoaderCircle className="size-4 motion-safe:animate-spin" aria-hidden />Restoring your move…</p>
  </main>;
}

function OnboardingFlow() {
  const params = useSearchParams();
  const router = useRouter();
  const { mode, phase, move, tasks, extractProfile, createMove, generatePlan } = useMovable();
  const [initial] = useState(() => restoreDetails(params.get("draft"), readOnboardingDraft()));
  const [draft, setDraft] = useState(initial.draft);
  const [attempt, setAttempt] = useState<BuildAttempt | null>(initial.attempt);
  const [replacementId, setReplacementId] = useState<string | null>(null);
  const [pending, setPending] = useState<"extract" | "create" | "generate" | "navigate" | null>(null);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [storageWarning, setStorageWarning] = useState(false);
  const busy = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const previousStep = useRef<Step>(draft.step);
  const finished = useRef(false);

  useEffect(() => {
    if (finished.current) return;
    saveOnboardingDraft(draft.text);
    try { window.sessionStorage.setItem(DETAILS_KEY, JSON.stringify({ draft, attempt })); }
    catch { queueMicrotask(() => setStorageWarning(true)); }
  }, [draft, attempt]);

  useEffect(() => {
    if (previousStep.current !== draft.step) heading.current?.focus();
    previousStep.current = draft.step;
  }, [draft.step]);

  const existingMove = move && move.id !== attempt?.moveId && move.id !== replacementId;
  const validated = validateFields(draft.fields);
  const profile = attempt?.profile ?? validated.profile;
  const unsupported = !!validated.profile && !isSupportedProfile(validated.profile);
  const stepIndex = STEPS.findIndex((step) => step.key === draft.step);
  const doneCount = tasks.filter((task) => task.status === "done").length;

  function goTo(step: Step) {
    if (busy.current || attempt) return;
    setError("");
    setFieldErrors({});
    setDraft((current) => ({ ...current, step }));
  }

  function changeField(key: keyof MoveProfile, value: string) {
    setDraft((current) => ({
      ...current, fields: { ...current.fields, [key]: value },
      touched: current.touched.includes(key) ? current.touched : [...current.touched, key],
    }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
    setError("");
  }

  async function extract(event: FormEvent) {
    event.preventDefault();
    if (busy.current) return;
    if (!draft.text.trim()) {
      setError("Tell us a little about your move, or enter your details yourself.");
      document.getElementById("onboarding-prompt")?.focus();
      return;
    }
    if (draft.extractedText === draft.text) { goTo("details"); return; }
    busy.current = true;
    setPending("extract");
    setError("");
    try {
      const extracted = fieldsFromProfile(await extractProfile(draft.text));
      setDraft((current) => {
        for (const key of current.touched) extracted[key] = current.fields[key];
        return { ...current, fields: extracted, extractedText: current.text, step: "details" };
      });
      setFieldErrors({});
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We couldn’t read that description. Try again, or enter the details yourself.");
    } finally {
      busy.current = false;
      setPending(null);
    }
  }

  function review(event: FormEvent) {
    event.preventDefault();
    const result = validateFields(draft.fields);
    setFieldErrors(result.errors);
    if (!result.profile) {
      setError("A few details still need your attention.");
      requestAnimationFrame(() => document.getElementById(Object.keys(result.errors)[0])?.focus());
      return;
    }
    if (!isSupportedProfile(result.profile)) {
      setError("");
      requestAnimationFrame(() => document.getElementById("coverage-note")?.focus());
      return;
    }
    setError("");
    setDraft((current) => ({ ...current, fields: fieldsFromProfile(result.profile!), step: "review" }));
  }

  async function buildPlan() {
    if (busy.current || existingMove || phase === "loading") return;
    const confirmed = attempt?.profile ?? validateFields(draft.fields).profile;
    if (!confirmed || !isSupportedProfile(confirmed)) { goTo("details"); return; }
    busy.current = true;
    setError("");
    const next = attempt ?? {
      profile: confirmed, createRequestId: newRequestId(), planRequestId: newRequestId(), moveId: null,
    };
    function remember(value: BuildAttempt) {
      setAttempt(value);
      // Store the request IDs before calling a command, including across a refresh.
      try { window.sessionStorage.setItem(DETAILS_KEY, JSON.stringify({ draft, attempt: value })); }
      catch { setStorageWarning(true); }
    }
    remember(next);
    try {
      await continuePlan(next, { createMove, generatePlan }, remember, setPending);
      finished.current = true;
      clearOnboardingDraft();
      try { window.sessionStorage.removeItem(DETAILS_KEY); } catch { /* The plan remains available in this tab. */ }
      setPending("navigate");
      router.push("/app");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something interrupted your plan. Your details are still here. Please try again.");
      setPending(null);
      busy.current = false;
    }
  }

  const titles = {
    describe: "A new chapter starts here.", details: "Let’s get the details right.", review: "Your move, taking shape.",
  };

  return <div className="min-h-[calc(100dvh-2.5rem)]">
    <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-6 sm:px-8 sm:py-8">
      <Brand />
      <Button asChild variant="ghost" className="h-11 gap-2 text-muted-foreground"><Link href="/">Back to home<ArrowUpRight aria-hidden /></Link></Button>
    </header>
    <main className="mx-auto max-w-6xl px-5 pb-12 pt-5 sm:px-8 sm:pt-10">
      <div className="grid items-start gap-10 lg:grid-cols-[0.8fr_1.45fr] lg:gap-20">
        <aside className="lg:sticky lg:top-10">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.18em] text-primary">Make room for what’s next</p>
          <h1 className="max-w-sm text-4xl font-medium leading-[1.14] tracking-[-0.045em] sm:text-5xl">Big move.<br />Small, clear steps.</h1>
          <p className="mt-5 max-w-sm text-base leading-7 text-muted-foreground">A little about you. A few details about your move. A place to start.</p>
          <div className="hidden lg:block"><JourneyPreview fields={draft.fields} /></div>
        </aside>

        <div className="min-w-0">
          <nav aria-label="Onboarding progress" className="mb-7">
            <ol className="flex items-center">
              {STEPS.map((step, index) => <li key={step.key} aria-current={draft.step === step.key ? "step" : undefined} className="flex min-w-0 flex-1 items-center last:flex-none">
                <span className={cn("flex items-center gap-2 text-xs sm:text-sm", index > stepIndex ? "text-muted-foreground" : "font-medium")}>
                  <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-full text-xs", index === stepIndex ? "bg-foreground text-background" : index < stepIndex ? "bg-secondary" : "border")}>
                    {index < stepIndex ? <Check className="size-3.5" aria-hidden /> : index + 1}
                  </span><span>{step.label}</span>
                </span>
                {index < 2 && <span className="mx-2 h-px min-w-2 flex-1 bg-border sm:mx-4" aria-hidden />}
              </li>)}
            </ol>
          </nav>

          {phase === "loading" ? <div role="status" className="rounded-3xl border bg-card p-8">Restoring your saved workspace…</div>
            : existingMove ? <section className="space-y-5 rounded-3xl border bg-card p-6 sm:p-8" aria-labelledby="existing-title">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-secondary"><Route className="size-5" aria-hidden /></span>
              <h2 id="existing-title" className="text-2xl font-semibold tracking-tight">You already have a move underway.</h2>
              <p className="text-sm leading-6 text-muted-foreground">Open your saved move, or start a new one. Your current move and its {doneCount} completed {doneCount === 1 ? "task stay" : "tasks stay"} until you choose to replace it.</p>
              <MoveSummary profile={move.profile} className="min-w-0 break-words bg-background" />
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button asChild size="lg" className="h-11 px-5"><Link href="/app">Open my move<ArrowRight aria-hidden /></Link></Button>
                <Button variant="outline" size="lg" className="h-11 px-5" onClick={() => {
                  setReplacementId(move.id); setAttempt(null); setError("");
                  requestAnimationFrame(() => heading.current?.focus());
                }}>Start a new move</Button>
              </div>
              <p className="text-xs leading-5 text-muted-foreground">Your onboarding draft is kept here while you decide.</p>
            </section>
              : <section className="rounded-3xl border bg-card p-5 shadow-sm sm:p-8" aria-labelledby="step-title" aria-busy={!!pending}>
                <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Step {stepIndex + 1} of 3</p>
                <h2 id="step-title" ref={heading} tabIndex={-1} className="rounded-sm text-2xl font-semibold tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-[1.75rem]">{titles[draft.step]}</h2>

                {draft.step === "describe" && <form onSubmit={extract} className="mt-3 space-y-6">
                  <p className="text-sm leading-6 text-muted-foreground">Tell us where you’re headed and what you know so far. You’ll check every detail before building a plan.</p>
                  <div className="space-y-3">
                    <Label htmlFor="onboarding-prompt">Tell us about your move</Label>
                    <Textarea id="onboarding-prompt" value={draft.text} disabled={!!pending} aria-describedby="description-help" aria-invalid={!!error}
                      className="min-h-44 resize-y rounded-xl bg-background/50 p-4 text-base leading-7 md:text-base"
                      placeholder="I’m moving from… to… for my studies. I’m planning to arrive in…"
                      onChange={(event) => { setDraft((current) => ({ ...current, text: event.target.value })); setError(""); }} />
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p id="description-help" className="text-xs text-muted-foreground">Your route, university, dates — any of it helps.</p>
                      <Button type="button" variant="secondary" className="h-10 rounded-full px-4" disabled={!!pending} onClick={() => {
                        setDraft((current) => ({ ...current, text: EXAMPLE_PROMPT })); setError(""); document.getElementById("onboarding-prompt")?.focus();
                      }}><FileText aria-hidden />Use example</Button>
                    </div>
                  </div>
                  <div className="rounded-xl bg-muted/65 p-4 text-xs leading-5 text-muted-foreground">This local preview recognizes a few explicit phrases. Anything it can’t read stays blank for you to fill in. Your manual corrections are kept.</div>
                  {error && <ErrorMessage message={error} />}
                  <div className="flex flex-col gap-2 sm:items-start">
                    <Button type="submit" size="lg" disabled={!!pending || mode === "live"} className="h-12 w-full px-5 sm:w-auto">
                      {pending ? <><LoaderCircle className="motion-safe:animate-spin" aria-hidden />Reading your details…</> : <>{error ? "Try again" : "Check my details"}<ArrowRight aria-hidden /></>}
                    </Button>
                    <Button type="button" variant="ghost" className="h-11 text-muted-foreground" disabled={!!pending} onClick={() => goTo("details")}>Enter details myself</Button>
                  </div>
                </form>}

                {draft.step === "details" && <form onSubmit={review} noValidate className="mt-3 space-y-6">
                  <p className="text-sm leading-6 text-muted-foreground">{draft.extractedText !== null ? "Here’s what we could pick up. Check it, fill the gaps, and make it yours." : "Start with what you know. All these details are needed to prepare the example plan."}</p>
                  <ProfileForm fields={draft.fields} errors={fieldErrors} onChange={changeField} />
                  <CoverageNote unsupported={unsupported} />
                  {error && <ErrorMessage message={error} />}
                  <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <Button type="button" variant="ghost" className="h-11" onClick={() => goTo("describe")}><ArrowLeft aria-hidden />Back</Button>
                    <Button type="submit" size="lg" className="h-12 px-5" disabled={mode === "live"}>Review my move<ArrowRight aria-hidden /></Button>
                  </div>
                </form>}

                {draft.step === "review" && profile && <div className="mt-3 space-y-6">
                  <p className="text-sm leading-6 text-muted-foreground">One last look. Your confirmed details will shape this local example plan.</p>
                  <ConfirmedJourney profile={profile} />
                  <div className="space-y-3">
                    <p className="text-sm font-medium">A starting point for your next chapter</p>
                    {["Suggested tasks around your arrival", "A place to track your progress", "Details you can come back to in this browser"].map((item) => <p key={item} className="flex items-start gap-2 text-sm text-muted-foreground"><CircleCheck className="mt-0.5 size-4 shrink-0 text-foreground" aria-hidden />{item}</p>)}
                  </div>
                  <p className="rounded-xl bg-muted/65 p-4 text-xs leading-5 text-muted-foreground">This plan uses illustrative example content. Sources and guidance haven’t been verified. AI and account sync aren’t connected.</p>
                  {move && move.id === replacementId && !attempt?.moveId && <p className="rounded-xl border border-primary/25 bg-accent p-4 text-sm leading-6 text-accent-foreground">Building this plan will replace your current move and its saved progress in this browser.</p>}
                  {attempt && !pending && <p className="text-sm leading-6 text-muted-foreground">{attempt.moveId ? "Your move is created. Continue to finish its plan using the same saved details." : "Your confirmed details are kept for this attempt. Retry to continue."}</p>}
                  {error && <ErrorMessage message={error} />}
                  <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
                    {attempt ? <Button asChild variant="ghost" className="h-11"><Link href="/app">Open workspace</Link></Button> : <Button type="button" variant="ghost" className="h-11" onClick={() => goTo("details")}><Pencil aria-hidden />Edit details</Button>}
                    <Button size="lg" className="h-12 px-5" disabled={!!pending || mode === "live"} onClick={buildPlan}>
                      {pending ? <><LoaderCircle className="motion-safe:animate-spin" aria-hidden />{pending === "create" ? "Saving your move…" : pending === "navigate" ? "Opening your plan…" : "Building your plan…"}</> : <>{attempt ? "Retry building my plan" : move?.id === replacementId ? "Replace & build my plan" : "Build my plan"}<ArrowRight aria-hidden /></>}
                    </Button>
                  </div>
                  <div role="status" className="sr-only">{pending ? "Preparing your local plan. Please wait." : ""}</div>
                </div>}
              </section>}
          <p className="mt-5 flex items-center justify-center gap-2 text-center text-xs leading-5 text-muted-foreground"><span className="size-1.5 shrink-0 rounded-full bg-current" aria-hidden />{storageWarning ? "Browser storage is unavailable. Keep this tab open to retain your draft." : "Your draft stays in this browser tab. No account needed."}</p>
        </div>
      </div>
    </main>
  </div>;
}

function ErrorMessage({ message }: { message: string }) {
  return <p role="alert" className="rounded-xl border border-destructive/25 bg-destructive/5 p-4 text-sm leading-6 text-destructive">{message}</p>;
}

function CoverageNote({ unsupported }: { unsupported: boolean }) {
  return <div id="coverage-note" tabIndex={-1} role={unsupported ? "alert" : undefined} className={cn("rounded-xl border p-4 text-sm leading-6 outline-none focus-visible:ring-2 focus-visible:ring-ring", unsupported ? "border-primary/25 bg-accent text-accent-foreground" : "bg-background/50 text-muted-foreground")}>
    <p className="mb-1 font-medium text-foreground">{unsupported ? "This move is outside the current preview." : "A small preview, with a specific route."}</p>
    <p>Plan generation currently covers Finnish citizens living in Finland, moving to Amsterdam for a fixed-length exchange.</p>
    {unsupported && <p className="mt-2">Your details are kept. You can edit them above or <Link className="font-medium underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring" href="/demo">explore the separate example</Link>.</p>}
  </div>;
}

function ConfirmedJourney({ profile }: { profile: MoveProfile }) {
  const details = [
    ["Citizenship", countryName(profile.citizenship)],
    ["Arriving", formatDate(profile.arrivalDate)],
    ["University", profile.university],
    ["Studies", profile.studyType === "exchange" ? "Exchange" : "Full degree"],
    ["Stay", profile.stayType === "fixed" ? `${profile.durationMonths} ${profile.durationMonths === 1 ? "month" : "months"} · Fixed length` : "Open-ended"],
  ];
  return <div className="overflow-hidden rounded-2xl border bg-background/60">
    <div className="grid min-w-0 grid-cols-[1fr_auto_1fr] items-start gap-3 border-b p-5">
      <div className="min-w-0"><p className="mb-1 text-xs text-muted-foreground">From</p><p className="break-words text-xl font-semibold tracking-tight">{profile.originCity}</p><p className="mt-1 text-xs text-muted-foreground">{countryName(profile.originCountry)}</p></div>
      <ArrowRight className="mt-6 size-5 text-primary" aria-hidden />
      <div className="min-w-0"><p className="mb-1 text-xs text-muted-foreground">To</p><p className="break-words text-xl font-semibold tracking-tight">{profile.destinationCity}</p><p className="mt-1 text-xs text-muted-foreground">{countryName(profile.destinationCountry)}</p></div>
    </div>
    <dl className="grid gap-x-6 gap-y-4 p-5 sm:grid-cols-2">
      {details.map(([label, value]) => <div key={label} className={label === "University" ? "min-w-0 sm:col-span-2" : "min-w-0"}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 break-words text-sm font-medium">{value}</dd></div>)}
    </dl>
  </div>;
}

function JourneyPreview({ fields }: { fields: ProfileFields }) {
  return <div className="mt-10">
    <div className="relative rounded-2xl border bg-card/60 p-6">
      <p className="mb-6 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">A little closer to your next chapter</p>
      <div className="relative space-y-9">
        <div className="absolute bottom-5 left-[15px] top-5 border-l border-dashed border-primary/40" aria-hidden />
        {[{ label: "Starting in", city: fields.originCity || "Where you are", country: fields.originCountry }, { label: "Making a home in", city: fields.destinationCity || "Somewhere new", country: fields.destinationCountry }].map((stop, index) => <div key={stop.label} className="relative flex items-center gap-4">
          <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full border", index === 0 ? "bg-card" : "border-primary/20 bg-accent text-primary")}><MapPin className="size-3.5" aria-hidden /></span>
          <div className="min-w-0"><p className="text-xs text-muted-foreground">{stop.label}</p><p className="mt-0.5 break-words text-lg font-medium tracking-tight">{stop.city}</p>{stop.country && <p className="mt-0.5 text-xs text-muted-foreground">{countryName(stop.country)}</p>}</div>
        </div>)}
      </div>
    </div>
    <p className="mt-5 max-w-xs text-xs leading-6 text-muted-foreground">Before you leave. Your first days. Settling in.<br />One move, broken into manageable moments.</p>
  </div>;
}
