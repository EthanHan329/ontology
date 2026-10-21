# Implementation and verification

## Files

- `index.html`: application shell, navigation, and accessibility landmarks.
- `style.css`: responsive editorial layout and graph presentation.
- `model.js`: pure allocation calculation and submission-policy validation.
- `app.js`: six chapters, graph interaction, filtering, workbench, quiz, and references.
- `docs/`: study guide, evidence map, presentation script, and this document.
- `../../tests/model.test.cjs`: meaningful checks for the decision policy and its boundaries.

No build step or runtime dependency is required. All interactions run in the browser. Google Fonts are optional network resources; local sans-serif and monospace fallbacks work offline. No analytics, credentials, live AI, or Palantir API calls are included.

## Run locally

From the project directory:

```bash
python3 -m http.server 8765 --directory dist
```

Visit `http://localhost:8765`. Opening `dist/index.html` directly also works. Markdown links open as source documents; use a Markdown reader for formatted study.

Only the QA tests use the development dependency `linkedom` (0.18.14); serving the app requires no installation.

## State and calculation

The application stores its simulation in memory. Navigation preserves an applied plan; reset or refresh starts over. Applying twice is blocked. Following a successful apply, delay, quantity, and reason controls are locked until reset.

Only complete late orders consume simulated protective stock, in due-date order. An oversized order is skipped if it cannot be fully covered; a later smaller order can still fit. Selected quantity is removed from alternate inventory even if not all selected units protect late orders. This is a deliberate simplification highlighted in the UI and study guide.

The role selector demonstrates a policy boundary but is not authentication. A production system must enforce authorization and validation on trusted services. No durable data, external integration, or real transaction is implemented.

## Verification

Run:

```bash
npm install --ignore-scripts
node --check dist/app.js
node --check dist/model.js
node --test tests/model.test.cjs
node tests/app.test.cjs
python3 tests/check_artifacts.py
```

The model tests cover due-date equality, the default and severe-disruption scenarios, whole-order allocations, transport cost, role denial, stock bounds, reason validation, and replay rejection. The application smoke check uses a linkedom DOM harness to execute all six chapters and exercise graph controls, search, apply/reject/reset, navigation, and quizzes; it is not a real-browser layout test. Artifact checks confirm local asset/document references and JavaScript source parsing.

Native browser inspection was attempted, but the available computer-use runtime reported that no browser is available. Responsive CSS and markup were reviewed statically; screenshot-level visual QA and real-browser interaction checks remain unverified in this environment.

## Deployment

The static `dist` directory is deployable without a server backend. `.openai/hosting.json` records the Sites identity. The source workflow packages and synchronizes source before private deployment. Source credentials are runtime inputs and must never be placed in application files or documentation.

## Extension ideas

Implement order-line granularity, partial allocations, alternate route lead time, a multi-variable optimizer, source freshness indicators, and reconciliation states. If integrating with Foundry, replace the local model with generated OSDK types and verified action definitions; keep credentials and policy enforcement out of browser code.
