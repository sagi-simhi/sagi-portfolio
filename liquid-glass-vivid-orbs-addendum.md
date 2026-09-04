# Liquid Glass — Round 2 Addendum: Vivid Orbs

## Context
Round 1 (`liquid-glass-refinement-spec.md`) tuned the glass material itself (blur, saturation, border, shadow) — that part is done and correct, leave it alone. The problem is the **orbs never gave the glass enough color to refract**: two faint, section-scoped 35%-opacity blobs behind Projects/Stack only. Apple's reference look gets its color entirely from a rich, saturated background sitting directly behind the glass — not from the glass parameters themselves.

Decision from review: go vivid. Bigger, brighter, on-brand orbs, visible behind cards throughout the page — accepting some reduction in text contrast as a deliberate trade-off.

## Scope
- `style.css` and `index.html` only. Same constraints as Round 1 still apply: no touching `script.js`, `spatial-engine.js`, `project-app/`, `strategy-20-80/`; no new colors outside `--accent` / `--gold` (and their existing `-bright`/`-dim` variants); no new files besides this spec.

## 1. Replace the Round 1 orb markup and remove its old placement

Remove the two `<div class="bg-orb ...">` elements currently placed immediately before `#projects` in `index.html`.

Add three orb elements instead, as direct children of `<body>`, immediately after the existing `<div class="core-layer">...</div>` block (same DOM pattern the hero canvas already uses for fixed, viewport-level decoration — this is a proven-safe spot in this codebase):

```html
<div class="bg-orb bg-orb-a" aria-hidden="true"></div>
<div class="bg-orb bg-orb-b" aria-hidden="true"></div>
<div class="bg-orb bg-orb-c" aria-hidden="true"></div>
```

**Why fixed position, not per-section:** `position: fixed` orbs stay behind whatever content is currently in view as the user scrolls, so every glass card on the page — not just Projects/Stack — gets color to refract. This matches how the reference screenshot's photo sits behind every control, not just some of them.

**Placement constraint:** these three divs must not be nested inside any element with `transform`, `filter`, or `perspective` set on it or an ancestor — that creates a new containing block and breaks `position: fixed`. Placing them as direct children of `<body>`, outside `<main>`, avoids this (verify none of `<body>`'s existing children between here and `<main>` have those properties — they don't currently).

## 2. Replace the Round 1 `.bg-orb` CSS entirely

Remove the Round 1 `.bg-orb` block and `@keyframes orbDrift` and replace with:

```css
.bg-orb {
  position: fixed;
  z-index: 0;
  pointer-events: none;
  border-radius: 50%;
  filter: blur(120px);
}
.bg-orb-a {
  width: 900px; height: 900px;
  top: -10%; right: -10%;
  opacity: .6;
  background: radial-gradient(circle, var(--accent-bright) 0%, var(--accent) 45%, transparent 72%);
  animation: orbDrift 24s ease-in-out infinite alternate;
}
.bg-orb-b {
  width: 800px; height: 800px;
  bottom: -15%; left: -10%;
  opacity: .55;
  background: radial-gradient(circle, var(--gold) 0%, var(--accent-dim) 55%, transparent 72%);
  animation: orbDrift 28s ease-in-out infinite alternate-reverse;
}
.bg-orb-c {
  width: 600px; height: 600px;
  top: 40%; left: 50%;
  opacity: .4;
  background: radial-gradient(circle, var(--accent) 0%, var(--gold) 60%, transparent 72%);
  animation: orbDrift 32s ease-in-out infinite alternate;
}
@keyframes orbDrift {
  from { transform: translate(0, 0) scale(1); }
  to   { transform: translate(30px, -30px) scale(1.1); }
}
@media (prefers-reduced-motion: reduce) {
  .bg-orb { animation: none; }
}
```

`--accent-bright` and `--accent-dim` already exist in `:root` — this stays strictly within the existing palette while giving each orb more internal color variation than a flat single-color blob.

## 3. Let more orb color bleed through the glass

In `:root`, adjust two Round 1 values further:

```css
--glass-bg: rgba(255, 255, 255, 0.035);   /* was 0.05 in Round 1 — more transparent, more orb color shows through */
--glass-saturation: 240%;                 /* was 220% in Round 1 — stronger color pop now there's real color behind it */
```

Leave every other Round 1 value (`--glass-blur`, `--glass-border`, `--glass-highlight`, `--glass-glow-outer`, `--glass-glow-inner`) as Round 1 set them.

## 4. Accepted trade-off — do not silently fix

This will visibly reduce text contrast on cards, especially where an orb is strongest (e.g., top-right of the page, over `.about-facts`/`.edu-card-primary`). This is intentional and approved. **Do not** compensate by adding a solid backing behind card text, darkening `--ink`, or reducing orb opacity — that would undo the point of this change. Just implement as specified and let it be reviewed visually.

## Verification
1. Open in browser, scroll the full page — confirm all card sections (About, Projects, Stack, Education, Timeline, Contact), not just Projects/Stack, show visible color bleed through the glass as different orbs pass behind them.
2. Confirm orbs are `position: fixed` and are NOT children of any transformed/filtered ancestor (inspect computed `position` in devtools — must read `fixed`, not `static`/`absolute`).
3. Confirm reduced-motion still freezes orb animation.
4. Confirm light theme still uses its own untouched `--glass-bg`/`--glass-border` overrides (Round 1 constraint still holds).
5. `grep -n "bg-orb-a\|bg-orb-b\|bg-orb-c\|orbDrift" style.css` — each declared exactly once.
6. `git diff --stat` — only `style.css` and `index.html` changed.
