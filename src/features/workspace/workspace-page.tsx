"use client";

import Link from "next/link";
import { useRef, useState, useSyncExternalStore } from "react";
import { ArrowRight, ArrowUpRight, Info, LoaderCircle, Map, MessageCircle, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Brand } from "@/components/movable/brand";
import { EnvironmentNotice } from "@/components/movable/environment-notice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useMovable } from "@/lib/movable/client";
import type { Move, Task } from "@/lib/movable/contracts";
import { ArrivalDashboard } from "./arrival-dashboard";
import { ArrivalDialog } from "./arrival-dialog";
import { AssistantPanel } from "./assistant-panel";
import { TaskDrawer } from "./task-drawer";
import { TaskPlan, type TaskFilter } from "./task-plan";
import { useWorkspaceAction } from "./use-workspace-action";

const subscribeHydration = () => () => {};
const hydratedSnapshot = () => true;
const serverSnapshot = () => false;
const desktopSnapshot = () => window.matchMedia("(min-width: 1280px)").matches;
function subscribeDesktop(callback: () => void) {
  const media = window.matchMedia("(min-width: 1280px)");
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

export function WorkspacePage() {
  const { move, phase, mode, error } = useMovable();
  const hydrated = useSyncExternalStore(subscribeHydration, hydratedSnapshot, serverSnapshot);
  return <div className="min-h-dvh">
    <a href="#workspace-main" className="sr-only fixed top-2 left-2 z-[100] rounded-lg bg-foreground px-4 py-3 text-background focus:not-sr-only">Skip to your move</a>
    <EnvironmentNotice />
    {!hydrated || phase === "loading" ? <><WorkspaceHeader /><main id="workspace-main" aria-busy="true" className="mx-auto max-w-6xl space-y-6 px-5 py-10"><p role="status" className="text-sm text-muted-foreground">Opening your move…</p><Skeleton className="h-12 w-2/3" /><Skeleton className="h-52 w-full" /><Skeleton className="h-72 w-full" /></main></> : move ? <ActiveWorkspace key={move.id} move={move} /> : <>
      <WorkspaceHeader />
      <main id="workspace-main" className="mx-auto max-w-2xl px-6 py-20 sm:py-28">
        <span className="mb-7 flex size-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground"><Map className="size-6" aria-hidden /></span>
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">A new place. Your own pace.</p>
        <h1 className="text-4xl leading-tight font-semibold tracking-tight">{phase === "error" ? "Your workspace isn’t available yet." : "Your next chapter starts here."}</h1>
        <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground">{phase === "error" ? error ?? "We couldn’t load your move. Explore the example while your workspace is unavailable." : "Tell us where you’re headed. We’ll bring your preparation, arrival, and first days together in one plan."}</p>
        <div className="mt-8 flex flex-wrap gap-3">{phase !== "error" && <Button asChild size="lg" className="h-12 px-5"><Link href="/onboarding">Plan my move<ArrowUpRight aria-hidden /></Link></Button>}<Button asChild variant="outline" size="lg" className="h-12 px-5"><Link href="/demo">Explore an example<ArrowRight aria-hidden /></Link></Button></div>
        {mode === "local" && <p className="mt-6 text-xs leading-relaxed text-muted-foreground">This prototype saves your move in this browser. No account needed.</p>}
      </main>
    </>}
  </div>;
}

function WorkspaceHeader({ pending = false, onReset }: { pending?: boolean; onReset?: () => void }) {
  const { mode } = useMovable();
  return <header className="border-b bg-background">
    <nav aria-label="Workspace navigation" className="mx-auto flex min-h-20 max-w-[1440px] flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-8 lg:px-10">
      <div className="flex items-center gap-3 sm:gap-5"><Brand /><span className="hidden h-5 w-px bg-border sm:block" /><Badge variant="outline" className="rounded-full px-2.5 py-1 text-[10px] font-medium text-muted-foreground">{mode === "demo" ? "Example move" : "My workspace"}</Badge></div>
      <div className="flex items-center gap-2 sm:gap-3">{mode === "demo" && onReset && <Button variant="ghost" className="h-10 px-2 sm:px-3" disabled={pending} onClick={onReset}><RotateCcw className="size-3.5" aria-hidden /><span>Reset example</span></Button>}<Button asChild variant={mode === "demo" ? "default" : "outline"} className="h-10 px-3 sm:px-4"><Link href="/onboarding">Plan my move<ArrowUpRight className="size-3.5" aria-hidden /></Link></Button></div>
    </nav>
  </header>;
}

function ActiveWorkspace({ move }: { move: Move }) {
  const { tasks, messages, sources, phase, error: workspaceError, mode, setTaskStatus, sendMessage, updateProfile, generatePlan, resetDemo } = useMovable();
  const action = useWorkspaceAction();
  const desktop = useSyncExternalStore(subscribeDesktop, desktopSnapshot, serverSnapshot);
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [taskId, setTaskId] = useState<string | null>(null);
  const [contextId, setContextId] = useState<string | null>(null);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [arrivalOpen, setArrivalOpen] = useState(false);
  const [text, setText] = useState("");
  const [focusVersion, setFocusVersion] = useState(0);
  const opener = useRef<HTMLElement | null>(null);
  const assistantButton = useRef<HTMLButtonElement>(null);
  const followWithAssistant = useRef(false);
  const selectedTask = tasks.find((task) => task.id === taskId) ?? null;
  const contextTask = tasks.find((task) => task.id === contextId) ?? null;
  const busy = action.pending !== null;

  function rememberFocus() { if (!taskId && !arrivalOpen) opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null; }
  function restoreFocus(event: Event) {
    event.preventDefault();
    if (followWithAssistant.current) {
      followWithAssistant.current = false;
      setAssistantOpen(true);
      setFocusVersion((version) => version + 1);
    } else if (opener.current?.isConnected) opener.current.focus();
    else assistantButton.current?.focus();
  }
  function openTask(task: Task) { rememberFocus(); action.clearError(); setAssistantOpen(false); setTaskId(task.id); }
  function editArrival() { rememberFocus(); action.clearError(); setAssistantOpen(false); setArrivalOpen(true); }
  async function toggleTask(task: Task) {
    const status = task.status === "done" ? "todo" : "done";
    const result = await action.run(`status:${task.id}:${status}`, (id) => setTaskStatus(task.id, status, id));
    if (result.ok) toast.success(status === "done" ? "Task completed" : "Task reopened", { description: task.title });
  }
  async function send() {
    const input = text.trim();
    if (!input || busy) return;
    const result = await action.run(`message:${contextId}:${input}`, (id) => sendMessage(move.id, input, contextId, id));
    if (result.ok) { setText(""); setFocusVersion((version) => version + 1); }
  }
  function reset() {
    if (busy) return;
    resetDemo();
    setTaskId(null); setContextId(null); setArrivalOpen(false); setAssistantOpen(false); setFilter("all"); setText(""); action.clearError();
    toast.success("Example reset", { description: "You’re back at the beginning of the example move." });
  }
  const assistant = <AssistantPanel messages={messages} tasks={tasks} contextTask={contextTask} text={text} pending={busy} error={action.failedKey?.startsWith("message:") ? action.error : null} focusVersion={focusVersion} onText={setText} onSend={send} onRemoveContext={() => { setContextId(null); setFocusVersion((version) => version + 1); }} onOpen={openTask} onEdit={editArrival} />;

  return <>
    <WorkspaceHeader pending={busy} onReset={reset} />
    <div className="mx-auto grid max-w-[1440px] gap-8 px-5 pt-8 pb-28 sm:px-8 sm:pt-10 lg:px-10 xl:grid-cols-[minmax(0,1fr)_360px] xl:gap-10 xl:pb-12">
      <main id="workspace-main" className="min-w-0 space-y-8 sm:space-y-10">
        {action.error && <div role="alert" className="rounded-xl border border-destructive/25 bg-card p-4 text-sm text-destructive">{action.error}</div>}
        {phase === "generating" ? <section aria-busy="true" className="rounded-2xl border bg-card p-8"><LoaderCircle className="mb-4 size-6 animate-spin motion-reduce:animate-none" aria-hidden /><h1 className="text-2xl font-semibold">Preparing your plan</h1><p role="status" className="mt-2 text-sm text-muted-foreground">Your move is here. The tasks will appear when they’re ready.</p></section> : tasks.length === 0 ? <section className="rounded-2xl border bg-card p-8"><h1 className="text-2xl font-semibold">Your move is here. Let’s add the plan.</h1><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{workspaceError ?? "Your profile has been saved, but there are no tasks yet. Continue with this move to prepare your checklist."}</p><Button className="mt-6 h-11 px-5" disabled={busy} onClick={async () => { const result = await action.run(`plan:${move.id}`, (id) => generatePlan(move.id, id)); if (result.ok) toast.success("Your plan is ready"); }}>{busy ? "Preparing…" : "Prepare my plan"}<ArrowRight aria-hidden /></Button></section> : <>
          <ArrivalDashboard move={move} tasks={tasks} onOpen={openTask} onEdit={editArrival} />
          <TaskPlan tasks={tasks} filter={filter} onFilter={setFilter} onOpen={openTask} onStatus={toggleTask} pending={busy} />
          <div className="flex gap-3 border-t pt-5 text-xs leading-relaxed text-muted-foreground"><Info className="mt-0.5 size-4 shrink-0" aria-hidden /><p><span className="font-medium text-foreground">Guidance needs verification.</span> This plan contains illustrative preparation steps. Confirm requirements and dates with the relevant official services.</p></div>
        </>}
      </main>
      {desktop && <aside aria-label="Movable assistant" className="sticky top-6 h-[calc(100dvh-11rem)] min-h-0 overflow-hidden rounded-2xl border bg-card">{assistant}</aside>}
    </div>
    {!desktop && <>
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-end bg-gradient-to-t from-background to-transparent px-5 pt-6 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <Button ref={assistantButton} className="pointer-events-auto h-12 gap-2 rounded-full bg-foreground px-5 text-background shadow-lg hover:bg-foreground/90" onClick={() => { action.clearError(); setAssistantOpen(true); setFocusVersion((version) => version + 1); }}><MessageCircle className="size-4" aria-hidden />Ask Movable{contextTask && <span className="size-1.5 rounded-full bg-background" aria-label="Task context attached" />}</Button>
      </div>
      <Sheet open={assistantOpen} onOpenChange={setAssistantOpen}>
        <SheetContent className="gap-0 data-[side=right]:h-dvh data-[side=right]:w-full data-[side=right]:sm:max-w-md" onCloseAutoFocus={(event) => { event.preventDefault(); if (!taskId && !arrivalOpen) assistantButton.current?.focus(); }}>
          <SheetHeader className="sr-only"><SheetTitle>Ask Movable</SheetTitle><SheetDescription>{mode === "live" ? "A conversation with AI about your current move." : "A scripted conversation about your current move."}</SheetDescription></SheetHeader>
          {assistant}
        </SheetContent>
      </Sheet>
    </>}
    <TaskDrawer task={selectedTask} tasks={tasks} sources={sources} pending={busy} error={action.error} onClose={() => setTaskId(null)} onOpen={openTask} onStatus={toggleTask} onCloseAutoFocus={restoreFocus} onAsk={(task) => { action.clearError(); setContextId(task.id); followWithAssistant.current = true; setTaskId(null); }} />
    <ArrivalDialog move={move} open={arrivalOpen} pending={busy} error={action.error} onClose={() => setArrivalOpen(false)} onCloseAutoFocus={restoreFocus} onSave={async (date) => {
      const result = await action.run(`arrival:${date}`, (id) => updateProfile(move.id, { arrivalDate: date }, id));
      if (!result.ok) return null;
      toast.success("Arrival date updated", { description: mode === "demo" ? "The example plan has been rescheduled." : "Your plan has been rescheduled." });
      return result.value;
    }} />
  </>;
}
