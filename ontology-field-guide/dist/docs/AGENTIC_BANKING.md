# Agentic everyday banking: an Ontology worked example

This is a fictional application design for studying Palantir Ontology concepts. It is not a Palantir banking template, a description of a particular bank, or a claim that Foundry provides a payment ledger. All amounts, policies and identities are invented. Read it offline alongside the **Agentic banking** chapter in `../index.html`.

## 1. Begin with a customer intent

> “Pay my electricity bill, keep enough for rent, and leave a $500 buffer.”

The request contains an action, a target, and constraints. A language model can interpret those words, but interpretation does not establish account rights, reliable balances, a verified payment destination, or settlement. The application needs named business objects and governed actions for those facts and transitions.

The Ontology provides the modeled business context and configured capabilities. An agent queries that context, reasons within a task scope, proposes an action, and invokes permitted tools. Trusted systems enforce the business rules. An external payment service and ledger remain distinct systems unless explicitly integrated.

## 2. The everyday objects

| Object type | Example instance | Why give it identity? |
|---|---|---|
| Customer | CUS-001, Alex Morgan | A stable business identity with preferences; separate from a login/session. |
| Account | ACC-101, everyday checking | A persistent account with currency, status and product characteristics. |
| AccountOwnership | OWN-001, Alex is an authorized owner of ACC-101 | Roles, signing rights and effective dates belong to the relationship; supports joint accounts. |
| BalanceSnapshot | BAL-101, version 7 | A time-specific observation with available, ledger and held amounts, source and freshness. |
| Transaction | TXN-900, posted salary | A recorded movement with amount, currency, posting time and source reference. |
| Card | CARD-401, masked ending 4821 | A payment instrument with lifecycle, account association and controls. |
| Merchant | MER-008, Corner Market | A normalized merchant identity for transaction context and spending summaries. |
| Payee | PAY-201, City Energy | A payment destination with verification status; different from a merchant label in transaction text. |
| Bill | BILL-301, electricity USD 115 | A payable obligation with due date, amount, currency and status. |
| RecurringCommitment | COM-501, upcoming USD 900 rent | Expected cash outflow with date, confidence and funding account. |
| SavingsGoal | GOAL-601, keep USD 500 | A customer constraint with provenance; does not itself authorize a transfer. |
| AgentTask | TASK-701, pay electricity | Request, objective, allowed tools, scope, requesting customer and lifecycle. |
| ActionProposal | PROP-001, exact USD 115 payment | A reviewable proposed change with parameter version, rationale and evidence references. |
| Consent | CONS-001, approval of PROP-001 | Approval with actor, exact scope, timestamp, expiry and revocation state. |
| PaymentInstruction | PI-001, submit one payment | A command with source, destination, amount, currency, idempotency key and processing status. |
| AuditEvent | EVT-001, proposal approved | Traceable actor, correlation IDs, outcome, time and policy decision. |

The demo shows six objects in its graph and all sixteen types in its catalog. Production identifiers must be stable and namespaced to source systems. Do not use a display name or masked account number as a unique primary key.

Not every noun needs its own object. Currency can start as an Account property. Status can be an enum. Promote something to an object when it has independent identity, history, lifecycle, permissions or relationships. In particular, AccountOwnership deserves a relationship object when it carries signing rights and effective dates.

## 3. Links explain customer context

```text
Customer --has rights through--> AccountOwnership --for--> Account
Account --observed by--> BalanceSnapshot
Account --records--> Transaction --at--> Merchant
Account --funds--> Card
Customer --has--> RecurringCommitment
Customer --sets--> SavingsGoal

Customer --requests--> AgentTask --targets--> Bill --issued by--> Payee
AgentTask --creates--> ActionProposal --approved by--> Consent
ActionProposal --submitted as--> PaymentInstruction
PaymentInstruction --debits--> Account
PaymentInstruction --pays--> Payee
PaymentInstruction --settles as--> Transaction
PaymentInstruction --satisfies--> Bill
AuditEvent --references--> task / proposal / consent / instruction
```

A customer may have multiple accounts and an account may have multiple authorized people. One account has many transactions and balance observations. One bill may need several attempts, but a failed attempt is not a successful payment. The simple demo permits one exact full payment; partial payments, refunds, reversals and shared signing rules need additional lifecycle design.

The diagram's arrows express this explanation. Palantir link types support traversal from their configured sides; the drawing does not mean every API relationship is one-way.

