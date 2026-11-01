// Descriptive survey analysis. A response is the sampling unit, not a game.
export const FACTIONS = ['Cult of Yurei','Horse Lords of Ataka','Ito Clan','Jung Pirates','Kinshi Temple','Minimoto Clan','Prefecture of Ryu','Savage Wave','Shadow Wind Clan','Shiho Clan','Silvermoon Trade Syndicate','Temple of Ro-Kan','The Awoken','The Descension','The Imperial Court'];
export const SHORT = ['Yurei','Ataka','Ito','Jung','Kinshi','Minimoto','Ryu','Savage Wave','Shadow Wind','Shiho','Silvermoon','Ro-Kan','Awoken','Descension','Imperial'];
export const clean = value => String(value ?? '').replace(/<[^>]*>/g,'').replaceAll('&amp;','&').replaceAll('&nbsp;',' ').replaceAll('&#39;',"'").replaceAll('&quot;','"').replace(/\s+/g,' ').trim();
export const score = value => { const m = clean(value).match(/^([1-7])(?:\s*(?:[—–-].*|\([^()]*\)))?$/); return m ? Number(m[1]) : null; };
const list = value => [...new Set((Array.isArray(value) ? value : clean(value).split(/,\s*|\n/)).map(clean).filter(Boolean))];
const faction = value => FACTIONS.find(f=>f===clean(value).replace(/\s*\([^)]*\)$/, '')) || null;
const factions = value => list(value).map(faction).filter(Boolean);
const mean = xs => xs.length ? xs.reduce((a,b)=>a+b,0)/xs.length : null;
const numeric = xs => xs.filter(x=>Number.isFinite(x));
export function summary(values) {
  const xs=numeric(values).sort((a,b)=>a-b), n=xs.length;
  return {n,mean:mean(xs),median:n?(xs[Math.floor((n-1)/2)]+xs[Math.ceil((n-1)/2)])/2:null,distribution:Array.from({length:7},(_,i)=>xs.filter(x=>x===i+1).length)};
}

export function medianFromDistribution(counts) {
  const n=counts.reduce((sum,count)=>sum+count,0);
  if(!n)return null;
  const ranks=[Math.floor((n+1)/2),Math.floor(n/2)+1];
  const at=rank=>{let cumulative=0;return counts.findIndex(count=>(cumulative+=count)>=rank)+1;};
  return (at(ranks[0])+at(ranks[1]))/2;
}

// Equal faction weight: more frequently rated factions do not dominate the reference.
export function factionBaseline(factions) {
  const rated=factions.filter(f=>f.n>0&&Number.isFinite(f.mean));
  return {value:rated.length?rated.reduce((sum,f)=>sum+f.mean,0)/rated.length:null,
    factionCount:rated.length,ratingCount:rated.reduce((sum,f)=>sum+f.n,0)};
}

export function parseCsv(text) {
  if(typeof text!=='string'||!text.trim()) throw new Error('The CSV is empty.');
  text=text.replace(/^\uFEFF/,'');
  const first=text.split(/\r?\n/,1)[0];
  const delimiter=first.startsWith('"Submission ID";')||first.startsWith('Submission ID;')?';':first.includes('\t')?'\t':',';
  const rows=[]; let row=[],cell='',quoted=false;
  for(let i=0;i<text.length;i++) {
    const c=text[i];
    if(c==='"') { if(quoted&&text[i+1]==='"'){cell+='"';i++;}else if(quoted||!cell)quoted=!quoted;else throw new Error('Invalid CSV quoting.'); }
    else if(c===delimiter&&!quoted){row.push(cell);cell='';}
    else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(Boolean))rows.push(row);row=[];cell='';}
    else cell+=c;
  }
  if(quoted)throw new Error('Unclosed CSV quotes.');
  row.push(cell);if(row.some(Boolean))rows.push(row);
  const headers=rows.shift()?.map(clean)||[];
  if(new Set(headers).size!==headers.length)throw new Error('Duplicate CSV column headers.');
  if(!headers.includes('Submission ID')||!headers.some(h=>/main faction/i.test(h)))throw new Error('Please use the Tally export of this Bushido survey.');
  return rows.map((values,i)=>{if(values.length!==headers.length)throw new Error(`CSV row ${i+2}: wrong number of columns.`);return Object.fromEntries(headers.map((h,j)=>[h,values[j]]));});
}

