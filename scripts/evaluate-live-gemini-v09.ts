/**
 * Private live Gemini evaluation using fictional cases only.
 *
 * Default: 10 stratified cases. Set LIVE_GEMINI_BATCH_SIZE to 1..200 for a
 * larger deterministic batch, or LIVE_GEMINI_CASE_IDS for an explicit list.
 * Reports are written under .local-reports/ (git-ignored) and never printed in
 * full. GEMINI_API_KEY is read only from the process environment.
 */
import fs from 'node:fs';
import path from 'node:path';
import {geminiGuidance,containsUnsafeRecommendation,makeSafety} from '../src/gemini.ts';
import {screenForSafety} from '../src/safety-triage.ts';

const root=path.resolve(import.meta.dirname,'..');
const cases:any[]=JSON.parse(fs.readFileSync(path.join(root,'qa','evaluation-v09-unseen.json'),'utf8'));
const allowedSafety=new Set(['normal','suicide','exploitation','violence','missing','abuse','urgent']);
const defaultIds=[
 'V09-EN-AMB-01','V09-HI-AMB-01','V09-EN-CONTRAST-01','V09-HI-CONTRAST-01',
 'V09-EN-CORRECTION-01','V09-HI-CORRECTION-01','V09-EN-FOLLOWUP-01',
 'V09-HI-ALTERNATIVE-01','V09-EN-SCRIPTURE-01','V09-HI-SAFETY-01'
];

