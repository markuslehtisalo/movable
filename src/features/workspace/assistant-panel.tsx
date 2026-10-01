"use client";

import { useEffect, useId, useRef } from "react";
import { ArrowDown, ArrowRight, ArrowUp, ArrowUpRight, Check, LoaderCircle, MessageCircle, Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ActionReceipt, Message, Task } from "@/lib/movable/contracts";
import { dateSchema } from "@/lib/movable/contracts";
import { useMovable } from "@/lib/movable/client";
import { formatDate } from "@/lib/movable/selectors";

function receiptValue(value: string) {
  if (dateSchema.safeParse(value).success) return formatDate(value);
  return value === "todo" ? "To do" : value === "done" ? "Done" : value;
}

export function ReceiptList({ receipts, tasks, onOpen, onEdit }: {
  receipts: ActionReceipt[]; tasks: Task[]; onOpen: (task: Task) => void; onEdit: () => void;
}) {
  return <ul className="mt-3 space-y-2" aria-label="Saved changes">{receipts.map((receipt) => {
    const task = tasks.find((item) => item.id === receipt.targetId);
    const label = receipt.label === "arrivalDate" ? "Arrival date" : receipt.label;
    return <li key={receipt.id} className="rounded-xl border bg-background/70 p-3">
      <div className="flex items-start gap-2"><Check className="mt-1 size-3.5 shrink-0 text-primary" aria-hidden />{task || receipt.type === "profile_updated" ? <button className="min-w-0 text-left text-xs font-medium underline decoration-border underline-offset-4 hover:decoration-foreground focus-visible:outline-2 focus-visible:outline-ring" onClick={() => task ? onOpen(task) : onEdit()}>{label}<ArrowUpRight className="ml-1 inline size-3" aria-hidden /></button> : <span className="text-xs font-medium">{label}</span>}</div>
      <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs"><span className="text-muted-foreground">{receiptValue(receipt.before)}</span><ArrowRight className="size-3 text-muted-foreground" aria-label="changed to" /><span className="font-medium">{receiptValue(receipt.after)}</span></p>
    </li>;
  })}</ul>;
}

