#!/bin/sh
set -e

echo "==> Running Alembic migrations..."
alembic -c alembic.ini upgrade head

echo "==> Starting uvicorn (workers=${WORKERS:-2})..."
exec uvicorn main:app \
    --host 0.0.0.0 \
    --port 8000 \
    --workers "${WORKERS:-2}" \
    --proxy-headers \
    --forwarded-allow-ips='*'
