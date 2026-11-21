# SAANJH — instructions for Codex

You are the implementation agent for Saanjh, a research-stage, faith-grounded parenting-guidance website. Preserve and improve the CURRENT codebase; do not create an unrelated replacement. The owner is non-technical and wants working, tested changes with a simple Windows launch path.

## First read
- `START_WITH_CODEX.md` (hand-off and immediate task)
- `README_V0_8_400_SCENARIOS.md` (latest actual state)
- `README.md`, `GEMINI-SETUP-WINDOWS.md`, `CLOUD_LOGIN_SETUP.md`
- `package.json`, `src/*`, `tests/*`, `qa/*`

## Existing system and constraints
- Node >=22.6, TypeScript executed via `node --experimental-strip-types`; local server at http://127.0.0.1:3030.
- Existing browser UI in `saanjh-preview.html` and `index.html`; local Gemini service in `src/`.
- Scripture: 700 Gita records with Sanskrit and attributed third-party English/Hindi translations. Distinguish original verse, translation, AI meaning, contextual relevance, and AI practical suggestions. Keep canonical references and attribution. Confirm any commercial translation permission before live launch.
- Bible: a small pilot corpus, not a complete verified Bible experience.
- 50 playbooks and 400 synthetic cases are development hypotheses, NOT validated or model fine-tuning. Holdout keyword match previously ~45.7%; do not claim proven clinical quality.
- Local browser history works; Google sign-in / Supabase cloud sync is only staged and requires external configuration and security verification. Billing/payments are NOT live.
- Safety is critical: no real minors' sensitive data; do not claim professional or clinical review. Existing AI safety triage has NOT been sufficiently validated on unseen cases.
- Paid Gemini API access and secret credentials: NEVER put API keys/secrets in code, committed files, screenshots, client HTML, or test outputs. Use server-only environment variables and fictional test data. Do not initiate paid live batches without explicit approval.

## Engineering standards
1. Run `npm test` first and record the baseline; at packaging baseline 110/110 tests passed (Node 22.16.0). Keep tests passing, and ADD tests for modified features.
2. Don't overwrite or delete chat history, corpus, playbooks, tests or existing Windows launchers without an explicit, tested migration and owner approval.
3. Work iteratively, using small comprehensible changes. Prefer an accessible, mobile-responsive, calm design; no decorative fake controls. Every visible button must work or be clearly disabled.
4. Clearly label sample/offline replies versus live AI. Do not state that cloud sync, payments or expert reviewed advice are active when they are not.
5. Before presenting completion: run the code tests, start the local preview if feasible, inspect desktop/mobile rendering, verify source attribution and link behaviour, document exactly what changed, what passed, and what remains unverified.
6. Preserve the user's Gemini integration and project-specific monthly spending controls; don't change models or create Google services without explaining changes and explicit consent for paid usage.

## First assigned task
Follow `START_WITH_CODEX.md`. Report a concise summary of the current code and make the FIRST focused UX reliability improvement end-to-end (not a complete rewrite). Keep functional integration intact.
