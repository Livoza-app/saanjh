import fs from 'node:fs';
import path from 'node:path';
import {ROOT,CASES,lexicalRetrieve} from '../src/core.ts';
import {gitaRetrieve,highRisk} from '../src/gemini.ts';
const paraphrases=JSON.parse(fs.readFileSync(path.join(ROOT,'data','paraphrase_checks.json'),'utf8'));
const devRows=CASES.map((c:any)=>{
 const oldRefs=lexicalRetrieve(c.message,5).map(x=>x.reference);
 const newRefs=gitaRetrieve(c.message,5).map(x=>x.reference);
 return {id:c.id,topic:c.topic,old_hit:c.expected_references.some((r:string)=>oldRefs.includes(r)),new_hit:c.expected_references.some((r:string)=>newRefs.includes(r)),baseline_top5:oldRefs,updated_top5:newRefs,safety_expected:c.requires_safety_escalation,safety_triggered:highRisk(c.message)};
});
const paraphraseRows=paraphrases.map((c:any)=>{
 const refs=c.expected_safety?[]:gitaRetrieve(c.message,5).map(x=>x.reference);
 return {id:c.id,expected:c.expected||[],top5:refs,pass:c.expected_safety?highRisk(c.message):c.expected.some((r:string)=>refs.includes(r))};
});
const routineDev=devRows.filter(x=>!x.safety_expected);const routineParaphrase=paraphraseRows.filter(x=>x.id!=='P20');
const report={note:'Editorial expected-reference presence at top five, NOT theological accuracy, advice quality or population performance. Both sets are now development/regression material; they were used to tune patterns. Evaluate a new blind set and human/independent reviews before pilot.',
 old_dev_hits:routineDev.filter(x=>x.old_hit).length, updated_dev_hits:routineDev.filter(x=>x.new_hit).length, development_total:routineDev.length,safety_dev_pass:devRows.filter(x=>x.safety_expected&&x.safety_triggered).length,
 historical_baseline_including_safety:devRows.filter(x=>x.old_hit).length, historical_cases:devRows.length,
 paraphrase_pass:routineParaphrase.filter(x=>x.pass).length,paraphrase_total:routineParaphrase.length,paraphrase_safety_pass:paraphraseRows.filter(x=>x.id==='P20'&&x.pass).length,
 devRows,paraphraseRows};
fs.writeFileSync(path.join(ROOT,'docs','retrieval-v2-evaluation.json'),JSON.stringify(report,null,2));
console.log(`Original keyword retriever: ${report.old_dev_hits}/${report.development_total}`);
console.log(`Updated hybrid retriever: ${report.updated_dev_hits}/${report.development_total}`);
console.log(`Paraphrase routine regression set: ${report.paraphrase_pass}/${report.paraphrase_total}; safety 1/1`);
console.log(report.note);
