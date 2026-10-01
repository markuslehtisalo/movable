"use client";

import { useState } from "react";
import { Check, ChevronRight, FileCheck2, Info, LoaderCircle, LockKeyhole, MessageCircle, RotateCcw } from "lucide-react";
import { SourceLink } from "@/components/movable/source-link";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { PHASE_LABELS, type Source, type Task } from "@/lib/movable/contracts";
import { getBlockedBy, isBlocked } from "@/lib/movable/selectors";
import { taskTimingLabel } from "./task-plan";

export function TaskDrawer({ task, tasks, sources, pending, error, onClose, onOpen, onAsk, onStatus, onCloseAutoFocus }: {
  task: Task | null;
  tasks: Task[];
  sources: Source[];
  pending: boolean;
  error: string | null;
  onClose: () => void;
  onOpen: (task: Task) => void;
  onAsk: (task: Task) => void;
  onStatus: (task: Task) => void;
  onCloseAutoFocus: (event: Event) => void;
}) {
  return <Sheet open={!!task} onOpenChange={(open) => { if (!open) onClose(); }}>
    <SheetContent className="gap-0 data-[side=right]:h-dvh data-[side=right]:w-full data-[side=right]:sm:max-w-lg" onCloseAutoFocus={onCloseAutoFocus}>
      {task && <TaskDetails key={task.id} {...{ task, tasks, sources, pending, error, onOpen, onAsk, onStatus }} />}
    </SheetContent>
  </Sheet>;
}

function TaskDetails({ task, tasks, sources, pending, error, onOpen, onAsk, onStatus }: {
  task: Task; tasks: Task[]; sources: Source[]; pending: boolean; error: string | null;
  onOpen: (task: Task) => void; onAsk: (task: Task) => void; onStatus: (task: Task) => void;
}) {
  const [documents, setDocuments] = useState<string[]>([]);
  const blocked = task.status !== "done" && isBlocked(task, tasks);
  const blockers = getBlockedBy(task, tasks);
  const prerequisites = tasks.filter((item) => task.prerequisiteKeys.includes(item.key));
  const taskSources = sources.filter((source) => task.sourceIds.includes(source.id));
  const needsReview = !taskSources.length || taskSources.some((source) => source.reviewStatus !== "reviewed") || taskSources.length < task.sourceIds.length;
  return <>
    <SheetHeader className="shrink-0 border-b px-6 pt-7 pb-5 pr-12">
      <p className="mb-3 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">{PHASE_LABELS[task.phase]} · {task.category}</p>
      <SheetTitle className="text-2xl leading-tight font-semibold tracking-tight">{task.title}</SheetTitle>
      <SheetDescription className="mt-2 leading-relaxed">{task.explanation}</SheetDescription>
    </SheetHeader>
    <div className="min-h-0 flex-1 space-y-7 overflow-y-auto overscroll-contain px-6 py-6">
      <section aria-labelledby="task-timing" className="rounded-xl bg-muted p-4">
        <h3 id="task-timing" className="text-sm font-semibold">{taskTimingLabel(task)}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{task.timing.explanation}</p>
        {task.timing.kind === "official" && needsReview && <p className="mt-2 text-xs text-destructive">This date needs source verification before you rely on it.</p>}
      </section>
      {prerequisites.length > 0 && <section aria-labelledby="task-prerequisites">
        <h3 id="task-prerequisites" className="mb-3 text-sm font-semibold">Before this task</h3>
        <div className="space-y-2">{prerequisites.map((item) => <button key={item.id} onClick={() => onOpen(item)} className="flex w-full items-center gap-3 rounded-xl border p-3 text-left text-sm hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring">
          {item.status === "done" ? <Check className="size-4 shrink-0 text-primary" aria-hidden /> : <LockKeyhole className="size-4 shrink-0 text-muted-foreground" aria-hidden />}<span className="flex-1">{item.title}<span className="mt-0.5 block text-xs text-muted-foreground">{item.status === "done" ? "Complete" : "Complete this first"}</span></span><ChevronRight className="size-4 shrink-0" aria-hidden />
        </button>)}</div>
      </section>}
      {blocked && <p className="rounded-xl border p-3 text-sm leading-relaxed text-muted-foreground">{blockers.length ? "Complete the outstanding prerequisite above to unlock this task." : "A prerequisite is missing from this plan. This task cannot be completed yet."}</p>}
      <section aria-labelledby="task-steps">
        <h3 id="task-steps" className="mb-4 text-sm font-semibold">Make it happen</h3>
        {task.steps.length ? <ol className="space-y-4">{task.steps.map((step, index) => <li key={`${index}-${step}`} className="flex gap-3 text-sm leading-relaxed"><span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">{index + 1}</span><span>{step}</span></li>)}</ol> : <p className="text-sm text-muted-foreground">No detailed steps are available for this task yet.</p>}
      </section>
      <section aria-labelledby="task-documents">
        <h3 id="task-documents" className="mb-3 flex items-center gap-2 text-sm font-semibold"><FileCheck2 className="size-4" aria-hidden />Documents to have handy</h3>
        {task.requiredDocuments.length ? <><div className="space-y-3">{task.requiredDocuments.map((document, index) => <label key={document} className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed" htmlFor={`task-document-${index}`}><Checkbox id={`task-document-${index}`} checked={documents.includes(document)} className="mt-0.5 size-5" onCheckedChange={(checked) => setDocuments((current) => checked ? [...current, document] : current.filter((item) => item !== document))} /><span>{document}</span></label>)}</div><p className="mt-3 text-xs leading-relaxed text-muted-foreground">A temporary checklist for this view. Nothing is uploaded or saved.</p></> : <p className="text-sm text-muted-foreground">No documents listed. Check with the relevant organization before you act.</p>}
      </section>
      <section aria-labelledby="task-sources">
        <h3 id="task-sources" className="mb-3 text-sm font-semibold">Guidance & sources</h3>
        {needsReview && <div className="rounded-xl border border-primary/20 bg-accent/40 p-4"><p className="flex items-center gap-2 text-sm font-medium"><Info className="size-4 shrink-0" aria-hidden />Guidance needs verification</p><p className="mt-2 text-xs leading-relaxed text-muted-foreground">This is illustrative preparation guidance. Confirm current requirements and dates with the university or relevant official service.</p></div>}
        {taskSources.length > 0 && <div className="mt-3 space-y-3">{taskSources.map((source) => <div key={source.id}><SourceLink source={source} />{source.applicability && <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{source.applicability}</p>}</div>)}</div>}
      </section>
    </div>
    <div className="shrink-0 space-y-3 border-t bg-card px-6 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button className="h-11 w-full" disabled={pending || blocked} onClick={() => onStatus(task)}>{pending ? <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden /> : task.status === "done" ? <RotateCcw className="size-4" aria-hidden /> : <Check className="size-4" aria-hidden />}{pending ? "Updating…" : task.status === "done" ? "Reopen task" : blocked ? "Complete prerequisite first" : "Mark complete"}</Button>
      <Button variant="outline" className="h-11 w-full" onClick={() => onAsk(task)}><MessageCircle className="size-4" aria-hidden />Ask Movable about this</Button>
    </div>
  </>;
}
