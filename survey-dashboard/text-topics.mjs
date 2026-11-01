// Exploratory local topic tagging. A match records wording, not agreement or sentiment.
const STOP=new Set(`a an and are as at be been being but by can cannot could did do does doing don dont for from had has have having he her here hers him his how i if in into is it its just me more most my of on one only or other our ours out own really she should so some than that the their them then there these they this those through to too very was we were what when where which while who why will with would you your also all any because both each even few get got lot lots many much need needs new not now over same see seem seems still such take taking things thing use used using want way well about after again against before between during further once themselves itself yourself yourselves above below under down up off no nor never none nothing without however im ive id ill youre youve youll theyre thats isnt arent wasnt werent doesnt didnt couldnt wouldnt shouldnt
aber alle allem allen aller alles als also am an andere anderen auch auf aus bei bin bis bist da damit dann das dass dein deine dem den der des die dies diese dieser dieses doch dort du durch ein eine einem einen einer eines er es etwas euch euer für fuer gegen gewesen gibt hab habe haben hat hier ich ihr ihre im in ist ja jede jeder jedes kann kein keine mit mehr meine mich mir muss nach noch nur oder ohne schon sehr sein seine selbst sich sie sind so sondern sonst über ueber um und uns unter vom von vor war waren was weil welche wenn werde werden wie wieder wir wird wo zu zum zur
bushido game games meta player players play playing played faction factions model models theme themes think thoughts feel feels feeling overall generally etc example examples lot quite bit little something anything everything personally actually currently current seems seem opinion sometimes often usually probably really`.split(/\s+/));
for(const word of 'good great like enough question especially aside two three strong stronger strongest weak weaker weakest'.split(' '))STOP.add(word);
const ALIASES={rules:'rule',rulings:'ruling',cards:'card',lists:'list',tokens:'token',activations:'activation',interactions:'interaction',combinations:'combination',combos:'combo',models:'model',themes:'theme',factions:'faction',players:'player',games:'game',attacks:'attack',scenarios:'scenario',objectives:'objective',powerhouses:'powerhouse',points:'point',op:'overpowered',buffs:'buff',nerfs:'nerf',updates:'update',releases:'release',options:'option',counters:'counter',rokan:'rokan'};
const DISPLAY={rokan:'Ro-Kan',ryu:'Ryu',ito:'Ito',minimoto:'Minimoto',preordain:'Preordain',silvermoon:'Silvermoon',shiho:'Shiho',yurei:'Yurei',ataka:'Ataka'};
const key=c=>`${c.id}\u0000${c.type}`;
const people=docs=>new Set(docs.map(c=>c.id)).size;
const display=term=>term.split(' ').map(t=>DISPLAY[t]||t).join(' ').replace(/^./,c=>c.toUpperCase());

