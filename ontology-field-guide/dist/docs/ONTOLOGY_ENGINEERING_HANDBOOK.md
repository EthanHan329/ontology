# Ontology engineering handbook: design, build, use and operate

**Practical reference using agentic everyday banking. Platform documentation checked 22 October 2026.**

This handbook explains the decisions and procedures needed to implement an operational ontology. It includes design rules, schema contracts, source mapping, Foundry configuration, query and action contracts, agent integration, failure handling, testing, migration and operations. The explanations stand on their own; links provide optional verification rather than substituting for the content.

Three kinds of material are distinguished throughout:

- **Platform behavior:** documented Palantir Foundry capabilities, with a nearby primary-source citation. Availability depends on the enrollment, object storage backend, SDK and function language/version.
- **Recommended design:** engineering practices proposed here. They are not automatic platform guarantees or universal product requirements.
- **Banking example:** fictional identities, amounts and policies. This is an application design, not a prescribed banking schema or a production payment system.

The handbook is stored locally and can be read offline. Its Foundry instructions describe work in an appropriately authorized Foundry environment; they do not make the local HTML demo a Foundry deployment. No such setup, publication or connection is performed by this document. SQL examples near the end run locally using SQLite and illustrate data preparation, not Foundry API syntax.

## Contents

1. [Define the operating contract](#1-define-the-operating-contract)
2. [Choose the right modeling primitives](#2-choose-the-right-modeling-primitives)
3. [Write an implementable schema](#3-write-an-implementable-schema)
4. [Design properties, identities and time](#4-design-properties-identities-and-time)
5. [Specify relationships and cardinalities](#5-specify-relationships-and-cardinalities)
6. [Prepare trustworthy source data](#6-prepare-trustworthy-source-data)
7. [Assign ownership and edit semantics](#7-assign-ownership-and-edit-semantics)
8. [Create types and links in Foundry](#8-create-types-and-links-in-foundry)
9. [Make query contracts explicit](#9-make-query-contracts-explicit)
10. [Implement deterministic functions](#10-implement-deterministic-functions)
11. [Define business actions](#11-define-business-actions)
12. [Protect concurrent invariants](#12-protect-concurrent-invariants)
13. [Bind consent to exact intent](#13-bind-consent-to-exact-intent)
14. [Integrate external effects safely](#14-integrate-external-effects-safely)
15. [Enforce access and information boundaries](#15-enforce-access-and-information-boundaries)
16. [Use the ontology from applications](#16-use-the-ontology-from-applications)
17. [Expose narrow tools to agents](#17-expose-narrow-tools-to-agents)
18. [Version and migrate the model](#18-version-and-migrate-the-model)
19. [Observe the complete lifecycle](#19-observe-the-complete-lifecycle)
20. [Test properties and failure paths](#20-test-properties-and-failure-paths)
21. [Control performance and scale](#21-control-performance-and-scale)
22. [Operate and recover](#22-operate-and-recover)
23. [Run a local data-and-query reference](#23-run-a-local-data-and-query-reference)
24. [Use reviewable specification templates](#24-use-reviewable-specification-templates)
25. [Recognize common failure patterns](#25-recognize-common-failure-patterns)
26. [Build in acceptance-gated stages](#26-build-in-acceptance-gated-stages)
27. [Primary-source reference register](#27-primary-source-reference-register)

## 1. Define the operating contract

Start with a decision or operation, not a list of source tables. A useful first implementation answers one consequential question and closes the feedback loop after an action.

Prefer extending a reviewed canonical model over creating team-specific copies. Palantir's design guidance emphasizes domain meaning, focused types, curated properties, reusable abstractions and validation against actual tasks. Apply these principles with explicit trade-offs rather than making a perfect enterprise-wide model a prerequisite for the first useful workflow. [Ontology design best practices](https://www.palantir.com/docs/foundry/ontology/ontology-best-practices)

For the running example:

> An authorized customer asks an assistant to pay a specific electricity bill, preserve known rent commitments, and retain a USD 500 buffer.

Write a one-page operating contract before creating resources:

| Question | Example answer |
| --- | --- |
| Who requests the operation? | Customer CUS-001, mapped from a trusted authenticated actor. |
| What must the application discover? | Effective account rights, unpaid bill, verified destination, current funds and commitments. |
| What decision is computed? | Whether the exact payment satisfies the customer's constraints. |
| What can change? | Proposal, consent, instruction and reconciled payment state. |
| What is out of scope? | New payees, currency conversion, credit, automatic use of savings, partial payments. |
| What proves completion? | An authoritative settlement result correlated to the instruction. |
| Who owns failures? | A named workflow owner and an integration operations owner. |

Define invariants as statements that remain true across every permitted execution:

1. A caller cannot act for a customer merely by supplying their identifier.
2. The submitted amount, currency, source account, destination and bill equal the approved intent.
3. A payment cannot violate the configured spending constraint when authoritative execution evaluates it.
4. Repeated delivery of the same command cannot create a second economic operation.
5. Unknown outcomes do not become confirmed failures without evidence.
6. A bill is not marked paid merely because a request was accepted.
7. Sensitive source information does not enter a less protected output accidentally.

These are application requirements. Each needs an enforcement location, test and owner. “The Ontology handles it” is not an implementation answer.

Define completion in business terms, for example “the customer sees the confirmed result and can inspect its source reference,” rather than “the button returned success.”

## 2. Choose the right modeling primitives

An operational ontology combines business identity, connected data, logic and permitted changes. In Foundry, this is not the same task as authoring an RDF/OWL vocabulary or configuring an automatic logical reasoner. Do not assume OWL inference, database triggers or service execution occurs because two concepts are linked.

Use these selection rules:

| Primitive | Choose it when | Banking example |
| --- | --- | --- |
| Object type | Instances have meaningful identity, lifecycle, permissions or relationships. | Account, Bill, PaymentInstruction. |
| Property | A value describes one object's state or identity. | Account.currency, Bill.amountMinor. |
| Link type | A meaningful relationship should be traversable. | Bill issued by Payee. |
| Relationship object | A relationship itself has attributes, lifecycle or authorization. | AccountOwnership with signing rights. |
| Observation/event object | Time and provenance distinguish records. | BalanceSnapshot, AuditEvent. |
| Object set | A query selects a collection. | Authorized unpaid bills due within a window. |
| Function | Reusable computation consumes permitted context. | Calculate buffer headroom. |
| Action type | A governed business operation submits changes or effects. | ApproveProposal, SubmitPayment. |
| Interface | Several concrete types need a genuine shared contract. | CustomerRequest in an extended model. |

The platform distinguishes type definitions, individual objects and configured relationships. Those concepts supply the model; your schema supplies its domain meaning. [Core concepts](https://www.palantir.com/docs/foundry/ontology/core-concepts)

An object is not required for every noun. Currency may be a constrained property rather than an object. A status is usually an enum, unless a separately managed resource is genuinely needed. Conversely, compressing a payment attempt into Bill.status loses correlation, retries and unknown outcomes.

Use an interface only after identifying real shared behavior. Do not force unrelated request types into a contract with many optional properties. An interface is abstract; implementing types supply instances. Confirm the selected applications and language bindings support the required features. [Interfaces](https://www.palantir.com/docs/foundry/interfaces/interface-overview)

## 3. Write an implementable schema

For every type, specify its grain: what exactly makes two records the same object? Then define identity, important fields, source owner and lifecycle. This table is a recommended blueprint, not an import format.

| Type | Grain and example identity | Minimum useful fields beyond identity | Principal links |
| --- | --- | --- | --- |
| Customer | One recognized customer; CUS-001 | displayName, status, identityMappingReference | ownerships, tasks, goals |
| Account | One account; ACC-101 | currency, productType, status, sourceSystem | ownerships, balanceObservations, instructions |
| AccountOwnership | One rights grant/effective period; OWN-001 | customerId, accountId, role, paymentAllowed, validFrom, validTo | customer, account |
| BalanceSnapshot | One account observation/version; BAL-101 | accountId, currency, ledgerMinor, heldMinor, availableMinor, observedAt, sourceVersion | account |
| Transaction | One authoritative posting; TXN-901 | accountId, amountMinor, currency, postedAt, externalReference, instructionId when known | account, instruction, merchant when known |
| Card | One instrument identity; CARD-401 | accountId, maskedLabel, status, processorReference | account, relatedTransactions |
| Merchant | One canonical merchant; MER-008 | name, category, normalizationVersion | transactions |
| Payee | One destination identity/version; PAY-201 | displayName, maskedDestination, destinationVersion, verificationStatus | bills, instructions |
| Bill | One payable obligation; BILL-301 | customerId, payeeId, amountMinor, currency, dueDate, status, sourceVersion | customer, payee, attempts |
| RecurringCommitment | One commitment schedule/version; COM-501 | customerId, accountId, amountMinor, currency, nextDue, certainty, reservationReference | customer, account |
| SavingsGoal | One preference/scope; GOAL-601 | customerId, scopeAccountId, targetMinor, currency, effectiveAt | customer, scopedAccount |
| AgentTask | One customer request execution; TASK-701 | customerId, request, scope, requestingActorId, executionIdentity, status | proposals, evidence |
| ActionProposal | One immutable proposed intent/version; PROP-001 | taskId, billId, accountId, payeeId, destinationVersion, amountMinor, currency, evidenceReference, expiresAt | task, bill, account, consent |
| Consent | One approval or revocation event; CONS-001 | proposalId, proposalVersion, intentDigest, actorId, recordedAt, expiresAt, status | proposal, actor mapping |
| PaymentInstruction | One command identity; PI-001 | proposalId, commandKey, payloadDigest, externalReference, status, statusVersion, lastCheckedAt | bill, account, payee, resultingPostings |
| AuditEvent | One recorded observation/decision event; EVT-001 | actorId, eventTime, eventType, correlationId, outcome, policyVersion | task, proposal, instruction |

The local demo's field names are simplified. This blueprint introduces additional fields for an implementable service design; it does not claim those fields are already enforced by the demo.

Separate canonical types from views. “Alex's spending this week” is usually a query or projection over existing objects, not a second Account type. “PendingPayment” may be an instruction state rather than a duplicate instruction type.

Keep command, observation and business outcome separate:

~~~text
Customer request -> AgentTask -> ActionProposal -> Consent
                                      |
                                      v
                              PaymentInstruction
                                      |
                         authoritative execution
                                      |
                                      v
                         Transaction + reconciled Bill
~~~

## 4. Design properties, identities and time

### Identity rules

- Prefer stable business/source identifiers scoped by source system when necessary.
- Do not regenerate IDs during pipeline rebuilds. A changed ID means a different object and can orphan edits, links and references.
- Keep a source-to-canonical mapping when merging customer or merchant identities.
- Distinguish a type's display name, programmatic API name, resource identifier and each object's primary key.
- Use readable titles for humans, while preserving opaque identifiers for identity.
- Do not use names, email addresses or masked card labels as primary keys.
- For compound identity, use a specified collision-resistant encoding or a stable assigned key with uniqueness constraints. Naive concatenation can collide.

For example, an observation key can be based on sourceSystem, accountId and sourceSequence. Do not use only observedAt if the source can emit several records at the same timestamp.

### Property contract

For each property record: meaning, base type, unit, allowed values, nullability, sensitivity, source, freshness, edit owner and derivation. “amount: number” is insufficient.

Recommended example:

~~~yaml
property: amountMinor
meaning: Exact instructed amount expressed in the currency's minor unit
storage: Integer with explicitly checked range
unitCompanion: currency
nullable: false
validation: Positive; precision follows the chosen currency representation
owner: Proposal service before submission; immutable on accepted instruction
display: Derived formatting only; never parse formatted display text to execute
~~~

This YAML is a human-readable specification, not a supported Foundry import schema.

USD uses two decimal places in this example. Do not generalize that to all currencies. If using integer minor units, maintain currency exponent metadata and range checks. If using decimals, specify scale, rounding and the exact representation across every boundary. Never use binary floating-point arithmetic for exact payment amounts.

Distinguish zero, absent, unknown and not applicable. A missing available balance is not zero and is not permission to continue. A hidden property is not evidence that its value is absent in the source.

### Time rules

Keep separate fields for business effective time, source observation time, platform ingestion time and workflow processing time when each matters. Store instants consistently, commonly UTC, and preserve the business timezone for local dates and cutoffs.

A bill due date is a date under a business calendar, not automatically midnight UTC. A consent expiry is an instant. A balance observation's timestamp must come from its source; an ingestion timestamp alone does not prove the source is fresh.

For snapshot data, specify whether newer versions supersede earlier ones and what happens with out-of-order records. Reject an older acknowledgment overwriting a newer terminal instruction status.

### Reuse without semantic confusion

Shared properties centralize property metadata across types; value types provide reusable domain validation around base data types. These solve different problems from an interface, which describes an implementing type's shared contract. [Types reference](https://www.palantir.com/docs/foundry/object-link-types/type-reference)

Consider a shared currency property only where its meaning truly agrees. Do not merge instructedAmount, postedAmount and predictedAmount merely because all are numeric. An embedded structured value is suitable when its parts have no independent identity or lifecycle; promote it to an object when references, history or permissions require that identity. Store derived summaries only with a declared owner and refresh rule; otherwise compute them from their authoritative inputs.

Value types can apply compatible constraints to properties and action parameters. Invalid property values can cause indexing failure; constraint changes therefore need compatibility review and clean data before adoption. Constraints validate representation, not account ownership or permission to pay. [Use value types](https://www.palantir.com/docs/foundry/object-link-types/use-value-type)

## 5. Specify relationships and cardinalities

Write link contracts in both directions:

| Relationship | Cardinality | Backing choice | Verification |
| --- | --- | --- | --- |
| Ownership -> Customer | Many to one | ownership.customerId to Customer primary key | Every grant resolves to exactly one customer. |
| Ownership -> Account | Many to one | ownership.accountId to Account primary key | Every grant resolves to exactly one account. |
| Snapshot -> Account | Many to one | snapshot.accountId | Observation currency agrees with account currency. |
| Bill -> Payee | Many to one | bill.payeeId | Destination exists; version is known. |
| Bill -> Customer | Many to one in this design | bill.customerId | Obligation is within customer scope. |
| Proposal -> Bill | Many to one | proposal.billId | The proposed bill still has the expected version. |
| Consent -> Proposal | Many to one | consent.proposalId | Approval binds the intended version and payload. |
| Instruction -> Posting | One to zero-or-many in a richer design | instruction reference on postings | Fees/reversals are represented explicitly. |

Use a foreign-key link for a singular reference, a join dataset for a true many-to-many relationship without extra business state, and a relationship object when the association carries business properties. Current Foundry link creation also supports object-backed relationship configuration; check consumer support before relying on its presentation. [Create a link type](https://www.palantir.com/docs/foundry/object-link-types/create-link-type)

AccountOwnership is more expressive than an unqualified Customer-Account join because role, signing rights and effective periods matter. A convenience shortcut may exist for navigation, but execution must use the qualified relationship.

Define how dangling references behave: reject the incoming record, quarantine it, or mark the relationship unresolved. Do not silently choose the first of several matches. For historical data, decide whether a link points to a stable entity or an exact versioned observation.

## 6. Prepare trustworthy source data

Use a repeatable sequence: ingest, normalize, identify, reconcile, validate, map, index, and verify under the intended identity.

### Source contract

Each feed needs an owner and an agreed contract covering:

- Schema and units; snapshot versus event semantics.
- Key and ordering guarantees; duplicates and late arrival.
- Business timestamp, source sequence and deletion representation.
- Expected coverage, refresh cadence and known omissions.
- Access controls and sensitive fields.
- Recovery/replay behavior and schema-change notification.

Do not mix a full replacement snapshot with an incremental feed using the same assumptions. Missing from a snapshot can mean deleted, filtered or incomplete; missing from an event batch normally means nothing happened.

### Transformation practices

Preserve raw provenance, create canonical keys, normalize timestamps and currencies, and deduplicate using a deterministic rule. If two records disagree without an authoritative ordering rule, quarantine rather than inventing a winner. Keep identity reconciliation separate from presentation formatting.

Create one well-defined row grain for each dataset-backed type. Derive AccountOwnership from account-rights records, not from the last successful transaction. Produce BalanceSnapshot records with actual source timestamps and versions.

### Minimum quality gates

| Gate | Required behavior |
| --- | --- |
| Primary key null/duplicate | Block or quarantine before indexing. |
| Foreign-key orphan | Reject, quarantine or explicitly mark unresolved. |
| Type/unit mismatch | Reject rather than coercing silently. |
| Impossible or unsafe amount | Reject and retain diagnostic context without exposing secrets. |
| Missing freshness | Make the query incomplete and block freshness-dependent action. |
| Regressing source version | Preserve the newer version and investigate. |
| Unexpected count change | Compare against a documented baseline; obtain owner review. |
| Conflicting active rights | Resolve according to the account-rights service, not dataset row order. |

Foundry indexing imposes key and property constraints, including primary-key uniqueness in OSv2. Pipeline-level gates make errors easier to diagnose before they become indexing failures. [Indexing restrictions](https://www.palantir.com/docs/foundry/object-indexing/data-restrictions)

Acceptance evidence should include a known sample object's complete path from source row to indexed properties and links, plus cases that are deliberately rejected.

## 7. Assign ownership and edit semantics

A modeled value needs one authoritative owner or an explicit reconciliation protocol. Avoid a browser, an action and a source refresh independently overwriting the same financial fact.

| Property family | Recommended authority | Application behavior |
| --- | --- | --- |
| Effective rights | Account-rights service | Read observations; recheck during execution. |
| Available funds, reservation, posting | Banking execution/ledger service | Do not expose arbitrary property setters. |
| Proposal rationale and task status | Workflow service | Mutate through scoped actions and version checks. |
| Approval and revocation | Trusted authorization workflow | Record exact scope, actor and time. |
| Instruction external status | Payment service plus reconciliation | Update only through verified result handling. |
| Display labels | Named master-data owner | Separate correction from transactional authority. |

Foundry resolves configured source updates and user edits into effective object state. Edit precedence and newer-value strategies have important consequences; a source refresh does not necessarily remove an older edit. Choose the appropriate supported behavior and test it. [How user edits are applied](https://www.palantir.com/docs/foundry/object-edits/how-edits-applied)

A useful design is to keep externally owned actuals separate from application-owned intent. For example, record requestedPaymentState on an instruction rather than editing authoritative account funds to make the UI look complete.

Define deletion deliberately. Customer closure is usually a lifecycle state with restricted access, not immediate destruction of every linked payment record. Retention and erasure requirements require a domain-specific policy; this handbook does not establish a jurisdiction's legal obligations. Decide how corrections, tombstones, merged identities and historical references are retained or redirected.

## 8. Create types and links in Foundry

### Before opening Ontology Manager

Have the operating contract, property dictionary, validated backing data, source-ownership table, security identities and expected sample results ready. Confirm the intended ontology, project, environment, storage backend and resource permissions. Use synthetic data for the first implementation.

First decide whether to reuse the existing ontology container. Foundry's ontology grouping has organization-access implications; a new team is not by itself a reason for a second ontology. If a separate container is required, have the appropriate platform administrator establish its organizational scope and permissions before adding the domain resources. Do not confuse creating an object type with creating a new ontology container. [Ontologies](https://www.palantir.com/docs/foundry/ontologies)

### Object-type procedure

In Ontology Manager, choose the new object-type helper. Select the backing datasource, set metadata and API names, retain only the required mapped properties, select a deterministic primary key and human-readable title, configure applicable security, choose the project/location, then save. Source column mapping is a starting point, not a reason to expose every column. Do not generate broad create/edit/delete capabilities without reviewing them. [Create an object type](https://www.palantir.com/docs/foundry/object-link-types/create-object-type)

Apply that procedure to Account:

| Setting | Design value |
| --- | --- |
| Display name | Account |
| API name | Account, subject to the enrollment's naming rules and collision checks |
| Primary key property | accountId |
| Title property | displayLabel |
| Backing grain | One row per stable account identity |
| Exposed source properties | currency, status, productType and approved metadata |
| Edit policy | No arbitrary edits to externally owned financial actuals |
| Access test | Customer A can see only permitted accounts; customer B is denied |

Repeat for AccountOwnership, BalanceSnapshot, Payee and Bill before implementing workflow types. After each type, verify object count, sample values, null handling and expected visibility. A successful save does not prove indexing, data quality or permissions are correct.

For workflow-created types, choose the supported backing/edit arrangement for your enrollment. Current documentation describes action-populated types without a backing datasource, with project permissions and an object security policy; verify those prerequisites instead of copying an older empty-dataset recipe blindly. [Create an object type](https://www.palantir.com/docs/foundry/object-link-types/create-object-type)

### Link setup and acceptance

For a foreign-key link, choose the referencing and referenced types, map the foreign-key property to the primary key, name both traversal sides and save. For a many-to-many join, provide the two key columns and check pair uniqueness. For AccountOwnership, create its own type and the two many-to-one links first. [Create a link type](https://www.palantir.com/docs/foundry/object-link-types/create-link-type)

Verify CUS-001 -> OWN-001 -> ACC-101, ACC-101 -> BAL-101, and BILL-301 -> PAY-201 using the actual test identity. Compare the results with source expectations. A missing edge can indicate a key mismatch, different types, missing object, stale index or denied access; do not treat every missing edge as a UI defect.

### First usable milestone

Before writing a payment action, a user should be able to inspect one customer's permitted accounts, a fresh balance observation and an unpaid bill with its payee. Record the schema version and sample expected results. This is the smallest useful read-only ontology slice.

## 9. Make query contracts explicit

Treat a query as a product contract: caller, scope, filtering, fields, pagination, sort order, freshness, errors and completeness. Define it before choosing SDK syntax.

Recommended contract:

~~~text
ReadPaymentContext(taskId, billId, accountId)
  Resolve actor and customer through trusted identity mapping.
  Validate that the task allows this bill and account.
  Resolve effective signing rights at the relevant time.
  Load bill, destination version, balance observation and commitments.
  Return only necessary fields with source versions and observation times.
  Mark missing, stale, filtered or ambiguous evidence explicitly.
  Make no edits and create no reservation.
~~~

Example response shape, not a platform API response:

~~~json
{
  "customerId": "CUS-001",
  "accountId": "ACC-101",
  "billId": "BILL-301",
  "payeeId": "PAY-201",
  "currency": "USD",
  "availableMinor": 160000,
  "billMinor": 11500,
  "commitmentsMinor": 90000,
  "bufferMinor": 50000,
  "balanceVersion": "7",
  "evidenceComplete": true,
  "missingEvidence": []
}
~~~

In a real response, include source timestamps and the configured validity deadline; their omission above is for compactness, not a recommendation to omit freshness.

Filter near the data service, request only needed properties and bound collection sizes. Separate “no matching result” from “insufficient evidence.” Distinguish a customer-scoped result from a complete enterprise-wide result. Do not infer inaccessible customers' details from counts or error messages.

TypeScript OSDK documentation describes property selection, bounded page fetching, continuation tokens and snapshot options. Follow the generated SDK for the pinned version; page one is not the full result, and a snapshot for paging does not reserve money. [TypeScript OSDK](https://www.palantir.com/docs/foundry/ontology-sdk/typescript-osdk)

For large exports or exact batch calculations, specify snapshot consistency and permitted processing boundaries. For interactive screens, prefer bounded queries and progressive disclosure. Avoid loading every transaction and filtering in a browser.

## 10. Implement deterministic functions

Keep reusable calculation logic separate from side effects. A calculation should receive explicit typed inputs and return a structured result with reasons; it should not quietly mutate approval or account state.

For the example:

~~~text
remainingMinor = availableMinor - billMinor - unreservedCommitmentsMinor
headroomMinor = remainingMinor - bufferMinor
permitted = evidenceComplete AND currencyCompatible AND headroomMinor >= 0
~~~

USD 1,600 - 115 - 900 leaves USD 585, or USD 85 above the buffer. If another USD 100 spend occurs, the remainder becomes USD 485 and the proposal is no longer executable under the same policy.

The commitments input must exclude amounts already represented in the available balance or holds for the same obligation. Define the planning horizon, reservation mapping and uncertainty policy. A forecast is not confirmed income.

Recommended function result:

~~~yaml
decision: permitted | rejected | insufficientEvidence
remainingMinor: integer or unavailable
headroomMinor: integer or unavailable
reasonCodes: list
evidenceReferences: list
policyVersion: explicit version
assumptions: list
~~~

Keep time as an explicit input in tests; avoid hidden dependence on the wall clock. Separate validation of syntactic input from evaluation of business constraints. Preserve typed errors instead of replacing every failure with “try again.”

Foundry functions can consume objects and object sets; supported execution and edit features vary by language and version. A function returning a result is not itself proof that an action committed or an external system executed. [Functions on objects](https://www.palantir.com/docs/foundry/functions/functions-on-objects)

## 11. Define business actions

An action should express a recognizable operation with explicit authority and postconditions. Avoid generic setters such as UpdateAnyObject or SetAccountBalance when the real intent is to propose or submit a payment.

Split the example into operations with distinct authority:

| Operation | Principal allowed to perform it | Core effect | Must not imply |
| --- | --- | --- | --- |
| ProposeBillPayment | Scoped workflow actor | Create immutable proposed intent and evidence references. | Customer approval or reserved funds. |
| ApproveProposal | Authenticated customer/signatory under policy | Record approval of exact intent. | Eternal or transferable authority. |
| RevokeConsent | Authorized signatory | Record revocation and effective time. | Cancellation of a payment already irreversibly executed. |
| SubmitPayment | Authorized executor with valid intent | Create/reuse command identity and submit through the defined protocol. | Settlement merely because submission returned. |
| RecordPaymentResult | Narrow integration identity | Apply a verified, versioned acknowledgment. | Arbitrary customer or agent status editing. |

### Submission contract

~~~yaml
operation: SubmitPayment
inputs:
  proposalId: Required stable reference
  consentId: Required stable reference
  submissionId: Stable caller-generated request identity
trustedContext:
  actor: Derived from authentication, never accepted as authority from input
  executionIdentity: Explicitly selected and policy-controlled
checks:
  - Caller and task may submit this operation
  - Effective account rights and signing conditions hold
  - Proposal is unexpired and matches the approved immutable intent
  - Consent is valid, unrevoked and bound to this proposal/version
  - Bill is payable and destination/version remains acceptable
  - Amount/currency/account/destination have not changed
  - Authoritative execution can satisfy funds and buffer constraints
effects:
  - Reuse or create one command for this submission intent
  - Record local acceptance separately from external outcome
  - Return command identity and actual known status
errors:
  - permissionDenied
  - consentInvalid
  - staleOrMissingEvidence
  - invariantViolation
  - conflictRetryable
  - duplicatePayloadMismatch
  - externalOutcomeUnknown
~~~

This contract spans application and trusted-service responsibilities. It is not a claim that one Foundry action transaction enforces all external checks atomically.

### Foundry configuration procedure

Enable the supported edit arrangement only on the types the workflow should modify. Create an action type in Ontology Manager; define the business parameters, rules, defaults, submission criteria and failure messages. Use object references where identity matters. Configure logging and permissions, then test with the intended identities. [Getting started with actions](https://www.palantir.com/docs/foundry/action-types/getting-started)

Use simple object/link rules for direct, comprehensible changes. For computed edits across related objects, select a compatible function-backed action and map its inputs deliberately. Current documentation treats the function rule as exclusive of other Ontology rules; implement the required edit behavior within that supported arrangement. [Function-backed actions](https://www.palantir.com/docs/foundry/action-types/function-actions-getting-started)

Not every business precondition can safely be expressed as a form constraint. Distinguish display defaults, parameter constraints, submission criteria, action logic and authoritative service validation. Hidden form fields and filtered dropdowns are not enforcement boundaries: a caller may use the API directly.

Use positive allowed-group or explicit scope checks. Avoid “not a member of forbidden group” as the basis for authority: scoped tokens can omit membership attributes and make a negative condition pass unexpectedly. Give every rejection an actionable message without revealing unrelated customers' data. [Submission criteria](https://www.palantir.com/docs/foundry/action-types/submission-criteria)

## 12. Protect concurrent invariants

Before approving an implementation, ask what happens when two requests make individually reasonable decisions from the same starting state.

Example: two payments read an available balance of USD 1,600 and each independently decides there is enough buffer. If each writes a different instruction object and neither reserves funds in an authoritative shared system, both may succeed while their combined effect violates the constraint.

The important question is **which shared state serializes the economic operation?** An Account read used only for calculation does not automatically become a lock because two actions mention it.

Foundry documents atomic Ontology edit batches, object-level write conflicts, and snapshot isolation for new batched-write actions. Read-only objects do not participate in those write conflicts, so write skew remains possible. Batched writes do not expose an action's own pending edits to its subsequent reads; staged-write support and isolation differ. External calls fall outside these guarantees. Verify the selected configuration instead of inferring database semantics from the action name. [Consistency and isolation](https://www.palantir.com/docs/foundry/action-types/consistency-guarantees)

Recommended approaches:

1. Let the trusted funds service atomically evaluate constraints and create the reservation/command under its own consistency model.
2. For an Ontology-only invariant, design the legitimate conflicting operations to update the actual shared invariant-owning state, and validate the resulting conflict behavior. Do not substitute a decorative write for a proven correctness argument.
3. Keep a stable command identity across retries; rerun state-dependent validation without duplicating a completed external operation.
4. Bound retry attempts, distinguish transient conflict from changed business eligibility, and return the current meaningful result.

Test overlapping payments, cancellation versus settlement, approval versus revocation, source rebuild versus edit, and out-of-order acknowledgments. Serial execution tests cannot prove the concurrent invariant.

## 13. Bind consent to exact intent

A conversation, a checkbox or a high model confidence score does not establish durable authority. Treat approval as a scoped authorization event verified by a trusted component.

Bind approval to at least:

- Proposal identity and immutable version.
- Customer and approving actor, plus effective signing conditions.
- Source account, destination identity and destination version.
- Bill, amount, currency, relevant fees and execution timing.
- Applicable policy/constraint version and any permitted variability.
- Expiry, revocation and maximum-use semantics.

If fees are not known exactly, define an approved maximum and an explicit execution rule rather than silently adding arbitrary fees. If any material intent field changes, create a new proposal and obtain applicable approval again.

An intent digest can help bind data across services, but it is not authorization by itself. Use a specified canonical representation: stable field ordering and encoding, explicit null handling, integer/decimal normalization, currency and schema version. A client-supplied digest must be recomputed and checked by the trusted verifier. Protect its association with an authenticated approval record.

Keep the observed balance version as evidence. Decide whether a changed balance invalidates approval automatically or whether execution may proceed after re-evaluating the same approved intent and constraints. The local demo uses the latter for balance changes and requires fresh approval for changed amount or authority.

Do not let the agent silently alter the buffer, add a payee, change accounts or weaken signing requirements to make a failed proposal pass. Return the reason and ask for a materially different instruction through the appropriate application flow.

## 14. Integrate external effects safely

An operational ontology must distinguish local intent from external authority. A PaymentInstruction can be the coordination record without becoming the payment service or ledger itself.

### State model

Recommended states and meanings:

| State | Evidence | Permitted interpretation |
| --- | --- | --- |
| Proposed | Exact intent and evidence recorded | No approval or money movement implied. |
| Approved | Applicable trusted consent exists | Execution still needs current validation. |
| AcceptedLocally | Workflow accepted a command identity | External service may not have received it. |
| Submitted | Dispatch is known to have occurred | External acceptance is not yet confirmed. |
| AcceptedExternally | Authoritative acknowledgment | Not necessarily settlement. |
| OutcomeUnknown | Delivery/result is ambiguous | Reconcile the existing command. |
| Settled | Authoritative terminal result/posting references | Bill satisfaction can be reconciled. |
| DefinitivelyFailed | Authoritative negative outcome | Release resources according to the authoritative protocol. |
| Reversed | Later linked reversing event | Preserve the original payment history. |

States may be represented differently by an actual provider. Map its semantics explicitly. The local browser combines several intermediate states as Queued and does not implement every state above.

### Choose an integration pattern deliberately

Foundry supports external-effect action patterns with different ordering, including post-edit webhooks and pre-edit writeback-webhook behavior. These are integration mechanisms, not a distributed transaction spanning the payment service and Ontology. [External action patterns](https://www.palantir.com/docs/foundry/action-types/explore-action-types)

Recommended service design when asynchronous dispatch is appropriate:

1. Commit a local instruction plus a durable dispatch-intent record within a verified local atomic boundary.
2. A worker discovers undispatched work and calls a trusted command endpoint with a stable command key and payload digest.
3. The command service validates identity, exact approval, business constraints and replay semantics; reservation and command acceptance occur within its own authoritative transaction.
4. The worker records the response or marks the result unknown. It never assumes a transport timeout means no payment occurred.
5. A reconciliation process queries the existing external reference/key and consumes verified result events.
6. The application updates the modeled instruction, bill and posting references from authoritative evidence.

This is an outbox-style recommendation, not a built-in Foundry dispatch guarantee. A record called Outbox is insufficient: the implementation must prove durability, discovery, retry, acknowledgment and crash recovery. If the chosen platform arrangement cannot atomically store the local record and dispatch intent, place coordination in a service that can or implement an explicit repair mechanism.

### Idempotency rules

Use one stable key for the same submission intent across transport retries. The authoritative service should return the existing command/result for an identical key and payload. A repeated key with a different payload must fail. Define key scope, retention and behavior after expiry. Keep a durable business rule against duplicate satisfaction of the same bill; an idempotency key alone does not prevent two separately keyed payments.

Do not generate a new key every time a request times out. A deliberate new attempt is appropriate only after resolving the prior attempt's outcome and obtaining the authorization required by policy.

### Result handling

Authenticate callbacks and verify their association with the expected service, command and account. Use monotonic sequence/version checks or an equivalent ordering protocol. Duplicate events should be safe. An old pending event must not overwrite Settled. Preserve late contradictions for reconciliation instead of deleting inconvenient history.

For reservation accounting, distinguish reservation creation from posting. When settlement consumes an existing hold, available funds must not be reduced a second time. On definitive failure, only the authoritative owner should release the appropriate reservation. Compensating actions and reversals are new business operations, not history erasure.

## 15. Enforce access and information boundaries

Model security before exposing real data. At minimum distinguish:

1. Permission to discover/edit type definitions.
2. Permission to read individual objects.
3. Permission to read sensitive properties.
4. Permission to invoke an operation.
5. Effective business signing rights for that customer/account.
6. Authority of the workflow's execution identity.
7. Protection of derived results, logs and exports.

A user who may view an account does not necessarily have business authority to debit it. Conversely, restricting a form is not enough if another client can invoke the same action.

Foundry action permissions depend on the configured resource and edit model, plus submission criteria. New action-only edit arrangements are not equivalent to granting direct backing-data editing. Validate the actual action/resource chain, including any log objects it creates. [Action permissions](https://www.palantir.com/docs/foundry/action-types/permissions)

### Permission matrix

| Capability | Customer-scoped read identity | Customer payment executor | Settlement integration | Ontology builder |
| --- | --- | --- | --- | --- |
| Read permitted account context | Yes, scoped | Yes, scoped | Minimal subset | Only if separately granted |
| Read unrelated customer | No | No | No default permission | No default permission |
| Record trusted approval | No | Through verified approval flow | No | No by schema-edit role alone |
| Submit exact payment | No | Within rights and valid consent | Only by explicit service contract | No by schema-edit role alone |
| Record external result | No | No arbitrary setter | Narrow verified-result operation | No by schema-edit role alone |
| Change action definition | No | No | No | Reviewed, scoped builder authority |

The matrix is a recommended separation of duties. Verify it with real test identities and direct API calls, not screenshots of a role selector.

### Read filtering versus propagation

Object and property policies filter accessible objects/fields. Their exact prerequisites differ between policy-based and older datasource-derived permission models. Confirm which model each type uses. [Object and property security](https://www.palantir.com/docs/foundry/object-permissioning/object-security-policies)

Read filters do not automatically travel with values into every function result, write target, model answer, log or export. Mandatory controls such as markings and classifications provide a different propagation mechanism. Use the appropriate combination and inspect all output paths. [Access-control propagation](https://www.palantir.com/docs/foundry/security/access-control-propagation)

For actions that may read marked data, examine both input and output boundaries. Current read/write authorization features are beta and supplement existing permissions; they do not grant access or automatically apply markings. Deliberate declassification and platform-managed log/history protections require separate review. Do not treat feature availability as universal. [Read and write authorizations](https://www.palantir.com/docs/foundry/action-types/read-write-authorizations)

Minimize agent-visible fields, mask destinations, redact secrets from logs, isolate customer sessions and avoid cross-customer caches. Error messages should not disclose whether another customer's bill exists. A safe authorization failure should not reveal sensitive lookup results.

## 16. Use the ontology from applications

### Pick the application surface

Use a low-code operational application when configured object views, searches and action forms meet the workflow. Use a custom application when you need a specific interaction model, client platform or integration. Both should consume the same reviewed contracts rather than reimplementing payment rules in each screen.

Recommended screen sequence:

1. **Context:** masked account, bill, payee, evidence timestamp and known commitments.
2. **Proposal:** exact intent, calculated remaining buffer, assumptions and excluded accounts.
3. **Approval:** a clear review of material parameters with a trusted authorization flow.
4. **Execution:** command identity and actual known processing state.
5. **Outcome:** confirmed settlement, definitive failure or unresolved status with next steps.

Refresh authoritative state after submission. Do not keep displaying a cached projection as if it were a confirmed transaction. Keep cancel, revoke and reverse semantics distinct.

### Developer Console and OSDK workflow

Create a Developer Console application, include the required Ontology resources, configure its appropriate authentication arrangement, generate a versioned SDK and use its application-specific documentation. Selecting resources for generation does not by itself grant every caller permission to use them. [Create a Developer Console application](https://www.palantir.com/docs/foundry/developer-console/create-application)

Recommended integration steps:

1. Pin SDK and supporting library versions in the target application's own approved environment.
2. Keep generated types and handwritten domain logic separate.
3. Configure user-based and service-based authentication according to the application's intended identity model. Do not put service secrets in a browser.
4. Implement scoped read contracts, bounded pagination and explicit error mapping.
5. Call the configured action using generated parameter types; do not manually guess API names or endpoint shapes.
6. Read the resulting instruction/reference and reconcile actual status.
7. Test as customer A, customer B, read-only identity and integration identity.

Do not copy TypeScript v1 function examples into a v2 OSDK client or assume Python and Java expose identical query options. The handbook's contracts describe intent; the generated docs are the final authority for the selected executable binding.

For this repository, keep the existing demo local. Nothing in this procedure authorizes hosting, uploading this project or adding network dependencies to its runtime.

## 17. Expose narrow tools to agents

The agent should coordinate permitted operations, not receive unconstrained object mutation access.

Recommended tool set:

| Tool | Input boundary | Output | Side effect |
| --- | --- | --- | --- |
| readPaymentContext | Task plus scoped bill/account references | Minimal facts, versions, timestamps, missing evidence | None |
| evaluatePayment | Validated context reference and policy version | Structured eligibility and reasons | None |
| proposeBillPayment | Task and selected references | Immutable proposal | Local workflow object |
| getProposalStatus | Scoped proposal reference | Version, approval and execution status | None |
| submitApprovedPayment | Proposal and trusted consent reference | Existing/new instruction and actual status | Governed command submission |
| getPaymentOutcome | Scoped instruction reference | Known outcome and source references | None beyond controlled reconciliation if explicitly designed |

These are application contracts, not existing Palantir method names. The trusted tool implementation resolves actor/customer scope and verifies references. Supplying a customerId or consentId is not proof of entitlement.

Keep instructions, retrieved business data and tool results distinct. A bill description can contain hostile text; it cannot grant tool authority, change a payee or override policy. Enforce constraints in code and services even if the model proposes something outside scope.

AIP Logic provides LLM-powered workflows using operational context and tools. Its user-scoped and project-scoped modes have different execution and log-access implications. Confirm the actual mode and principal, not just the person viewing the screen. Editing through a Logic function requires the documented action execution path; an apparent successful calculation is not a committed edit. [AIP Logic core concepts](https://www.palantir.com/docs/foundry/logic/core-concepts)

Evaluate both task success and policy compliance. A model that pays the right amount from an unauthorized account has failed. An agent that correctly reports uncertainty and prevents a duplicate can be successful even without completing the payment immediately.

## 18. Version and migrate the model

Version the contracts that consumers depend on: property meaning and representation, type/link API names, action parameters, policy rules, generated SDK, function implementation and external payload schema.

An additive nullable property can still be breaking if consumers start interpreting its absence differently. Renaming an API field, changing currency units, changing identity grain or reusing a status label for a different meaning is a contract change, not cosmetic cleanup.

Recommended expand-migrate-contract sequence:

1. Document the old and new meaning plus affected consumers.
2. Add compatible schema fields or new types before removing old ones.
3. Backfill through the normal validated pipeline; preserve identity mappings and provenance.
4. Compare counts, links, permissions and computed decisions on old/new views.
5. Update functions, actions, tools and clients using explicit version dependencies.
6. Switch consumers with a rollback plan and observe actual behavior.
7. Remove deprecated contracts only after usage is known to be zero and retention needs are satisfied.

Prefer branches and review for supported schema resources. Foundry ontology branching supports resource changes and review; protected resources have prerequisites and feature limitations. A schema proposal merge is not a migration of test payment records into production. [Ontology branching](https://www.palantir.com/docs/foundry/ontologies/branching-ontology)

Branch action testing requires the edited types to be indexed on that branch. Branch edits do not merge into main. External effects have separate default restrictions and override settings; enabling them can contact the same external endpoint as main. Verify endpoints and credentials rather than assuming a branch is a complete sandbox. [Branching action types](https://www.palantir.com/docs/foundry/action-types/branching-action-types)

Use reversible schema/application changes where possible, but recognize that rollback cannot undo an external settled payment. Recovery may require a separately authorized business compensation, not reverting code.

## 19. Observe the complete lifecycle

Operational observability should answer: what was requested, by whom, based on which evidence, under which policy, what was authorized, which command executed, and what actually happened?

Carry stable correlation across task, proposal, consent, instruction, external command and posting. Preserve versions and source timestamps. Keep sensitive payloads out of general logs; log approved references, reason codes and appropriately protected diagnostic context.

### Logs with different purposes

Foundry action logs represent successful action submissions and their decision context. Edit history records object changes through the supported edit paths. Neither should be mistaken for a complete external service audit. Failed authorization, dispatch attempts and external acknowledgments need appropriate operational telemetry as well. [Action log](https://www.palantir.com/docs/foundry/action-types/action-log/index.html), [User edit history](https://www.palantir.com/docs/foundry/object-edits/user-edit-history)

When enabling an action log, review the generated type, its fields, permissions and retention. Ensure the caller can create the log object required by the action. Review whether stored parameters contain sensitive data. A successful action log entry does not prove payment settlement.

### Measurements

| Signal | Definition to record | Operational response |
| --- | --- | --- |
| Source age | Evaluation time minus true source observation time | Disable freshness-dependent execution or route to a fresh source. |
| Index lag | Indexed source version/time versus latest ingested version/time | Investigate build/index health and communicate staleness. |
| Proposal rejection | Count by reason and policy version | Separate expected policy denials from regressions. |
| Action conflict | Conflicts per attempted operation and resource | Examine contention, retry behavior and schema design. |
| Unknown outcome age | Time since an unresolved external dispatch | Reconcile before retries; escalate by the agreed service objective. |
| Settlement mismatch | Service/ledger outcome differs from modeled state | Repair the projection through verified reconciliation. |
| Duplicate attempt | Same command or business obligation requested again | Confirm safe deduplication; investigate payload mismatch. |
| Permission anomaly | Unusual cross-customer scope or denied access pattern | Review identity and policy without disclosing protected values. |

Set targets with service owners and actual workload measurements. Do not invent a “banking-safe” freshness threshold from a tutorial. Separate percentile latency, correctness, completeness and availability; a fast query returning stale or incomplete data is not a successful query.

## 20. Test properties and failure paths

Test the operating invariants through the same interfaces callers can actually use. A UI-only test can miss a permissive backend action. A unit test cannot prove data ingestion, indexing or external service behavior.

### Test layers

| Layer | What it establishes | Example |
| --- | --- | --- |
| Source contract | Data has expected grain, keys, types and temporal meaning. | Duplicate account observation sequence is rejected. |
| Mapping/index | Source becomes the expected objects and links. | BILL-301 traverses to the intended PAY-201. |
| Pure logic | Calculation and error semantics are correct. | Exact buffer equality passes; one minor unit below fails. |
| Authorization | Identity and policy restrictions are enforced. | Customer B cannot invoke payment for customer A's bill. |
| Action | Validations, edits, conflict behavior and outputs match the contract. | Revoked consent prevents submission. |
| Integration | Command/result protocol survives retries and crashes. | Timeout after service acceptance returns the existing command on reconciliation. |
| Application | Display and interaction reflect actual state. | Queued is visibly different from Paid. |
| Agent evaluation | The workflow respects policy with imperfect language/context. | A malicious bill note cannot replace the payee. |

### Required scenario matrix

1. Correct baseline: USD 585 remains, then one reservation and one economic payment.
2. Boundary: exactly USD 500 remaining passes; one minor unit below fails.
3. Changed funds after approval: current-state validation rejects a buffer breach.
4. Revoked/expired consent: no submission despite an earlier successful preview.
5. Changed destination version: reapproval or rejection under the declared policy.
6. Wrong currency: no implicit conversion or comparison across units.
7. Wrong account/customer: deny both reads and direct action invocation.
8. Missing/hidden evidence: no substitution with zero or inference of permission.
9. Duplicate transport delivery: one external command and repeatable result.
10. Same key, changed payload: explicit mismatch error.
11. Concurrent separately keyed attempts for one bill: the authoritative business rule prevents duplicate satisfaction.
12. Concurrent payments against shared funds: the authoritative invariant remains true.
13. Definitive failure: correct reservation release, bill unpaid, no fake posting.
14. Ambiguous timeout: status unknown; reconcile existing command before retrying.
15. Duplicate/out-of-order acknowledgments: terminal state cannot regress.
16. External success plus local crash: reconciliation repairs the modeled state.
17. Source rebuild during execution: transient conflict handled without duplicate external effects.
18. Schema/SDK change: existing consumers continue or fail in a planned, detectable way.
19. Sensitive output path: logs, summaries and agent responses preserve the intended information boundary.
20. Agent instruction attack: source text cannot override tool policy.

Use synthetic fixtures, controlled identities and stubbed external endpoints before touching an approved integration environment. Platform test-run behavior can still execute required external calls; confirm what a chosen test mode actually invokes. [Action test runs](https://www.palantir.com/docs/foundry/action-types/test-run)

Retain evidence: fixture version, identity, action/function version, observed outcome, relevant correlation IDs and the invariant tested. A test named “payment works” is not enough to establish the failure semantics.

## 21. Control performance and scale

Design performance around known queries and action patterns, then measure in the intended environment. There is no universal “best” object granularity independent of workload.

Recommended practices:

- Query the needed scope server-side and project only permitted, necessary fields.
- Use bounded pages and supported aggregations rather than loading an entire history into memory.
- Batch compatible reads and avoid one request per row when a supported bulk path exists.
- Keep high-frequency observations/events separate from stable Account identity.
- Avoid duplicating large histories on every related object.
- Separate interactive queries from bulk reporting workloads.
- Measure high-degree relationship traversal before making it a default screen operation.
- Partition caches by actor/security scope, query semantics, schema and policy version; apply explicit freshness limits.
- Invalidate or re-read affected state after actions; cached availability is not an execution guarantee.
- Measure cold and warm behavior, realistic concurrency, data skew and denied-access paths.

Keep contention visible. A correct shared invariant-owning object may serialize a hot path; the solution is a measured, correct authority design, not silently weakening checks. External service quotas, retries and indexing lag can dominate apparent application performance.

Check current platform limits for the selected object storage, query operations, functions and action batch sizes. Do not hard-code a remembered numerical limit into a long-lived architecture without a versioned dependency record.

## 22. Operate and recover

Assign named owners before a workflow receives consequential authority. Required responsibilities include domain semantics, source quality, schema changes, permissions, action logic, external service integration, user support and incident response.

### Unknown payment outcome runbook

1. Locate the original instruction, command key, payload digest and external correlation.
2. Prevent a blind new attempt for the same unresolved obligation.
3. Check the authoritative service using its documented lookup/reconciliation mechanism.
4. If settled, repair the modeled outcome and bill/posting links using a verified result path.
5. If definitively failed, follow the authoritative release protocol and permitted retry process.
6. If still unknown, retain the unresolved state, notify the appropriate owner and communicate uncertainty clearly.
7. Preserve evidence and investigate why acknowledgment or reconciliation failed.

Do not invent settlement from a successful HTTP transport response or release funds based only on a client timeout.

### Stale source or indexing failure runbook

Identify whether the failure is at source, ingestion, transformation, indexing or access. Compare source versions and timestamps, inspect rejected records and pause freshness-dependent actions. Restore/replay through the established pipeline, then verify sample objects, counts, links and permissions before resuming. Avoid patching derived values manually to hide a broken source.

### Permissions regression runbook

Stop the affected execution path if necessary, identify the changed policy/identity/configuration, and inspect all output paths that may have received data. Restore reviewed access, verify with representative identities, and handle exposed artifacts according to the organization's incident process. Changing source read policy does not retroactively protect a previously exported file.

### Release rollback runbook

Know the last compatible schema, function, action and client versions. Roll back executable logic only when the data remains compatible. Reconcile commands already accepted by an external system before resubmission. External economic effects require their own business recovery process.

Back up or retain the authoritative data and configuration required for recovery. A rebuildable object index is not a substitute for durable workflow records, original approvals or authoritative ledger state.

## 23. Run a local data-and-query reference

This executable SQLite example illustrates preparation and query semantics. It does not create Foundry resources, enforce production authentication or move money. The records, timestamps and a 120-second freshness window are **rehearsal assumptions**, not recommended banking service levels. Its reduced available-balance formula is valid only for this fixture.

The blocks labeled A–E run in order in the same SQLite database. For a fresh run, create a new empty database. The final block observes the changed balance inserted in D.

Use an SQLite session, or extract the five SQL blocks and execute them with Python's standard-library sqlite3 module. The project's existing npm test command also executes and checks this example without installing packages or making network requests.

### Block A: create and seed the reference data

~~~sql
PRAGMA foreign_keys = ON;

CREATE TABLE customer (
  customer_id TEXT PRIMARY KEY NOT NULL,
  display_name TEXT NOT NULL
);
CREATE TABLE account (
  account_id TEXT PRIMARY KEY NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Open', 'Closed'))
);
CREATE TABLE ownership (
  ownership_id TEXT PRIMARY KEY NOT NULL,
  customer_id TEXT NOT NULL REFERENCES customer(customer_id),
  account_id TEXT NOT NULL REFERENCES account(account_id),
  can_pay INTEGER NOT NULL CHECK (can_pay IN (0, 1)),
  valid_from TEXT NOT NULL,
  valid_to TEXT
);
CREATE TABLE balance_snapshot (
  snapshot_id TEXT PRIMARY KEY NOT NULL,
  account_id TEXT NOT NULL REFERENCES account(account_id),
  currency TEXT NOT NULL,
  source_version INTEGER NOT NULL,
  observed_at TEXT NOT NULL,
  ledger_minor INTEGER NOT NULL,
  held_minor INTEGER NOT NULL CHECK (held_minor >= 0),
  available_minor INTEGER NOT NULL CHECK (available_minor >= 0),
  UNIQUE (account_id, source_version),
  CHECK (available_minor = ledger_minor - held_minor)
);
CREATE TABLE payee (
  payee_id TEXT PRIMARY KEY NOT NULL,
  display_name TEXT NOT NULL,
  destination_version INTEGER NOT NULL,
  verification_status TEXT NOT NULL
);
CREATE TABLE bill (
  bill_id TEXT PRIMARY KEY NOT NULL,
  customer_id TEXT NOT NULL REFERENCES customer(customer_id),
  payee_id TEXT NOT NULL REFERENCES payee(payee_id),
  amount_minor INTEGER NOT NULL CHECK (amount_minor > 0),
  currency TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Unpaid', 'Paid'))
);
CREATE TABLE commitment (
  commitment_id TEXT PRIMARY KEY NOT NULL,
  customer_id TEXT NOT NULL REFERENCES customer(customer_id),
  account_id TEXT NOT NULL REFERENCES account(account_id),
  amount_minor INTEGER NOT NULL CHECK (amount_minor > 0),
  currency TEXT NOT NULL,
  due_date TEXT NOT NULL,
  certainty TEXT NOT NULL,
  reservation_reference TEXT
);

INSERT INTO customer VALUES ('CUS-001', 'Alex Morgan'), ('CUS-002', 'Sam Rivera');
INSERT INTO account VALUES ('ACC-101', 'USD', 'Open'), ('ACC-202', 'USD', 'Open');
INSERT INTO ownership VALUES
  ('OWN-001', 'CUS-001', 'ACC-101', 1, '2026-01-01T00:00:00Z', NULL),
  ('OWN-002', 'CUS-002', 'ACC-202', 1, '2026-01-01T00:00:00Z', NULL);
INSERT INTO balance_snapshot VALUES
  ('BAL-101', 'ACC-101', 'USD', 7, '2026-10-22T08:00:00Z', 170000, 10000, 160000),
  ('BAL-202', 'ACC-202', 'USD', 1, '2026-10-22T08:00:00Z', 999900, 0, 999900);
INSERT INTO payee VALUES ('PAY-201', 'City Energy', 1, 'Verified');
INSERT INTO bill VALUES
  ('BILL-301', 'CUS-001', 'PAY-201', 11500, 'USD', 'Unpaid'),
  ('BILL-302', 'CUS-002', 'PAY-201', 11500, 'USD', 'Unpaid');
INSERT INTO commitment VALUES
  ('COM-501', 'CUS-001', 'ACC-101', 90000, 'USD', '2026-10-25', 'Confirmed', NULL);

CREATE VIEW payment_context AS
WITH settings AS (
  SELECT '2026-10-22T08:01:00Z' AS as_of, 120 AS max_age_seconds,
         50000 AS buffer_minor
), ranked_balance AS (
  SELECT s.*, ROW_NUMBER() OVER (
    PARTITION BY account_id ORDER BY source_version DESC
  ) AS rank_in_account
  FROM balance_snapshot s
), obligations AS (
  SELECT c.customer_id, c.account_id, c.currency,
         SUM(c.amount_minor) AS commitments_minor
  FROM commitment c CROSS JOIN settings t
  WHERE c.certainty = 'Confirmed'
    AND c.reservation_reference IS NULL
    AND c.due_date >= date(t.as_of)
    AND c.due_date <= date(t.as_of, '+7 days')
  GROUP BY c.customer_id, c.account_id, c.currency
)
SELECT b.customer_id, a.account_id, b.bill_id, b.payee_id, b.currency,
       s.source_version, s.observed_at, s.available_minor, b.amount_minor,
       COALESCE(c.commitments_minor, 0) AS commitments_minor,
       s.available_minor - b.amount_minor - COALESCE(c.commitments_minor, 0)
         AS remaining_minor,
       s.available_minor - b.amount_minor - COALESCE(c.commitments_minor, 0)
         - t.buffer_minor AS headroom_minor
FROM bill b
JOIN ownership o ON o.customer_id = b.customer_id AND o.can_pay = 1
JOIN account a ON a.account_id = o.account_id AND a.status = 'Open'
JOIN ranked_balance s ON s.account_id = a.account_id AND s.rank_in_account = 1
JOIN payee p ON p.payee_id = b.payee_id AND p.verification_status = 'Verified'
CROSS JOIN settings t
LEFT JOIN obligations c ON c.customer_id = b.customer_id
  AND c.account_id = a.account_id AND c.currency = a.currency
WHERE b.status = 'Unpaid'
  AND b.currency = a.currency AND s.currency = a.currency
  AND o.valid_from <= t.as_of
  AND (o.valid_to IS NULL OR o.valid_to > t.as_of)
  AND (julianday(t.as_of) - julianday(s.observed_at)) * 86400
      BETWEEN 0 AND t.max_age_seconds;
~~~

The view selects the highest source sequence, not the latest arrival order. Only confirmed commitments in its explicit seven-day window that are not already reserved are included. The fixture has complete commitment data; in a real system an absent record set may mean incomplete coverage, so the service also needs an explicit completeness signal.

### Block B: read the baseline context

~~~sql
SELECT available_minor, amount_minor, commitments_minor,
       remaining_minor, headroom_minor, (headroom_minor >= 0) AS permitted
FROM payment_context
WHERE customer_id = 'CUS-001'
  AND account_id = 'ACC-101'
  AND bill_id = 'BILL-301';
~~~

Expected single row: **160000, 11500, 90000, 58500, 8500, 1**. This is a calculation result, not approval or a reservation.

### Block C: demonstrate scope mismatch

~~~sql
SELECT bill_id
FROM payment_context
WHERE customer_id = 'CUS-002'
  AND account_id = 'ACC-101'
  AND bill_id = 'BILL-301';
~~~

Expected result: **zero rows**. This demonstrates the query's relationship conditions only. A service must derive the caller's customer from trusted identity and bind parameters; letting a caller freely choose customer_id would bypass the intended boundary.

### Block D: observe a competing USD 100 spend

~~~sql
INSERT INTO balance_snapshot VALUES
  ('BAL-102', 'ACC-101', 'USD', 8, '2026-10-22T08:00:30Z', 160000, 10000, 150000);
~~~

The earlier observation remains as history; version 8 becomes the current candidate.

### Block E: re-evaluate the same exact intent

~~~sql
SELECT available_minor, remaining_minor, headroom_minor,
       (headroom_minor >= 0) AS permitted
FROM payment_context
WHERE customer_id = 'CUS-001'
  AND account_id = 'ACC-101'
  AND bill_id = 'BILL-301';
~~~

Expected single row: **150000, 48500, -1500, 0**. The previously acceptable payment no longer satisfies the buffer. The view neither invalidates consent automatically nor prevents races: authoritative submission must enforce the declared execution policy atomically.

### Map this fixture to the Ontology

Create dataset-backed types from the customer, account, ownership, balance_snapshot, payee, bill and commitment grains. Map snake_case columns to deliberate property API names. Configure the links from section 5. Reproduce the scope and freshness semantics using supported object queries/functions, then compare their results to B, C and E.

Do not assume the SQLite view is directly executable as an OSDK query. It is a behavioral reference and data fixture. Workflow-created types, trusted consent and external command handling still need the separately specified implementation.

## 24. Use reviewable specification templates

These are authoring templates, not product configuration files.

### Type specification

~~~yaml
name: PaymentInstruction
businessPurpose: Coordinate one payment command and its reconciled outcome
grain: One stable submitted command, not one transport delivery
primaryKey: instructionId
title: Masked human-readable command label
owner: Payments workflow team
sourceAuthority: Payment service for processing outcome
requiredFields: [proposalId, commandKey, payloadDigest, status, statusVersion]
relations: [proposal, sourceAccount, payee, bill, resultingPostings]
editPaths: [SubmitPayment, RecordPaymentResult]
readPolicy: Explicit customer/service scope
invariants:
  - Same command key cannot represent a different payload
  - OutcomeUnknown cannot be treated as definitive failure
  - Old acknowledgments cannot regress a newer terminal status
retention: Defined by approved domain policy
tests: Links to source, policy, concurrency and integration evidence
~~~

### Property ownership record

~~~text
Type/property:
Business definition and unit:
Source and responsible owner:
Null/unknown meaning:
Observation/effective/ingestion time:
Permitted edit path:
Source-versus-edit resolution:
Sensitivity and downstream protection:
Validation and reconciliation tests:
Change compatibility:
~~~

### Architecture decision record

~~~text
Decision: Which service owns reservation and duplicate-payment prevention?
Context: Concurrent requests and ambiguous external outcomes.
Alternatives: Ontology-only intent, trusted command service, synchronous integration.
Chosen boundary: Name the actual authoritative component and transaction.
Reason: Explain invariants, latency, failure recovery and operating ownership.
Trade-offs: Contention, availability, reconciliation delay and complexity.
Evidence: Concurrent tests, crash tests and provider protocol behavior.
Revisit trigger: Changed workload, product semantics or service capabilities.
~~~

### Release record

~~~text
Schema / action / function / SDK / policy versions:
Source mapping and data quality evidence:
Identity and output-protection tests:
Concurrency and external failure evidence:
Changed consumers and compatibility plan:
Runbook, alerting and ownership:
Rollback and compensation boundaries:
Known unsupported states and user-visible handling:
Approvals required by the target environment:
~~~

## 25. Recognize common failure patterns

| Failure pattern | Consequence | Better design |
| --- | --- | --- |
| Mirror every source table literally | Business identity becomes fragmented and duplicated. | Define grain and reconcile canonical identities. |
| Generate a new key on every rebuild | Existing links, edits and approvals lose their target. | Stable keys and explicit migration mappings. |
| Put all meaning in display text | Queries and actions depend on ambiguous strings. | Typed properties and explicit relationships. |
| Use a direct ownership link as signing authority | Joint rights, revocation and effective time disappear. | Qualified rights records plus current authoritative checks. |
| Treat a balance snapshot as spend authorization | Stale proposals can overspend. | Fresh evidence plus atomic execution validation. |
| Mark a bill paid when a request is queued | Customer sees an outcome that has not happened. | Instruction lifecycle separated from settlement. |
| Retry with a new key after timeout | Duplicate economic operation is possible. | Reconcile existing command identity. |
| Deduplicate only by request key | Two distinct keys can still pay the same obligation. | Separate business-level duplicate prevention. |
| Rely on a disabled button or hidden field | Direct API calls bypass the screen. | Trusted action/service enforcement. |
| Allow arbitrary status setters | Agent or customer can fabricate an external outcome. | Narrow verified-result integration operation. |
| Assume read filters protect outputs | Summaries, logs or exports can leak data. | Explicit output policy and applicable mandatory controls. |
| Treat a schema branch as an external sandbox | Test action can call a live endpoint after overrides. | Review side-effect settings and endpoint isolation. |
| Assume action rollback reverses a settled payment | External state diverges from local history. | Explicit reconciliation and authorized compensation. |
| Give the agent broad writes because it explains well | Plausible text gains operational authority. | Narrow tools and independently enforced policy. |

## 26. Build in acceptance-gated stages

Do not start with the full catalog, every customer journey and a live payment integration at once. Implement a vertical slice and add authority only when evidence supports it.

| Stage | Deliverable | Acceptance evidence |
| --- | --- | --- |
| 1. Operating contract | Scope, invariants, owners and authority boundaries | Domain owner can explain every promised transition. |
| 2. Read model | Customer, account, rights, balance, bill and payee | Stable identity, correct links, quality gates and denied cross-customer access. |
| 3. Calculation | Reusable eligibility function | Baseline, equality boundary, stale data, wrong currency and incomplete evidence tests. |
| 4. Proposal and consent | Versioned immutable intent and trusted approval | Parameter change, expiry, revocation and signing tests. |
| 5. Command protocol | Idempotent authoritative execution interface | Duplicate key, changed payload, crash and timeout reconciliation tests. |
| 6. Outcome model | Verified result handling and posting links | No false Paid state; no double debit; out-of-order event safety. |
| 7. Application and agent | Shared contracts, narrow tools and truthful status display | Direct API policy tests and adversarial agent evaluations. |
| 8. Controlled operation | Versioned release, monitoring, runbooks and owners | Rehearsed recovery and clear unsupported-state handling. |

For a first useful implementation, stop at read context plus nonexecuting proposals if the trusted authorization or command service does not yet exist. That is a legitimate product boundary. Claiming production execution without those components is not.

The existing local HTML reaches an educational simulation boundary, not stages 5–8 as a real payment system. This handbook describes the additional engineering needed; it does not silently upgrade the demo's guarantees.

## 27. Primary-source reference register

Checked 22 October 2026. The handbook's recommendations and fictional schema are original synthesis. The following sources support identified platform behavior; all navigation is optional and user initiated.

| Source | Supports |
| --- | --- |
| [Core concepts](https://www.palantir.com/docs/foundry/ontology/core-concepts) | Platform modeling vocabulary. |
| [Ontology design best practices](https://www.palantir.com/docs/foundry/ontology/ontology-best-practices) | Domain modeling, reuse and pragmatic trade-offs. |
| [Ontologies](https://www.palantir.com/docs/foundry/ontologies) | Container and organization-access considerations. |
| [Types reference](https://www.palantir.com/docs/foundry/object-link-types/type-reference) | Shared properties, value types and resource distinctions. |
| [Use value types](https://www.palantir.com/docs/foundry/object-link-types/use-value-type) | Reusable validation and indexing/action constraints. |
| [Interfaces](https://www.palantir.com/docs/foundry/interfaces/interface-overview) | Abstract contracts and support considerations. |
| [Create an object type](https://www.palantir.com/docs/foundry/object-link-types/create-object-type) | Resource creation, keys, titles and source options. |
| [Create a link type](https://www.palantir.com/docs/foundry/object-link-types/create-link-type) | Foreign-key, join and object-backed relationships. |
| [Indexing restrictions](https://www.palantir.com/docs/foundry/object-indexing/data-restrictions) | Backing-data constraints. |
| [How user edits are applied](https://www.palantir.com/docs/foundry/object-edits/how-edits-applied) | Source and edit reconciliation. |
| [Functions on objects](https://www.palantir.com/docs/foundry/functions/functions-on-objects) | Object-aware computation. |
| [Getting started with actions](https://www.palantir.com/docs/foundry/action-types/getting-started) | Action setup and configuration workflow. |
| [Submission criteria](https://www.palantir.com/docs/foundry/action-types/submission-criteria) | Execution eligibility and negative-membership caveat. |
| [Function-backed actions](https://www.palantir.com/docs/foundry/action-types/function-actions-getting-started) | Function rule configuration. |
| [Consistency and isolation](https://www.palantir.com/docs/foundry/action-types/consistency-guarantees) | Atomicity, write modes, conflicts and write skew. |
| [External action patterns](https://www.palantir.com/docs/foundry/action-types/explore-action-types) | External effect and rule options. |
| [Action permissions](https://www.palantir.com/docs/foundry/action-types/permissions) | Apply permissions and dependency checks. |
| [Object and property security](https://www.palantir.com/docs/foundry/object-permissioning/object-security-policies) | Instance and property read filtering. |
| [Access-control propagation](https://www.palantir.com/docs/foundry/security/access-control-propagation) | Read controls versus propagating protections. |
| [Read and write authorizations](https://www.palantir.com/docs/foundry/action-types/read-write-authorizations) | Additional action boundaries and beta limitations. |
| [Create a Developer Console application](https://www.palantir.com/docs/foundry/developer-console/create-application) | Generated SDK application setup. |
| [TypeScript OSDK](https://www.palantir.com/docs/foundry/ontology-sdk/typescript-osdk) | Query options, paging and projections. |
| [AIP Logic core concepts](https://www.palantir.com/docs/foundry/logic/core-concepts) | LLM workflow execution modes and edit path. |
| [Ontology branching](https://www.palantir.com/docs/foundry/ontologies/branching-ontology) | Schema resource development and review. |
| [Branching action types](https://www.palantir.com/docs/foundry/action-types/branching-action-types) | Branch indexing, edit and side-effect behavior. |
| [Action log](https://www.palantir.com/docs/foundry/action-types/action-log/index.html) | Successful action decision records. |
| [User edit history](https://www.palantir.com/docs/foundry/object-edits/user-edit-history) | Object edit history and timestamps. |
| [Action test runs](https://www.palantir.com/docs/foundry/action-types/test-run) | Testing boundaries and external-call caveats. |

For the project's current simulated behavior, use [IMPLEMENTATION.md](IMPLEMENTATION.md). For conceptual study, use [STUDY_GUIDE.md](STUDY_GUIDE.md). For the banking scenario walkthrough, use [AGENTIC_BANKING.md](AGENTIC_BANKING.md).
