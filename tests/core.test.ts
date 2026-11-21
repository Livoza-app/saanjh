import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {VERSES,CASES,lexicalRetrieve,byReference,isHighRisk,guardReference,hasUnknownCitations,loadState,saveState,initialState,localGuidance,crisisGuidance,newMessage} from '../src/core.ts';
test('50 unique references with valid links and draft labels',()=>{
 assert.equal(VERSES.length,50);assert.equal(new Set(VERSES.map(x=>x.id)).size,50);
 for(const v of VERSES){assert.match(v.reference,/^\d{1,2}\.\d{1,2}$/);assert.equal(v.source_url,`https://heritage.iitk.ac.in/SBG/${v.reference}`);assert.equal(v.status,'editorial_draft_not_expert_verified');assert.equal(v.is_quote,false);}
});
test('30 parenting test cases including one urgent safety case',()=>{assert.equal(CASES.length,30);assert.equal(CASES.filter(x=>x.requires_safety_escalation).length,1);});
test('focus on effort retrieves Gita 2.47',()=>{assert.equal(lexicalRetrieve('I worry about my child school grades and results')[0].reference,'2.47');});
test('reference gate blocks any verse not among retrieved',()=>{const r=[byReference('2.47')];assert.equal(guardReference('BG_2_47',r),true);assert.equal(guardReference('BG_99_99',r),false);assert.equal(hasUnknownCitations('Gita 17.15 says',r),true);assert.equal(hasUnknownCitations('Gita 2.47 says',r),false);});
test('high risk statements diverted from normal guidance',()=>{assert.equal(isHighRisk('My daughter says she wants to hurt herself and has a plan.'),true);assert.equal(isHighRisk('My child is having trouble with homework'),false);const g=crisisGuidance({id:'a',name:'A',age:15,concerns:'',createdAt:''});assert.equal(g.safety,true);assert.equal(g.verse_id,'');});
test('local response personalizes and cites only retrieved references',()=>{const c={id:'a',name:'Aryan',age:14,concerns:'',createdAt:''};const ret=[byReference('17.15')];const g=localGuidance('I shout at him',c,'Ketan',ret,[]);assert.equal(g.verse_id,'BG_17_15');assert.match(g.acknowledgement,/Ketan/);assert.match(g.actions.join(' '),/Aryan/);assert.equal(g.mode,'local_rules_demo');});
test('parent/child history persists without being cross-shared between children',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'gita-poc-'));const filepath=path.join(dir,'state.json');
 const s=initialState();s.children.push({id:'second',name:'Bina',age:10,concerns:'',createdAt:''});s.messages.push(newMessage('aryan-demo','parent','This is Aryan specific.'));s.messages.push(newMessage('second','parent','This is Bina specific.'));
 saveState(filepath,s);const got=loadState(filepath);assert.equal(got.children.length,2);assert.equal(got.messages.filter(x=>x.childId==='second').length,1);assert.equal(got.messages.filter(x=>x.childId==='aryan-demo').length,1);fs.rmSync(dir,{recursive:true,force:true});
});
