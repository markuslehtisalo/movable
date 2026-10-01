"use client";
import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowUpRight, Check, CheckCheck, CornerDownRight, ListChecks, MapPin, Plus, Route } from "lucide-react";
import { Brand } from "@/components/movable/brand";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EXAMPLE_PROMPT } from "@/lib/movable/fixtures";
import { useMovable } from "@/lib/movable/client";
import { onboardingHref } from "@/lib/movable/draft";
import { ExamplePreview } from "./example-preview";
import styles from "./marketing.module.css";

const benefits = [
  { icon: ListChecks, title: "Know what comes next.", text: "See your next practical step, with the tasks that need to happen first." },
  { icon: MapPin, title: "Keep the details together.", text: "Your dates, destination, university, and preparation in one place." },
  { icon: Route, title: "Make room for change.", text: "Adjust your arrival date and suggested timing, without losing completed work." },
];

const steps = [
  { title: "Tell us where you’re headed.", text: "Start with your move in your own words. Where from, where to, and what’s taking you there." },
  { title: "Make the details yours.", text: "Review your move profile. Fill in the gaps and correct anything before creating your plan." },
  { title: "Take it one step at a time.", text: "Work through your preparation, mark tasks complete, and see what’s ready to do next." },
];

const faqs = [
  { question: "What can I try right now?", answer: "You can create a move profile, explore an illustrative preparation plan, and track tasks in this browser. The public example lets you try a Helsinki-to-Amsterdam exchange move without changing your own saved move." },
  { question: "Is Movable available for my move?", answer: "This prototype is built around a Finnish student moving to Amsterdam for a fixed-length exchange. You can enter other details, but country-specific guidance for other moves is not available yet." },
  { question: "Are the tasks and dates official requirements?", answer: "No. The current plan contains illustrative preparation tasks and suggested timing, not verified requirements or official deadlines. Check the relevant university and official authorities for your circumstances." },
  { question: "How does the assistant work?", answer: "The prototype uses scripted example interactions, not live AI. In the example, you can ask about a task or try the prepared arrival-date and housing update. It cannot book, apply, or send messages on your behalf." },
  { question: "Where is my move saved?", answer: "Your own move is saved locally in this browser. There is no account or cloud sync, so it will not follow you to another device and clearing browser data can remove it. The public example is separate and resets on a full reload." },
];

