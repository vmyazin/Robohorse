# Cloudflare migration

The target is one Cloudflare Worker with Static Assets and a D1 leaderboard. The existing Vite build, Alpine UI, `/robohorse/` URL, and score API contract remain intact. PostgreSQL/Passenger files remain available for the old deployment until data verification and traffic cutover are complete.

## Local development and verification

- `pnpm dev:cloudflare`: build assets, migrate local D1, and start Wrangler.
- `pnpm test:cloudflare`: start an isolated local D1 database and run the game browser suite plus real Worker/D1 API tests. No Cloudflare account or production database is used.
- `pnpm check:cloudflare`: production build and deployment dry run.
- `pnpm typecheck` and `pnpm test`: shared API validation and PostgreSQL-to-SQLite export verification, alongside existing checks.

`wrangler.jsonc` deliberately contains a local-only database ID. Deployment requires the real account/database configuration below. Test state and exports are ignored by Git. Only the generated frontend artifact is uploaded as static assets; API source and environment files are outside that directory.

## Account setup and preview

1. Authenticate with `pnpm exec wrangler login`, then confirm the account with `pnpm exec wrangler whoami`.
2. Create the destination: `pnpm exec wrangler d1 create robohorse-scores`. Put the returned `database_id` in `wrangler.jsonc`. If multiple accounts are available, set the intended `account_id` too. Verify that rate-limit namespace `4270` is unused by other Workers, or assign an unused positive integer.
3. Apply the schema: `pnpm exec wrangler d1 migrations apply DB --remote`.
4. The `preview` environment uses the separate `robohorse-scores-preview` database in the Rapid Systems account. Apply its schema with `pnpm exec wrangler d1 migrations apply DB --remote --env preview`, then deploy with `pnpm build:cloudflare && pnpm exec wrangler deploy --env preview`. This publishes `robohorse-preview` on workers.dev. The default production binding remains a placeholder until the final database is created; `pnpm deploy:cloudflare` targets that default environment. Keep preview scores separate from the production import destination.
5. Verify gameplay, audio, menu/retry, and score submission. The health endpoint queries D1, so it detects a missing schema or unusable binding.

## Preserve existing scores and cut over

Choose the final domain/route before switching traffic. Existing `/robohorse/*` links work; the root of a dedicated hostname redirects to `/robohorse/`. For a shared hostname, route only the game prefix so other applications are unaffected. No custom domain, DNS record, or Worker route is configured automatically.

1. Keep the PostgreSQL service and old deployment available. Pause score writes on the old service during the final export/import to prevent scores arriving after the snapshot. Also keep the destination free of writes until verification completes.
2. Create a new ignored parent directory with `mkdir -p score-export`. With `DATABASE_URL` supplied securely in the environment, run `node api/db/export-d1.js score-export/final`. The exporter uses a read-only repeatable-read transaction and writes `scores.sql` and `verification.json`. It supports both the legacy `name` and migrated `player_id` column. Invalid/unrepresentable historical data stops the export for an explicit audit; it is never silently discarded.
3. Confirm the destination table is empty: `pnpm exec wrangler d1 execute DB --remote --command "SELECT COUNT(*) AS rows FROM scores"`. Use a fresh destination database if preview scores exist. Do not delete historical scores to make room.
4. Import: `pnpm exec wrangler d1 execute DB --remote --file score-export/final/scores.sql`. Inserts preserve IDs and fail on conflicts; do not blindly retry a partially applied import. Inspect the destination or restart with a fresh database. The import is not assumed to be one atomic transaction.
5. Compare `SELECT COUNT(*) AS rows FROM scores` and `SELECT player_id AS name, score FROM scores WHERE game_id = 'robohorse-v1' ORDER BY score DESC, id ASC LIMIT 10` against `verification.json`. Retain the export as the migration backup. For a full row audit, export D1 to SQL and compare IDs, names, game IDs, scores, and timestamps against the source snapshot before retiring PostgreSQL.
6. Deploy the final Worker configuration, verify `/robohorse/api/health`, and switch the chosen route/domain. Unpause writes only on the destination. Test one real submission and confirm its appearance in D1.
7. Keep the old database read-only through the rollback window. If rolling back after accepting D1 writes, reconcile those new rows into PostgreSQL first; switching DNS alone would lose those scores. Retire PostgreSQL only after verification and the rollback window.

## Operations

- `pnpm exec wrangler d1 export DB --remote --output <backup.sql>` creates a portable backup. Keep exports outside Git and outside static assets. Configure a recurring off-platform backup for the production account and test restoration. D1 Time Travel provides an additional recovery mechanism; retention depends on the account plan.
- Use `pnpm exec wrangler tail` and Cloudflare observability to inspect errors and HTTP 429 responses.
- Score submissions retain the previous 10-per-IP-per-minute policy through a Workers rate-limit binding. These counters are per Cloudflare location and eventually consistent, not a strict global quota. Shared networks may share a limit. Names remain display names, not player identities, and this migration does not make client-submitted scores cheat-proof.
- Frontend player names remain in sessionStorage; they are not database credentials or authenticated identities.

References: [Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/), [D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/), [D1 import/export](https://developers.cloudflare.com/d1/best-practices/import-export-data/), [Workers rate limiting](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/).