export function normalizeRows(rows) {
  const result=[],seen=new Set();let duplicates=0;
  for(const [index,input] of rows.entries()) {
    const entries=Object.entries(input), get=pattern=>entries.find(([key])=>pattern.test(key))?.[1]??'';
    const id=clean(input['Submission ID'])||`row-${index+1}`;
    if(seen.has(id)){duplicates++;continue;} seen.add(id);
    const r={id,respondentId:clean(input['Respondent ID']),submittedAt:clean(input['Submitted at']),
      mainFaction:faction(get(/^(What is your )?main faction\??$/i)),experience:clean(get(/^(Self-assessed experience|How would you rate your Bushido experience\?)$/)),
      strength:{},strengthStatus:{},strongest:factions(get(/^Which factions are strongest\? \(Up to three\)$/)),weakest:factions(get(/^Which factions are weakest\? \(Up to three\)$/)),
      strongestRank:factions(get(/^Rank your selected strongest factions/)),weakestRank:factions(get(/^Rank your selected weakest factions/)),
      strongThemes:list(get(/^Which themes are strongest\?/)),weakThemes:list(get(/^Which themes are weakest\?/)),factionThemes:{},
      ownStrength:score(get(/^How strong is your main faction/)),best:factions(get(/^Which factions are your best matchups/)),worst:factions(get(/^Which factions are your worst matchups/)),
      satisfaction:score(get(/^How satisfied are you with the current meta/)),
      themeComment:clean(get(/^What makes these themes/)),factionComment:clean(get(/^What explains your faction/)),problems:clean(get(/^What are the biggest problems/)),flags:[]};
    for(const f of FACTIONS){
      const raw=entries.find(([h])=>h.startsWith('How strong is each faction?')&&h.endsWith(`[${f}]`))?.[1];
      r.strength[f]=score(raw);
      r.strengthStatus[f]=r.strength[f]!==null?'valid':/not enough experience/i.test(clean(raw))?'noExperience':clean(raw)?'invalid':'skipped';
      r.factionThemes[f]=list(entries.find(([h])=>h===`Which themes are strongest for ${f}? (Up to three)`||h===`Strongest themes — ${f}`)?.[1]);
      if(r.factionThemes[f].length&&!r.strongest.includes(f))r.flags.push('Theme response outside the conditional selection');
    }
    for(const [a,b,label] of [['strongest','weakest','Factions'],['strongThemes','weakThemes','Themes'],['best','worst','Matchups']]){
      if(r[a].some(x=>r[b].includes(x)))r.flags.push(`Contradiction: ${label}`);
      if(r[a].length>3||r[b].length>3)r.flags.push(`More than three: ${label}`);
    }
    for(const [rank,nominations] of [['strongestRank','strongest'],['weakestRank','weakest']]){
      if(r[rank].some(f=>!r[nominations].includes(f)))r.flags.push('Ranking outside the nominations');
    }
    if(!/^\d{4}-\d{2}-\d{2}/.test(r.submittedAt))r.flags.push('Missing date');
    result.push(r);
  }
  return {records:result,duplicates};
}

// Official Tally response contract + form blocks resolve UUID-valued choices locally.
export function apiToRows(questions, submissions, blocks=[]) {
  const labels=new Map();
  const htmlText=s=>{if(typeof s==='string')return clean(s);if(Array.isArray(s))return s.map(x=>Array.isArray(x)?htmlText(x[0]):htmlText(x)).join('');return '';};
  for(const b of blocks){const p=b.payload||{};labels.set(b.uuid,clean(p.text||p.label||p.title||htmlText(p.safeHTMLSchema)||''));}
  for(const q of questions)for(const f of q.fields||[])if(f.title)labels.set(f.uuid,clean(f.title));
  const resolve=v=>{
    if(v==null)return '';
    if(typeof v==='string')return labels.get(v)||v;
    if(typeof v==='number'||typeof v==='boolean')return String(v);
    if(Array.isArray(v))return v.map(resolve).filter(Boolean).join(', ');
    for(const key of ['text','label','value','answer','uuid','id'])if(v[key]!=null)return resolve(v[key]);
    return '';
  };
  const byId=new Map();for(const q of questions){byId.set(q.id,q);for(const f of q.fields||[])byId.set(f.uuid,q);}
  return submissions.filter(s=>s.isCompleted===true).map(s=>{
    const out={'Submission ID':s.id,'Submitted at':s.submittedAt,'Respondent ID':s.responses?.[0]?.respondentId||''};
    for(const response of s.responses||[]){
      const q=byId.get(response.questionId);if(!q)continue;
      const title=clean(q.title), answer=response.answer;
      if(title.startsWith('How strong is each faction?')){
        const set=(row,value)=>{const label=labels.get(row)||row||'',f=faction(label.match(/\[([^\]]+)\]$/)?.[1]||label);if(!f&&resolve(value))throw new Error('Unknown Tally matrix row. The previous snapshot is preserved.');if(f)out[`${title.replace(/ \[[^\]]+\]$/, '')} [${f}]`]=resolve(value);};
        if(answer&&typeof answer==='object'&&!Array.isArray(answer))for(const [row,value] of Object.entries(answer))set(row,value);
        else if(Array.isArray(answer))for(const pair of answer){if(Array.isArray(pair))set(pair[0],pair[1]);else if(pair&&typeof pair==='object')set(pair.rowId||pair.row||pair.questionId,pair.columnId||pair.column||pair.value||pair.answer);}
        else {const field=q.fields?.find(f=>f.uuid===response.questionId);if(field)set(field.title,answer);}
      } else out[title]=resolve(answer)||clean(response.formattedAnswer);
    }
    return out;
  });
}

