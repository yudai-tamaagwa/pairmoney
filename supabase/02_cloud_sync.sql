-- Run after schema.sql. For a NEW Supabase project.
-- Shared document with optimistic version checks. Do not use service_role in the browser.
create table if not exists public.household_data (
 household_id uuid primary key references public.households(id) on delete cascade,
 data jsonb not null,
 version bigint not null default 1,
 updated_at timestamptz not null default now()
);
alter table public.household_data enable row level security;
create policy household_data_read on public.household_data for select to authenticated using(public.is_household_member(household_id));
-- Writes are only through authenticated SECURITY DEFINER functions with membership checks.
alter table public.households add column if not exists invite_code text unique default encode(gen_random_bytes(16),'hex');
-- Existing households get codes, if any.
update public.households set invite_code=encode(gen_random_bytes(16),'hex') where invite_code is null;
alter table public.households alter column invite_code set not null;

create or replace function public.create_household(p_name text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare h uuid; u uuid := auth.uid();
begin
 if u is null then raise exception 'Authentication required'; end if;
 if length(trim(p_name)) not between 1 and 80 then raise exception 'Invalid household name'; end if;
 if exists(select 1 from public.household_members where user_id=u) then raise exception 'Already in a household'; end if;
 insert into public.households(name) values(trim(p_name)) returning id into h;
 insert into public.household_members(household_id,user_id,display_name) values(h,u,'自分');
 insert into public.household_data(household_id,data) values(h,jsonb_build_object(
  'members',jsonb_build_array('自分','パートナー'),
  'transactions','[]'::jsonb,'goals','[]'::jsonb,
  'rules',jsonb_build_array(jsonb_build_object('id','r1','keyword','スーパー','category','食費'),jsonb_build_object('id','r2','keyword','ドラッグ','category','日用品')),
  'settings',jsonb_build_object('shareRatio',50,'monthlyReserve',60000)));
 return h;
end $$;

create or replace function public.join_household(p_code text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare h uuid; u uuid := auth.uid();
begin
 if u is null then raise exception 'Authentication required'; end if;
 if exists(select 1 from public.household_members where user_id=u) then raise exception 'Already in a household'; end if;
 select id into h from public.households where invite_code=p_code;
 if h is null then raise exception 'Invalid invitation code'; end if;
 perform 1 from public.households where id=h for update;
 if (select count(*) from public.household_members where household_id=h)>=2 then raise exception 'Household is full'; end if;
 insert into public.household_members(household_id,user_id,display_name) values(h,u,'パートナー');
 return h;
end $$;

create or replace function public.save_household_data(p_household uuid,p_version bigint,p_data jsonb)
returns bigint language plpgsql security definer set search_path = '' as $$
declare v bigint;
begin
 if auth.uid() is null or not public.is_household_member(p_household) then raise exception 'Not authorized'; end if;
 if jsonb_typeof(p_data) <> 'object' or jsonb_typeof(p_data->'transactions') <> 'array' or jsonb_typeof(p_data->'goals') <> 'array' or jsonb_typeof(p_data->'rules') <> 'array' or jsonb_typeof(p_data->'members') <> 'array' or jsonb_typeof(p_data->'settings') <> 'object' then raise exception 'Invalid data'; end if;
 if pg_column_size(p_data)>1000000 then raise exception 'Data too large'; end if;
 update public.household_data set data=p_data,version=version+1,updated_at=now()
 where household_id=p_household and version=p_version returning version into v;
 if v is null then raise exception 'Version conflict: another device has newer changes'; end if;
 return v;
end $$;
revoke all on function public.create_household(text) from public,anon;
revoke all on function public.join_household(text) from public,anon;
revoke all on function public.save_household_data(uuid,bigint,jsonb) from public,anon;
grant execute on function public.create_household(text),public.join_household(text),public.save_household_data(uuid,bigint,jsonb) to authenticated;
-- Enable Supabase Realtime for the table in Dashboard > Database > Publications.
