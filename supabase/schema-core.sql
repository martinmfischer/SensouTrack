
create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  payload jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists games_owner_created on public.games(user_id,created_at);
-- RLS also checks the managed Auth session so logout revokes access immediately,
-- even while an old signed access token has not expired yet.
create schema if not exists private;
revoke all on schema private from public,anon,authenticated;
grant usage on schema private to authenticated;
create or replace function private.account_access() returns boolean
language sql stable security definer set search_path='' as $$
  select exists(select 1 from auth.sessions s join auth.users u on u.id=s.user_id
    where s.id::text=auth.jwt()->>'session_id' and s.user_id=auth.uid()
      and s.created_at>now()-interval '12 hours' and u.email_confirmed_at is not null);
$$;
revoke all on function private.account_access() from public,anon,authenticated;
grant execute on function private.account_access() to authenticated;
create or replace function public.account_security_status() returns boolean
language sql stable security invoker set search_path='' as $$ select private.account_access(); $$;
revoke all on function public.account_security_status() from public,anon,authenticated;
grant execute on function public.account_security_status() to authenticated;
create unique index if not exists games_no_duplicate on public.games(user_id,md5(payload::text));
alter table public.games enable row level security;
revoke all on public.games from anon,authenticated;
grant select,delete on public.games to authenticated;
grant insert(payload) on public.games to authenticated;
drop policy if exists read_own_games on public.games;
create policy read_own_games on public.games for select to authenticated using ((select auth.uid())=user_id and (select private.account_access()));
drop policy if exists insert_own_games on public.games;
create policy insert_own_games on public.games for insert to authenticated with check ((select auth.uid())=user_id and (select private.account_access()));
drop policy if exists delete_own_games on public.games;
create policy delete_own_games on public.games for delete to authenticated using ((select auth.uid())=user_id and (select private.account_access()));

create or replace function public.validate_game_payload() returns trigger
language plpgsql security definer set search_path='' as $$
declare p jsonb := new.payload;
begin
  if jsonb_typeof(p) <> 'object' or not (p ?& array['ownFaction','ownTheme','opponentFaction','opponentTheme','ownVp','opponentVp','date','scenario','rice','format','notes'])
    or (select count(*) from jsonb_object_keys(p)) <> 11 then raise exception 'Invalid game fields.'; end if;
  if not exists(select 1 from public.allowed_themes where faction=p->>'ownFaction' and theme=p->>'ownTheme')
    or not exists(select 1 from public.allowed_themes where faction=p->>'opponentFaction' and theme=p->>'opponentTheme') then raise exception 'Invalid faction or theme.'; end if;
  if jsonb_typeof(p->'ownVp') <> 'number' or jsonb_typeof(p->'opponentVp') <> 'number'
    or p->>'ownVp' !~ '^[0-3]$' or p->>'opponentVp' !~ '^[0-3]$'
    or (p->>'ownVp')::int + (p->>'opponentVp')::int > 3 then raise exception 'Both VP scores must total 3 or less.'; end if;
  if jsonb_typeof(p->'scenario') <> 'string' or p->>'scenario' not in (/* SCENARIOS */) then raise exception 'Invalid scenario.'; end if;
  if jsonb_typeof(p->'date') <> 'string' or p->>'date' !~ '^\d{4}-\d{2}-\d{2}$'
    or (p->>'date')::date < date '2000-01-01' or (p->>'date')::date > current_date + 1 then raise exception 'Invalid game date.'; end if;
  if jsonb_typeof(p->'rice') <> 'number' or p->>'rice' not in ('50','75','100') then raise exception 'Invalid Rice size.'; end if;
  if jsonb_typeof(p->'format') <> 'string' or p->>'format' not in ('Casual','Tournament') then raise exception 'Invalid game type.'; end if;
  if jsonb_typeof(p->'notes') <> 'string' or length(p->>'notes') > 500 then raise exception 'Notes must be 500 characters or less.'; end if;
  -- Serializes submissions by one account so parallel inserts cannot bypass the cap.
  perform pg_advisory_xact_lock(hashtextextended(new.user_id::text,0));
  if (select count(*) from public.games where user_id=new.user_id and created_at>now()-interval '15 minutes') >= 40 then raise exception 'Too many game reports. Try again in 15 minutes.'; end if;
  return new;
end; $$;
revoke all on function public.validate_game_payload() from public,anon,authenticated;
drop trigger if exists validate_game_before_insert on public.games;
create trigger validate_game_before_insert before insert on public.games for each row execute function public.validate_game_payload();

-- Deliberate owner-rights public projection: no user ID, email, name, timestamps or private notes.
-- Base-table RLS still restricts authenticated users to their own full records.
create or replace view public.public_games with (security_barrier=true) as
  select id, jsonb_build_object(
    'ownFaction',payload->'ownFaction','ownTheme',payload->'ownTheme',
    'opponentFaction',payload->'opponentFaction','opponentTheme',payload->'opponentTheme',
    'ownVp',payload->'ownVp','opponentVp',payload->'opponentVp',
    'date',payload->'date','scenario',payload->'scenario','rice',payload->'rice','format',payload->'format'
  ) as payload from public.games;
revoke all on public.public_games from public,anon,authenticated;
grant select on public.public_games to anon,authenticated;
