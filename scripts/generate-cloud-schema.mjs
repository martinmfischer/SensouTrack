import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { factions, roninThemes, scenarios } from '../src/domain.js';
const quote = s => `'${s.replaceAll("'","''")}'`;
const entries = factions.flatMap(f => ['No theme',...f.themes,...roninThemes].map(theme=>`(${quote(f.id)},${quote(theme)})`));
const header=`-- Generated from src/catalogue.json. Re-run: node scripts/generate-cloud-schema.mjs
-- Run in the Supabase SQL editor. Auth/email settings are configured in Supabase.
create table if not exists public.allowed_themes(faction text not null, theme text not null, primary key(faction,theme));
alter table public.allowed_themes enable row level security;
revoke all on public.allowed_themes from anon,authenticated;
insert into public.allowed_themes(faction,theme) values\n${entries.join(',\n')}\non conflict do nothing;\n`;
const core=await readFile(new URL('../supabase/schema-core.sql',import.meta.url),'utf8');
await writeFile(new URL('../supabase/schema.sql',import.meta.url),header+core.replace('/* SCENARIOS */',scenarios.map(quote).join(',')));
console.log('Generated supabase/schema.sql');
