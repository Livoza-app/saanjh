import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {PARENTING_PLAYBOOKS,matchParentingPatterns,parentingHints} from '../src/parenting-playbooks.ts';
const qa=path.resolve(import.meta.dirname,'..','qa','parenting-scenarios-400.json');
const scenarios:any[]=JSON.parse(fs.readFileSync(qa,'utf8'));
test('50 nonduplicated source-linked playbooks exist',()=>{
 assert.equal(PARENTING_PLAYBOOKS.length,50);
 assert.equal(new Set(PARENTING_PLAYBOOKS.map(p=>p.id)).size,50);
 for(const p of PARENTING_PLAYBOOKS){
  assert.ok(p.guidance_pattern.length>=50);
  assert.ok(p.source_links.every(x=>x.startsWith('https://')));
 }
});
test('400 uniquely numbered fictional cases: 300 development and 100 holdout',()=>{
 assert.equal(scenarios.length,400);
 assert.equal(new Set(scenarios.map(s=>s.id)).size,400);
 assert.equal(scenarios.filter(s=>s.split==='development').length,300);
 assert.equal(scenarios.filter(s=>s.split==='holdout').length,100);
});
test('no urgent playbook is passed as normal coaching',()=>{
 for(const c of scenarios.filter(c=>c.risk==='urgent')){
  assert.ok(parentingHints(c.message,c.age).every(p=>!PARENTING_PLAYBOOKS.find(x=>x.id===p.pattern_id)?.routing?.includes('urgent')));
 }
});
test('age constraints and snippets of unrelated children do not enter hints',()=>{
 const matches=matchParentingPatterns('My six-year-old refuses to share toys and grabs every car',6);
 assert.ok(matches.every(x=>x.age_relevance==='in-range'));
 assert.equal(parentingHints('???',13).length,0);
});
test('priority guide to family is editorial not stated as scripture',()=>{
 const match=parentingHints('My child has a tantrum every time we leave the supermarket',4);
 assert.ok(match.length>=1);
 assert.ok(match.every(x=>x.disclaimer.includes('NOT scripture')));
});
test('full 46 normal-topic pattern catalogue included without unsafe coaching patterns', async()=>{
 const {patternCatalogue,validPatternId}=await import('../src/parenting-playbooks.ts');
 const c=patternCatalogue();
 assert.equal(c.length,46);
 assert.ok(c.every(x=>x.ages.length===2 && x.possible_practical_direction.length>30));
 assert.equal(validPatternId('PB99'),false);
 assert.equal(validPatternId('PB44'),false); // urgent self-harm
 assert.equal(validPatternId('PB16'),true);
});
test('Gemini gets full pattern menu and returns validated pattern ID',async()=>{
 const {geminiGuidance}=await import('../src/gemini.ts');
 const before=globalThis.fetch;
 let read:any;
 (globalThis as any).fetch=async (_url:string,opts:any)=>{
  read=JSON.parse(JSON.parse(opts.body).contents[0].parts[0].text);
  assert.equal(read.parenting_pattern_catalogue.length,46);
  const response={parenting_pattern_id:'PB16',reference:read.allowed_sources[0].reference,acknowledgement:'Ketan, it sounds exhausting when schoolwork triggers arguments.',meaning:'This passage encourages calm, thoughtful conduct.',connection:'Your interactions with Aryan may benefit from a calmer discussion.',actions:['Ask what makes today’s homework especially difficult without interrupting.','Agree on a manageable piece of work together with an option to pause briefly.'],question:'Which subject feels hardest for Aryan at the moment?',follow_up_days:3};
  return {ok:true,json:async()=>({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(response)}]}}]})} as any;
 };
 try{
  const a=await geminiGuidance({faith:'gita',parentName:'Ketan',child:{name:'Aryan',age:14,concerns:'homework'},message:'Aryan gets upset about homework.',previous:[]},'FAKE_TEST_KEY');
  assert.equal(a.parenting_pattern_id,'PB16');
 }finally{globalThis.fetch=before}
});
test('Gemini cannot return unrecognized pattern IDs as facts',async()=>{
 const {geminiGuidance}=await import('../src/gemini.ts');
 const before=globalThis.fetch;
 (globalThis as any).fetch=async (_url:string,opts:any)=>{
  const b=JSON.parse(opts.body);
  const allowed=JSON.parse(b.contents[0].parts[0].text).allowed_sources;
  return {ok:true,json:async()=>({candidates:[{content:{parts:[{text:JSON.stringify({parenting_pattern_id:'PB1234',reference:allowed[0].reference,acknowledgement:'Ketan, I hear this is a difficult evening.',meaning:'The passage asks readers to reflect before responding.',connection:'A thoughtful response may help this family situation.',actions:['Ask the child what has made this moment difficult.','Choose one manageable step to try together this afternoon.'],question:'What happened immediately before the disagreement?',follow_up_days:3})}]}}]})} as any;
 };
 try{await assert.rejects(()=>geminiGuidance({faith:'gita',parentName:'Ketan',child:{name:'Aryan',age:14,concerns:'school'},message:'Aryan gets upset about schoolwork.',previous:[]},'FAKE'),/unknown parenting pattern/)}finally{globalThis.fetch=before}
});
