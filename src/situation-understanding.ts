/**
 * Deterministic, non-diagnostic situation understanding for the parenting
 * guidance pipeline. This stage records what was actually reported before any
 * model call. It deliberately separates observations, context, uncertainty,
 * previous attempts, and possible explanations.
 *
 * These labels are routing aids, not clinical assessments or facts about a
 * child. Gemini receives the same distinction and must preserve it.
 */

export type SituationInput = {
  message: string;
  child: {name?: string; age: number; concerns?: string};
  previous?: Array<{role: 'parent'|'assistant'; text: string}>;
  language?: 'en'|'hi';
};

export type SituationUnderstanding = {
  child_age: number;
  reported_behaviours: string[];
  context: string[];
  uncertainties: string[];
  previous_attempts: string[];
  plausible_explanations: string[];
  evidence: string[];
  language: 'en'|'hi';
  interpretation_status?: 'routing-hint-only';
  conversation_corrections?: string[];
};

type Signal = {
  behaviour: string;
  context: string;
  patterns: RegExp[];
  explanations: string[];
};

const SIGNALS: Signal[] = [
  {behaviour:'difficulty starting or sustaining schoolwork', context:'schoolwork, assessment or performance', patterns:[/\b(?:homework|schoolwork|exam\w*|test\w*|grade\w*|marks?|study|studying|school)\b/i,/पढ़ाई|स्कूल|परीक्षा|होमवर्क/u], explanations:['task difficulty, fear of mistakes, or pressure may be contributing']},
  {behaviour:'worry, fear or repeated reassurance-seeking', context:'emotional response or uncertainty', patterns:[/\b(?:worr\w*|anxious|anxiety|panic\w*|nervous|scared|afraid|fear\w*)\b/i,/चिंता|डर|घबराहट|भय/u], explanations:['an unfamiliar situation, uncertainty, or a need for reassurance may be involved']},
  {behaviour:'raised voice, arguing or hurtful communication', context:'parent-child or family communication', patterns:[/\b(?:shout\w*|yell\w*|argu\w*|fight\w*|slam\w*|door|rude|insult\w*|critic\w*|name.call\w*)\b/i,/चिल्ला|गुस्सा|बहस|झगड़ा|अपमान/u], explanations:['a difficult transition, accumulated frustration, or feeling unheard may be contributing']},
  {behaviour:'withdrawal or reduced conversation', context:'connection, trust or communication', patterns:[/\b(?:withdrawn|distant|won.?t talk|doesn.?t talk|stopped opening up|silent|not listening|rarely connect)\b/i,/बात नहीं|चुप|दूर|नहीं सुनता|नहीं सुनती/u], explanations:['the child may need more safety, privacy, or time before talking']},
  {behaviour:'screen use, gaming or difficulty changing activities', context:'screens, routines or sleep', patterns:[/\b(?:phone|smartphone|tablet|gaming|video game|scroll\w*|screen[ -]?(?:time|use|limit)|late.night|sleep|tired|exhaust\w*)\b/i,/मोबाइल|स्क्रीन|गेम|नींद|थका|थकी/u], explanations:['the activity may be meeting a need for connection, recovery, stimulation, or control']},
  {behaviour:'peer conflict, exclusion or unkind treatment', context:'peer relationships or belonging', patterns:[/\b(?:friend\w*|classmate\w*|peer\w*|bully\w*|exclude\w*|reject\w*|lonely|unkind)\b/i,/दोस्त|साथी|बहिष्कार|अकेला|अकेली|बुलींग/u], explanations:['belonging, social uncertainty, or a need for adult support may be involved']},
  {behaviour:'dishonesty, hiding information or rule conflict', context:'trust, boundaries or autonomy', patterns:[/\b(?:lie|lies|lying|lied|dishonest|hide\w*|sneak\w*|rules?|privacy|independ\w*)\b/i,/झूठ|छिपा|नियम|निजता|स्वतंत्रता/u], explanations:['fear of consequences, a wish for autonomy, or difficulty repairing trust may be involved']},
  {behaviour:'comparison, shame or reduced confidence', context:'identity, self-worth or comparison', patterns:[/\b(?:compare\w*|worthless|useless|confidence|not good enough|inferior|appearance|body image)\b/i,/तुलना|आत्मविश्वास|हीन|शर्म/u], explanations:['comparison pressure, a recent setback, or a need for acceptance may be contributing']},
  {behaviour:'sibling or co-parent disagreement', context:'family roles, rules or competing needs', patterns:[/\b(?:sibling|brother|sister|partner|spouse|co.parent|different rules|disciplin\w*)\b/i,/भाई|बहन|साथी|अलग नियम|अनुशासन/u], explanations:['different expectations, competing needs, or unclear boundaries may be contributing']},
  {behaviour:'loss of interest, tiredness or difficulty with routines', context:'daily routines, rest or recent change', patterns:[/\b(?:burnout|tired|exhaust\w*|sleep|grief|griev\w*|loss|passed away|routine)\b/i,/थकान|नींद|शोक|हानि|दिनचर्या/u], explanations:['rest, a recent change, or an emotionally demanding event may be affecting the response']},
];

