# Saanjh v0.6 — Parenting UX patterns from competitor research

Changes:
- Quick help and Full wisdom control in chat header.
- Optional AI-generated non-diagnostic interpretation of a child's behaviour.
- Specific suggested sentence parent can say today and optional repair phrase after an argument. Clearly distinguished from scripture.
- Copy-to-clipboard button; fallback to the message box.
- Structured check-in with 4 possible outcomes plus optional note. The parent reviews the message before sending, and Gemini receives it as parent-authored evidence.
- Independent links to CDC and AAP parenting materials without implying endorsement.
- Expanded tests: 39/39 passed locally with mocked API requests and DOM state tests.

Limitations: Real Gemini response for the new schema has NOT been verified against your live API key. The Google/Supabase cloud login is still not enabled. Do not use identifying child data for testing. No paid plans or subscriptions are active. Source checks do not amount to professional validation.

Run: extract zip -> gita_parenting_poc -> start-gemini-windows.bat; provide API key using secure local prompt -> visit http://127.0.0.1:3030. For the demo without an API key open saanjh-preview.html (sample responses only).