export function MarketingPage() {
  const { mode } = useMovable();
  const live = mode === "live";
  const liveAnswers = [
    "Sign in, describe your move, and get an AI-personalized preparation plan. Your tasks and conversations are saved to your account. The public example is a separate scripted preview.",
    faqs[1].answer,
    "Dates are suggested preparation targets, not official deadlines. Relevant tasks link to reviewed official guidance; check current requirements for your circumstances before acting.",
    "In your signed-in workspace, AI can explain tasks, update your arrival date, mark tasks complete and draft a university message. It cannot book, apply, or send messages. The public example remains scripted.",
    "Your signed-in move is saved to your account. The public example is separate, works without signing in and resets on reload. Your onboarding draft stays in this browser tab until you save a plan.",
  ];
  const [text, setText] = useState("");
  const [exampleFilled, setExampleFilled] = useState(false);
  const [pending, setPending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  function startMove(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    router.push(onboardingHref(text, live ? "pending" : "local"));
  }

  function fillExample() {
    setText(EXAMPLE_PROMPT);
    setExampleFilled(true);
    textareaRef.current?.focus();
  }

  return (
    <div className={styles.page}>
      <a href="#main-content" className={styles.skipLink}>Skip to content</a>
      <header className={`${styles.container} ${styles.header}`}>
        <Brand className="text-2xl" />
        <nav aria-label="Main navigation" className={styles.navigation}>
          <a href="#how-it-works" className={styles.textLink}>How it works</a>
          <Link href="/demo" className={styles.textLink}>Explore example <ArrowUpRight className="size-3.5" aria-hidden /></Link>
        </nav>
        <div className={styles.headerActions}>
          <Link href="/app" className={`${styles.textLink} ${styles.returnLink}`}>Open my move</Link>
          <Button asChild size="lg" className="h-11 gap-3 px-5"><a href="#move-composer">Start a move <ArrowUpRight aria-hidden /></a></Button>
        </div>
      </header>

      <main id="main-content" tabIndex={-1}>
        <section className={`${styles.container} ${styles.hero}`} aria-labelledby="hero-title">
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}><span className={styles.eyebrowMark} aria-hidden /> A little direction for a big move</p>
            <h1 id="hero-title" className={styles.heroTitle}>Your next<br /> chapter,<br /><span className="text-primary">with a plan.</span></h1>
            <p className={styles.heroDescription}>A place to turn your study move abroad into clear next steps, from the first plans to settling in.</p>
            <form id="move-composer" onSubmit={startMove} className={styles.composer} aria-labelledby="composer-label" tabIndex={-1}>
              <div className={styles.composerHeading}>
                <label htmlFor="move-prompt" id="composer-label" className="text-sm font-semibold">Where will your next chapter be?</label>
                <CornerDownRight className="size-4 text-primary" aria-hidden />
              </div>
              <Textarea ref={textareaRef} id="move-prompt" name="draft" value={text}
                onChange={(event) => { setText(event.target.value); setExampleFilled(false); }}
                placeholder={EXAMPLE_PROMPT} aria-describedby="composer-hint" className={styles.composerInput} />
              <div className={styles.composerActions}>
                <Button type="button" variant="ghost" className="h-11 gap-2 px-2 text-muted-foreground" onClick={fillExample}>
                  {exampleFilled ? <Check className="size-4" aria-hidden /> : <Plus className="size-4" aria-hidden />}
                  {exampleFilled ? "Example added" : "Use an example"}
                </Button>
                <Button type="submit" size="lg" disabled={pending} className="h-11 gap-3 px-5">
                  {pending ? "Opening your move…" : "Plan my move"}<ArrowRight aria-hidden />
                </Button>
              </div>
            </form>
            <p id="composer-hint" className={styles.composerHint}>{live ? "Sign in to save your move. You’ll review every detail before building your plan." : "Browser prototype. No account needed. You’ll review the details next."}</p>
            <span className="sr-only" role="status">{exampleFilled ? "Example added. You can edit it before continuing." : ""}</span>
          </div>
          <ExamplePreview />
        </section>

        <section className={`${styles.container} ${styles.benefits}`} aria-label="A clearer way to move">
          {benefits.map(({ icon: Icon, title, text }) => (
            <div key={title} className={styles.benefit}>
              <Icon className="mb-5 size-5 text-primary" strokeWidth={1.6} aria-hidden />
              <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
              <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{text}</p>
            </div>
          ))}
        </section>

        <section id="how-it-works" className={`${styles.container} ${styles.howSection}`} aria-labelledby="how-title" tabIndex={-1}>
          <div className={styles.sectionHeading}>
            <div><p className={styles.eyebrow}>From “where do I start?” to “what’s next?”</p><h2 id="how-title" className={styles.sectionTitle}>Big chapter.<br />Small, doable steps.</h2></div>
            <p className="max-w-xs text-base leading-7 text-muted-foreground">You don’t need every answer to get started. Just a destination and a little direction.</p>
          </div>
          <ol className={styles.steps}>
            {steps.map((step, index) => (
              <li key={step.title} className={styles.step}>
                <div className={styles.stepNumber}><span>0{index + 1}</span>{index === 2 ? <CheckCheck className="size-5" aria-hidden /> : <ArrowRight className="size-5" aria-hidden />}</div>
                <h3 className="mt-7 text-xl font-medium tracking-tight">{step.title}</h3>
                <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">{step.text}</p>
              </li>
            ))}
          </ol>
          <Link href="/demo" className={`${styles.textLink} mt-10 w-fit font-medium`}>Take a look around the example <ArrowUpRight className="size-4" aria-hidden /></Link>
        </section>

        <section className={styles.faqBand} aria-labelledby="faq-title">
          <div className={`${styles.container} ${styles.faqLayout}`}>
            <div><p className={styles.eyebrow}>Before you pack</p><h2 id="faq-title" className={styles.sectionTitle}>A few things<br />to know.</h2><p className="mt-5 max-w-xs text-sm leading-6 text-muted-foreground">An early look at a calmer way to prepare for a move. Here’s what you can expect.</p></div>
            <div className={styles.faqList}>
              {faqs.map((faq, index) => (
                <details key={faq.question} className={styles.faqItem}>
                  <summary>{faq.question}<Plus className="size-4 shrink-0 text-muted-foreground" aria-hidden /></summary>
                  <p>{live ? liveAnswers[index] : faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className={`${styles.container} ${styles.closingSection}`} aria-labelledby="closing-title">
          <div className={styles.closingCard}>
            <div className={styles.closingRoute} aria-hidden><span /><div /><ArrowUpRight /></div>
            <p className={`${styles.eyebrow} !text-background/70`}>There’s a whole chapter ahead</p>
            <h2 id="closing-title" className={styles.closingTitle}>New city.<br />A clearer starting point.</h2>
            <p className="mt-5 max-w-md text-base leading-7 text-background/75">Start with where you’re going. Find your next step from there.</p>
            <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-3">
              <Button asChild size="lg" className="h-12 gap-4 px-6"><a href="#move-composer">Plan my move <ArrowUpRight aria-hidden /></a></Button>
              <Link href="/demo" className={`${styles.textLink} !text-background`}>Explore example <ArrowRight className="size-4" aria-hidden /></Link>
            </div>
          </div>
        </section>
      </main>

      <footer className={`${styles.container} ${styles.footer}`}>
        <div><Brand /><p className="mt-3 text-xs text-muted-foreground">A little direction. A new beginning.</p></div>
        <div className="flex flex-wrap items-center gap-x-7 gap-y-3">
          <Link href="/app" className={styles.textLink}>Open my move <ArrowUpRight className="size-3.5" aria-hidden /></Link>
          <a href="#how-it-works" className={styles.textLink}>How it works <ArrowUpRight className="size-3.5" aria-hidden /></a>
        </div>
        <p className="text-xs text-muted-foreground">Movable · An early prototype</p>
      </footer>
    </div>
  );
}
