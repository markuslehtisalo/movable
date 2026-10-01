# Live integration handoff — 1 October 2026

## Release decision

The user prioritized a public deployment and declined taking over the UI agents' files. Feature files remain unchanged. `vercel.json` intentionally deploys the working, clearly labeled local/browser prototype. `/demo` stays isolated in memory. Credentials and local environment files are excluded by `.vercelignore`.

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
- This is backend identity isolation testing, not a two-person Clerk browser sign-in test. Full live browser QA is still pending.

## Remaining feature integration

`docs/live-ui-integration.patch` is prepared for the feature owners. It removes onboarding's unconditional live-mode disabled states, updates local-only copy by mode and enables the live empty-workspace CTA. It has not been applied or tested as a feature change. The owners should also scope persisted onboarding attempts to the account/mode so an old local or other-account attempt cannot be reused, and update marketing's current local-prototype copy before a live account release.

Do not turn the public deployment to live mode until these UI changes and a real Clerk browser sign-in have been checked. Vercel's local-mode overrides in `vercel.json` must then be removed, with the Clerk and Convex frontend environment variables configured on the intended deployment.

## Operations

`pnpm exec convex dev --once` deploys the backend to the currently selected development deployment. The user's existing watcher can continue running. No extra Next.js dev server was started. No branch, commit, staging or dependency installation was performed.

Vercel login was refreshed. The production project is `lzrd-tech/movable`, publicly available at https://movable-lilac.vercel.app. The deployment completed successfully and both `/` and `/demo` returned HTTP 200. The public site remains in local/browser-prototype mode as described above.
