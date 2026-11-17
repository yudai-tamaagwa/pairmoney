
-- Pairmoney: base database schema
-- Run this file before 02_cloud_sync.sql.
-- Intended for a new Supabase project.

create extension if not exists pgcrypto;

-- 1. Households
create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- 2. Household members
create table if not exists public.household_members (
  household_id uuid not null
    references public.households(id) on delete cascade,
  user_id uuid not null
    references auth.users(id) on delete cascade,
  display_name text not null,
  primary key (household_id, user_id)
);

-- A user can belong to only one household.
create unique index if not exists household_members_one_household_per_user
on public.household_members(user_id);

-- 3. Transactions
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null
    references public.households(id) on delete cascade,
  owner_id uuid references auth.users(id),
  booked_on date not null,
  merchant text not null,
  amount_yen bigint not null check (amount_yen >= 0),
  kind text not null check (kind in ('income', 'expense')),
  category text not null default 'その他',
  external_id text,
  created_at timestamptz default now(),
  unique (household_id, external_id)
);

-- 4. Category rules
create table if not exists public.category_rules (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null
    references public.households(id) on delete cascade,
  keyword text not null,
  category text not null,
  priority integer not null default 100
);

-- 5. Savings goals
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null
    references public.households(id) on delete cascade,
  name text not null,
  target_yen bigint not null check (target_yen > 0),
  saved_yen bigint not null default 0 check (saved_yen >= 0),
  monthly_yen bigint not null default 0 check (monthly_yen >= 0)
);

-- 6. Goal votes
create table if not exists public.goal_votes (
  goal_id uuid not null
    references public.goals(id) on delete cascade,
  user_id uuid not null
    references auth.users(id) on delete cascade,
  approved boolean not null default false,
  primary key (goal_id, user_id)
);

-- 7. Financial connections
create table if not exists public.financial_connections (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null
    references public.households(id) on delete cascade,
  owner_id uuid not null references auth.users(id),
  provider text not null,
  provider_account_ref text not null,
  connection_status text not null default 'pending',
  last_synced_at timestamptz,
  unique (provider, provider_account_ref)
);

-- 8. Check household membership
create or replace function public.is_household_member(h uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.household_members m
    where m.household_id = h
      and m.user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_household_member(uuid)
from public, anon;

grant execute on function public.is_household_member(uuid)
to authenticated;

-- 9. Enable Row Level Security
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.transactions enable row level security;
alter table public.category_rules enable row level security;
alter table public.goals enable row level security;
alter table public.goal_votes enable row level security;
alter table public.financial_connections enable row level security;

-- 10. Household policies
create policy household_read
on public.households
for select to authenticated
using (public.is_household_member(id));

create policy members_read
on public.household_members
for select to authenticated
using (public.is_household_member(household_id));

-- 11. Transaction policies
create policy tx_member
on public.transactions
for all to authenticated
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

-- 12. Category rule policies
create policy rules_member
on public.category_rules
for all to authenticated
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

-- 13. Goal policies
create policy goals_member
on public.goals
for all to authenticated
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

-- 14. Goal vote policies
create policy votes_read
on public.goal_votes
for select to authenticated
using (
  exists (
    select 1
    from public.goals g
    where g.id = goal_id
      and public.is_household_member(g.household_id)
  )
);

create policy votes_write
on public.goal_votes
for insert to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.goals g
    where g.id = goal_id
      and public.is_household_member(g.household_id)
  )
);

create policy votes_update
on public.goal_votes
for update to authenticated
using (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.goals g
    where g.id = goal_id
      and public.is_household_member(g.household_id)
  )
)
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.goals g
    where g.id = goal_id
      and public.is_household_member(g.household_id)
  )
);

-- 15. Financial connection policies
create policy connections_read
on public.financial_connections
for select to authenticated
using (
  owner_id = (select auth.uid())
  and public.is_household_member(household_id)
);

-- Household creation and invitation are handled by
-- authenticated functions in 02_cloud_sync.sql.
-- Financial connection writes require a trusted backend.