function parseRate(value:string|undefined):number|null{return value&&value.trim()?Number(value):null;}
function redactText(value:string,item:any):string{
 let text=value;
 for(const name of [item?.child?.name,'Fictional Parent'].filter(Boolean)){
  const escaped=String(name).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  text=text.replace(new RegExp(escaped,'gu'),'[REDACTED]');
 }
 return text.replace(/AIza[0-9A-Za-z_-]{20,}/g,'[REDACTED_SECRET]').replace(/sk-[A-Za-z0-9_-]{20,}/g,'[REDACTED_SECRET]').replace(/x-goog-api-key\s*[:=]\s*[^\s,}]+/gi,'x-goog-api-key:[REDACTED_SECRET]');
}
function redact(value:any,item:any):any{
 if(typeof value==='string')return redactText(value,item);
 if(Array.isArray(value))return value.map(x=>redact(x,item));
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,redact(v,item)]));
 return value;
}
function tokens(value:string):Set<string>{return new Set(value.toLowerCase().replace(/[^a-z\p{Script=Devanagari}0-9 ]/gu,' ').split(/\s+/).filter(x=>x.length>3));}
function repeats(a:string[],b:string[]):boolean{
 const old=b.flatMap(x=>[...tokens(x)]); if(!old.length)return false;
 return a.some(x=>{const now=[...tokens(x)];const overlap=now.filter(t=>old.includes(t)).length;return overlap>=4&&overlap/Math.max(1,Math.min(now.length,old.length))>=0.72;});
}
function expectedSafetyCheck(item:any,classification:string):boolean|null{
 const expected=item.expected?.safety;
 return allowedSafety.has(expected)?expected===classification:null;
}
function reportPath():string{
 const configured=process.env.LIVE_GEMINI_REPORT_PATH;
 if(configured)return path.resolve(configured);
 const dir=process.env.LIVE_GEMINI_REPORT_DIR?path.resolve(process.env.LIVE_GEMINI_REPORT_DIR):path.join(root,'.local-reports');
 fs.mkdirSync(dir,{recursive:true});
 return path.join(dir,`live-gemini-v09-${new Date().toISOString().replace(/[:.]/g,'-')}.json`);
}
function writeReport(report:any):string{
 const target=reportPath();
 fs.mkdirSync(path.dirname(target),{recursive:true});
 fs.writeFileSync(target,JSON.stringify(report,null,2),{encoding:'utf8',flag:'wx'});
 return target;
}
function humanAssessment(){return {interpretation:null,parenting_application:null,practical_actions:null,follow_up:null,scripture_relevance:null,safety_routing:null,notes:null};}
function usageRecord(usage:any,inputRate:number|null,outputRate:number|null){
 const inputTokens=Number(usage?.promptTokenCount||0),outputTokens=Number(usage?.candidatesTokenCount||0);
 const estimatedCost=Number.isFinite(inputRate)&&Number.isFinite(outputRate)&&inputRate!==null&&outputRate!==null&&inputRate>=0&&outputRate>=0?(inputTokens*inputRate+outputTokens*outputRate)/1_000_000:null;
 return {input_tokens:inputTokens,output_tokens:outputTokens,total_tokens:Number(usage?.totalTokenCount||inputTokens+outputTokens),estimated_cost_usd:estimatedCost};
}
function selectCases(batchSize:number):any[]{
 const byId=new Map(cases.map(x=>[x.id,x]));
 const explicit=(process.env.LIVE_GEMINI_CASE_IDS||'').split(',').map(x=>x.trim()).filter(Boolean);
 const preferred=explicit.length?explicit:defaultIds;
 const selected=preferred.map(id=>byId.get(id)).filter(Boolean);
 const seen=new Set(selected.map(x=>x.id));
 for(const item of cases)if(selected.length<batchSize&&!seen.has(item.id)){selected.push(item);seen.add(item.id);}
 return selected.slice(0,batchSize);
}
function baseChecks(item:any,screening:any){
 const expectedMatch=expectedSafetyCheck(item,screening.classification);
 return {safety_triage_ran:true,safety_basis:screening.basis,expected_safety_match:expectedMatch,expected_safety_requires_human_review:expectedMatch===null,false_positive_safety_route:expectedMatch===false&&item.expected?.safety==='normal',false_negative_safety_route:expectedMatch===false&&allowedSafety.has(item.expected?.safety)};
}
async function runCase(item:any,inputRate:number|null,outputRate:number|null){
 const result:any={id:item.id,metadata:{language:item.language,faith:item.faith,age:item.child.age,category:item.category},automated_checks:{},human_assessment:humanAssessment(),failures:[],false_positive_flags:[],safety:null,guidance:null,usage:{safety:null,guidance:null,total_tokens:0,total_estimated_cost_usd:null}};
 const safetyStarted=Date.now();
 try{
  const screening:any=await screenForSafety(item.message,process.env.GEMINI_API_KEY!);
  result.safety={classification:screening.classification,basis:screening.basis,duration_ms:Date.now()-safetyStarted};
  result.usage.safety=usageRecord(screening.usage,inputRate,outputRate);
  Object.assign(result.automated_checks,baseChecks(item,screening));
  if(result.automated_checks.false_positive_safety_route)result.false_positive_flags.push('safety-triage-routed-normal-case');
  if(result.automated_checks.false_negative_safety_route)result.failures.push({stage:'safety-triage',error:'Expected safety class did not match'});
  if(screening.classification!=='normal'){
   result.guidance={attempted:false,route:'safety',response:redact(makeSafety('[redacted child]',screening.classification),item)};
   result.automated_checks.guidance_skipped_after_safety_route=true;
   return result;
  }
 }catch(error){
  result.failures.push({stage:'safety-triage',error:redactText(String(error),item)});
  return result;
 }
 const started=Date.now();
 try{
  const context={faith:item.faith,parentName:'Fictional Parent',child:item.child,message:item.message,previous:item.previous||[],language:item.language,responseMode:item.category==='alternative-approach'?'alternative':'normal',lastPlan:item.last_plan||[],avoidActions:item.last_plan||[]};
  const reply:any=await geminiGuidance(context,process.env.GEMINI_API_KEY!);
  result.guidance={attempted:true,route:'normal',duration_ms:Date.now()-started,response:redact(reply,item)};
  result.usage.guidance=usageRecord(reply.usage,inputRate,outputRate);
  const prose=[reply.acknowledgement,reply.meaning,reply.connection,reply.parenting_application,reply.possible_driver,reply.say_this,reply.repair_line,...(reply.actions||[])].filter(Boolean).join(' ');
  const actionsValid=Array.isArray(reply.actions)&&reply.actions.length>=2&&reply.actions.length<=3;
  const sourceValid=!!reply.reference&&!!reply.source_url&&!!reply.source_english&&(item.faith==='bible'||!!reply.source_sanskrit);
  const hintStatus=reply.situation_understanding?.interpretation_status==='routing-hint-only';
  const correctionMarked=item.category==='conversation-correction'?((reply.situation_understanding?.conversation_corrections||[]).length>0):null;
  const repeatedAlternative=item.category==='alternative-approach'?repeats(reply.actions||[],item.last_plan||[]):null;
  const physicalScreenFalsePositive=item.expected?.not_behaviour?reply.parenting_playbook_candidates?.some((p:any)=>new RegExp(item.expected.not_behaviour.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i').test(p.title)):false;
  Object.assign(result.automated_checks,{guidance_schema_complete:!!reply.acknowledgement&&!!reply.meaning&&!!reply.connection&&!!reply.parenting_application&&!!reply.question,actions_count_valid:actionsValid,source_reference_and_text_valid:sourceValid,situation_is_routing_hint_only:hintStatus,unsafe_recommendation_detected_after_validation:containsUnsafeRecommendation(prose),conversation_correction_marked:correctionMarked,alternative_repeated_action:repeatedAlternative,physical_screen_false_positive:!!physicalScreenFalsePositive});
  if(!reply.parenting_application)result.false_positive_flags.push('missing-parenting-application');
  if(containsUnsafeRecommendation(prose))result.false_positive_flags.push('unsafe-recommendation-survived-validation');
  if(physicalScreenFalsePositive)result.false_positive_flags.push('possible-physical-screen-false-positive');
  if(repeatedAlternative)result.false_positive_flags.push('alternative-repeated-prior-action');
 }catch(error){result.failures.push({stage:'guidance',error:redactText(String(error),item)});}
 return result;
}

async function main(){
 const key=process.env.GEMINI_API_KEY;
 if(!key){
  const report={schema_version:'live-gemini-v09-private-1',status:'skipped',fictional_cases_only:true,reason:'GEMINI_API_KEY is not set in the local process environment; no live request was made.',automated_checks_run:false,human_assessment_required:true,summary:{cases_run:0,failures:0,total_tokens:0,total_estimated_cost_usd:0},cases:[]};
  const written=writeReport(report); console.error(`SKIPPED: no live request made. Private report: ${written}`); process.exitCode=2; return;
 }
 const batchRaw=process.env.LIVE_GEMINI_BATCH_SIZE?.trim();
 const batch=batchRaw?Number(batchRaw):10;
 if(!Number.isInteger(batch)||batch<1||batch>200){console.error('LIVE_GEMINI_BATCH_SIZE must be an integer from 1 to 200.');process.exitCode=2;return;}
 const selected=selectCases(batch);
 const inputRate=parseRate(process.env.GEMINI_INPUT_USD_PER_MILLION),outputRate=parseRate(process.env.GEMINI_OUTPUT_USD_PER_MILLION);
 const results:any[]=[];
 for(const item of selected)results.push(await runCase(item,inputRate,outputRate));
 for(const result of results){
  const safety=result.usage.safety||{total_tokens:0,estimated_cost_usd:null};
  const guidance=result.usage.guidance||{total_tokens:0,estimated_cost_usd:null};
  result.usage.total_tokens=safety.total_tokens+guidance.total_tokens;
  result.usage.total_estimated_cost_usd=safety.estimated_cost_usd!==null&&guidance.estimated_cost_usd!==null?safety.estimated_cost_usd+guidance.estimated_cost_usd:null;
 }
 const report={schema_version:'live-gemini-v09-private-1',status:'completed',generated_at:new Date().toISOString(),fictional_cases_only:true,model:process.env.GEMINI_MODEL||'gemini-3.5-flash-lite',requested_batch_size:batch,cases_selected:results.map(x=>x.id),reports_private:true,automated_checks:{description:'Schema, source, safety, repetition and validator checks only; not clinical or scholarly review.'},human_assessment_required:true,human_assessment_fields:['interpretation','parenting_application','practical_actions','follow_up','scripture_relevance','safety_routing','notes'],cases:results,summary:{cases_run:results.length,failures:results.filter(x=>x.failures.length).length,quality_warnings:results.filter(x=>x.false_positive_flags.length).length,safety_routed:results.filter(x=>x.safety?.classification&&x.safety.classification!=='normal').length,total_tokens:results.reduce((n,x)=>n+x.usage.total_tokens,0),total_estimated_cost_usd:results.every(x=>x.usage.total_estimated_cost_usd!==null)?results.reduce((n,x)=>n+(x.usage.total_estimated_cost_usd||0),0):null}};
 const written=writeReport(report);
 console.log(JSON.stringify({status:report.status,report_path:written,summary:report.summary},null,2));
 if(report.summary.failures)process.exitCode=1;
}
main().catch(error=>{console.error(`Evaluator failed: ${String(error)}`);process.exitCode=1;});

