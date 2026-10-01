# Movable build plan

> **Current execution split:** marketing, onboarding, and app agents. See [parallel-build.md](parallel-build.md), [AGENTS.md](../AGENTS.md), and the actual shared contracts for the current ownership and API. The earlier AI-agent workstream below is superseded for this UI pass; the coordinator owns live backend integration after review.

## Outcome and product promise

Ship a polished marketing site and authenticated relocation app in two hours with three human teammates and parallel coding agents.

**Movable turns “I'm moving abroad” into “I know what to do next.”** A student describes their move, receives a sourced plan, makes progress, and changes that plan through conversation. The app remembers the move and helps across preparation, arrival, and settling in.

Optimize the demo around three memorable moments:

1. **My move, understood:** a sentence becomes an editable profile and a personal arrival dashboard.
2. **My next step, clear:** the app explains the next useful action, its timing, its prerequisites, and how to complete it.
3. **My plan, adapting:** “I'm arriving two weeks later, and I've found housing” changes the saved plan and produces a visible summary of what changed.

The complete journey is **discover → describe → sign in → confirm → plan → act → adapt → return**. Build and verify that journey before adding secondary features.

## Scope and priorities

### Supported prototype scenario

- Proposed route: a Finnish citizen moving from Helsinki to Amsterdam for a six-month university exchange in January 2027.
- Lock one host university during kickoff so university guidance is specific and reviewable.
- Prepare approximately 12–15 tasks across housing, university preparation, relevant registration, health coverage, everyday setup, and settling in. Include official requirements only when supported by reviewed sources for this profile.
- Cover the whole timeline in the plan; demonstrate a few real actions rather than implying the app submits applications or completes the relocation itself.
- Store study type and intended duration for later degree-study and longer-stay support.
- Clearly explain unsupported routes and offer the supported example. Never generate an apparently verified plan for an unsupported profile.

These are planning defaults to finalize in the first ten minutes.

### Feature priorities

| Priority | Feature | User value | Scope boundary |
| --- | --- | --- | --- |
| P0 | Distinctive landing page with a move composer | Understand the product and start immediately | One page; every CTA works |
| P0 | Natural-language intake with editable confirmation | Avoid filling a long form | One profile; missing fields asked together |
| P0 | Personal arrival dashboard and next actions | Know what matters now | Derived from the saved plan |
| P0 | Phased plan with dependencies and task drawers | Follow the move from preparation to settling in | One task model and one drawer |
| P0 | Contextual assistant with real saved actions | Change the plan naturally | Profile updates and task completion/reopening |
| P0 | Sources and timing explanations | Understand why an action appears | Reviewed source pack; honest unknowns |
| P0 | Authentication, persistence, and responsive UI | Return to a reliable personal workspace | One active move per account |
| P0 | Interactive, explicitly labeled sample | Explore before signup and recover the presentation | Same UI; isolated sample state |
| P1 | University message draft with copy action | Leave with something immediately useful | Draft only; no sending integration |
| P1 | Subtle motion and richer landing preview | Make the experience feel considered | No new infrastructure |
| P2 | Uploads, bookings, notifications, broad country coverage | Future expansion | Outside this sprint |

P0 defines completion. P1 begins only after the core flow works on the deployed URL.

## Product experience

### Marketing site — `/`

The landing page should feel like the beginning of a move, with a product people can immediately understand.

1. **Compact navigation:** wordmark, How it works, Explore example, Sign in. Existing users can open their move.
2. **Hero:** “Your next chapter, with a plan.” Supporting copy: “Tell Movable where you're headed. Get a personal plan for the paperwork, preparation, and first days.”
3. **Move composer:** a prominent text field with a realistic sample prompt, an example-fill chip, and **Plan my move**. Preserve the actual entered text when navigating to onboarding. Accept manual text without waiting for the backend.
4. **Product preview:** a Helsinki → Amsterdam journey card, phase indicator, next action, and a short example of a plan update. Label the preview as an example. Reuse the shared move-summary component; keep the preview compact enough to understand at a glance.
5. **Three benefits:** know what comes next; understand what applies to you; keep your plan current. Show concrete task/source/change examples alongside the copy.
6. **Three-step explanation:** tell us about your move, get your personal plan, work through it with Movable.
7. **Short FAQ and final CTA:** explain current coverage, sources, saved progress, and what the agent can actually do.

