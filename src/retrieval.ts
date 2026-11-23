/** Hybrid scripture-candidate retrieval for the private Saanjh prototype.
 * 1. Situational concept matching maps real-world problems to editorially
 *    nominated verses. These mappings are DISCOVERY HYPOTHESES, not scripture.
 * 2. Rank fusion from the 50 curated records and lexical search of the full
 *    700-verse corpus contributes other candidate verses.
 * 3. Return small grounded source records. Never manufacture a verse.
 * NOTE: Rule weights were tuned with the included development scenarios and
 * must not be treated as held-out or scholar-verified accuracy.
 */
import {VERSES,lexicalRetrieve,loadSourceTexts} from './core.ts';
import {searchCorpus} from './corpus.ts';

export type ScriptureCandidate={id:string;reference:string;title:string;english:string;sanskrit?:string;source_url:string;tags:string[];previous?:string|null;next?:string|null;retrieval_basis:string;thematic_relevance?:string[]};

export type ScriptureSituation={
 reported_behaviours:string[];
 context:string[];
 uncertainties:string[];
 plausible_explanations:string[];
};

type Concept={name:string;pattern:RegExp;refs:string[];weight:number};
const CONCEPTS:Concept[]=[
 {name:'bullying_and_exclusion',pattern:/\b(bull(?:y|ies|ied|ying)|harass(?:ment|ed)?|pick(?:ing)? on|intimidat\w*|being mean|physically threatened)\b/i,refs:['16.2','6.32','5.18'],weight:18},
 {name:'school_avoidance',pattern:/\b(?:refus\w*|avoids?|skip\w*|won.?t|doesn.?t|will not|does not|not want|afraid to)\b.{0,45}\b(?:school|class|attend)\b|\b(?:school|class)\b.{0,35}\b(?:refus\w*|avoid\w*|skip\w*|won.?t attend)\b/i,refs:['6.32','12.13'],weight:17},
 {name:'dishonesty',pattern:/\b(?:lie|lies|lying|lied|dishonest|untruthful|hide[s]? the truth|sneak\w*)\b/i,refs:['16.2','17.15'],weight:16},
 {name:'self_harm_warning',pattern:/\b(?:suicid\w*|self.harm|hurt (?:himself|herself|myself|themselves))\b/i,refs:['12.13'],weight:20},
 {name:'family_rules_disagreement',pattern:/\b(?:partner|spouse|husband|wife|co.parent|ex.partner|other parent)\b.{0,80}\b(?:disagree|rules|different|argu|disciplin)|\b(?:we disagree|different rules)\b/i,refs:['17.15','6.32'],weight:17},
 {name:'child_anxiety',pattern:/\b(?:worri\w*|anxious|anxiety|panic\w*|overthink\w*|nervous|scared|mistakes?)\b/i,refs:['2.14','6.26'],weight:6},
 {name:'perfectionism',pattern:/\b(?:perfect|perfectionis\w*|not good enough|every mistake|cries whenever|afraid of failing)\b/i,refs:['2.47','5.20'],weight:16},
 {name:'personal_interests',pattern:/\b(?:music|art|artist|dance|dancer|sport|medicine|medical|doctor|engineer|choose (?:a )?career|different interest|own path|my dreams|their dream|my dream)\b/i,refs:['3.35','18.63'],weight:15},
 {name:'defiance_or_autonomy',pattern:/\b(?:reject\w* every|reject\w* my|refuse\w* every|won.?t accept (?:my |any )?advice|needs? (?:his|her|their) own space|every suggestion|independen\w*|privacy|doubt\w* our religious|questions? (?:our|family) (?:faith|religion|traditions)|makes? (?:his|her|their) own choice|questions? our (?:faith|religion))\b/i,refs:['18.63','17.15'],weight:15},
 {name:'money_and_social_comparison',pattern:/\b(?:expensive|rich|wealthy|poor|less than|envy|jealous|inferior|better things|brands|influencers?|compare\w* (?:her|his|their) looks|appearance)\b/i,refs:['2.70','3.35'],weight:16},
 {name:'sibling_comparison',pattern:/\b(?:compar\w* (?:my |the |our )?(?:two )?child\w*|love (?:the other|my sister|my brother) more|sibling rivalry)\b/i,refs:['3.35','5.18'],weight:16},
 {name:'emotional_distance',pattern:/\b(?:doesn.?t talk|never talks|won.?t talk|distant|closeness|withdrawn|stopped opening up|doesn.?t open up|not listening to me|no one understands|rarely connect|don.?t connect|doesn.?t feel understood)\b/i,refs:['6.32','12.13'],weight:14},
 {name:'hurtful_communication',pattern:/\b(?:shout\w*|yell\w*|scold\w*|criticiz\w*|criticis\w*|insult\w*|name.call\w*|rude|hurtful|argu\w*|fight\w*)\b/i,refs:['17.15','12.15'],weight:10},
 {name:'parent_anger',pattern:/\b(?:furious|anger|angry|temper|rage|lost my temper|regret shouting)\b/i,refs:['2.63','5.23'],weight:13},
 {name:'sleep_and_balance',pattern:/\b(?:late.night|exhaust\w*|tired|burnout|sleep|2 a\.?m\.?|tutoring|too many activit\w*|overload\w*)\b/i,refs:['6.17','6.16'],weight:15},
 {name:'screen_time',pattern:/\b(?:phone|screen|gaming|video games|social media|games|tablet|scroll\w*)\b/i,refs:['6.17','6.26','6.16'],weight:9},
 {name:'attention_and_habits',pattern:/\b(?:cannot focus|can.?t focus|distract\w*|concentrat\w*|homework because of games)\b/i,refs:['6.26','6.35'],weight:17},
 {name:'study_effort_vs_results',pattern:/\b(?:homework|schoolwork|grades?|marks|exam\w*|test\w*|stud\w*|fail\w*|performance)\b/i,refs:['2.47','2.48'],weight:8},
 {name:'grief',pattern:/\b(?:grief|griev\w*|died|passed away|lost a relative|bereave\w*|loss of a loved one)\b/i,refs:['2.14','12.13'],weight:17},
 {name:'friends_and_empathy',pattern:/\b(?:friend\w*|classmates|exclude\w*|reject\w*|unkind|unfriendly|peer\w*|lonely)\b/i,refs:['12.13','6.32'],weight:10},
 {name:'role_modelling',pattern:/\b(?:peer pressure|follow (?:her|his|their) friends|risky choice|setting an example|role model)\b/i,refs:['18.30','3.21'],weight:17},
 {name:'motivation_and_esteem',pattern:/\b(?:useless|worthless|never succeed|no confidence|low self.esteem|lack of motivation|not motivated)\b/i,refs:['6.5','2.47'],weight:17}
];
const curated=new Map(VERSES.map(x=>[x.reference,x]));
export function matchedConcepts(query:string){return CONCEPTS.filter(c=>c.pattern.test(query)).map(c=>c.name);}

