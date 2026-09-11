# Robohorse API

This is the API server for the Robohorse game, designed to work with PostgreSQL and Phusion Passenger.

## Deployment Instructions

### Prerequisites
- Node.js 24
- PostgreSQL database (using Neon.tech)
- Phusion Passenger

### Setup

1. Ensure the `.env` file exists with the following variables:
   ```
   PORT=4270
   NODE_ENV=production
   DATABASE_URL=your_postgresql_connection_string
   ```

2. Install dependencies:
   ```
   pnpm install
   ```

3. The API is configured to work with Phusion Passenger using the following files:
   - `passenger_wrapper.cjs` - CommonJS entry point for Passenger
   - `app.js` - Main Express application

### Nginx Configuration

The API is configured to be served at `/robohorse/api` path. The Nginx configuration should include:

```
location /robohorse/api {
    passenger_enabled on;
    passenger_app_root /var/www/games.smoxu.com/robohorse/api;
    passenger_nodejs /usr/bin/node;
    passenger_startup_file passenger_wrapper.cjs;
}
```

### Troubleshooting

- Check Passenger logs: `/var/log/nginx/error.log`
- Ensure database connection is working
- Verify environment variables are properly loaded

After upgrading, update `passenger_startup_file` to `passenger_wrapper.cjs` and reload Nginx before restarting Passenger. The standalone server (`pnpm start` from the repository root) listens in both development and production. `/api/health` checks HTTP availability only, not database readiness.

### Database migrations

Run `pnpm setup-db` from the repository root with `DATABASE_URL` set. Migrations run in a transaction with an advisory lock and a version ledger. The initial migration preserves legacy `name` values by renaming the column to `player_id`, adds the game identifier, and creates the leaderboard index. New-write constraints preserve existing rows for a separate historical-data audit.

Use `sslmode=verify-full` in hosted PostgreSQL connection URLs. Local PostgreSQL can omit TLS options. Runtime and setup no longer disable certificate verification. Tests use temporary PGlite PostgreSQL databases and never connect to production.

Score submission accepts only `{name, score}` for `robohorse-v1`; the old arbitrary-game test payload is intentionally rejected. The in-process limit is 10 submissions per IP per minute. With multiple workers, add a shared edge limit. Keep Express proxy trust disabled unless the exact trusted proxy topology is configured; otherwise forwarded IP headers can be spoofed. This limit and validation do not establish score authenticity.

### Workspace dependencies

Install from the repository root using `pnpm install --frozen-lockfile`. The root `pnpm-lock.yaml` owns both packages; the API declares its runtime dependencies in `api/package.json`. API deployment must include the root package manifest, workspace manifest and lockfile alongside the API directory. The server-side `api/deploy.sh` performs that installation and migrations before restarting Passenger, and stops on any failed command. Frontend sync protects these manifests.
