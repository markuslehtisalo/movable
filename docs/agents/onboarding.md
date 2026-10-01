# Onboarding agent brief

Build a fast, excellent onboarding experience from natural-language description to a confirmed move. Read `AGENTS.md` and `docs/parallel-build.md` first. Implement now within your owned files.

## Files you own

- `src/app/onboarding/**`
- `src/features/onboarding/**`
- `docs/handoffs/onboarding.md`

Do not edit global providers, theme, contracts, adapters, dependencies, the marketing page, or app routes. Do not import another feature directory.

## Experience to build

1. Restore the marketing input from `?draft=` or `readOnboardingDraft()`. Keep any manual edits saved with `saveOnboardingDraft()`. Avoid a server/client hydration mismatch when reading browser storage.
2. Invite a free-text description with an explicit Use example action. Call `extractProfile(text)` and then show an editable confirmation card. Local extraction is deliberately limited: explain the local preview and collect missing values manually.
3. Build a compact form for citizenship, origin country/city, destination country/city, university, study type, arrival date, stay type, and duration. See `MoveProfile` for exact names, ISO country codes, and null handling.
4. Validate using `completeProfileSchema`; show field-specific errors. Distinguish citizenship from residence. Do not infer unspecified facts from the example defaults.
5. Check `isSupportedProfile` and explain current example coverage before attempting generation. The initial supported prototype is a Finnish exchange student moving to Amsterdam for a fixed stay.
6. Show the confirmed journey and a clear Build my plan action. Use `createMove` followed by `generatePlan`, then clear the draft and navigate to `/app`. Keep stable request IDs for retries. If generation fails, retry against the created move rather than creating it again.
7. If a move already exists, offer to open it or explicitly start over; do not silently replace existing work.

Keep `EnvironmentNotice` visible. Root providers already cover this route. Do not add a new provider or implement pretend authentication. Preserve the draft so the coordinator can add sign-in later without changing the UX contract.

## Quality bar

Make onboarding feel calm, personal, and short. Prefer an editable summary and small grouped questions over a wall of fields or one chat turn per question. Clearly show current step and Back without losing data. Include pending, retry, extraction failure, unsupported profile, and validation states. Maintain keyboard labels and focus management. Review small-screen date inputs and long university/city names.

The existing starter explicitly uses a demo profile. Replace that shortcut: the final generated plan must use the user's confirmed form values.

## Finish

Run `pnpm exec eslint src/app/onboarding src/features/onboarding`. Manually verify marketing text preservation, example entry, corrections, validation, retry behavior, and navigation to the existing app scaffold. Write your handoff in `docs/handoffs/onboarding.md`.
