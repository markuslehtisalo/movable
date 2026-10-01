import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, Home, Plane, CornerDownRight } from "lucide-react";
import { MoveSummary } from "@/components/movable/move-summary";
import { createDemoSnapshot, DEMO_PROFILE } from "@/lib/movable/fixtures";
import { formatDate, getNextTasks, shiftDate } from "@/lib/movable/selectors";
import styles from "./marketing.module.css";

const example = createDemoSnapshot();
const nextTask = getNextTasks(example.tasks, 1)[0];
const changedArrival = shiftDate(DEMO_PROFILE.arrivalDate, 14);

function RouteIllustration() {
  return (
    <div className={styles.routeIllustration} aria-hidden>
      <svg viewBox="0 0 540 210" fill="none" className={styles.routeArt}>
        <path d="M58 76C145 20 284 24 310 66C346 124 204 115 236 160C258 192 359 173 436 118" stroke="var(--primary)" strokeWidth="1.5" strokeDasharray="4 5" />
        <circle cx="58" cy="76" r="6" fill="var(--background)" stroke="var(--primary)" strokeWidth="1.5" />
        <circle cx="58" cy="76" r="2" fill="var(--primary)" />
        <circle cx="436" cy="118" r="8" fill="var(--accent)" stroke="var(--primary)" strokeWidth="1.5" />
        <circle cx="436" cy="118" r="3" fill="var(--primary)" />
        <g stroke="var(--foreground)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 56H92M29 56V37H84V56M25 37L56 27L88 37M51 28V19H62V28M56 19V11M39 40V53M49 40V53M62 40V53M73 40V53" />
          <path d="M385 99H491M389 99V64H394V58H400V51H406V58H412V64H417V99M423 99V59L438 46L453 59V99M460 99V67H465V60H469V55H478V60H483V67H488V99" />
          <path d="M398 72H407M398 79H407M402 99V88M431 65H444M431 73H444M434 99V85H443V99M469 75H479M469 82H479M473 99V91" />
          <path d="M374 106C382 101 390 111 398 106C406 101 414 111 422 106M453 108C461 103 469 113 477 108C485 103 493 113 501 108" opacity=".35" />
        </g>
      </svg>
      <span className={styles.originLabel}>HEL <span>Helsinki</span></span>
      <span className={styles.destinationLabel}>AMS <span>Amsterdam</span></span>
      <span className={styles.routeNote}>Same you. New coordinates.</span>
    </div>
  );
}

export function ExamplePreview() {
  return (
    <div className={styles.previewStage}>
      <RouteIllustration />
      <section className={styles.previewCard} aria-label="Example move preview">
        <div className={styles.previewToolbar}>
          <span className="flex items-center gap-2 text-xs font-medium"><span className="size-1.5 rounded-full bg-primary" aria-hidden /> Your move, at a glance</span>
          <span className={styles.exampleBadge}>Example move</span>
        </div>
        <MoveSummary profile={DEMO_PROFILE} className={styles.moveSummary} />
        <div className={styles.previewBody}>
          <div className={styles.phaseTrack} aria-label="Example plan phases"><span className={styles.activePhase}>Before you leave</span><span>First days</span><span>Settling in</span></div>
          {nextTask && (
            <div className={styles.nextTask}>
              <div className="flex items-center justify-between gap-3"><p className={styles.smallLabel}>A good next step</p><span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-card text-primary"><Home className="size-4" aria-hidden /></span></div>
              <h2 className="mt-1 max-w-64 text-xl font-medium leading-snug tracking-tight">{nextTask.title}</h2>
              <p className="mt-2 max-w-sm text-xs leading-5 text-muted-foreground">{nextTask.steps[0]}</p>
              <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"><Check className="size-3.5" aria-hidden /> Exchange details confirmed. Ready for this step.</p>
            </div>
          )}
          <div className={styles.planChange}>
            <p className={styles.smallLabel}>When plans change · Illustration</p>
            <p className="mt-3 text-sm leading-6">“I’m arriving two weeks later, and I’ve already found housing.”</p>
            <div className={styles.changeReceipt}>
              <CornerDownRight className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              <div className="min-w-0 flex-1 space-y-2.5">
                <div className={styles.receiptRow}><span className="flex items-center gap-2"><Plane className="size-3.5" aria-hidden /> Arrival</span><span>{formatDate(DEMO_PROFILE.arrivalDate).replace(/ \d{4}$/, "")} <ArrowRight className="size-3" aria-hidden /><span className="font-medium text-foreground">{formatDate(changedArrival)}</span></span></div>
                <div className={styles.receiptRow}><span className="flex items-center gap-2"><Home className="size-3.5" aria-hidden /> Housing</span><span className="font-medium text-foreground"><Check className="size-3.5" aria-hidden /> Done</span></div>
              </div>
            </div>
          </div>
        </div>
        <Link href="/demo" className={styles.previewLink}>Explore this example <ArrowUpRight className="size-4" aria-hidden /></Link>
      </section>
      <p className={styles.previewCaption}>An illustrative plan with scripted interactions.<br />Suggested steps, not verified requirements.</p>
    </div>
  );
}
