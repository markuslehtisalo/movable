"use client";

import { Check, ChevronRight, Circle, LockKeyhole, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PHASE_LABELS, PHASE_ORDER, type Task } from "@/lib/movable/contracts";
import { formatDate, getBlockedBy, isBlocked } from "@/lib/movable/selectors";
import { cn } from "@/lib/utils";

export type TaskFilter = "all" | "todo" | "done";

export function taskTimingLabel(task: Task) {
  const label = task.timing.kind === "official" ? "Official date" : "Suggested";
  return task.timing.kind === "none" || !task.timing.date
    ? "No set date"
    : `${label} · ${formatDate(task.timing.date)}`;
}

export function TaskPlan({ tasks, filter, onFilter, onOpen, onStatus, pending }: {
  tasks: Task[];
  filter: TaskFilter;
  onFilter: (filter: TaskFilter) => void;
  onOpen: (task: Task) => void;
  onStatus: (task: Task) => void;
  pending: boolean;
}) {
  const visible = tasks.filter((task) => filter === "all" || task.status === filter);
  return (
    <section id="your-plan" aria-labelledby="plan-heading" className="scroll-mt-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">One step at a time</p>
          <h2 id="plan-heading" className="text-2xl font-semibold tracking-tight">Your relocation plan</h2>
        </div>
        <div className="inline-flex rounded-xl border bg-card p-1" role="group" aria-label="Filter tasks">
          {([{ key: "all", label: "All" }, { key: "todo", label: "To do" }, { key: "done", label: "Done" }] as const).map(({ key, label }) => (
            <Button key={key} variant="ghost" className={cn("h-10 px-4", filter === key && "bg-foreground text-background hover:bg-foreground hover:text-background")} aria-pressed={filter === key} onClick={() => onFilter(key)}>
              {label}<span className={cn("text-xs", filter === key ? "text-background/70" : "text-muted-foreground")}>{tasks.filter((task) => key === "all" || task.status === key).length}</span>
            </Button>
          ))}
        </div>
      </div>
      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-8 text-center">
          <Check className="mx-auto mb-3 size-6 text-primary" aria-hidden />
          <p className="font-medium">{filter === "done" ? "Your first small win is ahead." : "Everything on your list is complete."}</p>
          <p className="mt-2 text-sm text-muted-foreground">{filter === "done" ? "Completed tasks will appear here." : "You can revisit any task and reopen it if your plans change."}</p>
          <Button variant="outline" className="mt-4 h-11 px-4" onClick={() => onFilter("all")}>Show all tasks</Button>
        </div>
      ) : (
        <div className="space-y-7">
          {PHASE_ORDER.map((phase, index) => {
            const phaseTasks = tasks.filter((task) => task.phase === phase);
            const shown = visible.filter((task) => task.phase === phase);
            if (!shown.length) return null;
            return (
              <section key={phase} aria-labelledby={`phase-${phase}`}>
                <div className="mb-3 flex items-center gap-3">
                  <span className="flex size-7 items-center justify-center rounded-full border text-xs font-medium text-muted-foreground">0{index + 1}</span>
                  <h3 id={`phase-${phase}`} className="font-semibold">{PHASE_LABELS[phase]}</h3>
                  <span className="ml-auto text-xs text-muted-foreground">{phaseTasks.filter((task) => task.status === "done").length}/{phaseTasks.length} done</span>
                </div>
                <ul className="divide-y overflow-hidden rounded-2xl border bg-card">
                  {shown.map((task) => {
                    const done = task.status === "done";
                    const blocked = !done && isBlocked(task, tasks);
                    const blockers = getBlockedBy(task, tasks);
                    return (
                      <li key={task.id} className="flex items-center gap-1 pl-2 pr-3 sm:gap-2 sm:pl-3">
                        <Button variant="ghost" size="icon" className="size-11 rounded-full" disabled={pending || blocked} aria-label={`${done ? "Reopen" : "Complete"} ${task.title}`} title={blocked ? "Complete the prerequisite first" : done ? "Reopen task" : "Mark complete"} onClick={() => onStatus(task)}>
                          {done ? <span className="flex size-6 items-center justify-center rounded-full bg-foreground text-background"><Check className="size-3.5" aria-hidden /></span> : blocked ? <LockKeyhole className="size-4 text-muted-foreground" aria-hidden /> : <Circle className="size-6 text-border" aria-hidden />}
                        </Button>
                        <button onClick={() => onOpen(task)} className="group flex min-w-0 flex-1 items-center justify-between gap-3 rounded-lg py-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                          <span className="min-w-0">
                            <span className={cn("block text-sm font-medium leading-relaxed", done && "text-muted-foreground")}>{task.title}</span>
                            <span className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs leading-relaxed text-muted-foreground"><span className="capitalize">{task.category}</span><span aria-hidden>·</span><span>{done ? "Completed" : taskTimingLabel(task)}</span></span>
                            {blocked && <span className="mt-1.5 block text-xs leading-relaxed text-muted-foreground">After: {blockers.length ? blockers.map((item) => item.title).join(", ") : "a prerequisite that is not in this plan"}</span>}
                          </span>
                          <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none" aria-hidden />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}
      <p className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground"><RotateCcw className="mt-0.5 size-3.5 shrink-0" aria-hidden />Plans change. You can reopen completed tasks at any time.</p>
    </section>
  );
}
