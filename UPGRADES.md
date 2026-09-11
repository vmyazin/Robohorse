# Upgrade completion evidence

All implementation batches are committed individually. Live deployment and production database changes were not part of this local implementation run.

| Requirement | Implementation and verification |
| --- | --- |
| Repair/consolidate startup | Shared `api/app.js`, standalone launcher and CommonJS Passenger wrapper; both startup paths pass HTTP tests. |
| Protect deployment destinations | Frontend sync exclusions tested against a temporary filesystem; complete releases use staged directories and atomic symlink activation. |
| Versioned database schema | Transactional migration ledger, advisory lock, legacy-name preservation, new-write constraints and leaderboard index; fresh/legacy PostgreSQL tests and HTTP-to-PostgreSQL score tests pass using PGlite. |
| Fixed-step gameplay | `FixedStepClock.ts` produces equal ticks at 30/60/120/144 Hz with bounded catch-up; level manager no longer updates obstacle state twice. Effects update outside rendering. |
| API boundaries | Typed score router validates names and integer scores, rejects arbitrary-game writes, limits submission rate, bounds body size and hides database error details. TLS verification is no longer disabled in code; hosted URLs must specify `sslmode=verify-full`. |
| Incremental TypeScript | Strict checks cover clock, combat/entity interfaces, effects, HUD, session state, score service, audio pool and API router. `allowJs`/`checkJs` also check the existing Enemy entity. This is incremental migration, not conversion of every legacy file. |
| Vite 8 | Webpack/Babel removed; build emits hashed assets under `/robohorse/`, copies dynamic media and serves immutable hashed assets. Browser tests use built artifacts. |
| Reproducible dependencies | Node version file and pnpm version pin; one workspace lockfile with API runtime dependency ownership. Frozen production-only install verified in a staged release. |
| CI and releases | Workflow runs typecheck, unit/database tests, Chromium tests, production build and release-artifact verification. Release tests cover failed preparation and failed activation rollback. Real remote Passenger/Nginx activation is not exercised locally. |
| Architecture | World simulation/rendering separated; typed combat, HUD/session, effects and score-service responsibilities extracted. See `ARCHITECTURE.md` for remaining shared-state coupling. |
| Browser lifecycle | Chromium verifies start, simulation, game-over, pause/resume, mission completion, score load failure, single click submission, submission failure and keyboard restart. Gameplay screenshot inspected; duplicate canvas score removed. |
| Performance | Repeatable starting-scene draw benchmark and audio allocation workload documented in `PERFORMANCE.md`; 100 sound requests now allocate at most eight voices. No renderer rewrite was justified. |

## Verification commands

- `pnpm install --frozen-lockfile`
- `pnpm typecheck`
- `pnpm test` (19 unit/integration tests)
- `pnpm test:e2e` (6 Chromium tests)
- `pnpm build`
- `pnpm verify:release`
- `git diff --check`

## Operational limits

The rate limiter is process-local and does not prove score authenticity. Multiple workers require an edge/shared limit. Migrations must remain backward compatible because application rollback does not undo schema changes. PGlite verifies PostgreSQL behavior without testing a live Neon connection. The performance check is a starting-scene desktop benchmark, not mobile/full-level certification. Remote CI and deployment must be run in their actual environments.