## 4. Four daily journeys

| Customer request | Context objects | Agent reasoning | Candidate action types |
|---|---|---|---|
| “What can I spend today?” | AccountOwnership, Account, BalanceSnapshot, RecurringCommitment | Distinguish available funds from estimated surplus; disclose observation time and uncertain commitments. | ReadBalances, SummarizeCashFlow |
| “Pay my electricity bill.” | Bill, Payee, Account, AgentTask, ActionProposal, Consent, PaymentInstruction | Match the obligation and verified destination; check rights, constraints and duplicate attempts. | ProposeBillPayment, ApproveProposal, SubmitPayment, RecordSettlement |
| “Move spare cash to savings.” | Two Accounts, AccountOwnership, SavingsGoal, RecurringCommitment | Compute surplus, then propose exact source, target, currency and amount. | CalculateSurplus, ProposeTransfer, SubmitTransfer |
| “I lost my card.” | Card, Account, AgentTask, ActionProposal, AuditEvent | Identify the masked card; distinguish a reversible freeze from replacement or closure. | ReadCardStatus, ProposeCardFreeze, FreezeCard |

Only the bill-payment journey executes simulated actions in the HTML. The other journeys are inspectable design examples. There is no live LLM; the demonstration's reasoning and rules are deterministic.

## 5. Walk the bill payment from request to outcome

### Observe

The balance snapshot reports ledger USD 1,700, existing holds USD 100, and available USD 1,600. Rent is a known upcoming USD 900 commitment. The requested buffer is USD 500. The bill is USD 115 and the existing payee destination is verified. Savings of USD 4,200 are outside the task's spending scope.

This deliberately simplified rule produces:

```text
remaining after bill and rent = 1,600 − 115 − 900 = USD 585
required buffer = USD 500
headroom above the buffer = USD 85
```

The USD 900 rent is a planning constraint, not a second ledger hold in this simulation. Real systems must avoid counting a commitment twice if an existing hold already represents it. No inference about future salary or overdraft is used to make the rule pass.

### Propose

Create an ActionProposal naming ACC-101, PAY-201, BILL-301, USD 115, currency USD, the observed balance version and rationale. This calculation changes no funds. A proposal is an object; `ProposeBillPayment` is an action type or application capability that creates it.

### Approve

The customer reviews and approves the exact proposal. Editing the amount or execution authority invalidates the proposal and consent. Reading account data does not grant payment authority. A production consent object should bind all relevant parameters, version, actor, expiry and policy, and require authentic confirmation on a trusted channel. The local checkbox demonstrates the state transition only.

### Recheck and submit

Submission checks the current local role, exact bill amount, unpaid state and remaining buffer. Use **Simulate another $100 card spend** after approval: current funds fall to USD 1,500; the remaining amount becomes USD 485, so submission is rejected even though the earlier proposal passed. Approval is not a reservation or a guarantee of future balance.

On a valid submission, create a queued PaymentInstruction, reserve USD 115 once, and attach a stable idempotency key to that proposal's submission. Available funds become USD 1,485. The bill remains unpaid and there is no posted transaction for it yet. Repeated submit is blocked.

### Reconcile

**Simulate settlement:** the confirmed result changes the instruction to Settled, converts the reservation into a posted USD 115 debit, creates TXN-901 and marks the bill Paid. Available funds remain USD 1,485: settlement must not deduct the amount again.

**Simulate failure:** this means a definitive failure acknowledgment, not a timeout. Release the USD 115 reservation; available funds return to USD 1,600, the bill remains unpaid, and retry requires a new proposal and consent. The prior attempt remains in the local event trail.

An unknown outcome requires a separate Pending/Unknown reconciliation path. Do not release funds or submit a new payment merely because a request timed out. Query the existing instruction using its correlation and idempotency references. The browser demo does not implement this path.

## 6. Map the example to Palantir concepts

| Ontology concept | Banking interpretation |
|---|---|
| Object type / instance | Account / ACC-101; Bill / BILL-301. |
| Properties | Account currency, bill amount, instruction status. |
| Link types | Customer's authorized accounts; instruction's source account and target bill. |
| Object sets | Unpaid bills for one customer's accounts due within a chosen window. |
| Functions | Calculate projected surplus or rank possible funding accounts within authorized scope. |
| Action types | Submit a permitted payment intent with explicit parameters, criteria and effects. |
| Read governance | Restrict which customer's accounts and which properties the execution identity can see. |
| Action governance | Check payment rights, task scope and current constraints at execution. |
| AIP / application tools | Expose selected queries and actions to the workflow; model output does not confer authority. |
| External integration | Explicit payment-service request and acknowledgment, followed by reconciliation. |