Primary CTA: **Plan my move**. Secondary CTA: **Explore an example** → `/demo`.

Use real product content instead of fabricated testimonials, user counts, or endorsement logos. The layout, wordmark, metadata, and favicon should feel like Movable throughout.

### Onboarding — `/onboarding`

- Carry the marketing composer text into the onboarding draft; also support direct entry.
- Save the draft in session storage before sign-in and restore it afterward. Clear it after successful profile creation or explicit cancellation.
- Require sign-in before AI extraction and personal plan generation. The public example provides a useful preview without consuming an authenticated workflow.
- Extract a profile into a compact, editable “Your move” card. Highlight unknown fields without silently guessing.
- Required planning fields: citizenship, origin country/city, destination country/city, university, study type, arrival date, and intended duration.
- Keep citizenship separate from residence, and keep study type separate from intended length of stay.
- Ask for missing fields together. Avoid a long sequence of one-question chat turns.
- Provide a manual-entry fallback if extraction fails, retaining the user's original text.
- Show the supported route clearly before generation.
- Primary action: **Build my plan**. Show actual operation states such as “Preparing your plan,” followed by the complete validated result.
- If generation fails, keep the saved profile and offer Retry. Retrying must not duplicate tasks.

### Personal workspace — `/app`

**Arrival dashboard**

- A personal heading, origin → destination, host university, arrival date, and a useful countdown. Switch to arrival/settling-in language when the date has passed.
- A compact progress indicator such as “4 of 13 tasks complete.” Do not present checklist completion as legal readiness.
- One prominent **Your next step** card with an action, a reason it matters now, and an **Open task** button.
- Two smaller upcoming actions. Keep urgency meaningful; distinguish overdue official deadlines from overdue suggested preparation dates.

**Relocation plan**

- Three phases: **Before you leave**, **First days**, **Settling in**.
- Compact task rows: title, category, timing, status, and completion control.
- Simple filters: All, To do, Done. Group by phase; avoid separate housing, document, and settings apps.
- Derive next actions from incomplete tasks whose prerequisites are met, ordered by timing and stable priority. Use deterministic application logic for ranking.
- Explain dependencies in plain language, for example “Do this after you have an address.” Completing or reopening a prerequisite updates the affected suggestions.
- Preserve completed work across profile changes.

**Task drawer**

- What to do, why it applies, suggested/official timing, prerequisites, required documents, and short actionable steps.
- A primary action to open the relevant official service or mark the task complete.
- Source title, organization, link, and actual review date. General preparation tips may have no official source; never disguise them as official requirements.
- **Ask Movable about this** opens the assistant with this task attached as visible context.
- A compact document checklist uses the task's existing required-document data. File storage is outside scope.

**Assistant**

- A persistent desktop side panel; a full-height accessible sheet on narrow screens.
- Suggested prompts tied to the current move: “What should I do next?”, “My arrival date changed,” and “I've found housing.”
- Show selected-task context as a removable chip so the user knows what “this” refers to.
- Read current saved profile/tasks for each turn. Use source-backed task context when explaining requirements.
- Write real state changes through validated server functions.
- After a successful change, render a compact receipt: changed arrival date, completed task, and affected suggested dates. Link task names back to their drawers.
- Acknowledge ambiguity before changing the wrong task. Report partial success accurately if only some requested changes succeed.
- Allow task reopening through the regular task control. Full conversational undo is deferred.

**Useful artifact — P1**

Generate a university-office message from the profile and selected task. Show subject, body, and Copy. Keep unknown facts as editable placeholders. Make clear that copying does not send the message.

### Public example — `/demo`

Use the same workspace components with a deterministic sample adapter and visible **Example move** label. Task changes stay local to the example. Provide **Reset example** and **Plan my move**.

If showing scripted conversational changes, label them as example interactions. Never silently substitute sample results for a failed live AI call. Do not persist sample data to another person's account.

## Visual and interaction direction

