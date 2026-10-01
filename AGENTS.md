# Movable parallel build rules

## Start here

Read `docs/parallel-build.md`, your assigned brief in `docs/agents/`, and the actual shared contracts in `src/lib/movable/contracts.ts` before implementation. The current split is **marketing, onboarding, app**; it supersedes the earlier AI-agent split in the original product plan.

The user will launch the agents. Do not launch additional agents yourself. Implement your assigned experience, then write your handoff. The coordinator will review and integrate afterward.

## Exclusive ownership

| Role | Writable paths |
| --- | --- |
| Marketing | `src/app/page.tsx`, `src/features/marketing/**`, `public/marketing/**`, `docs/handoffs/marketing.md` |
| Onboarding | `src/app/onboarding/**`, `src/features/onboarding/**`, `docs/handoffs/onboarding.md` |
| App | `src/app/app/**`, `src/app/demo/**`, `src/features/workspace/**`, `docs/handoffs/app.md` |
| Coordinator | All shared infrastructure, contracts, adapters, global styles, primitives, dependencies, root layout, providers, auth/backend, documentation outside individual handoffs |

Do not edit another role's files, even to fix an error. Describe a shared-file blocker in your handoff or message the coordinator. No dependency installation, lockfile edits, global CSS changes, root provider changes, backend implementations, or SDK calls from feature code.

## Shared environment

- This is a shared checkout. Do not switch branches, reset, clean, commit, merge, or stage other work. Other agents' edits are expected; leave them alone.
- Do not run package installers or shadcn generators. Needed components are already installed.
- Share the existing dev server at `http://localhost:3000`. Next.js permits one dev process per checkout; do not start competing servers even on different ports. If it stops, designate one agent to restart `pnpm dev`. Use separate browser tabs and avoid overwriting another agent's active local move. Coordinate before running builds.
- Use `pnpm exec eslint <your owned source paths>` for focused checks. The coordinator runs `pnpm check` and `pnpm build` after handoff. Do not fix unrelated diagnostics.
- Do not modify this file, `docs/plan.md`, or frozen contracts in an implementation role.

## Product and implementation rules

- Build against `useMovable()` and shared DTOs. Never import another feature directory.
- `local` is an explicitly labeled browser prototype. `demo` is a separate in-memory example. `live` is intentionally unavailable until a real adapter is connected. Do not disguise scripted behavior as real AI/authentication.
- Keep `EnvironmentNotice` visible on onboarding and workspace routes.
- Use existing shadcn primitives and semantic theme classes. Feature-local CSS/modules and SVGs are allowed inside your directory.
- Maintain mobile layouts, keyboard access, visible focus, labels, loading/error/empty states, and reduced-motion behavior.
- Sources in fixtures are unverified; do not invent legal requirements, deadlines, testimonials, or external actions.
- Preserve onboarding text and existing completed tasks. Use the shared draft helpers, status commands, date helpers, and selectors.
- Root providers are already installed. Only `/demo` gets a nested `MovableProvider mode="demo"`; do not wrap onboarding or `/app` again.

## Handoff

Write your owned `docs/handoffs/<role>.md`: implemented behavior, changed files, checks performed, screenshots/viewport review if available, shared changes requested, and known limitations. Finish with a concise user summary. Do not wait for another feature agent to finish.
