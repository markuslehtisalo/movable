# App handoff

Status: implemented; ready for coordinator review. No shared infrastructure, feature-external files, dependencies, or saved localhost move were changed by this agent.

## Implemented behavior

- `/app` uses the root provider. `/demo` keeps its existing isolated demo provider and shows Example move, Reset example, and Plan my move.
- A hydration/loading state prevents an empty-workspace flash before browser data is restored. Empty `/app` offers onboarding and the example; live/configuration errors and a saved profile with no generated tasks have explicit states. Preparing a missing plan reuses the current move.
- Arrival dashboard uses `MoveSummary`, shared date helpers, `getProgress`, and `getNextTasks`: route, university, date/countdown, arrival/settling language, progress, one prominent next task, and two upcoming tasks.
- The full checklist uses `PHASE_ORDER` / `PHASE_LABELS`, All / To do / Done filters, completion/reopening, readable suggested/official timing labels, and derived blockers. Blocked tasks remain inspectable; their completion control is disabled until prerequisites are met.
- Task drawer includes explanation, timing semantics, prerequisite links, numbered steps, a clearly temporary document checklist, source links when supplied, and an honest Guidance needs verification state. No invented official sources or deadlines.
- Assistant is a sticky desktop panel at 1280 px and above, and an accessible sheet below that breakpoint. It has a bounded, scrollable composer, suggested prompts, removable task context, and persisted messages/receipts directly from `useMovable()`. Receipt links reopen affected tasks or the arrival editor. Existing message drafts render if provided.
- “Ask Movable about this” transfers task context and keyboard focus to the composer. Sending and removing context also restore composer focus. Dialogs restore focus to an available initiating control; narrow-screen assistant focus returns to its launcher.
- Arrival editing calls `updateProfile`, displays actual returned before/after values, and leaves preservation/rescheduling to the shared adapter. Completed work remains complete.
- Commands share a synchronous in-flight guard, disable duplicate submissions, retain request IDs for retries of the same failed intent, and show errors without clearing a failed message. Success feedback occurs after the command resolves.
- Semantic tokens, existing primitives, reduced-motion utilities, explicit labels, visible focus, overflow handling, and `EnvironmentNotice` are retained. Route titles inherit the shared Movable title template.

## Changed files

- `src/app/app/page.tsx` — workspace metadata; existing provider boundary retained.
- `src/app/demo/page.tsx` — example metadata; existing demo provider retained.
- `src/features/workspace/workspace-page.tsx` — route states, header, composition, command wiring, responsive assistant, focus handoffs.
- `src/features/workspace/arrival-dashboard.tsx` — arrival summary, countdown, progress, next/upcoming actions.
- `src/features/workspace/task-plan.tsx` — phased checklist, filters, task timing presentation, status controls.
- `src/features/workspace/task-drawer.tsx` — task details, prerequisites, document checklist, sources, actions.
- `src/features/workspace/assistant-panel.tsx` — conversation, contextual composer, persisted receipts and drafts.
- `src/features/workspace/arrival-dialog.tsx` — date editing, validation, returned change receipt.
- `src/features/workspace/use-workspace-action.ts` — pending/error handling, duplicate guard, stable retry IDs.
- `docs/handoffs/app.md` — this handoff.

## Checks and responsive review

Passed:

- `pnpm exec eslint src/app/app src/app/demo src/features/workspace`
- App-scoped TypeScript check: `pnpm exec tsc --project /private/tmp/movable-app-tsconfig.json --pretty false`. The temporary config extends the repository config, includes the owned app routes/workspace files and their imports, and disables incremental output. No repository config changed.
- `git diff --check -- src/app/app src/app/demo src/features/workspace`
- Two existing, focused adapter tests: `pnpm exec tsx --test --test-name-pattern 'survive adapter recreation|public example' src/lib/movable/adapter.test.ts` — 2 passed. The sandbox initially blocked the runner's IPC socket; the approved rerun passed.
- Browser review on the existing `http://localhost:3000` server at 1440×1000, 768×1024, and 390×844. No additional dev server or production build was started.
- Housing completion and reopening, corresponding success feedback, and dependent travel-task blocking/unblocking.
- Selected-task explanation through the real shared `sendMessage`; removal of task context; task-drawer → mobile assistant focus transfer; focus returning to the composer after send.
- Scripted arrival/housing update: arrival 15 Jan → 29 Jan 2027, housing To do → Done, visible receipts, and receipt-to-task navigation.
- Arrival editor: 29 Jan → 5 Feb 2027, actual returned receipt, rescheduled incomplete tasks, and 2 completed tasks preserved. Native keyboard date editing was checked (the browser automation's direct date fill did not trigger React's change event until a native key event).
- Document checkbox, Done filter, empty Done filter after reopening the last completed task, reset restoring 1/12 complete and the original date/blockers, and a full demo reload restoring its initial example state.
- A 1,600-character unbroken message wrapped without horizontal overflow at 390 px; textarea height capped at 160 px and send button stayed inside the 844 px viewport. The tablet document width equaled the viewport width.
- Empty `/app` retained the correct onboarding/example links and local-prototype notice after the demo interactions and reload. No sample was silently inserted into local state.

Screenshots are local review artifacts, outside the shared checkout:

- [Desktop overview](/private/tmp/movable-app-review/desktop.jpg)
- [Mobile dashboard](/private/tmp/movable-app-review/mobile-dashboard.jpg)
- [Mobile assistant with change receipts](/private/tmp/movable-app-review/mobile-assistant.jpg)
- [Tablet overview](/private/tmp/movable-app-review/tablet.jpg)

There was a temporary marketing CSS import error during parallel editing; it resolved when that file appeared and browser verification resumed. No other role's files were edited to resolve it.

## Shared changes requested

No shared change is required for the implemented workspace.

Optional coordinator follow-ups:

- Shared `Progress` currently consumes `value` for its indicator but does not forward it to the Radix root. The workspace supplies explicit ARIA value attributes; consider fixing the primitive centrally for other consumers.
- The adapter returns profile/housing receipts for the scripted update, but not individual rescheduled-task date receipts. The UI renders the actual receipts supplied and updated task dates. If a per-task rescheduling audit is desired, add those receipts in the adapter; the existing receipt UI can render and link them.

## Known limitations / integration checks remaining

- Full `pnpm check` and `pnpm build` remain with the coordinator as assigned.
- Nonempty local browser refresh should be checked during the coordinator's end-to-end onboarding flow. This agent deliberately did not create or replace a local move in the shared localhost browser. An attempted separate-origin check on `127.0.0.1` stayed at the server loading view; the normal localhost route hydrated. Local persistence and isolation were verified with the two existing adapter tests, and demo refresh/empty-local isolation were verified in the browser.
- Loading, generating, command-error, and unsupported/live states are implemented, but slow commands and injected command failures were not exercised through a browser adapter. The current commands resolve immediately.
- Responsive checks used desktop browser viewport emulation, not a physical mobile software keyboard or a screen-reader session.
- Document checkmarks are intentionally temporary and labeled as such; no upload or document-persistence contract exists. Chat input/context are UI state; only adapter messages, tasks, and profile changes persist.
- The local assistant remains scripted, sources remain unverified, and there is no live auth, cloud save, message generation, or external action.

## User summary

Built the responsive app and isolated example with an arrival dashboard, complete phased plan, task drawer, contextual assistant, saved-change receipts, and arrival editing. Focused lint, app TypeScript, persistence/isolation tests, and desktop/tablet/mobile interaction checks passed; coordinator integration checks are noted above.
