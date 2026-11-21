-- Saanjh v0.5: run once in a NEW Supabase project SQL Editor.
-- This is a minimal one-account/one-family JSON document MVP.
-- Data is not accessible to other signed-in users (RLS + per-user owner checks).
-- Do not use production child information until privacy and security reviews are complete.
create table if not exists public.saanjh_family_state (
 user_id uuid primary key references auth.users(id) on delete cascade,
 document jsonb not null,
 revision bigint not null default 1 check (revision > 0),
 updated_at timestamptz not null default now()
);
alter table public.saanjh_family_state enable row level security;
revoke all on public.saanjh_family_state from anon;
grant select,delete on public.saanjh_family_state to authenticated;
revoke insert,update on public.saanjh_family_state from authenticated;
drop policy if exists saanjh_owner_select on public.saanjh_family_state;
drop policy if exists saanjh_owner_insert on public.saanjh_family_state;
drop policy if exists saanjh_owner_update on public.saanjh_family_state;
drop policy if exists saanjh_owner_delete on public.saanjh_family_state;
create policy saanjh_owner_select on public.saanjh_family_state for select to authenticated using ((select auth.uid())=user_id);
create policy saanjh_owner_insert on public.saanjh_family_state for insert to authenticated with check ((select auth.uid())=user_id);
create policy saanjh_owner_update on public.saanjh_family_state for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy saanjh_owner_delete on public.saanjh_family_state for delete to authenticated using ((select auth.uid())=user_id);

-- Revision based write prevents accidental overwrite by a stale second device.
create or replace function public.saanjh_save_state(expected_revision bigint,new_document jsonb)
returns bigint language plpgsql security definer set search_path='' as $$
declare new_revision bigint;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if new_document is null or jsonb_typeof(new_document)<>'object' or pg_column_size(new_document)>1048576 then
  raise exception 'Invalid or oversized family document';
 end if;
 if expected_revision=0 then
  insert into public.saanjh_family_state(user_id,document,revision)
  values(auth.uid(),new_document,1) on conflict (user_id) do nothing
  returning revision into new_revision;
 else
  update public.saanjh_family_state
  set document=new_document,revision=revision+1,updated_at=now()
  where user_id=auth.uid() and revision=expected_revision
  returning revision into new_revision;
 end if;
 if new_revision is null then raise exception 'SYNC_CONFLICT' using errcode='40001';end if;
 return new_revision;
end $$;
revoke all on function public.saanjh_save_state(bigint,jsonb) from public,anon;
grant execute on function public.saanjh_save_state(bigint,jsonb) to authenticated;

-- Basic Gemini reply consumption budget, separate from the browser counter.
-- Important: a failed model request can still consume a quota unit. This is a beta control.
create table if not exists public.saanjh_usage_monthly (
 user_id uuid not null references auth.users(id) on delete cascade,
 period text not null check(period ~ '^[0-9]{4}-[0-9]{2}$'),
 reply_count integer not null default 0 check(reply_count>=0),
 primary key(user_id,period)
);
alter table public.saanjh_usage_monthly enable row level security;
revoke all on public.saanjh_usage_monthly from anon;
grant select on public.saanjh_usage_monthly to authenticated;
revoke insert,update,delete on public.saanjh_usage_monthly from authenticated;
drop policy if exists saanjh_usage_own_select on public.saanjh_usage_monthly;
drop policy if exists saanjh_usage_own_insert on public.saanjh_usage_monthly;
drop policy if exists saanjh_usage_own_update on public.saanjh_usage_monthly;
create policy saanjh_usage_own_select on public.saanjh_usage_monthly for select to authenticated using ((select auth.uid())=user_id);
create policy saanjh_usage_own_insert on public.saanjh_usage_monthly for insert to authenticated with check ((select auth.uid())=user_id);
-- User cannot lower the consumed count through the Data API; the RPC increments it.
create policy saanjh_usage_own_update on public.saanjh_usage_monthly for update to authenticated using (false) with check(false);

-- IMPORTANT: usage counter function can increment despite table update policy deny because
-- the function is SECURITY DEFINER and internally validates auth.uid().
create or replace function public.saanjh_claim_reply()
returns integer language plpgsql security definer set search_path='' as $$
declare new_count integer; period_key text;
begin
 if auth.uid() is null then raise exception 'Authentication required';end if;
 period_key := to_char(now() at time zone 'UTC','YYYY-MM');
 insert into public.saanjh_usage_monthly(user_id,period,reply_count)
 values(auth.uid(),period_key,1)
 on conflict (user_id,period) do update
 set reply_count=public.saanjh_usage_monthly.reply_count+1
 where public.saanjh_usage_monthly.reply_count<20
 returning reply_count into new_count;
 if new_count is null then raise exception 'MONTHLY_LIMIT_REACHED';end if;
 return 20-new_count;
end $$;
revoke all on function public.saanjh_claim_reply() from public,anon;
grant execute on function public.saanjh_claim_reply() to authenticated;
