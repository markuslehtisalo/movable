# Live integration handoff — 1 October 2026

## Release decision

The user subsequently authorized integration of the finished feature files and prioritized the complete live release. Onboarding, marketing and workspace now support live account mode. `/demo` stays isolated in memory. Credentials and local environment files are excluded by `.vercelignore`.

## Implemented and deployed to development Convex

- Clerk issuer configuration uses the existing `CLERK_FRONTEND_API_URL` (with `CLERK_JWT_ISSUER_DOMAIN` as a fallback).
- Moves, tasks, messages and idempotency records are stored in Convex. Public reads and writes derive the owner from the authenticated identity. A replacement archives the prior move rather than deleting its records.
- Real OpenAI Responses actions extract profiles, personalize twelve stable preparation tasks, update arrival/task status through a validated tool call, and draft university messages. Default model: `gpt-6.1-sol`; optional `OPENAI_MODEL` override.
- AI writes use an expiring operation lease, request fingerprint and move revision check. The final changes and message commit atomically. Failed model calls do not partially update the plan. Recent messages are bounded in the client snapshot; older rows remain stored.
- Official source summaries for UvA exchange/housing/insurance and Amsterdam registration were read on 1 October 2026. UvA sources apply only to the named university. These are limited source summaries, not a complete legal review. Suggested dates are never promoted to official deadlines.
- Shared live provider, account controls, real Clerk sign-in/sign-up routes, route protection and Convex subscription adapter are ready behind `NEXT_PUBLIC_MOVABLE_MODE=live`.
- Local browser data is neither migrated nor overwritten by this work.

## Validation

- `pnpm check`: passed (13 shared tests; only harmless generated-file ESLint warnings).
- `pnpm exec tsx --test src/features/onboarding/onboarding.test.ts`: all 6 passed.
- `pnpm build`: passed in local release mode.
- `node scripts/smoke-live.mjs`: passed against development Convex and real OpenAI requests. Checks anonymous rejection, two synthetic authenticated identities, foreign move/task rejection, idempotent creation, extraction, plan generation, source presence, completion persistence, conversation date/housing changes, retries, and message drafts. The script cleans up its synthetic data.
- This is backend identity isolation testing, not a two-person Clerk browser sign-in test. Hosted browser verification now also passes: real Clerk test-user sign-in, marketing draft recovery, AI profile extraction, country selection by keyboard, plan generation, task completion, conversation arrival/housing updates, receipts, and persistence after refresh.

## Completed feature integration

- Removed onboarding's live-mode disabled states and enabled the live empty-workspace CTA.
- Updated marketing, onboarding and assistant copy to distinguish live AI/account storage from the scripted public example.
- Scoped session drafts and saved build attempts by account; preserved marketing text through Clerk redirects.
- Removed the deployment's forced local-mode override and configured Vercel production plus release-branch preview variables.
- Repository-local Git identity now uses the owner's GitHub noreply address. A new release commit replaces the invalid macOS-local author for deployment checks; existing history is preserved.
- Real native Clerk session token accepted by Convex. The configured native integration does not need the legacy `convex` JWT template.
- Final checks: ESLint and TypeScript passed; all 19 shared/onboarding tests passed, including account-scoped attempt recovery. Local webpack production build passed. Vercel's normal Turbopack build passed; local Turbopack cannot follow this temporary worktree's external node_modules symlink.

## Operations

`pnpm exec convex dev --once` deploys the backend to the currently selected development deployment. The user's existing watcher can continue running. No extra Next.js dev server was started. Integration is isolated in `/private/tmp/movable-improvement` on `integration/live-release`; no dependencies were added.

Vercel login was refreshed. The production project is `lzrd-tech/movable`, publicly available at https://movable-lilac.vercel.app. Both `usemovable.com` and `www.usemovable.com` resolve to Vercel with working HTTPS. The live release's hosted build succeeded; the tested live deployment was promoted to the production domains on 1 October 2026.

## Final hosted review

- Tested deployment: `movable-e1h2hpb6u-lzrd-tech.vercel.app` (release commit `58c20f1`).
- The browser test completed exchange details, then asked to arrive two weeks later and confirmed housing. The saved plan shows 29 January 2027, 2/12 completed tasks, and both action receipts after refresh.
- Desktop workspace and 390 px public-demo screenshots were reviewed. The demo remains labeled scripted, starts separately at 1/12 complete, and does not replace the account move.
- A development-only Clerk smoke account and its synthetic move remain available as test evidence; no real user's move was changed.
- The broader Finland/Taiwan sourced-example improvement pass remains deferred. Live service calls currently use the configured development Clerk and Convex instances.
