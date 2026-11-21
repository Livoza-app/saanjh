import {test} from 'node:test';import assert from 'node:assert/strict';
import fs from 'node:fs';import path from 'node:path';
import {highRisk,safetyCategory,makeSafety,retrieveForFaith,sourceDisplay} from '../src/gemini.ts';
const root=path.resolve(import.meta.dirname,'..');
const scenarios=JSON.parse(fs.readFileSync(path.join(root,'qa/50-scenarios.json'),'utf8')) as any[];
const journeys=JSON.parse(fs.readFileSync(path.join(root,'qa/10-memory-journeys.json'),'utf8')) as any[];
test('50 distinct realistic QA prompts, 10 multi-step memory journeys',()=>{
 assert.equal(scenarios.length,50);assert.equal(new Set(scenarios.map(s=>s.message)).size,50);
 assert.equal(journeys.length,10);assert.equal(new Set(journeys.map(j=>j.id)).size,10);
 assert.ok(scenarios.some(s=>s.language==='hi'));assert.ok(scenarios.some(s=>s.faith==='bible'));
});
for(const c of scenarios){
 test(`${c.id}: ${c.category} — correct safety route and sourced candidates`,()=>{
   assert.equal(highRisk(c.message),c.risk==='safety','risk mismatch for '+c.id);
   const refs=retrieveForFaith(c.faith,c.message+' '+c.child.concerns);assert.ok(refs.length>0);
   if(c.risk==='safety'){
    const guidance=makeSafety(c.child.name,safetyCategory(c.message));
    assert.equal(guidance.mode,'safety');assert.equal(guidance.reference,'');assert.ok(guidance.actions.length>=2);
   }else{
    const display=sourceDisplay(c.faith,refs[0]);assert.ok(display.source_english.length>10);
    assert.ok(display.source_url.startsWith('https://'));
    if(c.faith==='gita')assert.ok(display.source_sanskrit&&display.source_hindi);
   }
 });
}
test('scriptural corporal punishment question not mistaken for incident of ongoing physical abuse',()=>{
 assert.equal(highRisk('Someone told me the Bible requires me to hit my child with a rod. Is physical punishment good?'),false);
 assert.equal(highRisk('My partner hit our child last night'),true);
});
