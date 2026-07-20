#!/usr/bin/env bash
#
# One-shot Turso setup for Cozy Planner.
# Creates a database, prints the URL + auth token to put in .env / Vercel,
# then applies the schema (and optionally seeds sample data).
#
# Prereqs: the Turso CLI, logged in.
#   curl -sSfL https://get.tur.so/install.sh | bash   # install
#   turso auth login
#
# Usage:  ./scripts/setup-turso.sh [db-name]   (default: cozy-planner)
#
set -euo pipefail

DB_NAME="${1:-cozy-planner}"

if ! command -v turso >/dev/null 2>&1; then
  echo "✗ Turso CLI not found. Install it: https://docs.turso.tech/cli/installation" >&2
  exit 1
fi

echo "→ Creating Turso database: $DB_NAME"
turso db create "$DB_NAME" 2>/dev/null || echo "  (database may already exist — continuing)"

URL="$(turso db show "$DB_NAME" --url)"
TOKEN="$(turso db tokens create "$DB_NAME")"

echo
echo "────────────────────────────────────────────────────────────"
echo "Add these to your local .env AND to Vercel → Settings → Env:"
echo
echo "  TURSO_DATABASE_URL=$URL"
echo "  TURSO_AUTH_TOKEN=$TOKEN"
echo "────────────────────────────────────────────────────────────"
echo

echo "→ Applying schema (migrations)…"
TURSO_DATABASE_URL="$URL" TURSO_AUTH_TOKEN="$TOKEN" npm run db:migrate

read -r -p "→ Seed sample todos/events? [y/N] " ans
if [[ "$ans" =~ ^[Yy]$ ]]; then
  TURSO_DATABASE_URL="$URL" TURSO_AUTH_TOKEN="$TOKEN" npm run db:seed
fi

echo "✓ Turso is ready. Don't forget to also set GROQ_API_KEY (and optionally GROQ_MODEL) in Vercel."