export function AssistantPanel({ messages, tasks, contextTask, text, pending, error, focusVersion, onText, onSend, onRemoveContext, onOpen, onEdit }: {
  messages: Message[]; tasks: Task[]; contextTask: Task | null; text: string;
  pending: boolean; error: string | null; focusVersion: number;
  onText: (text: string) => void; onSend: () => void; onRemoveContext: () => void;
  onOpen: (task: Task) => void; onEdit: () => void;
}) {
  const { mode } = useMovable();
  const id = useId();
  const scroll = useRef<HTMLDivElement>(null);
  const composer = useRef<HTMLTextAreaElement>(null);
  const shouldFollow = useRef(true);
  useEffect(() => {
    if (shouldFollow.current && scroll.current) scroll.current.scrollTop = scroll.current.scrollHeight;
  }, [messages.length, pending]);
  useEffect(() => { if (focusVersion > 0) composer.current?.focus(); }, [focusVersion]);
  const prompts = contextTask
    ? ["What should I know about this task?", "What should I do next?"]
    : ["What should I do next?", "I'm arriving two weeks later, and I've found housing."];

  return <div className="flex h-full min-h-0 flex-col">
    <div className="shrink-0 border-b px-5 py-5 pr-12 xl:pr-5">
      <div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-xl bg-foreground text-background"><MessageCircle className="size-4" aria-hidden /></span><div><h2 className="text-sm font-semibold">A little help, along the way</h2><p className="mt-0.5 text-xs text-muted-foreground">{mode === "live" ? "Movable · AI assistant" : "Movable · scripted preview"}</p></div></div>
    </div>
    <div ref={scroll} onScroll={() => { if (scroll.current) shouldFollow.current = scroll.current.scrollHeight - scroll.current.scrollTop - scroll.current.clientHeight < 80; }} className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 py-5" role="log" aria-label="Conversation with Movable" aria-live="polite" aria-relevant="additions">
      {messages.length === 0 && <div className="py-4"><p className="text-sm font-medium">Your plan can change with you.</p><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{mode === "live" ? "Ask what comes next, explore a task, update your arrival, or draft a message to your university." : "Ask what comes next, explore a task, or try an arrival and housing update. This preview uses scripted responses."}</p></div>}
      {messages.map((message) => {
        const selected = tasks.find((task) => task.id === message.selectedTaskId);
        return <article key={message.id} className={message.role === "user" ? "ml-4 rounded-2xl rounded-br-sm bg-muted p-3.5" : "min-w-0"}>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{message.role === "user" ? "You" : "Movable"}</p>
          {selected && <button onClick={() => onOpen(selected)} className="mb-2 flex max-w-full items-start gap-1.5 text-left text-xs text-muted-foreground underline underline-offset-2"><Paperclip className="mt-0.5 size-3 shrink-0" aria-hidden /><span>{selected.title}</span></button>}
          <p className="text-sm leading-6 whitespace-pre-wrap [overflow-wrap:anywhere]">{message.text}</p>
          {message.receipts.length > 0 && <ReceiptList receipts={message.receipts} tasks={tasks} onOpen={onOpen} onEdit={onEdit} />}
          {message.draft && <div className="mt-3 rounded-xl border p-3"><p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Message draft · not sent</p><p className="mt-2 text-sm font-semibold [overflow-wrap:anywhere]">{message.draft.subject}</p><p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere]">{message.draft.body}</p></div>}
        </article>;
      })}
      {pending && <p role="status" className="flex items-center gap-2 text-xs text-muted-foreground"><LoaderCircle className="size-3.5 animate-spin motion-reduce:animate-none" aria-hidden />Working on your request…</p>}
    </div>
    <div className="shrink-0 border-t bg-card px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="mb-3 flex items-center justify-between gap-2"><p className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Try a conversation</p>{messages.length > 2 && <button className="flex items-center gap-1 rounded p-1 text-xs text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring" onClick={() => { if (scroll.current) scroll.current.scrollTop = scroll.current.scrollHeight; shouldFollow.current = true; }}>Latest<ArrowDown className="size-3" aria-hidden /></button>}</div>
      <div className="mb-3 flex flex-wrap gap-2">{prompts.map((prompt) => <button key={prompt} disabled={pending} className="rounded-lg border px-2.5 py-2 text-left text-xs leading-relaxed text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50" onClick={() => { onText(prompt); composer.current?.focus(); }}>{prompt === "I'm arriving two weeks later, and I've found housing." ? "My arrival & housing changed" : prompt}</button>)}</div>
      {contextTask && <div className="mb-2 flex items-center gap-2 rounded-lg bg-accent/60 py-1 pl-2.5 pr-1 text-xs"><Paperclip className="size-3.5 shrink-0" aria-hidden /><span className="min-w-0 flex-1 leading-relaxed">{contextTask.title}</span><Button variant="ghost" size="icon" className="size-8 shrink-0" aria-label="Remove task context" disabled={pending} onClick={onRemoveContext}><X className="size-3.5" aria-hidden /></Button></div>}
      <form onSubmit={(event) => { event.preventDefault(); shouldFollow.current = true; onSend(); }}>
        <label htmlFor={id} className="sr-only">Message Movable</label>
        <div className="rounded-xl border bg-background focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20">
          <Textarea ref={composer} id={id} value={text} onChange={(event) => onText(event.target.value)} disabled={pending} maxLength={4000} rows={2} placeholder={contextTask ? "Ask about this task…" : "What’s on your mind?"} className="max-h-40 min-h-20 resize-none overflow-y-auto border-0 bg-transparent px-3 pt-3 text-base shadow-none ring-0! md:text-sm" onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); if (text.trim() && !pending) { shouldFollow.current = true; onSend(); } } }} />
          <div className="flex items-center justify-between px-2 pb-2"><span className="pl-1 text-[10px] text-muted-foreground">{text.length > 3600 ? `${text.length}/4,000` : "Enter to send · Shift + Enter for a new line"}</span><Button type="submit" size="icon" className="size-9 rounded-lg" disabled={pending || !text.trim()} aria-label="Send message">{pending ? <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden /> : <ArrowUp className="size-4" aria-hidden />}</Button></div>
        </div>
        {error && <p role="alert" className="mt-2 text-xs leading-relaxed text-destructive">{error} Your message is still here to retry.</p>}
      </form>
      <p className="mt-2 text-center text-[10px] leading-relaxed text-muted-foreground">{mode === "live" ? "AI can make mistakes. Check official guidance before you act." : "Scripted interactions. Verify guidance before you act."}</p>
    </div>
  </div>;
}
