# Saanjh — Gita-informed parenting companion (research prototype)

**Updated:** 18 November 2026 · **Status:** Full corpus imported for local research; not for public deployment.

A small working application built to test the proposed product mechanics: separate child profiles, persistent conversations, retrieval of Bhagavad Gita teaching records, AI-assisted options, follow-up, and scripture reference controls.

## Your complete Gita source browser — no installation

Open **`gita-library-open-me.html`** directly in Chrome/Edge. It contains **all 700 imported source verses** in Sanskrit, IAST transliteration and attributed English/Hindi translations. You can search for exact references, keywords and Hindi text, and visit the original source page. **It is not an AI advice engine**; it is a source inspection tool.

## Fastest way to try the parenting conversation demo — no installation

Open **`demo-open-me.html`** directly in Chrome/Edge. Try the example Aryan profile, enter a parenting concern, add another child, continue a conversation, then close and reopen the file. The browser will attempt to remember your demo data locally.

**Important:** This is an *offline rules simulation*. It does **not** call AI or the live Gita corpus. It demonstrates interface, example retrieval and profile-memory behaviour only. Some browsers do not preserve `file://` storage consistently.

## Run the local Node/TypeScript app

1. Use Node.js **22+**. On Windows, double-click **`start-windows.bat`**. On Mac/Linux, in this folder run `npm start`.
2. Visit `http://127.0.0.1:3030`.
3. It runs without any API key in **local simulation mode**, stores profiles/chats in `data/private-local-state.json`, and keeps the server bound to `127.0.0.1` only.

Node's TypeScript stripping is experimental in Node 22, which is why warnings may appear. No npm installation or third-party dependency is needed for this mode.

### Optional: enable real AI retrieval

This **requires paid OpenAI API access and an internet-connected computer**. ChatGPT subscription does not automatically supply an API key.

1. The full 700-verse corpus has **already been imported from the uploaded JSON**. If you need to re-import or replace it later, run:

   `npm run import:gita -- --file ./gita-corpus.json` (if you have the original file), or `npm run import:gita` (requires internet).

2. Make an `OPENAI_API_KEY` environment variable available to the terminal that starts the server. Optionally set `OPENAI_MODEL` (default `gpt-4.1-mini`). **Never place the key in browser code or public files.**
3. Start the server with `npm start`. `GET /api/health` will report `ai_rag` when both the API key and all 700 imported source texts exist.

In real AI mode the backend:
- Embeds the original **50 curated draft thematic records** using `text-embedding-3-small` (512 dimensions), and scores those by semantic relevance + lexical signal. Additional source-only candidates are retrieved lexically from the full **700-verse** corpus. This hybrid method is NOT full semantic embedding of all 700 passages.
- Retrieves Sanskrit, attributed translations and adjacent verses from the locally imported corpus (all 700 references available to the source loader).
- Sends the relevant family profile, prior conversation, previous plan, and selected source passages to the language model.
- Requests structured JSON and **rejects a scripture reference not in the retrieved set**.
- Retains conversation history locally under the correct child profile and the previous action plan.

**AI mode has not been exercised in this environment.** It is not independently validated and may still generate inaccurate applications. Automatic reference gating checks citations, **not** the theological or parenting accuracy of the interpretation.

## Dataset and evaluation

- `data/gita-sanskrit-700.json`: **all 700 source Sanskrit verses** with provenance and original term tags.
- `data/gita-research-translations-private.json`: **all 700 attributed English/Hindi translations**, internal research only; do not publish without rights review.
- `data/verses.json`: **50 hand-selected draft topic summaries** with precise chapter/verse identifiers. These are NOT verbatim translations, sacred quotations, or expert-validated interpretations.
- `data/evaluation_cases.json`: **30 fictional parenting situations**, including one self-harm emergency case; candidate references are *editorial hypotheses*, not professional ground truth.
- `docs/evaluation-results.json`: raw lexical-retrieval evaluation results.
- Run `npm test` for 11 automated structural, source integrity, reference, safety routing, memory, and citation-check tests.
- Run `npm run eval` for retrieval ranking on 30 sample situations.

