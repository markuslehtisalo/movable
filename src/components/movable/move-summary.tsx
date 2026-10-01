import { ArrowRight, CalendarDays, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MoveProfile } from "@/lib/movable/contracts";
import { formatDate } from "@/lib/movable/selectors";
export function MoveSummary({ profile, className, compact = false }: { profile: MoveProfile; className?: string; compact?: boolean }) {
  return <div className={cn("rounded-2xl border bg-card p-6 text-card-foreground", className)}>
    <p className="mb-4 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Your next chapter</p>
    <div className="flex flex-wrap items-center gap-3 text-2xl font-semibold tracking-tight"><span>{profile.originCity}</span><ArrowRight className="size-5 text-primary" aria-hidden /><span>{profile.destinationCity}</span></div>
    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground"><span className="inline-flex items-center gap-2"><CalendarDays className="size-4" aria-hidden />{formatDate(profile.arrivalDate)}</span>{!compact && <span className="inline-flex items-center gap-2"><GraduationCap className="size-4" aria-hidden />{profile.university}</span>}</div>
  </div>;
}
