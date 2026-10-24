# Banking lab verification

Date: 23 October 2026. Scope: the new `ontology-field-guide/dist/demo.html` lab and the field-guide entry link. Existing chapters retain their own independent payment scenario.

## Outcome

The requested local demonstration is implemented: simulated customer login, scripted chat, transfers with exact approval, portfolio checking, inspectable business objects and relationships, implemented policies, simulator tool traces, and an explicit comparison with context + agent + ordinary API tools.

The comparison does not claim that conventional tools are inherently unsafe, that an ontology replaces tools, or that ontology objects automatically enforce bank rules. It distinguishes application-defined contracts from ledger authority and external execution.

## Evidence

- `npm test` passed after the final JavaScript changes. Existing nine model tests and all chapter/banking/artifact checks pass alongside the new lab model and DOM tests.
- `report.json`: 56 fresh full-page captures from installed Chrome, run directly from `file:` URLs. Every captured state has no document horizontal overflow and all buttons are at least 44px high.
- 13 states each at 390px/DPR 3 and 1440px, under light and dark OS preferences: login, signed in, proposal, context, stale rejection, queued, settled, portfolio, stale quotes, portfolio context, refreshed, access denied, comparison. The product intentionally keeps the established light theme.
- Additional 820px tablet login/failure and 1920px login/rights rejection captures. Scrolled-end viewport captures for both primary widths/preferences. Phone customer/inspector viewport captures allow inspection at readable scale.
- Real browser interactions verify login focus, proposal amount, unchanged savings while queued, stale-balance rejection, settlement, failure release, portfolio 50,000 -> 53,000 after source update and refresh, portfolio scope denial, revoked signing rights, free-text submission with Enter, and the guide-to-lab link.
- Offline DOM tests additionally cover invalid numbers, exact buffer boundary, proposal replacement, duplicate confirmation/settlement, cancel/reset, escaped user text, and absence of networking calls.

## Visual and interaction review

Self-review follows the Codex compatibility section of the visual QA skill (no strict independent review was requested). The implementation is actual DOM, driven by local state and shared CSS tokens, not an image substitute. Captures were reviewed for alignment, hierarchy, responsive stacking, readable text, object/property grouping, action states and outcome placement. The phone and inspector remain usable at narrow widths; comparison columns wrap without clipping. Native buttons, labeled text input, focus rings, an outcome live region and a keyboard-focusable chat history provide the interaction structure. No animation or loading screen gates the task.

Corrected during verification: a missing template delimiter; a test selecting the phone warning instead of the inspector warning; selected-object metadata contrast (now mint on green, approximately 5.58:1); and missing portfolio holdings/quote versions in the context snapshot. Browser capture setup was corrected to reapply viewport emulation after navigation; the initial mobile overflow was a stale capture viewport, not a product layout defect.

## Limits

- Deterministic, limited intent parsing; no live model, bank service, authentication, prices, trades or persistent state. Quotes, rights and transfers are teaching fixtures.
- The customer UI and internal inspector are educational, not a production bank design or an Apple HIG/WCAG conformance certification. Small metadata follows the existing field-guide type scale.
- No Lighthouse, screen-reader or live-assistive-technology audit was available/run. Lighthouse dependencies were not installed. The bundled accent-stripe tool could not run under Node because its TypeScript imports require Bun, which is absent; source inspection found only neutral dividers in the new lab, with no decorative colored edge stripes.
- Existing guide layouts outside the new entry link were covered by their regression suite; the full pre-existing seven-chapter visual surface was not re-audited.

The QA browser used a task-owned temporary profile and no user session. No source was uploaded and no hosting was created.
