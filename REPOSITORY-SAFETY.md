# Repository safety

This repository is a source snapshot of the Saanjh research prototype.

- The browser preview uses the existing mock responses in preview/index.html.
- Gemini remains server-side. No API key is required by the static preview.
- Local environment files, cloud configuration, private browser state, cached embeddings, private source-import outputs and third-party translation imports are excluded by .gitignore.
- The included QA prompts and playbooks are synthetic development fixtures. They are not customer records.
- Do not add .env, cloud-config.json, browser exports or real family information to this repository.
