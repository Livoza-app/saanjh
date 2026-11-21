import {test} from 'node:test';
import assert from 'node:assert/strict';
import {BIBLE_SOURCES,bibleRetrieve,gitaRetrieve,highRisk,geminiGuidance} from '../src/gemini.ts';

test('Bible pilot records sourced and distinct; their text is verbatim excerpts',()=>{
 assert.equal(BIBLE_SOURCES.length,14);
 assert.equal(new Set(BIBLE_SOURCES.map(x=>x.reference)).size,14);
 assert.ok(BIBLE_SOURCES.every(x=>x.source_url.startsWith('https://ebible.org/engwebp/')&&x.english.length>20));
});
test('Bible parenting anger retrieval finds a relevant genuine passage',()=>{
 assert.ok(bibleRetrieve('my teenager is angry and shouting')[0]);
 assert.ok(bibleRetrieve('anger fight and shouting',6).some(x=>x.reference==='Proverbs 15:1'));
});
test('Gita retrieval uses the complete uploaded 700 verse corpus',()=>{
 const refs=gitaRetrieve('my child is worried about grades and school pressure');
 assert.ok(refs.length>=3);
 assert.ok(refs.every(x=>x.reference&&x.english&&x.source_url));
 assert.ok(refs.some(x=>x.reference==='2.47'));
});
test('Urgent risks are routed to safer response',()=>{
 assert.equal(highRisk('My daughter is talking about suicide'),true);
 assert.equal(highRisk('My child has homework trouble'),false);
});
test('Mock Gemini response is accepted only with retrieved Bible reference',async()=>{
 const old=globalThis.fetch;
 (globalThis as any).fetch=async (_url:string,opts:any)=>{
  const prompt=JSON.parse(opts.body);const allowed=JSON.parse(prompt.contents[0].parts[0].text).allowed_sources;
  assert.ok(allowed.length>0);
  return {ok:true,json:async()=>({candidates:[{content:{parts:[{text:JSON.stringify({acknowledgement:'Ketan, I hear your concern about your child.',reference:allowed[0].reference,meaning:'The selected passage emphasizes gentle and considered speech.',connection:'In this family concern, communication may be part of the tension.',actions:['Ask Aryan what is most difficult, then listen without interrupting.','Together choose one manageable next step for tonight.'],question:'What have you tried so far?',follow_up_days:3})}]}}],usageMetadata:{promptTokenCount:300}})} as any;
 };
 try {const g=await geminiGuidance({faith:'bible',parentName:'Ketan',child:{name:'Aryan',age:14,concerns:'school'},message:'We keep arguing about school grades',previous:[]},'TEST_ONLY');assert.equal(g.mode,'gemini');assert.ok(g.source_url.includes('ebible.org'));assert.equal(g.actions.length,2);assert.equal(g.source_english.length>20,true)}finally{globalThis.fetch=old}
});
test('Invalid Gemini reference is rejected even if model writes plausible guidance',async()=>{
 const old=globalThis.fetch;
 (globalThis as any).fetch=async()=>({ok:true,json:async()=>({candidates:[{content:{parts:[{text:JSON.stringify({acknowledgement:'Hi',reference:'Imaginary 1:999',explanation:'Bad',actions:['Listen calmly.','Try a second approach.'],question:'What next?',follow_up_days:3})}]}}]})}) as any;
 try{await assert.rejects(()=>geminiGuidance({faith:'bible',parentName:'Ketan',child:{name:'Aryan',age:14,concerns:'school'},message:'We keep arguing about school grades',previous:[]},'TEST_ONLY'),/Source citation validation failed/)}finally{globalThis.fetch=old}
});
