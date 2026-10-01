# Onboarding handoff

Status: implemented; focused checks pass. Shared-server compilation currently blocks browser and viewport verification.

## Implemented

- Three steps: describe the move, edit grouped details, and review the confirmed journey before building a plan.
- Restore incoming `?draft=` text or the shared session draft after hydration. Save text through `saveOnboardingDraft`; preserve manual fields, the current step, and retry IDs in the feature-owned `movable:onboarding-details:v1` session key. Refresh keeps corrections even when the incoming URL still contains the original text. A different incoming prompt starts fresh.
- Explicit **Use example** action followed by `extractProfile`. Unspecified values remain empty; no direct `DEMO_PROFILE` shortcut. Re-extraction retains fields the user has edited. Manual entry and Back retain data.
- Labelled citizenship and current-residence fields; country names map to ISO codes. Separate route, study, and timing groups. Fixed stays require a positive whole number of months; open-ended stays serialize duration as `null`.
- `completeProfileSchema` validation with field messages, first-invalid-field focus, and step heading focus. `isSupportedProfile` gates both confirmation and generation; unsupported moves remain editable and link to the separate `/demo`.
- Review displays every confirmed value, example-content limitations, and the final **Build my plan** action. The flow creates a move, generates its plan, clears drafts on success, and navigates to `/app`.
- Retry request IDs are stable and persisted before commands run. Creation is recorded before generation starts. A failed generation retries the same move; pending commands block duplicate clicks. Tests also cover a lost creation response and completed-task preservation.
- Existing moves are protected by an **Open my move / Start a new move** choice. A replacement needs the explicit **Replace & build my plan** action. Existing work is untouched while editing a replacement draft.
- `EnvironmentNotice` remains visible, including in the route loading fallback. No provider, auth, SDK, backend, dependency, global style, or other feature changes.

## Changed files

- `src/app/onboarding/page.tsx` — route metadata and loading fallback.
- `src/features/onboarding/onboarding-page.tsx` — onboarding flow, existing-move guard, journey views, pending/error/retry UI.
- `src/features/onboarding/profile-form.tsx` — grouped form using existing shadcn primitives.
- `src/features/onboarding/profile-fields.ts` — form serialization, validation, country options, draft restoration.
- `src/features/onboarding/build-plan.ts` — resumable create/generate sequence.
- `src/features/onboarding/onboarding.test.ts` — focused behavior and recovery tests.
- `docs/handoffs/onboarding.md` — this handoff.

## Checks and responsive review

- Passed: `pnpm exec eslint src/app/onboarding src/features/onboarding`.
- Passed: focused TypeScript check using a temporary `/private/tmp/movable-onboarding-tsconfig.json` extending the root configuration and including only onboarding entry points and their imported dependencies. No root type generation or build was run.
- Passed: `pnpm exec tsx --test src/features/onboarding/onboarding.test.ts` — 6 tests covering missing information, limited extraction, edited confirmation values, fixed/open-ended duration handling, interrupted generation, lost creation response, completed-task preservation, draft refresh, new-prompt isolation, and stored retry IDs.
- Attempted browser review in a separate Chrome tab at `http://127.0.0.1:3000/onboarding` to avoid changing other agents’ `localhost` browser storage. The shared server initially reported a missing workspace module, then a missing `src/features/marketing/marketing.module.css`. The latest HTTP check returned 500. No app state was created or modified by browser QA.
- No useful screenshots could be captured: the page remained blank due to the shared compilation error. No additional server was started.
- Implemented responsive single-column/mobile and two-column/desktop layouts, wrapping city/university summaries, constrained date inputs, 44–48 px primary/form controls, keyboard-accessible selects, visible focus, and reduced-motion spinner behavior. These still require visual confirmation at 390, 768, and 1440 px.
- Coordinator follow-up when the shared server compiles: verify marketing → onboarding text handoff, example entry, manual corrections and refresh, validation focus, unsupported coverage, existing-work protection, final navigation to `/app`, and long names/date inputs on mobile. Extraction failure/pending UI is implemented; the current local extractor does not normally fail, so browser fault injection was not performed. Retry failures were exercised with focused tests.

## Shared changes requested

- No contract or shared primitive changes required.
- Marketing owner/coordinator: finish the referenced `marketing.module.css` (or resolve that import) so the shared dev server can render for integration QA. Do not change onboarding to work around that cross-feature compilation error.
- Coordinator: run the repository-wide `pnpm check` and single `pnpm build` as planned. The new focused onboarding tests are outside the current root `test` script’s `src/lib/movable/*.test.ts` glob; run their command above or extend test discovery centrally.

## Known limitations

- Profile extraction and generated tasks are intentionally limited local examples; wider routes, live AI, authentication, and cloud sync remain unavailable.
- Form drafts and retry IDs survive refresh in the same tab via session storage; they do not sync between devices or survive a closed tab. A storage failure shows a keep-this-tab-open message.
- Existing shared provider/adapter behavior governs workspace hydration and cross-tab state. This feature does not add cross-tab synchronization.
- Browser integration and responsive QA remain unverified because of the shared compilation blocker described above.

User summary: Onboarding is implemented with editable confirmation, preserved drafts, coverage validation, safe replacement, and resumable plan creation. Focused lint, TypeScript, and all 6 behavior tests pass; browser review needs the shared server compilation error resolved.
