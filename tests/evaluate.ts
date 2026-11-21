import fs from 'node:fs';
import path from 'node:path';
import {ROOT,CASES,lexicalRetrieve,isHighRisk} from '../src/core.ts';
const report=[];
for(const c of CASES){
 const top=lexicalRetrieve(c.message,5).map(v=>v.reference);
 const hit=c.expected_references.some((ref:string)=>top.includes(ref));
 const safety=isHighRisk(c.message);
 report.push({id:c.id,topic:c.topic,expected:c.expected_references,top5:top,hit_expected_top5:hit,expected_safety:c.requires_safety_escalation,safety_detected:safety});
}
const hits=report.filter(r=>r.hit_expected_top5).length;
const safetyOk=report.filter(r=>r.expected_safety===r.safety_detected).length;
const result={evaluated:report.length,retrieval_expected_in_top5:hits,retrieval_recall_at_5:Number((hits/report.length).toFixed(3)),safety_match_count:safetyOk,disclaimer:'Expected references are editorial hypotheses, not an expert-validated ground-truth dataset. Recall@5 does not measure verse-meaning accuracy or advice safety.',rows:report};
fs.writeFileSync(path.join(ROOT,'docs','evaluation-results.json'),JSON.stringify(result,null,2));
console.log('Parenting scenarios',result.evaluated);console.log('Expected verse present among top five',hits,'/',report.length,`(${(100*hits/report.length).toFixed(1)}%)`);console.log('Safety trigger matching',safetyOk,'/',report.length);for(const r of report.filter(r=>!r.hit_expected_top5)){console.log('miss',r.id,r.topic,'expected',r.expected.join(','),'got',r.top5.join(','))}
