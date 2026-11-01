-- Run after deploying survey-refresh, uploading the private review ledger and
-- placing the same dedicated SURVEY_SYNC_TOKEN in Edge secrets and Vault.
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;
insert into storage.buckets (id,name,public) values
 ('sensou-survey','sensou-survey',true),
 ('sensou-survey-review','sensou-survey-review',false)
on conflict(id) do nothing;
-- No anonymous/authenticated write policies. Review ledger remains private.
select cron.schedule('sensou-survey-hourly','17 * * * *',$$
 select net.http_post(
  url:='https://zwybedqlxxjtznneicdb.supabase.co/functions/v1/survey-refresh',
  headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' ||
   (select decrypted_secret from vault.decrypted_secrets where name='sensou_survey_sync_token')),
  body:='{}'::jsonb,timeout_milliseconds:=120000
 );
$$);
