-- Generated from src/catalogue.json. Re-run: node scripts/generate-cloud-schema.mjs
-- Run in the Supabase SQL editor. Auth/email settings are configured in Supabase.
create table if not exists public.allowed_themes(faction text not null, theme text not null, primary key(faction,theme));
alter table public.allowed_themes enable row level security;
revoke all on public.allowed_themes from anon,authenticated;
insert into public.allowed_themes(faction,theme) values
('cult-of-yurei','No theme'),
('cult-of-yurei','Death and Decay'),
('cult-of-yurei','Infestation!'),
('cult-of-yurei','Nightmares of Jigoku'),
('cult-of-yurei','Things that go bump in the Night'),
('cult-of-yurei','We Three Meet Again'),
('cult-of-yurei','Wretched Existence'),
('cult-of-yurei','Brotherhood'),
('cult-of-yurei','Ordered for Battle'),
('cult-of-yurei','Strategic Deployment'),
('cult-of-yurei','The Hozumi Family'),
('cult-of-yurei','The Imperial March'),
('cult-of-yurei','The Kiyozumi Family'),
('horse-lords-of-ataka','No theme'),
('horse-lords-of-ataka','Cavalry Charge'),
('horse-lords-of-ataka','Hit & Run'),
('horse-lords-of-ataka','Brotherhood'),
('horse-lords-of-ataka','Ordered for Battle'),
('horse-lords-of-ataka','Strategic Deployment'),
('horse-lords-of-ataka','The Hozumi Family'),
('horse-lords-of-ataka','The Imperial March'),
('horse-lords-of-ataka','The Kiyozumi Family'),
('ito-clan','No theme'),
('ito-clan','Cold Blood'),
('ito-clan','Lords of Izu'),
('ito-clan','Serpent''s Coil'),
('ito-clan','The Blessed'),
('ito-clan','Brotherhood'),
('ito-clan','Ordered for Battle'),
('ito-clan','Strategic Deployment'),
('ito-clan','The Hozumi Family'),
('ito-clan','The Imperial March'),
('ito-clan','The Kiyozumi Family'),
('jung-pirates','No theme'),
('jung-pirates','Benthic Servitude'),
('jung-pirates','Black Sails'),
('jung-pirates','Conclave of Captains'),
('jung-pirates','Docks of Ryu'),
('jung-pirates','Landing Party'),
('jung-pirates','Queen of the Waves'),
('jung-pirates','The 64th Fleet'),
('jung-pirates','The Deep'),
('jung-pirates','Brotherhood'),
('jung-pirates','Ordered for Battle'),
('jung-pirates','Strategic Deployment'),
('jung-pirates','The Hozumi Family'),
('jung-pirates','The Imperial March'),
('jung-pirates','The Kiyozumi Family'),
('kinshi-temple','No theme'),
('kinshi-temple','Everything and Nothing'),
('kinshi-temple','Zenith of the Void'),
('kinshi-temple','Brotherhood'),
('kinshi-temple','Ordered for Battle'),
('kinshi-temple','Strategic Deployment'),
('kinshi-temple','The Hozumi Family'),
('kinshi-temple','The Imperial March'),
('kinshi-temple','The Kiyozumi Family'),
('minimoto-clan','No theme'),
('minimoto-clan','Army of the Minimoto'),
('minimoto-clan','Garrison of the Damned'),
('minimoto-clan','The Finest Steel'),
('minimoto-clan','Brotherhood'),
('minimoto-clan','Ordered for Battle'),
('minimoto-clan','Strategic Deployment'),
('minimoto-clan','The Hozumi Family'),
('minimoto-clan','The Imperial March'),
('minimoto-clan','The Kiyozumi Family'),
('prefecture-of-ryu','No theme'),
('prefecture-of-ryu','Blood of the Dragon'),
('prefecture-of-ryu','Claws of the Dragon'),
('prefecture-of-ryu','Passing the Night'),
('prefecture-of-ryu','Prefecture Patrol'),
('prefecture-of-ryu','Brotherhood'),
('prefecture-of-ryu','Ordered for Battle'),
('prefecture-of-ryu','Strategic Deployment'),
('prefecture-of-ryu','The Hozumi Family'),
('prefecture-of-ryu','The Imperial March'),
('prefecture-of-ryu','The Kiyozumi Family'),
('savage-wave','No theme'),
('savage-wave','Alphas'),
('savage-wave','Bakemono Hunting Pack'),
('savage-wave','Escort'),
('savage-wave','Mushroom Crazed Lunatics'),
('savage-wave','The Ring of Fire'),
('savage-wave','Thousand Eyes'),
('savage-wave','Wrath of the Red Sun'),
('savage-wave','Brotherhood'),
('savage-wave','Ordered for Battle'),
('savage-wave','Strategic Deployment'),
('savage-wave','The Hozumi Family'),
('savage-wave','The Imperial March'),
('savage-wave','The Kiyozumi Family'),
('shadow-wind-clan','No theme'),
('shadow-wind-clan','Assassination Mission'),
('shadow-wind-clan','House Bleeding Moon'),
('shadow-wind-clan','House Long Shadow'),
('shadow-wind-clan','House North Star'),
('shadow-wind-clan','Scouting Mission'),
('shadow-wind-clan','Skirmish Mission'),
('shadow-wind-clan','Brotherhood'),
('shadow-wind-clan','Ordered for Battle'),
('shadow-wind-clan','Strategic Deployment'),
('shadow-wind-clan','The Hozumi Family'),
('shadow-wind-clan','The Imperial March'),
('shadow-wind-clan','The Kiyozumi Family'),
('shiho-clan','No theme'),
('shiho-clan','Black Eagle''s Coalition'),
('shiho-clan','Guerilla Warfare'),
('shiho-clan','New Eagle Army'),
('shiho-clan','Open Rebellion'),
('shiho-clan','The Shiho Return'),
('shiho-clan','Brotherhood'),
('shiho-clan','Ordered for Battle'),
('shiho-clan','Strategic Deployment'),
('shiho-clan','The Hozumi Family'),
('shiho-clan','The Imperial March'),
('shiho-clan','The Kiyozumi Family'),
('silvermoon-trade-syndicate','No theme'),
('silvermoon-trade-syndicate','Iron Fist'),
('silvermoon-trade-syndicate','Jade Rose Gumi'),
('silvermoon-trade-syndicate','Path of a Thousand Names'),
('silvermoon-trade-syndicate','Traveling Show'),
('silvermoon-trade-syndicate','Yokozuna''s Revenge'),
('silvermoon-trade-syndicate','Brotherhood'),
('silvermoon-trade-syndicate','Ordered for Battle'),
('silvermoon-trade-syndicate','Strategic Deployment'),
('silvermoon-trade-syndicate','The Hozumi Family'),
('silvermoon-trade-syndicate','The Imperial March'),
('silvermoon-trade-syndicate','The Kiyozumi Family'),
('temple-of-ro-kan','No theme'),
('temple-of-ro-kan','Bastions of the Mountain'),
('temple-of-ro-kan','Followers of Inari'),
('temple-of-ro-kan','Initiation'),
('temple-of-ro-kan','Masters of the Art'),
('temple-of-ro-kan','Minkan Denshó'),
('temple-of-ro-kan','Righteous Warriors'),
('temple-of-ro-kan','Brotherhood'),
('temple-of-ro-kan','Ordered for Battle'),
('temple-of-ro-kan','Strategic Deployment'),
('temple-of-ro-kan','The Hozumi Family'),
('temple-of-ro-kan','The Imperial March'),
('temple-of-ro-kan','The Kiyozumi Family'),
('the-awoken','No theme'),
('the-awoken','Joyless Smiles and Dark Eyes'),
('the-awoken','The Family'),
('the-awoken','Brotherhood'),
('the-awoken','Ordered for Battle'),
('the-awoken','Strategic Deployment'),
('the-awoken','The Hozumi Family'),
('the-awoken','The Imperial March'),
('the-awoken','The Kiyozumi Family'),
('the-descension','No theme'),
('the-descension','Blue Gale Scouting Party'),
('the-descension','Hunter Gatherers'),
('the-descension','Shepherds of the White Mesa'),
('the-descension','Way of the Ancient Warrior'),
('the-descension','Wind Watchers'),
('the-descension','Brotherhood'),
('the-descension','Ordered for Battle'),
('the-descension','Strategic Deployment'),
('the-descension','The Hozumi Family'),
('the-descension','The Imperial March'),
('the-descension','The Kiyozumi Family'),
('the-imperial-court','No theme'),
('the-imperial-court','The Eternal Legion'),
('the-imperial-court','Brotherhood'),
('the-imperial-court','Ordered for Battle'),
('the-imperial-court','Strategic Deployment'),
('the-imperial-court','The Hozumi Family'),
('the-imperial-court','The Imperial March'),
('the-imperial-court','The Kiyozumi Family')
on conflict do nothing;

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
  if jsonb_typeof(p->'scenario') <> 'string' or p->>'scenario' not in ('Depletion','Omaju','Sacred Idols','Shin Keii','Ryodo','Ryu-Seikyuu','Botokú','Ichi no Riten','Muzukashi','Ninki','Õsatsu','Seigyo') then raise exception 'Invalid scenario.'; end if;
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
