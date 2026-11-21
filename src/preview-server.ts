/** Localhost-only Saanjh product preview and optional Gemini endpoint. Account sync integration is optional; no payments.
 * Browser stores demo profiles locally unless optional account sync is configured. NOT suitable for public hosting.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {geminiGuidance,highRisk,safetyCategory,makeSafety,retrieveForFaith,BIBLE_SOURCES,sourceDisplay} from './gemini.ts';
import {sourceVerse} from './corpus.ts';
import {screenForSafety} from './safety-triage.ts';
import {loadCorpus} from './corpus.ts';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const port=Number(process.env.PORT||3030);
const key=process.env.GEMINI_API_KEY||'';
const preview=fs.readFileSync(path.join(ROOT,'saanjh-preview.html'));
const cloudModule=fs.readFileSync(path.join(ROOT,'cloud-client.js'));
// Supabase anon/publishable credentials are public by design; do not put service-role keys here.
let rawCloud:any={};
try{rawCloud=JSON.parse(fs.readFileSync(path.join(ROOT,'cloud-config.json'),'utf8'))}catch{}
const supabaseUrl=String(process.env.SAANJH_SUPABASE_URL||rawCloud.supabaseUrl||'').replace(/\/$/,'');
const supabasePublicKey=String(process.env.SAANJH_SUPABASE_PUBLISHABLE_KEY||rawCloud.supabasePublishableKey||'');
const cloudConfigured=/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(supabaseUrl)&&supabasePublicKey.length>15&&!/SERVICE_ROLE|sk_/.test(supabasePublicKey);
const perUserRequests=new Map<string,number[]>();
async function verifiedCloudUser(req:http.IncomingMessage){
 if(!cloudConfigured)return null;
 const token=/^Bearer (.{20,5000})$/i.exec(String(req.headers.authorization||''))?.[1];
 if(!token)throw Object.assign(Error('Sign in to use Gemini'),{statusCode:401});
 const result=await fetch(supabaseUrl+'/auth/v1/user',{headers:{Authorization:'Bearer '+token,apikey:supabasePublicKey},signal:AbortSignal.timeout(8000)});
 if(!result.ok)throw Object.assign(Error('Sign-in session expired'),{statusCode:401});
 const user=await result.json();
 if(!user.id||typeof user.id!=='string')throw Object.assign(Error('Unable to verify account'),{statusCode:401});
 return {id:user.id,token};
}
async function claimReply(user:{id:string;token:string}){
 const r=await fetch(supabaseUrl+'/rest/v1/rpc/saanjh_claim_reply',{method:'POST',headers:{apikey:supabasePublicKey,Authorization:'Bearer '+user.token,'Content-Type':'application/json'},body:'{}',signal:AbortSignal.timeout(8000)});
 if(!r.ok){const details=await r.text();if(details.includes('MONTHLY_LIMIT_REACHED'))throw Object.assign(Error('You have reached the 20-reply monthly beta limit.'),{statusCode:429});throw Object.assign(Error('Cloud usage setup failed; complete the Saanjh SQL setup.'),{statusCode:503})}
}

function out(res:http.ServerResponse,status:number,value:any){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(value))}
async function body(req:http.IncomingMessage){let data='';for await(const chunk of req){data+=chunk;if(data.length>16000)throw Error('Request too large');}return JSON.parse(data||'{}')}
const server=http.createServer(async(req,res)=>{
 try{
 const p=new URL(req.url||'/',`http://127.0.0.1:${port}`).pathname;
 if(req.method==='GET'&&(p==='/'||p==='/index.html')){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; script-src 'self' 'unsafe-inline' https://esm.sh; connect-src 'self' https://esm.sh https://*.supabase.co; img-src 'self' data:; style-src 'self' 'unsafe-inline'; frame-ancestors 'none'; base-uri 'self'; form-action 'self' https://*.supabase.co"});return res.end(preview)}
 if(req.method==='GET'&&p==='/cloud-client.js'){res.writeHead(200,{'Content-Type':'text/javascript; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});return res.end(cloudModule)}
 if(req.method==='GET'&&p==='/api/public-config'){return out(res,200,{configured:cloudConfigured,...(cloudConfigured?{url:supabaseUrl,publishableKey:supabasePublicKey}: {})})}
 if(req.method==='GET'&&p==='/api/health'){return out(res,200,{ok:true,cloudConfigured,live:!!key,model:process.env.GEMINI_MODEL||'gemini-3.5-flash-lite',gitaVerses:loadCorpus().length,biblePassages:BIBLE_SOURCES.length,localOnly:true,publicReady:false,paymentEnabled:false})}
 if(req.method==='GET'&&p==='/api/source'){
  const url=new URL(req.url||'/',`http://127.0.0.1:${port}`),reference=url.searchParams.get('ref')||'',faith=url.searchParams.get('faith')||'gita';
  if(reference.length>45||!['gita','bible'].includes(faith))return out(res,400,{error:'Invalid scripture request'});
  const found=faith==='gita'?sourceVerse(reference):BIBLE_SOURCES.find(s=>s.reference===reference);
  if(!found)return out(res,404,{error:'Scripture source not found'});
  const source=faith==='gita'?{reference:found.reference,english:found.english,source_url:found.source_url}:found;
  return out(res,200,{reference,...sourceDisplay(faith as 'gita'|'bible',source as any)});
 }
 if(req.method==='POST'&&p==='/api/guidance'){
  if(!key)return out(res,503,{error:'Gemini is not configured. Preview will use clearly labelled local demo responses.'});
  const b=await body(req);
  if(!['gita','bible'].includes(b.faith)||typeof b.message!=='string'||b.message.length<4||b.message.length>2200||typeof b.parentName!=='string'||b.parentName.length>65||!b.child||typeof b.child.name!=='string'||b.child.name.length>65||!Number.isInteger(b.child.age)||b.child.age<1||b.child.age>17||!Array.isArray(b.previous)||b.previous.length>24)return out(res,400,{error:'Invalid chat details'});
  if(highRisk(b.message))return out(res,200,makeSafety(b.child.name,safetyCategory(b.message)));
  if(cloudConfigured){
   const user=await verifiedCloudUser(req);
   const now=Date.now(),recent=(perUserRequests.get(user!.id)||[]).filter(t=>now-t<60000);
   if(recent.length>=5)return out(res,429,{error:'Please slow down and try again shortly.'});
   recent.push(now);perUserRequests.set(user!.id,recent);
   await claimReply(user!);
  }
  const context={faith:b.faith,parentName:b.parentName.slice(0,65),child:{name:b.child.name.slice(0,65),age:b.child.age,concerns:String(b.child.concerns||'').slice(0,300)},message:b.message,language:b.language==='hi'?'hi':'en',responseMode:b.responseMode==='alternative'?'alternative':'normal',avoidActions:Array.isArray(b.avoidActions)?b.avoidActions.slice(0,5).filter((x:any)=>typeof x==='string').map((x:string)=>x.slice(0,350)):[],previous:b.previous.slice(-10).map((x:any)=>({role:x.role==='assistant'?'assistant':'parent',text:String(x.text||'').slice(0,650)})),familyMemory:{parentNotes:Array.isArray(b.familyMemory?.parentNotes)?b.familyMemory.parentNotes.slice(0,5).filter((x:any)=>typeof x==='string').map((x:string)=>x.slice(0,400)):[],suggestedActions:Array.isArray(b.familyMemory?.suggestedActions)?b.familyMemory.suggestedActions.slice(0,4).filter((x:any)=>typeof x==='string').map((x:string)=>x.slice(0,300)):[]},lastPlan:Array.isArray(b.lastPlan)?b.lastPlan.slice(0,3).map((x:any)=>String(x).slice(0,350)):[]};
  // A second AI screening layer catches indirect danger that fixed keywords miss.
  // Fail closed if the safety classifier cannot be run; do not silently provide
  // ordinary scripture-based advice in that situation.
  const screening=await screenForSafety(b.message,key);
  if(screening.classification!=='normal')return out(res,200,makeSafety(b.child.name,screening.classification));
  const answer=await geminiGuidance(context,key);return out(res,200,answer);
 }
 out(res,404,{error:'Not found'});
 }catch(e:any){console.error('Saanjh error:',String(e));const status=[401,429,503].includes(e.statusCode)?e.statusCode:502;out(res,status,{error:e.statusCode?String(e.message):'Unable to generate a verified answer. Please try later. A cloud quota unit may have been reserved for this attempt.'})}
});
server.listen(port,'127.0.0.1',()=>console.log(`SAANJH ${key?'Gemini-enabled':'offline demo'}: http://127.0.0.1:${port} (LOCAL ONLY)`));
