# Liquid Glass Refinement — Spec

## Objective
Tune the existing Liquid Glass card system toward Apple's actual glass parameters (higher saturation, neutral crisp edge, thinner blur) and add two subtle on-brand background orbs behind the card-heavy sections to make the glass transparency read more clearly. This is a **refinement of existing CSS**, not a new build.

## Scope — files you may edit
- `style.css` only, plus small markup additions to `index.html` for the two orb elements.

## Do NOT
- Do not touch `project-app/` or `strategy-20-80/`.
- Do not touch `script.js` or `spatial-engine.js`. The card tilt/specular JS and the hero WebGL scene are working and out of scope. If the new CSS values cause a visible regression in the tilt effect, stop and report it — do not rewrite the JS to compensate.
- Do not create new files.
- Do not modify the `[data-theme="light"]` override block. It's already tuned for a light backdrop; the values below are for the dark (default) theme only.
- Do not introduce any color outside the existing palette (`--accent` green, `--gold`). No pink/cyan/purple.

## 1. Update glass variables in `:root` (style.css)

Change these existing values:

```css
--glass-blur: 25px;                          /* was 30px */
--glass-saturation: 220%;                    /* was 210% */
--glass-bg: rgba(255, 255, 255, 0.05);       /* was 0.04 */
--glass-border: rgba(255, 255, 255, 0.15);   /* was rgba(83,215,166,0.18) — now neutral, matches real Apple glass edge */
--glass-highlight: rgba(255, 255, 255, 0.25);/* was 0.18 — used for the inset top-edge highlight */
--glass-glow-outer: rgba(0, 0, 0, 0.2);      /* was 0.28 */
```

Leave `--glass-glow-inner` (`rgba(83, 215, 166, 0.12)`) unchanged — this is the brand-green depth glow and should stay to keep the cards feeling on-brand despite the neutral border.

## 2. Update the card box-shadow

Find the shared rule (applies to `.about-facts, .edu-card, .project-card, .stack-group, .timeline-content, .approach-step`):

```css
box-shadow: inset 0 1px 0 var(--glass-highlight), inset 0 -6px 12px var(--glass-glow-inner), 0 12px 30px var(--glass-glow-outer);
```

Change to:

```css
box-shadow: inset 0 1px 1px var(--glass-highlight), inset 0 -6px 12px var(--glass-glow-inner), 0 4px 30px var(--glass-glow-outer);
```

Leave the `:hover` box-shadow rule and everything else in that selector block (transforms, `::before`, `::after`, z-index layering) untouched — the tilt/specular system is unrelated to this change and must keep working exactly as-is.

## 3. Add two background orbs (CSS-only, on-brand)

Add markup in `index.html`, inside `<main>`, immediately before the `#projects` section:

```html
<div class="bg-orb bg-orb-a" aria-hidden="true"></div>
<div class="bg-orb bg-orb-b" aria-hidden="true"></div>
```

Add CSS in `style.css`:

```css
.bg-orb {
  position: absolute;
  z-index: 0;
  pointer-events: none;
  border-radius: 50%;
  filter: blur(90px);
  opacity: .35;
}
.bg-orb-a {
  width: 420px; height: 420px;
  top: 0; right: 5%;
  background: radial-gradient(circle, var(--accent) 0%, transparent 70%);
  animation: orbDrift 22s ease-in-out infinite alternate;
}
.bg-orb-b {
  width: 380px; height: 380px;
  top: 60vh; left: 4%;
  background: radial-gradient(circle, var(--gold) 0%, transparent 70%);
  animation: orbDrift 26s ease-in-out infinite alternate-reverse;
}
@keyframes orbDrift {
  from { transform: translate(0, 0) scale(1); }
  to   { transform: translate(20px, -20px) scale(1.08); }
}
@media (prefers-reduced-motion: reduce) {
  .bg-orb { animation: none; }
}
```

Ensure `#projects` and `#stack` (or their closest positioned ancestor) have `position: relative` so the orbs sit correctly in the stacking context, and confirm the existing card `::before`/`::after` z-index layering (already `z-index: 2–4` on card content) keeps card text above the orbs — orbs stay at `z-index: 0`, cards' own background/backdrop-filter will diffuse them further.

## Verification (no build step exists — this is a static site)

1. Open `index.html` directly or via local server; confirm no console errors.
2. Visually confirm: cards show visibly higher saturation/thinner blur, neutral crisp edge, orbs are visible but subtle behind Projects/Stack cards, text stays fully legible.
3. Confirm hover tilt + specular still work identically to before (unchanged JS).
4. Toggle to light theme — confirm it still looks correct (untouched).
5. Enable "reduce motion" in OS/browser — confirm orb animation stops and existing reduced-motion behavior is unaffected.
6. Run `grep -n "\-\-glass-\|bg-orb" style.css` — confirm each variable/class is declared exactly once (no duplicates).
