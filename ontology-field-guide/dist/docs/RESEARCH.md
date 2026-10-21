# Research notebook and evidence map

Reviewed 21 October 2026. Scope: Palantir's public Foundry documentation, applied throughout this guide to a fictional agentic everyday banking model. This is a documentation synthesis, not a banking product assessment, independent performance benchmark or hands-on validation inside a Foundry enrollment.

## Method

Search primary documentation, compare concept pages with operational reference pages, distinguish general concepts from version-specific behavior, and attach a source close to factual explanations. Translate the concepts into an original, transparent scenario with explicit assumptions. The included HTML implements that teaching scenario rather than reproducing Palantir internals.

A source's web crawl date does not establish when a feature became available. Public documentation changes. Check your enrollment, backend, SDK version, and administrator configuration before implementation.

## Evidence map

| ID | Source | What it supports | How to use it |
| --- | --- | --- | --- |
| S01 | [Ontology overview](https://www.palantir.com/docs/foundry/ontology/overview) | Operational layer, semantic and kinetic elements, application integration | Start here for the platform framing |
| S02 | [Core concepts](https://www.palantir.com/docs/foundry/ontology/core-concepts) | Types, objects, properties, and relationships | Establish vocabulary |
| S03 | [Object types](https://www.palantir.com/docs/foundry/object-link-types/object-types-overview) | Entity and event modeling | Reference the concrete schema building block |
| S04 | [Link types](https://www.palantir.com/docs/foundry/object-link-types/link-types-overview) | Bidirectional traversal, relationship schema, backing data | Design navigation and cardinalities |
| S05 | [Action types](https://www.palantir.com/docs/foundry/action-types/overview) | Reusable definition of changes and side effects | Separate action type from execution |
| S06 | [Submission criteria](https://www.palantir.com/docs/foundry/action-types/submission-criteria) | Rules controlling submission | Plan validations and authorization |
| S07 | [Rules](https://www.palantir.com/docs/foundry/action-types/rules) | Mapping parameters to Ontology edits and effects | Specify the operation |
| S08 | [Functions on objects](https://www.palantir.com/docs/foundry/functions/functions-on-objects) | Logic consuming object data | Connect calculations to operational context |
| S09 | [Object sets, TSv1](https://www.palantir.com/docs/foundry/functions/api-object-sets) | Filtering, traversal, aggregations | Learn concepts; verify syntax for your version |
| S10 | [Interfaces](https://www.palantir.com/docs/foundry/interfaces/interface-overview) | Abstract contracts and support matrix | Check availability before implementation |
| S11 | [How edits are applied](https://www.palantir.com/docs/foundry/object-edits/how-edits-applied) | Source/user-edit interaction, indexing and persistence | Investigate effective state and reconciliation |
| S12 | [Consistency and isolation](https://www.palantir.com/docs/foundry/action-types/consistency-guarantees) | Atomicity boundary, write modes, concurrency | Avoid promises of a distributed transaction |
| S13 | [Explore action types](https://www.palantir.com/docs/foundry/action-types/explore-action-types) | External webhook timing and failure behavior | Plan integration acknowledgments |
| S14 | [Object and property policies](https://www.palantir.com/docs/foundry/object-permissioning/object-security-policies) | Granular read visibility | Separate object and property access |
| S15 | [Access-control propagation](https://www.palantir.com/docs/foundry/security/access-control-propagation) | Mandatory-control propagation versus read filtering | Design downstream data handling |
| S16 | [Developer toolchain](https://www.palantir.com/docs/foundry/dev-toolchain) | Generated OSDKs, actions, functions, application access | Build against generated documentation |
| S17 | [AIP Logic](https://www.palantir.com/docs/foundry/logic) | LLM-powered operational functions and review choices | Ground AI in governed capabilities |
| S18 | [Models](https://www.palantir.com/docs/foundry/model-integration/models) | Model artifacts and operationalization | Distinguish prediction from execution |
| S19 | [Indexing restrictions](https://www.palantir.com/docs/foundry/object-indexing/data-restrictions) | OSv2 key uniqueness and schema constraints | Validate data quality assumptions |
| S20 | [Action test runs](https://www.palantir.com/docs/foundry/action-types/test-run) | External calls that may execute in tests | Plan safe platform validation |
| S21 | [Ontology system](https://www.palantir.com/docs/foundry/architecture-center/ontology-system) | Architecture context | Extend the conceptual map |

## Important findings

1. A shared model spans operational meaning and executable changes (S01, S05).
2. Stable identity, source quality, and explicit relationships remain essential engineering work (S02, S04, S19).
3. Read visibility and action authority must be designed separately (S06, S14).
4. Committed Ontology edits and external-system effects have different failure boundaries (S12, S13).
5. AIP can consume operational context and tools; choosing review and execution policies remains part of workflow design (S17).
6. Version differences matter, especially for interface support, storage behavior, query APIs, and action isolation (S09–S12).

## Interpretation versus vendor fact

The sixteen-type banking schema, integer-cent buffer calculation, exact-consent policy, payment lifecycle, access matrix, reliability recommendations, study schedule, comparison table and assessment rubric are original teaching material. They illustrate consequences of the documented primitives. They are not claims about automatic platform behavior, banking compliance or real customer outcomes.

## Banking claim-to-evidence map

| Teaching claim | Platform foundation | Original application design / limit |
| --- | --- | --- |
| Account is a type; ACC-101 is an instance | S02, S03 | Names, fields and identifiers are fictional. |
| AccountOwnership carries relationship rights | S03, S04 | The relationship object and rights policy are our modeling choice. |
| A function computes remaining funds | S08, S09 | USD 1,600 − 115 − 900 = 585 is the demo's deterministic rule. |
| An action has submission checks and effects | S05–S07 | Exact bill amount, customer approval and the USD 500 buffer are our policy. |
| Read access differs from payment authority | S06, S14 | No real authentication or signing-rights enforcement is implemented. |
| A queued instruction differs from settlement | S12, S13 | Instruction, reservation, bill and transaction states are illustrative; no bank is connected. |
| An agent uses scoped objects and tools | S16, S17 | Banking tool names are candidate contracts, not built-in SDK methods. |
| Downstream data needs deliberate protection | S14, S15 | Production log, export and model-context controls are outside this simulator. |

Every HTML chapter, quiz, study exercise and presentation uses this same banking example. The initial graph is simplified, while the explorer exposes all sixteen candidate types. Balance summary, savings transfer and card-freeze journeys are conceptual; bill payment alone has executable local simulation.

The application demonstrates no real Palantir integration, identity enforcement, object indexing, model inference, persistence, distributed transaction, or AI execution. The labels identify these boundaries throughout the interface.

## Further research with an actual enrollment

- Build the schema and inspect source-to-object mapping.
- Generate an OSDK for selected types and action definitions.
- Verify instance/property access with separate test identities.
- Measure indexing freshness and inspect real edit/source conflict behavior.
- Test action isolation with concurrent submissions and relevant invariants.
- Exercise external acknowledgments, retries, and reconciliation in a dedicated environment.
- Evaluate a grounded AI workflow against incomplete, adversarial, and permission-filtered inputs.

No claims about latency, throughput, deployment pricing, customer ROI, or product superiority are established by this research.