An Ontology action's atomic object edits do not make a bank ledger and external payment rail part of the same transaction. Define which system owns authoritative balances, holds, posting, bill state and instruction status. Use explicit integration and reconciliation rather than assuming source records update when an Ontology property changes.

Candidate tool contracts might be `readCustomerContext(customerId)`, `proposeBillPayment(taskId, billId, accountId)` and `submitApprovedPayment(proposalId, consentId)`. These are illustrative application contracts, not existing Palantir SDK method names. Return structured references and policy outcomes; do not grant a model a generic unrestricted write tool.

## 7. Production design questions

- **Authority:** who is the requesting customer, authenticated actor and tool execution identity? Which account rights are actually effective now?
- **Freshness and concurrency:** where are balances rechecked and funds atomically reserved? A browser check cannot protect against competing payments.
- **Ledger ownership:** which trusted service posts money movements and prevents double debit? Keep source-of-truth ownership explicit.
- **Consent:** what exact source, payee, amount, currency and time scope were approved? Can approval expire or be revoked?
- **Idempotency:** how is the same submission recognized across retries, processes and restarts? A new key must not silently duplicate an uncertain prior attempt.
- **Uncertainty:** how are delayed acknowledgments, partial outcomes, reversals and reconciliation exceptions represented?
- **Grounding:** are inferred commitments clearly distinguished from confirmed ones? Which evidence produced each recommendation?
- **Privacy:** can queries traverse into someone else's objects? Are sensitive properties minimized in model context, logs and derived outputs?
- **Evaluation:** test wrong payee, stale balance, expired consent, missing signing rights, duplicate submission, unknown outcome and external failure.

These are design questions, not a jurisdiction-specific banking compliance checklist. This example does not implement authentication, consent expiry, distributed reservation, durable idempotency, a ledger, payment processing or immutable audit storage.

## 8. Five-minute presentation

1. Open the banking chapter locally. Read the customer's request, select Account and Bill in the graph, and explain type versus instance.
2. Switch the four request examples. Point out the shared objects and the different permitted actions.
3. Create a payment proposal. Show USD 585 remaining after rent against a USD 500 buffer. Explain why a proposal has changed no funds.
4. Approve, then simulate the USD 100 spend. Submit and show rejection from current data. Reset.
5. Propose and approve again. Submit once. Show Queued, Unpaid, USD 115 reserved and no posted transaction.
6. Simulate settlement. Show Paid and TXN-901; available funds stay USD 1,485. Explain the external acknowledgment boundary.
7. Reset and repeat with failure. Funds are released, the bill is unpaid, and retry needs new approval.

## 9. Check your understanding

1. Why should PaymentInstruction and Transaction be different types? **One records an accepted command; the other records a posted outcome.**
2. Why might AccountOwnership be an object rather than a simple link? **The relationship has rights, roles and effective dates of its own.**
3. Why can an approved proposal fail at submission? **Current funds, rights or other preconditions may have changed.**
4. Why does settlement not subtract another USD 115 from available funds? **The payment already reserved that amount; posting replaces the reservation.**
5. Why is a timeout different from definitive failure? **Money movement may already have occurred; reconcile the existing attempt before retrying.**
6. Which parts are Palantir concepts and which are application design? **Objects, links, functions, actions and governance are platform concepts. These banking types, policy rules and tools are this example's design.**

## Optional primary-source reading

No links are fetched automatically. Banking behavior above is original illustrative design; these sources support the underlying Ontology concepts.

- [Object types](https://www.palantir.com/docs/foundry/object-link-types/object-types-overview)
- [Action types](https://www.palantir.com/docs/foundry/action-types/overview)
- [Submission criteria](https://www.palantir.com/docs/foundry/action-types/submission-criteria)
- [Consistency and isolation](https://www.palantir.com/docs/foundry/action-types/consistency-guarantees)
- [External-system action patterns](https://www.palantir.com/docs/foundry/action-types/explore-action-types)
- [AIP Logic](https://www.palantir.com/docs/foundry/logic)

Continue with the [full study guide](STUDY_GUIDE.md) and [research evidence map](RESEARCH.md).
