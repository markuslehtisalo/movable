# Marketing handoff

Status: implemented and ready for coordinator review. Reviewed on 1 October 2026 against the shared dev server at `http://localhost:3000`.

## Implemented

- Complete `/` landing page with compact navigation, the requested hero, a prominent move composer, three benefits, a three-step explanation, five expandable FAQs, a closing CTA, and a footer.
- Feature-local Helsinki/Amsterdam route illustration, editorial typography, warm semantic surfaces, and a compact product preview. The illustration is inline SVG; no external imagery or dependencies.
- The preview uses shared `MoveSummary`, `DEMO_PROFILE`, `createDemoSnapshot`, `getNextTasks`, and date helpers. It shows the real fixture's next available housing task and an explicitly illustrated arrival/housing change.
- Composer uses the exact shared `EXAMPLE_PROMPT` as its placeholder and example-fill value. Filling the example focuses the textarea and announces the change. Submitting calls `onboardingHref(text)` without trimming or rewriting the draft, then navigates to the returned URL. Submission has a disabled pending state.
- Header and closing start actions anchor to the composer. Every example link targets `/demo`; returning-user links target `/app`. No placeholder links, sign-in flow, live AI claims, or invented verified guidance.
- Browser-prototype copy is visible beside the composer. The preview is labeled “Example move,” the receipt is labeled “Illustration,” and the caption explains scripted interactions and unverified suggested steps. FAQs explain scope, local persistence, and current assistant behavior.
- Keyboard skip link, associated textarea label and hint, focus treatment, focusable anchor targets, native keyboard-operable FAQ disclosures, and touch-sized primary controls. Decorative SVGs/icons are hidden from assistive technology. Subtle hover/disclosure transitions run only when reduced motion is not requested.

## Changed files

- `src/features/marketing/marketing-page.tsx` — full landing page and composer interactions.
- `src/features/marketing/example-preview.tsx` — fixture-backed preview and route artwork.
- `src/features/marketing/marketing.module.css` — feature-local responsive layout and styling.
- `docs/handoffs/marketing.md` — this handoff.

`src/app/page.tsx` already renders `MarketingPage` and needed no edits from this agent. Existing modifications there predate this implementation. No shared, onboarding, workspace, package, or provider files were edited.

## Checks and responsive review

- Passed: `pnpm exec eslint src/app/page.tsx src/features/marketing` after the final source changes.
- Passed: `git diff --check -- src/app/page.tsx src/features/marketing docs/handoffs/marketing.md`.
- Chrome visual review at 1440 × 1000, 768 × 1024, 390 × 844, and 320 × 800. Document width matched viewport width at each measured breakpoint. At 320 px, inspected content/control bounds and found no overflow; added full-width composer buttons and a smaller header CTA for that narrow layout.
- Reviewed the complete desktop and mobile page, including preview, benefits, steps, FAQs, closing CTA, and footer. Tablet uses a stacked hero and compact header; mobile navigation stays visible without a menu drawer.
- Verified example fill uses the exact fixture prompt and focuses `move-prompt`.
- Verified a custom draft containing leading/trailing spaces, a newline, apostrophe, em dash, and ampersand matches the decoded onboarding URL exactly and appears unchanged in onboarding's textarea.
- Verified empty submission opens `/onboarding` with an empty textarea, and returning with browser Back leaves the composer submit action usable.
- Verified `/demo` navigation renders the public example. No workspace tasks, profiles, or existing local moves were modified during the check.
- Verified “How it works” and closing CTA anchor navigation. Keyboard Enter on the skip link focuses the main region; Enter on “Start a move” focuses the form, and the next Tab focuses its textarea. Enter opens the FAQ with a visible focus outline.
- Final full reload generated no new browser warnings or errors. Earlier hot-reload messages while the CSS module was being created were resolved.
- No production build or repository-wide checks were run; those remain assigned to the coordinator under `AGENTS.md`.

Local review captures (temporary artifacts, not production assets):

- [Desktop full page](/tmp/movable-marketing-desktop.jpg)
- [Mobile full page](/tmp/movable-marketing-mobile.jpg)
- [Desktop hero](/tmp/movable-marketing-hero.jpg)

## Shared changes requested

No marketing blockers or shared dependency changes needed.

During navigation testing, the onboarding browser title displayed `Plan your move · Movable · Movable`. The coordinator/onboarding owner should remove the duplicate brand suffix when integrating metadata; marketing's title displayed correctly. This is outside marketing ownership.

## Known limitations

- Preview content is intentionally static and illustrative. Interactive task changes belong to `/demo`.
- Browser tests used viewport emulation, not physical mobile devices or an on-screen mobile keyboard. Reduced-motion behavior was verified in the source rules, not through device preference emulation.
- No live services, country-coverage expansion, legal research, or account persistence were added. The site describes the current browser prototype.

Marketing is ready for integration: the page is complete, the composer handoff works, and focused lint plus responsive/keyboard checks pass.
