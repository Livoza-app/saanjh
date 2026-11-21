/** Local-only research index over the full user-supplied Bhagavad Gita corpus.
 * Original Sanskrit is public-domain; Trust's English/Hindi translations are
 * copyrighted and must remain attributed and reviewed for commercial use.
 * Retrieval scores are lexical search aids, NOT theological validation.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT=path.resolve(import.meta.dirname,'..');
const SANSKRIT=path.join(ROOT,'data','gita-sanskrit-700.json');
const TRANSLATIONS=path.join(ROOT,'data','gita-research-translations-private.json');
export type CorpusVerse={reference:string;chapter:number;verse:number;speaker:string;sanskrit:string;iast:string;english:string;hindi:string;terms:string[];source_url:string};
let cache:CorpusVerse[]|null=null;
let byRef:Map<string,CorpusVerse>|null=null;
const expectedByChapter=[47,72,43,42,29,47,30,28,34,42,55,20,34,27,20,24,28,78];

export function loadCorpus():CorpusVerse[]{
 if(cache)return cache;
 if(!fs.existsSync(SANSKRIT)||!fs.existsSync(TRANSLATIONS))return [];
 const original=JSON.parse(fs.readFileSync(SANSKRIT,'utf8'));
 const trans=JSON.parse(fs.readFileSync(TRANSLATIONS,'utf8'));
 if(!Array.isArray(original.verses)||original.verses.length!==700||!Array.isArray(trans.verses)||trans.verses.length!==700)throw Error('Incomplete Gita corpus: require 700 aligned source records');
 const translate=new Map<string,any>(trans.verses.map((v:any)=>[v.reference,v]));
 const assembled=original.verses.map((v:any)=>{
  const t=translate.get(v.reference);
  if(!t||!t.english||!t.hindi||!v.sanskrit||v.source_url!==t.source_url)throw Error(`Corpus mismatch at ${v.reference}`);
  return {reference:v.reference,chapter:v.chapter,verse:v.verse,speaker:v.speaker,sanskrit:v.sanskrit,iast:v.iast,english:t.english,hindi:t.hindi,terms:Array.isArray(v.terms)?v.terms:[],source_url:v.source_url};
 }) as CorpusVerse[];
 if(new Set(assembled.map(v=>v.reference)).size!==700)throw Error('Duplicate references in corpus');
 for(let c=1;c<=18;c++){
  const ch=assembled.filter(v=>v.chapter===c);
  if(ch.length!==expectedByChapter[c-1]||ch.some(v=>v.verse<1||v.verse>ch.length||v.reference!==`${c}.${v.verse}`))throw Error(`Invalid chapter ${c}`);
 }
 cache=assembled;byRef=new Map(assembled.map(v=>[v.reference,v]));
 return cache;
}
export function sourceVerse(reference:string):CorpusVerse|null{
 loadCorpus();return byRef?.get(reference)||null;
}
export function nearbyContext(reference:string,window=1):CorpusVerse[]{
 const center=sourceVerse(reference);if(!center)return [];
 const result:CorpusVerse[]=[];
 for(let n=Math.max(1,center.verse-window);n<=Math.min(expectedByChapter[center.chapter-1],center.verse+window);n++){
  const v=sourceVerse(`${center.chapter}.${n}`);if(v)result.push(v);
 }
 return result;
}
const stop=new Set(['the','and','for','with','that','this','your','you','his','her','she','him','was','are','but','how','who','what','from','into','its','our','their','have','has','had','can','could','would','should','does','did','about','say','says','they','them','been','then','just','not','too','very','all','one','two','more','less','also','where','when','some','their','without','rather','there']);
const words=(s:string)=>(s.toLowerCase().match(/[\p{L}\p{N}]+/gu)||[]).filter(w=>w.length>=3&&!stop.has(w));
/** Lightweight BM25-inspired lexical search across all 700 licensed research passages.
 * For proper meaning-based retrieval, live embedding/reranking tests are needed.
 */
export function searchCorpus(query:string,max=8):CorpusVerse[]{
 const verses=loadCorpus();if(!verses.length)return [];
 const q=[...new Set(words(query))];if(!q.length)return [];
 const tokenSet=verses.map(v=>new Set(words(`${v.english} ${v.hindi} ${v.iast} ${(v.terms||[]).join(' ')}`)));
 const df=new Map(q.map(t=>[t,tokenSet.filter(set=>set.has(t)).length]));
 const scored=verses.map((v,i)=>{
  let score=0;
  for(const w of q){
   if(tokenSet[i].has(w))score+=Math.log(1+(verses.length-(df.get(w)||0)+0.5)/((df.get(w)||0)+0.5));
   if((v.terms||[]).includes(w))score+=0.8;
  }
  // Exact phrase relevance helps search for key teachings without claiming understanding.
  if(query.trim().length>=6&&v.english.toLowerCase().includes(query.trim().toLowerCase()))score+=4;
  return {v,score};
 }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||a.v.chapter-b.v.chapter||a.v.verse-b.v.verse);
 return scored.slice(0,Math.min(Math.max(max,0),30)).map(x=>x.v);
}
