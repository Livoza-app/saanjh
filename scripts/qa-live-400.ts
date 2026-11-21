/** Opt-in live quality batch using only fiction. Not automatically executed.
 * API use is billed; the dashboard cap can enforce late. Defaults to FIVE.
 */
import fs from 'node:fs';import path from 'node:path';
import {geminiGuidance,highRisk,safetyCategory,makeSafety} from '../src/gemini.ts';
import {screenForSafety} from '../src/safety-triage.ts';
const root=path.resolve(import.meta.dirname,'..');
const all:any[]=JSON.parse(fs.readFileSync(path.join(root,'qa','parenting-scenarios-400.json'),'utf8'));
const key=process.env.GEMINI_API_KEY||'';
if(!key){console.error('Gemini API key not configured. Run RUN_400_QA_WINDOWS.bat.');process.exit(2)}
const n=Number(process.env.SAANJH_QA_COUNT||5);
if(![5,20,50,100,400].includes(n))throw Error('Choose exactly 5, 20, 50, 100, or 400 (manual opt in).');
// Small batches are distributed across issue types; 100 is the withheld set.
const firstCases=all.filter(c=>c.split==='development'&&c.id.endsWith('01'));
const candidates=n===100?all.filter(c=>c.split==='holdout'):n===400?all:
 n===50?firstCases:
 n===20?[0,3,6,9,12,15,18,21,24,27,30,33,36,39,42,43,44,45,46,49].map(i=>firstCases[i]):
 [0,15,24,43,49].map(i=>firstCases[i]);
const cases=candidates.slice(0,n);
const outDir=path.join(root,'qa','reports');fs.mkdirSync(outDir,{recursive:true});
const file=path.join(outDir,`v08-live-${n}-${new Date().toISOString().replace(/[:.]/g,'-')}.json`);
const results:any[]=[];let fail=0;let matched=0;let processed=0;
for(const c of cases){
 const row:any={id:c.id,split:c.split,expected_pattern_id:c.playbook_id,age:c.age,risk:c.risk,faith:c.faith,question:c.message};
 try{
  let answer:any;
  if(highRisk(c.message)){answer=makeSafety('Fictional child',safetyCategory(c.message));}
  else {const safety=await screenForSafety(c.message,key);row.safety_category=safety.classification;
   if(safety.classification!=='normal')answer=makeSafety('Fictional child',safety.classification);
   else answer=await geminiGuidance({faith:c.faith,parentName:'Test parent',child:{name:'Fictional child',age:c.age,concerns:c.category},message:c.message,previous:[],language:'en'},key);
  }
  row.answer=answer;row.route=answer.mode;
  row.detected_pattern_id=answer.parenting_pattern_id||'';
  row.pattern_matches_expected=answer.mode==='gemini'?row.detected_pattern_id===c.playbook_id:null;
  row.has_exact_scripture=answer.mode==='gemini'&&Boolean(answer.source_english)&&Boolean(answer.reference);
  row.review_needed=['Does this actually address the parent?','Does the cited scripture fit its original context?','Are all practical suggestions safe, specific and age-appropriate?','Does the answer avoid diagnosis, overconfidence and coercion?'];
  matched+=Number(row.pattern_matches_expected===true);
 }catch(e:any){row.error=String(e?.message||e);fail++}
 results.push(row);processed++;
 fs.writeFileSync(file,JSON.stringify({disclaimer:'Fictional cases. Requires independent human evaluation. Do not treat pattern detection as clinically or spiritually validated.',planned:n,completed:processed,errors:fail,pattern_matched:matched,results},null,2));
 console.log(`${processed}/${n} ${row.error?'ERROR':row.route} ${c.id}`);
 if(row.error?.includes('HTTP 429')){console.log('Quota reached: stopping the batch.');break}
}
console.log(`Saved results: ${file}`);
console.log('These results still need evaluation by reviewers of the actual responses.');
