# Saanjh — Next steps after uploading the actual Gita corpus (18 November 2026)

## Completed here

- Imported the supplied `gita-corpus.json` (700 references / 18 chapters) with missing-field and duplicate-reference validation.
- Separated the original Sanskrit (public domain) from the Trust's copyrighted English/Hindi translations.
- Added direct source verse lookup, neighbouring-verse context, and basic full-corpus lexical search.
- Extended the optional AI pathway so retrieved source passages beyond the 50 curated themes can be supplied as allowed, cited source records.
- Created `gita-library-open-me.html`, a standalone research browser for inspecting all 700 verses offline.
- Ran automated tests against import, content presence, direct reference lookup, memory isolation, and existing 30 example cases.

## Not completed — do not confuse with deployment readiness

- Did not make a paid AI call or independently evaluate generated advice. An OpenAI API key was not supplied, so the live path is UNTESTED.
- Embedding-based relevance is still trained on none of the scriptures: embeddings are computed for the original 50 editorial thematic records when API access is enabled; full 700-verse source fallback is *lexical*. Do not call it complete semantic RAG yet.
- Existing 30 fictional test cases still score 21/30 for a curated expected reference in top 5; expected references are not expert-validated ground truth.
- No robust child-safety pipeline, commercial translation license confirmation, multi-account privacy protection, login, production database, or trustworthy claims of spiritual authority.

## Most practical next technical milestone

1. Enable live model access **only on a local computer** using a server-side API key (never in HTML or chat). A separate API bill applies; ChatGPT access alone does not supply this.
2. Prepare a new independent 30–50-case test set and compare retrieved references to source meaning and context. Include hostile instructions, ambiguous parenting dilemmas, serious child safety scenarios and evidence of restraint.
3. Upgrade embeddings to cover all 700 passages, cache vectors locally with a corpus/version hash, implement relevance/reranking checks, and retest retrieval before exposure to users.
4. Review model guidance quality and safety; improve the system until verified grounding and safeguarding are adequate.
5. Only after those steps, plan secure child-profile storage with parental consent and appropriate access/deletion controls for any pilot.

**User effort needed immediately:** Nothing more for scripture import. The uploaded corpus is now included. For live model testing, a securely configured API account will be needed; do not send the key in chat.
