/* Sagi Simhi - portfolio
   Scroll reveals: arms .mk-reveal elements, adds .mk-in on first intersection,
   then .mk-done once the entrance settles (used to restore fast hover motion).
   Honors per-element data-effect, inline transition-delay, and data-rootmargin.
   With prefers-reduced-motion, CSS keeps everything visible and no transitions run. */
(function () {
  "use strict";

  function delayOf(el) {
    var m = /(\d+)\s*ms/.exec(el.style.transitionDelay || "");
    return m ? parseInt(m[1], 10) : 0;
  }

  function arm(el) {
    el.classList.add("mk-armed");
    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("mk-in");
      el.classList.add("mk-done");
      return;
    }
    var rootMargin = el.getAttribute("data-rootmargin") || "0px 0px -10% 0px";
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          el.classList.add("mk-in");
          window.setTimeout(function () { el.classList.add("mk-done"); }, 1600 + delayOf(el));
          io.disconnect();
        }
      });
    }, { threshold: 0, rootMargin: rootMargin });
    io.observe(el);
    // failsafe: if the observer never reports, reveal only what is actually on screen
    window.setTimeout(function () {
      var r = el.getBoundingClientRect();
      var vh = window.innerHeight || document.documentElement.clientHeight;
      if (r.bottom > 0 && r.top < vh && !el.classList.contains("mk-in")) {
        el.classList.add("mk-in");
        el.classList.add("mk-done");
        io.disconnect();
      }
    }, 3000);
  }

  function init() {
    var els = document.querySelectorAll(".mk-reveal");
    for (var i = 0; i < els.length; i++) arm(els[i]);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

/* Hairline scroll progress at the top of the page. */
(function () {
  "use strict";
  function initProgress() {
    var bar = document.querySelector(".mk2-progress span");
    if (!bar) return;
    var raf = 0;
    function update() {
      raf = 0;
      var el = document.documentElement;
      var max = Math.max(el.scrollHeight - el.clientHeight, 1);
      var top = window.scrollY || el.scrollTop || 0;
      bar.style.transform = "scaleX(" + Math.min(Math.max(top / max, 0), 1) + ")";
    }
    function onScroll() { if (!raf) raf = requestAnimationFrame(update); }
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initProgress);
  } else {
    initProgress();
  }
})();

/* Edge refraction with chromatic dispersion for the glass bar (Chrome-family only,
   reduced-motion / reduced-transparency / small screens fall back to plain blur). */
