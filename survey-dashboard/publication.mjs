import {publicSummary} from './public-summary.mjs';
import {reviewedPublicTexts} from './public-texts.mjs';
import {FACTIONS,day} from './analysis.mjs';

// The only publication boundary, shared by local exports and the cloud refresh.
export function publicPublication(snapshot,ledger){
  const files={'summary.json':publicSummary(snapshot)},groups=[];
  const variants=[...FACTIONS.map((label,i)=>({id:'faction-'+i,label:'Main faction: '+label,records:snapshot.records.filter(r=>r.mainFaction===label)})),...['Beginner','Intermediate','Experienced'].map((label,i)=>({id:'experience-'+i,label:'Experience: '+label,records:snapshot.records.filter(r=>r.experience===label)})),...[...new Set(snapshot.records.map(r=>day(r.submittedAt)))].sort().map((label,i)=>({id:'day-'+i,label:'Submission day: '+label,records:snapshot.records.filter(r=>day(r.submittedAt)===label)}))];
  for(const g of variants)if(g.records.length>=5){files['groups/'+g.id+'.json']=publicSummary({...snapshot,records:g.records});groups.push({id:g.id,label:g.label,n:g.records.length});}
  files['groups.json']={groups};
  files['texts.json']=reviewedPublicTexts(snapshot,ledger||{schema:1,entries:{},reviewedAt:null});
  return files;
}
