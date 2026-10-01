"use client";

import { useState } from "react";
import { CalendarDays, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { dateSchema, type ActionReceipt, type Move } from "@/lib/movable/contracts";
import { formatDate } from "@/lib/movable/selectors";

export function ArrivalDialog({ move, open, pending, error, onClose, onSave, onCloseAutoFocus }: {
  move: Move; open: boolean; pending: boolean; error: string | null;
  onClose: () => void;
  onSave: (date: string) => Promise<ActionReceipt[] | null>;
  onCloseAutoFocus: (event: Event) => void;
}) {
  return <Dialog open={open} onOpenChange={(value) => { if (!value && !pending) onClose(); }}>
    <DialogContent className="p-6 sm:max-w-md" onCloseAutoFocus={onCloseAutoFocus}>
      <DialogHeader><CalendarDays className="mb-2 size-6 text-primary" aria-hidden /><DialogTitle className="text-xl">A change of plans?</DialogTitle><DialogDescription className="leading-relaxed">Update your arrival date. Incomplete tasks with suggested, arrival-relative dates will move with it. Completed work and official dates stay as they are.</DialogDescription></DialogHeader>
      {open && <ArrivalForm key={move.id} {...{ move, pending, error, onSave }} />}
    </DialogContent>
  </Dialog>;
}

function ArrivalForm({ move, pending, error, onSave }: {
  move: Move; pending: boolean; error: string | null; onSave: (date: string) => Promise<ActionReceipt[] | null>;
}) {
  const [date, setDate] = useState(move.profile.arrivalDate);
  const [validation, setValidation] = useState<string | null>(null);
  const [saved, setSaved] = useState<ActionReceipt[] | null>(null);
  return <form className="space-y-4" onSubmit={async (event) => {
    event.preventDefault();
    if (!dateSchema.safeParse(date).success) { setValidation("Enter a valid arrival date."); return; }
    setValidation(null);
    const receipts = await onSave(date);
    if (receipts) setSaved(receipts);
  }}>
    <div className="space-y-2"><Label htmlFor="arrival-date">Arrival date</Label><Input id="arrival-date" type="date" required value={date} disabled={pending} onChange={(event) => { setDate(event.target.value); setSaved(null); }} className="h-11 min-w-0 text-base" aria-invalid={!!validation} aria-describedby={validation ? "arrival-validation" : undefined} /></div>
    {validation && <p id="arrival-validation" role="alert" className="text-sm text-destructive">{validation}</p>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {saved && <div role="status" className="rounded-xl bg-muted p-3 text-sm"><p className="font-medium">Arrival date updated.</p>{saved.map((receipt) => <p key={receipt.id} className="mt-1 text-xs text-muted-foreground">{receipt.label === "arrivalDate" ? `${formatDate(receipt.before)} → ${formatDate(receipt.after)}` : `${receipt.before} → ${receipt.after}`}</p>)}</div>}
    <Button type="submit" className="h-11 w-full" disabled={pending || date === move.profile.arrivalDate}>{pending && <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />}{pending ? "Updating plan…" : "Save arrival date"}</Button>
  </form>;
}
