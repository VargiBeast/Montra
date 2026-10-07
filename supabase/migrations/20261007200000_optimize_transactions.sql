-- Optimize the main transactions list query:
-- WHERE user_id = ... ORDER BY date DESC, created_at DESC
create index if not exists transactions_user_date_created_idx
  on public.transactions (user_id, date desc, created_at desc);

-- Keep the existing RLS behavior unchanged while allowing auth.uid()
-- to be evaluated once per statement instead of once per row.

drop policy if exists "Users can view their own transactions" on public.transactions;
create policy "Users can view their own transactions"
  on public.transactions
  for select
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own transactions" on public.transactions;
create policy "Users can create their own transactions"
  on public.transactions
  for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own transactions" on public.transactions;
create policy "Users can update their own transactions"
  on public.transactions
  for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own transactions" on public.transactions;
create policy "Users can delete their own transactions"
  on public.transactions
  for delete
  using ((select auth.uid()) = user_id);
