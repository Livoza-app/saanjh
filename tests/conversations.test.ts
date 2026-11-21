import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const html=fs.readFileSync(path.join(root,'saanjh-preview.html'),'utf8');
const source=html.slice(html.lastIndexOf('<script>')+8,html.lastIndexOf('</script>'));
function boot(storage:any={}){
 const els=new Map<string,any>();
 function el(k:string){if(!els.has(k)){
   els.set(k,{id:k,textContent:'',value:'',innerHTML:'',style:{},disabled:false,parentElement:{style:{}},
    classList:{add(){},remove(){},toggle(){}},focus(){},addEventListener(){},querySelectorAll(){return []},scrollTop:0,scrollHeight:0});
 }return els.get(k)}
 const document={getElementById:el,querySelectorAll(){return []},addEventListener(){}};
 const localStorage={getItem(k:string){return storage[k]||null},setItem(k:string,v:string){storage[k]=v}};
 const context=vm.createContext({window:{},document,localStorage,location:{protocol:'file:'},confirm:()=>true,console,setTimeout,clearTimeout});
 vm.runInContext(source,context,{filename:'saanjh-preview.html'});
 return {context,els,storage,run:(code:string)=>vm.runInContext(code,context)};
}
test('new chat keeps old thread and retrieves parent-authored notes only within same child and faith',async()=>{
 const b=boot();
 b.els.get('prompt').value='Aryan says studying makes him feel stupid.';
 await b.run('send()');
 assert.equal(b.run('history().length'),2);
 b.run('newChat()');
 assert.equal(b.run('history().length'),0);
 const notes=b.run('earlierParentNotes()');
 assert.equal(notes.length,1);
 assert.match(notes[0],/studying makes him feel stupid/i);
 assert.equal(b.run('Object.values(st.threads).filter(t=>t.scope===chatKey()).length'),2);
 b.run("st.faith='bible'");
 assert.equal(b.run('earlierParentNotes().length'),0);
 b.run("st.faith='gita';st.children.push({id:'new-child',name:'Guri',age:9,concerns:''});st.selected='new-child'");
 assert.equal(b.run('earlierParentNotes().length'),0);
});
test('stored chats persist across simulated reload; legacy old chat is migrated',async()=>{
 const storage:any={};
 const b=boot(storage);b.els.get('prompt').value='I tried asking Aryan calmly about his homework.';await b.run('send()');b.run('newChat()');
 const after=boot(storage);assert.equal(after.run('history().length'),0);
 assert.equal(after.run('earlierParentNotes().length'),1);
 const legacy:any={parent:'Ketan',faith:'gita',selected:'aryan-sample',children:[{id:'aryan-sample',name:'Aryan',age:14,concerns:'school'}], chats:{'gita:aryan-sample':[{role:'parent',text:'He feels worried.',at:'2026-11-18T12:00:00.000Z'},{role:'assistant',actions:['Listen'],at:'2026-11-18T12:00:01.000Z'}]},plan:{'gita:aryan-sample':['Listen']},feedback:{},usage:{}};
 const old=boot({'saanjh-beta-research-v1':JSON.stringify(legacy)});
 assert.equal(old.run('history().length'),2);
 old.run('newChat()');
 assert.equal(old.run('earlierParentNotes()[0]'),'He feels worried.');
});
test('memory payload for live API contains older parent messages without another child or faith',async()=>{
 let payload:any=null;
 const b=boot();b.els.get('prompt').value='Aryan told me he feels afraid of homework.';await b.run('send()');b.run('newChat()');
 (b.context as any).fetch=async(_url:string,opts:any)=>{payload=JSON.parse(opts.body);return {ok:true,json:async()=>({mode:'gemini',acknowledgement:'Acknowledge difficulty.',explanation:'A contextual response.',actions:['Listen first.','Ask what help is useful.'],reference:'17.15',title:'Speech',source_url:'https://example.org',question:'What changed?'})}};
 b.run('live=true');b.els.get('prompt').value='Can you remind me what happened with Aryan?';await b.run('send()');
 assert.equal(payload.familyMemory.parentNotes.length,1);
 assert.equal(payload.familyMemory.suggestedActions.length,3);
 assert.match(payload.familyMemory.parentNotes[0],/afraid of homework/i);
 assert.equal(payload.previous.length,0);
});

