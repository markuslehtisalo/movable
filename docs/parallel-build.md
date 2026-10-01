# Parallel UI build: ready to launch

## Current setup

The three implementation agents are **marketing**, **onboarding**, and **app**. They can run simultaneously in this same working directory. The coordinator owns shared infrastructure and will review their work after they finish. No agents have been launched by this setup step.

The product direction is in `docs/plan.md`. This file and `AGENTS.md` override its previous agent assignments and proposed API shapes; `src/lib/movable/contracts.ts` is the actual type contract.

## Launch these three tasks

Copy one instruction into each agent:

**Marketing**
> Implement the Movable marketing site. Read AGENTS.md, docs/parallel-build.md, and docs/agents/marketing.md, then build within your assigned files. Other agents are editing onboarding and the app simultaneously. Finish by writing docs/handoffs/marketing.md.

**Onboarding**
> Implement Movable onboarding. Read AGENTS.md, docs/parallel-build.md, and docs/agents/onboarding.md, then build within your assigned files. Other agents are editing marketing and the app simultaneously. Finish by writing docs/handoffs/onboarding.md.

**App**
> Implement the Movable workspace and public example. Read AGENTS.md, docs/parallel-build.md, and docs/agents/app.md, then build within your assigned files. Other agents are editing marketing and onboarding simultaneously. Finish by writing docs/handoffs/app.md.

Use the same checkout to see the prepared, uncommitted foundation immediately. If choosing isolated worktrees instead, first have the coordinator commit the shared foundation and branch each worktree from that commit; otherwise the agents will not receive these files.

## Routes and handoffs

| Route | Owner | Behavior |
| --- | --- | --- |
| `/` | Marketing | Composer → `onboardingHref(text)`; example → `/demo` |
| `/onboarding` | Onboarding | Restore draft, collect/confirm profile, create move, generate plan, navigate `/app` |
| `/app` | App | Current local move, or empty state linking to onboarding |
| `/demo` | App | Same workspace under isolated demo provider, with reset |

No backend service credentials are required for these tasks. The existing dev server is at `http://localhost:3000`; all agents should share it. `pnpm dev` starts the application only if that server is not running. `.env.example` documents future connections; default mode is `local` without any environment file.

## Shared exports

| Module | Exports / purpose |
| --- | --- |
| `@/lib/movable/contracts` | Zod schemas, `MoveProfile`, `ProfileDraft`, `Move`, `Task`, `Message`, `Source`, `ActionReceipt`, `MoveSnapshot`, `MovableAdapter`, `PHASE_LABELS`, `PHASE_ORDER` |
| `@/lib/movable/client` | `MovableProvider`, `useMovable`, `newRequestId` |
| `@/lib/movable/fixtures` | `DEMO_PROFILE`, `EXAMPLE_PROMPT`, `createDemoSnapshot`, `createFixtureTasks` |
| `@/lib/movable/selectors` | `getNextTasks`, `getProgress`, `isBlocked`, `getBlockedBy`, `formatDate`, `daysUntil`, `shiftDate`, `rescheduleTasks`, `isSupportedProfile` |
| `@/lib/movable/draft` | `onboardingHref`, `saveOnboardingDraft`, `readOnboardingDraft`, `clearOnboardingDraft` |
| `@/components/movable/*` | `Brand`, `MoveSummary`, `EnvironmentNotice`, `SourceLink` |
| `@/components/ui/*` | Button, Badge, Card, Input, Textarea, Label, Select, Checkbox, Progress, Separator, Tabs, Sheet, Dialog, Avatar, Skeleton, Tooltip, Sonner, ScrollArea |
| `@/lib/utils` | `cn` |

shadcn uses Radix primitives. `Button` supports `asChild`. Use `size="lg" className="h-11 px-5"` for prominent touch-friendly actions; the generated default buttons are compact. Use `toast` from `sonner` when helpful. Providers and toaster are already wired at the root.

## Adapter API

`useMovable()` returns state and commands together, not nested objects:

```tsx
const { mode, phase, move, tasks, messages, sources, error,
  extractProfile, createMove, generatePlan, updateProfile,
  setTaskStatus, sendMessage, resetDemo } = useMovable();
```

See `MovableCommands` for exact signatures. Commands return promises and throw useful errors. Each feature owns its pending/error UI. Pass a stable request ID when retrying the same operation; create a new ID for a new user intent. Disable duplicate submissions while pending.

```tsx
const createId = newRequestId();
const planId = newRequestId();
const { moveId } = await createMove(confirmedProfile, createId);
await generatePlan(moveId, planId);
clearOnboardingDraft();
router.push('/app');
```

On a plan-generation failure, retain `moveId` and retry generation; do not create a second move. Creation replaces the active local move, so require an explicit user action before replacing existing work.

`local` persists in localStorage under `movable:local-workspace:v1`; hydration occurs after initial render. The empty SSR snapshot can briefly precede persisted data. `demo` starts with 12 tasks and one completed prerequisite; its changes are in memory and reset on a full reload. The two modes never share saved state.

The local extractor recognizes the exact example and a few explicit phrases, returning a partial profile for manual completion. It is not an LLM. The scripted assistant supports the example arrival/housing change, selected-task explanations, and next-action requests. Arbitrary requests receive an honest preview limitation response.

`live` is a deliberate configuration error until the coordinator supplies a live adapter. Clerk, Convex, and OpenAI packages are installed, but no live service, auth guard, or model call is configured. Do not implement fake sign-in or imply a cloud save.

## Design tokens

The common visual foundation is already applied: warm ivory background, dark green ink, coral primary action, white cards, soft borders, Geist typography, and rounded surfaces. Use `bg-background`, `text-foreground`, `text-muted-foreground`, `bg-primary`, `bg-accent`, `border-border`, and existing radii. Build distinct page compositions using these tokens. Do not edit `globals.css` or add a theme framework.

## Coordinator review after agent completion

1. Read all three handoffs; inspect only their owned changes and shared-file requests.
2. Run `pnpm check`, then a single `pnpm build`.
3. Verify composer text → profile correction → saved plan → task completion → conversation → refresh.
4. Verify `/demo` never alters the local move and resets correctly.
5. Review 390 px, 768 px, and 1440 px layouts, keyboard navigation, loading/error states, and no placeholder links.
6. Repair integration issues in shared files centrally.
7. Connect authenticated Convex/OpenAI behavior in a separate pass, replacing the adapter without changing feature views. Verify two-account isolation before calling the app authenticated.