**Initial results**: 21/30 contained at least one of the editor's expected references among the first five candidates. The emergency regex matched the labels in 30/30 scenarios. Neither figure proves real-world spiritual accuracy, clinical safety, or overall product quality. Repeating evaluation on these same examples after tuning can overestimate performance; a new holdout set is required.

## Scripture sources and rights

- **Hansi Gita Bhawan Trust**, Bhagavad Gita 700-verse Sanskrit and English/Hindi corpus: https://gitabhawan.org.in/gita/research · Download: https://gitabhawan.org.in/data/gita-corpus.json. The Trust says its own translations may be built on with attribution; independently confirm commercial licensing and attribution conditions before launch.
- **IIT Kanpur Heritage Gita** for verse comparison: https://heritage.iitk.ac.in/SBG/2.47 · precise verse links are attached to all 50 editorial records.
- Sanskrit original is ancient public-domain scripture; modern translations and commentaries can have separate copyright terms.

The importer was run **against the JSON uploaded in this conversation**; its 700 reference IDs, 18 chapter counts, core fields and links were verified structurally. This does not independently verify every Sanskrit transcription or translation against an external edition.

## Architecture

```
Browser (one child selected)
    -> 127.0.0.1 Node.js/TypeScript API
    -> profile/history (local private JSON, prototype only)
    -> verse ranking (local lexical or optional OpenAI embedding)
    -> source text retrieval (after optional import)
    -> AI structured response (optional; server-side key only)
    -> code reference allow-list / checks
    -> personalized guidance + follow-up actions
```

`sql/postgres-production-plan.sql` shows the proposed PostgreSQL + pgvector production schema. **The current app does not use PostgreSQL**. Its local JSON storage and sample user defaults are solely for early product testing.

## Not ready for real families

- No login, tenant isolation, encryption, parental identity verification, consent workflow, rate limiting, automated abuse detection, or comprehensive child-data retention controls.
- No professionally evaluated parenting guidance, no comprehensive mental-health safety classifier, and no validated theological interpretations.
- Self-harm emergency keyword matching is a deliberately basic *demo safeguard* and can miss dangerous language.
- It should not be publicly hosted, used for actual distressed children, or marketed as professional therapy, guru guidance, guaranteed life outcomes, or authoritative interpretation.

Before any pilot with real family information, add secure accounts, delete/export controls, documented privacy and retention, a properly licensed scripture dataset, red-team evaluations of theology and sensitive situations, age-appropriate advice review, a serious-risk escalation flow, and a fresh independent test set. Human review of every chat is not the intended operating model; a one-time evaluation of the **system** before release is still necessary.

## Files

- `gita-library-open-me.html` — self-contained offline browser of all 700 sourced passages.
- `demo-open-me.html` — self-contained clickable offline parenting proof-of-concept (still a 50-theme rules demonstration).
- `index.html` — browser interface for the Node app.
- `src/corpus.ts` — validated 700-verse source lookup and lexical indexing.
- `src/core.ts` — original 50-theme retrieval plus full corpus candidates, optional embedding/AI, citation gate, demo memory.
- `src/server.ts` — local HTTP API and child-profile persistence.
- `scripts/import-corpus.ts` — source corpus importer, validated against the user-supplied JSON.
- `scripts/build-offline-library.ts` — rebuild the standalone research browser (`npm run library`).
- `data/verses.json` — 50 draft teaching records.
- `data/evaluation_cases.json` — 30 fictional examples.
- `tests/*.ts` — automated checks and raw retrieval evaluation.
- `sql/postgres-production-plan.sql` — future database design only.

## New full-source API routes (local research only)

- `GET /api/corpus/status`: number of loaded verses and provenance.
- `GET /api/corpus/verse?ref=2.47`: exact source verse and two neighbours.
- `GET /api/corpus/search?query=action%20fruits`: lexical source lookup across 700 records.
- `GET /library`: the standalone 700-verse browser served locally.

These endpoints do not constitute expert-approved scripture interpretation. **No real child data should be entered until the privacy/security and quality gates are complete.**
