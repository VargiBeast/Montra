# Supabase migrations

Filnavn **må** være `YYYYMMDDHHmmss_beskrivelse.sql` (14 siffer).

## Fikse "Remote migration versions not found"

```bash
# fra repo-roten, med prosjekt linket
bash scripts/fix-supabase-migrations.sh
```

Eller manuelt:

```bash
supabase migration list
supabase migration repair --status reverted 20261004 20261006
supabase migration repair --status applied 20261004000000 20261006000000 20261007200000
```

Dette endrer **ikke** data — bare historikk-tabellen CLI bruker.

## Nye migrations

```bash
supabase migration new min_endring
# rediger filen under supabase/migrations/
supabase db push   # når historikken er clean
```
