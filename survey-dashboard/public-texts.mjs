import {createHash} from 'node:crypto';
const hash=value=>createHash('sha256').update(value).digest('hex');
export function reviewedPublicTexts(snapshot,ledger){
  if(snapshot.formId!=='2jEY7L'||ledger.schema!==1)throw new Error('Unexpected survey or review ledger.');
  const texts=[],people=new Set(),questionPeople=Object.fromEntries(['Meta','Themes','Faction & Matchups'].map(q=>[q,new Set()]));let pending=0,redacted=0;
  for(const r of snapshot.records)for(const [question,field] of [['Meta','problems'],['Themes','themeComment'],['Faction & Matchups','factionComment']]){
    const source=r[field];if(!source)continue;
    const review=ledger.entries[hash(r.id+'\0'+question)];
    if(!review||review.sourceHash!==hash(source)||!['approved','redacted'].includes(review.status)||!review.reviewedAt){pending++;continue;}
    const text=review.status==='redacted'?review.text:source;
    if(typeof text!=='string'||!text.trim()||!/^[-a-f0-9]{36}$/.test(review.publicId))throw new Error('Invalid approved public text.');
    if(review.status==='redacted')redacted++;
    // Public IDs belong to individual documents, never people. No fields linking
    // text to a respondent, numeric profile, time, experience or faction pass out.
    texts.push({id:review.publicId,type:question,text,edited:review.status==='redacted'});
    people.add(r.id);questionPeople[question].add(r.id);
  }
  texts.sort((a,b)=>a.id.localeCompare(b.id));
  return {schema:1,reviewedDay:ledger.reviewedAt?new Date(ledger.reviewedAt).toISOString().slice(0,10):null,texts,pending,redacted,coverage:{submissionsWithText:people.size,questions:Object.fromEntries(Object.entries(questionPeople).map(([q,ids])=>[q,ids.size]))}};
}
