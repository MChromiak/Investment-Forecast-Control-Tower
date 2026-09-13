# Investment Forecast Orchestration Control Tower

Enterprise finance demonstration for WBS forecast intake, variance management, controlled approvals and simulated SAC submission.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/investment-forecast-control-tower run dev` — run the web app through its managed workflow
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/investment-forecast-control-tower/` — web application
- `artifacts/api-server/src/routes/control-tower.ts` — deterministic workflow service and seed state
- `lib/api-spec/openapi.yaml` — API contract
- `lib/db/src/schema/control-tower.ts` — persisted control-tower state

## Architecture decisions

- The demo uses one persisted aggregate state so every route shows the same records and calculations.
- All external finance systems and AI capabilities are simulated; no integration is required.
- Workflow state is derived from record validation, review and submission fields rather than free-form board movement.
- Seed timestamps, receipt references and financial scenarios are deterministic.

## Product

Eleven routed work areas cover portfolio oversight, forecast-cycle operations, documents and source evidence, WBS forecasts, exceptions, VOWD support, SAC submission, reporting, audit evidence, guided scenarios and configurable illustrative rules.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Re-run OpenAPI codegen after changing `lib/api-spec/openapi.yaml`.
- Use the managed workflows so `PORT`, `BASE_PATH` and reverse-proxy routing are present.
- Do not represent simulated SAP, SAC, BlackLine or AI behavior as live connectivity.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
