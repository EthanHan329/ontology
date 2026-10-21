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