export function topicTokens(text){
  return String(text||'').normalize('NFKC').toLowerCase().replace(/ro[\s-]?kan/g,'rokan').replace(/[’']/g,'')
    .match(/[\p{L}\p{N}]+/gu)?.map(t=>ALIASES[t]||t).filter(t=>t.length>=3&&!STOP.has(t)&&!/^\d+$/.test(t))||[];
}
function features(text){
  const tokens=topicTokens(text),counts=new Map();
  for(let i=0;i<tokens.length;i++){
    const term=tokens[i];counts.set(term,(counts.get(term)||0)+1);
    if(i&&tokens[i-1]!==term){const pair=tokens[i-1]+' '+term;counts.set(pair,(counts.get(pair)||0)+1);}
  }
  return counts;
}

export const TOPIC_RULES=[
{id:'balance',label:'Balance & power levels',words:['overpowered','underpowered','over powered','under powered','op','power creep','powerhouse','powerhouses','too strong','too weak','broken','balance','nerf','nerfs','buff','buffs','dominant','zu stark','zu schwach']},
{id:'auto-includes',label:'Preordain & auto-includes',words:['preordain','auto include','autoinclude','auto pick','must take','must include','mandatory','pflichtauswahl']},
{id:'activations',label:'Activations & pass tokens',words:['activation','activate','pass token','pass tokens','passing','pass abuse','aktivierung','passtoken','passmarker']},
{id:'list-building',label:'List variety & choices',words:['list building','listbuilding','list diversity','diversity','variety','spam','counterlist','counter list','list construction','creativity','vielfalt','listenbau','auswahl']},
{id:'rules',label:'Rules, rulings & updates',words:['rules','rulings','rulebook','faq','errata','updates','update','clarity','ambiguous','regel','regeln','unklar','regelwerk']},
{id:'ranged',label:'Shooting & alpha strikes',words:['shoot','shooting','ranged','ranged attacks','alpha strike','alpha striking','alpha','schuss','beschuss','fernkampf']},
{id:'scenarios',label:'Scenarios, objectives & scoring',words:['scenario','scenarios','objective','objectives','scoring','victory points','vp','vps','szenario','szenarien','siegpunkte']},
{id:'control',label:'Control, defence & avoidance',words:['camouflage','camo','disguise','fear','stun','paralysis','paralyze','control','armour','armor','defence','defense','unkillable','uninteractive','non interactive','tarnung','rüstung','ruestung','kontrolle']},
{id:'theme-benefits',label:'Theme benefits & restrictions',words:['theme benefit','theme benefits','free','bonus','bonuses','recruitment','restriction','restrictions','tax','benefit','benefits','gratis','kostenlos','bonusaktion','rekrutierung']},
{id:'experience',label:'Enjoyment, interaction & learning',words:['fun','boring','frustrating','discouraging','interactive','interaction','interactions','new player','new players','beginner','learning','complexity','complicated','spass','spaß','langweilig','einsteiger','komplex','frustrierend']},
{id:'identity',label:'Faction identity',words:['identity','identities','faction flavour','faction flavor','faction character','identität','identitaet']},
];
const normalized=text=>String(text||'').normalize('NFKC').toLowerCase().replace(/[’']/g,'').replace(/[^\p{L}\p{N}]+/gu,' ').trim().replace(/\s+/g,' ');
export function matchedTopicWords(text,rule){const value=' '+normalized(text)+' ';return rule.words.filter(word=>value.includes(' '+normalized(word)+' '));}
function excerptFor(comment,words){
 const text=comment.text;if(text.length<=340)return text;
 const lower=text.toLowerCase(),positions=words.map(w=>lower.indexOf(w)).filter(i=>i>=0),at=positions.length?Math.min(...positions):0;
 let start=Math.max(0,at-100);if(start){const boundary=text.indexOf(' ',start);start=boundary<0?0:boundary+1;}
 let end=Math.min(text.length,start+340);if(end<text.length){const boundary=text.lastIndexOf(' ',end);if(boundary>start)end=boundary;}
 return(start?'…':'')+text.slice(start,end)+(end<text.length?'…':'');
}

export function analyzeTopics(input,{minPeople=2}={}){
 const docs=[...new Map(input.filter(c=>c.text?.trim()).map(c=>[key(c),c])).values()].sort((a,b)=>key(a).localeCompare(key(b)));
 const counts=new Map();for(const c of docs)for(const term of features(c.text).keys()){if(!counts.has(term))counts.set(term,{term,answers:0,ids:new Set()});const x=counts.get(term);x.answers++;x.ids.add(c.id);}
 const terms=[...counts.values()].filter(t=>t.ids.size>=2).map(t=>({term:t.term,label:display(t.term),answers:t.answers,respondents:t.ids.size})).sort((a,b)=>b.respondents-a.respondents||b.term.split(' ').length-a.term.split(' ').length||a.term.localeCompare(b.term));
 const tagged=new Set();
 const allTopics=TOPIC_RULES.map(rule=>{
  const matches=docs.map(c=>({comment:c,words:matchedTopicWords(c.text,rule)})).filter(x=>x.words.length);for(const m of matches)tagged.add(key(m.comment));
  const members=matches.map(m=>m.comment),representative=[...matches].sort((a,b)=>b.words.length-a.words.length||a.comment.text.length-b.comment.text.length||key(a.comment).localeCompare(key(b.comment)))[0],words=new Map();
  for(const {comment,words:matched}of matches)for(const word of matched){if(!words.has(word))words.set(word,new Set());words.get(word).add(comment.id);}
  return{...rule,answers:members.length,respondents:people(members),members,representative:representative?.comment,excerpt:representative?excerptFor(representative.comment,representative.words):'',terms:[...words].map(([label,ids])=>({label,respondents:ids.size})).sort((a,b)=>b.respondents-a.respondents||a.label.localeCompare(b.label))};
 });
 const topics=allTopics.filter(t=>t.respondents>=minPeople).sort((a,b)=>b.respondents-a.respondents||a.label.localeCompare(b.label)),unassigned=docs.filter(c=>!tagged.has(key(c))),covered=docs.filter(c=>tagged.has(key(c)));
 return{answers:docs.length,respondents:people(docs),topics,allTopics,terms,unassigned,groupedAnswers:covered.length,groupedRespondents:people(covered),minPeople};
}
export function commentMatchesTerm(comment,term){return features(comment.text).has(term);}
export function topicCsv(result,question){
  const rows=[['Question','Topic suggestion','Respondents in group','Answers in group','Respondents with text','Answers with text','Shared wording','Interpretation'],...result.topics.map(t=>[question,t.label,t.respondents,t.answers,result.respondents,result.answers,t.terms.map(x=>x.label).join('; '),'Exploratory keyword mentions; not agreement, sentiment or verified findings'])];
  const cell=value=>'"'+String(value).replaceAll('"','""')+'"';
  return '\uFEFF'+rows.map(row=>row.map(cell).join(',')).join('\r\n');
}
