# Movable Improvement

Implement one focused improvement pass that makes Movable’s guidance specific to the student, traceable to sources, and actionable. Build on the existing marketing, onboarding, workspace, and adapter architecture.
Outcome: A visitor can explore two realistic exchange-student scenarios without signing in, understand which guidance applies, inspect its evidence, and identify their next action.

1. Finish integration before expanding scope

- Read the three feature handoffs and inspect current work, including any live integration already underway.
- Preserve completed functionality, saved moves, and existing onboarding drafts.
- Resolve outstanding integration issues and establish passing checks.
- Do not launch additional agents. Implement this pass centrally, coordinating with any still-active feature owners.

2. Establish a small, verified content set
   Research these two scenarios using current official government and university sources:
   Scenario Required content
   Non-EU exchange student arriving in Finland Student healthcare eligibility, public healthcare eligibility factors, insurance, and where to seek further help
   Finnish exchange student going to Taiwan University housing routes, private rental verification, contracts/deposits, and help with local-language listings

Define a complete sample profile for each scenario, including citizenship, residence, host institution, exchange status, and stay length. Include additional eligibility facts where the sources require them.
Treat the team’s statements as research leads. In particular, do not ship blanket claims about non-EU students’ healthcare access, the Taiwan insurance waiting period, scam prevalence, or licensing without checking them.
Start with approximately 4–6 useful guidance items per scenario. If evidence is insufficient, mark the answer unresolved and provide an authoritative contact or next step.
Verify InfoFinland’s reuse terms before copying content; include the required attribution where used. Do not add competitor comparisons or interview contact information to the product. 3. Extend shared contracts for applicability and evidence
Inspect src/lib/movable/contracts.ts, fixtures, selectors, and adapters first. Reuse existing source fields where possible.
Add only the shared structure needed to represent:

- Who an item applies to, including relevant eligibility conditions.
- A short “Why this applies to you” explanation.
- Source publisher, title, URL, and source category.
- Source update date when available; actual review date separately.
- Whether the guidance is supported, conditional, or unresolved.
- The next action and required information/documents.
  Keep publisher authority separate from verification status. An official URL alone does not verify Movable’s interpretation.
  Make changes compatible with existing persisted local data. Old records without evidence must display an honest “Not yet checked” state rather than gaining a trust badge automatically.

4. Add two selectable public examples
   Extend /demo with two clearly labeled scenario choices:

- Healthcare in Finland
- Housing in Taiwan
  Each opens a coherent sample workspace with the relevant profile, tasks, and sources.
  Requirements:
- No login required.
- Demo changes remain in memory and never modify the local or authenticated workspace.
- Reset restores the selected scenario.
- Existing demo behavior remains available or is deliberately migrated without broken links.
- Any scripted assistant behavior is explicitly labeled. Do not present scripted responses as researched or live AI.
- Sample coverage does not silently imply that arbitrary Finland/Taiwan profiles are supported by onboarding or a live adapter.

5. Put applicability and trust inside the task experience
   Update the existing task cards/drawer rather than building a separate knowledge portal.
   For each sourced guidance item, show:
1. What applies to you
1. Why it applies
1. What to do next
1. What you need
1. Sources and date checked
   Keep the card compact; place detailed evidence and conditions in the drawer.
   For unresolved questions, show the missing fact or uncertainty and a ready-to-copy question for the relevant university or authority. Housing tasks should include sourced checks before payment and practical options for students arranging accommodation remotely.
   Do not invent deadlines, universal deposit rules, or verified-provider badges.
1. Align the entry experience

- Add direct marketing links to the two examples.
- Explain the benefit plainly: guidance matched to the student’s situation, with sources they can inspect.
- Retain visible prototype/live-environment disclosures appropriate to the actual implementation.
- Keep basic example guidance publicly readable.
- Change onboarding only where necessary to capture eligibility information used by implemented guidance. Avoid a longer speculative questionnaire.
  Stretch goal only after the core passes: a readable print/save-as-PDF plan containing tasks and source links.

7. Verify the improvement
   Add focused regression coverage for:

- Scenario selection and reset.
- Demo/local isolation.
- Applicability conditions and missing-information states.
- Honest rendering of old or unsourced records.
- Preservation of completed tasks and saved profiles.
  Run:
  pnpm check
  pnpm exec tsx --test src/features/onboarding/onboarding.test.ts
  pnpm build
  Review at 390, 768, and 1440 px, including keyboard navigation, source links, task drawers, scenario switching, and the existing onboarding-to-workspace flow.
  If live integration is included in the release, retain its authentication and two-account isolation checks.
  Acceptance criteria
- Both public scenarios work without login.
- Every factual guidance item in those scenarios has supporting evidence or an explicit unresolved state.
- A student can explain why an item applies and identify the next action.
- Source links support the associated claims; review dates reflect actual review.
- No demo interaction changes saved user work.
- Existing onboarding, task completion, refresh persistence, and environment notices still work.
- Required checks pass.
  Write docs/handoffs/improvement-pass.md with implemented changes, source-review notes, checks, screenshots, remaining uncertainties, and deployment readiness.
  Priority order: verified content → applicability/evidence model → two working examples → task presentation → marketing alignment → optional printable plan. Defer community features, landlord reviews, native apps, and broad country expansion.
