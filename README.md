# Movable

Personal relocation workspace for university students moving within the EU.

## Run

```sh
pnpm install
pnpm dev
```

No credentials are needed for the current UI foundation. Open `/` for marketing, `/onboarding` to create a local move, `/app` for saved browser state, or `/demo` for an isolated example.

## Parallel build

Start with [docs/parallel-build.md](docs/parallel-build.md). It contains the three copy-ready agent prompts, ownership boundaries, shared API documentation, and coordinator review checklist. Read [AGENTS.md](AGENTS.md) for repository rules and [docs/plan.md](docs/plan.md) for product direction.

## Check

```sh
pnpm check
pnpm build
```

## Current service boundary

The public release currently uses the labeled browser prototype and isolated example. Its data stays in the browser.

The Clerk/Convex/OpenAI backend and live adapter are implemented and deployed to the development Convex instance. A live smoke test covers ownership isolation, extraction, plan generation, task updates, conversation changes, retry handling and message drafting. The feature UI still has explicit live-mode guards; keep local mode until its owners apply the reviewed integration changes. See [the integration handoff](docs/live-integration.md).

See `.env.example` for the intended environment variables. Do not commit secrets.
