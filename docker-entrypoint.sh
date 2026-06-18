#!/bin/sh
set -e

# Apply pending database migrations before starting the server.
# Set RUN_MIGRATIONS=false to skip (e.g. when migrations run as a separate job).
if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  echo "→ Applying database migrations (prisma migrate deploy)…"
  node node_modules/prisma/build/index.js migrate deploy
fi

echo "→ Starting server…"
exec "$@"