- Warm ivory canvas, dark ink text, coral emphasis, white surfaces, and subtle borders. Verify contrast for actual color choices.
- Use the existing Geist font setup; establish a strong editorial type scale and one spacing/radius system.
- Make the route card the recurring visual motif across the landing page, onboarding, and app.
- Use restrained route-line artwork, typography, and real UI previews rather than spending the sprint sourcing large decorative assets.
- Wide desktop: compact navigation, central plan, assistant on the right. Narrow desktop/tablet: collapse the assistant. Mobile: prioritize next action and tasks, with drawers for details and conversation.
- Keep hierarchy clear at approximately 390 px, 768 px, and 1440 px widths. No horizontal overflow or composer hidden behind the mobile keyboard.
- Visible focus, keyboard-operable drawers, readable labels, and sensible reduced-motion behavior.
- Design loading, empty, error, disabled, and saved states alongside the normal state.
- Use brief transitions for drawers, task completion, and change receipts. Never fake research progress or imply unsaved changes succeeded.

## Architecture and behavior

### Stack

| Layer | Choice |
| --- | --- |
| App | Existing Next.js App Router, React, TypeScript |
| UI | Tailwind CSS, shadcn/ui, Lucide, existing Geist fonts |
| Identity | Clerk supplied sign-in UI and Convex integration |
| State and backend | Convex queries, mutations, actions |
| AI | OpenAI Responses API through the official SDK |
| Contracts | Zod schemas and Convex server validators |
| Hosting | Vercel frontend and Convex backend |

Use Convex actions for OpenAI requests and mutations for database writes. Keep API secrets in the backend environment. Protect routes and enforce identity and ownership in backend queries, mutations, and actions.

Use one configured model supporting Structured Outputs and function calling. Verify access during bootstrap. Keep the product runtime to a small bounded tool loop; parallel coding agents do not require a multi-agent product architecture.

### Data contracts to freeze before parallel implementation

The coordinator creates these schemas, exports, and fixtures in `src/lib/movable/` before agents build against them. This document specifies the contract; the TypeScript files become its executable source of truth at kickoff.

| Contract | Required shape and semantics |
| --- | --- |
| `MoveProfile` | Citizenship; origin/destination country codes and city names; university; study type; arrival date as `YYYY-MM-DD`; fixed/open-ended stay; optional end date or duration. Drafts allow unknowns; generation input is validated. |
| `Move` | ID, profile, generation status, timestamps. Backend ownership comes from authenticated identity, never model output. |
| `Task` | ID, stable template key, move ID, title, phase, category, status (`todo` or `done`), stable priority, explanation, steps, required documents, prerequisite keys, timing, source IDs. Blocked state is derived. |
| `TaskTiming` | Kind (`official`, `suggested`, `none`), optional date, optional arrival-relative offset, explanation. Official dates require reviewed evidence; only suggested relative dates shift automatically. |
| `Source` | Stable ID, organization, title, URL, excerpt, applicability, review status, optional actual review date. Unreviewed content is not displayed as verified. |
| `Message` | ID, move ID, role, text, timestamp, optional selected task ID, optional persisted action receipts or draft. |
| `ActionReceipt` | Action type, affected IDs, before/after values, success/error result. Derived from actual mutation results. |
| `MoveSnapshot` | Mode (`live` or `demo`), phase (`loading`, `empty`, `generating`, `ready`, `error`), move, tasks, messages, sources, recoverable error. |

Keep three persisted tables: `moves`, `tasks`, `messages`. Store reviewed source records and route templates in the repository. Support one active move per account; validate task/message access through its parent move.

Stable template keys preserve task identity when personalizing or replanning. Save a generated plan atomically after validation. Use request IDs for generation/message retries so repeated requests do not duplicate tasks, messages, or actions.

### UI adapter boundary

Export `MovableProvider` and `useMovable()` from `src/lib/movable/client.tsx`. The hook exposes the snapshot plus these commands, with typed results and errors:

```ts
extractProfile(text): Promise<ProfileDraft>
createMove(profile, requestId): Promise<{ moveId: string }>
generatePlan(moveId, requestId): Promise<void>
updateProfile(moveId, patch, requestId): Promise<ActionReceipt[]>
setTaskStatus(taskId, status, requestId): Promise<ActionReceipt>
sendMessage(moveId, text, selectedTaskId, requestId): Promise<void>
resetDemo(): void
```

