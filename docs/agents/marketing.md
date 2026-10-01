# Marketing agent brief

Build a memorable, polished Movable marketing site using the shared foundation. Read `AGENTS.md` and `docs/parallel-build.md` first. Implement now; do not stop at a proposal.

## Files you own

- `src/app/page.tsx`
- `src/features/marketing/**`
- `public/marketing/**`
- `docs/handoffs/marketing.md`

Everything else is read-only for this task. Shared theme, icon, metadata, brand primitive, packages, and providers are coordinator-owned. Do not import onboarding or workspace components.

## Experience to build

- Compact navigation with Brand, How it works, Explore example, and a primary start action.
- Strong editorial hero: “Your next chapter, with a plan.” Make the purpose clear in one sentence.
- Prominent move composer with `EXAMPLE_PROMPT`, an example-fill action, and Plan my move.
- Preserve typed input with `onboardingHref(text)` and navigate to its returned URL. The helper also saves the session draft. Navigation alone must work without a backend.
- A compelling but explicitly labeled example product preview. Use `MoveSummary` and fixture data; compose a compact next-action and plan-change illustration in your own directory.
- Three concrete benefits, a three-step explanation, a short FAQ, and a final CTA.
- Explore example goes to `/demo`. A returning-user link may say Open my move and go to `/app`; do not invent a sign-in flow.
- Product copy must not claim broad verified country coverage, live AI, or actions the current prototype cannot perform. Describe the intended value while making the example status clear.

## Quality bar

Give the site a recognizable visual identity through typography, spacing, route imagery, and composition. Use the common semantic tokens; a feature-local SVG or CSS module is fine. No fake customer logos, testimonials, or metrics. Avoid decorative complexity that hides the product.

Check desktop and mobile; make composer labels, focus states, CTA hierarchy, and anchor navigation work. Do not create placeholder links. Add only subtle reduced-motion-aware effects after the core layout works.

## Finish

Run `pnpm exec eslint src/app/page.tsx src/features/marketing`. Write your handoff with implemented sections, responsive checks, changed files, and any shared requests. Leave the app and onboarding agents' files alone.
