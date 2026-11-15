-- Run in Supabase SQL Editor. The React demo currently uses localStorage;
-- this schema is prepared for a later authenticated multi-user sync phase.
create extension if not exists pgcrypto;
create table if not exists households(id uuid primary key default gen_random_uuid(),name text not null,created_at timestamptz not null default now());
create table if not exists household_members(household_id uuid not null references households(id) on delete cascade,user_id uuid not null references auth.users(id) on delete cascade,display_name text not null,primary key(household_id,user_id));
create table if not exists transactions(id uuid primary key default gen_random_uuid(),household_id uuid not null references households(id) on delete cascade,owner_id uuid references auth.users(id),booked_on date not null,merchant text not null,amount_yen bigint not null check(amount_yen>=0),kind text not null check(kind in ('income','expense')),category text not null default 'その他',external_id text,created_at timestamptz default now(),unique(household_id,external_id));
create table if not exists category_rules(id uuid primary key default gen_random_uuid(),household_id uuid not null references households(id) on delete cascade,keyword text not null,category text not null,priority integer not null default 100);
create table if not exists goals(id uuid primary key default gen_random_uuid(),household_id uuid not null references households(id) on delete cascade,name text not null,target_yen bigint not null check(target_yen>0),saved_yen bigint not null default 0 check(saved_yen>=0),monthly_yen bigint not null default 0 check(monthly_yen>=0));
create table if not exists goal_votes(goal_id uuid not null references goals(id) on delete cascade,user_id uuid not null references auth.users(id) on delete cascade,approved boolean not null default false,primary key(goal_id,user_id));
create table if not exists financial_connections(id uuid primary key default gen_random_uuid(),household_id uuid not null references households(id) on delete cascade,owner_id uuid not null references auth.users(id),provider text not null,provider_account_ref text not null,connection_status text not null default 'pending',last_synced_at timestamptz,unique(provider,provider_account_ref));
create or replace function is_household_member(h uuid) returns boolean language sql stable security definer set search_path=public as $$select exists(select 1 from household_members m where m.household_id=h and m.user_id=(select auth.uid()))$$;
revoke all on function is_household_member(uuid) from public;
grant execute on function is_household_member(uuid) to authenticated;
alter table households enable row level security;
alter table household_members enable row level security;
alter table transactions enable row level security;
alter table category_rules enable row level security;
alter table goals enable row level security;
alter table goal_votes enable row level security;
alter table financial_connections enable row level security;
create policy household_read on households for select to authenticated using(is_household_member(id));
create policy members_read on household_members for select to authenticated using(is_household_member(household_id));
create policy tx_member on transactions for all to authenticated using(is_household_member(household_id)) with check(is_household_member(household_id));
create policy rules_member on category_rules for all to authenticated using(is_household_member(household_id)) with check(is_household_member(household_id));
create policy goals_member on goals for all to authenticated using(is_household_member(household_id)) with check(is_household_member(household_id));
create policy votes_read on goal_votes for select to authenticated using(exists(select 1 from goals g where g.id=goal_id and is_household_member(g.household_id)));
create policy votes_write on goal_votes for insert to authenticated with check(user_id=(select auth.uid()) and exists(select 1 from goals g where g.id=goal_id and is_household_member(g.household_id)));
create policy votes_update on goal_votes for update to authenticated using(user_id=(select auth.uid()) and exists(select 1 from goals g where g.id=goal_id and is_household_member(g.household_id))) with check(user_id=(select auth.uid()));
create policy connections_read on financial_connections for select to authenticated using(owner_id=(select auth.uid()) and is_household_member(household_id));
-- Household creation/invitation and financial connection writes must go through a trusted backend
-- that validates the signed-in user. No direct client write policies for these operations.
