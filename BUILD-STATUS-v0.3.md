# Saanjh v0.3 — New Chat & Conversation Continuity

- Built from the earlier v0.2 Gemini accuracy-upgrade project.
- Added explicit **New chat** and **Previous conversations** navigation, scoped to child and faith.
- Existing chats migrate from the prior localStorage format without overwriting source history.
- New chats send at most five excerpts of previous **parent-authored** reports and four previously suggested actions, all limited to the same child and faith; prior suggestions are not claims of what was tried.
- Child-level history deletion and single-conversation deletion supported in local browser storage.
- No changes to user API key handling, spending limits, payment processing, or public hosting.
- 25 automated tests pass, including three new tests for new chat, migration, and memory-payload isolation.
- Gemini live call was not repeated here because the user's private API key is not available in this environment.
- This is a local private test prototype; keep using fictional family details.