const attemptPattern=/\b(?:i|we|my partner|the teacher)\b[^.!?\n]{0,180}\b(?:tried|asked|offered|set|agreed|explained|restricted|removed|punished|talked|listened|checked|called|started|stopped)\b[^.!?\n]{0,220}/i;
const hindiAttemptPattern=/(?:मैंने|हमने|हम|मैं)[^।!?\n]{0,160}(?:कोशिश|बात|समझाया|रोक|तय|पूछा|सुना)[^।!?\n]{0,180}/u;
const agePattern=/\b(?:age\s*)?(\d{1,2})\s*(?:year|yr|वर्ष|साल)[- ]?(?:old|का|की|के)?\b/i;
const diagnosticPattern=/\b(?:adhd|autism|depression|anxiety disorder|oppositional defiant|trauma disorder|attachment disorder|bipolar|narciss\w*)\b|एडीएचडी|ऑटिज़्म|अवसाद|डिप्रेशन|चिंता विकार|द्विध्रुवी/iu;
const correctionPattern=/\b(?:correction|actually|to correct that|that was wrong|please use (?:this|the) latest|i did not|i didn't|we did not|we didn't)\b/i;
const hindiCorrectionPattern=/(?:सुधार|वास्तव में|गलत था|गलत थी|तथ्य न मानें|पिछली बात)/u;

function unique(values:string[]):string[]{return [...new Set(values.map(x=>x.trim()).filter(Boolean))];}
function signalMatches(message:string,signal:Signal):boolean{
 if(signal.behaviour==='screen use, gaming or difficulty changing activities'){
  const positive=/\b(?:phone|smartphone|tablet|gaming|video game|scroll\w*|screen[ -]?(?:time|use|limit)|late.night|sleep|tired|exhaust\w*)\b/i.test(message)||/मोबाइल|स्क्रीन|गेम|नींद|थका|थकी/u.test(message);
  const negated=/(?:\b(?:not|no|without|never)\b[^.!?]{0,35}\b(?:phone|smartphone|tablet|screen|gaming|game)\b|\b(?:phone|smartphone|tablet|screen|gaming|game)\b[^.!?]{0,35}\b(?:not|isn't|aren't|don't|do not)\b|(?:नहीं|न|बिना|मत)[^।!?]{0,25}(?:फोन|मोबाइल|स्क्रीन|गेम)|(?:फोन|मोबाइल|स्क्रीन|गेम)[^।!?]{0,25}(?:नहीं|न))/iu.test(message);
  return positive&&!negated;
 }
 return signal.patterns.some(p=>p.test(message));
}
function ageFromText(message:string,fallback:number):number{
 const n=Number(message.match(agePattern)?.[1]);
 return Number.isInteger(n)&&n>=1&&n<=17?n:fallback;
}
function evidenceFor(message:string,signal:Signal):string{
 const words=message.split(/\s+/).filter(Boolean);
 const matched=words.find(w=>signal.patterns.some(p=>p.test(w)))||'';
 return matched.replace(/[.,!?;:]+$/,'');
}

export function understandSituation(input:SituationInput):SituationUnderstanding{
 const message=String(input.message||'').trim();
 const concerns=String(input.child.concerns||'').trim();
 const combined=`${message} ${concerns}`.trim();
 const matched=SIGNALS.filter(s=>signalMatches(combined,s));
 const reported_behaviours=unique(matched.map(s=>s.behaviour));
 const context=unique(matched.map(s=>s.context));
 const plausible_explanations=unique(matched.flatMap(s=>s.explanations));
 const evidence=unique(matched.map(s=>evidenceFor(combined,s)));
 const parentMessages=(input.previous||[]).filter(x=>x.role==='parent').map(x=>String(x.text||'').trim()).filter(Boolean);
 const previous_attempts=unique(parentMessages.flatMap(text=>[...text.matchAll(new RegExp(`${attemptPattern.source}|${hindiAttemptPattern.source}`,'giu'))].map(m=>m[0])));
 for(const match of message.matchAll(new RegExp(`${attemptPattern.source}|${hindiAttemptPattern.source}`,'giu')))previous_attempts.push(match[0].trim());
  const conversation_corrections=unique([message,...parentMessages].filter(text=>correctionPattern.test(text)||hindiCorrectionPattern.test(text)));
 const uncertainties:string[]=[];
 if(!/\b(?:before|after|when|because|during|since|yesterday|today|last night|immediately)\b/i.test(message)&&!/(?:जब|बाद|पहले|क्योंकि)/u.test(message))uncertainties.push('What happened immediately before the reported behaviour is not yet clear.');
 if(!/\b(?:child said|told me|explained|says|said|बताया|कहा)\b/i.test(message))uncertainties.push('The child’s own view is not yet included.');
 if(!previous_attempts.length)uncertainties.push('It is not yet clear what has already been tried.');
 if(!matched.length){
  reported_behaviours.push('a change in behaviour, emotion or interaction is being reported');
  plausible_explanations.push('The reason is unclear from the current message and needs curious, non-judgmental exploration.');
 }
 if(ageFromText(message,input.child.age)!==input.child.age)uncertainties.push('The age mentioned in the message differs from the selected child profile; confirm which age is current.');
 // Keep this stage explicitly non-diagnostic even if a parent uses a diagnosis label.
 if(diagnosticPattern.test(message))uncertainties.push('A label in the message is not treated as a diagnosis or verified clinical fact.');
 return {
  child_age:ageFromText(message,input.child.age),
  reported_behaviours:unique(reported_behaviours),
  context:unique(context),
  uncertainties:unique(uncertainties),
  previous_attempts:unique(previous_attempts),
  plausible_explanations:unique(plausible_explanations.map(x=>x.replace(/^(?:the child )?may\s+/i,'May '))),
  evidence,
  language:input.language==='hi'?'hi':'en',
  interpretation_status:'routing-hint-only',
  conversation_corrections
 };
}

export function containsDiagnosticClaim(text:string):boolean{return diagnosticPattern.test(text);}

