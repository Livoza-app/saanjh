import {test} from 'node:test';
import assert from 'node:assert/strict';
import {understandSituation,containsDiagnosticClaim} from '../src/situation-understanding.ts';
import {retrieveParentingPlaybooks} from '../src/parenting-playbooks.ts';
import {retrieveGitaPassages} from '../src/retrieval.ts';
import {validateGuidance} from '../src/gemini.ts';

test('situation stage separates observations, context, attempts and uncertainty across turns',()=>{
 const s=understandSituation({
  child:{name:'Maya',age:12,concerns:'school'},
  message:'Maya slams her door about maths homework. What should I do?',
  previous:[
   {role:'parent',text:'I tried sitting beside her and offered a short break, but she still pushed the book away.'},
   {role:'assistant',text:'Try a calm question.'}
  ],
  language:'en'
 });
 assert.equal(s.child_age,12);
 assert.ok(s.reported_behaviours.some(x=>/schoolwork/i.test(x)));
 assert.ok(s.reported_behaviours.some(x=>/communication/i.test(x)));
 assert.ok(s.context.some(x=>/schoolwork/i.test(x)));
 assert.ok(s.previous_attempts.some(x=>/tried sitting/i.test(x)));
 assert.ok(s.plausible_explanations.every(x=>/may|could|might/i.test(x)));
 assert.ok(s.uncertainties.length>=1);
 assert.equal(containsDiagnosticClaim(s.plausible_explanations.join(' ')),false);
});

test('Hindi input is understood without treating a label as a diagnosis',()=>{
 const s=understandSituation({
  child:{name:'आरव',age:11,concerns:''},
  message:'आरव पढ़ाई के समय गुस्सा करता है और दरवाज़ा बंद कर लेता है। मैंने उससे बात करने की कोशिश की।',
  previous:[],language:'hi'
 });
 assert.equal(s.language,'hi');
 assert.ok(s.reported_behaviours.some(x=>/schoolwork/i.test(x)));
 assert.ok(s.reported_behaviours.some(x=>/communication|withdrawal/i.test(x)));
 assert.ok(s.previous_attempts.length>=1);
 assert.ok(s.plausible_explanations.every(x=>!containsDiagnosticClaim(x)));
});

test('meaning-first playbook retrieval distinguishes a cracked window screen from device conflict',()=>{
 const physical=understandSituation({child:{age:8},message:'The screen on the window is cracked, and my child wants privacy to change clothes.',language:'en'});
 const device=understandSituation({child:{age:8},message:'My child stays up gaming on a tablet and cannot stop when bedtime starts.',language:'en'});
 const physicalBooks=retrieveParentingPlaybooks(physical,3);
 const deviceBooks=retrieveParentingPlaybooks(device,3);
 assert.ok(physicalBooks.every(x=>!/screen-time|gaming/i.test(x.title)));
 assert.ok(deviceBooks.some(x=>/screen-time|gaming|transition|sleep/i.test(x.title)));
 assert.notDeepEqual(physicalBooks.map(x=>x.id),deviceBooks.map(x=>x.id));
});

test('scripture retrieval is independent and exposes thematic relevance for a paraphrase',()=>{
 const passages=retrieveGitaPassages({
  reported_behaviours:['raised voice, arguing or hurtful communication'],
  context:['parent-child or family communication'],
  uncertainties:['The child’s own view is not yet included.'],
  plausible_explanations:['A difficult transition may be contributing']
 },5);
 assert.ok(passages.length>0);
 assert.ok(passages.every(x=>x.retrieval_basis.startsWith('independent-scripture:')));
 assert.ok(passages.some(x=>(x.thematic_relevance||[]).length>0));
});

test('guidance validation blocks unsafe advice, diagnosis and repeated actions',()=>{
 const allowed=[{reference:'17.15',retrieval_basis:'independent-scripture:concept:hurtful_communication'}] as any;
 const base:any={reference:'17.15',acknowledgement:'I hear how hard this argument has been for your family.',meaning:'The passage describes speech that is truthful, beneficial and not agitating.',connection:'That teaching may be relevant when you want to reconnect without escalating this specific argument.',parenting_application:'Apply it by slowing the next conversation and keeping one clear boundary.',actions:['Ask what felt hardest about the homework before offering a solution.','Offer two small ways to begin and let the child choose one.'],question:'What happened just before the argument began?',possible_driver:'The child may be feeling pressured, but that is not established.',say_this:'I want to understand what made this feel so hard.',repair_line:'I am sorry I raised my voice.',follow_up_days:2};
 assert.throws(()=>validateGuidance({...base,actions:['Hit the child so they learn to listen.','Threaten to take away all contact until they confess.']},'gita',allowed),/Unsafe or coercive/);
 assert.throws(()=>validateGuidance({...base,actions:['बच्चे को मारो ताकि वह तुरंत सुनना सीखे।','उसे धमकी देकर चुप कराओ और बात खत्म करो।']},'gita',allowed),/Unsafe or coercive/);
 assert.throws(()=>validateGuidance({...base,possible_driver:'The child has ADHD.'},'gita',allowed),/diagnostic/);
 assert.throws(()=>validateGuidance({...base,possible_driver:'बच्चे को एडीएचडी है।'},'gita',allowed),/diagnostic/);
 assert.throws(()=>validateGuidance(base,'gita',allowed,undefined,undefined,[base.actions[0],base.actions[1]]),/repeated/);
});

