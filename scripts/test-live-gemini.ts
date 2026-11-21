/** One live, fictional Gemini test. Requires GEMINI_API_KEY in process environment.
 * Sends no real child information. Each successful call may incur API fees.
 */
import {geminiGuidance} from '../src/gemini.ts';
const key=process.env.GEMINI_API_KEY;
if(!key){console.error('GEMINI_API_KEY is not set.');process.exitCode=2;}
else{
 console.log('Testing with fictional family details; model:',process.env.GEMINI_MODEL||'gemini-3.5-flash-lite');
 try{
  const r=await geminiGuidance({faith:'gita',parentName:'Test Parent',child:{name:'Example Teen',age:14,concerns:'school pressure'},message:'My teenage child feels overwhelmed by homework and I keep worrying about results.',previous:[]},key);
  console.log('PASS: Gemini replied and the selected scripture reference passed the source allowlist.');
  console.log('Scripture reference:',r.reference,'Source:',r.source_url);
  console.log('Example action:',r.actions[0]);
  if(r.usage)console.log('Provider token usage:',JSON.stringify(r.usage));
  console.log('This does NOT establish that the explanation is theologically or clinically correct.');
 }catch(err){console.error('FAIL:',String(err));process.exitCode=1;}
}
