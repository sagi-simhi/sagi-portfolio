/* ============================================================
   SAGI SIMHI - PORTFOLIO
   Vanilla JS interactions
   ============================================================ */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var nav = document.getElementById("siteNav");
  var navAnchors = document.querySelectorAll('.nav-links a[href^="#"]');
  var navLinkMap = {};
  var navAliasMap = { approach: "about" };

  navAnchors.forEach(function (anchor) {
    var id = anchor.getAttribute("href").slice(1);
    navLinkMap[id] = anchor;
  });

  function setActiveNavLink(id) {
    var mappedId = navAliasMap[id] || id;
    navAnchors.forEach(function (anchor) {
      var isActive = anchor === navLinkMap[mappedId];
      anchor.classList.toggle("nav-link-active", isActive);
      if (isActive) {
        anchor.setAttribute("aria-current", "location");
      } else {
        anchor.removeAttribute("aria-current");
      }
    });
  }

  function getNavOffset() {
    return nav ? nav.getBoundingClientRect().height + 28 : 0;
  }

  function scrollToTarget(target) {
    if (!target) return;

    var top = target.getBoundingClientRect().top + window.scrollY - getNavOffset();
    window.scrollTo({
      top: Math.max(0, top),
      behavior: reduceMotion ? "auto" : "smooth"
    });
  }

  function handleAnchorClick(event) {
    var href = this.getAttribute("href");
    if (!href || href.charAt(0) !== "#" || href.length < 2) return;

    var target = document.querySelector(href);
    if (!target) return;

    event.preventDefault();
    setActiveNavLink(href.slice(1));
    scrollToTarget(target);
    history.pushState(null, "", href);
  }

  var navBrand = document.getElementById("navBrand");
  if (navBrand) {
    navBrand.addEventListener("click", function (event) {
      event.preventDefault();
      setActiveNavLink(null);
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
      history.pushState(null, "", "#top");
    });
  }

  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    if (anchor !== navBrand) anchor.addEventListener("click", handleAnchorClick);
  });

  function updateScrollState() {
    var scrollY = window.scrollY || 0;

    if (nav) nav.classList.toggle("nav-scrolled", scrollY > 40);

    var maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    var progress = Math.min(1, Math.max(0, scrollY / maxScroll));
    var root = document.documentElement;

    root.style.setProperty("--bg-ambient-a", (0.12 - progress * 0.02).toFixed(3));
    root.style.setProperty("--bg-ambient-b", (0.08 - progress * 0.015).toFixed(3));
    root.style.setProperty("--bg-overlay-opacity", (0.02 + progress * 0.01).toFixed(3));
  }

  var scrollTicking = false;
  window.addEventListener("scroll", function () {
    if (scrollTicking) return;
    scrollTicking = true;
    window.requestAnimationFrame(function () {
      updateScrollState();
      scrollTicking = false;
    });
  }, { passive: true });
  updateScrollState();

  if (window.location.hash && window.location.hash.length > 1) {
    setActiveNavLink(window.location.hash.slice(1));
  }

  var sections = document.querySelectorAll("main .section, main .hero");
  if ("IntersectionObserver" in window && sections.length) {
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setActiveNavLink(entry.target.id);
      });
    }, {
      rootMargin: "-30% 0px -55% 0px",
      threshold: 0
    });

    sections.forEach(function (section) {
      sectionObserver.observe(section);
    });
  }

  var revealTargets = document.querySelectorAll(
    ".edu-card, .project-card, .timeline-item, .stack-group, .lgs-card"
  );

  if (!reduceMotion && "IntersectionObserver" in window) {
    var revealObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("reveal-visible");
        observer.unobserve(entry.target);
      });
    }, {
      threshold: 0.12,
      rootMargin: "0px 0px -8% 0px"
    });

    revealTargets.forEach(function (element) {
      element.classList.add("reveal");
      revealObserver.observe(element);
    });
  } else {
    revealTargets.forEach(function (element) {
      element.classList.add("reveal-visible");
    });
  }

  var activatable = document.querySelectorAll("main .section");
  if (!reduceMotion && "IntersectionObserver" in window) {
    var activationObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-active");
        observer.unobserve(entry.target);
      });
    }, {
      threshold: 0.2,
      rootMargin: "0px 0px -35% 0px"
    });

    activatable.forEach(function (section) {
      activationObserver.observe(section);
    });
  } else {
    activatable.forEach(function (section) {
      section.classList.add("is-active");
    });
  }

  var yearElement = document.getElementById("currentYear");
  if (yearElement) yearElement.textContent = new Date().getFullYear();
})();

