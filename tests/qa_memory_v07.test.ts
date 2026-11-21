import {test} from 'node:test';import assert from 'node:assert/strict';
import fs from 'node:fs';import path from 'node:path';import vm from 'node:vm';
const root=path.resolve(import.meta.dirname,'..');const html=fs.readFileSync(path.join(root,'saanjh-preview.html'),'utf8');
const script=html.slice(html.lastIndexOf('<script>')+8,html.lastIndexOf('</script>'));
function boot(storage:any={}){
 const els=new Map<string,any>();const el=(k:string)=>{if(!els.has(k))els.set(k,{id:k,textContent:'',value:'',innerHTML:'',disabled:false,style:{},classList:{add(){},remove(){},toggle(){}},parentElement:{style:{}},focus(){},addEventListener(){},querySelectorAll(){return []},scrollTop:0,scrollHeight:0});return els.get(k)};
 const context=vm.createContext({document:{getElementById:el,querySelectorAll(){return []},addEventListener(){},body:{classList:{remove(){},toggle(){}}}},localStorage:{getItem(k:string){return storage[k]||null},setItem(k:string,v:string){storage[k]=v}},location:{protocol:'file:'},confirm:()=>true,console,setTimeout,clearTimeout});
 vm.runInContext(script,context,{filename:'saanjh-preview.html'});
 return {storage,context,els,run:(src:string)=>vm.runInContext(src,context),send:async(text:string)=>{el('prompt').value=text;await vm.runInContext('send()',context)}};
}
test('memory 1: separate chats on same child keep earlier parent statement but not as tried action',async()=>{
 const b=boot();await b.send('Aryan says maths is scary. I have NOT tried any suggestions yet.');b.run('newChat()');
 assert.equal(b.run('history().length'),0);assert.match(b.run('earlierParentNotes()[0]'),/NOT tried/);
 assert.ok(b.run('earlierSuggestedActions().length')>=2);
});
test('memory 2: changing the selected child cannot retrieve earlier parent notes',async()=>{
 const b=boot();await b.send('Aryan worries about maths every night.');b.run('newChat()');
 b.run("st.children.push({id:'maya-test',name:'Maya',age:9,concerns:'classroom confidence'});st.selected='maya-test';");
 assert.equal(b.run('earlierParentNotes().length'),0);
 await b.send('Maya worries about speaking in class.');b.run('newChat()');assert.match(b.run('earlierParentNotes()[0]'),/Maya/);
 b.run("st.selected='aryan-sample';");assert.match(b.run('earlierParentNotes()[0]'),/Aryan/);assert.doesNotMatch(b.run('earlierParentNotes().join(" ")'),/Maya/);
});
test('memory 3: switching between Gita and Bible keeps faith-scoped conversations',async()=>{
 const b=boot();await b.send('Aryan worries about Gita-inspired advice for homework.');b.run('newChat()');
 b.run("st.faith='bible'");assert.equal(b.run('earlierParentNotes().length'),0);
 await b.send('Aryan wants to learn how to be a kinder brother.');b.run('newChat()');
 assert.doesNotMatch(b.run('earlierParentNotes().join(" ")'),/Gita-inspired/);
 b.run("st.faith='gita'");assert.match(b.run('earlierParentNotes().join(" ")'),/Gita-inspired/);
});
test('memory 4: older thread is recoverable after a new thread',async()=>{
 const b=boot();await b.send('Aryan finds mathematics hardest.');const old=b.run('currentThread().id');
 b.run('newChat()');await b.send('He likes reading novels.');b.run(`switchThread(${JSON.stringify(old)})`);
 assert.match(b.run('history()[0].text'),/mathematics/);assert.doesNotMatch(b.run('history()[0].text'),/novels/);
});
test('memory 5: deleting prior thread removes its context from recall',async()=>{
 const b=boot();await b.send('Aryan finds mathematics hardest.');const old=b.run('currentThread().id');b.run('newChat()');
 assert.equal(b.run('earlierParentNotes().length'),1);
 b.run(`delete st.threads[${JSON.stringify(old)}]`);assert.equal(b.run('earlierParentNotes().length'),0);
});
test('memory 6: changing a parent statement remains an explicit update rather than an inferred diagnosis',async()=>{
 const b=boot();await b.send('Aryan gets anxious about exams.');await b.send('Correction: Aryan is fine about exams, he is worried about classmates.');
 assert.equal(b.run('history().filter(m=>m.role==="parent").length'),2);
 assert.match(b.run('history().filter(m=>m.role==="parent")[1].text'),/Correction/);
 // Whether a real model respects this correction is a live evaluation question, NOT proved here.
});
test('memory 7: history is restored after simulated page reload',async()=>{
 const storage:any={};const a=boot(storage);await a.send('Aryan loves chess and asks for help with homework.');a.run('newChat()');
 const b=boot(storage);assert.match(b.run('earlierParentNotes().join(" ")'),/chess/);
});
