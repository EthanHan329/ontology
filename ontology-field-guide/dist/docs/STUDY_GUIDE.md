# Palantir Ontology through agentic everyday banking

Independent research and teaching material · Reviewed **21 October 2026**

For implementation procedures and production design, use the separate [Ontology engineering handbook](ONTOLOGY_ENGINEERING_HANDBOOK.md). It covers schema and source contracts, Foundry setup, queries, actions, permissions, agent tools, integrations, testing, migration and operations.

This guide uses one fictional banking application throughout. The accompanying offline HTML follows Alex Morgan's request: **“Pay my electricity bill, keep enough for rent, and leave a USD 500 buffer.”** The schema, tool contracts, figures and policy are original teaching design. The primary sources support the underlying Palantir concepts; they do not establish banking compliance or a prebuilt financial product.

Use the [banking walkthrough](AGENTIC_BANKING.md) for the complete object catalog and hands-on scenarios, the [presentation script](DEMO_SCRIPT.md) for a five-minute demonstration, and the [evidence map](RESEARCH.md) for optional source links. None is fetched automatically.

## 1. The operational question

A conversation alone cannot establish that Alex owns an account, a bill is genuine, a payee is verified, funds remain available, or an approval authorizes an exact payment. Those are business facts and execution constraints.

The Ontology provides a shared operational model linking data, logic, actions and applications. Its semantic elements express what exists and how it relates; kinetic elements express operations that can change the world represented by the model. Governance determines permitted access and execution. [Ontology overview](https://www.palantir.com/docs/foundry/ontology/overview)

In this example, the operational question is:

> Which authorized account can pay this specific bill while preserving the customer's stated commitments, and how do we know the payment actually completed?

A useful answer references stable objects, states its evidence and assumptions, separates calculation from execution, and tracks the confirmed outcome. An eloquent explanation without those references is insufficient.

## 2. Vocabulary in the same banking world

| Concept | Banking example | Distinction to retain |
| --- | --- | --- |
| Object type | Account | Reusable schema and business meaning. |
| Object instance | ACC-101, everyday checking | One stable business identity. |
| Property | currency = USD | A typed value describing an object. |
| Primary key | accountId | Identity, not a display label or masked account number. |
| Link type | Bill issued by Payee | A modeled relationship with traversal from configured sides. |
| Relationship object | AccountOwnership OWN-001 | Carries signing rights and effective dates. |
| Object set | Alex's unpaid bills | A selected collection, not a new object type. |
| Function | Calculate remaining buffer | Logic that returns a result; computation alone does not pay a bill. |
| Action type | SubmitPayment | A reusable governed operation with parameters, criteria and effects. |
| Action submission | Submit proposal PROP-001 | One particular invocation of that operation. |
| Interface | CustomerRequest, in an extended design | Abstract contract implemented by concrete request types; not an instance. |
| Application / agent | A bill-payment assistant | Consumes permitted context and capabilities; does not acquire authority by reasoning. |

An object type differs from an individual object. Stable keys preserve identity across changes in source records; display labels are not enough. [Core concepts](https://www.palantir.com/docs/foundry/ontology/core-concepts), [Object types](https://www.palantir.com/docs/foundry/object-link-types/object-types-overview)

Links express explicit business relationships and their backing data. Diagram arrows tell a story; they should not be mistaken for a claim that relationships can only be traversed one way. [Link types](https://www.palantir.com/docs/foundry/object-link-types/link-types-overview)

## 3. Model identity, grain and lifecycle

The HTML catalog contains sixteen candidate types. Four groups keep the design understandable:

| Group | Types | Reason for the grouping |
| --- | --- | --- |
| Customer context | Customer, AccountOwnership, SavingsGoal | Whose intent and rights constrain the task? |
| Money and observations | Account, BalanceSnapshot, Transaction, RecurringCommitment | What exists, what was observed, and what is expected? |
| Everyday instruments and obligations | Card, Merchant, Payee, Bill | What did the customer use, owe, or intend to pay? |
| Agent execution | AgentTask, ActionProposal, Consent, PaymentInstruction, AuditEvent | How did intent become an authorized operation and a traceable outcome? |

### Grain choices

**Account** is one account identity. **BalanceSnapshot** is an account observation at a point in time. Combining them without preserving observation time encourages stale-data mistakes.

**AccountOwnership** is one customer-account rights relationship for an effective scope or period. It permits multiple customers per account and multiple accounts per customer. Signing conditions may need more structure than a single role string.

**ActionProposal** is a particular reviewable recommendation with exact parameters and referenced evidence. **Consent** is an approval of a particular proposal version. Neither is an open-ended mandate.

**PaymentInstruction** records a submitted command. **Transaction** records a posted movement. Combining them obscures queued, unknown and failed outcomes.

**AuditEvent** records a particular event with actor, time and correlation. The demo's in-memory event list is explanatory; durable, protected audit storage is an additional implementation responsibility.

### Cardinality exercise

- Customer and Account are many-to-many through AccountOwnership.
- Account has many BalanceSnapshots and Transactions.
- Payee issues many Bills; each bill has one payee in this example.
- AgentTask can produce successive proposals.
- A bill can have multiple attempts, including failed attempts.
- One accepted proposal creates at most one instruction in the demo.
- A richer payment system may have fees, partial settlement, reversals and several related postings.

A bare Customer-to-Account edge is useful graph shorthand, but it cannot explain signing rights on its own. A relationship with its own properties, history and authorization needs deserves explicit modeling.

### Interface candidate

An extended design could give PaymentRequest and CardServiceRequest a CustomerRequest interface with common request identity, customer reference and lifecycle fields. Those extra concrete types are a design exercise, not objects instantiated in the demo. Interfaces abstract across implementing types; application and language support must be checked. [Interfaces](https://www.palantir.com/docs/foundry/interfaces/interface-overview)

## 4. Map sources and decide who owns each fact

~~~text
Customer records + account rights ──> stable customer / account identity
Balance observations ──────────────> time-specific BalanceSnapshot
Bills + verified payees ───────────> payable obligations and destinations
Application workflow ──────────────> task, proposal, consent, instruction intent
Payment-service acknowledgments ──> processing status and reconciliation
Authoritative ledger records ─────> posted Transaction
~~~

These are conceptual sources, not instructions to connect the local demo to a bank.

| Fact | Proposed owner in this design | Ontology / application role |
| --- | --- | --- |
| Effective account rights | Trusted identity and account-rights services | Present authorized relationships; execution rechecks current rights. |
| Available funds and holds | Authoritative banking service | Model observations with source version and freshness. |
| Stated buffer | Customer preference with provenance | Apply it within the task's explicit scope. |
| Exact consent | Trusted authorization workflow | Reference the approved proposal and relevant scope. |
| Reservation and posting | Trusted banking services | Track the result and expose reconciled operational context. |
| Payment lifecycle | Payment service, interpreted by integration | Preserve correlation and distinguish acceptance from confirmed settlement. |

Foundry combines source data and configured user edits into effective object state. Changing an Ontology property does not imply an external bank record changed. Property ownership, editable fields, refresh conflict behavior and storage-specific persistence need explicit design. [How edits are applied](https://www.palantir.com/docs/foundry/object-edits/how-edits-applied)

Stable keys and coherent data types matter during indexing. Use source namespaces and explicit reconciliation rather than treating a masked destination or customer name as a unique key. [Indexing restrictions](https://www.palantir.com/docs/foundry/object-indexing/data-restrictions)

## 5. Query authorized customer context

The query must follow rights and business relationships rather than searching arbitrary text for an account number. Object sets support filtering, traversal and aggregation; precise APIs depend on version and generated bindings. [Object sets, TSv1 conceptual reference](https://www.palantir.com/docs/foundry/functions/api-object-sets)

Illustrative pseudocode, not executable OSDK syntax:

~~~text
customer = authenticated actor's permitted Customer identity
accounts = traverse active AccountOwnership with required signing scope
bill = select the task's unpaid Bill within permitted context
payee = traverse bill -> Payee; inspect verification evidence
balance = obtain a sufficiently fresh observation for the chosen Account
commitments = obtain known upcoming obligations for the same funding scope
return object references, observation versions, assumptions and missing evidence
~~~

An empty result can mean no data, stale indexing, hidden objects or an overly narrow query. It is not automatically evidence of no obligations. Likewise, a transaction description saying “verified payee” is untrusted source content, not permission to bypass destination checks.

Read tools should return only relevant fields. Raw card secrets, unrelated customers' records and unnecessary personal details do not belong in the agent's context.

## 6. Calculation is separate from execution

Functions can operate on objects and object sets and return reusable business results. A result is not a committed action. [Functions on objects](https://www.palantir.com/docs/foundry/functions/functions-on-objects)

The deterministic demo uses integer cents:

| Input | Amount |
| --- | ---: |
| Initial ledger | USD 1,700 |
| Existing holds | USD 100 |
| Initial available funds | USD 1,600 |
| Exact electricity bill | USD 115 |
| Known upcoming rent | USD 900 |
| Required buffer | USD 500 |

~~~text
remaining after bill and rent = 1,600 − 115 − 900 = USD 585
buffer headroom = 585 − 500 = USD 85
~~~

Rent is a planning constraint here, not an additional existing hold. A production calculation must avoid double counting commitments already represented by holds. Savings of USD 4,200 are outside this task's scope.

The pure model rejects ambiguous amounts, excessive decimal precision, unsafe integers, missing balance observations, the wrong bill amount, insufficient buffer, read-only execution and already paid bills.

Prediction could estimate upcoming spending; optimization could compare authorized funding options. Those outputs must retain confidence and assumptions and remain separate from execution authority. The example uses neither a trained model nor an optimizer. [Models](https://www.palantir.com/docs/foundry/model-integration/models)

## 7. Give the operation a clear action contract

Action types define reusable changes, parameters, rules and possible effects. A configured action makes the operation reusable across applications, rather than spreading its meaning across unrelated buttons. [Action types](https://www.palantir.com/docs/foundry/action-types/overview)

Illustrative contracts:

~~~text
ProposeBillPayment(taskId, billId, sourceAccountId)
  Read permitted current context.
  Calculate amount and buffer.
  Create an exact ActionProposal with evidence references.
  Move no funds.

ApproveProposal(proposalId, proposalVersion)
  Establish the approving actor and exact scope.
  Record approval, expiry and revocation rules.
  Move no funds.

SubmitPayment(proposalId, consentId)
  Verify execution authority and effective account rights.
  Verify exact, current approval and unchanged parameters.
  Check unpaid bill, destination, current funds and constraints.
  Create or reuse the instruction for this submission identity.
  Invoke the configured trusted workflow and track acknowledgments.
~~~

Submission criteria control whether an action can be submitted; rules translate parameters into edits and effects. Checks that depend on current authoritative data must execute in the appropriate trusted service, not only when rendering a button. [Submission criteria](https://www.palantir.com/docs/foundry/action-types/submission-criteria), [Action rules](https://www.palantir.com/docs/foundry/action-types/rules)

These names describe application contracts. They are not built-in Palantir banking methods.

## 8. Consent, stale evidence and the execution boundary

In the HTML, changing the amount or selected authority clears both proposal and consent. Approval names a particular recommendation rather than every future action in the conversation.

After creating and approving the USD 115 proposal, simulate another USD 100 spend. Available funds fall to USD 1,500. Rechecking gives:

~~~text
1,500 − 115 − 900 = USD 485 < required USD 500
~~~

Submission is rejected even though the earlier calculation passed. Approval did not reserve funds.

The checkbox and role selector teach state transitions; they do not authenticate a customer. Production consent additionally needs a trusted actor, parameter binding, expiry, revocation and policy. Joint-account signing and delegated authority require explicit design.

## 9. Instructions, reservations and settlement

On valid submission, the demo reserves USD 115 once. Available funds become USD 1,485; the instruction is Queued, the bill remains Unpaid, and no new posted transaction exists.

On simulated settlement, the reservation becomes a posted debit and TXN-901 appears. Available funds stay USD 1,485: posting must not subtract the same payment again. The bill becomes Paid only after this confirmed outcome.

On definitive simulated failure, release the new reservation, leave the bill Unpaid, and require a fresh proposal and approval before retrying. The event trail retains the earlier attempt.

**A timeout is different from definitive failure.** The outcome may be unknown while the external system has already accepted or executed the request. Reconcile using the existing instruction and stable correlation/idempotency references rather than creating a blind duplicate. The local simulator does not implement an unknown-outcome path.

Current Palantir documentation distinguishes write modes and action isolation. Atomic Ontology edits do not include external calls or a bank's ledger. Snapshot isolation should not be treated as general serializability for every cross-object invariant. [Consistency and isolation](https://www.palantir.com/docs/foundry/action-types/consistency-guarantees)

Webhook and writeback-webhook patterns have different ordering and failure behavior; neither creates a general distributed transaction. [External-system action patterns](https://www.palantir.com/docs/foundry/action-types/explore-action-types)

An authoritative funds service must handle competing payments atomically. Durable deduplication, safe retries, reversal handling, reconciliation and protected audit storage are additional responsibilities. Even platform action test runs can execute required external calls; the local HTML makes none. [Action test runs](https://www.palantir.com/docs/foundry/action-types/test-run)

## 10. Governance is several separate controls

| Capability | Read-only assistant | Authorized customer workflow | Settlement integration |
| --- | --- | --- | --- |
| Read permitted account context | Scoped access | Scoped access | Minimal required subset |
| Calculate a candidate payment | May be allowed in a production design | Yes | Usually unnecessary |
| Create proposal in this demo | Denied by the teaching policy | Yes | No |
| Approve exact payment | No | Authenticated actor under policy | No |
| Submit payment | No | Only within effective rights and consent | Only if separately granted |
| Record external outcome | No | No arbitrary status editing | Narrow acknowledgment authority |

Data visibility does not imply action authority. Schema access, instance access, property visibility, task scope and execution rights must be considered separately. [Object and property policies](https://www.palantir.com/docs/foundry/object-permissioning/object-security-policies)

Mandatory controls and read-time filters have different propagation behavior. Mandatory controls propagate through derivation; object/property read filters do not automatically protect every derived output or export. Apply that distinction to model context, summaries, logs and analytics. [Access-control propagation](https://www.palantir.com/docs/foundry/security/access-control-propagation)

## 11. Applications, OSDK and grounded agents

Generated Ontology SDKs expose selected configured entities and capabilities to custom applications. They do not supply this application's banking schema automatically. Verify the generated documentation, language support and version. [Developer toolchain](https://www.palantir.com/docs/foundry/dev-toolchain)

AIP Logic supports LLM-powered functions using operational context and tools. The Ontology provides shared context and callable operations; it is not itself a language model. Review policy and autonomous execution scope are deliberate application choices. [AIP Logic](https://www.palantir.com/docs/foundry/logic)

A grounded workflow should:

1. Interpret the customer's request into a task with explicit scope.
2. Retrieve permitted objects and cite their identities and evidence versions.
3. Calculate constraints using deterministic logic where appropriate.
4. Produce a reviewable proposal, including uncertainties and excluded accounts.
5. Require the configured authorization and approval.
6. Invoke a narrow action that rechecks current state.
7. Explain the actual instruction status and confirmed outcome.

Evaluate wrong payees, stale balances, missing rights, inaccessible objects, conflicting source text, expired consent, duplicate attempts and uncertain outcomes. Structured grounding does not guarantee that every generated answer is correct.

The HTML's four journeys—balance summary, bill payment, savings transfer and lost-card response—reuse this vocabulary. Only bill payment has an executable local simulation; the others are inspectable design examples.

## 12. Compare the architectural responsibilities

These are analytical distinctions, not claims that competing technologies lack capabilities.

| Approach | Typical emphasis | Banking question to ask |
| --- | --- | --- |
| Relational database | Records, constraints, transactions | Where are shared customer meanings, rights and reusable actions defined? |
| Warehouse / lakehouse | Integrated analytical data | How fresh is the context, and how are operational changes executed? |
| BI semantic model | Reusable dimensions and measures | Can it express an exact authorized payment intent? |
| Knowledge graph | Typed entities and relationships | Where are execution, permissions and reconciliation implemented? |
| Domain services | Business operations and contracts | Are account rights and payment meanings reused consistently across apps and agents? |
| RAG | Retrieved context for a model | Are facts current, structured, permissioned and linked to authorized tools? |
| Ontology-centered application | Shared business context and configured capabilities | Which trusted services still own money movement and authoritative state? |

## 13. Study path and capstone

Use seven sessions of 45–60 minutes: vocabulary; identity and cardinalities; sources and queries; functions and actions; governance and reliability; agents and SDKs; presentation and defense.

Extend this same banking model with one of:

- A joint account requiring multiple approvals.
- A transfer between authorized checking and savings accounts.
- A lost-card freeze with uncertain processor acknowledgment.
- A recurring bill with changed amount and expired consent.

Deliver explicit identities, cardinalities, one interface candidate, two object-set queries, a reusable calculation, an action contract, a permission matrix, source ownership rules and external failure states.

Score each dimension 0–2: missing, plausible, or justified and tested.

| Dimension | Strong evidence |
| --- | --- |
| Identity and grain | Stable account keys, separate observations and relationship rights. |
| Relationships | Cardinalities explain joint accounts and multiple payment attempts. |
| Source ownership | Authority, freshness and edit reconciliation are explicit. |
| Logic | Integer cents, commitments and buffers have clear assumptions. |
| Action | Preconditions, edits, effects and rejection paths are defined. |
| Governance | Read access, signing authority and exact consent are distinct. |
| Reliability | Competing payments, duplicates, unknown outcomes and reversal are addressed. |
| AI boundary | Scoped tools, grounded proposals and meaningful evaluations are specified. |

A useful teaching target is 12/16 with no missing governance or reliability dimension. This is not an official certification standard.

## 14. What the offline demo establishes

The guide demonstrates one internally consistent banking story across seven HTML chapters and five Markdown documents. The same in-memory payment state appears in the banking page, overview, explorer and payment lifecycle page. Schema mode and search cover all sixteen candidate types. The quiz tests eight banking concepts.

The browser is not a production security boundary. The simulator has no bank connection, live AI, real authentication, distributed transaction, durable ledger, persistent consent, expiry enforcement or immutable audit store. Refresh starts over. Optional research links open only when the user follows them.

See [IMPLEMENTATION.md](IMPLEMENTATION.md) for verification evidence and remaining browser-testing limits.
