---
name: Saldo data safety
description: Durable constraints for Saldo's existing personal finance data and Supabase project.
---

Saldo's existing Supabase project contains real user data and remains the source of truth. Preserve the existing transactions table, private purchase-images bucket, and user privacy policies; do not reset, replace, or destructively migrate them. The user specified this directly.

**Why:** Existing transaction history is personal financial data, and the user explicitly prohibited deleting or replacing it.

**How to apply:** Avoid schema, RLS, or storage-policy changes unless genuinely required. Explain any necessary database change and provide its SQL before making it. Keep account ownership derived from the authenticated session.