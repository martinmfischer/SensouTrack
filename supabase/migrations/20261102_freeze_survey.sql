-- Retain the job definition and its secrets, but stop automatic Tally requests.
select cron.alter_job(jobid, active := false)
from cron.job where jobname='sensou-survey-hourly';
select jobid,jobname,active from cron.job
where jobname='sensou-survey-hourly';
