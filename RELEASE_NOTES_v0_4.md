# Saanjh v0.4 — Scripture-first guidance

## Changes
- Exact Gita Sanskrit and Hansi Gita Bhawan Trust's attributed English/Hindi translations are returned by the local server from source records, never written by Gemini.
- Scripture source, ordinary-language meaning, relevance to the parent's circumstances, and suggestions are separated into clear cards.
- A new English/हिन्दी selector controls Gemini's response language. Gita's original source and both translations are available regardless of selection.
- The **Another approach** button now initiates a request immediately and includes the prior suggestions that need to be avoided, rather than just filling the chat input.
- Follow-up prompts distinguish suggestions from parent-reported trials, avoid sweeping 'stop all homework' advice, and reject incomplete model output or unsupported citations.
- Existing saved conversations are retained under the same `localStorage` key; legacy source information can be hydrated when the local server is running.
- The Bible pilot uses only sourced public-domain English passages. A verified Hindi Bible translation has **not** been added.

## What was checked
Automated code tests cover retrieval, structure, source fidelity, alternative-request payloads, initial HTML response and a mocked Gemini API. These do **not** assess accuracy of live Gemini advice. A separate blind evaluation and user testing are still required.

## Limitations
This is a localhost-only research prototype. There is no proper authentication, secure cloud family storage, provider-data deletion, production abuse controls, checkout or public publishing. Translation permissions must be checked before commercial deployment.