The coordinator freezes exact types during bootstrap. React views import this interface and shared DTOs, not Convex-generated IDs or SDK calls. The coordinator implements demo and live adapters behind it. AI extraction requires authentication in live mode.

Explicitly select demo mode only on `/demo` and compact marketing previews. A missing backend configuration must produce a setup/error state in live mode, never an unlabeled fallback.

### AI/backend boundary

The AI agent owns the public actions `agent.extractProfile`, `agent.generatePlan`, and `agent.sendMessage` in `convex/agent.ts`. The coordinator owns the schema, public CRUD, and these internal persistence functions in `convex/agentStore.ts`:

- `getContext`: load the authorized move, current tasks, and recent messages.
- `saveGeneratedPlan`: validate the complete task set and persist it without duplicates.
- `applyChanges`: validate scoped profile/task changes, apply them, and return actual receipts.
- `appendMessages`: persist user/assistant messages and receipts without retry duplicates.
- `setGenerationStatus`: record pending, ready, and failed generation states.

Freeze the argument/result schemas alongside the UI contracts. The AI agent authenticates each public action and passes server-derived identity to internal functions; clients and the model cannot choose the owner. The coordinator owns deterministic date/dependency logic so manual and conversational changes behave consistently.

Use Structured Outputs for extraction/plan content and function calling for `updateMove` and `setTaskStatus`. Bound tool rounds and return a recoverable error for a stalled run. Save and display successful actions even when a later model response fails.

### Evidence pack

The AI agent researches and owns the supported route's evidence under `src/lib/knowledge/`:

- A small set of relevant official government, municipality, and host-university pages.
- Reviewed excerpts, applicability notes, source IDs, URLs, and actual review dates.
- A route task template with stable keys, relevant dependencies, and clearly classified timing.
- Explicit unknowns where the available evidence does not support a requirement.

The model selects from known source IDs. Resolve links in code and reject unknown source IDs. Do not invent requirements, deadlines, documents, or research activity. Fixtures begin as illustrative content until the evidence pack has been reviewed.

## Parallel agent execution

### Operating model

Run **one coordinator plus three implementation agents**. Three human teammates supervise the work: one directs brand/marketing, one directs the app experience, and one directs integration/backend/AI. This plan prepares that launch; creating or revising the plan does not itself launch implementation.

The coordinator performs a short serial bootstrap, then all four work concurrently. Each agent has exclusive write ownership. Shared files remain coordinator-owned to prevent collisions.

### Bootstrap — coordinator, first 10–15 minutes

1. Confirm the current repository, service access, demo route, host university, and scope.
2. Install the agreed dependencies and initial shadcn primitives once. Own all package and lockfile changes.
3. Establish theme tokens in `globals.css`, metadata, providers, and component primitives. Freeze the theme before handing off; brand feedback returns to the coordinator.
4. Create shared schemas, selector/date helpers, named exports, and a realistic fixture. Make both data and action-result shapes available.
5. Create route/provider stubs and the demo adapter. Stub live integration explicitly as loading/unconfigured until connected.
6. Agree on the Convex action/internal-function signatures. Run initial code generation; do not hand-edit generated files.
7. Tell each agent which files it may edit, which interfaces are available, and the next integration deadline.

Do not make agents wait for backend credentials or a working model to start UI work. Fixture development must remain explicitly separate from live execution.

### Workstreams and exclusive ownership

