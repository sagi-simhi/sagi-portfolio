/* ============================================================
   SAGI SIMHI - DATA ANALYST PORTFOLIO
   Vanilla JS interactions
   ============================================================ */

(function () {
  "use strict";

  const reduceMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const reduceTransparency = window.matchMedia &&
    window.matchMedia("(prefers-reduced-transparency: reduce)").matches;
  const coarsePointer = window.matchMedia &&
    window.matchMedia("(pointer: coarse)").matches;
  const smallViewport = window.matchMedia &&
    window.matchMedia("(max-width: 768px)").matches;

  /* Theme: stored choice wins, otherwise system preference, fallback light */
  const rootEl = document.documentElement;
  let storedTheme = null;
  try { storedTheme = localStorage.getItem("portfolio-theme"); } catch (e) {}
  const systemDark = window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  const initialTheme = storedTheme || (systemDark ? "dark" : "light");
  if (rootEl.getAttribute("data-theme") !== initialTheme) {
    rootEl.setAttribute("data-theme", initialTheme);
  }

  function initThemeToggle() {
    const toggle = document.getElementById("themeToggle");
    if (!toggle) return;
    toggle.setAttribute("aria-pressed", rootEl.getAttribute("data-theme") === "dark" ? "true" : "false");
    toggle.addEventListener("click", function () {
      const next = rootEl.getAttribute("data-theme") === "dark" ? "light" : "dark";
      rootEl.setAttribute("data-theme", next);
      try { localStorage.setItem("portfolio-theme", next); } catch (e) {}
      toggle.setAttribute("aria-pressed", next === "dark" ? "true" : "false");
    });
  }

  const siteNav = document.getElementById("siteNav");
  const navAnchors = document.querySelectorAll('.nav-links a[href^="#"]');
  const navLinkMap = {};

  navAnchors.forEach(function (anchor) {
    navLinkMap[anchor.getAttribute("href").slice(1)] = anchor;
  });

  function setActiveNavLink(id) {
    navAnchors.forEach(function (anchor) {
      const isActive = anchor === navLinkMap[id];
      anchor.classList.toggle("nav-link-active", isActive);
      if (isActive) {
        anchor.setAttribute("aria-current", "location");
      } else {
        anchor.removeAttribute("aria-current");
      }
    });
  }

  function getNavOffset() {
    return siteNav ? siteNav.getBoundingClientRect().height + 24 : 0;
  }

  function scrollToTarget(target) {
    if (!target) return;
    const top = target.getBoundingClientRect().top + window.scrollY - getNavOffset();
    window.scrollTo({
      top: Math.max(0, top),
      behavior: reduceMotion ? "auto" : "smooth"
    });
  }

  function handleAnchorClick(event) {
    const href = this.getAttribute("href");
    if (!href || href.charAt(0) !== "#" || href.length < 2) return;
    const target = document.querySelector(href);
    if (!target) return;
    event.preventDefault();
    setActiveNavLink(href.slice(1));
    scrollToTarget(target);
    history.pushState(null, "", href);
  }

  function initAnchorHandlers() {
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      anchor.addEventListener("click", handleAnchorClick);
    });
  }

  /* Mobile menu: hamburger toggles a glass dropdown with all sections */
  function initNavToggle() {
    const toggle = document.getElementById("navToggle");
    if (!siteNav || !toggle) return;

    function setOpen(open) {
      siteNav.classList.toggle("nav-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    }

    toggle.addEventListener("click", function (event) {
      event.stopPropagation();
      setOpen(!siteNav.classList.contains("nav-open"));
    });

    document.addEventListener("click", function (event) {
      if (!siteNav.contains(event.target)) setOpen(false);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") setOpen(false);
    });

    navAnchors.forEach(function (anchor) {
      anchor.addEventListener("click", function () { setOpen(false); });
    });
  }

  /* Nav shadow once the page is scrolled */
  function initScrollHandlers() {
    let ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        if (siteNav) {
          siteNav.classList.toggle("nav-scrolled", window.scrollY > 40);
        }
        ticking = false;
      });
    }, { passive: true });
  }

  function initHashHandler() {
    if (window.location.hash && window.location.hash.length > 1) {
      setActiveNavLink(window.location.hash.slice(1));
    }
    window.addEventListener("hashchange", function () {
      if (window.location.hash && window.location.hash.length > 1) {
        setActiveNavLink(window.location.hash.slice(1));
      }
    });
  }

  /* Highlight the nav link of the section currently in view */
  function initSectionSpy() {
    const sections = document.querySelectorAll("main .section[id], main .hero[id]");
    if (!("IntersectionObserver" in window) || !sections.length) return;

    const spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && entry.target.id) {
          setActiveNavLink(entry.target.id);
        }
      });
    }, {
      rootMargin: "-30% 0px -60% 0px",
      threshold: 0
    });

    sections.forEach(function (section) {
      spy.observe(section);
    });
  }

  /* Reveal cards as they scroll into view */
  function initRevealAnimations() {
    const targets = document.querySelectorAll(
      ".education-item, .skill-category, .timeline-item, .project-card, .prose-card, .contact-card, .hero-portrait, .hero-text"
    );

    if (reduceMotion || !("IntersectionObserver" in window) || !targets.length) {
      targets.forEach(function (el) { el.classList.add("reveal-visible"); });
      return;
    }

    let observerFired = false;
    const observer = new IntersectionObserver(function (entries, obs) {
      observerFired = true;
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("reveal-visible");
        obs.unobserve(entry.target);
      });
    }, {
      threshold: 0.08,
      rootMargin: "0px 0px -60px 0px"
    });

    targets.forEach(function (el, index) {
      el.classList.add("reveal");
      el.style.setProperty("--reveal-delay", Math.min(index % 4, 3) * 55 + "ms");
      observer.observe(el);
    });

    // Safety net: if the observer never fires (embedded contexts), show everything.
    window.setTimeout(function () {
      if (!observerFired) {
        targets.forEach(function (el) { el.classList.add("reveal-visible"); });
        observer.disconnect();
      }
    }, 1500);
  }

  /* Liquid-glass specular highlight follows the pointer over glass surfaces */
  function initSpecularHighlight() {
    if (reduceMotion || coarsePointer || !window.matchMedia("(pointer: fine)").matches) return;

    document.querySelectorAll(".glass-card, .glass-pill, .glass-chip, .btn-glass").forEach(function (el) {
      el.addEventListener("pointermove", function (event) {
        const rect = el.getBoundingClientRect();
        el.style.setProperty("--mx", ((event.clientX - rect.left) / rect.width * 100).toFixed(2) + "%");
        el.style.setProperty("--my", ((event.clientY - rect.top) / rect.height * 100).toFixed(2) + "%");
      });
      el.addEventListener("pointerleave", function () {
        el.style.removeProperty("--mx");
        el.style.removeProperty("--my");
      });
    });
  }

  const glassDebug = new URLSearchParams(window.location.search).get("glassdebug") === "1";
  const tierLog = [];
  const TIER_ONE_LIMIT = 8;
  const REFRACTION_SCALE = 24;
  const DISPERSION_OFFSET = 3.5;
  const filterCache = new WeakMap();

  function debugGlass(message, details) {
    if (!glassDebug) return;
    const entry = details ? { message: message, details: details } : { message: message };
    tierLog.push(entry);
    console.info("[glass]", message, details || "");
  }

  function createEdgeMap(width, height, radius) {
    const safeRadius = Math.max(0, Math.min(radius, Math.min(width, height) / 2));
    const edge = Math.max(2, Math.min(12, Math.round(Math.min(width, height) * 0.16)));
    const svg = [
      '<svg xmlns="http://www.w3.org/2000/svg" width="', width, '" height="', height,
      '" viewBox="0 0 ', width, ' ', height, '">',
      '<defs></defs>',
      '<rect width="100%" height="100%" rx="', safeRadius, '" fill="rgb(128,128,128)"/>',
      '<rect x="0" y="0" width="100%" height="', edge, '" rx="', safeRadius, '" fill="rgb(128,168,128)"/>',
      '<rect x="0" y="', height - edge, '" width="100%" height="', edge, '" rx="', safeRadius, '" fill="rgb(128,88,128)"/>',
      '<rect x="0" y="', edge, '" width="', edge, '" height="', Math.max(0, height - edge * 2), '" fill="rgb(168,128,128)"/>',
      '<rect x="', width - edge, '" y="', edge, '" width="', edge, '" height="', Math.max(0, height - edge * 2), '" fill="rgb(88,128,128)"/>',
      '</svg>'
    ].join("");
    return {
      href: "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg),
      nonFlat: edge > 1 && width > edge * 2 && height > edge * 2,
      neutral: svg.indexOf("rgb(128,128,128)") !== -1
    };
  }

  function isChromiumEngine() {
    const brands = navigator.userAgentData && navigator.userAgentData.brands;
    if (brands && brands.length) return brands.some(function (brand) { return /Chromium|Google Chrome|Microsoft Edge/i.test(brand.brand); });
    return /Chrome|Edg\//i.test(navigator.userAgent) && !/Firefox|OPR\//i.test(navigator.userAgent);
  }

  function verifyMapCanvas(map) {
    if (!map.nonFlat || !map.neutral) return false;
    const canvas = document.createElement("canvas");
    canvas.width = 3;
    canvas.height = 3;
    const context = canvas.getContext("2d");
    if (!context) return false;
    context.fillStyle = "rgb(128,128,128)";
    context.fillRect(0, 0, 3, 3);
    context.fillStyle = "rgb(132,128,128)";
    context.fillRect(0, 0, 1, 1);
    const pixels = context.getImageData(0, 0, 3, 3).data;
    return pixels[0] !== pixels[4];
  }

  function buildFilter(element, width, height, radius) {
    const filterDefs = document.getElementById("glass-filters");
    if (!filterDefs) return null;
    const cached = filterCache.get(element);
    if (cached && cached.width === width && cached.height === height) return cached;
    const map = createEdgeMap(width, height, radius);
    if (!verifyMapCanvas(map)) return null;
    const id = "glass-refract-" + Math.random().toString(36).slice(2);
    const filter = document.createElementNS("http://www.w3.org/2000/svg", "filter");
    filter.id = id;
    filter.setAttribute("x", "-5%");
    filter.setAttribute("y", "-5%");
    filter.setAttribute("width", "110%");
    filter.setAttribute("height", "110%");
    filter.setAttribute("color-interpolation-filters", "sRGB");
    function primitive(name, attrs) {
      const node = document.createElementNS("http://www.w3.org/2000/svg", name);
      Object.keys(attrs).forEach(function (key) { node.setAttribute(key, attrs[key]); });
      node.setAttribute("color-interpolation-filters", "sRGB");
      filter.appendChild(node);
      return node;
    }
    primitive("feImage", { result: "edge-map", x: "0", y: "0", width: "100%", height: "100%", preserveAspectRatio: "none", href: map.href });
    primitive("feDisplacementMap", { in: "SourceGraphic", in2: "edge-map", scale: String(REFRACTION_SCALE), xChannelSelector: "R", yChannelSelector: "G", result: "base" });
    primitive("feDisplacementMap", { in: "SourceGraphic", in2: "edge-map", scale: String(REFRACTION_SCALE + DISPERSION_OFFSET), xChannelSelector: "R", yChannelSelector: "G", result: "red" });
    primitive("feDisplacementMap", { in: "SourceGraphic", in2: "edge-map", scale: String(REFRACTION_SCALE - DISPERSION_OFFSET), xChannelSelector: "R", yChannelSelector: "G", result: "blue" });
    primitive("feColorMatrix", { in: "red", type: "matrix", values: "1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0", result: "red-only" });
    primitive("feColorMatrix", { in: "base", type: "matrix", values: "0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0", result: "green-only" });
    primitive("feColorMatrix", { in: "blue", type: "matrix", values: "0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0", result: "blue-only" });
    primitive("feBlend", { in: "red-only", in2: "green-only", mode: "screen", result: "rg" });
    primitive("feBlend", { in: "rg", in2: "blue-only", mode: "screen", result: "rgb" });
    filterDefs.appendChild(filter);
    const result = { id: id, width: width, height: height, map: map };
    filterCache.set(element, result);
    return result;
  }

  function initRefraction() {
    const targets = Array.from(document.querySelectorAll(".glass-pill, .glass-chip, .btn-glass, .hero-portrait, #themeToggle"));
    const cards = document.querySelectorAll(".glass-card");
    function setupDebugStripe() {
      if (!glassDebug) return;
      document.body.classList.add("glass-debug");
      const stripe = document.createElement("div");
      stripe.className = "glass-debug-stripe";
      stripe.setAttribute("aria-hidden", "true");
      document.body.appendChild(stripe);
    }
    cards.forEach(function (element) {
      element.dataset.glassTier = "2";
      debugGlass("Tier 2", { element: element.className, reason: "content card policy" });
    });
    targets.forEach(function (element) { element.dataset.glassTier = "2"; });
    if (reduceMotion || reduceTransparency || smallViewport || !window.CSS) {
      targets.forEach(function (element) { debugGlass("Tier 2", { element: element.className, reason: "motion/transparency/mobile gate" }); });
      setupDebugStripe();
      return;
    }
    const gate = {
      cssSupports: CSS.supports("backdrop-filter", "url(#x) blur(1px)"),
      chromium: isChromiumEngine(),
      mapNonFlat: false,
      computedFilter: false
    };
    const probeMap = createEdgeMap(80, 40, 20);
    gate.mapNonFlat = verifyMapCanvas(probeMap);
    const probe = document.querySelector(".glass-pill");
    if (gate.cssSupports && gate.chromium && gate.mapNonFlat && probe) {
      const probeFilter = buildFilter(probe, 80, 40, 20);
      if (probeFilter) {
        probe.style.setProperty("--refract-filter", 'url("#' + probeFilter.id + '")');
        probe.classList.add("refract-on");
        gate.computedFilter = getComputedStyle(probe).backdropFilter !== "none";
        if (!gate.computedFilter) probe.classList.remove("refract-on");
      }
    }
    debugGlass("CSS.supports URL filter", gate.cssSupports);
    debugGlass("Chromium engine gate", gate.chromium);
    debugGlass("Displacement map neutral/non-flat gate", gate.mapNonFlat);
    debugGlass("Computed backdrop-filter gate", gate.computedFilter);
    debugGlass("Tier 1 capability gate", gate);
    if (glassDebug) window.__glassDebug = { tierLog: tierLog, gate: gate, constants: { refractionScale: REFRACTION_SCALE, dispersionOffset: DISPERSION_OFFSET } };
    if (!(gate.cssSupports && gate.chromium && gate.mapNonFlat && gate.computedFilter)) {
      targets.forEach(function (element) { debugGlass("Tier 2", { element: element.className, reason: "capability gate failed" }); });
      setupDebugStripe();
      return;
    }
    const active = new Set();
    const resizeQueue = new Set();
    let resizeFrame = 0;
    function regenerate(element) {
      if (!active.has(element)) return;
      const rect = element.getBoundingClientRect();
      const width = Math.round(rect.width);
      const height = Math.round(rect.height);
      if (!width || !height) return;
      const radius = parseFloat(getComputedStyle(element).borderTopLeftRadius) || 0;
      const result = buildFilter(element, width, height, radius);
      if (!result) return;
      element.style.setProperty("--refract-filter", 'url("#' + result.id + '")');
      element.dataset.glassTier = "1";
      if (element.classList.contains("hero-portrait")) element.classList.add("refract-static");
      debugGlass("Tier 1", { element: element.className, filter: result.id, scale: REFRACTION_SCALE, dispersionOffset: DISPERSION_OFFSET });
    }
    function queueResize(element) {
      resizeQueue.add(element);
      if (resizeFrame) return;
      resizeFrame = requestAnimationFrame(function () {
        resizeQueue.forEach(regenerate);
        resizeQueue.clear();
        resizeFrame = 0;
      });
    }
    const resizeObserver = "ResizeObserver" in window ? new ResizeObserver(function (entries) {
      entries.forEach(function (entry) { queueResize(entry.target); });
    }) : null;
    function activate(element) {
      if (active.size >= TIER_ONE_LIMIT || active.has(element)) return;
      active.add(element);
      element.classList.add("refract-on");
      if (resizeObserver) resizeObserver.observe(element);
      regenerate(element);
    }
    function deactivate(element) {
      active.delete(element);
      element.classList.remove("refract-on", "refract-static");
      if (resizeObserver) resizeObserver.unobserve(element);
    }
    targets.slice(0, TIER_ONE_LIMIT).forEach(activate);
    window.addEventListener("resize", function () { active.forEach(queueResize); }, { passive: true });
    if (glassDebug) {
      setupDebugStripe();
      debugGlass("Debug stripe", { status: "visible behind Tier 1 elements; verify bend and color fringe in screenshot" });
      window.__glassDebug = { tierLog: tierLog, gate: gate, constants: { refractionScale: REFRACTION_SCALE, dispersionOffset: DISPERSION_OFFSET } };
    }
  }

  function initExternalLinkModals() {
    const modal = document.getElementById("extModal");
    if (!modal) return;
    const titleEl = document.getElementById("extModalTitle");
    const descEl = document.getElementById("extModalDesc");
    const urlEl = document.getElementById("extModalUrl");
    const goBtn = document.getElementById("extModalGo");
    const copyBtn = document.getElementById("extModalCopy");
    const closeBtn = document.getElementById("extModalClose");
    let goAction = null;
    let lastFocus = null;

    function openModal(opts) {
      lastFocus = document.activeElement;
      titleEl.textContent = opts.title;
      descEl.textContent = opts.desc;
      urlEl.textContent = opts.urlText;
      goBtn.textContent = opts.goLabel;
      goAction = opts.onGo;
      if (opts.copyText) {
        copyBtn.hidden = false;
        copyBtn.textContent = "Copy Address";
        copyBtn.dataset.copy = opts.copyText;
      } else {
        copyBtn.hidden = true;
        delete copyBtn.dataset.copy;
      }
      modal.hidden = false;
      requestAnimationFrame(() => modal.classList.add("ext-modal-open"));
      document.body.classList.add("ext-modal-locked");
      goBtn.focus();
    }

    function closeModal() {
      modal.classList.remove("ext-modal-open");
      document.body.classList.remove("ext-modal-locked");
      goAction = null;
      window.setTimeout(() => { modal.hidden = true; }, 180);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    document.addEventListener("click", (event) => {
      const anchor = event.target.closest("a[href]");
      if (!anchor) return;
      const href = anchor.getAttribute("href") || "";
      if (href.startsWith("mailto:")) {
        event.preventDefault();
        const address = href.slice("mailto:".length).split("?")[0];
        openModal({
          title: "Email",
          desc: "This opens your mail app with a new message to:",
          urlText: address,
          goLabel: "Open Mail App",
          onGo: () => { window.location.href = href; },
          copyText: address,
        });
        return;
      }
    });

    goBtn.addEventListener("click", () => {
      const action = goAction;
      closeModal();
      if (action) action();
    });
    copyBtn.addEventListener("click", () => {
      const text = copyBtn.dataset.copy;
      if (!text) return;
      const success = () => { copyBtn.textContent = "Copied"; };
      const fail = () => {
        const range = document.createRange();
        range.selectNodeContents(urlEl);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        copyBtn.textContent = "Select and copy";
      };
      const legacy = () => {
        const area = document.createElement("textarea");
        area.value = text;
        area.style.position = "fixed";
        area.style.opacity = "0";
        document.body.appendChild(area);
        area.select();
        let ok = false;
        try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
        document.body.removeChild(area);
        if (ok) { success(); } else { fail(); }
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(success).catch(legacy);
      } else {
        legacy();
      }
    });
    closeBtn.addEventListener("click", closeModal);
    modal.addEventListener("click", (event) => { if (event.target === modal) closeModal(); });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !modal.hidden) closeModal();
    });
  }

  function init() {
    initAnchorHandlers();
    initExternalLinkModals();
    initThemeToggle();
    initNavToggle();
    initScrollHandlers();
    initHashHandler();
    initSectionSpy();
    initRevealAnimations();
    initSpecularHighlight();
    initRefraction();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
