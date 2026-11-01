-- Preserve all games and accounts. Require verified email and a live owner session.
BEGIN;
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
COMMIT;
