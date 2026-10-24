# Ontology Field Guide design system

## 1. Atmosphere & identity

Extracted from the existing local guide. Editorial ivory pages contrast with a forest-green object explorer. All seven chapters use one everyday-banking domain, one shared object explorer, and one shared payment workflow. Preserve the shell and reusable components. No new visual framework or external assets.

## 2. Color

Existing CSS tokens: `--bg #f5f5ef`, `--ink #202c29`, `--muted #65706a`, `--line #d8dcd3`, `--green #166650`, `--mint #dcebe1`, `--orange #b45d32`. Graph surfaces use the existing dark forest palette. Primary actions use green; warnings use the existing warm status surface. No additional colors for banking.

## 3. Typography

System sans for body and controls, system monospace for metadata, local Georgia for emphasized display headings. Existing sizes: body 15px/1.6; lead 16px/1.75; display clamp(38px,4.7vw,76px); section 24px; panel 21px; graph labels 12px; metadata 10px. Mobile display 49px. Do not introduce remote fonts.

## 4. Spacing & layout

Reuse the fixed 252px sidebar, 1440px content maximum, 42px page inset, 32px split gap, and 26px panel padding. Existing breakpoints: 1500, 1100, 800px. Under 800px, navigation scrolls horizontally and split panels stack; tables and graph own their horizontal scrolling. The document owns vertical scrolling.

## 5. Components

- `intro`: eyebrow, display title, lead. Reused across chapters.
- `.world`, `.graph`, `.inspector`: SVG object buttons and adjacent property inspector. Selected, hover, keyboard focus states already defined; Enter/Space activates nodes. Banking uses the same graph geometry and components.
- `.panel`, `.split`: paired explanation and decision surfaces, stacked on mobile.
- `.btn`: primary/secondary, hover, native focus, disabled. Outcomes appear beside the action.
- `.field`: explicitly labeled inputs/selects. Banking uses number inputs and a native consent checkbox; no custom keyboard semantics.
- `.table-wrap`: semantic tables, explicit headers, local horizontal scrolling.
- `.status`, `.status.error`, `.log`, `.pill`: ready/rejected/queued/settled/failed feedback. Live region reports action outcomes; no color-only meaning.
- `.stage`, `.architecture-map`, `.concept`, `.callout`: existing educational explanations and sequence diagrams.

## 6. Motion & interaction

Banking adds no animation. Selection updates the inspector; explicit actions update the preview, balances, state and log. Explorer mode switches between actual property values and typed schema fields; search covers all 16 types. Overview, explorer, banking and decisions share the same in-memory payment state. Editing payment parameters invalidates the previous proposal and consent. Navigation preserves state; reset clears it. Existing reduced-motion rule remains authoritative.

## 7. Depth & surface

Existing tonal surfaces and neutral 1px hairlines, 3–5px radii. Reuse current CSS unchanged. No new decorative edges, gradients, shadows, or component styles.

## 8. Accessibility constraints & verification limits

Use semantic buttons, labels, table headings, SVG accessible names, visible native focus and live feedback. All banking controls must work with keyboard and not require hover. Existing graph allows horizontal scrolling at narrow widths. Automated DOM behavior is testable offline. Real-browser visual and Lighthouse verification require an available local browser; do not claim these checks passed without captures.

## 9. Interactive banking lab

`demo.html` is a separate, locally linked lab using the guide's ivory, forest and mint palette. Its session is explicitly independent of the chapter payment example. The existing guide remains its own learning surface. The lab uses system fonts and no network dependencies or generated imagery. External design-catalog research is omitted to honor the project's offline constraint.

The distributed lab is one self-contained HTML file with embedded CSS, scripts and fixtures. Header navigation uses document anchors, so it remains functional when copied away from the field guide. CSP hashes authorize only the embedded code; network connections remain disabled. Separate lab CSS/JS files are maintenance sources, not runtime dependencies, and tests verify exact parity with the embedded versions.

- Content order: brief explanation; numbered journey; mobile bank beside the inspectable business model; contextual comparison. The customer simulation is the focal object, with a dark forest account surface and quiet ivory workbench.
- New tokens: surface `#ffffff`, forest `#152b24`, forest-muted `#b9ccbb`, forest-panel `#213f32`, warning surface `#f3e3d7`, warning ink `#924c2e`. Existing colors are reused. Type sizes: 10, 12, 13, 14, 16, 18, 21, 24, 32, 48px; 1.5 body leading. Space: 4, 8, 12, 16, 20, 24, 32, 40, 48px. Radius: 4px controls, 8px surfaces, 24px phone; neutral borders, no decorative stripes or shadows.
- Layout: maximum 1280px, 32px desktop inset; 360px phone + flexible inspector with minimum 0; document owns vertical scrolling. Below 960px the two panels stack, phone maximum 480px and centered. Below 600px use 16px insets and 32px title. The chat owns a labeled, keyboard-focusable 280px scrolling history region. No other vertical nested scroll.
- Primitives: lab-button (primary/secondary/disabled/focus); scenario chip (selected/hover/focus); message bubble (customer/agent); account metric; object button (selected/hover/focus); property list; policy row (pass/fail/pending with words); trace item; segmented inspector tabs (native buttons, aria-pressed); proposal and receipt. All repeated data is rendered from model state, not screenshots.
- Interaction: explicit demo login; deterministic supported chat intents; exact transfer confirmation; queued reservation; explicit settled/failed outcome; reset. Scenario selection cancels an unsubmitted proposal, but an accepted instruction must resolve before another transfer. Switching inspector tabs preserves all state. Portfolio values are quoted fixture data with version labels. Simulated market change requires an explicit refresh. Effects are immediate; only 120ms color/opacity feedback, disabled under reduced motion.
- Accessibility: controls at least 44px tall, native labels and buttons, polite outcome announcement, focus retained on rerenders or moved to the next relevant control, no motion-dependent meaning, no color-only states, escaped chat input. Fixed light theme remains readable under either OS color preference.
- Verification: local DOM/model regression tests plus local Chrome captures at phone/tablet/desktop. This is a deterministic teaching simulator, not live AI, authentication, advice or banking. Local fixture schema extends the existing Alex Morgan example with savings and portfolio holdings.
