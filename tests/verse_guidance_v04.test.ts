import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import vm from 'node:vm';
import {gitaRetrieve,sourceDisplay,validateGuidance,geminiGuidance} from '../src/gemini.ts';
import {sourceVerse} from '../src/corpus.ts';

const root=resolve(import.meta.dirname,'..');
const html=readFileSync(resolve(root,'saanjh-preview.html'),'utf8');
const script=html.slice(html.lastIndexOf('<script>')+8,html.lastIndexOf('</script>'));

function launch(memory:any={}){
 const elements=new Map<string,any>();
 const element=(name:string)=>{
  if(!elements.has(name))elements.set(name,{
   id:name,innerHTML:'',textContent:'',value:'',disabled:false,style:{},parentElement:{style:{}},
   classList:{add(){},remove(){},toggle(){}},focus(){},addEventListener(){},querySelectorAll(){return []},scrollTop:0,scrollHeight:0
  });
  return elements.get(name);
 };
 const doc={getElementById:element,querySelectorAll(){return []},addEventListener(){}};
 const localStorage={getItem(k:string){return memory[k]||null},setItem(k:string,v:string){memory[k]=v}};
 const ctx=vm.createContext({document:doc,localStorage,location:{protocol:'file:'},confirm:()=>true,console,setTimeout,clearTimeout});
 vm.runInContext(script,ctx,{filename:'saanjh-preview.html'});
 return {ctx,memory,elements,run:(expr:string)=>vm.runInContext(expr,ctx)};
}

function mockValid(reference='17.15'){
 return {reference,acknowledgement:'Ketan, you are concerned about Aryan and his schoolwork.',meaning:'The verse encourages speech that is truthful, gentle, and beneficial.',connection:'The manner of communicating could influence how safe Aryan feels discussing school.',actions:['Ask Aryan about the subjects that are particularly difficult for him.','Agree together on one small way to approach homework this evening.'],question:'Which specific task is hardest for Aryan?',follow_up_days:3};
}

test('exact original Sanskrit and both existing Gita translations are returned from source, not AI',()=>{
 const orig=sourceVerse('17.15');assert.ok(orig);
 const r=sourceDisplay('gita',gitaRetrieve('talk to my child without criticism',12).find(x=>x.reference==='17.15')||{reference:'17.15',english:orig.english,source_url:orig.source_url} as any);
 assert.equal(r.source_sanskrit,orig.sanskrit);
 assert.equal(r.source_english,orig.english);
 assert.equal(r.source_hindi,orig.hindi);
 assert.match(r.source_attribution,/Hansi Gita Bhawan Trust/);
 assert.equal(r.source_url,orig.source_url);
});

test('Bible source uses exact English scripture and does not fabricate a Hindi Bible translation',()=>{
 const bible=sourceDisplay('bible',{reference:'Proverbs 15:1',english:'A gentle answer turns away wrath, but a harsh word stirs up anger.',source_url:'https://ebible.org/engwebp/PRO15.htm'} as any);
 assert.equal(bible.source_hindi,'');
 assert.match(bible.source_attribution,/World English Bible/);
});

test('incomplete, unsupported, and overly sweeping guidance is rejected',()=>{
 const allowed=[{reference:'17.15',english:'A verse',source_url:'https://example.org'}] as any;
 assert.throws(()=>validateGuidance(mockValid(),'gita',allowed,'MAX_TOKENS'),/cut off/);
 assert.throws(()=>validateGuidance({...mockValid(),reference:'99.99'},'gita',allowed),/Source citation/);
 assert.throws(()=>validateGuidance({...mockValid(),acknowledgement:'Ketan, but'},'gita',allowed),/unfinished/);
 assert.throws(()=>validateGuidance({...mockValid(),actions:['Pause all homework conversations for several days.','Try to avoid school talk.']},'gita',allowed),/sweeping|validation/);
});

test('Gemini request sends alternative mode, rejected old suggestions, Hindi language and receives exact original verse',async()=>{
 const prev=globalThis.fetch;
 let captured:any;
 (globalThis as any).fetch=async(_url:string,opts:any)=>{
  const b=JSON.parse(opts.body);captured={system:b.systemInstruction.parts[0].text,user:JSON.parse(b.contents[0].parts[0].text)};
  assert.equal(captured.user.response_mode,'alternative');
  assert.equal(captured.user.language,'hi');
  return {ok:true,json:async()=>({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(mockValid(captured.user.allowed_sources[0].reference))}]}}],usageMetadata:{promptTokenCount:300,candidatesTokenCount:90}})} as any;
 };
 try{
  const r=await geminiGuidance({faith:'gita',language:'hi',parentName:'Ketan',child:{name:'Aryan',age:14,concerns:'school'},message:'Aryan struggles with schoolwork.',previous:[],responseMode:'alternative',avoidActions:['Tell Aryan to stop homework for the week.']},'DO_NOT_USE_REAL_KEY');
  assert.equal(r.reference,captured.user.allowed_sources[0].reference);assert.ok(r.source_sanskrit);assert.ok(r.source_hindi);assert.ok(r.source_english);
  assert.equal(r.response_mode,'alternative');
  assert.deepEqual(captured.user.avoid_actions,['Tell Aryan to stop homework for the week.']);
  assert.match(captured.system,/different approach/i);
 }finally{globalThis.fetch=prev}
});

test('another approach button logic sends a new request without retyping and respects language selection',async()=>{
 const b=launch();b.elements.get('prompt').value='Aryan feels stupid when studying.';
 await b.run('send()');
 assert.match(b.elements.get('chat').innerHTML,/Original Sanskrit/);
 assert.match(b.elements.get('chat').innerHTML,/Hindi translation/);
 assert.match(b.elements.get('chat').innerHTML,/Another approach/);
 assert.equal(b.run('history().length'),2);
 const old=b.run('history()[1].actions[0]');
 await b.run('send({type:"alternative",index:1})');
 assert.equal(b.run('history().length'),4);
 assert.equal(b.run('history()[3].response_mode'),'alternative');
 assert.notEqual(b.run('history()[3].actions[0]'),old);
 assert.equal(b.run('usage()'),2);
 b.run("st.language='hi';save();render()");
 assert.equal(b.elements.get('replyLanguage').value,'hi');
 assert.match(b.elements.get('chat').innerHTML,/अनुवाद/);
});
