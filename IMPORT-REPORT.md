# Uploaded Bhagavad Gita import report

- Imported dataset: `gita-corpus.json` (user-supplied; Hansi Gita Bhawan Trust attribution).
- Original source (according to file metadata): https://gitabhawan.org.in/gita/research
- Source file SHA-256: `d95a8a26af966374a637c86c22849cb0335702a5158357f01e9b4aa7f4a01183`
- Total records: **700 verses**, **18 chapters**, **40 lexical terms**.
- Chapter counts: 1: 47, 2: 72, 3: 43, 4: 42, 5: 29, 6: 47, 7: 30, 8: 28, 9: 34, 10: 42, 11: 55, 12: 20, 13: 34, 14: 27, 15: 20, 16: 24, 17: 28, 18: 78.
- Speaker distribution: dhritarashtra: 1, sanjaya: 40, arjuna: 85, krishna: 574.
- Validated: nonempty Sanskrit, IAST, English, Hindi, and source URL for every reference; no duplicate or missing expected references; direct `2.47` lookup and adjacent verse context.
- **Not** independently validated: philological accuracy of each Sanskrit transcription, fidelity of every English/Hindi translation, or correct AI mapping to individual family problems.
- Offline research browser: `gita-library-open-me.html`. Current conversation demo remains explicitly a **rules simulation**; no paid AI call was made.
- Translation rights: original Sanskrit is public domain; Trust translations are copyrighted and attribution is required. Confirm specific commercial reuse/full redistribution permission before deployment.
- Basic automated tests: **11/11 passing**. Original editorial example retrieval evaluation remains **21/30 expected references in top five**; not expert ground truth.
