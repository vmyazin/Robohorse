#!/bin/bash
set -euo pipefail

# Run on the server from a full checkout. Both packages share the root lockfile.
SOURCE_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEPLOY_ROOT="${ROBOHORSE_DEPLOY_ROOT:-/var/www/games.smoxu.com/robohorse}"
mkdir -p "$DEPLOY_ROOT/api"
rsync -a --exclude=node_modules --exclude=.env "$SOURCE_ROOT/api/" "$DEPLOY_ROOT/api/"
for manifest in package.json pnpm-lock.yaml pnpm-workspace.yaml .node-version; do
    cp "$SOURCE_ROOT/$manifest" "$DEPLOY_ROOT/$manifest"
done
cd "$DEPLOY_ROOT"
pnpm install --prod --frozen-lockfile
node api/db/setup.js
passenger-config restart-app "$DEPLOY_ROOT/api"
