## Saanjh v0.3 — New chat added

**Windows:** Read `NEW-CHAT-UPGRADE-WINDOWS.txt` first. This includes how to restart the existing local Saanjh website and preserve Chrome chat history.

> **IMPORTANT UPDATE (18 Nov 2026):** Open `GEMINI-SETUP-WINDOWS.md` first for live API steps and model availability. New retrieval results are in `docs/retrieval-v2-evaluation.json`. The old 21/30 baseline is historical and not the updated retriever.

# Saanjh — interactive parenting website (private MVP preview)

**Build date:** 18 November 2026. This package builds on our previous Gita research prototype.

## The easiest way to see it now

**Double-click `saanjh-preview.html`.** It is a fully interactive, self-contained website preview that works offline, without installation or an AI key.

Try changing between **Bhagavad Gita** and **Bible**, editing the parent and child profiles, discussing a fictional parenting situation, returning to the same child chat, recording feedback, and viewing the Free/7-Day/Plus plans.

**Important:** In the offline file, the generated-looking guidance is a *clearly labelled sample*, **not live AI**. It keeps fictional profiles and chat history only in the browser's localStorage. It does not contact our servers.

## To use real AI on your Windows computer (optional later)

1. Install Node.js 22 or later if not already installed.
2. Create a Google AI Studio **Gemini API key** and enable appropriate billing and privacy terms. Do not share the key with me or put it in the website files.
3. Double-click `start-gemini-windows.bat`, enter the key in the hidden prompt, then open **http://127.0.0.1:3030** in Chrome.
4. You will see a **Gemini connected** status. The backend invokes `gemini-3.5-flash-lite` through the official REST endpoint. Without a configured key, the same website uses clearly labelled sample replies.
5. For offline-only use without an API key, simply open the HTML preview. You don't need Node for that.

The key is kept only as an environment variable for the current process. **This has not been live-tested with a real Gemini key** in our development environment. API billing, provider availability and generated-answer quality still need testing.

## What is implemented

- Responsive web interface with **Gita/Bible** selection.
- Parent and multiple child nickname/age profiles.
- Separate chat history and last-plan memory for each child and faith (stored in the local browser).
- Three-option useful feedback per assistant response (Helpful / Another approach / Tried it).
- Displayed free **20 replies/month** limit (currently browser-only, not secure against circumvention).
- Clearly-labelled **$2.99 one-time 7-day pass** and **$9.99/month** pricing concepts. **There is no checkout or paid account activation.**
- Full **700-verse Gita corpus** in the backend, alongside 50 thematic search records.
- Bible **14-verse pilot subset** from the public-domain World English Bible, *not yet a whole-Bible corpus*.
- Server-side Gemini REST adapter with contextual retrieval, source allowlist, structured response checks, and basic safety triage.
- **22 automated tests** including mocked Gemini response validation; no live Gemini test yet.
- UI stores client-side data. The local server does not persist messages; for live requests, it sends the relevant profile and recent chat messages to Gemini.

## Important limitations before public beta with real parents

- **Not safe for public hosting**: no login, server-side usage enforcement, billing, abuse prevention, rate limits, production database encryption, consent/retention policy or privacy compliance audit.
- It has not been audited by child-development, mental-health or faith specialists. Basic keyword safety triage can miss dangerous circumstances. Do not use it as a counsellor or risk assessor.
- Gita search is currently a **hybrid lexical/thematic preselection** over the real corpus, followed by an AI choosing from retrieved sources. This is *not* a fully evaluated semantic embedding index of all 700 verses.
- Scripture references are checked against retrieved passages; this **does not prove** theological or parenting accuracy.
- The Bible pilot is a small sourced set; expanding to a full public-domain Bible corpus is a next step.
- Hansi Gita Bhawan Trust's translations are copyrighted and require attribution; verify commercial redistribution terms before any public launch. The Sanskrit text is public domain. The Bible pilot uses World English Bible public-domain excerpts.
- No real payment provider has been connected. We have not launched the app or enabled subscription charges.
- We have not tested this website in a full automated browser environment. The inline JavaScript passed `node --check` and the API has been tested locally; a browser regression test is still needed.

## Business defaults proposed, not yet proven

| Plan | Proposed price | Proposed access |
|---|---:|---|
| Free | $0 | 20 replies / month |
| 7-day pass | $2.99 one-time | Limited-time paid access, no renewal |
| Plus | $9.99 / month | Up to 500 AI replies / month |

**These are hypotheses, not revenue commitments or market-tested prices.** A real payment system, taxation and price localization still need implementing.

## For developers

- `src/preview-server.ts` — localhost-only web server and Gemini API route.
- `src/gemini.ts` — source retrieval, safety triage, Gemini REST request and citation allowlist.
- `data/gita-sanskrit-700.json`, `data/gita-research-translations-private.json` — imported Gita source. No key included.
- `data/bible-pilot.json` — 14 World English Bible pilot quotations.
- `tests/gemini.test.ts` — tests in addition to the earlier tests.
- `npm test` — run structural + retrieval + mocked Gemini unit tests.
- `npm start` — start localhost-only server in sample mode unless `GEMINI_API_KEY` is set.
- `npm run start:legacy` — earlier standalone Gita research API, retained for reference.

## What I need from you next

Try the sample app with **fictional family names and situations**. The next actual development milestone is a private live Gemini trial against our fixed parenting test cases. After that comes secure accounts and server-side usage billing, then a small real-parent pilot.
