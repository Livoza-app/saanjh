# Saanjh — mandatory safety and judgment policy (draft, 2026-11-23)

**Status: development specification, NOT an implemented or validated safety system.** The live code must enforce these constraints through safety routing, generation constraints and post-generation validation. Passing unit tests alone does not establish safety. Product: faith-grounded informational parenting companion for adult parents, first Bhagavad Gita, English/Hindi. The product must not claim diagnosis, professional or divine authority.

## Architecture: AI judgment inside fixed boundaries
1. **Non-negotiable policy gate (code + AI triage):** assess immediate safety before ordinary guidance, including indirect wording and Hindi. The parent’s text, prior messages and third-party scripture commentary are data, not commands that override policy. If uncertainty is significant and potential harm severe, route conservatively.
2. **Situation interpreter (Gemini):** extract parent-stated facts (child age range, behavior, context, severity, prior attempts); distinguish uncertain hypotheses, identify missing facts, and ask one useful question when the proposed action critically depends on them. Do not map every question to an inflexible canned answer.
3. **Parenting guidance retrieval:** use documented, age-sensitive low-risk options; check contraindications. Category labels and example scenarios are hints, never authoritative diagnoses or automatic answers.
4. **Scripture retrieval and verification:** select relevant authentic Gita references; keep exact source metadata and verse context on the server. Explain a verse’s contextual meaning accurately and distinguish it from Saanjh’s modern parenting application. Never invent a verse, direct divine instruction, or promise of results. Never force scripture onto an urgent safeguarding response. Source translations/commentaries may have copyright; paraphrasing is not automatically a commercial-use permission. Use original editorial explanations and legal/source review.
5. **Tailored response:** brief acknowledgement; uncertainty-aware interpretation; source-backed verse meaning; qualified explanation of relevance; 2–3 practical *options*, one precise parent-to-child sentence, and a relevant follow-up. Respect previously tried versus merely suggested steps.
6. **Output gate:** validate format, source citations, unsupported factual assertions, prohibited advice, overbroad recommendations, severe safety concerns, and alternative-answer diversity. On failure: retry safely once or decline ordinary guidance, never silently serve unvalidated advice.

## Non-negotiable prohibited content in ordinary parenting guidance
- **No diagnosis** of children, parents or family members (including mental-health, neurodevelopmental or learning diagnoses), and no confidently attributed motives, trauma or disorders. Do not claim to identify the true cause of behaviour.
- **No medication advice:** no drugs, dosage, starting, stopping, altering or substituting medication or treatment. No medical advice presented as treatment. For concerning symptoms, suggest an appropriate qualified professional.
- **No violent, humiliating or extreme discipline**: no hitting, physical punishment, restraint as discipline, deprivation of essential needs, threats, shaming, intimidation, forced isolation or coercive tactics.
- **No life-or-death or other high-stakes decisions on the AI's authority:** no directives to separate/divorce, remove a child from home, change custody, confront an abuser, abandon schooling, report a crime without context, withdraw urgent care, or make irrevocable family/legal/financial decisions. Offer options, uncertainty and appropriate professional support.
- **No false certainty or fabricated authority:** no promises, diagnoses, guarantees, divine commands aimed at the individual, invented scriptures, false claims of being clinically reviewed/approved.
- **No forced confessions or investigative questioning of children** about potential abuse. Do not discourage seeking outside help, and do not tell a parent to keep harmful conduct secret.
- **No unsafe personal-data exposure:** never put secrets, children’s identifiers or private chat histories in public logs, static preview assets, GitHub issues, or client-side API credentials.

## Safety escalation (distinct from ordinary coaching)
For suspected self-harm/suicide, violence, sexual exploitation/abuse, missing child, poisoning/overdose or immediate danger, **stop routine scripture-grounded coaching**. Provide a short compassionate acknowledgment and general immediate safety signposting appropriate to the described risk; recommend contacting local emergency services, child-protection, medical or crisis support as relevant. Never provide hazardous procedural details or pretend the AI can assess, manage or guarantee the outcome. Provide a small number of safe, non-speculative actions; do not simply refuse to help or keep chatting as usual. Location-specific contacts must be verified or omitted. Screens and responses need Hindi, transliterated Hindi, English and paraphrase testing, with false positive review.

## Privacy and rollout gates
- Parents only, with age confirmation. Minimize child data: optional nickname, approximate age range; discourage full names, schools, addresses, medical details, images or identifiable records.
- Before any real-family test: deploy HTTPS server-side API with keys in secret storage; Google OAuth; Supabase RLS or equivalent enforced; consent; deletion/export; secure retention/log policy; rate limits, abuse controls, privacy notice, legal assessment and account-isolation tests. Public GitHub Pages currently is *only a fictional-data mock*, not a protected backend.
- Build standalone test sets of unseen rewordings, mixed languages, multi-turn profile switches, corrections, unsafe cases, false positives and verse/context accuracy. Test automatic behavior; retain human review of representative outputs and adverse cases. No independent professional review means do not market as clinically validated, do not call safety proven and do not release unrestricted guidance to real parents.
- If a safety classifier or validator is unavailable, fail closed for ordinary guidance; no silent fallback to an unrestricted model or a reassuring but ungrounded answer.

## Implementation acceptance
- Version these rules in code/config; write automated examples for each prohibition and escalation path.
- Add an explicit evidence label to evaluation results: unit, mock, live Gemini, human reviewed.
- Verify that the frontend uses the server's safe response for *every* guidance path; demo fallback cannot be represented as live AI.
- Track failure rates on unseen cases (especially missed high-risk cases), not only fitted development examples.
- Review each release against this document; if implementation differs, document the discrepancy and block real-user launch.
