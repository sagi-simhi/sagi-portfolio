/* ==========================================================================
   SCROLL PROGRESS INDICATOR — behavior (v2)

   CHANGED FROM PREVIOUS VERSION:
   - No longer appends a standalone floating bar to document.body.
   - Now locates the site's navbar and injects the progress strip as a
     child of it, so the line is genuinely part of the navbar (absolute
     position + bottom:0), not an independent fixed element.
   - Height math is replaced with width math: progress now grows the
     line's WIDTH left-to-right, not a bar's height top-to-bottom.
   - Removed the "is-scrolling" glow-boost state and visibility fade —
     the reference sits there quietly at all times, no pulsing.
   ========================================================================== */

(function () {
  "use strict";

  /* ------------------------------------------------------------------
     1. Locate the navbar.
        Tries a short list of common selectors so this stays a drop-in
        for most nav markup. If your navbar uses something else, just
        hardcode the selector on the line below (e.g. '#siteNav').
     ------------------------------------------------------------------ */
  var NAV_SELECTOR_CANDIDATES = [
    ".site-header", // <-- real navbar: <header class="site-header"><nav class="nav-container">...
    "#navbar",
    ".navbar",
    "header nav",
    "nav.nav",
    "nav",
    "header",
  ];

  function findNavbar() {
    for (var i = 0; i < NAV_SELECTOR_CANDIDATES.length; i++) {
      var el = document.querySelector(NAV_SELECTOR_CANDIDATES[i]);
      if (el) return el;
    }
    return null;
  }

  var navbar = findNavbar();

  if (!navbar) {
    // Fail quietly rather than throwing — a missing navbar shouldn't
    // break the rest of the page.
    console.warn(
      "[scroll-progress] No navbar element found. Update NAV_SELECTOR_CANDIDATES " +
        "in scroll-progress.js to match your markup."
    );
    return;
  }

  /* ------------------------------------------------------------------
     2. Make sure the navbar is a positioning context for the strip.
        Most fixed/sticky navbars already establish one (position:fixed
        or position:sticky both qualify), so we only step in if the
        navbar is still `position: static`.
     ------------------------------------------------------------------ */
  var computedPosition = window.getComputedStyle(navbar).position;
  if (computedPosition === "static") {
    navbar.style.position = "relative";
  }

  /* ------------------------------------------------------------------
     3. Build and inject the progress strip as the navbar's last child.
     ------------------------------------------------------------------ */
  var strip = document.createElement("div");
  strip.className = "nav-progress";
  strip.setAttribute("aria-hidden", "true"); // decorative, not a landmark

  var fill = document.createElement("div");
  fill.className = "nav-progress__fill";

  strip.appendChild(fill);
  navbar.appendChild(strip);

  /* ------------------------------------------------------------------
     4. Core calculation — identical math to the spec:
        scrollTop / (scrollHeight - clientHeight)
        Works correctly regardless of page length.
     ------------------------------------------------------------------ */
  function getScrollProgress() {
    var doc = document.documentElement;
    var scrollTop = window.pageYOffset || doc.scrollTop;
    var scrollHeight = doc.scrollHeight;
    var clientHeight = doc.clientHeight;

    var scrollable = scrollHeight - clientHeight;
    if (scrollable <= 0) return 0; // page shorter than viewport

    var progress = scrollTop / scrollable;

    // Clamp — mobile elastic overscroll can push this slightly outside [0,1]
    if (progress < 0) progress = 0;
    if (progress > 1) progress = 1;

    return progress;
  }

  /* ------------------------------------------------------------------
     5. rAF-throttled update loop — one frame in flight at a time.
     ------------------------------------------------------------------ */
  var ticking = false;

  function update() {
    ticking = false;
    var progress = getScrollProgress();
    var percent = (progress * 100).toFixed(2) + "%";
    strip.style.setProperty("--np-progress", percent);
  }

  function requestUpdate() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(update);
    }
  }

  /* ------------------------------------------------------------------
     6. Event bindings — passive so scrolling is never blocked.
     ------------------------------------------------------------------ */
  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate, { passive: true });
  window.addEventListener("load", requestUpdate);

  // Recalculate if page height changes after load (images, fonts, etc.)
  if (window.ResizeObserver) {
    var ro = new ResizeObserver(requestUpdate);
    ro.observe(document.body);
  }

  /* Initial paint */
  update();
})();
