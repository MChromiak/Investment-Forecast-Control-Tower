# Investment Forecast Orchestration Control Tower

A client-facing demonstration of an end-to-end Investment Accounting forecast process: source intake, WBS mapping, validation, variance review, exception management, approvals, reconciled batch preparation, simulated SAC submission, reporting and audit evidence.

## Architecture

- React, TypeScript and Vite web application
- Express and TypeScript API under `/api`
- PostgreSQL persistence through Drizzle ORM
- OpenAPI-first contracts with generated React Query hooks and Zod validation
- Deterministic fictional finance data; no live external systems or AI services

All screens use one persisted control-tower state. Portfolio totals, readiness, exception counts and submission values are recalculated from forecast records after every workflow action.

## Install and run

Dependencies are managed with pnpm.

```bash
pnpm install
```

Run the managed workflows:

- `artifacts/api-server: API Server`
- `artifacts/investment-forecast-control-tower: web`

Useful checks:

```bash
pnpm run typecheck
pnpm run build
pnpm --filter @workspace/api-spec run codegen
```

## Seed and reset

The API creates deterministic seed data on first use. Use **Reset Current Scenario** to restore the selected scenario, **Restart Playback** to return presenter playback to step one without changing business data, or **Reset Demo** to restore the complete seeded environment.

## Guided scenarios

1. **Streamlined Forecast Pack** — Windermere Substation Modernisation; 18 clean rows progress to a reconciled simulated submission.
2. **CVR Forecast Rephasing** — Riverside Cable Reinforcement; £420,000 moves from September and October to November and December with annual net movement of £0.
3. **Forecast Pack with Exceptions** — Northgate Transmission Upgrade; exactly 24 rows, 19 initially clean, with invalid WBS, duplicate, unexplained overlay, material movement and source-total mismatch conditions.

## Assumptions

- September 2026 is the active forecast period.
- All projects, people, values and evidence are fictional.
- Business thresholds, routing, VOWD logic and approvals are illustrative and configurable.
- Monetary values use GBP and British English.
- Material and judgement-led items always retain human review.
- Held, blocked and excluded records do not enter submission totals.

## Simulated integrations

SAP, SAP Analytics Cloud (SAC), BlackLine, source-document processing and AI-assisted recommendations are simulated. The application does not connect to external services, transmit real client data, post journals or claim production security controls.