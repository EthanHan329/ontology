# A five-minute agentic banking Ontology demonstration

Audience: people studying Palantir Ontology through everyday banking. Every chapter uses the same fictional customer, accounts, bill, payee and payment lifecycle. All data and policy are teaching examples.

Open the local HTML file, dist/index.html. No server, installation, account or internet connection is required. The demo is deterministic, with no live AI or bank integration.

## 0:00–0:35 — Start with customer intent

Open **Everyday banking**.

“Alex says: pay my electricity bill, keep enough for rent, and leave a USD 500 buffer. An agent needs more than words. It needs a customer, account rights, a current balance, a bill, a verified destination and permission to act.”

Switch the request selector between balance summary, bill payment, savings transfer and lost-card response. All four reuse the same business vocabulary. Only bill payment executes simulated actions.

## 0:35–1:05 — Explain the mental model

Open **The mental model**.

Point to semantics, kinetics and governance.

“Objects tell us what exists. Functions and actions tell us what we can calculate and change. Governance tells us whose data we can see and which operations we may execute.”

Select Account and Bill in the graph. Explain that the graph is a simplified view, not the complete schema.

## 1:05–1:45 — Separate type from instance

Open **Banking objects**.

Inspect Account ACC-101, switch to **Type definitions**, and show accountId, currency and ledgerCents. Search for Consent and inspect proposalId, approvedAt and expiresAt. Return to instances and search for BILL-301.

“Account is a type; ACC-101 is one instance. AccountOwnership has rights and effective dates of its own. A payment instruction is a command, while a transaction is a posted outcome.”

The explorer covers sixteen candidate types. The six-node diagram uses a direct ownership edge as shorthand for the AccountOwnership object.

## 1:45–2:35 — Calculate, then test authority

Open **Payment lifecycle**, and reset if necessary.

Show the initial USD 1,600 available balance, USD 115 bill, USD 900 rent and USD 500 buffer.

“After bill and rent, USD 585 remains. That exceeds the buffer by USD 85. This is a transparent calculation, not a prediction.”

Choose **Read-only assistant**, then **Create proposal**. Show the denial.

“Being able to see a balance does not grant payment authority.”

Choose **Customer with payment authority**, create a proposal and review the exact account, payee, amount and bill. Check the approval box.

## 2:35–3:10 — Make stale evidence visible

Click **Simulate another $100 card spend**, then submit.

“The earlier proposal passed, but funds changed. Now USD 1,500 minus 115 minus 900 leaves USD 485. The action must recheck current state and reject the buffer breach.”

The bill remains unpaid; no instruction is submitted.

Reset the banking demo before proceeding.

## 3:10–4:00 — Submit once, then reconcile

Create and approve a fresh proposal. Submit.

Show:
- Available funds USD 1,485.
- New reservation USD 115.
- Instruction Queued.
- Bill Unpaid.
- No posted transaction for the bill.

“The request is accepted locally, but settlement is pending. A queued instruction is not proof of payment.”

Navigate briefly to **The mental model** or **Banking objects**. Inspect Account and Bill to show the same state. Return to **Payment lifecycle** and simulate settlement.

Show Settled, Paid and TXN-901. Available funds remain USD 1,485.

“Posting replaces the reservation. It must not deduct the same amount twice.”

## 4:00–4:35 — Explain the failure boundary

Reset, propose, approve and submit again. Simulate failure.

Show USD 1,600 restored, the bill Unpaid, no posted transaction, and fresh approval required for retry.

“This control means definitive failure. A timeout is different: the outcome may be unknown, so reconcile the existing instruction before retrying.”

Open **Banking architecture**. Point to the separate sources, object model, decision layer and payment service / ledger.

“Ontology object edits and external money movement do not share an automatic distributed transaction.”

## 4:35–5:00 — Test and extend the model

Open **Test your understanding**. Answer one consent or settlement question. Show the eight checks and the seven-session study path.

Open **Research & evidence** and the Markdown study guide.

“The sources establish Ontology primitives. The sixteen banking types, USD 500 buffer and tool contracts are our application design. The local simulator is not a security boundary or payment system.”

## Rehearsal reference

| Scenario | Available funds | Remaining after bill and rent | Expected result |
| --- | ---: | ---: | --- |
| Initial observation | USD 1,600 | USD 585 | Proposal permitted for the authorized customer. |
| Another USD 100 spend | USD 1,500 | USD 485 | Rejected at current-state check. |
| Valid queued payment | USD 1,485 | Reservation already counted | Bill unpaid, USD 115 reserved, no posting yet. |
| Confirmed settlement | USD 1,485 | Do not debit again | Reservation converted to posted TXN-901; bill paid. |
| Definitive failure from baseline | USD 1,600 | No new payment debit | Reservation released; bill unpaid. |

## Questions to be ready for

**Is the agent live?** No. The workflow uses deterministic local rules and fictional data.

**Is this Palantir software?** No. It teaches platform concepts using a standalone HTML application.

**Can a read-only assistant ever propose?** A production design may permit nonexecuting proposals. This demo's simpler teaching policy denies proposal creation to that role.

**What happens if I change the amount after approval?** The proposal and consent are cleared. This action only pays the exact USD 115 bill.

**Does source data update automatically?** No. External updates require explicit integration and source ownership rules.

**Does this implement production payment safety?** No. Trusted authorization, atomic funds reservation, durable idempotency, ledger posting, consent expiry and reconciliation require real services.

**Does anything leave the machine?** The demo performs no network calls. Optional research links open only when followed. No project files are uploaded by running it.

See the [study guide](STUDY_GUIDE.md), [banking walkthrough](AGENTIC_BANKING.md), [evidence map](RESEARCH.md), and [implementation notes](IMPLEMENTATION.md).
