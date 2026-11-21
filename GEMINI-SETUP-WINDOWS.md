# Saanjh: Connect Gemini on Windows (November 2026)

## Do these 4 steps

1. Visit **https://aistudio.google.com/apikey**. Sign in with Google. Choose **Create API key** (or copy your project's existing key). The key is a secret; don't send it to anyone or paste it into ChatGPT.
2. Use **Set up billing** on Google's API keys page, check the account's model access and enable budget alerts. For children's sensitive content, use the **paid API tier**, not the free-tier data-usage policy. Billing and access are controlled by Google. **Do not input real family details until the website has secure accounts, privacy protections, and safety testing.**
3. If Node.js isn't installed, install **Node.js 22+** from https://nodejs.org, then extract the ZIP. Open the `gita_parenting_poc` folder.
4. Double-click **`TEST_GEMINI_CONNECTION.bat`**. Paste the API key into the **hidden** prompt (it won't appear on screen). The script makes ONE call with a fictional family. If it says **PASS**, double-click **`start-gemini-windows.bat`**, enter the key again, then visit **http://127.0.0.1:3030** in Chrome. Use **Ctrl+C** to stop the local server.

If you only want to see the design, double-click **`saanjh-preview.html`** instead. It uses fictional sample answers without Gemini and needs no key.

## Model choice and prices

- This project's default is **`gemini-3.5-flash-lite`**. New Google API projects may have restricted access to the older `gemini-2.5-flash-lite` model.
- As listed on Google's standard paid-tier pricing page on 18 Nov 2026: 3.5 Flash-Lite is **US$0.30 / million input tokens** and **US$2.50 / million output tokens** (including thinking tokens). A response with 4,000 input and 800 output tokens costs about **US$0.0032**, excluding extra calls/tokens.
- A lower-cost alternative to test separately is **`gemini-3.1-flash-lite`** (listed at US$0.25 / million input, US$1.50 / million output). In PowerShell BEFORE starting the server, set `$env:GEMINI_MODEL = 'gemini-3.1-flash-lite'` or modify the script to set that environment variable. We have **not** compared quality with real models yet.
- Sources: https://ai.google.dev/gemini-api/docs/get-started and https://ai.google.dev/gemini-api/docs/pricing and https://ai.google.dev/gemini-api/docs/models

## Troubleshooting

- **Node not recognized:** restart Windows Terminal after installing Node.js. Run `node --version` (must be 22+).
- **401/403:** regenerate or check the key, Google project, billing status, account permission and the selected model. Use Google's API keys page, not a browser-only key embedded in HTML.
- **404 model not found / 429 quota:** check the selected model in Google AI Studio and the project's available capacity or billing. Do not repeatedly retry expensive calls.
- **No connection in browser:** the server must still be running in the terminal; use http://127.0.0.1:3030, not file:// for live mode.
- **Preview says demo mode:** key not configured. `saanjh-preview.html` is offline sample mode; the server version at localhost is live when configured.
- **Rejected citation:** the app blocked an unsupported AI reference. This is a safety guard, not an error in scripture data. Do not override the guard merely to display a response.

## What is / isn't done

✅ 700-verse Gita corpus; revised hybrid retrieval over corpus and 50 curated concepts; 14-verse Bible pilot; source allowlisting, expanded safety triage, 22 automated code tests; Windows one-click test and launch.

⚠️ **This is NOT a public or clinically validated website.** It has no secure accounts, server-enforced paid plans, online payment handling, or independent expert evaluation. Profile history stays in the local browser. The script sends fictional example data to Gemini; other live user chats send the entered child profile and recent conversation to Google. Do not upload real child-sensitive details until the privacy architecture is implemented. No live Gemini request could be made in the build environment because no user API key was supplied.
