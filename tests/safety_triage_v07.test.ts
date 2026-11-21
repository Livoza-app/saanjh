import {test} from 'node:test';import assert from 'node:assert/strict';
import {screenForSafety} from '../src/safety-triage.ts';
test('Explicit imminent danger is classified locally without spending on another AI call',async()=>{
 const original=globalThis.fetch;(globalThis as any).fetch=()=>{throw Error('No fetch should occur')};
 try{const a=await screenForSafety('My child plans to kill himself tonight','DUMMY');assert.equal(a.classification,'suicide');assert.equal(a.basis,'local')}
 finally{globalThis.fetch=original}
});
test('Indirect child danger is routed by secondary model screening',async()=>{
 const old=globalThis.fetch;let seen='';
 (globalThis as any).fetch=async (_url:string,params:any)=>{seen=JSON.parse(params.body).contents[0].parts[0].text;return {ok:true,json:async()=>({candidates:[{content:{parts:[{text:'{"classification":"missing"}'}]}}]})}};
 try{const a=await screenForSafety('My seven year old wandered off in the supermarket.','FAKE');assert.equal(a.classification,'missing');assert.match(seen,/supermarket/)}finally{globalThis.fetch=old}
});
test('Model screening fails closed when it returns invalid or unknown output',async()=>{
 const old=globalThis.fetch;(globalThis as any).fetch=async()=>({ok:true,json:async()=>({candidates:[{content:{parts:[{text:'{"classification":"safe-no-concern"}'}]}}]})});
 try{await assert.rejects(()=>screenForSafety('My child is quiet after school','FAKE'),/unknown category/)}finally{globalThis.fetch=old}
});
test('Model screening fails closed when the API is unavailable',async()=>{
 const old=globalThis.fetch;(globalThis as any).fetch=async()=>({ok:false,status:429});
 try{await assert.rejects(()=>screenForSafety('My child is quiet after school','FAKE'),/routine guidance blocked/)}finally{globalThis.fetch=old}
});
