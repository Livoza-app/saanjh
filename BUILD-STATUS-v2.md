# Saanjh build verification — 18 Nov 2026

## Implemented in this revision

- Preserved all **700** user-provided Gita verses in the imported full corpus and **14** Bible pilot passages.
- Added `src/retrieval.ts`: hybrid source retrieval combining 50 editorial reference cards, original 700-verse text, and situation-pattern concept mappings. This is **not yet embedding-based semantic search** or expert theological interpretation.
- Replaced production Gemini Gita retrieval to use this hybrid retriever.
- Improved response-reference allowlisting, checks for additional unsupported references, and safety keyword routing for certain abuse situations.
- Default Gemini model now `gemini-3.5-flash-lite` for new Google API projects. Key stays server-side and Windows launcher prompts privately.
- Added `TEST_GEMINI_CONNECTION.bat` to run one fictional live test, and `GEMINI-SETUP-WINDOWS.md` with short instructions.

## Actual test results

- **22/22 code tests pass** (local, including MOCKED Gemini responses—not live provider calls).
- Original 30 authored parenting cases: **29 routine cases** and **one safety escalation case**. In routine cases, at least one author-nominated verse appears in top five for **29/29** with the revised hybrid retriever, versus **20/29** with the original keyword retriever. Historical 21/30 comparison includes the safety case (which should not ordinarily trigger scripture retrieval).
- Additional authored paraphrase cases: **19/19 routine retrieval checks**, plus **1/1 safety check** after local pattern tuning. First pass, before tuning these, was 16/20 overall.
- Local server `/api/health` returns imported corpus count and `live:false` with no key, and live endpoint rejects missing keys without making a request.

### IMPORTANT LIMITATION

These authored cases were used to tune the retrieval rules and are **not an independent blind evaluation**. A keyword rule can retrieve the nominated reference yet still misunderstand the scripture, misinterpret an unfamiliar situation, or suggest poor parenting advice. Numeric results measure only expected verse presence among retrieved candidates. The actual Gemini generation, interpretation, safe response quality, and end-to-end memorization **remain untested with a live provider key**. The Bible knowledge base is a tiny pilot subset, not the whole Bible.

## Blockers to public release

No secure user authentication, server-side quotas/payments, managed database security, privacy policy/consent, independent scriptural review, independent child-safety evaluation, or commercial translation-rights confirmation. **Use fictional information only.**
