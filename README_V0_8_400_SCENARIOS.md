# Saanjh v0.8 — Parenting pattern knowledge & broad quality evaluation

## Delivered now
- `qa/parenting-playbooks-50.json`: 50 source-linked *editorial coaching pattern hypotheses* with age ranges, red flags, sensible questions, what to try and what to avoid.
- `qa/parenting-scenarios-400.json`: 400 synthetic parenting prompts across the 50 topics (6 development and 2 withheld test prompts per topic).
- `qa/20-memory-journeys-v08.json`: 20 multi-turn conversation scenarios for separate child records, parent-confirmed actions, corrections, cross-faith boundaries, deleted history and serious safety escalation.
- `qa/20-hindi-language-cases-v08.json`: 20 Hindi language checks; these are **additional** to the 400 English prompts and are not scored offline.
- `src/parenting-playbooks.ts`: retrieval layer and compact complete catalogue. The Gemini prompt gets both the tentative lexical matches and a compact all-category menu, and must independently choose the fitting category. The 4 urgent themes are excluded from normal coaching. This **does not retrain Gemini**.
- `scripts/eval-playbooks-v08.ts`: offline keyword matching benchmark; development and withheld splits scored separately.
- `scripts/qa-live-400.ts` and `RUN_400_QA_WINDOWS.bat`: optional paid live Gemini batch, starting with only five fictional cases, with larger choices behind explicit confirmation.
- `qa/Saanjh_400_Parenting_Scenario_Library.html`: searchable, offline view of examples and source links.

## Honest benchmark
- 50 topic types, 400 examples: 300 development, 100 withheld.
- Of 300 development cases, 24 are urgent tests excluded from normal coaching. **276 normal development cases: 100% top-2 keyword match**. The inputs share phrasing with the development examples stored in the playbook, so this is an easy/in-sample result.
- Of 100 withheld cases, 8 are urgent; **92 normal withheld cases: 45.7% top-2 keyword match**. This is a warning that keyword-based recognition is brittle.
- The holdout questions are **synthetic and share an author and subject templates with the development data**; they are not independently collected real parent utterances.
- Gemini's newly added selection of all 46 non-emergency category options has **not been live tested**. We cannot report a new accuracy number.
- Source ID validation and 108 tests passing do not prove scripture interpretation quality, parenting safety or real account isolation.

## How the product now uses the library
1. Safety prefilter and secondary Gemini safety triage (must be independently tested) before normal coaching.
2. Provide parent age, history and newest corrections to Gemini.
3. Add a compact set of the 46 routine-topic descriptions. Gemini chooses whether any fit, instead of depending solely on brittle keyword matching. The selected pattern is explicitly a coaching *hypothesis*, not a diagnosis.
4. Separately retrieve actual scripture and limit answers to approved source IDs.
5. Generate the existing five guidance pieces: original cited text; plain-language meaning; contextual application; practical options and words to say; focused follow-up and alternative approach.
6. Evaluate feedback and outcomes, not just whether the response format looks polished.

## Important limits and next evaluation
- These are **fictional examples authored for test coverage**. They do not establish which questions real parents ask most frequently. Recruit parent volunteers for representative queries only **after privacy and clinical-safety readiness**.
- The reference links are **background resources, not endorsement or clinical review**. The 50 summarized practical directions have not been individually validated by experts.
- Bible pilot still has 14 passages; this is insufficient to demonstrate a comprehensive Bible product.
- The old deterministic safety check managed only 5/12 unseen risk phrasings. The secondary AI safety screen has not been measured live. **No real-child data; not ready for private/public beta.**
- Multilingual pattern matching is not validated. The model gets the category menu so it may reason in Hindi, but we have not measured that.
- We have NOT run 400 billable Gemini generations. The existing Gemini API key remains private and can be entered locally using the Windows launcher. The spend cap may be enforced with a delay, so choose **5 cases first** and watch the billing dashboard.

## Suggested release quality gates (targets, not observed results)
- Evaluate 100 genuine, independently written normal parent queries across age groups without tuning to them; at least 85% relevant topic recognition before using patterns widely.
- For a sample of generated answers, score useful specific actions, context-faithful scripture explanations, no unsupported divine claims, not repeating failed advice, and sensitivity to culture and age.
- **Zero severe unsafe outputs** in a substantial intentionally adversarial safety test set; obtain professional evaluation of high-risk routing.
- For cloud memory: isolate parent account, child identity, selected faith, correct previous suggestions vs parent-reported actions; verify deletion through Supabase and test on two separate devices.

## Underlying resources
- CDC positive parenting by age: https://www.cdc.gov/child-development/positive-parenting-tips/index.html
- CDC Essentials for Parenting Teens: https://www.cdc.gov/child-development/positive-parenting-tips/young-teens-12-14-years.html
- AAP/HealthyChildren screen-time conflicts: https://www.healthychildren.org/English/family-life/Media/Pages/screen-time-and-temper-tantrums-helpful-tips-for-parents.aspx
- AAP/HealthyChildren school avoidance: https://www.healthychildren.org/English/health-issues/conditions/emotional-problems/pages/School-Avoidance.aspx
- AAP/HealthyChildren teen mental health: https://www.healthychildren.org/english/ages-stages/teen/pages/mental-health-and-teens-watch-for-danger-signs.aspx

**Security:** API key must only be entered in the hidden prompt on Windows, never sent to the browser or uploaded in QA files. This project is localhost-only, not suitable for hosting publicly in its current form.
