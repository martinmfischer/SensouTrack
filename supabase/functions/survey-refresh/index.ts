import {handleRefresh} from '../../../survey-dashboard/cloud-publication.mjs';
Deno.serve((request:Request)=>handleRefresh(request,{
  SUPABASE_URL:Deno.env.get('SUPABASE_URL'),
  SUPABASE_SERVICE_ROLE_KEY:Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
  TALLY_API_KEY:Deno.env.get('TALLY_API_KEY'),
  SURVEY_SYNC_TOKEN:Deno.env.get('SURVEY_SYNC_TOKEN'),
}));
