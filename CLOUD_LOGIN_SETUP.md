# Saanjh — Google sign-in & cross-device sync setup

**Built into v0.5, but not active until you configure a cloud identity/database provider.** Your existing Gemini API key is for generating responses, **not for user login**. Never paste any Gemini or Google OAuth *secret* into an HTML page, this chat, or `cloud-config.json`.

## Why this is needed

Your previous browser-only version saved chats in Chrome on one computer. It cannot show them on another device. Version 0.5 includes optional **Supabase Auth (Google OAuth)**, **Postgres family-history storage**, and **Row Level Security** so authenticated accounts can retrieve their own history. In the configured mode, it checks each identity on the Gemini endpoint and enforces a 20-reply monthly development allowance server-side.

## What remains to activate it (one-time setup)

1. Open **https://supabase.com/dashboard** and create a project named **Saanjh**. This is a separate service from Google AI Studio. Choose a database region and carefully review the provider's current free limits, privacy/security settings, and pricing.
2. In Supabase **SQL Editor**, open and run `sql/saanjh-cloud-auth-and-memory.sql` from this ZIP. It creates a per-account history document, guarded save operation, and authenticated usage meter. **Never skip the SQL setup.**
3. In Supabase **Project Settings → API** (or **Connect / API Keys** in newer dashboards), copy the **Project URL** and the **publishable/anon key**. Make a copy of `cloud-config.example.json` named `cloud-config.json` in the project folder and fill in *only* those two public fields. **DO NOT use the service_role or secret key.**
4. In the existing **Saanjh AI Google Cloud project**, open **Google Auth Platform**. Configure the app branding/audience and create an **OAuth client ID** of type **Web application**. For initial local testing, add `http://127.0.0.1:3030` as an allowed JavaScript origin. Under **Authorized redirect URIs**, add the **exact Supabase callback URL shown under Authentication → Providers → Google**, generally `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback`. The OAuth client ID and secret belong in Supabase's **Google provider settings**, *not* in this code. Only request standard `openid`, `email`, and `profile` scopes.
5. In Supabase **Authentication → Providers → Google**, enable Google and save the OAuth Client ID/secret. In **Authentication → URL Configuration**, add `http://127.0.0.1:3030/` as an allowed redirect URL for your private localhost testing. The correct redirect is returned by Supabase OAuth. Later add the real HTTPS website URL; do not leave permissive redirect wildcards in production.
6. Start `start-gemini-windows.bat`, enter your Gemini API key as usual, open **http://127.0.0.1:3030**, click **Sign in → Continue with Google**, and complete the consent screen. When prompted, **Start fresh** or explicitly **Import this browser's demo history**.
7. Open **My account → Save changes now**, then **Load latest cloud history**, and verify your mock child/chat history survives reload.

## For phone + desktop

Your phone **cannot** open `http://127.0.0.1:3030` running on your laptop: every device's `127.0.0.1` refers to *itself*. True cross-device testing therefore requires a **deployed HTTPS website + persistent server**. This ZIP is **localhost-only by design**. Do **not** expose your laptop port or place your Gemini API key in the frontend as a workaround. Host only after adding production protections (privacy policy, account deletion and consent, provider terms review, abuse controls, monitoring, and child-data safety review). When hosted, add its HTTPS domain to Google OAuth origins and Supabase redirect URLs.

## What the code does and doesn't do

- **Built:** Google OAuth client code, verified user-token check before live AI in cloud mode, user-owned Supabase Postgres history row, account-scoped RLS, optimistic revision check against older device overwrites, manual JSON export and cloud-family-data deletion, 20-reply monthly experimental quota, clear local vs cloud save statuses.
- **Not activated/tested against a real cloud account:** a live Google sign-in, cross-device synchronization, and Supabase database permissions. This needs your Supabase project credentials and a live test.
- **Not built:** production HTTPS deployment, complete GDPR/NZ/India/US child-data compliance, complete privacy policy and consent handling, automatic account deletion from Supabase Auth, comprehensive abuse protection, production billing/payments, simultaneous edit merging, robust observability, expert-level scripture evaluation. This beta does not accept real family histories.
- **Usage caution:** the monthly limit is measured in UTC; a model request that fails after a quota claim may still count against the allowance. Local browser counters are for the demo only. No payments are accepted.

## Helpful current documentation

- Google sign-in in Supabase: https://supabase.com/docs/guides/auth/social-login/auth-google
- Supabase allowed redirects: https://supabase.com/docs/guides/auth/redirect-urls
- Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security

Keep the code, any site-domain authentication configuration, the Supabase project, and the private Gemini API key separated. Your Google AI Studio API key cannot substitute for OAuth credentials.
