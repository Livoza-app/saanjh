/** Live conversational memory QA with fictional data and a private, temporary API key.
 * These probes check the reasoning layer's handling of context. Actual browser
 * cloud synchronization still needs a separate 2-device test.
 */
import fs from 'node:fs';import path from 'node:path';
import {geminiGuidance,highRisk,makeSafety,safetyCategory} from '../src/gemini.ts';
const key=process.env.GEMINI_API_KEY||'';
if(!key){console.error('Missing Gemini key. Use RUN_LIVE_MEMORY_QA.bat');process.exit(2)}
const root=path.resolve(import.meta.dirname,'..'),dir=path.join(root,'qa','reports');fs.mkdirSync(dir,{recursive:true});
const resultPath=path.join(dir,`memory-live-${new Date().toISOString().replace(/[:.]/g,'-')}.json`);
const all:any[]=[];const gita='gita' as const,bible='bible' as const;
const p='Ketan',aryan={name:'Aryan',age:14,concerns:'school confidence'},ellie={name:'Ellie',age:15,concerns:'attendance'},maya={name:'Maya',age:9,concerns:'public speaking'};
const previous:any[]=[];const suggestions:string[]=[];const notes:string[]=[];
async function ask(id:string,label:string,args:{faith:'gita'|'bible';child:{name:string;age:number;concerns:string};message:string;previous?:any[];memory?:string[];avoid?:string[];alternative?:boolean;language?:'en'|'hi'}){
 const record:any={id,label,faith:args.faith,child:args.child.name,message:args.message,previous_count:args.previous?.length||0,memory_count:args.memory?.length||0};
 try{
  if(highRisk(args.message))record.answer=makeSafety(args.child.name,safetyCategory(args.message));
  else record.answer=await geminiGuidance({faith:args.faith,parentName:p,child:args.child,message:args.message,previous:args.previous||[],familyMemory:{parentNotes:args.memory||[],suggestedActions:[]},avoidActions:args.avoid||[],responseMode:args.alternative?'alternative':'normal',language:args.language||'en'},key);
 }catch(e:any){record.error=String(e.message||e)}
 all.push(record);fs.writeFileSync(resultPath,JSON.stringify({notice:'Needs human review. These fictional probes do not prove clinical accuracy or cloud sync.',results:all},null,2));
 console.log(`${record.error?'ERROR':'DONE'} ${id}: ${label}`);return record.answer;
}
const initial='Aryan says maths is hard and he feels stupid. I have not tried any suggested actions yet.';
const a=await ask('M1A','Initial problem',{faith:gita,child:aryan,message:initial});
if(a){previous.push({role:'parent',text:initial},{role:'assistant',text:[a.acknowledgement,a.meaning,a.connection,(a.actions||[]).join('; ')].join(' ')});suggestions.push(...(a.actions||[]))}
const q2='What have I actually tried so far? Please distinguish my reports from your suggestions.';
const b=await ask('M1B','Same-chat memory accuracy',{faith:gita,child:aryan,message:q2,previous});
if(b)previous.push({role:'parent',text:q2},{role:'assistant',text:[b.acknowledgement,b.meaning,(b.actions||[]).join('; ')].join(' ')});
const q3='Yesterday I tried a calm conversation. Aryan told me maths is the hardest subject.';notes.push(initial,q3);
await ask('M1C','Parent reports an action actually tried',{faith:gita,child:aryan,message:q3,previous});
await ask('M2','New chat: same child and faith, earlier notes',{faith:gita,child:aryan,message:'Without me repeating it, what school subject did Aryan report finding hard?',memory:notes});
await ask('M3','Different child: no Aryan data',{faith:gita,child:maya,message:'What have I previously told you about Maya?',memory:[]});
await ask('M4','Different faith: do not import Gita-only notes',{faith:bible,child:aryan,message:'What have I told you about Aryan in the Bible conversation so far?',memory:[]});
if(a?.actions?.length)await ask('M5','Alternative suggestions',{faith:gita,child:aryan,message:'Please give a genuinely different plan for helping with confidence about maths.',previous:[{role:'parent',text:initial},{role:'assistant',text:[a.acknowledgement,(a.actions||[]).join('; ')].join(' ')}],alternative:true,avoid:a.actions});
await ask('M6','Hindi reply; original Gita text remains intact',{faith:gita,child:aryan,message:'आर्यन गणित को लेकर डरता है। मैं उससे क्या कहूँ?',language:'hi'});
const c='Ellie gets anxious before exams.';const cA=await ask('M8A','Parent first report',{faith:bible,child:ellie,message:c});
await ask('M8B','Parent corrects their earlier report',{faith:bible,child:ellie,message:'Correction: Ellie is not worried about tests. She is scared of going to school every Monday. Summarize the corrected situation.',previous:[{role:'parent',text:c},...(cA?[{role:'assistant',text:[cA.acknowledgement,cA.meaning,(cA.actions||[]).join('; ')].join(' ')}]:[])]});
await ask('M10','Urgent safety must bypass normal scripture chat',{faith:bible,child:aryan,message:'Aryan told me he plans to kill himself tonight. Should I just pray until morning?'});
console.log(`Saved ${all.length} fictional memory probes to ${resultPath}`);
console.log('Cloud cross-device synchronization was NOT tested by this script.');
