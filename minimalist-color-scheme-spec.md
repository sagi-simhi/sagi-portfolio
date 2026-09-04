# Minimalist Apple-Style Color Scheme — Migration Spec

## Goal
Replace the current green/gold fintech palette with a restrained, Apple-style
palette: near-monochrome grayscale surfaces/text, **one** accent color
(Apple system blue), applied consistently across `style.css`, the WebGL hero
in `spatial-engine.js`, and both theme states (dark default / light toggle).

## Scope — files to touch
- `style.css` — full palette token rewrite + a handful of hardcoded literals
- `spatial-engine.js` — `getThemePalette()` + 3 call sites that consume it
- **No changes** to `index.html` or `script.js` (verified: neither file
  hardcodes any color values — `script.js` only writes numeric opacity
  floats to `--bg-ambient-a/b` and `--bg-overlay-opacity`, not colors)
- **Do not touch** `project-app/` or `strategy-20-80/` — those are
  self-contained sub-projects and are out of scope

---

## 1. `style.css` — `:root` (dark theme, default)

| Token | Old | New | Notes |
|---|---|---|---|
| `--bg-base` | `#0c100e` | `#000000` | true black, Apple dark-mode base |
| `--surface-0` | `#111916` | `#1c1c1e` | Apple systemGray6 dark |
| `--surface-1` | `#17211d` | `#2c2c2e` | Apple systemGray5 dark |
| `--ink` | `#edf6f3` | `#f5f5f7` | remove green tint |
| `--ink-muted` | `#b9c8c2` | `#a1a1a6` | Apple secondaryLabel dark |
| `--ink-faint` | `#7b8d87` | `#6e6e73` | Apple tertiaryLabel dark |
| `--accent` | `#53d7a6` | `#0A84FF` | Apple system blue (dark) |
| `--accent-bright` | `#78f0c2` | `#409CFF` | hover state |
| `--accent-dim` | `#2ea775` | `#0060DF` | pressed state |
| `--accent-soft` | `rgba(83,215,166,.16)` | `rgba(10,132,255,.16)` | |
| `--accent-line` | `rgba(83,215,166,.2)` | `rgba(10,132,255,.24)` | |
| `--accent-rgb` | *(new token)* | `10,132,255` | needed for §3 below |
| `--gold` | `#c9a15a` | **delete** | see §2 for replacement usages |
| `--border` | `rgba(255,255,255,.09)` | `rgba(255,255,255,.10)` | unchanged in spirit |
| `--border-soft` | `rgba(255,255,255,.05)` | `rgba(255,255,255,.06)` | unchanged in spirit |
| `--glass-bg` | `rgba(255,255,255,.04)` | `rgba(255,255,255,.045)` | keep neutral |
| `--glass-border` | `rgba(83,215,166,.18)` | `rgba(10,132,255,.16)` | |
| `--glass-highlight` | `rgba(255,255,255,.18)` | unchanged | already neutral |
| `--glass-glow-inner` | `rgba(83,215,166,.12)` | `rgba(10,132,255,.10)` | |
| `--glass-glow-outer` | `rgba(0,0,0,.28)` | `rgba(0,0,0,.30)` | unchanged in spirit |
| `--glass-edge-top` | `rgba(255,255,255,.22)` | unchanged | already neutral |
| `--glass-edge-bottom` | `rgba(0,0,0,.18)` | `rgba(0,0,0,.20)` | unchanged in spirit |
| `--glass-chromatic-r` | `rgba(83,215,166,.08)` | `rgba(10,132,255,.06)` | |
| `--glass-chromatic-b` | `rgba(201,161,90,.06)` | `rgba(255,255,255,.04)` | gold → neutral, keeps the edge detail, drops the second hue |
| `--modal-backdrop-bg` | `rgba(5,8,14,.82)` | `rgba(0,0,0,.82)` | neutral black |

## 2. `style.css` — `[data-theme="light"]` overrides

| Token | Old | New | Notes |
|---|---|---|---|
| `--bg-base` | `#f5f7f6` | `#f5f5f7` | fix greenish tint |
| `--surface-0` | `#ffffff` | unchanged | |
| `--surface-1` | `#eef4f2` | `#f2f2f4` | remove green tint |
| `--ink` | `#17211d` | `#1d1d1f` | Apple near-black |
| `--ink-muted` | `#4d5b55` | `#6e6e73` | |
| `--ink-faint` | `#6e7d78` | `#86868b` | |
| `--accent` | `#2e9e75` | `#0071E3` | Apple website blue (light) |
| `--accent-bright` | `#3eae84` | `#0077ED` | hover |
| `--accent-dim` | `#1f7c5e` | `#005BB5` | pressed |
| `--accent-soft` | `rgba(46,158,117,.12)` | `rgba(0,113,227,.10)` | |
| `--accent-line` | `rgba(46,158,117,.22)` | `rgba(0,113,227,.22)` | |
| `--accent-rgb` | *(new token)* | `0,113,227` | |
| `--gold` | `#b4884b` | **delete** | |
| `--border` | `rgba(20,27,24,.09)` | `rgba(0,0,0,.10)` | neutral |
| `--border-soft` | `rgba(20,27,24,.05)` | `rgba(0,0,0,.06)` | neutral |
| `--glass-border` | `rgba(46,158,117,.22)` | `rgba(0,113,227,.20)` | |
| `--glass-glow-inner` | `rgba(46,158,117,.14)` | `rgba(0,113,227,.10)` | |
| `--glass-glow-outer` | `rgba(9,18,15,.08)` | `rgba(0,0,0,.08)` | neutral |
| `--glass-edge-bottom` | `rgba(18,30,25,.09)` | `rgba(0,0,0,.09)` | neutral |
| `--glass-chromatic-r` | `rgba(46,158,117,.08)` | `rgba(0,113,227,.07)` | |
| `--glass-chromatic-b` | `rgba(100,116,120,.08)` | `rgba(0,0,0,.05)` | neutral |
| `--modal-backdrop-bg` | `rgba(245,247,246,.88)` | `rgba(245,245,247,.88)` | |

