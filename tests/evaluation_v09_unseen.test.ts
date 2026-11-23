import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {understandSituation} from '../src/situation-understanding.ts';

const root=path.resolve(import.meta.dirname,'..');
const cases:any[]=JSON.parse(fs.readFileSync(path.join(root,'qa','evaluation-v09-unseen.json'),'utf8'));
const priorEvaluation:any[]=JSON.parse(fs.readFileSync(path.join(root,'data','evaluation_cases.json'),'utf8'));
const priorScenarios:any[]=JSON.parse(fs.readFileSync(path.join(root,'qa','parenting-scenarios-400.json'),'utf8'));

test('v0.9 unseen evaluation set is fictional, separate from development and final fixtures',()=>{
 assert.ok(cases.length>=12);
 assert.equal(new Set(cases.map(x=>x.id)).size,cases.length);
 assert.ok(cases.every(x=>/^V09-/.test(x.id)));
 assert.ok(cases.every(x=>x.child?.age>=5&&x.child?.age<=17));
 assert.ok(new Set(cases.map(x=>x.child.age)).size>=6);
 assert.deepEqual(new Set(cases.map(x=>x.language)),new Set(['en','hi']));
 const required=['ambiguous-wording','contrasting-circumstance','age-contrast','conversation-correction','alternative-approach','scripture-relevance'];
 for(const category of required)assert.ok(cases.some(x=>x.category===category),`missing ${category}`);
 const prior=new Set([...priorEvaluation,...priorScenarios].map(x=>String(x.message||'')));
 assert.ok(cases.every(x=>!prior.has(x.message)), 'an unseen message duplicates an earlier fixture');
});

test('unseen cases retain language, age and routing-hint status without becoming final interpretations',()=>{
 for(const item of cases){
  const s=understandSituation({message:item.message,child:item.child,previous:item.previous,language:item.language});
  assert.equal(s.child_age,item.child.age,item.id);
  assert.equal(s.language,item.language,item.id);
  assert.equal(s.interpretation_status,'routing-hint-only',item.id);
 }
});

test('contrasting screen wording routes by circumstance rather than the shared word',()=>{
 const physical=cases.find(x=>x.id==='V09-EN-AMB-01');
 const device=cases.find(x=>x.id==='V09-EN-CONTRAST-01');
 const physicalS=understandSituation({message:physical.message,child:physical.child,language:physical.language});
 const deviceS=understandSituation({message:device.message,child:device.child,language:device.language});
 assert.equal(physicalS.reported_behaviours.some(x=>/screen use|gaming/i.test(x)),false);
 assert.equal(deviceS.reported_behaviours.some(x=>/screen use|gaming/i.test(x)),true);
});

test('conversation-correction cases are explicitly marked for latest-message priority',()=>{
 for(const item of cases.filter(x=>x.category==='conversation-correction')){
  const s=understandSituation({message:item.message,child:item.child,previous:item.previous,language:item.language});
  assert.ok((s.conversation_corrections||[]).length>=1,item.id);
  assert.ok((s.conversation_corrections||[]).some(x=>x===item.message),item.id);
 }
});

