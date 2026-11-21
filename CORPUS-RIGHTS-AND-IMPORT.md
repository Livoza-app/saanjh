# Gita knowledge base: source and permitted development use

Source: Hansi Gita Bhawan Trust, https://gitabhawan.org.in/gita/research
Full 700-verse JSON: https://gitabhawan.org.in/data/gita-corpus.json
Checked on 18 November 2026.

The original Sanskrit scripture is public domain. The site's English and Hindi translations are **the Trust's original copyrighted works**. The research page states they may be quoted, taught from and built on freely with attribution to Hansi Gita Bhawan Trust and a link to their research page. Because this may become a paid app and full-text redistribution is not expressly specified, clarify those specific commercial rights before deployment. Do not remove attribution.

## Import

On a computer with internet and Node 22 or higher:

`npm run import:gita`

Or save the official JSON and use:

`npm run import:gita -- --file ./gita-corpus.json`

The importer validates 700 distinct references and all 18 chapter counts. It outputs:

- `data/gita-sanskrit-700.json`: full 700-verse public-domain original Sanskrit + metadata (safe to commit with attribution).
- `data/gita-research-translations-private.json`: internal 700-verse copyrighted translations for research; ignored by Git.
- `data/selected-source-text.json`: the 50 curated verses + same-chapter context for the existing demonstration AI path; ignored by Git.

**Limits:** This import does not activate a full 700-verse RAG system. Current tests still use 50 editorially curated verse topics. Live OpenAI API testing and improvements to retrieval accuracy are pending. Do not upload sensitive child data to the prototype or deploy it publicly.
