/* ============================================================
   SAGI SIMHI - DATA ANALYST PORTFOLIO
   Vanilla JS interactions (no external dependencies)
   ============================================================ */

(function () {
  "use strict";

  const reduceMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

    targets.forEach(function (el) {
      el.classList.add("reveal");
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
    if (reduceMotion || !window.matchMedia("(pointer: fine)").matches) return;

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

  function init() {
    initAnchorHandlers();
  initThemeToggle();
    initNavToggle();
    initScrollHandlers();
    initHashHandler();
    initSectionSpy();
    initRevealAnimations();
    initSpecularHighlight();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