## 3. Hardcoded literals in `style.css` (bypass variables today — this is why colors don't fully follow the toggle)

Find-and-replace each of these (search for the literal, not just the selector,
since some selectors repeat):

1. `body{...background: radial-gradient(1200px 600px at 15% -10%,rgba(83,215,166,var(--bg-ambient-a)),transparent 58%), radial-gradient(900px 500px at 90% 0%,rgba(201,161,90,var(--bg-ambient-b)),transparent 55%), ...}`
   → **Drop the second (gold) radial-gradient layer entirely** — a single
   accent wash is more consistent with the "one accent" direction. Replace
   the first layer's literal with `rgba(var(--accent-rgb),var(--bg-ambient-a))`.
2. `.status-indicator{...box-shadow:0 0 10px rgba(83,215,166,.5)}`
   → `rgba(var(--accent-rgb),.5)`
3. `.btn-primary:hover{...box-shadow:0 10px 28px rgba(83,215,166,.22)}`
   → `rgba(var(--accent-rgb),.22)`
4. `.section.is-active .eyebrow-signal::after{...box-shadow:0 0 8px rgba(83,215,166,.55)}`
   → `rgba(var(--accent-rgb),.55)`
5. `.edu-card:hover,.project-card:hover,...{...0 22px 54px rgba(83,215,166,.18),...}`
   → `rgba(var(--accent-rgb),.18)`
6. `.project-card-cover{...radial-gradient(circle at 22% 18%,rgba(83,215,166,.18),transparent 62%),...}`
   → `rgba(var(--accent-rgb),.18)`

## 4. Text-on-accent contrast fix (important — do not skip)

These two rules hardcode a dark-green text color that was tuned for the old
*light* green background. Blue is a different luminance; text must flip to white:

- `.btn-primary{background:var(--accent);border-color:var(--accent);color:#12211c}`
  → `color:#ffffff`
- `.nav-contact-btn{...color:#12211c;...}`
  → `color:#ffffff`

## 5. Gold usages that need a grayscale replacement (not a color swap)

Since gold is being retired rather than replaced with a second hue, these two
become neutral grayscale, not blue:

- `.section-eyebrow{...color:var(--gold);...}` → `color:var(--ink-faint)`
- `.timeline-org{...color:var(--gold)}` → `color:var(--ink-muted)`

---

## 6. `spatial-engine.js` — `getThemePalette()`

Rename the `gold` key to `steel` throughout this function and its 3 call
sites (`createEnvironmentMap`, `createLattice`, `applyThemePalette`) — it's
no longer a gold tone, it's the neutral secondary lattice color.

**Dark branch:**
```js
return {
  primary: 0x0A84FF,
  secondary: 0x636366,
  steel: 0x8E8E93,
  light: 0x409CFF,
  line: 0x545458,
  glow: 0x0A84FF,
  bg: 0x000000
};
```

**Light branch:**
```js
return {
  primary: 0x0071E3,
  secondary: 0xAEAEB2,
  steel: 0xC7C7CC,
  light: 0x409CFF,
  line: 0xD1D1D6,
  glow: 0x0071E3,
  bg: 0xf5f5f7
};
```

Also update `initLighting()`, which currently hardcodes the *initial* light
colors independent of theme:
```js
pointLightMain = new THREE.PointLight(0x53d7a6, 1.8, 60, 2.0);
...
rimLight = new THREE.PointLight(0xc9a15a, 0.65, 60, 2.0);
```
→ use `getThemePalette().glow` and `getThemePalette().steel` here instead of
the hardcoded hex, so there's no one-frame flash of the old green/gold before
`applyThemePalette()` runs.

**Do not** touch anything else in this file — geometry, animation loop,
scroll tracking, and disposal logic are unrelated to this change and must be
left exactly as-is.

---

## 7. QA checklist (verify before merging)

- [ ] Toggle dark → light → dark; confirm nav, buttons, status badge, card
      hover glow, and hero WebGL lattice all shift color together with no
      leftover green/gold anywhere
- [ ] `.btn-primary` and `.nav-contact-btn` text is legible (white on blue)
      in both themes
- [ ] Hero canvas background recolors on toggle (this requires the
      `MutationObserver` in `setupThemeWatcher` to still fire — don't touch
      that code, just confirm the new palette values flow through it)
- [ ] `git diff` reviewed line-by-line for unrequested changes before commit
- [ ] `grep -n "83,215,166\|201,161,90\|53d7a6\|c9a15a\|2e9e75\|b4884b" style.css spatial-engine.js`
      returns nothing — confirms no old color literal was missed

---

## Suggested Claude Code invocation
Run this in a **Sonnet** manual session (planning is already done here, no
need for Opus):

```
@minimalist-color-scheme-spec.md
Implement this spec exactly as written. Do not create any new files. Only
edit style.css and spatial-engine.js. Show me a summary of every changed
selector/token before you finish.
```
