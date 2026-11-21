# Saanjh Codex starter — owner handoff, 21 November 2026

## What the owner is building
A calm, sophisticated parenting companion that uses the Bhagavad Gita and eventually the Bible to provide *age-appropriate, safe, personalized and actionable guidance*. Answers should use five distinct elements: actual scripture with source, meaning in the user's language, why the teaching is relevant (qualified as interpretation), suggested words/actions, and follow-up or another approach. Child profiles and individual chat threads should eventually sync across desktop and phone after one-click Google login. The product is currently a LOCAL RESEARCH PROTOTYPE, not safe for real families.

## What currently exists
- Gemini-driven localhost server + Windows `start-gemini-windows.bat` launch, with API key requested locally.
- 700 Gita Sanskrit verses, source English/Hindi translations and references; Bible pilot of 14 English passages.
- Browser UI for Gita/Bible selection, parent & child profiles, multi-chat, local browser history, quick/full guidance, verse cards, alternative approach, check-in feedback and pricing MOCKUPS.
- Auth and Supabase SQL/code are scaffolding ONLY; not activated or two-device verified.
- 50 draft parenting playbooks + 400 synthetic questions; QA/evaluation tooling; 110 existing automated code tests on Node v22.16.0 in preparatory check (not live Gemini response evaluations).
- Major known gaps: quality/safety of live advice, context retrieval/generalization, actual cross-device login and sync, security/privacy, clinical/scriptural evaluation, commercial translation rights, payments, deployment.

## Your first Codex task — implement it, not just plan
1. Read AGENTS.md and relevant files; run `npm test`; explain the real architecture and critical gaps in under 12 concise points.
2. Improve the CURRENT interface to be professional, calm and accessible on mobile and desktop. Prioritize making the chat composer, new chat, child selector, original verse + meaning + relevance + practical steps, 'another approach' and feedback genuinely usable. Avoid radical rewrite or breaking API routes. Fix the most impactful usability defects you find; add appropriate regression tests.
3. Preserve all previous local-browser conversation data and API-key security. Do NOT activate unconfigured Google OAuth/Supabase or paid API calls, and do not send any real family information anywhere.
4. Run test suite, locally smoke-test the web UI on desktop and phone widths if possible, and provide short instructions to run it on Windows. State which features are only demos or require external setup.
5. Once this task is finished, propose the *next one* (cloud login + real account data protection) separately; do not silently deploy or purchase services.

## User's simple Windows flow
Download ZIP, Extract All, open its `gita_parenting_poc` folder in the ChatGPT desktop app's Codex view as a local project. Give Codex the single request: `Read START_WITH_CODEX.md and AGENTS.md, then carry out the first assigned task. Run tests and show what changed.`

## Useful commands (run from `gita_parenting_poc`)
- `node --version` (need Node 22.6+)
- `npm test`
- `npm start` (demo; check docs for Gemini mode)
- Windows: double-click `start-gemini-windows.bat` and enter key in terminal; keep API key out of Codex chat.

## Note to Codex
The owner does not code. Do the engineering within your scope, ask only for indispensable external authentication/approval, and never imply that passing synthetic tests proves advice safety or correctness.
