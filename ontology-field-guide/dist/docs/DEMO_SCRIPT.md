# A five-minute Ontology demonstration

Audience: a technical or business audience learning the concept. All figures are fictional. Open `index.html` or the hosted site. Use a desktop viewport for the graph; the layout also adapts to mobile.

## 0:00–0:40 — State the operational problem

Open **The big picture**.

“A shipment is delayed. Logistics knows the movement, the warehouse knows alternate stock, and sales knows the promises. The decision requires a connected view of all three. This field guide shows the model, the decision logic, and the controlled path to action.”

Point to the semantic, kinetic, and governance explanations.

## 0:40–1:30 — Reveal the shared business model

Open **Explore the model**. Select the shipment, then the part, then the order. Use the table's Inspect buttons if presenting with keyboard navigation.

“Each node is a business object with identity. A link says how business entities relate. The graph lets us trace consequences.”

Switch to **Type definitions**, then back to **Object instances**.

“CustomerOrder is a reusable definition. ORD-1042 is one actual commitment. Apps and calculations can reuse the same contract.”

Explain that the five-node model is simplified. A richer model uses OrderLine, ShipmentLine, and Allocation objects when relationships need quantities and status.

## 1:30–2:40 — Make consequences visible

Open **From insight to action**.

Set delay to **5 days** and leave allocation at **320 units**.

“Base arrival is day 2, so the revised arrival is day 7. The first two orders, due on days 3 and 5, are at risk. Their revenue totals $128,000. Under our toy policy, 320 alternate units protect both for $3,840.”

Move allocation to **180**. The first order is protected; $56,000 remains exposed. Move it back to **320**.

“This is a transparent calculation, not an AI prediction. The preview has not reserved inventory.”

## 2:40–3:40 — Show governance and a real state transition

Choose **Analyst — read only**, then click **Apply reallocation**.

“Being allowed to see inventory is different from being allowed to change it.”

Observe the denial and rejection log. Return to **Operations planner**. Optionally move quantity to **340**, apply, and show the insufficient-stock rejection. Restore **320**, retain a meaningful reason, and apply.

Observe the applied state, zero available alternate stock, and decision log.

“The action captures a business operation: validation, local state changes, and a recorded integration request. This browser only simulates it.”

Point to **ERP acknowledgment pending**.

“Local success is different from confirmed external fulfillment. A production implementation needs acknowledgment, failure handling, and reconciliation.”

## 3:40–4:30 — Explain architecture and AI

Open **Under the surface**. Show the four layers. Expand the transaction and AI questions.

“Integration and indexing make data usable. The shared model gives business meaning. Logic evaluates choices. Actions express permitted changes. AI can use that context and those tools, but its proposal still needs the workflow's authorization and validation.”

Do not claim that human review is mandatory in every AIP workflow. It is a configurable workflow design choice.

## 4:30–5:00 — Prove understanding

Open **Test your understanding**. Answer the ERP transaction question and the read-versus-write question. Show the Markdown guide and research library.

“The point is the entire loop: shared context, evaluated decision, governed change, and observed outcome.”

## Backup numbers

| Delay | Arrival | At-risk orders before allocation | Revenue at risk | After 320-unit allocation |
| --- | --- | --- | ---: | ---: |
| 0 | Day 2 | None | $0 | $0 |
| 3 | Day 5 | ORD-1042 | $72,000 | $0 |
| 5 | Day 7 | ORD-1042, ORD-1043 | $128,000 | $0 |
| 7 | Day 9 | All three | $168,000 | $40,000 |

A 320-unit allocation costs $3,840. At a three-day delay, 180 units achieve the same protected revenue at $2,160. Use this to discuss why extra allocation is not automatically optimal.

## Likely questions

**Is this Palantir?** The concepts are researched from Palantir's public docs. The interface and code are an independent educational simulation.

**Is the graph the Ontology?** It is one useful view. The operational contract also includes properties, logic, action definitions, and access behavior.

**Does the action update ERP?** Only an explicitly configured integration can do that. This demo logs a simulated request and leaves acknowledgment pending.

**Is this using a real LLM?** No. The workbench runs deterministic local calculations. AI architecture is explained separately.

**Are the numbers ROI?** No. They are fictional revenue exposure and a simplified transport charge, not realized savings or margin.

**Can I build this in Foundry?** Use the richer schema and action design as a starting point, then validate exact capabilities and APIs in your enrollment.
