import http from 'node:http';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {ROOT,VERSES,CASES,loadState,saveState,newMessage,lexicalRetrieve,semanticRetrieve,openAIGuidance,localGuidance,crisisGuidance,isHighRisk,safeId,initialState,loadSourceTexts} from './core.ts';
import {loadCorpus,sourceVerse,searchCorpus,nearbyContext} from './corpus.ts';
const host='127.0.0.1';const port=Number(process.env.PORT||3030);
const storage=path.join(ROOT,'data','private-local-state.json');
const apiKey=process.env.OPENAI_API_KEY||'';
function respond(res:http.ServerResponse,status:number,payload:unknown){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(payload));}
function err(res:http.ServerResponse,e:any){respond(res,400,{error:String(e?.message||e)});}
async function readBody(req:http.IncomingMessage):Promise<any>{let s='';for await(const c of req){s+=c.toString();if(s.length>14000)throw new Error('Request too large');}return s?JSON.parse(s):{};}
const server=http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url||'/',`http://${host}:${port}`);
  if(req.method==='GET' && url.pathname==='/'){
   res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});
   res.end(fs.readFileSync(path.join(ROOT,'index.html'),'utf8'));return;
  }
  if(req.method==='GET' && url.pathname==='/library'){
   res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});
   res.end(fs.readFileSync(path.join(ROOT,'gita-library-open-me.html'),'utf8'));return;
  }
  if(req.method==='GET' && url.pathname==='/api/health'){return respond(res,200,{ok:true,mode:apiKey&&loadSourceTexts().size===700?'ai_rag':'local_rules',curated_verse_count:VERSES.length,scripture_verse_count:loadCorpus().length,scenario_count:CASES.length,warning:'local prototype, no authentication'});}
  if(req.method==='GET' && url.pathname==='/api/all-verses'){return respond(res,200,VERSES);}
  if(req.method==='GET' && url.pathname==='/api/verses'){return respond(res,200,lexicalRetrieve(url.searchParams.get('query')||'',5));}
  if(req.method==='GET' && url.pathname==='/api/cases'){return respond(res,200,CASES);}
  if(req.method==='GET' && url.pathname==='/api/corpus/status'){return respond(res,200,{imported_verses:loadCorpus().length,chapters:18,source:'Hansi Gita Bhawan Trust',usage:'local research; translations require attributed use and commercial-rights review'});}
  if(req.method==='GET' && url.pathname==='/api/corpus/search'){
   const q=url.searchParams.get('query')||'';
   if(q.length>240)throw new Error('Search is too long');
   return respond(res,200,searchCorpus(q,12));
  }
  if(req.method==='GET' && url.pathname==='/api/corpus/verse'){
   const ref=url.searchParams.get('ref')||'';
   if(!/^\d{1,2}\.\d{1,2}$/.test(ref))throw new Error('Use chapter.verse reference, e.g. 2.47');
   const v=sourceVerse(ref);return respond(res,v?200:404,v?{verse:v,context:nearbyContext(ref,1)}:{error:'Unknown verse'});
  }

  if(req.method==='GET' && url.pathname==='/api/state'){return respond(res,200,loadState(storage));}
  if(req.method==='POST' && url.pathname==='/api/profile'){
   const body=await readBody(req);let state=loadState(storage);
   state.profile={name:String(body.name||'Parent').trim().slice(0,70),faith:'Bhagavad Gita',language:String(body.language||'English').slice(0,40)};
   saveState(storage,state);return respond(res,200,state);
  }
  if(req.method==='POST' && url.pathname==='/api/children'){
   const body=await readBody(req);let state=loadState(storage);
   const age=Number(body.age);
   if(!Number.isInteger(age)||age<1||age>17)throw new Error('Age must be 1–17 for this parenting demo');
   const id=body.id ? String(body.id) : crypto.randomUUID();
   if(!safeId(id))throw new Error('Invalid child profile ID');
   const child={id,name:String(body.name||'Child').trim().slice(0,70),age,concerns:String(body.concerns||'').slice(0,1000),createdAt:new Date().toISOString()};
   if(!child.name)throw new Error('Please enter a child nickname');
   const i=state.children.findIndex(c=>c.id===id);
   if(i<0)state.children.push(child);else state.children[i]={...state.children[i],...child};
   saveState(storage,state);return respond(res,200,state);
  }
  if(req.method==='DELETE' && url.pathname.startsWith('/api/children/')){
   const id=url.pathname.split('/').at(-1)||'';let state=loadState(storage);
   state.children=state.children.filter(c=>c.id!==id);
   state.messages=state.messages.filter(m=>m.childId!==id);
   delete state.lastPlans[id];saveState(storage,state);return respond(res,200,state);
  }
  if(req.method==='DELETE' && url.pathname==='/api/state'){
   const state=initialState();state.profile={name:'Parent',faith:'Bhagavad Gita',language:'English'};state.children=[];
   saveState(storage,state);return respond(res,200,{ok:true});
  }
  if(req.method==='POST' && url.pathname==='/api/chat'){
   const body=await readBody(req);let state=loadState(storage);
   const child=state.children.find(c=>c.id===body.childId);
   if(!child)throw new Error('Select or create a child profile');
   const message=String(body.message||'').trim();if(message.length<4||message.length>3000)throw new Error('Message must have 4–3000 characters');
   const prior=state.messages.filter(m=>m.childId===child.id);
   let matched=lexicalRetrieve(message+' '+child.concerns,5);
   let guidance;
   if(isHighRisk(message)){guidance=crisisGuidance(child);matched=[];}
   else if(apiKey&&loadSourceTexts().size===700){
    try {matched=await semanticRetrieve(message+' '+child.concerns,apiKey,5);
     guidance=await openAIGuidance(message,child,state.profile.name,matched,prior,state.lastPlans[child.id],apiKey);
    }catch(e){console.warn('AI unavailable; showing local simulation (not AI):',String(e));guidance=localGuidance(message,child,state.profile.name,matched,prior);}
   }else guidance=localGuidance(message,child,state.profile.name,matched,prior);
   state.messages.push(newMessage(child.id,'parent',message));
   const text=[guidance.acknowledgement,guidance.explanation,...guidance.actions.map((a,i)=>`${i+1}. ${a}`),guidance.question].join('\n\n');
   state.messages.push(newMessage(child.id,'assistant',text,{verseId:guidance.verse_id,actions:guidance.actions,mode:guidance.mode,safety:!!guidance.safety}));
   if(!guidance.safety)state.lastPlans[child.id]={actions:guidance.actions,date:new Date().toISOString(),verseId:guidance.verse_id};
   // Deliberately no inferred sensitive profile changes; context comes from conversation history.
   saveState(storage,state);
   return respond(res,200,{guidance,verse:matched.find(v=>v.id===guidance.verse_id)||null,matched:matched.map(x=>({id:x.id,reference:x.reference,title:x.title})),state});
  }
  respond(res,404,{error:'Not found'});
 }catch(e){err(res,e)}
});
server.listen(port,host,()=>console.log(`Gita Parenting research prototype: http://${host}:${port} | ${apiKey&&loadSourceTexts().size===700?'AI + retrieval enabled':'offline rules simulation'} | local-only / NOT FOR PUBLIC DEPLOYMENT`));
