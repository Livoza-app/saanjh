import test from 'node:test';
import assert from 'node:assert/strict';
import {loadCorpus,sourceVerse,searchCorpus,nearbyContext} from '../src/corpus.ts';
import {loadSourceTexts} from '../src/core.ts';

test('user-provided Gita corpus imports all 700 unique verses from 18 complete chapters',()=>{
 const all=loadCorpus();assert.equal(all.length,700);
 assert.equal(new Set(all.map(v=>v.reference)).size,700);
 assert.equal(new Set(all.map(v=>v.chapter)).size,18);
 assert.equal(all[0].reference,'1.1');assert.equal(all.at(-1)?.reference,'18.78');
 for(const v of all){
  assert.equal(v.reference,`${v.chapter}.${v.verse}`);
  assert.ok(v.sanskrit&&v.iast&&v.english&&v.hindi);
  assert.match(v.source_url,/^https:\/\/gitabhawan\.org\.in\/gita\/chapters\/\d+#bg-\d+-\d+$/);
 }
});
test('2.47 is found directly from sourced text, with its immediate chapter context',()=>{
 const v=sourceVerse('2.47');assert.ok(v);
 assert.match(v.sanskrit,/कर्मण्येवाधिकारस्ते/);
 assert.match(v.english,/action alone/i);
 assert.deepEqual(nearbyContext('2.47').map(v=>v.reference),['2.46','2.47','2.48']);
 assert.deepEqual(nearbyContext('1.1').map(v=>v.reference),['1.1','1.2']);
});
test('lexical retrieval searches imported full corpus instead of only the 50 editorial records',()=>{
 assert.equal(searchCorpus('action fruits',5)[0]?.reference,'2.47');
 assert.equal(searchCorpus('2.47',5).length,0); // exact reference uses sourceVerse()
 assert.equal(loadSourceTexts().size,700);
});
test('missing or invalid verse references cannot be treated as source texts',()=>{
 assert.equal(sourceVerse('99.99'),null);
 assert.deepEqual(nearbyContext('19.1'),[]);
});
