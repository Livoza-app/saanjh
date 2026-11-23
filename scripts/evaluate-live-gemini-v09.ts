/**
 * Live v0.9 Gemini evaluation using fictional cases only.
 * Requires GEMINI_API_KEY in the local process environment. Never print the key.
 * Token counts are recorded; cost is estimated only when the caller supplies
 * GEMINI_INPUT_USD_PER_MILLION and GEMINI_OUTPUT_USD_PER_MILLION.
 */
import fs from 'node:fs';
import path from 'node:path';
import {geminiGuidance,containsUnsafeRecommendation} from '../src/gemini.ts';

const root=path.resolve(import.meta.dirname,'..');
const cases:any[]=JSON.parse(fs.readFileSync(path.join(root,'qa','evaluation-v09-unseen.json'),'utf8'));
const key=process.env.GEMINI_API_KEY;
if(!key){
 console.error('SKIPPED: GEMINI_API_KEY is not set in the local process environment. No live request was made.');
 process.exitCode=2;
}else{
 const selected=cases.filter(x=>['V09-EN-AMB-01','V09-HI-AMB-01','V09-EN-CORRECTION-01','V09-HI-CORRECTION-01','V09-EN-ALTERNATIVE-01','V09-HI-ALTERNATIVE-01','V09-EN-SCRIPTURE-01','V09-HI-SCRIPTURE-01'].includes(x.id));
 const parseRate=(value:string|undefined)=>value&&value.trim()?Number(value):null;
 const inputRate=parseRate(process.env.GEMINI_INPUT_USD_PER_MILLION);
 const outputRate=parseRate(process.env.GEMINI_OUTPUT_USD_PER_MILLION);
 const results:any[]=[];
 for(const item of selected){
  const started=Date.now();
  const ctx={faith:item.faith,parentName:'Fictional Parent',child:item.child,message:item.message,previous:item.previous||[],language:item.language,responseMode:item.category==='alternative-approach'?'alternative':'normal',lastPlan:item.last_plan||[],avoidActions:item.last_plan||[]};
  try{
   const reply:any=await geminiGuidance(ctx,key);
   const usage=reply.usage||{};
   const inputTokens=Number(usage.promptTokenCount||0),outputTokens=Number(usage.candidatesTokenCount||0);
   const estimatedCost=Number.isFinite(inputRate)&&Number.isFinite(outputRate)&&inputRate!>=0&&outputRate!>=0
    ? (inputTokens*inputRate+outputTokens*outputRate)/1_000_000
    : null;
   const prose=[reply.acknowledgement,reply.meaning,reply.connection,reply.parenting_application,reply.possible_driver,reply.say_this,reply.repair_line,...(reply.actions||[])].filter(Boolean).join(' ');
   const flags:string[]=[];
   if(!reply.parenting_application)flags.push('missing-parenting-application');
   if(containsUnsafeRecommendation(prose))flags.push('unsafe-recommendation-survived-validation');
   if(item.expected?.not_behaviour&&reply.parenting_playbook_candidates?.some((p:any)=>new RegExp(item.expected.not_behaviour.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i').test(p.title)))flags.push('possible-physical-screen-false-positive');
   results.push({id:item.id,status:flags.length?'quality-warning':'pass',duration_ms:Date.now()-started,reference:reply.reference,mode:reply.mode,response_mode:reply.response_mode,quality:{has_acknowledgement:!!reply.acknowledgement,has_meaning:!!reply.meaning,has_parenting_application:!!reply.parenting_application,actions_count:Array.isArray(reply.actions)?reply.actions.length:0,has_question:!!reply.question,situation_hint_status:reply.situation_understanding?.interpretation_status||null},false_positive_flags:flags,usage:{input_tokens:inputTokens,output_tokens:outputTokens,total_tokens:Number(usage.totalTokenCount||inputTokens+outputTokens),estimated_cost_usd:estimatedCost},output_excerpt:{acknowledgement:String(reply.acknowledgement||'').slice(0,240),application:String(reply.parenting_application||'').slice(0,300),first_action:String(reply.actions?.[0]||'').slice(0,300)}});
  }catch(error){
   results.push({id:item.id,status:'failed',duration_ms:Date.now()-started,error:String(error)});
  }
 }
 const failures=results.filter(x=>x.status==='failed');
 const report={suite:'live-gemini-v09',fictional_cases_only:true,model:process.env.GEMINI_MODEL||'gemini-3.5-flash-lite',case_count:selected.length,results,summary:{passed:results.filter(x=>x.status==='pass').length,quality_warnings:results.filter(x=>x.status==='quality-warning').length,failed:failures.length,total_input_tokens:results.reduce((n,x)=>n+(x.usage?.input_tokens||0),0),total_output_tokens:results.reduce((n,x)=>n+(x.usage?.output_tokens||0),0),total_estimated_cost_usd:results.every(x=>x.usage?.estimated_cost_usd!==null)?results.reduce((n,x)=>n+(x.usage?.estimated_cost_usd||0),0):null}};
 console.log(JSON.stringify(report,null,2));
 if(failures.length)process.exitCode=1;
}