test('drafts stay with their child, scripture and conversation when switching',async()=>{
 const b=boot();
 const prompt=b.els.get('prompt');
 const first=b.run('currentThread().id');
 prompt.value='A draft for the first fictional child.';
 b.run("st.children.push({id:'child-two',name:'Sam',age:8,concerns:''});selectChild('child-two')");
 assert.equal(prompt.value,'');
 prompt.value='A separate draft for Sam.';
 b.run("selectChild('aryan-sample')");
 assert.equal(prompt.value,'A draft for the first fictional child.');
 b.run("st.faith='bible';showConversation('faithBible')");
 assert.equal(prompt.value,'');
 b.run("st.faith='gita';showConversation('faithGita');newChat()");
 assert.equal(prompt.value,'');
 b.run(`switchThread(${JSON.stringify(first)})`);
 assert.equal(prompt.value,'A draft for the first fictional child.');
 b.run("selectChild('child-two')");
 assert.equal(prompt.value,'A separate draft for Sam.');
});

test('pending requests lock the conversation controls and stay with their original thread',async()=>{
 const b=boot();
 const original=b.run('currentThread().id');
 let finish:(value:unknown)=>void=()=>{};
 (b.context as any).fetch=()=>new Promise(resolve=>{finish=resolve;});
 b.run("st.children.push({id:'child-two',name:'Sam',age:8,concerns:''});live=true");
 const prompt=b.els.get('prompt');
 prompt.value='A fictional question about getting homework started.';
 const pending=b.run('send()');
 assert.equal(b.els.get('childSelect').disabled,true);
 assert.equal(b.els.get('faithBible').disabled,true);
 assert.equal(b.els.get('newChatTop').disabled,true);
 assert.equal(prompt.readOnly,true);
 b.run("selectChild('child-two');newChat()");
 assert.equal(b.run('currentThread().id'),original);
 await b.run('send()');
 finish({ok:true,json:async()=>({mode:'gemini',actions:['Ask about one small step.']})});
 await pending;
 assert.equal(b.run('currentThread().messages.length'),2);
 assert.equal(b.run('usage()'),1);
 assert.equal(prompt.value,'');
 assert.equal(b.els.get('childSelect').disabled,false);
 b.run("selectChild('child-two')");
 assert.equal(b.run('history().length'),0);
});

test('a failed Gemini request keeps the draft and records no reply or local usage',async()=>{
 const b=boot();
 (b.context as any).fetch=async()=>({ok:false,json:async()=>({error:'Reply unavailable. Try again.'})});
 b.run('live=true');
 const prompt=b.els.get('prompt');
 prompt.value='A fictional question about a change in routine.';
 await b.run('send()');
 assert.equal(prompt.value,'A fictional question about a change in routine.');
 assert.match(b.els.get('error').textContent,/Reply unavailable/);
 assert.equal(b.run('history().length'),0);
 assert.equal(b.run('usage()'),0);
 assert.equal(b.els.get('send').disabled,false);
});

test('chained alternatives preserve the original question at the API length limit',async()=>{
 const b=boot();
 const requests:any[]=[];
 (b.context as any).fetch=async(_url:string,options:any)=>{
  requests.push(JSON.parse(options.body));
  const number=requests.length;
  return {ok:true,json:async()=>({mode:'gemini',actions:[`Fictional step ${number}`]})};
 };
 b.run('live=true');
 const prompt=b.els.get('prompt');
 const issue='A fictional homework question. '.padEnd(2200,'x');
 prompt.value=issue;
 await b.run('send()');
 prompt.value='A separate unfinished draft.';
 await b.run('send({type:"alternative",index:1})');
 await b.run('send({type:"alternative",index:3})');
 assert.deepEqual(requests.map(request=>request.message),[issue,issue,issue]);
 assert.deepEqual(requests.map(request=>request.responseMode),['normal','alternative','alternative']);
 assert.deepEqual(requests[1].avoidActions,['Fictional step 1']);
 assert.deepEqual(requests[2].avoidActions,['Fictional step 2']);
 assert.equal(b.run('history()[4].originalIssue'),issue);
 assert.equal(prompt.value,'A separate unfinished draft.');
});

test('a reply from a pending request cannot be saved into a replacement family',async()=>{
 const b=boot();
 let finish:(value:unknown)=>void=()=>{};
 (b.context as any).fetch=()=>new Promise(resolve=>{finish=resolve;});
 const prompt=b.els.get('prompt');
 prompt.value='A fictional question for the original family.';
 b.run('live=true');
 const pending=b.run('send()');
 b.run(`const nextFamily=window.SaanjhHost.newFamily('Other parent');
   nextFamily.children.push({id:'other',name:'Sam',age:8});
   window.SaanjhHost.replaceState(nextFamily)`);
 finish({ok:true,json:async()=>({mode:'gemini',actions:['A step for the original family.']})});
 await pending;
 assert.equal(b.run('history().length'),0);
 assert.equal(b.run('usage()'),0);
 assert.equal(b.run('st.parent'),'Other parent');
 assert.equal(prompt.value,'');
 assert.match(b.els.get('error').textContent,/active family changed/);
});
