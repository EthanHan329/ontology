# Ontology Field Guide

An independent, primary-source-backed learning experience for Palantir's Ontology. Includes a responsive HTML demo, interactive object graph, disruption simulator, action-policy demonstration, architecture notes, knowledge checks, and Markdown study material.

## Open

Open [dist/index.html](dist/index.html) directly in your browser. Everything runs offline: no installation, hosting, account, or internet connection is required.

An optional local HTTP server is also available:

```bash
python3 -m http.server 8765 --directory dist
```

## Study

- [Study guide](dist/docs/STUDY_GUIDE.md)
- [Research and source map](dist/docs/RESEARCH.md)
- [Five-minute demo script](dist/docs/DEMO_SCRIPT.md)
- [Implementation and verification](dist/docs/IMPLEMENTATION.md)

Research reviewed 21 October 2026. All demo entities, policies, and numbers are fictional. No Palantir connection or live AI is required.

## Local-only policy

Do not publish, deploy, upload source to a hosting service, or create a hosted copy. Research citations are optional outbound links; they are never loaded automatically. Fonts and application assets are local.

## Offline checks

With Node.js and Python already installed, run `npm test`. No `npm install` is needed; the DOM test library and its license notices are included under `tests/vendor/`.
