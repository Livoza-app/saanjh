import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {CASES} from '../src/core.ts';
import {gitaRetrieve,containsUnsupportedCitations,highRisk} from '../src/gemini.ts';
import {matchedConcepts} from '../src/retrieval.ts';

test('the production Gita retriever retrieves an expected source among top five in curated development scenarios',()=>{
 for(const c of CASES){if(c.requires_safety_escalation)continue;
  const refs=gitaRetrieve(c.message,5).map(x=>x.reference);
  assert.ok(c.expected_references.some((r:string)=>refs.includes(r)),`${c.id}: ${refs.join(',')}`);
 }
});
test('the 20 paraphrase and safety regression scenarios pass after local tuning',()=>{
 const check=JSON.parse(fs.readFileSync(new URL('../data/paraphrase_checks.json',import.meta.url),'utf8'));
 for(const c of check){if(c.expected_safety){assert.equal(highRisk(c.message),true);continue;}
  const refs=gitaRetrieve(c.message,5).map(x=>x.reference);
  assert.ok(c.expected.some((r:string)=>refs.includes(r)),`${c.id}: ${refs.join(',')}`);
 }
});
test('retrieval combines full 700-source text with named situation concepts',()=>{
 const matches=matchedConcepts('My child is being bullied by classmates');
 assert.ok(matches.includes('bullying_and_exclusion'));
 const r=gitaRetrieve('My child is being bullied by classmates',7);
 assert.ok(r.some(x=>x.reference==='16.2'));
 assert.ok(r.every(x=>x.english&&x.source_url&&x.reference));
});
test('unsupported verse references are rejected in generated text',()=>{
 assert.equal(containsUnsupportedCitations('The Gita teaches BG 2.50', 'gita','2.47'),true);
 assert.equal(containsUnsupportedCitations('Reflect on Gita 2.47', 'gita','2.47'),false);
 assert.equal(containsUnsupportedCitations('Consider John 3:16 as well', 'bible','Proverbs 15:1'),true);
 assert.equal(containsUnsupportedCitations('Proverbs 15:1 encourages reflection', 'bible','Proverbs 15:1'),false);
});
test('serious physical abuse is not routed to routine advice',()=>{
 assert.ok(highRisk('My partner hit our child last night'));
 assert.ok(highRisk('I think my daughter was sexually abused'));
 assert.ok(highRisk('My son wants to die'));
 assert.equal(highRisk('My son is struggling with a maths exam'),false);
});
