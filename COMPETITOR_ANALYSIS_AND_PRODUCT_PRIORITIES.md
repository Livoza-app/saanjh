# Saanjh — competitor UX review and v0.6 product decisions
Research date: 20 November 2026. Market: online parent-support tools. Scope: publicly accessible official websites, product documentation, App Store listings, screenshots and independent parenting resources. **Not** a hands-on audit of authenticated competitor apps; private screens, conversion, retention and internal model quality were not accessible.

## Executive finding
- **Kidsit AI** is the strongest reference for immediate usability: describe one parenting moment by voice or text, get a structured short response, and check in later. Its product explicitly separates *what happened / why it may have happened / what to try next / a bedtime repair phrase*. It supports one child with the first 3 answers free and lists US $9.99/month or $59.99/year. Its US App Store listing shows 1 rating: not enough evidence of strong commercial uptake.
- **Good Inside** has the stronger documented trust mechanism: named clinical founder Dr. Becky Kennedy, a coherent teaching method, internally created parenting resources, AI trained using the company's material, and clinical-team involvement. Also offers stages, scripts, saved conversations, parent community, live events and co-parent interaction. Its teen-landing page states plans start at US $23.25/month; this is a paid multi-feature offering, not an apples-to-apples AI-only price.
- **Saanjh** should not imitate a large parenting academy. Its differentiator to test is accurate scripture quotation and attribution, honest interpretation, a concrete family-relevant application, safe practical options, and *longitudinal feedback*.

## What competitors demonstrably offer
| Area | Kidsit AI | Good Inside | Our response |
|---|---|---|---|
| Entry | Voice or typed 'hard moment', minimal setup, 3 answers free | Simple stage onboarding; personalized home screen | Keep free guided entry; later add voice opt-in after privacy review |
| Output | 4-part short guidance plus specific things to say | Warm answer, suggested scripts, content workshop | v0.6 adds say-this script, uncertain possible driver, repair phrase |
| Continuity | Per-child local moments and feedback | Saved GiGi conversations, child focus, app account | Child/faith-specific history exists; live cloud sync not yet configured |
| Feedback | Helped/didn't help; avoids reusing disliked approach | Saved chats, collections, courses | v0.6 structured check-in; 'Another approach' already works in code |
| Learning content | Short/fast, no extensive learning library | Large expert workshops, scripts, events, community | Only link independently sourced CDC/AAP resources for now |
| Trust | Privacy-centred claim, acknowledges no therapy | Named clinical founder, team-developed method, cautions on AI errors | Cite actual scripture; don't claim clinical validation or expert approval |
| Price | Free 3; $9.99/mo, $59.99/yr US App Store | From $23.25/mo teen page; includes broader membership | Keep $9.99 as a **hypothesis**, not a validated price |

## v0.6 applied changes
1. **Quick help / Full wisdom:** a user-controlled reading choice. Both retain the scripture citation; full view shows source text, translations and meaning/application. Quick help condenses the answer for a stressed parent. Neither choice changes AI cost or silently edits a reply.
2. **Words to use today:** Gemini is explicitly asked to generate one kind, age-appropriate script, separate from scripture. UI offers a copy button with fallback to message field.
3. **Repair after conflict:** Optional sentence for acknowledging a parent's contribution to a rupture, without eliminating necessary boundaries.
4. **What may be happening:** One non-diagnostic possibility; no invented medical or psychological explanations.
5. **Structured outcome check-in:** 'It helped', 'a little', 'didn't help', or 'not tried yet' with an optional actual-observation note. The parent reviews the draft before choosing to send another AI request, protecting against false claims of completed actions.
6. **Independent resources:** Visible links to CDC teen emotion coaching and AAP teen communication guidance; neither organization has reviewed Saanjh.
7. **Validation and regression checks:** 39 of 39 automated tests pass. New tests cover script generation/validation, guidance modes, check-in, and prohibited extra references.

## What we deliberately did NOT copy
- Dr. Becky's proprietary method, paid scripts, teaching videos, or branded coaching philosophy.
- A parent discussion/community network: safeguarding and moderation costs are high; no evidence this is the MVP bottleneck.
- Co-parent chat access: requires explicit authorization and robust family permissions, not just a share link.
- Automatic voice transcription: convenient but sensitive audio transfer and language-quality work need evaluation.
- 'Clinically validated', 'therapist approved', or 'safe for all children' claims: none established for Saanjh.

## Gaps before a real-parent launch
1. Real Google OAuth, Supabase connection and actual phone/desktop two-way sync are **not activated**. Current history remains browser local unless cloud is configured.
2. The Bible corpus has only 14 verified pilot passages; full Bible-coverage and denominational nuance are untested.
3. Automated citation checking establishes that a reference exists, **not** that the verse is the best interpretation or the parenting advice is correct.
4. No registered clinical expert or scholarly review has yet evaluated real-world output; high-stakes cases need safe escalation.
5. Independent blinded tests against Good Inside/Kidsit and real-parent retention/payments are outstanding.
6. The Gita translation reuse permission for a future commercial product should be clarified with its translator/publisher.

## Measurable acceptance criteria for pilot (targets, not predictions)
- 50 varied fictional scenarios; >=45 contain a valid sourced passage, a defensible explanation, and at least one feasible action; zero invented citations.
- 20 stress/safety test cases; zero unsafe direct parenting advice where urgent referral should occur.
- 10 alternative-approach cases; >=8 use a substantively different option (not rewording).
- 10 profile-continuity tests; zero cross-child/faith memory leakage.
- Private, non-sensitive parent pilot: measure 7-day return rate and voluntary payment intent. Do not assume reaching targets means clinical efficacy.

## Primary research links
- Kidsit official: https://kidsit.ai/en ; App Store: https://apps.apple.com/us/app/kidsit-ai-parent-coach/id6769443099 ; Privacy: https://kidsit.ai/en/privacy
- Good Inside: https://www.goodinside.com/ ; GiGi FAQ: https://support.goodinside.com/hc/en-us/articles/28488767731092-Using-GiGi ; Teen page: https://www.goodinside.com/lp/teen-parenting/
- CDC teen emotion coaching: https://www.cdc.gov/parenting-teens/tips-coaching-emotions/index.html
- AAP/HealthyChildren teen communication: https://www.healthychildren.org/English/family-life/family-dynamics/communication-discipline/Pages/how-to-communicate-with-a-teenager.aspx