const THEMES:Record<string,string>={
 bullying_and_exclusion:'non-harm, empathy and responding to exclusion without adding hostility',
 school_avoidance:'careful action in the face of fear, uncertainty or difficult duties',
 dishonesty:'truthfulness, non-harm and repair of trust',
 family_rules_disagreement:'thoughtful speech and discernment when values or duties differ',
 child_anxiety:'steadiness and a less reactive relationship to fear or uncertainty',
 perfectionism:'effort without making worth depend on a single result',
 personal_interests:'reflecting carefully and allowing responsible choice',
 defiance_or_autonomy:'respectful discernment, autonomy and dialogue',
 money_and_social_comparison:'freedom from comparison and status-based worth',
 sibling_comparison:'compassion, non-harm and avoiding competitive comparison',
 emotional_distance:'gentle, non-agitating communication and connection',
 hurtful_communication:'truthful, beneficial and non-agitating speech',
 parent_anger:'self-restraint and acting without escalating anger',
 sleep_and_balance:'moderation, balance and sustainable effort',
 screen_time:'balance, attention and deliberate choices',
 attention_and_habits:'steady attention and returning to the task without shame',
 study_effort_vs_results:'effort and responsible action without attachment to results',
 grief:'acknowledging change and responding with compassion',
 friends_and_empathy:'empathy, non-harm and belonging',
 role_modelling:'responsible choices and the example adults set',
 motivation_and_esteem:'self-respect, effort and resilience'
};

export function retrieveGitaCandidates(query:string,max=7):ScriptureCandidate[]{
 const source=loadSourceTexts(); if(source.size!==700)throw new Error('Gita corpus incomplete');
 const scores=new Map<string,{score:number;why:Set<string>}>();
 const add=(reference:string,score:number,why:string)=>{
  if(!source.has(reference))return;
  const item=scores.get(reference)||{score:0,why:new Set<string>()};item.score+=score;item.why.add(why);scores.set(reference,item);
 };
 for(const concept of CONCEPTS){if(!concept.pattern.test(query))continue;
  concept.refs.forEach((ref,i)=>add(ref,Math.max(2,concept.weight-i*1.4),`concept:${concept.name}`));
 }
 lexicalRetrieve(query,12).forEach((v,i)=>add(v.reference,Math.max(0.1,2.6-i*0.22),'curated-keywords'));
 searchCorpus(query,15).forEach((v,i)=>add(v.reference,Math.max(0.1,1.7-i*0.10),'original-corpus-lexical'));
 if(!scores.size){ // General-purpose verse: reflect & choose, not a claim of subject-specific relevance.
  ['18.63','17.15','12.13'].forEach((ref,i)=>add(ref,1-i*0.2,'general-fallback'));
 }
  return [...scores.entries()].sort((a,b)=>b[1].score-a[1].score || a[0].localeCompare(b[0],undefined,{numeric:true}))
 .slice(0,Math.max(1,Math.min(max,12))).map(([reference,info])=>{
  const s=source.get(reference)!;const c=curated.get(reference);
  const conceptNames=[...info.why].filter(x=>x.startsWith('concept:')).map(x=>x.slice('concept:'.length));
  return {id:c?.id||`BG_${reference.replace('.','_')}`,reference,title:c?.title||'Original source passage',
   english:s.english,sanskrit:s.sanskrit,source_url:s.source_url,tags:c?.tags||[],previous:s.previous_context,next:s.next_context,
   retrieval_basis:[...info.why].join(','),thematic_relevance:conceptNames.map(x=>THEMES[x]).filter(Boolean)};
 });
}

/** Scripture retrieval is intentionally independent from parenting playbook
 * retrieval. It uses situation themes and the verified corpus, then exposes
 * why a passage was surfaced so a model cannot silently turn a keyword hit into
 * an asserted religious instruction.
 */
export function retrieveGitaPassages(situation:ScriptureSituation,max=7):ScriptureCandidate[]{
 const query=[...situation.reported_behaviours,...situation.context,...situation.uncertainties,...situation.plausible_explanations].join(' ');
 const candidates=retrieveGitaCandidates(query,max);
 return candidates.map((c,i)=>({...c,
  thematic_relevance:c.thematic_relevance?.length?c.thematic_relevance:['general reflective passage; relevance must be explained cautiously'],
  retrieval_basis:`independent-scripture:${c.retrieval_basis||'ranked-source'}${i===0?',top-ranked':''}`
 }));
}