export function day(value) {
  if(!value)return '';
  // CSV timestamps have no offset: retain their exported calendar day; API dates use Berlin.
  if(!/[zZ]|[+-]\d\d:\d\d$/.test(value))return value.slice(0,10);
  const d=new Date(value);if(!Number.isFinite(d.getTime()))return '';
  return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit'}).format(d);
}
const validOpinionScore=v=>Number.isInteger(v)&&v>=1&&v<=7;
export function opinionKey(rule){
  if(rule.kind==='rating')return 'rating:'+rule.faction;
  if(rule.kind==='satisfaction')return 'satisfaction';
  if(rule.kind==='nominations')return 'nominations:'+rule.category+':'+[...new Set(rule.factions)].sort().join('|');
  if(rule.kind==='duel')return 'duel:'+[rule.a,rule.b].sort().join('|');
  if(rule.kind==='matchup')return 'matchup:'+rule.main+'|'+rule.opponent;
  return 'unknown';
}
export function upsertOpinion(rules,rule){return [...rules.filter(r=>opinionKey(r)!==opinionKey(rule)),rule];}
export function matchesOpinions(record,rules=[]){
  return rules.every(rule=>{
    if(rule.kind==='rating'||rule.kind==='satisfaction'){
      const v=rule.kind==='rating'?record.strength[rule.faction]:record.satisfaction;
      return validOpinionScore(v)&&validOpinionScore(rule.min)&&validOpinionScore(rule.max)&&rule.min<=rule.max&&v>=rule.min&&v<=rule.max;
    }
    if(rule.kind==='nominations')return ['strongest','weakest'].includes(rule.category)&&rule.factions.length>0&&rule.factions.every(f=>record[rule.category].includes(f));
    if(rule.kind==='duel'){
      const a=record.strength[rule.a],b=record.strength[rule.b];if(!validOpinionScore(a)||!validOpinionScore(b)||rule.a===rule.b)return false;
      return rule.outcome==='higher'?a>b:rule.outcome==='lower'?a<b:rule.outcome==='equal'?a===b:rule.outcome==='both';
    }
    if(rule.kind==='matchup'){
      if(record.mainFaction!==rule.main||rule.main===rule.opponent)return false;
      const good=record.best.includes(rule.opponent),bad=record.worst.includes(rule.opponent);
      return rule.outcome==='good'?good&&!bad:rule.outcome==='bad'?bad&&!good:rule.outcome==='both'?good&&bad:rule.outcome==='either'?good||bad:rule.outcome==='neither'?!good&&!bad&&Boolean(record.best.length||record.worst.length):rule.outcome==='answered'?Boolean(record.best.length||record.worst.length):false;
    }
    return false;
  });
}
export function opinionLabel(rule){
  if(rule.kind==='rating')return rule.faction+' perceived strength '+rule.min+'–'+rule.max;
  if(rule.kind==='satisfaction')return 'Meta satisfaction '+rule.min+'–'+rule.max;
  if(rule.kind==='nominations')return rule.category+' nominations include '+rule.factions.join(' + ');
  if(rule.kind==='duel')return rule.a+(rule.outcome==='higher'?' rated higher than ':rule.outcome==='lower'?' rated lower than ':rule.outcome==='equal'?' rated equal to ':' rated alongside ')+rule.b;
  if(rule.kind==='matchup')return rule.main+' → '+rule.opponent+': '+({good:'good only',bad:'bad only',both:'both good and bad',either:'good or bad nomination',neither:'not nominated on either list',answered:'matchup question answered'}[rule.outcome]||rule.outcome);
  return 'Unknown opinion condition';
}

export function filterRecords(records,{experience='',faction:main='',from='',to='',excludeFlagged=false,deduplicate=false,opinions=[]}={}) {
  let result=records;
  // Choose the latest submission before applying any subgroup; an older matching answer must not reappear.
  if(deduplicate){const seen=new Set();result=[...result].sort((a,b)=>b.submittedAt.localeCompare(a.submittedAt)).filter(r=>{if(!r.respondentId)return true;if(seen.has(r.respondentId))return false;seen.add(r.respondentId);return true;});}
  return result.filter(r=>(!experience||r.experience===experience)&&(!main||r.mainFaction===main)&&(!from||day(r.submittedAt)>=from)&&(!to||day(r.submittedAt)<=to)&&(!excludeFlagged||!r.flags.length)&&matchesOpinions(r,opinions));
}

