/* ============================================================
   SAGI SIMHI — PORTFOLIO
   Vanilla JS interactions
   ============================================================ */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ============================================================
     1. SMOOTH SCROLL — nav brand + nav links (with sticky-nav offset)
     ============================================================ */
  var nav = document.getElementById("siteNav");
  var progressBar = document.getElementById("scrollProgressBar");

  function getNavOffset() {
    return nav ? nav.getBoundingClientRect().height + 8 : 0;
  }

  function scrollToTarget(target) {
    if (!target) return;
    var top = target.getBoundingClientRect().top + window.pageYOffset - getNavOffset();
    window.scrollTo({
      top: top,
      behavior: reduceMotion ? "auto" : "smooth"
    });
  }

  function handleAnchorClick(e) {
    var href = this.getAttribute("href");
    if (!href || href.charAt(0) !== "#" || href.length < 2) return;
    var target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    scrollToTarget(target);
    history.pushState(null, "", href);
    target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
  }

  var navBrand = document.getElementById("navBrand");
  if (navBrand) {
    navBrand.addEventListener("click", function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
      history.pushState(null, "", "#top");
    });
  }

  var navAnchors = document.querySelectorAll('.nav-links a[href^="#"]');
  navAnchors.forEach(function (a) {
    a.addEventListener("click", handleAnchorClick);
  });

  var ctaAnchors = document.querySelectorAll('.hero-cta a[href^="#"], .contact-actions a[href^="#"]');
  ctaAnchors.forEach(function (a) {
    a.addEventListener("click", handleAnchorClick);
  });

  /* ============================================================
     2. SCROLLED NAV + PROGRESSIVE BACKGROUND LIGHTENING
     ============================================================ */
  if (nav) {
    var scrollThreshold = 40;
    var ticking = false;

    function clamp(value, min, max) {
      return Math.min(max, Math.max(min, value));
    }

    function updateNavState() {
      if (window.pageYOffset > scrollThreshold) {
        nav.classList.add("nav-scrolled");
      } else {
        nav.classList.remove("nav-scrolled");
      }

      var maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      var progress = clamp(window.pageYOffset / maxScroll, 0, 1);
      var ambientA = (0.06 + progress * 0.09).toFixed(3);
      var ambientB = (0.04 + progress * 0.08).toFixed(3);
      var overlayOpacity = (0.02 + progress * 0.16).toFixed(3);

      document.documentElement.style.setProperty("--bg-ambient-a", ambientA);
      document.documentElement.style.setProperty("--bg-ambient-b", ambientB);
      document.documentElement.style.setProperty("--bg-overlay-opacity", overlayOpacity);

      if (progressBar) {
        progressBar.style.width = (progress * 100) + "%";
      }

      ticking = false;
    }

    window.addEventListener("scroll", function () {
      if (!ticking) {
        window.requestAnimationFrame(updateNavState);
        ticking = true;
      }
    }, { passive: true });

    window.addEventListener("resize", updateNavState);
    updateNavState();
  }

  /* ============================================================
     3. ACTIVE SECTION HIGHLIGHT — nav link matches section in view
     ============================================================ */
  var sections = document.querySelectorAll("main .section, .hero");
  var navLinkMap = {};
  navAnchors.forEach(function (a) {
    var id = a.getAttribute("href").replace("#", "");
    navLinkMap[id] = a;
  });

  if ("IntersectionObserver" in window && sections.length) {
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var id = entry.target.id;
        var link = navLinkMap[id];
        if (!link) return;
        if (entry.isIntersecting) {
          navAnchors.forEach(function (a) { a.classList.remove("nav-link-active"); });
          link.classList.add("nav-link-active");
        }
      });
    }, {
      rootMargin: "-45% 0px -50% 0px",
      threshold: 0
    });

    sections.forEach(function (s) {
      if (s.id) sectionObserver.observe(s);
    });
  }

  /* ============================================================
     4. SECTION REVEAL — quiet fade/rise on first scroll into view
     ============================================================ */
  var revealTargets = document.querySelectorAll(
    ".edu-card, .project-card, .timeline-item, .stack-group"
  );

  if (!reduceMotion && "IntersectionObserver" in window && revealTargets.length) {
    revealTargets.forEach(function (el) {
      el.classList.add("reveal");
    });

    var revealObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("reveal-visible");
          obs.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: "0px 0px -40px 0px"
    });

    revealTargets.forEach(function (el) {
      revealObserver.observe(el);
    });
  } else {
    revealTargets.forEach(function (el) {
      el.classList.add("reveal-visible");
    });
  }

  /* ============================================================
     5. CURRENT YEAR (optional footer nicety, safe no-op if absent)
     ============================================================ */
  var yearEl = document.getElementById("currentYear");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

})();