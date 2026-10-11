#!/usr/bin/env bash
# Align local migration history with remote after renaming short version prefixes.
# Safe: does NOT reset data or change schema — only repairs migration version bookkeeping.
set -euo pipefail

cd "$(dirname "$0")/.."

if ! command -v supabase >/dev/null 2>&1; then
  echo "Install Supabase CLI first: https://supabase.com/docs/guides/cli"
  exit 1
fi

echo "→ Migration list (before repair):"
supabase migration list || true

echo
echo "→ Marking old short versions as reverted (if present on remote):"
supabase migration repair --status reverted 20261004 20261006 2>/dev/null || true

echo
echo "→ Marking new full-timestamp versions as already applied (schema already exists):"
supabase migration repair --status applied 20261004000000 20261006000000 20261007200000 2>/dev/null || true

echo
echo "→ Migration list (after repair):"
supabase migration list || true

echo
echo "Done. If you still see Remote-only versions, create empty files for them:"
echo "  touch supabase/migrations/<VERSION>_remote_history.sql"
echo "  echo '-- already on remote' > supabase/migrations/<VERSION>_remote_history.sql"
echo "  supabase migration repair --status applied <VERSION>"
