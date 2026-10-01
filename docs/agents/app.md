# App agent brief

Build the personal relocation workspace and public example using the shared adapter. Read `AGENTS.md` and `docs/parallel-build.md` first. Implement now within your assigned paths.

## Files you own

- `src/app/app/**`
- `src/app/demo/**`
- `src/features/workspace/**`
- `docs/handoffs/app.md`

Do not edit onboarding, marketing, global styles/providers, shared components/contracts/adapters, or dependencies. Feature components import shared DTOs and `useMovable()`; no SDK calls or cross-feature imports.

## Experience to build

- Personal arrival dashboard: origin → destination, host university, arrival date/countdown, task progress, and a prominent next action.
- Full task list grouped by `PHASE_ORDER`/`PHASE_LABELS`, with All / To do / Done filters. Use `getNextTasks`, `getProgress`, `isBlocked`, and `getBlockedBy`; do not duplicate scheduling logic.
- Task drawer: explanation, steps, required-document checklist, timing classification, prerequisites, sources when available, completion/reopen action, and Ask Movable about this.
- The fixture has no verified official sources. Render an honest “Guidance needs verification” state; never fabricate citations or label suggested dates official.
- Contextual assistant: desktop side panel, mobile sheet, text composer, pending/error states, suggested prompts, and removable selected-task context.
- Call `sendMessage(move.id, text, selectedTaskId, requestId)`. Render persisted `messages` and `receipts`, including before/after values and links that reopen affected tasks. Do not maintain a second independent chat history.
- Profile editing at least for arrival date, using `updateProfile`. Preserve completed work and existing timing semantics through the shared command.
- Completion/reopening uses `setTaskStatus`. Avoid optimistic success messages before the promise resolves. Provide clear feedback on updates.
- Empty `/app` links to `/onboarding` and `/demo`; never silently load sample data into the personal workspace.
- `/demo` uses the same workspace inside its existing nested demo provider. Keep the visible example label, Reset example, and Plan my move. Demo changes must remain isolated.
- Keep `EnvironmentNotice` visible in every state. Do not add another provider around `/app`.

## Quality bar

Make the next action obvious, the full plan easy to scan, and the assistant feel connected to the workspace. Use shared tokens and `MoveSummary`; put additional app-specific components in your feature directory. Check desktop/tablet/mobile, scroll containers, sheet focus, composer visibility, long messages, and empty states.

The local assistant is scripted and says so. It supports “I'm arriving two weeks later, and I've found housing,” next-action questions, and selected-task explanations. Build the real interaction UI around it; do not implement a second fake agent. Message drafting is optional and currently has no generation command; render `message.draft` if present but do not invent live generation.

## Finish

Run `pnpm exec eslint src/app/app src/app/demo src/features/workspace`. Verify task completion/reopen, blockers, profile edit, contextual chat, receipts, browser refresh, and example reset/isolation. Write your handoff in `docs/handoffs/app.md`.
