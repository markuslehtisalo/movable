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

The live release connects Clerk sign-in, Convex account storage, and OpenAI assistance. `/demo` remains an isolated, scripted example. `NEXT_PUBLIC_MOVABLE_MODE=local` still runs the browser-only prototype without credentials.

The backend is deployed to the development Convex instance. A live smoke test covers ownership isolation, extraction, plan generation, task updates, conversation changes, retry handling and message drafting. Onboarding preserves text through sign-in and scopes saved build attempts by account. See [the integration handoff](docs/live-integration.md).

See `.env.example` for the intended environment variables. Do not commit secrets.
