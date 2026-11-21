# Saanjh v0.6 — competitor-informed parenting UX

Read `RELEASE_NOTES_V0_6.md` and `COMPETITOR_ANALYSIS_AND_PRODUCT_PRIORITIES.md` first.

# Saanjh v0.5 — calmer parenting guidance, with optional sign-in and sync

**Start with `READ_ME_V0_5_FIRST.txt`**. The redesigned responsive demo is in `saanjh-preview.html`; the Windows Gemini launcher is `start-gemini-windows.bat`.

## Currently working

- Calmer mobile and desktop layout, mobile family drawer and conversation interface.
- All prior v0.4 Gita features (700 source verses, sourced Hindi and English translations, scripture explanations, personalized advice, alternatives, feedback), Bible 14-passage pilot, multiple children and threads.
- Existing browser-local history format, so the same localhost origin and Chrome profile can retain demo conversations.
- Local Gemini connectivity via hidden key prompt; server does not expose your Gemini API key in HTML.
- **Google sign-in and cloud sync code** + PostgreSQL schema + security policies, ready to configure separately; not active without an external Supabase project and Google OAuth client.

## Not yet functional without external setup

- One-click Google account sign-in, account-based history retrieval and cross-device access. See `CLOUD_LOGIN_SETUP.md`.
- Public deployment on HTTPS, subscriptions and payment processing.

## Safety

**Research prototype only, fictional children.** Authentication and user-data storage are essential but not by themselves sufficient to release to real families. Prior to launch: third-party permissions and scripture reuse, sensitive child-data controls, retention/deletion, privacy terms, beta evaluations and adverse case handling, sustainable payment and quota governance, secure hosting and HTTPS.

## Quality checks

Run `npm test` (Node 22+) and check the current test report. A successful structural test does **not** mean that live Google OAuth, database migration, verse interpretation or real-world parenting effectiveness has been validated.

Source: Hansi Gita Bhawan Trust attributed Gita translations, https://gitabhawan.org.in/gita/research, and World English Bible pilot. Commercial translation rights must be checked separately.

## Version 0.7 QA update — important

This research-only release adds 50 test situations, 10 multi-step memory journeys,
a quality-review playbook, automated checks, expanded rule-based safety routing,
and an additional **experimental Gemini safety-screening API call** before routine
guidance. This adds API cost and can increase latency. If the safety screening
request fails, ordinary AI guidance is blocked instead of silently continuing.

To test on Windows, double-click `RUN_SAANJH_TESTS.bat` and start with **5**
fictional cases. To run the full set, choose **50**. An optional memory batch
and a ZIP containing the results are created without saving your API key.

The 50 offline cases passed deterministic checks only; live answers and
real-world safety are **not** validated. Unseen safety paraphrases showed
that keyword routing alone is inadequate. The Gemini safety screen has not
been independently tested with your live account, and public launch is blocked.
See `qa/REVIEW_AND_RELEASE_GATE.md` and `QA_READ_THIS_FIRST.txt`.
