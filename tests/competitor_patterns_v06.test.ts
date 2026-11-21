import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import vm from 'node:vm';
import {validateGuidance,geminiGuidance} from '../src/gemini.ts';
const root=resolve(import.meta.dirname,'..');
const html=readFileSync(resolve(root,'saanjh-preview.html'),'utf8');
const script=html.slice(html.lastIndexOf('<script>')+8,html.lastIndexOf('</script>'));
function launch(){
 const elements=new Map<string,any>();
 const element=(id:string)=>{if(!elements.has(id))elements.set(id,{id,innerHTML:'',textContent:'',value:'',disabled:false,style:{},classList:{add(){},remove(){},toggle(){}},parentElement:{style:{}},focus(){},addEventListener(){},querySelectorAll(){return []},scrollTop:0,scrollHeight:0});return elements.get(id)};
 const memory:any={};const ctx=vm.createContext({document:{getElementById:element,querySelectorAll(){return []},addEventListener(){}},localStorage:{getItem(k:string){return memory[k]||null},setItem(k:string,v:string){memory[k]=v}},location:{protocol:'file:'},confirm:()=>true,console,setTimeout,clearTimeout});
 vm.runInContext(script,ctx,{filename:'saanjh-preview.html'});
 return {elements,run:(s:string)=>vm.runInContext(s,ctx)};
}
test('Quick help and Full wisdom views toggle and persist user preference',()=>{
 const b=launch();b.run("$('quickGuide').onclick()");assert.equal(b.run('st.guideView'),'quick');
 b.run("$('fullGuide').onclick()");assert.equal(b.run('st.guideView'),'full');
 assert.match(html,/body\.quick-view \.guidance-section\.deep/);
});
test('demo contains specific child-appropriate words and repair line, distinct from scripture',async()=>{
 const b=launch();b.elements.get('prompt').value='My teenager gets angry about schoolwork';await b.run('send()');
 assert.ok(b.run('history()[1].say_this').includes('Aryan'));
 assert.ok(b.run('history()[1].repair_line').includes('sorry'));
 assert.match(b.elements.get('chat').innerHTML,/Words you could use today/);
 assert.match(b.elements.get('chat').innerHTML,/If you need to repair/);
 assert.match(b.elements.get('chat').innerHTML,/Original Sanskrit/);
});
test('check-in prompts parent to confirm real outcome and does not silently claim they tried advice',async()=>{
 const b=launch();b.elements.get('prompt').value='My teen struggles with schoolwork';await b.run('send()');
 b.run('openCheckIn(1)');
 assert.match(b.elements.get('modalBody').innerHTML,/How did it go|actually happened/);
 b.run("$('outcome').value='notyet';$('checkinNote').value='';");
 b.elements.get('checkinForm').onsubmit({preventDefault(){}});
 assert.match(b.elements.get('prompt').value,/I have not tried it yet/);
 assert.equal(b.run('st.feedback[currentThread().id+\":1\"]'),'notyet');
});
test('new practical fields are validated and cannot introduce unapproved verse citations',()=>{
 const allowed=[{reference:'17.15'}] as any;
 const p:any={reference:'17.15',acknowledgement:'Ketan, this sounds stressful with Aryan.',meaning:'Speech should be thoughtful and useful, in the context of the verse.',connection:'One possible application is speaking with kindness while keeping appropriate limits.',actions:['Ask Aryan which particular step of homework is difficult.','Offer a limited choice about how to begin studying together.'],question:'Would he like to try a small task with you?',say_this:'Aryan, I want to understand, not judge you.',repair_line:'I am sorry I raised my voice.',possible_driver:'He may feel under pressure, but this is not established.'};
 assert.equal(validateGuidance(p,'gita',allowed).say_this,p.say_this);
 assert.throws(()=>validateGuidance({...p,say_this:'Chapter 2.47 says you must do this.'},'gita',allowed),/unsupported/);
 assert.throws(()=>validateGuidance({...p,repair_line:'x'.repeat(351)},'gita',allowed),/Invalid practical guidance/);
});
test('Gemini prompt asks for spoken scripts, repair, and non-diagnostic possibilities',async()=>{
 const before=globalThis.fetch;let sys='';
 (globalThis as any).fetch=async(_u:string,opts:any)=>{const body=JSON.parse(opts.body);sys=body.systemInstruction.parts[0].text;const ref=JSON.parse(body.contents[0].parts[0].text).allowed_sources[0].reference;return {ok:true,json:async()=>({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify({reference:ref,acknowledgement:'Ketan, this has been difficult for you.',meaning:'This teaching values patience and mindful speech.',connection:'It might help with responding gently during an argument.',actions:['Ask Aryan what he finds most difficult with this situation.','Explore one practical way to provide supportive structure.'],question:'What part feels most challenging to him?',say_this:'Aryan, I would like to hear your side.',repair_line:'I am sorry I shouted at you.',possible_driver:'He may be under pressure.',follow_up_days:2})}]}}]})} as any};
 try{const r=await geminiGuidance({faith:'gita',parentName:'Ketan',child:{name:'Aryan',age:14,concerns:'school'},message:'Angry about homework',previous:[]},'FAKE_KEY');assert.match(sys,/say_this:/);assert.match(sys,/repair_line:/);assert.match(sys,/non-diagnostic/);assert.match(r.say_this,/Aryan/);}finally{globalThis.fetch=before}
});
