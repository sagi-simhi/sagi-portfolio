/* ============================================================
   FINANCIAL INTELLIGENCE PLATFORM — App Shell Router
   Minimal hash-based SPA switcher. No reload, no dependencies.
   Each nav item toggles a matching <section data-view-panel>.
   ============================================================ */
(function () {
  "use strict";

  var VIEWS = {
    dashboard: {
      title: "Dashboard",
      sub: "Portfolio overview, market context, and AI-surfaced signals."
    },
    portfolio: {
      title: "Portfolio",
      sub: "Allocation, risk profile, diversification, and performance."
    },
    research: {
      title: "Research",
      sub: "Structured company and ETF research, built over time."
    },
    assistant: {
      title: "AI Assistant",
      sub: "A context-aware research and portfolio explainer."
    },
    learning: {
      title: "Learning",
      sub: "Structured lessons on markets, risk, and behavioral finance."
    },
    insights: {
      title: "Insights",
      sub: "Behavioral patterns and decision reflection over time."
    }
  };

  var DEFAULT_VIEW = "dashboard";

  var navLinks = document.querySelectorAll(".app-nav-link[data-view]");
  var panels = document.querySelectorAll(".app-view[data-view-panel]");
  var titleEl = document.getElementById("appViewTitle");
  var subEl = document.getElementById("appViewSub");

  function resolveViewFromHash() {
    var raw = window.location.hash.replace("#", "");
    return VIEWS[raw] ? raw : DEFAULT_VIEW;
  }

  function setView(viewId) {
    if (!VIEWS[viewId]) viewId = DEFAULT_VIEW;

    panels.forEach(function (panel) {
      var isMatch = panel.getAttribute("data-view-panel") === viewId;
      panel.hidden = !isMatch;
    });

    navLinks.forEach(function (link) {
      var isMatch = link.getAttribute("data-view") === viewId;
      link.classList.toggle("is-active", isMatch);
      if (isMatch) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });

    if (titleEl) titleEl.textContent = VIEWS[viewId].title;
    if (subEl) subEl.textContent = VIEWS[viewId].sub;

    document.title = VIEWS[viewId].title + " - Financial Intelligence Platform";
  }

  window.addEventListener("hashchange", function () {
    setView(resolveViewFromHash());
  });

  // Initial render — respects a direct link like index.html#research
  if (!window.location.hash) {
    history.replaceState(null, "", "#" + DEFAULT_VIEW);
  }
  setView(resolveViewFromHash());
})();
