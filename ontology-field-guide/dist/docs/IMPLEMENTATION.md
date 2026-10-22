# Implementation and verification: agentic everyday banking

## Local files

- index.html: offline application shell, seven numbered banking chapters and accessibility landmarks.
- style.css: existing responsive editorial layout, graph, tables, forms and feedback components.
- model.js: shared integer-cent parsing, buffer calculation and payment-policy validation.
- banking.js: sixteen candidate types, typed property schemas, four customer journeys, object explorer, shared payment workflow and local event trail.
- app.js: mental model, schema/instance explorer, architecture, eight banking questions, study path and twenty-one source references.
- docs/: this document, the complete banking study guide, focused walkthrough, presentation script, research evidence map and [Ontology engineering handbook](ONTOLOGY_ENGINEERING_HANDBOOK.md).
- ../../tests/: pure policy tests, complete application DOM checks, payment-lifecycle checks and offline artifact checks.
- ../../DESIGN.md: extracted visual contract and shared-state behavior.

There is no build step or runtime dependency. The bundled test DOM implementation and licenses are local. No installation or external font is needed.

## Open offline

Open dist/index.html directly. An optional localhost server is available from the project directory:

~~~bash
python3 -m http.server 8765 --directory dist
~~~

The default chapter is Everyday banking. Other routes are The mental model, Banking objects, Payment lifecycle, Banking architecture, Test your understanding, and Research & evidence. Each teaches the same fictional scenario; no alternate legacy domain remains in the learning content.

## One model, shared across chapters

BankingDemo owns the in-memory customer scenario. The opening page and payment lifecycle page render the same workbench and bind the same handlers. Overview and explorer render the same graph and inspector, reading that shared state.

The explorer's schema mode describes identity, typed fields and backing-source names. Instance mode describes fictional examples. Search covers all sixteen types, not only the six shown in the graph. AccountOwnership is represented by a direct ownership edge only as graph shorthand.

Initial snapshot descriptions are observations. Live Account, Bill and PaymentInstruction fields show the current simulation. Navigation preserves proposal, approval, instruction, reservation and outcome. Reset clears the banking workflow; refreshing starts a new session. Quiz state also persists across chapter navigation until restart or refresh.

## Calculation and lifecycle

All monetary calculations use integer cents. Initial available funds are USD 1,600, the exact bill is USD 115, known rent is USD 900 and the required buffer is USD 500. The baseline remaining amount is USD 585.

The pure policy rejects invalid amounts, noninteger or missing balance observations, the wrong bill amount, read-only authority, paid bills and buffer breaches.

Changing amount or authority invalidates proposal and consent. The competing-spend control reduces current available funds by USD 100 once. Submission rechecks current policy even after approval, so stale evidence cannot pass this local demonstration.

On valid submit:
1. Create one queued instruction with a proposal-derived idempotency key.
2. Reserve USD 115 once.
3. Keep the bill unpaid and show no posted transaction.

Simulated settlement replaces the reservation with a posted debit and marks the bill paid. It does not deduct available funds again. Definitive simulated failure releases the reservation and requires a new proposal and consent for retry. Duplicate submit and repeated settlement are blocked.

IDs, clock timestamps, deduplication and audit events are illustrative and local. There is no durable idempotency service, authentication, consent expiry enforcement, external ledger or payment processor. Unknown outcomes, reversals and partial settlements are discussed in the guides but not implemented as simulator states.

## Automated verification

Run from the project directory with Node.js and Python already installed:

~~~bash
npm test
~~~

The suite performs:
- Syntax checks on all application JavaScript.
- Nine pure banking-model tests covering exact decimal parsing, unsafe input, baseline calculation, equality at the buffer boundary, stale funds, role authority, exact amount, paid bills and invalid observations.
- All seven rendered DOM chapters, numbered navigation, banking-only content, sixteen searchable types, schema properties, empty search, keyboard graph activation and invalid-route fallback.
- Cross-chapter proposal, queue, settlement and reset consistency.
- Eight quiz answers, answer persistence, restart and twenty-one references.
- Exact consent invalidation, role denial, current-balance rejection, duplicate protection, single reservation/debit, definitive failure, retry and reset.
- Local asset and Markdown references, document set, prohibited legacy-domain content, credential exclusion and offline runtime restrictions.
- The handbook's executable SQLite reference: baseline eligibility, customer-scope mismatch, latest observation and stale-balance rejection.

The application harness uses the bundled linkedom implementation. These are DOM behavior checks, not screenshot or browser-layout evidence.

## Browser verification limits

The available browser integration has no connected automation session. Native Computer Use was also attempted and reported that permissions are not granted. No new browser tooling was installed and no permissions were changed.

Real-browser rendering, mobile/tablet/desktop screenshots and Lighthouse measurements remain unverified. Responsive CSS and semantic markup are present, but automated DOM checks cannot prove visual fidelity.

## Offline and hosting policy

The HTML Content Security Policy blocks network connections and external assets. No fetch, XMLHttpRequest, WebSocket, analytics, CDN imports, remote fonts, external scripts or deployment configuration are included. Research links are optional user-initiated navigation.

Do not publish, deploy, create a hosted Site, or upload source. All changes described here are local.

A hosted copy was created before the local-only requirement. Removing local configuration does not delete that remote copy. Available Sites tools cannot unpublish or delete it; removal requires Sites management or OpenAI support. It has not been updated with these banking changes.

## Extension path

Extend the same model with joint signing, consent expiry, savings transfers, card-service requests, unknown-outcome reconciliation or reversals. A real integration must identify authoritative services and enforce policy there. Validate generated OSDK contracts and action configuration against the intended enrollment and versions; keep secrets and enforcement out of browser code.
