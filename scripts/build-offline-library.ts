/** Generates a completely offline local research browser. No AI and no server. */
import fs from 'node:fs';
import path from 'node:path';
import {loadCorpus} from '../src/corpus.ts';
const root=path.resolve(import.meta.dirname,'..');
const verses=loadCorpus();
if(verses.length!==700)throw Error('Import 700 verses before building library');
let data=JSON.stringify(verses).replaceAll('</','<\\/').replaceAll('<!--','<\\!--');
const html=`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Saanjh — Bhagavad Gita Source Library</title>
<style>
:root{font-family:Inter,ui-sans-serif,system-ui,-apple-system,Segoe UI,Arial;color:#263c31;background:#f8f8f4}*{box-sizing:border-box}body{margin:0}button,input,select{font:inherit}button{cursor:pointer}main{max-width:1080px;margin:0 auto;padding:35px 20px 70px}header{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;flex-wrap:wrap}h1{font-family:Georgia,serif;font-size:clamp(28px,4vw,43px);font-weight:500;margin:14px 0 8px}h2{font-size:19px;margin:10px 0}p{line-height:1.65}.sub{font-size:14px;color:#647669;max-width:650px}.pill{font-size:12px;background:#e5eee8;border-radius:50px;padding:9px 14px;font-weight:700}.toolbar{display:flex;gap:11px;flex-wrap:wrap;margin:32px 0 10px}input,select{padding:13px 15px;border:1px solid #d4ded4;border-radius:12px;background:#fff;color:#294332}input{flex:1;min-width:240px}input:focus{outline:2px solid #a1b6a5}select{min-width:145px}.suggest{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0 24px}.suggest button{border:1px solid #d7e3d8;background:#fff;color:#426454;border-radius:999px;padding:8px 12px;font-size:12px}.notice{background:#fff8ed;border:1px solid #e9dec9;border-radius:12px;padding:15px;font-size:12px;color:#695f45;line-height:1.7}.stat{font-size:13px;color:#758879;margin:18px 0}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:14px}.card{background:#fff;border:1px solid #e0e7df;padding:21px;border-radius:17px;box-shadow:0 2px 12px #153a2708}.eyebrow{font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#60826b;font-weight:750}.sans{font-family:Georgia,'Noto Serif Devanagari',serif;font-size:20px;line-height:1.85;margin:15px 0}.translation{font-size:14px;line-height:1.65;margin:11px 0}.transliteration{font-size:12px;line-height:1.6;color:#778579}.card a{color:#2d664c;font-size:12px}.light{font-size:12px;color:#7b887b}.more{display:block;margin:25px auto;background:#315b49;color:white;border:0;border-radius:10px;padding:12px 18px}.more[hidden]{display:none}footer{padding-top:25px;font-size:12px;color:#68776e}footer a{color:#315b49}
</style></head><body><main><header><div><div class="eyebrow">SAANJH · RESEARCH LIBRARY</div><h1>Bhagavad Gita, chapter by chapter</h1><p class="sub">Search the actual 700-verse source corpus in Sanskrit, English, Hindi or transliteration. This is a scripture research browser, not AI-generated parenting advice.</p></div><span class="pill">18 chapters · 700 verses</span></header>
<div class="toolbar"><input id="search" aria-label="Search verses" placeholder="Search 'action fruits', 'compassion', 'धर्म' or 2.47"><select id="chapter" aria-label="Filter chapter"><option value="">All chapters</option></select><select id="language" aria-label="Translation language"><option value="english">English</option><option value="hindi">Hindi</option></select></div>
<div class="suggest"><button data-q="2.47">Gita 2.47</button><button data-q="anger">Anger</button><button data-q="compassion">Compassion</button><button data-q="धर्म">धर्म</button><button data-q="action fruits">Action and results</button></div>
<div class="notice"><b>Source and usage:</b> Sanskrit text is public domain. English and Hindi translations © Hansi Gita Bhawan Trust, used here for local research with attribution. For a commercial app, confirm redistribution and reuse conditions. This browser does not validate theological interpretation or offer parenting guidance.</div>
<div class="stat" id="stats"></div><div id="results" class="grid"></div><button id="more" class="more" hidden>Show more verses</button>
<footer>Source: <a href="https://gitabhawan.org.in/gita/research" target="_blank" rel="noopener noreferrer">Hansi Gita Bhawan Trust — Bhagavad Gita Research Corpus</a>. Verses are shown with direct links to the original source. Please use the full chapter and neighboring verses when interpreting a teaching.</footer></main>
<script>const corpus=${data};
const el=(tag,cls,txt)=>{let x=document.createElement(tag);if(cls)x.className=cls;if(txt!==undefined)x.textContent=txt;return x};
const $=id=>document.getElementById(id),search=$('search'),chap=$('chapter'),lang=$('language'),results=$('results'),stats=$('stats'),more=$('more');
for(let c=1;c<=18;c++){let opt=el('option','',String(c));opt.value=String(c);chap.append(opt)}
let matches=[],shown=0;const norm=s=>s.toLowerCase().normalize('NFKC');
function render(){results.replaceChildren();for(const v of matches.slice(0,shown)){
 const card=el('article','card');card.append(el('div','eyebrow','Chapter '+v.chapter+' · Verse '+v.verse+' · '+v.speaker));
 card.append(el('div','sans',v.sanskrit));card.append(el('div','transliteration',v.iast));
 card.append(el('p','translation',lang.value==='hindi'?v.hindi:v.english));
 const link=el('a','','Read at original source ↗');link.href=v.source_url;link.target='_blank';link.rel='noopener noreferrer';card.append(link);results.append(card)
 }more.hidden=shown>=matches.length;stats.textContent=matches.length+' matching verse'+(matches.length===1?'':'s')+' · showing '+Math.min(shown,matches.length);}
function update(){const term=norm(search.value.trim()),c=chap.value;
 matches=corpus.filter(v=>(!c||v.chapter===Number(c))&&(!term||norm([v.reference,v.sanskrit,v.iast,v.english,v.hindi,...v.terms].join(' ')).includes(term)));
 if(term&&!/^\\d{1,2}\\.\\d{1,2}$/.test(term)){
 const ws=term.split(/\\s+/).filter(Boolean);if(ws.length>1){matches=corpus.filter(v=>(!c||v.chapter===Number(c))&&ws.every(w=>norm([v.sanskrit,v.iast,v.english,v.hindi,...v.terms].join(' ')).includes(w)));}
 }
 shown=Math.min(12,matches.length);render();}
search.addEventListener('input',update);chap.addEventListener('change',update);lang.addEventListener('change',render);more.onclick=()=>{shown+=12;render()};document.querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>{search.value=b.dataset.q;update();search.focus()});update();
</script></body></html>`;
const output=path.join(root,'gita-library-open-me.html');
fs.writeFileSync(output,html,'utf8');console.log(`Wrote offline research library: ${output} (${(fs.statSync(output).size/1024).toFixed(1)} KiB / ${verses.length} verses)`);