export function aggregate(records) {
  const factionStats=FACTIONS.map((f,i)=>{
    const strongest=records.filter(r=>r.strongest.includes(f)).length,weakest=records.filter(r=>r.weakest.includes(f)).length;
    const points=key=>records.reduce((n,r)=>{const rank=r[key].indexOf(f);return n+(rank<0?0:Math.max(0,3-rank));},0);
    const owners=records.filter(r=>r.mainFaction===f);
    return {name:f,short:SHORT[i],...summary(records.map(r=>r.strength[f])),strongest,weakest,strongPoints:points('strongestRank'),weakPoints:points('weakestRank'),owners:owners.length,own:summary(owners.map(r=>r.ownStrength))};
  });
  const strongDen=records.filter(r=>r.strongest.length).length,weakDen=records.filter(r=>r.weakest.length).length;
  const themes=new Map();for(const r of records)for(const [key,kind] of [['strongThemes','strong'],['weakThemes','weak']])for(const name of r[key]){if(!themes.has(name))themes.set(name,{name,strong:0,weak:0});themes.get(name)[kind]++;}
  const selectedThemes=[];for(const f of FACTIONS){const rs=records.filter(r=>r.strongest.includes(f)),counts=new Map();for(const r of rs)for(const t of r.factionThemes[f])if(t!=='Not enough experience')counts.set(t,(counts.get(t)||0)+1);selectedThemes.push({faction:f,eligible:rs.length,answered:rs.filter(r=>r.factionThemes[f].some(t=>t!=='Not enough experience')).length,items:[...counts].map(([name,count])=>({name,count})).sort((a,b)=>b.count-a.count)});}
  const matchups=FACTIONS.map(f=>{const owners=records.filter(r=>r.mainFaction===f),answered=owners.filter(r=>r.best.length||r.worst.length).length;return {faction:f,n:answered,owners:owners.length,cells:FACTIONS.map(opponent=>{const best=owners.filter(r=>r.best.includes(opponent)).length,worst=owners.filter(r=>r.worst.includes(opponent)).length;return {opponent,best,worst,net:answered?(best-worst)/answered:null,mirror:f===opponent};})};});
  const counts=new Map();for(const r of records){const d=day(r.submittedAt);if(d)counts.set(d,(counts.get(d)||0)+1);}
  const days=[...counts].sort(([a],[b])=>a.localeCompare(b)).map(([date,count])=>({date,count}));let cumulative=0;for(const d of days)d.cumulative=cumulative+=d.count;
  const respondentCounts=new Map();for(const r of records)if(r.respondentId)respondentCounts.set(r.respondentId,(respondentCounts.get(r.respondentId)||0)+1);
  return {total:records.length,factions:factionStats,strongDen,weakDen,rankedStrong:records.filter(r=>r.strongestRank.length).length,rankedWeak:records.filter(r=>r.weakestRank.length).length,
    satisfaction:summary(records.map(r=>r.satisfaction)),themes:[...themes.values()].sort((a,b)=>(b.strong+b.weak)-(a.strong+a.weak)),strongThemeDen:records.filter(r=>r.strongThemes.length).length,weakThemeDen:records.filter(r=>r.weakThemes.length).length,selectedThemes,matchups,days,
    experience:['Beginner','Intermediate','Experienced'].map(name=>({name,count:records.filter(r=>r.experience===name).length})),flagged:records.filter(r=>r.flags.length).length,repeatRespondents:[...respondentCounts.values()].reduce((n,c)=>n+Math.max(0,c-1),0),
    comments:records.flatMap(r=>[['Meta',r.problems],['Themes',r.themeComment],['Faction & Matchups',r.factionComment]].filter(([,text])=>text).map(([type,text])=>({id:r.id,type,text,experience:r.experience,faction:r.mainFaction,date:day(r.submittedAt)})))};
}

export function summaryCsv(a) {
  const rows=[['Faction','Perceived strength ratings n','Perceived strength mean','Perceived strength median','Strongest nominations','Strongest denominator','Weakest nominations','Weakest denominator','Strong rank points','Weak rank points','Main-faction respondents','Data type'],...a.factions.map(f=>[f.name,f.n,f.mean??'',f.median??'',f.strongest,a.strongDen,f.weakest,a.weakDen,f.strongPoints,f.weakPoints,f.owners,'Community perceptions; not match results'])];
  return '\uFEFF'+rows.map(row=>row.map(x=>'"'+String(x).replaceAll('"','""')+'"').join(',')).join('\r\n');
}