| Stream | Exclusive write ownership | Deliverable | Dependencies |
| --- | --- | --- | --- |
| Coordinator — integration and platform | `package.json`, lockfile, config files, `src/app/layout.tsx`, `src/app/globals.css`, `src/app/providers.tsx`, `src/proxy.ts`, sign-in/sign-up routes, `src/components/ui/**`, `src/components/movable/**`, `src/lib/movable/**`, `.env.example`, Convex files except `convex/agent.ts` and `convex/ai/**`, `docs/plan.md` | Frozen contracts, shared primitives, auth, schema, ownership checks, adapters, deterministic state changes, deployment | Service access; AI action contracts |
| Agent 1 — marketing | `src/app/page.tsx`, `src/features/marketing/**`, `public/brand/**`, `src/app/icon.svg` | Finished responsive landing page, composer handoff, compact product preview, brand asset | Theme, shared move-summary primitive, fixture |
| Agent 2 — product app | `src/app/onboarding/**`, `src/app/app/**`, `src/app/demo/**`, `src/features/onboarding/**`, `src/features/workspace/**` | Onboarding, dashboard, plan, task drawer, assistant panel, example UI | Shared DTOs, `useMovable()`, primitives; no direct backend dependency |
| Agent 3 — AI and evidence | `convex/agent.ts`, `convex/ai/**`, `src/lib/knowledge/**` | Reviewed source pack, task templates, extraction/generation/chat actions, tool handling | Shared schemas, internal persistence signatures, server-side model access |

The coordinator seeds `src/components/movable/move-summary.tsx` as the shared route card and owns subsequent changes. Marketing and app agents consume it; neither imports the other's feature directory. The workspace agent alone owns the full `/demo` page.

Generated Convex files are tool-owned. Agents request a coordinator regeneration if needed. Only the coordinator changes dependencies, configuration, auth wiring, shared primitives, or contracts.

### Launch briefs

Give every agent the full plan plus its brief:

- **Marketing agent:** Build the complete `/` experience within your owned paths. Make the move composer hand off entered text to onboarding and every CTA work. Use frozen tokens and shared primitives. Deliver a desktop/mobile reviewable page before adding motion. Do not change providers, packages, or app feature files.
- **Workspace agent:** Build onboarding, `/app`, and `/demo` entirely against `useMovable()` and shared contracts. Deliver the fixture-backed end-to-end UI first, including loading/error states, task context, and action receipts. Live data should require no view rewrite. Keep sample behavior visibly labeled.
- **AI/evidence agent:** Review the supported route's sources, construct the task template, and implement the three agreed actions against internal persistence contracts. Verify source IDs and tool arguments, preserve existing work, and return real receipts. Surface missing credentials or evidence immediately; do not replace live calls with sample responses.

### Collaboration rules

- At launch, each agent confirms its ownership and dependencies. Do not edit outside the assigned paths without a coordinator handoff.
- In a shared checkout, changes are already visible: do not switch branches, reset files, stage unrelated changes, or perform independent merges. If isolated worktrees are deliberately used, the coordinator alone integrates their commits.
- Ask the coordinator for new dependencies, components, tokens, or contract changes. One owner performs the change and announces it to all consumers.
- Prefer additive contract changes. Do not rename exports or enums after the first checkpoint without updating all consumers together.
- Publish small runnable increments. Report completed paths, commands run, interface changes, blockers, and remaining work at each checkpoint.
- Each agent runs focused checks for its changes. The coordinator owns whole-repository validation and the deployed smoke test.
- No additional sub-agents during this sprint unless the coordinator explicitly reassigns a stream; keep the active build to four concurrent agents.
- Stop optional work when an integration blocker appears. Never leave a failing build for the final ten minutes.

## Two-hour execution and integration gates

| Time | Coordinator | Marketing agent | Workspace agent | AI/evidence agent | Gate |
| --- | --- | --- | --- | --- | --- |
| 0–15 min | Bootstrap contracts, primitives, dependencies, providers; launch streams | Start at handoff | Start at handoff | Start at handoff | Ownership and interfaces frozen; starter builds |
| 15–35 min | Auth, schema, CRUD, initial hosted shell | Hero, composer, preview | Onboarding and fixture workspace | Reviewed sources, template, extraction | Hosted shell; sign-in and one saved record; source pack ready |
| 35–55 min | Connect live adapter and persistence helpers | Remaining sections and mobile | Task drawer, assistant, example interactions | Plan generation and validated tools | First real plan saved and rendered through shared adapter |
| 55–80 min | Integrate and repair the complete flow | Polish real content and responsive states | Wire receipts/context; mobile/error states | Conversational changes and evidence verification | Live intake → plan → change → refresh works |
| 80–100 min | Freeze P0; whole-app checks and deployment | Visual QA; fix defects | Interaction QA; fix defects | Failure/retry and action QA; P1 draft only if stable | P0 accepted; optional work cannot block release |
| 100–110 min | Production URL checks; verify two accounts | Presentation-width review | Mobile review | Verify demo prompts and saved results | Deployed demo ready |
| 110–120 min | Rehearse and fix blockers only | Support rehearsal | Support rehearsal | Support rehearsal | Repeatable live demo and labeled sample fallback |

