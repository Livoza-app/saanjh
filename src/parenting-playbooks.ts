/** Editorial parenting-pattern support for Saanjh, version 0.8.
 * This retrieves age-appropriate coaching patterns from a SOURCE-LINKED library.
 * It does not retrain Gemini, make a diagnosis, or validate religious interpretation.
 * User's current message always takes precedence over any retrieved pattern.
 */
import fs from 'node:fs';
import path from 'node:path';
const pathToLibrary = path.resolve(import.meta.dirname, '..', 'qa', 'parenting-playbooks-50.json');
export type ParentingPlaybook = {
  id: string; code: string; title: string; age_min: number; age_max: number;
  signals: string[]; guidance_pattern: string; clarifying_question: string; avoid: string;
  routing: 'normal'|'urgent'; source_links: string[]; retrieval_examples: string[];
};
export const PARENTING_PLAYBOOKS: ParentingPlaybook[] = JSON.parse(fs.readFileSync(pathToLibrary,'utf8'));
const common = new Set('a an and are as at be but by can child children did do does every feel feels for from had has have help how i if in is it its me my of on or our parent parents please should so some tell that the their them there they this to too try we what when where which who why will with would you your he she his her him son daughter kid kids way about again want need now give advice respond'.split(' '));
const clean = (v: string) => v.toLowerCase().normalize('NFKC').replace(/[’‘]/g,"'").replace(/[^a-z\p{Script=Devanagari}0-9 ]+/gu,' ');
function stem(s:string){return s.length>6?s.replace(/(ing|ingly|ed|ies|ers|er|ly|es|s)$/,''):s}
function tokenize(s:string){return [...new Set(clean(s).split(/\s+/).map(stem).filter(t=>t.length>=3&&!common.has(t)))];}
const docTerms = PARENTING_PLAYBOOKS.map(p=>new Set(tokenize([...p.signals,...p.retrieval_examples].join(' '))));
const freq = new Map<string,number>();
for(const doc of docTerms)for(const t of doc)freq.set(t,(freq.get(t)||0)+1);
const idf = (t:string)=>Math.log(1+(PARENTING_PLAYBOOKS.length+1)/(1+(freq.get(t)||0)));
export type PlaybookMatch={id:string;title:string;score:number;source_links:string[];guidance_pattern:string;clarifying_question:string;avoid:string;routing:string;age_relevance:'in-range'|'out-of-range'};
export function matchParentingPatterns(message:string,childAge?:number,max=2):PlaybookMatch[]{
  const q = tokenize(message);
  if(!q.length)return [];
  const qSet=new Set(q);
  return PARENTING_PLAYBOOKS.map((p,i)=>{
    const sig=new Set(tokenize(p.signals.join(' ')));
    const examples=new Set(tokenize(p.retrieval_examples.join(' ')));
    let score=0;
    for(const term of qSet){
      if(sig.has(term))score+=2.3*idf(term);
      else if(examples.has(term))score+=idf(term);
    }
    // We never treat a mismatched child's age as the correct age-specific playbook.
    const ageRelevant = childAge===undefined || childAge>=p.age_min && childAge<=p.age_max;
    if(!ageRelevant)score*=0.28;
    if(p.routing==='urgent')score*=0.7; // never use playbook search for emergency routing
    return {id:p.id,title:p.title,score:Number(score.toFixed(3)),source_links:p.source_links,guidance_pattern:p.guidance_pattern,clarifying_question:p.clarifying_question,avoid:p.avoid,routing:p.routing,age_relevance:ageRelevant?'in-range' as const:'out-of-range' as const};
  }).filter(x=>x.score>=3 && x.age_relevance==='in-range' && x.routing==='normal')
  .sort((a,b)=>b.score-a.score || a.id.localeCompare(b.id)).slice(0,Math.max(0,Math.min(3,max)));
}

/**
 * Meaning-first playbook retrieval. The raw parent message is deliberately not
 * the only query: situation observations, context and uncertainty are mapped
 * to the editorial playbook descriptions. This reduces brittle exact-keyword
 * matches (for example, a cracked screen is not automatically screen-time
 * conflict) while retaining the existing lexical matcher for compatibility.
 */
export type SituationForPlaybooks={
 child_age:number;
 reported_behaviours:string[];
 context:string[];
 uncertainties:string[];
 plausible_explanations:string[];
};
export function retrieveParentingPlaybooks(situation:SituationForPlaybooks,max=3):PlaybookMatch[]{
 const meaningTerms=tokenize([
  ...situation.reported_behaviours,
  ...situation.context,
  ...situation.plausible_explanations
 ].join(' '));
 if(!meaningTerms.length)return [];
 const query=new Set(meaningTerms);
 const scored=PARENTING_PLAYBOOKS.map((p,i)=>{
  const signalTerms=new Set(tokenize([...p.signals,p.title,p.guidance_pattern,p.retrieval_examples.join(' ')].join(' ')));
  const exampleTerms=new Set(tokenize(p.retrieval_examples.join(' ')));
  let score=0;
  for(const term of query){
   if(signalTerms.has(term))score+=1.6*idf(term);
   if(exampleTerms.has(term))score+=0.65*idf(term);
  }
  const ageRelevant=situation.child_age>=p.age_min&&situation.child_age<=p.age_max;
  if(!ageRelevant)score*=0.15;
  if(p.routing==='urgent')score=0;
  return {id:p.id,title:p.title,score:Number(score.toFixed(3)),source_links:p.source_links,guidance_pattern:p.guidance_pattern,clarifying_question:p.clarifying_question,avoid:p.avoid,routing:p.routing,age_relevance:ageRelevant?'in-range' as const:'out-of-range' as const};
 }).filter(x=>x.score>=1.25&&x.age_relevance==='in-range'&&x.routing==='normal')
  .sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id)).slice(0,Math.max(0,Math.min(max,3)));
 return scored.map(x=>({...x,retrieval_basis:'meaning-of-situation'} as PlaybookMatch & {retrieval_basis:string}));
}
export function parentingHints(message:string,childAge:number){
 return matchParentingPatterns(message,childAge,2).map(x=>({
  pattern_id:x.id,pattern_name:x.title,coaching_hypothesis:x.guidance_pattern,
  question_to_consider:x.clarifying_question,avoid:x.avoid,
  background_resources:x.source_links,
  disclaimer:'Editorial possibility, NOT scripture, a diagnosis, or a professional recommendation. Use only if it fits the actual family context.'
 }));
}

/** Compact full-category menu. Gemini is instructed to pick based on meaning,
 * not rely on the brittle lexical ranking alone. No urgent coaching examples.
 * Costs additional input tokens; can be replaced with embeddings later.
 */
export function patternCatalogue(){
 return PARENTING_PLAYBOOKS.filter(p=>p.routing==='normal').map(p=>({
  id:p.id,category:p.title,ages:[p.age_min,p.age_max],
  possible_practical_direction:p.guidance_pattern,
  avoid:p.avoid
 }));
}
export function validPatternId(x:string){return x===''||PARENTING_PLAYBOOKS.some(p=>p.id===x&&p.routing==='normal')}

