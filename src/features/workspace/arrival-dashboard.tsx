"use client";

import { ArrowRight, ArrowUpRight, CalendarDays, Check, MapPin, Pencil, Route } from "lucide-react";
import { MoveSummary } from "@/components/movable/move-summary";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { Move, Task } from "@/lib/movable/contracts";
import { daysUntil, getNextTasks, getProgress } from "@/lib/movable/selectors";
import { taskTimingLabel } from "./task-plan";

export function ArrivalDashboard({ move, tasks, onOpen, onEdit }: {
  move: Move;
  tasks: Task[];
  onOpen: (task: Task) => void;
  onEdit: () => void;
}) {
  const remaining = daysUntil(move.profile.arrivalDate);
  const progress = getProgress(tasks);
  const [next, ...upcoming] = getNextTasks(tasks);
  return (
    <>
      <section aria-labelledby="arrival-heading">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground"><MapPin className="size-3.5" aria-hidden />Your move, in motion</p>
            <h1 id="arrival-heading" className="text-[2rem] leading-tight font-semibold tracking-[-0.045em] sm:text-4xl">{remaining > 0 ? `${move.profile.destinationCity} is getting closer.` : remaining === 0 ? `Hello, ${move.profile.destinationCity}.` : `Make yourself at home.`}</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{remaining > 0 ? "A new city. A clear plan. Let’s take it step by step." : "Your plan for the first days and the routines that follow."}</p>
          </div>
          <Button variant="outline" className="h-10 gap-2 px-3" onClick={onEdit}><Pencil className="size-3.5" aria-hidden />Edit arrival</Button>
        </div>
        <div className="overflow-hidden rounded-2xl border bg-card">
          <div className="grid sm:grid-cols-[1fr_150px]">
            <MoveSummary profile={move.profile} className="min-w-0 rounded-none border-0 bg-transparent sm:p-6" />
            <div className="flex items-center justify-between gap-3 border-t bg-muted/50 px-6 py-4 sm:flex-col sm:justify-center sm:gap-1 sm:border-t-0 sm:border-l">
              <CalendarDays className="hidden size-4 text-muted-foreground sm:block" aria-hidden />
              <span className="text-3xl font-medium tracking-tight sm:mt-2 sm:text-4xl">{Math.abs(remaining)}</span>
              <span className="text-xs text-muted-foreground">{remaining > 0 ? `day${remaining === 1 ? "" : "s"} until arrival` : remaining === 0 ? "arriving today" : `day${remaining === -1 ? "" : "s"} since arrival`}</span>
            </div>
          </div>
          <div className="border-t px-6 py-4">
            <div className="mb-2.5 flex items-center justify-between gap-3 text-xs"><span><strong className="font-semibold">{progress.completed} of {progress.total}</strong> tasks complete</span><span className="text-muted-foreground">{progress.percent}%</span></div>
            <Progress value={progress.percent} aria-label={`${progress.completed} of ${progress.total} tasks complete`} aria-valuenow={progress.percent} aria-valuemin={0} aria-valuemax={100} className="h-1.5 [&_[data-slot=progress-indicator]]:bg-foreground" />
            <p className="mt-2 text-[11px] text-muted-foreground">Your checklist progress, not a measure of legal readiness.</p>
          </div>
        </div>
      </section>
      <section aria-labelledby="next-heading">
        {next ? (
          <>
            <div className="relative overflow-hidden rounded-2xl bg-foreground p-6 text-background sm:p-7">
              <Route className="pointer-events-none absolute -top-5 -right-5 size-40 rotate-12 opacity-[0.06]" strokeWidth={1} aria-hidden />
              <p id="next-heading" className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em]"><span className="size-1.5 rounded-full bg-background" />Your next step</p>
              <h2 className="relative max-w-md text-2xl font-medium tracking-tight">{next.title}</h2>
              <p className="relative mt-2 max-w-md text-sm leading-relaxed text-background/75">{next.explanation}</p>
              <div className="relative mt-5 flex flex-wrap items-center justify-between gap-4">
                <span className="text-xs text-background/75">{taskTimingLabel(next)}</span>
                <Button size="lg" className="h-11 bg-background px-5 text-foreground hover:bg-background/90" onClick={() => onOpen(next)}>Open task<ArrowUpRight className="ml-1 size-4" aria-hidden /></Button>
              </div>
            </div>
            {upcoming.length > 0 && <div className="mt-3 grid gap-3 sm:grid-cols-2">{upcoming.map((task) => (
              <button key={task.id} onClick={() => onOpen(task)} className="group flex items-start justify-between gap-4 rounded-xl border bg-card p-4 text-left transition-colors hover:bg-muted/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                <span><span className="mb-2 block text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Also coming up</span><span className="block text-sm font-medium">{task.title}</span><span className="mt-2 block text-xs text-muted-foreground">{taskTimingLabel(task)}</span></span><ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground" aria-hidden />
              </button>
            ))}</div>}
          </>
        ) : (
          <div className="rounded-2xl border bg-card p-6"><Check className="mb-3 size-6 text-primary" aria-hidden /><h2 id="next-heading" className="text-xl font-semibold">{progress.completed === progress.total ? "Look how far you’ve come." : "Let’s clear the way."}</h2><p className="mt-2 text-sm text-muted-foreground">{progress.completed === progress.total ? "Every task in this plan is complete. Revisit your checklist whenever you need to." : "Your remaining tasks have prerequisites. Open a task below to see what it needs."}</p></div>
        )}
      </section>
    </>
  );
}