(function () {
  "use strict";
  var SCALE = 14;
  var DISPERSION = 2;
  var NS = "http://www.w3.org/2000/svg";

  function edgeMap(w, h, r) {
    var rad = Math.max(0, Math.min(r, Math.min(w, h) / 2));
    var e = Math.max(2, Math.min(12, Math.round(Math.min(w, h) * 0.16)));
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '">' +
      '<rect width="100%" height="100%" rx="' + rad + '" fill="rgb(128,128,128)"/>' +
      '<rect x="0" y="0" width="100%" height="' + e + '" rx="' + rad + '" fill="rgb(128,168,128)"/>' +
      '<rect x="0" y="' + (h - e) + '" width="100%" height="' + e + '" rx="' + rad + '" fill="rgb(128,88,128)"/>' +
      '<rect x="0" y="' + e + '" width="' + e + '" height="' + Math.max(0, h - e * 2) + '" fill="rgb(168,128,128)"/>' +
      '<rect x="' + (w - e) + '" y="' + e + '" width="' + e + '" height="' + Math.max(0, h - e * 2) + '" fill="rgb(88,128,128)"/></svg>';
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  function buildFilter(id, w, h, r) {
    var f = document.createElementNS(NS, "filter");
    f.id = id;
    f.setAttribute("x", "-5%"); f.setAttribute("y", "-5%");
    f.setAttribute("width", "110%"); f.setAttribute("height", "110%");
    f.setAttribute("color-interpolation-filters", "sRGB");
    function p(name, attrs) {
      var n = document.createElementNS(NS, name);
      Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
      n.setAttribute("color-interpolation-filters", "sRGB");
      f.appendChild(n);
    }
    p("feImage", { result: "edge-map", x: "0", y: "0", width: "100%", height: "100%", preserveAspectRatio: "none", href: edgeMap(w, h, r) });
    p("feDisplacementMap", { in: "SourceGraphic", in2: "edge-map", scale: String(SCALE), xChannelSelector: "R", yChannelSelector: "G", result: "base" });
    p("feDisplacementMap", { in: "SourceGraphic", in2: "edge-map", scale: String(SCALE + DISPERSION), xChannelSelector: "R", yChannelSelector: "G", result: "red" });
    p("feDisplacementMap", { in: "SourceGraphic", in2: "edge-map", scale: String(SCALE - DISPERSION), xChannelSelector: "R", yChannelSelector: "G", result: "blue" });
    p("feColorMatrix", { in: "red", type: "matrix", values: "1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0", result: "red-only" });
    p("feColorMatrix", { in: "base", type: "matrix", values: "0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0", result: "green-only" });
    p("feColorMatrix", { in: "blue", type: "matrix", values: "0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0", result: "blue-only" });
    p("feBlend", { in: "red-only", in2: "green-only", mode: "screen", result: "rg" });
    p("feBlend", { in: "rg", in2: "blue-only", mode: "screen", result: "rgb" });
    return f;
  }

  function isChromium() {
    var b = navigator.userAgentData && navigator.userAgentData.brands;
    if (b && b.length) return b.some(function (x) { return /Chromium|Google Chrome|Microsoft Edge/i.test(x.brand); });
    return /Chrome|Edg\//i.test(navigator.userAgent) && !/Firefox|OPR\//i.test(navigator.userAgent);
  }

  function attachRefraction(el) {
    if (!window.CSS || !CSS.supports("backdrop-filter", "url(#x) blur(1px)") || !isChromium()) return null;
    var mq = function (q) { return window.matchMedia && window.matchMedia(q).matches; };
    if (mq("(prefers-reduced-motion: reduce)") || mq("(prefers-reduced-transparency: reduce)") || mq("(max-width: 640px)")) return null;
    var svg = document.createElementNS(NS, "svg");
    svg.setAttribute("width", "0"); svg.setAttribute("height", "0"); svg.setAttribute("aria-hidden", "true");
    svg.style.position = "absolute";
    var defs = document.createElementNS(NS, "defs");
    svg.appendChild(defs);
    document.body.appendChild(svg);
    var id = "glass-refract-" + Math.random().toString(36).slice(2);
    var lastW = 0, lastH = 0;
    function regen() {
      var rc = el.getBoundingClientRect();
      var w = Math.round(rc.width), h = Math.round(rc.height);
      if (!w || !h || (w === lastW && h === lastH)) return;
      lastW = w; lastH = h;
      var old = document.getElementById(id); if (old) old.remove();
      var r = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
      defs.appendChild(buildFilter(id, w, h, r));
      el.style.setProperty("--refract-filter", 'url("#' + id + '")');
      el.classList.add("refract-on");
    }
    regen();
    var ro = "ResizeObserver" in window ? new ResizeObserver(regen) : null;
    if (ro) ro.observe(el);
    return function () {
      if (ro) ro.disconnect();
      el.classList.remove("refract-on");
      el.style.removeProperty("--refract-filter");
      svg.remove();
    };
  }

  function watchRefraction(el) {
    var off = attachRefraction(el);
    var t = 0;
    function sync() {
      window.clearTimeout(t);
      t = window.setTimeout(function () {
        var want = !window.matchMedia("(max-width: 640px)").matches;
        if (want && !off) off = attachRefraction(el);
        else if (!want && off) { off(); off = null; }
      }, 120);
    }
    window.addEventListener("resize", sync);
    return function () { window.clearTimeout(t); window.removeEventListener("resize", sync); if (off) off(); };
  }

  window.__watchRefraction = watchRefraction;
})();

/* Glass nav: darkens over the projects band, marks the stuck state, tracks the
   active section with a sliding pill, pointer glow, smooth anchor scrolling. */
(function () {
  "use strict";
  var IDS = ["mk2-thread", "mk2-building", "mk2-record", "mk2-contact"];

  function initNav() {
    var nav = document.querySelector(".mk2-nav");
    if (!nav) return;
    var links = nav.querySelector(".mk2-nav-links");
    var pill = nav.querySelector(".mk2-nav-pill");
    var active = "";

    function current() { return links.querySelector("a.nav-link-active"); }
    function moveTo(el) {
      if (!pill) return;
      if (!el || window.matchMedia("(max-width: 640px)").matches) { pill.classList.remove("pill-on"); return; }
      pill.style.left = el.offsetLeft + "px";
      pill.style.width = el.offsetWidth + "px";
      pill.classList.add("pill-on");
    }

    function update() {
      var y = nav.getBoundingClientRect().top + nav.offsetHeight / 2;
      var dark = false;
      document.querySelectorAll(".mk-projects").forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top <= y && r.bottom >= y) dark = true;
      });
      nav.classList.toggle("is-dark", dark);
      nav.classList.toggle("is-stuck", nav.getBoundingClientRect().top <= (parseFloat(getComputedStyle(nav).top) || 0) + 2 && window.scrollY > 40);
      var act = "";
      IDS.forEach(function (id) {
        var el = document.getElementById(id);
        if (!el) return;
        var r = el.getBoundingClientRect();
        if (r.top <= y + 40 && r.bottom > y + 40) act = id;
      });
      if (act !== active) {
        active = act;
        links.querySelectorAll("a").forEach(function (a) {
          a.classList.toggle("nav-link-active", a.getAttribute("data-nav") === act);
        });
        if (!links.matches(":hover")) moveTo(current());
      }
    }

    nav.addEventListener("pointermove", function (e) {
      var r = nav.getBoundingClientRect();
      nav.style.setProperty("--mx", (e.clientX - r.left) + "px");
      nav.style.setProperty("--my", (e.clientY - r.top) + "px");
    });
    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("pointerenter", function () { moveTo(a); });
      a.addEventListener("click", function (e) {
        var id = a.getAttribute("data-nav");
        var t = id && document.getElementById(id);
        if (!t) return;
        e.preventDefault();
        var rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        t.scrollIntoView({ behavior: rm ? "auto" : "smooth", block: "start" });
      });
    });
    links.addEventListener("pointerleave", function () { moveTo(current()); });

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    if (window.__watchRefraction) window.__watchRefraction(nav);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initNav);
  } else {
    initNav();
  }
})();
