# Ontology Field Guide: agentic everyday banking

An offline, independent study of Palantir Ontology through one consistent banking model. Every HTML chapter and Markdown guide uses the same customer, accounts, electricity bill, payee, proposal, consent and payment lifecycle.

## Open locally

Open [dist/index.html](dist/index.html) directly. No build, installation, hosting, account or internet connection is required.

### Interactive banking lab

Open [dist/demo.html](dist/demo.html) for the hands-on mobile banking experience. Sign in as Alex, chat with the scripted assistant, and inspect the business objects beside the conversation. Its in-memory session is independent of the chapter payment workflow.

- Transfer $150 from checking to savings, approve the exact proposal, then simulate settlement or definitive failure.
- Propose a transfer, simulate a $100 card spend, and confirm to see stale-state rejection. Revoke signing rights to see why read access is not payment authority.
- Check a $50,000 portfolio, inspect holdings and versioned quotes, simulate a price change, then refresh the calculation.
- Compare the ontology with context, an agent, and ordinary tool calls. The comparison explains that conventional services can enforce the same safeguards; ontology makes business meaning and contracts explicit and reusable.
- Inspect actual local simulator inputs and results in the execution trace. This is deterministic application logic, not a live language model or bank API.

Supported chat examples: `Transfer $100 to savings`, `What can I safely transfer?`, `Check my portfolio`, and `Show another customer's portfolio` (access denied). Other requests return guidance without executing an action. Reset or reload restores all fixtures.

The seven chapters cover:

1. Everyday banking: sixteen object types and four customer journeys.
2. The mental model: semantics, kinetics and governance.
3. Banking objects: searchable schema and instance explorer.
4. Payment lifecycle: exact proposal, approval, current-state validation, reservation, settlement and failure.
5. Banking architecture: source ownership, permissions and external execution boundaries.
6. Test your understanding: eight questions and a seven-session study path.
7. Research & evidence: twenty-one optional primary-source references.

All chapters share one in-memory payment scenario. The default calculation preserves USD 585 after the USD 115 bill and USD 900 rent, satisfying a USD 500 buffer. A competing-spend control demonstrates stale-balance rejection.

## Study and present

- [Ontology engineering handbook: design, build, use and operate](dist/docs/ONTOLOGY_ENGINEERING_HANDBOOK.md) — a self-contained implementation reference with Foundry procedures, schema and action contracts, best practices, local SQL examples, tests and runbooks.
- [Complete banking Ontology study guide](dist/docs/STUDY_GUIDE.md)
- [Banking objects, customer journeys and worked example](dist/docs/AGENTIC_BANKING.md)
- [Five-minute banking presentation](dist/docs/DEMO_SCRIPT.md)
- [Research and banking evidence map](dist/docs/RESEARCH.md)
- [Implementation, checks and limitations](dist/docs/IMPLEMENTATION.md)

The banking schema and policies are fictional application design. There is no live AI, bank connection, production authorization, ledger or payment processing. Navigation preserves state; reset or refresh starts over.

## Offline checks

With Node.js and Python installed, run:

~~~bash
npm test
~~~

No npm install is required. Test dependencies and license notices are included locally under tests/vendor/. The suite checks the banking calculation, seven chapter DOMs, shared workflow state, exact consent, failure paths, quiz, documentation, interactive lab and offline assets. The lab was also exercised directly from local files in installed Chrome at 390, 820, 1440 and 1920px, with phone and desktop captures under both OS color preferences. It intentionally retains the guide's light theme. Lighthouse and screen-reader audits were not run; no scores or conformance claims are implied.

## Local-only policy

Do not publish, deploy, upload source, or create a hosted copy. Runtime assets are local and network connections are blocked by the Content Security Policy. Optional research citations load only when explicitly followed. No hosting action is part of this update.

An optional localhost server can be started with:

~~~bash
python3 -m http.server 8765 --directory dist
~~~
