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