(function initProjectModal() {
  "use strict";

  var modal = document.getElementById("projectModal");
  var frame = document.getElementById("projectModalFrame");
  var title = document.getElementById("projectModalTitle");
  var newTab = document.getElementById("projectModalNewTab");
  var closeButton = document.getElementById("projectModalClose");
  var projectLinks = document.querySelectorAll(".js-project-modal");
  var lastTrigger = null;

  if (!modal || !frame || !title || !newTab || !closeButton) return;

  function getFocusableElements() {
    return modal.querySelectorAll(
      'a[href], button:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])'
    );
  }

  function openModal(link) {
    lastTrigger = link;
    var url = link.getAttribute("href");
    var projectTitle = link.getAttribute("data-project-title") || "Project";

    frame.src = url;
    title.textContent = projectTitle;
    newTab.href = url;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("project-modal-lock");
    closeButton.focus();
  }

  function closeModal() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("project-modal-lock");
    frame.removeAttribute("src");
    if (lastTrigger) lastTrigger.focus();
  }

  projectLinks.forEach(function (link) {
    link.addEventListener("click", function (event) {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      openModal(link);
    });
  });

  modal.querySelectorAll("[data-modal-close]").forEach(function (element) {
    element.addEventListener("click", closeModal);
  });

  document.addEventListener("keydown", function (event) {
    if (!modal.classList.contains("is-open")) return;

    if (event.key === "Escape") {
      closeModal();
      return;
    }

    if (event.key !== "Tab") return;

    var focusable = Array.prototype.slice.call(getFocusableElements());
    if (!focusable.length) return;

    var first = focusable[0];
    var last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
})();

(function initThemeToggle() {
  "use strict";

  var toggle = document.getElementById("themeToggle");
  if (!toggle) return;

  function getInitialTheme() {
    var storedTheme = localStorage.getItem("theme");
    if (storedTheme === "light" || storedTheme === "dark") return storedTheme;
    return "dark";
  }

  function applyTheme(theme, persist) {
    document.documentElement.setAttribute("data-theme", theme);
    toggle.setAttribute("aria-label", theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
    toggle.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
    toggle.setAttribute("title", theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
    if (persist) localStorage.setItem("theme", theme);
  }

  applyTheme(getInitialTheme(), false);

  toggle.addEventListener("click", function () {
    var currentTheme = document.documentElement.getAttribute("data-theme");
    applyTheme(currentTheme === "light" ? "dark" : "light", true);
  });
})();


/* CSS-only card tilt/specular effect - replaces WebGL-dependent hover logic */
(function initCardTiltEffect() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (window.matchMedia("(pointer: coarse)").matches) return;

  var selectors = [
    '.about-facts',
    '.edu-card',
    '.project-card',
    '.stack-group',
    '.timeline-content',
    '.approach-step',
    '.lgs-card'
  ];

  var cards = Array.prototype.slice.call(document.querySelectorAll(selectors.join(',')));
  if (!cards.length) return;

  var activeCard = null;
  var ticking = false;

  function updateCardTransform(event) {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      applyCardTransform(activeCard, event);
      ticking = false;
    });
  }

  function applyCardTransform(card, event) {
    var rect = card.getBoundingClientRect();
    var relX = event.clientX - rect.left - rect.width / 2;
    var relY = event.clientY - rect.top - rect.height / 2;

    var normX = Math.max(-1, Math.min(1, relX / (rect.width / 2)));
    var normY = Math.max(-1, Math.min(1, relY / (rect.height / 2)));

    var tiltRange = 12;
    var rotateX = normY * -tiltRange;
    var rotateY = normX * tiltRange;

    // Apply smooth transform with easing
    if (!card.userData) card.userData = {};
    if (!card.userData.currentRotateX) card.userData.currentRotateX = 0;
    if (!card.userData.currentRotateY) card.userData.currentRotateY = 0;

    var easing = 0.1;
    card.userData.currentRotateX += (rotateX - card.userData.currentRotateX) * easing;
    card.userData.currentRotateY += (rotateY - card.userData.currentRotateY) * easing;

    card.style.transform =
      "perspective(1400px) rotateX(" + card.userData.currentRotateX.toFixed(2) + "deg) rotateY(" +
      card.userData.currentRotateY.toFixed(2) + "deg) translateZ(16px)";

    // Update CSS custom property for edge chromatic highlight
    var opacity = 0.82;

    card.style.setProperty('--highlight-opacity', opacity.toString());
  }

  function resetCardTransform(card) {
    if (!card.userData) card.userData = {};

    var easing = 0.12;
    card.userData.currentRotateX *= (1 - easing);
    card.userData.currentRotateY *= (1 - easing);

    if (Math.abs(card.userData.currentRotateX) < 0.01) card.userData.currentRotateX = 0;
    if (Math.abs(card.userData.currentRotateY) < 0.01) card.userData.currentRotateY = 0;

    card.style.transform =
      "perspective(1400px) rotateX(" + card.userData.currentRotateX.toFixed(2) + "deg) rotateY(" +
      card.userData.currentRotateY.toFixed(2) + "deg) translateZ(0px)";

    card.style.setProperty('--highlight-opacity', '0');
  }

  cards.forEach(function(card) {
    card.addEventListener('mousemove', function(event) {
      activeCard = card;
      updateCardTransform(event);
    });

    card.addEventListener('mouseleave', function() {
      resetCardTransform(card);
      activeCard = null;
    });

    card.addEventListener('pointerleave', function() {
      resetCardTransform(card);
      activeCard = null;
    });
  });
})();