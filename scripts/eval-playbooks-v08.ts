/** Run one time against the synthetic holdout AFTER development rules are frozen.
 * Scores recognition of authored categories only—not parenting advice quality.
 */
import fs from 'node:fs';import path from 'node:path';
import {matchParentingPatterns} from '../src/parenting-playbooks.ts';
const root=path.resolve(import.meta.dirname,'..');
const cases:any[]=JSON.parse(fs.readFileSync(path.join(root,'qa','parenting-scenarios-400.json'),'utf8'));
const split=process.argv.includes('--holdout')?'holdout':'development';
const targets=cases.filter(x=>x.split===split && x.risk==='normal');
const byTopic=new Map<string,{hits:number;count:number}>();
const misses:any[]=[];let top1=0,top2=0,covered=0;
for(const c of targets){
 const found=matchParentingPatterns(c.message,c.age,2).map(p=>p.id);
 if(found.length)covered++;
 if(found[0]===c.playbook_id)top1++;
 if(found.includes(c.playbook_id))top2++;else misses.push({id:c.id,topic:c.playbook_id,predicted:found,question:c.message});
 const t=byTopic.get(c.playbook_id)||{hits:0,count:0};t.count++;t.hits+=Number(found.includes(c.playbook_id));byTopic.set(c.playbook_id,t);
}
const stats={kind:'EDITORIAL_PATTERN_RECOGNITION_ONLY_NOT_ADVICE_ACCURACY',split,allCases:targets.length,top1,top1Pct:+(100*top1/targets.length).toFixed(1),top2,top2Pct:+(100*top2/targets.length).toFixed(1),covered,coveredPct:+(100*covered/targets.length).toFixed(1),misses:misses.slice(0,80),topicScores:[...byTopic.entries()].map(([id,x])=>({id,...x})).sort((a,b)=>a.hits/a.count-b.hits/b.count)};
const outPath=path.join(root,'qa','reports',`v08-${split}-pattern-match.json`);
fs.writeFileSync(outPath,JSON.stringify(stats,null,2));
console.log(JSON.stringify({split,count:targets.length,top1:stats.top1Pct,top2:stats.top2Pct,covered:stats.coveredPct,misses:misses.length,missTypes:stats.topicScores.slice(0,8)},null,2));
