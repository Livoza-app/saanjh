/**
 * Import and validate the Hansi Gita Bhawan Trust's 700-verse dataset.
 *
 * Default: downloads from the Trust's official website (internet needed).
 * Offline: npm run import:gita -- --file /absolute/path/gita-corpus.json
 *
 * Stores original Sanskrit separately from copyrighted translated material.
 * Only internal research outputs containing the Trust's translations are gitignored.
 * This prototype still retrieves its pre-curated 50 records for live AI: the full
 * corpus import is the data foundation, not a claim that 700-verse RAG is complete.
 */
import fs from 'node:fs';
import path from 'node:path';
import {ROOT,VERSES} from '../src/core.ts';

const SOURCE_URL='https://gitabhawan.org.in/data/gita-corpus.json';
const SOURCE_PAGE='https://gitabhawan.org.in/gita/research';
const expectedByChapter=[47,72,43,42,29,47,30,28,34,42,55,20,34,27,20,24,28,78];
const fileArg=process.argv.indexOf('--file');
let raw:string;
if(fileArg>=0){
  const f=process.argv[fileArg+1];
  if(!f)throw new Error('Usage: npm run import:gita -- --file /absolute/path/gita-corpus.json');
  raw=fs.readFileSync(f,'utf8');
}else{
  console.log(`Downloading full corpus from ${SOURCE_URL}`);
  const res=await fetch(SOURCE_URL,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(30000)});
  if(!res.ok)throw new Error(`Source fetch failed: HTTP ${res.status}; alternatively use --file`);
  raw=await res.text();
}
const corpus:any=JSON.parse(raw);
if(corpus.publisher!=='Hansi Gita Bhawan Trust')throw new Error('Unexpected corpus publisher');
if(!Array.isArray(corpus.chapters)||corpus.chapters.length!==18)throw new Error('Need 18 chapters');
if(!Array.isArray(corpus.verses)||corpus.verses.length!==700)throw new Error('Need precisely 700 verses');
if(corpus.counts?.verses!==700||corpus.counts?.chapters!==18)throw new Error('Publisher metadata counts do not match');
const seen=new Set<string>();
for(let c=1;c<=18;c++){
 const chapter=corpus.chapters[c-1];
 if(chapter.n!==c||chapter.verses!==expectedByChapter[c-1])throw new Error(`Unexpected chapter metadata for ${c}`);
 for(let n=1;n<=expectedByChapter[c-1];n++){
  const ref=`${c}.${n}`;
  const v=corpus.verses.find((r:any)=>r.ref===ref);
  if(!v||v.chapter!==c||v.verse!==n||!v.sanskrit?.trim()||!v.english?.trim()||!v.hindi?.trim())throw new Error(`Incomplete verse ${ref}`);
  if(seen.has(ref))throw new Error(`Duplicate reference: ${ref}`);
  seen.add(ref);
 }
}
if(seen.size!==700||new Set(corpus.verses.map((v:any)=>v.ref)).size!==700)throw new Error('Invalid verse numbering or duplicates');
fs.mkdirSync(path.join(ROOT,'data'),{recursive:true});
const write=(filename:string,value:any)=>fs.writeFileSync(path.join(ROOT,'data',filename),JSON.stringify(value,null,2),'utf8');
// Clear public-domain corpus: original Sanskrit, metadata, and source links, without the modern translations.
write('gita-sanskrit-700.json',{
  source:SOURCE_PAGE,
  original_sanskrit_rights:'public domain',
  edition:'Hansi Gita Bhawan Trust 700-verse recension',
  chapters:corpus.chapters.map((x:any)=>({chapter:x.n,sanskrit:x.sanskrit,verse_count:x.verses})),
  verses:corpus.verses.map((v:any)=>({reference:v.ref,chapter:v.chapter,verse:v.verse,speaker:v.speaker,sanskrit:v.sanskrit,iast:v.iast,terms:v.terms||[],source_url:v.url}))
});
// Research-only; do not publish as commercial content without verifying terms.
write('gita-research-translations-private.json',{
  publisher:corpus.publisher,
  source_url:SOURCE_PAGE,
  note:'Copyrighted Trust translations, internal evaluation only; attribution required. Confirm commercial reuse scope before release.',
  verses:corpus.verses.map((v:any)=>({reference:v.ref,english:v.english,hindi:v.hindi,source_url:v.url}))
});
const refs=new Map(corpus.verses.map((x:any)=>[x.ref,x]));
const chosen=VERSES.map(v=>{
 const row:any=refs.get(v.reference);
 if(!row)throw new Error(`Curated verse not found in official source: ${v.reference}`);
 const prev:any=refs.get(`${row.chapter}.${row.verse-1}`);
 const next:any=refs.get(`${row.chapter}.${row.verse+1}`);
 return {reference:v.reference,sanskrit:row.sanskrit,iast:row.iast,english:row.english,hindi:row.hindi,source_url:row.url,
  previous_context:prev?.english||null,next_context:next?.english||null};
});
write('selected-source-text.json',{
 publisher:corpus.publisher,
 license_statement:'Original Sanskrit public domain; Trust translations copyrighted. Source says quote/teach/build on with attribution; verify commercial product scope before launch.',
 source_url:SOURCE_PAGE,
 imported_at:new Date().toISOString(),verses:chosen
});
console.log(`Validated all ${seen.size} Sanskrit verses across 18 chapters.`);
console.log(`Prepared 700-verse Sanskrit library, internal translation research cache, and ${chosen.length} selected original-text records for current prototype.`);
console.log(`Attribution: Hansi Gita Bhawan Trust — ${SOURCE_PAGE}`);
console.log('NOTE: Corpus is now available for research lookup and lexical retrieval. Live AI accuracy is not yet validated.');
