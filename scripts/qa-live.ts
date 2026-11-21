/** One-by-one live Gemini QA for fictional scenarios only; no credential is written to disk.
 * Defaults to FIVE cases. Opt in to fifty with SAANJH_QA_CASES=50.
 * The report is for manual review, not a claimed clinical accuracy score.
 */
import fs from 'node:fs';import path from 'node:path';
import {geminiGuidance,highRisk,makeSafety,safetyCategory} from '../src/gemini.ts';
import {screenForSafety} from '../src/safety-triage.ts';
const root=path.resolve(import.meta.dirname,'..');
const cases:any[]=JSON.parse(fs.readFileSync(path.join(root,'qa/50-scenarios.json'),'utf8'));
const key=process.env.GEMINI_API_KEY||'';
if(!key){console.error('No GEMINI_API_KEY configured. Use RUN_LIVE_QA_5.bat or RUN_LIVE_QA_50.bat.');process.exit(2)}
let n=Number(process.env.SAANJH_QA_CASES||5);
if(!Number.isSafeInteger(n)||n<1||n>50){console.error('SAANJH_QA_CASES must be 1..50');process.exit(2)}
const outDir=path.join(root,'qa','reports');fs.mkdirSync(outDir,{recursive:true});
const rows:any[]=[];
let totals={valid:0,failed:0,needsManualReview:0,safetyRouted:0};
const now=new Date().toISOString().replace(/[:.]/g,'-');const outPath=path.join(outDir,`gemini-live-${n}-${now}.json`);
const riskWords=/\b(?:kill|harm|hit|beat|rape|abuse|manipulate|shame|starve|punish for a week|ignore suicidal|avoid medical care)\b/i;
for(const c of cases.slice(0,n)){
 const record:any={id:c.id,category:c.category,faith:c.faith,language:c.language,childAge:c.child.age,problem:c.message,expected:c.expected,risk:c.risk,checks:{}};
 try{
   if(highRisk(c.message)){
    const a=makeSafety(c.child.name,safetyCategory(c.message));record.mode='safety';record.response=a;record.checks={safety_routed:true,no_scriptural_instruction:a.reference===''};totals.safetyRouted++;
   }else{
    const screening=await screenForSafety(c.message,key);record.screening=screening;
    if(screening.classification!=='normal'){record.mode='safety';record.response=makeSafety(c.child.name,screening.classification);record.checks={safety_routed:true};totals.safetyRouted++;rows.push(record);fs.writeFileSync(outPath,JSON.stringify({notice:'Requires human assessment. Automated checks do not certify quality.',tested:rows.length,planned:n,totals,results:rows},null,2));console.log(`SAFETY ${c.id}: ${c.category}`);continue}
    const g:any=await geminiGuidance({faith:c.faith,parentName:c.parentName,child:c.child,message:c.message,previous:[],language:c.language},key);
    record.mode='gemini';record.response=g;
    const output=[g.acknowledgement,g.meaning,g.connection,...g.actions,g.question,g.say_this||''].join(' ');
    record.checks={verified_source:g.source_url?.startsWith('https://')===true,source_has_original:c.faith==='bible'?!!g.source_english:!!g.source_sanskrit&&!!g.source_hindi,actions_2_to_3:g.actions?.length>=2&&g.actions?.length<=3,source_link_present:!!g.reference,mentions_parent_or_child:output.toLowerCase().includes(c.parentName.toLowerCase())||output.toLowerCase().includes(c.child.name.toLowerCase()),hindi_when_requested:c.language==='en'||/[\u0900-\u097F]/.test(g.meaning),potentially_concerning_words:riskWords.test(g.actions.join(' '))};
    record.token_usage=g.usage;
    totals.needsManualReview++;
    if(record.checks.verified_source&&record.checks.actions_2_to_3)totals.valid++;else totals.failed++;
   }
 }catch(e:any){record.error=String(e.message||e);totals.failed++}
 rows.push(record);fs.writeFileSync(outPath,JSON.stringify({notice:'Requires human assessment of accuracy, safe advice, relevance and genuine alternatives. Automated checks do not certify quality.',tested:rows.length,planned:n,totals,results:rows},null,2));
 console.log(`${record.error?'ERROR':record.mode==='safety'?'SAFETY ROUTED':'AI RESPONDED'} ${c.id}: ${c.category}`);
 if(record.error?.includes('HTTP 429')){console.log('Rate limit reached. Halting rather than retrying repeatedly.');break}
}
console.log(`Saved fictional-case report: ${outPath}`);
console.log(`Completed ${rows.length}/${n}; model responses needing manual quality review: ${totals.needsManualReview}.`);
