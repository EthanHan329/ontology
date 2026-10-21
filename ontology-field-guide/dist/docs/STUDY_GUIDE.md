# Palantir Ontology: a practical study guide

Independent research and teaching material · Reviewed **21 October 2026**

This guide studies Palantir Foundry's Ontology and its relationship to applications, data integration, and AIP. It accompanies the interactive **Ontology Field Guide**. All supply-chain entities, amounts, policies, and outcomes in the demo are fictional. This is a conceptual implementation in plain HTML and JavaScript, not a Palantir application.

## 1. Start with the operational question

Imagine a shipment of power modules is delayed. A logistics team knows the shipment, a warehouse team knows alternate inventory, and a sales team knows customer commitments. Each team may have accurate records yet still struggle to agree on a decision.

The useful question crosses all three systems:

> Which commitments are threatened, what alternatives are feasible, and who can authorize a change?

Palantir describes the Ontology as an operational layer over integrated datasets and models. It connects digital assets to business entities and combines semantic structure with behavior. Applications can use that shared contract rather than defining their own competing business vocabulary. [Ontology overview](https://www.palantir.com/docs/foundry/ontology/overview)

A helpful learning decomposition is:

- **Semantics:** what exists and how it relates.
- **Behavior:** how to calculate, predict, and change state.
- **Governance:** which identities may read data or perform operations.
- **Feedback:** how the system records decisions and observes outcomes.

The last two are architectural concerns, not merely decorations on a graph.

## 2. Vocabulary you must distinguish

| Concept | Meaning | Original example |
| --- | --- | --- |
| Object type | Definition of an entity or event | `CustomerOrder` |
| Object | Particular instance of a type | `ORD-1042` |
| Property | Characteristic defined on a type | `dueDate`, `status`, `quantity` |
| Link type | Definition of a relationship between types | OrderLine requires Part |
| Link | Particular relationship between objects | Line `1042-1` requires `P-24` |
| Action type | Reusable definition of an allowed operation | `ReallocateInventory` |
| Action | Particular submission of that operation | Allocate 180 units for `ORD-1042` |
| Function | Executable business logic | Compute endangered commitments |
| Object set | Collection described through queries or selection | Late, unallocated order lines |
| Interface | Abstract contract implemented by compatible types | `Locatable` |

The distinction between a schema definition and an instance prevents a surprisingly common modeling mistake: creating a new type for every customer or region. Customer and region values usually belong on instances; different types need a substantive difference in identity, properties, or behavior. [Core concepts](https://www.palantir.com/docs/foundry/ontology/core-concepts)

### Identity is a design decision

A primary key must represent the identity you intend to preserve. A changing display name is a poor identity. `inventoryId = warehouseId + partId` can be sensible if the business grain is one part at one warehouse, but is insufficient if stock is tracked by lot, condition, owner, or reservation class.

In OSv2, source keys must be unique under the documented transaction rules, and source/schema types must cohere. Duplicate keys can fail indexing or replace an earlier value across transactions. This is why a good semantic model still depends on careful data engineering. [Indexing restrictions](https://www.palantir.com/docs/foundry/object-indexing/data-restrictions)

### Links are navigable business relationships

A link type has two sides. From a part you can find its orders; from an order you can find its part. This does not require defining an independent reverse link type. Backing arrangements vary: a foreign key can support a one-to-many relationship, while a many-to-many relationship can use a join datasource. [Link types](https://www.palantir.com/docs/foundry/object-link-types/link-types-overview)

A graph is a useful view of those relationships. Do not infer from that view that every platform capability is just a graph query.

## 3. Design a richer supply-chain model

The HTML graph intentionally has five types to keep the first encounter legible. The following is an original, more production-like design. It is a design exercise, not a Palantir-prescribed schema.

| Type | Identity / grain | Important properties | Important links |
| --- | --- | --- | --- |
| Supplier | One supplier | name, risk status | supplies Part; dispatches Shipment |
| Part | One catalog part | unit, description | appears on OrderLine and ShipmentLine |
| Shipment | One shipment | expectedArrival, status | contains ShipmentLine |
| ShipmentLine | One part line in a shipment | quantity | belongs to Shipment; carries Part |
| Warehouse | One facility | location, operating status | holds InventoryPosition |
| InventoryPosition | Part + warehouse + relevant lot dimensions | available, reserved, condition | concerns Part; held at Warehouse |
| Customer | One customer | name, service class | places CustomerOrder |
| CustomerOrder | One customer commitment | promisedDate, priority | contains OrderLine; placed by Customer |
| OrderLine | One line in one order | requestedQuantity, unitValue | requires Part; belongs to CustomerOrder |
| Allocation | One inventory reservation decision | quantity, status, reason, time | reserves InventoryPosition; fulfills OrderLine |

### Why Allocation deserves an object

If you need quantity, approval status, expiry, or a reason on a relationship, a first-class allocation object is often clearer than a bare link. It lets operators inspect and modify the decision and supports partial allocation, cancellation, and history.

### Cardinality exercise

- One order contains many order lines; each line belongs to one order.
- One part appears on many order lines; each line requires one part in this simplified design.
- One inventory position can support many allocations; each allocation reserves one position.
- One order line can be fulfilled by several allocations.

If a shipment carries multiple parts, putting a single `partId` on Shipment loses information. Introduce ShipmentLine. If lots carry different restrictions, a warehouse-level quantity loses decision-critical distinctions.

### Interfaces and shared meaning

An interface could express a common `Locatable` contract for Warehouse and Supplier, or an `OperationalAlert` contract across delay and maintenance alerts. Concrete types implement the abstract contract. Interfaces are not directly instantiated. Interface capabilities and language support evolve; inspect the support matrix for the selected application and SDK. [Interfaces](https://www.palantir.com/docs/foundry/interfaces/interface-overview)

## 4. From sources to object state

An original conceptual pipeline for this case:

```text
ERP supplier / order records ─┐
WMS stock snapshots ──────────┼─ reconcile IDs and business grain
TMS shipment events ─────────┘              │
                                          ▼
                         map properties and relationships
                                          │
                                          ▼
                               index queryable objects
                                          │
                     source values + configured user edits
                                          │
                                          ▼
                               effective object state
```

This picture intentionally abstracts implementation services and storage configuration. User edits and datasource refreshes are distinct inputs. You must define which properties are editable, how updates interact, and how deletions or changed source records are reconciled. Review the storage-specific behavior rather than assuming a generic table `UPDATE`. [How edits are applied](https://www.palantir.com/docs/foundry/object-edits/how-edits-applied)

Original design questions to resolve before building:

1. Is available stock a source-owned measurement, an application-owned ledger, or a derived value?
2. Does the ERP reserve stock first, or does Foundry record intent and integrate afterward?
3. How fresh must inventory be before a planner can act?
4. What represents an external acknowledgment versus a locally accepted request?
5. How will cancellation and replay behave?

These choices determine correctness. A beautiful object model cannot repair ambiguous source ownership.

## 5. Query the business context

A useful object-set query expresses a business condition and traverses established links. Functions APIs support filtering, search-around traversal, and aggregation. Exact syntax and query capabilities are version-specific; the TSv1 reference is useful for concepts, not a universal OSDK recipe. [Object sets](https://www.palantir.com/docs/foundry/functions/api-object-sets)

Original pseudocode, deliberately not executable SDK syntax:

```text
shipment = find Shipment by shipmentId
parts = traverse shipment -> shipmentLines -> part
lines = find OrderLine requiring any of parts
threatened = lines where revisedArrival > promisedDate
inventory = traverse parts -> inventoryPositions
eligible = inventory where available > 0 and condition == approved
return threatened grouped by customerOrder, plus eligible alternatives
```

Questions that improve the query:

- Does an order already have a confirmed allocation from another warehouse?
- Are all order lines required before the order can ship?
- Does available inventory exclude reservations?
- Is the alternative route able to arrive before the promise?
- Does the user have access to every object needed for the calculation?

Avoid interpreting an empty result as proof of “no exposure” without considering data coverage, freshness, and permission filtering.

## 6. Logic, functions, and models

A function can take objects or sets, calculate a result, and be reused by applications. Functions reading object data are not a separate fundamental kind of resource; “functions on objects” describes their use. [Functions on objects](https://www.palantir.com/docs/foundry/functions/functions-on-objects)

An original progression of increasing sophistication:

1. **Business rule:** earliest due order gets inventory first.
2. **Scoring function:** rank by lateness, service commitments, and priority.
3. **Optimization:** choose allocations across routes, capacities, and constraints.
4. **Prediction:** estimate arrival distributions or supplier risk.
5. **Operational evaluation:** compare predictions and choices against observed outcomes.

Foundry models can represent forecasts, machine learning, optimization, physical models, or business rules and can be operationalized with applications and functions. A prediction is an input to a decision, not automatically an authorization to execute it. [Models](https://www.palantir.com/docs/foundry/model-integration/models)

### The demo's exact calculation

This is a transparent toy policy, not a trained model or optimizer.

| Order | Quantity | Due day | Revenue |
| --- | ---: | ---: | ---: |
| ORD-1042 | 180 | 3 | $72,000 |
| ORD-1043 | 140 | 5 | $56,000 |
| ORD-1044 | 100 | 7 | $40,000 |

- Inbound arrival = day 2 + selected delay.
- An order is endangered if arrival is strictly later than its due day.
- Eligible late orders are considered by due day.
- A whole order is protected only when remaining alternate units cover it.
- A skipped order does not consume units; later smaller orders can still be protected.
- Remaining exposed revenue sums the values of unprotected late orders.
- Transport cost = all selected allocation units × $12, including any unused surplus.
- Maximum alternate stock is 320. The slider goes to 420 so you can test rejection.

At the default three-day delay, arrival is day 5. Only ORD-1042 is late: ORD-1043 is due on day 5 and therefore on time under this rule. Allocating 180 units protects ORD-1042 at $2,160. Allocating 320 units protects the same order at $3,840. **More allocation is not necessarily a better decision.**

At a five-day delay, arrival is day 7. ORD-1042 and ORD-1043 are late, totaling $128,000. Allocating 320 protects both at a cost of $3,840. With a seven-day delay all three are late; 320 protects the first two and leaves $40,000 exposed.

Revenue exposure is not profit or realized loss. This toy model omits partial shipments, lead time for alternate transport, costs of disruption, and probabilistic arrivals.

## 7. An action is a business operation

An action type defines a reusable bundle of changes, parameters, rules, and possible effects. Applications submit particular actions against that definition. This centralizes the meaning of an operation such as “reallocate inventory” instead of distributing its rules across individual screens. [Action types](https://www.palantir.com/docs/foundry/action-types/overview)

Original action design:

```text
ReallocateInventory
  Inputs:
    inventoryPosition, targetOrderLines, quantities, decisionReason
  Authorization:
    designated planner may submit for this operational scope
  Preconditions:
    quantities are positive whole units
    current available stock covers the requested total
    each target is eligible for the selected stock
    reason satisfies policy
  Ontology edits:
    create Allocation records
    update reservation state according to the stock ownership model
    record the decision's local acceptance status
  External workflow:
    send a reservation or fulfillment request through configured integration
    record acknowledgment, rejection, or retry state separately
```

Submission criteria control whether submission is allowed; rules turn parameters into edits or effects. Some checks belong in the action logic so they evaluate current authoritative data. A disabled button alone is not enforcement. [Submission criteria](https://www.palantir.com/docs/foundry/action-types/submission-criteria), [Action rules](https://www.palantir.com/docs/foundry/action-types/rules)

### The demo policy

Planner: may apply. Analyst: may read but submission is rejected. Quantity must be positive, integer, and no more than 320. The reason must contain at least eight characters. Apply changes local inventory, records order allocations, and appends a simulated external request. Reset starts a new browser simulation. Refreshing clears the simulation.

This is a teaching policy in client-side code. It provides no real authentication or security boundary.

## 8. Transactions and external systems

Current action documentation describes an atomic batch of Ontology edits. It distinguishes batched writes from staged writes and describes configurable isolation levels. The atomicity guarantee does **not** include external calls, notifications, or webhooks. Snapshot isolation includes object-level write conflict checks, but should not be treated as general serializability for every multi-object business invariant. [Consistency and isolation](https://www.palantir.com/docs/foundry/action-types/consistency-guarantees)

A side-effect webhook runs after object edits; a writeback webhook runs before other rules and can block the edits if the request fails. These orderings are useful, but do not create a distributed transaction with the external system. [External-system action patterns](https://www.palantir.com/docs/foundry/action-types/explore-action-types)

Original reliability design recommendations:

- Distinguish `Proposed`, `AcceptedLocally`, `SubmittedExternally`, `Confirmed`, and `Failed`.
- Use stable request identities and idempotent external endpoints where possible.
- Retry transient failures and investigate terminal rejection.
- Reconcile the external system's state back into the operational view.
- Prevent a stale screen from authorizing an impossible reservation.
- Test two planners racing to reserve the last stock.
- Decide how to release or compensate a reservation if fulfillment fails.

Do not assert that these mechanisms appear automatically because an action type exists. They are implementation responsibilities.

**Platform testing nuance:** an action test run can still execute required external calls, even when some side effects are skipped. Read the documented behavior before using test runs against real systems. The local HTML demo never makes such a call. [Action test runs](https://www.palantir.com/docs/foundry/action-types/test-run)

## 9. Security is several questions

Separate schema access, instance access, property visibility, and authority to submit changes. Object security policies can govern individual object reads; property policies add conditions for selected properties. Their conjunction can control individual cells. [Object and property policies](https://www.palantir.com/docs/foundry/object-permissioning/object-security-policies)

Mandatory controls and discretionary read filters have different propagation behavior. Mandatory controls travel through derivation; object and property read policies do not automatically protect downstream outputs or exports. Design derived outputs and exports with that distinction in mind. [Access-control propagation](https://www.palantir.com/docs/foundry/security/access-control-propagation)

An original access matrix for this case:

| Capability | Analyst | Planner | Integration identity |
| --- | --- | --- | --- |
| Read permitted shipment and inventory | Yes | Yes | Scoped to integration |
| Preview allocation | Yes | Yes | Usually unnecessary |
| Apply allocation | No | Within authorized scope | Only if explicitly granted |
| Read restricted commercial fields | Per policy | Per policy | Minimal required subset |
| Update ERP acknowledgment | No | Usually no | Yes, narrowly scoped |

A production implementation must enforce this on trusted services. The demo's role selector only demonstrates the distinction.

## 10. Applications, OSDK, and AIP

Workshop supports operational application building; custom applications can use generated Ontology SDKs. Developer Console provides Ontology-specific access and documentation for selected entities. OSDK enables object access, actions, and functions; supported languages and capabilities vary. [Developer toolchain](https://www.palantir.com/docs/foundry/dev-toolchain)

AIP Logic builds LLM-powered functions using operational context and tools. It supports testing and monitoring, and workflows may apply edits automatically or stage them for human review. The Ontology supplies structured business context and callable operations; it is not itself the LLM. [AIP Logic](https://www.palantir.com/docs/foundry/logic)

Original grounded assistant design:

```text
Question: Which orders should we protect from this disruption?

Read tools:
  find delayed shipments
  traverse affected order lines
  inspect eligible inventory

Calculation tool:
  evaluate feasible allocation plans

Proposal output:
  referenced object IDs
  quantities, cost, threatened revenue
  data timestamps, assumptions, unresolved constraints

Execution boundary:
  human reviews proposal if this workflow requires it
  authorized action revalidates current state
  integration acknowledgment is tracked separately
```

Evaluation should include incomplete data, hidden objects, conflicting instructions in source text, unavailable tools, infeasible quantities, and misleading explanations. Structured grounding reduces some ambiguity; it does not establish that a generated answer is correct.

## 11. Comparisons that sharpen the concept

The following comparisons are analytical teaching distinctions, not claims that other technologies lack these capabilities. Real platforms overlap.

| Approach | Typical emphasis | Question to ask when comparing |
| --- | --- | --- |
| Relational database | Persistent records, constraints, and queries | Where do shared operational meanings and application actions live? |
| Warehouse / lakehouse | Integrated analytical data and computation | How are operational edits and execution integrated? |
| BI semantic model | Reusable dimensions, measures, and definitions | Can the model express an authorized business change? |
| Knowledge graph | Typed entities and connected relationships | How are actions, identity, permissions, and operational workflows provided? |
| Digital twin | Representation of some real-world system | How fresh, authoritative, and executable is that representation? |
| Domain model / service API | Business concepts and operations in software | How consistently is it reused across data, tools, and applications? |
| RAG | Retrieval of context for a language model | Are retrieved facts current, structured, permissioned, and actionable? |

The useful architectural evaluation is the total system: data preparation, model quality, access enforcement, query behavior, execution, interoperability, and operating cost.

## 12. Common mistakes

1. Modeling source tables literally instead of identifying business grain.
2. Using names as stable primary keys.
3. Hiding quantities or state in an ambiguous relationship.
4. Treating an exposed property as trustworthy despite stale data.
5. Confusing a function's result with a committed action.
6. Assuming an action success message proves an ERP update.
7. Assuming all access policies propagate to exported data.
8. Giving an AI workflow broad tool authority because it can explain a plan.
9. Treating a browser policy demonstration as production enforcement.
10. Copying SDK code without checking its generation and version.

## 13. Seven-session learning plan

Allocate 45–60 minutes per session.

1. **Vocabulary:** explain each concept in section 2 using a new domain.
2. **Modeling:** draw the richer schema and defend each identity and cardinality.
3. **Sources and queries:** map sample ERP/WMS/TMS records and trace a threatened order.
4. **Behavior:** write preconditions, edits, postconditions, and failures for an action.
5. **Governance:** design an access matrix and race/failure tests.
6. **AI and applications:** define a grounded tool workflow and evaluation cases.
7. **Demonstration:** present the five-minute script, answer the quiz, and revise your model.

## 14. Capstone and assessment

Choose a hospital bed-allocation workflow, aircraft maintenance disruption, or energy equipment outage. These are original study prompts, not documented customer implementations.

Deliver a model with at least five types, explicit identity/grain, cardinalities, one interface candidate, two object-set queries, a reusable calculation, a governed action, source ownership rules, and external failure states.

Score each dimension from 0 to 2: missing, plausible, or explicitly justified and tested.

| Dimension | A strong answer |
| --- | --- |
| Identity and grain | Survives updates and prevents ambiguous duplicates |
| Relationships | Cardinalities reflect real business constraints |
| Data ownership | Source truth, freshness, and edit reconciliation are clear |
| Logic | Assumptions, units, and constraints are explicit |
| Action | Preconditions, edits, postconditions, and errors are defined |
| Security | Read, property, and execution authority are distinct |
| Reliability | Races, retries, external failure, and reconciliation are addressed |
| AI boundary | Grounding, execution authority, and evaluation are specified |

A strong design earns at least 12/16 with no missing security or reliability dimension. This is a teaching rubric, not an official certification standard.

See [RESEARCH.md](RESEARCH.md) for the evidence map, [DEMO_SCRIPT.md](DEMO_SCRIPT.md) for presentation steps, and [IMPLEMENTATION.md](IMPLEMENTATION.md) for local behavior and verification.