Do not wait for a finished marketing page to connect the app. The live vertical slice is due at minute 55; the conversational loop is due at minute 80.

### Cut rules

- If a service is blocked at minute 25, the human integration owner resolves access while agents continue on explicit fixtures. Do not claim the live prototype is complete until authentication, persistence, and real AI work.
- If behind at minute 55, cut message drafting, decorative motion, and elaborate marketing preview interactions.
- If behind at minute 80, simplify task filtering and landing-page section treatment. Preserve sourced generation, authentication, saved task changes, conversational updates, and mobile usability.
- Source uncertainty reduces supported content; it is never filled with fabricated requirements.

## Validation and definition of done

### Product and design

- [ ] Landing-page composer preserves the user's actual text through navigation and sign-in.
- [ ] Every CTA and navigation item works; no placeholder links or fake social proof.
- [ ] Onboarding supports corrections, missing information, unsupported routes, and extraction errors.
- [ ] The workspace shows a personal move, meaningful next action, phases, and task detail.
- [ ] Task context is visible in chat; completed changes produce accurate receipts.
- [ ] Keyboard use, focus, drawers, forms, contrast, and small-screen layouts are checked.
- [ ] Shared theme and route-card design are consistent across the site and app.

### Behavior and evidence

- [ ] A signed-in user creates a real sourced plan from a supported profile.
- [ ] Task completion and reopening update progress and dependent next actions.
- [ ] Arrival changes adjust only relevant suggested dates; official deadlines remain evidence-based.
- [ ] Existing completed work survives replanning and refresh.
- [ ] Unknown source IDs are rejected; reviewed source links open the intended guidance.
- [ ] Retry does not duplicate tasks, messages, or completed actions.
- [ ] AI errors preserve input and saved progress and offer a useful next step.
- [ ] Demo mode is clearly labeled, resettable, and isolated from live user data.

### Integration and release

- [ ] A second account cannot access or mutate the first account's records, including through AI actions.
- [ ] Auth redirects and Convex/OpenAI environment configuration work on the deployed URL.
- [ ] Lint, TypeScript checks, and production build pass.
- [ ] Focused automated checks cover ownership rejection, arrival-date rules, retry deduplication, and preservation of completed tasks. Avoid spending the sprint on cosmetic unit tests.
- [ ] The complete journey is smoke-tested on desktop and mobile with real persistence.
- [ ] Each agent provides a short handoff with changed files, checks, and known limitations.

## Ninety-second demo

1. Open the landing page: “Moving countries creates dozens of small, connected decisions.”
2. Enter the student move and continue through the prepared authentication flow.
3. Confirm the extracted profile and generate the personal plan.
4. Open the next action; show practical steps and its official source.
5. Say: “I'm arriving two weeks later, and I've already found housing.”
6. Show the saved change receipt, completed task, and adjusted suggested dates.
7. Refresh to demonstrate persistence. If available, finish by copying a university-office message draft.

Have an existing authenticated account ready to keep the live presentation short, while separately verifying new-user signup. Keep the labeled public example available for service outages.

## Deferred features

Broad country coverage, permanent-relocation rules, multiple moves, document uploads/OCR, live housing search, autonomous submissions/bookings, sending email, notifications, calendars, payments, collaboration, and administration screens. No vector database or additional agent framework is required for this prototype.

## Implementation references

- [shadcn/ui for an existing Next.js project](https://ui.shadcn.com/docs/installation/next)
- [Convex and Clerk authentication](https://docs.convex.dev/auth/clerk)
- [Convex actions](https://docs.convex.dev/functions/actions)
- [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
- [OpenAI function calling](https://developers.openai.com/api/docs/guides/function-calling)
- [Deploying Convex with Vercel](https://docs.convex.dev/production/hosting/vercel)
