# Saanjh QA — v0.7 (20 November 2026)

## What was actually executed
- Reused v0.6 project and existing Gita corpus (700 verses) and Bible pilot texts (14 passages).
- Prepared **50 different fictional parenting scenarios** (Gita/Bible, English/Hindi), including school pressure, screens, confidence, anger, bullying, family conflict, grief, faith, potential learning needs, serious risks.
- Executed the offline source/safety routing checks on all 50. **50/50 passed after tuning against these cases.** This is not a held-out accuracy result.
- Automated suite passed **102 tests**, including prior tests, 50 scenario checks, and browser state tests for memory isolation and restoring old threads.
- Prepared **10 multi-step test journeys** (repeated chat, new chat, two children, switching faith, correction, alternate approach, deletion and safety).
- **No live Gemini replies to these 50 scenarios have been observed by this environment:** a private user API key is required and has not been shared.

## Serious findings
The original Saanjh v0.6 keyword safety router failed 4 urgent examples and overflagged one hypothetical question within the first 50. After patching those, a second, differently worded safety set recognized only 5/12 correctly. We broadened the router and added a secondary Gemini safety-screening call that blocks normal advice when classification fails. **That secondary model screening has been validated only with mocked responses, not real Gemini requests.**

A new, previously unseen set of 12 differently worded safety prompts still scored **5/12 correct on the deterministic first layer**. This is evidence that keyword rules alone cannot be relied upon. It is **not** a measured accuracy score for the two-layer system; the new Gemini screening layer has not been run against those prompts yet.

The earlier Ketan/Aryan live examples provided in conversation also exposed generic guidance, a sweeping recommendation to pause all homework discussions, and an incomplete-looking memory summary. This reinforces the need for manual quality review of generated answers.

## Why passing automated tests is not enough
Structural tests can establish: scripture sources exist, citations stay within retrieved passages, chats are scoped to child+faith, some high-risk phrases route to safety, response formatting meets schema. They cannot establish that a real parent would receive correct interpretation, sensible parenting advice, reliable recognition of indirect danger, or safe handling of contradictory memories.

## Release gates before a private pilot with real families
1. **Safety:** Zero dangerous answers or mishandled emergencies on a materially expanded, independently authored scenario set; add safety expertise before public use.
2. **Scripture:** Zero invented citation IDs or altered source-text display; separately assess interpretations and contextual faithfulness.
3. **Parenting:** At least 80% of cases rated useful/actionable by qualified reviewers in a blind set, with no high-severity mistakes (proposed bar, not a clinical validation standard).
4. **Memory:** Same-family context works and no cross-child/cross-faith leaks in live tests, including user corrections, deletion, and new chats.
5. **Privacy:** Real Google sign-in and Supabase RLS must be configured, audited, and tested across devices before any real personal information is collected.
6. **Operations:** Track API token use and costs, verify limits, and prevent logging or accidental exposure of family details or API keys.

**Status: research prototype. No real-child data; no public beta.**

## How to run the live batch on Windows
Double-click `RUN_SAANJH_TESTS.bat` in `gita_parenting_poc`. Choose 5 cases first to verify API access, then 50. The runner uses the existing Gemini key only in memory for the current PowerShell session, and produces `Saanjh_QA_RESULTS.zip` to upload for independent analysis. It makes paid API calls, and some runs may stop early because of quota/errors.
