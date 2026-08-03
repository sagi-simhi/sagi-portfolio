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
  var navAnchors = document.querySelectorAll('.nav-links a[href^="#"]');
  var navLinkMap = {};

  navAnchors.forEach(function (a) {
    var id = a.getAttribute("href").replace("#", "");
    navLinkMap[id] = a;
  });

  function setActiveNavLink(id) {
    var activeLink = id ? navLinkMap[id] : null;
    navAnchors.forEach(function (a) {
      a.classList.remove("nav-link-active");
    });
    if (activeLink) {
      activeLink.classList.add("nav-link-active");
    }
  }

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
    setActiveNavLink(href.replace("#", ""));
    scrollToTarget(target);
    history.pushState(null, "", href);
    target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
  }

  var navBrand = document.getElementById("navBrand");
  if (navBrand) {
    navBrand.addEventListener("click", function (e) {
      e.preventDefault();
      setActiveNavLink(null);
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
      history.pushState(null, "", "#top");
    });
  }

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

  if ("IntersectionObserver" in window && sections.length) {
    var sectionInView = {};
    var sectionIdsInOrder = [];

    sections.forEach(function (s) {
      if (!s.id) return;
      sectionIdsInOrder.push(s.id);
      sectionInView[s.id] = false;
    });

    function resolveActiveSection() {
      var activeId = null;
      sectionIdsInOrder.forEach(function (id) {
        if (sectionInView[id]) activeId = id;
      });
      setActiveNavLink(activeId);
    }

    function getSectionObserverRootMargin() {
      var topOffset = Math.round(getNavOffset());
      return "-" + topOffset + "px 0px -40% 0px";
    }

    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var id = entry.target.id;
        if (!id || !Object.prototype.hasOwnProperty.call(sectionInView, id)) return;
        sectionInView[id] = entry.isIntersecting;
      });
      resolveActiveSection();
    }, {
      rootMargin: getSectionObserverRootMargin(),
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
     5. SECTION ACTIVATION — each section "wakes up" once, quietly
        Adds .is-active to a <section> the first time it enters the
        viewport. The only visible effect lives in the eyebrow-signal
        mark inside that section's own header (see style.css) — no
        separate timeline UI, no repeated triggering.
     ============================================================ */
  var activatable = document.querySelectorAll("main .section");

  if (!reduceMotion && "IntersectionObserver" in window && activatable.length) {
    var activationObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-active");
          obs.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.2,
      rootMargin: "0px 0px -35% 0px"
    });

    activatable.forEach(function (el) {
      activationObserver.observe(el);
    });
  } else {
    activatable.forEach(function (el) {
      el.classList.add("is-active");
    });
  }

  /* ============================================================
     6. CURRENT YEAR (optional footer nicety, safe no-op if absent)
     ============================================================ */
  var yearEl = document.getElementById("currentYear");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  

})();

/* ============================================
   Premium Typewriter Hero Animation
   Runs once on page load. Progressive character
   reveal only — no opacity/transform animation
   on the heading itself.
   ============================================ */
(function initHeroTypewriter() {
    function run() {
        const heroTitle = document.getElementById('heroTitle');
        if (!heroTitle) return;

        const visual = heroTitle.querySelector('.hero-title-visual');
        if (!visual) return;

        // Bail out early for reduced-motion users: leave the
        // full static text exactly as rendered in HTML.
        const prefersReducedMotion = window.matchMedia(
            '(prefers-reduced-motion: reduce)'
        ).matches;
        if (prefersReducedMotion) return;

        const lines = Array.from(visual.querySelectorAll('.hero-line'));
        if (lines.length === 0) return;

        // Capture each line's real text, then clear it for typing.
        const lineTexts = lines.map((line) => line.textContent);
        lines.forEach((line) => {
            line.textContent = '';
        });

        // Single shared cursor node, moved between lines as needed.
        const cursor = document.createElement('span');
        cursor.className = 'typewriter-cursor';
        cursor.setAttribute('aria-hidden', 'true');

        const MIN_CHAR_DELAY = 35;
        const MAX_CHAR_DELAY = 45;
        const PAUSE_BETWEEN_WORDS = 250;
        const FINAL_PAUSE = 300;

        const randomCharDelay = () =>
            MIN_CHAR_DELAY + Math.random() * (MAX_CHAR_DELAY - MIN_CHAR_DELAY);

        const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

        // Types a single line character-by-character.
        // Cursor is always kept as the last child, so each new
        // character is inserted immediately before it — this keeps
        // the caret glued to the current typing position with no
        // extra DOM reflow beyond a single text node insertion.
        function typeLine(lineEl, text) {
            return new Promise((resolve) => {
                lineEl.appendChild(cursor);
                let i = 0;

                function typeNextChar() {
                    if (i < text.length) {
                        lineEl.insertBefore(
                            document.createTextNode(text[i]),
                            cursor
                        );
                        i += 1;
                        setTimeout(typeNextChar, randomCharDelay());
                    } else {
                        resolve();
                    }
                }

                typeNextChar();
            });
        }

        async function runSequence() {
            for (let i = 0; i < lines.length; i += 1) {
                await typeLine(lines[i], lineTexts[i]);
                if (i < lines.length - 1) {
                    await wait(PAUSE_BETWEEN_WORDS);
                }
            }
            await wait(FINAL_PAUSE);
            cursor.remove(); // caret disappears once typing is done
        }

        runSequence();
    }

    // Ensure DOM is ready before querying elements, in case this
    // script is loaded in <head> rather than at the end of <body>.
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', run);
    } else {
        run();
    }
})();

/* ============================================================
   Financial Intelligence Core
   A single persistent node-sphere rendered on <canvas id="coreCanvas">
   at page level. Scroll-driven semantic states tune the same system
   over time (no re-instantiation, no per-section duplicates).
   ============================================================ */
(function initFinancialCore() {
    function run() {
        var canvas = document.getElementById('coreCanvas');
        if (!canvas || !canvas.getContext) return;

        var ctx = canvas.getContext('2d');
        var prefersReducedMotion = window.matchMedia &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        var accent = [83, 215, 166];   // #53D7A6
        var gold = [201, 161, 90];     // reserved for signal nodes only
        var ringColor = [148, 163, 184]; // neutral instrument-boundary ring

        var nodes = [];
        var NODE_COUNT = 46;
        var LINK_DISTANCE = 0.5;  // sparser, more deliberate lattice
        var SIGNAL_COUNT = 6;     // key data points the core hub connects to
        var spokeIndices = [];
        var pulses = [];
        var width = 0, height = 0, radius = 0, dpr = 1;
        var rotY = 0, rotX = 0.35;
        var rafId = null;
        var lastTime = null;
        var BASE_ROT_SPEED = 0.00007;
        var BASE_LINK_DISTANCE = LINK_DISTANCE;

        var CORE_STATES = {
            INITIALIZATION: 'INITIALIZATION',
            EXPLORATION: 'EXPLORATION',
            EXPANSION: 'EXPANSION',
            VALIDATION: 'VALIDATION',
            CONVERGENCE: 'CONVERGENCE'
        };

        var stateProfiles = {};
        stateProfiles[CORE_STATES.INITIALIZATION] = {
            centerX: 0.60,
            centerY: 0.50,
            coreScale: 1.08,
            presence: 1.00,
            layerOpacity: 0.42,
            ambientStrength: 0.58,
            latticeIntensity: 0.32,
            spokeIntensity: 0.50,
            nodeIntensity: 0.66,
            pulseStrength: 0.22,
            pulseSpeed: 0.54,
            rotationSpeed: 0.44,
            coherence: 0.84,
            coreBreath: 0.46
        };
        stateProfiles[CORE_STATES.EXPLORATION] = {
            centerX: 0.56,
            centerY: 0.52,
            coreScale: 1.00,
            presence: 0.90,
            layerOpacity: 0.60,
            ambientStrength: 0.68,
            latticeIntensity: 0.68,
            spokeIntensity: 0.78,
            nodeIntensity: 0.84,
            pulseStrength: 0.72,
            pulseSpeed: 1.05,
            rotationSpeed: 0.80,
            coherence: 0.93,
            coreBreath: 0.76
        };
        stateProfiles[CORE_STATES.EXPANSION] = {
            centerX: 0.53,
            centerY: 0.50,
            coreScale: 1.12,
            presence: 0.95,
            layerOpacity: 0.72,
            ambientStrength: 0.80,
            latticeIntensity: 0.90,
            spokeIntensity: 0.90,
            nodeIntensity: 0.96,
            pulseStrength: 0.74,
            pulseSpeed: 0.96,
            rotationSpeed: 0.74,
            coherence: 1.12,
            coreBreath: 0.78
        };
        stateProfiles[CORE_STATES.VALIDATION] = {
            centerX: 0.57,
            centerY: 0.48,
            coreScale: 1.03,
            presence: 0.95,
            layerOpacity: 0.80,
            ambientStrength: 0.86,
            latticeIntensity: 0.84,
            spokeIntensity: 0.96,
            nodeIntensity: 1.00,
            pulseStrength: 0.58,
            pulseSpeed: 0.68,
            rotationSpeed: 0.48,
            coherence: 1.18,
            coreBreath: 0.58
        };
        stateProfiles[CORE_STATES.CONVERGENCE] = {
            centerX: 0.55,
            centerY: 0.50,
            coreScale: 1.09,
            presence: 0.98,
            layerOpacity: 0.88,
            ambientStrength: 0.92,
            latticeIntensity: 0.94,
            spokeIntensity: 1.00,
            nodeIntensity: 1.00,
            pulseStrength: 0.60,
            pulseSpeed: 0.74,
            rotationSpeed: 0.54,
            coherence: 1.14,
            coreBreath: 0.60
        };

        function cloneProfile(profile) {
            return {
                centerX: profile.centerX,
                centerY: profile.centerY,
                coreScale: profile.coreScale,
                presence: profile.presence,
                layerOpacity: profile.layerOpacity,
                ambientStrength: profile.ambientStrength,
                latticeIntensity: profile.latticeIntensity,
                spokeIntensity: profile.spokeIntensity,
                nodeIntensity: profile.nodeIntensity,
                pulseStrength: profile.pulseStrength,
                pulseSpeed: profile.pulseSpeed,
                rotationSpeed: profile.rotationSpeed,
                coherence: profile.coherence,
                coreBreath: profile.coreBreath
            };
        }

        var activeState = CORE_STATES.INITIALIZATION;
        var targetProfile = cloneProfile(stateProfiles[activeState]);
        var currentProfile = cloneProfile(stateProfiles[activeState]);

        // Fibonacci sphere distribution — even spacing, no clustering
        // at the poles, which is what makes a node-sphere read as
        // deliberate/structured rather than random "particles".
        function buildNodes() {
            nodes = [];
            var offset = 2 / NODE_COUNT;
            var increment = Math.PI * (3 - Math.sqrt(5)); // golden angle
            for (var i = 0; i < NODE_COUNT; i++) {
                var y = (i * offset - 1) + offset / 2;
                var r = Math.sqrt(Math.max(0, 1 - y * y));
                var phi = i * increment;
                nodes.push({
                    x: Math.cos(phi) * r,
                    y: y,
                    z: Math.sin(phi) * r,
                    pulse: Math.random() * Math.PI * 2
                });
            }

            // Designate a small, evenly-spaced set of "signal nodes" —
            // the key data points the core connects to directly by name.
            // Everything else stays a quiet background node; only these
            // carry the gold accent and receive an outbound flow pulse.
            spokeIndices = [];
            for (var s = 0; s < SIGNAL_COUNT; s++) {
                spokeIndices.push(Math.floor((s * NODE_COUNT) / SIGNAL_COUNT));
            }

            pulses = spokeIndices.map(function (nodeIndex) {
                return {
                    nodeIndex: nodeIndex,
                    t: Math.random(),               // staggered start, avoids synced blinking
                    speed: 0.00007 + Math.random() * 0.00004,
                    phase: Math.random() * Math.PI * 2
                };
            });
        }

        function resize() {
            var rect = canvas.parentElement.getBoundingClientRect();
            dpr = Math.min(window.devicePixelRatio || 1, 2);
            width = rect.width;
            height = rect.height;
            canvas.width = Math.max(1, Math.floor(width * dpr));
            canvas.height = Math.max(1, Math.floor(height * dpr));
            canvas.style.width = width + 'px';
            canvas.style.height = height + 'px';
            radius = Math.min(width, height) * 0.30;
        }

        function setCoreState(stateName) {
            var nextProfile = stateProfiles[stateName];
            if (!nextProfile) return;
            activeState = stateName;
            targetProfile = cloneProfile(nextProfile);
            canvas.setAttribute('data-core-state', stateName);
            if (prefersReducedMotion) {
                currentProfile = cloneProfile(targetProfile);
                draw(0);
            }
        }

        function lerpNumber(current, target, amount) {
            return current + (target - current) * amount;
        }

        function blendCurrentProfile(amount) {
            currentProfile.centerX = lerpNumber(currentProfile.centerX, targetProfile.centerX, amount);
            currentProfile.centerY = lerpNumber(currentProfile.centerY, targetProfile.centerY, amount);
            currentProfile.coreScale = lerpNumber(currentProfile.coreScale, targetProfile.coreScale, amount);
            currentProfile.presence = lerpNumber(currentProfile.presence, targetProfile.presence, amount);
            currentProfile.layerOpacity = lerpNumber(currentProfile.layerOpacity, targetProfile.layerOpacity, amount);
            currentProfile.ambientStrength = lerpNumber(currentProfile.ambientStrength, targetProfile.ambientStrength, amount);
            currentProfile.latticeIntensity = lerpNumber(currentProfile.latticeIntensity, targetProfile.latticeIntensity, amount);
            currentProfile.spokeIntensity = lerpNumber(currentProfile.spokeIntensity, targetProfile.spokeIntensity, amount);
            currentProfile.nodeIntensity = lerpNumber(currentProfile.nodeIntensity, targetProfile.nodeIntensity, amount);
            currentProfile.pulseStrength = lerpNumber(currentProfile.pulseStrength, targetProfile.pulseStrength, amount);
            currentProfile.pulseSpeed = lerpNumber(currentProfile.pulseSpeed, targetProfile.pulseSpeed, amount);
            currentProfile.rotationSpeed = lerpNumber(currentProfile.rotationSpeed, targetProfile.rotationSpeed, amount);
            currentProfile.coherence = lerpNumber(currentProfile.coherence, targetProfile.coherence, amount);
            currentProfile.coreBreath = lerpNumber(currentProfile.coreBreath, targetProfile.coreBreath, amount);
        }

        function setupStateController() {
            var sectionStatePairs = [
                { id: 'top', state: CORE_STATES.INITIALIZATION },
                { id: 'about', state: CORE_STATES.INITIALIZATION },
                { id: 'projects', state: CORE_STATES.EXPLORATION },
                { id: 'stack', state: CORE_STATES.EXPANSION },
                { id: 'education', state: CORE_STATES.EXPANSION },
                { id: 'experience', state: CORE_STATES.VALIDATION },
                { id: 'contact', state: CORE_STATES.CONVERGENCE }
            ];

            var trackedSections = [];
            for (var i = 0; i < sectionStatePairs.length; i++) {
                var element = document.getElementById(sectionStatePairs[i].id);
                if (element) {
                    trackedSections.push({
                        element: element,
                        state: sectionStatePairs[i].state
                    });
                }
            }
            if (!trackedSections.length) return;

            var scrollTicking = false;

            function updateStateFromViewport() {
                var viewportAnchor = window.innerHeight * 0.45;
                var nearestState = null;
                var nearestDistance = Infinity;

                for (var s = 0; s < trackedSections.length; s++) {
                    var tracked = trackedSections[s];
                    var rect = tracked.element.getBoundingClientRect();
                    var sectionAnchor = rect.top + rect.height * 0.5;
                    var distance = Math.abs(sectionAnchor - viewportAnchor);
                    if (distance < nearestDistance) {
                        nearestDistance = distance;
                        nearestState = tracked.state;
                    }
                }

                if (nearestState && nearestState !== activeState) {
                    setCoreState(nearestState);
                }
            }

            window.addEventListener('scroll', function () {
                if (scrollTicking) return;
                scrollTicking = true;
                window.requestAnimationFrame(function () {
                    updateStateFromViewport();
                    scrollTicking = false;
                });
            }, { passive: true });

            window.addEventListener('resize', updateStateFromViewport);
            updateStateFromViewport();
        }

        function project(node, cx, cy, drawRadius) {
            // Rotate around Y then X.
            var cosY = Math.cos(rotY), sinY = Math.sin(rotY);
            var x1 = node.x * cosY - node.z * sinY;
            var z1 = node.x * sinY + node.z * cosY;

            var cosX = Math.cos(rotX), sinX = Math.sin(rotX);
            var y1 = node.y * cosX - z1 * sinX;
            var z2 = node.y * sinX + z1 * cosX;

            var perspective = 2.4 / (2.4 - z2); // z2 in [-1, 1]
            return {
                sx: cx + x1 * drawRadius * perspective,
                sy: cy + y1 * drawRadius * perspective,
                depth: (z2 + 1) / 2, // 0 (far) .. 1 (near)
                scale: perspective
            };
        }

        function draw(time) {
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.clearRect(0, 0, width, height);
            ctx.globalAlpha = currentProfile.layerOpacity * currentProfile.presence;

            var cx = width * currentProfile.centerX;
            var cy = height * currentProfile.centerY;
            var drawRadius = radius * currentProfile.coreScale;
            var projected = nodes.map(function (node) {
                return project(node, cx, cy, drawRadius);
            });
            var dynamicLinkDistance = BASE_LINK_DISTANCE * currentProfile.coherence;

            // Soft ambient glow anchoring the whole system to the core.
            var glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, drawRadius * 1.6);
            glow.addColorStop(0, 'rgba(' + accent.join(',') + ',' + (0.10 * currentProfile.ambientStrength).toFixed(3) + ')');
            glow.addColorStop(1, 'rgba(' + accent.join(',') + ',0)');
            ctx.fillStyle = glow;
            ctx.fillRect(0, 0, width, height);

            var fieldX = cx + Math.cos(rotY * 1.3) * drawRadius * 0.12 * currentProfile.coherence;
            var fieldY = cy + Math.sin(rotY * 1.1) * drawRadius * 0.09 * currentProfile.coherence;

            // Diffuse intelligence field — subtle spatial bias without
            // introducing a hard center or instrument-like contour.
            var fieldGlow = ctx.createRadialGradient(fieldX, fieldY, 0, fieldX, fieldY, drawRadius * 1.45);
            fieldGlow.addColorStop(0, 'rgba(' + accent.join(',') + ',' + (0.05 * currentProfile.ambientStrength).toFixed(3) + ')');
            fieldGlow.addColorStop(1, 'rgba(' + accent.join(',') + ',0)');
            ctx.fillStyle = fieldGlow;
            ctx.fillRect(0, 0, width, height);

            // Background lattice — sparse, structured relationships
            // between ordinary data nodes. Kept quiet so it reads as
            // context/texture, not as the main subject.
            ctx.lineWidth = 1;
            for (var i = 0; i < nodes.length; i++) {
                for (var j = i + 1; j < nodes.length; j++) {
                    var a = nodes[i], b = nodes[j];
                    var dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
                    var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
                    if (dist > dynamicLinkDistance) continue;
                    var pa = projected[i], pb = projected[j];
                    var avgDepth = (pa.depth + pb.depth) / 2;
                    var opacity = (1 - dist / dynamicLinkDistance) * avgDepth * 0.20 * currentProfile.latticeIntensity;
                    if (opacity <= 0.01) continue;
                    ctx.strokeStyle = 'rgba(' + accent.join(',') + ',' + opacity.toFixed(3) + ')';
                    ctx.beginPath();
                    ctx.moveTo(pa.sx, pa.sy);
                    ctx.lineTo(pb.sx, pb.sy);
                    ctx.stroke();
                }
            }

            // Signal routes — a distributed network linking signal points
            // to each other and to nearby data nodes.
            var signalNetworkLinks = [];
            for (var sp = 0; sp < spokeIndices.length; sp++) {
                var signalIdx = spokeIndices[sp];
                var nextSignalIdx = spokeIndices[(sp + 1) % spokeIndices.length];
                var bridgeA = (signalIdx + 11) % NODE_COUNT;
                var bridgeB = (signalIdx + 23) % NODE_COUNT;
                signalNetworkLinks.push([signalIdx, nextSignalIdx]);
                signalNetworkLinks.push([signalIdx, bridgeA]);
                signalNetworkLinks.push([signalIdx, bridgeB]);
            }
            for (var sl = 0; sl < signalNetworkLinks.length; sl++) {
                var link = signalNetworkLinks[sl];
                var pFrom = projected[link[0]];
                var pTo = projected[link[1]];
                var signalDepth = (pFrom.depth + pTo.depth) * 0.5;
                ctx.beginPath();
                ctx.moveTo(pFrom.sx, pFrom.sy);
                ctx.lineTo(pTo.sx, pTo.sy);
                ctx.strokeStyle = 'rgba(' + accent.join(',') + ',' + ((0.06 + signalDepth * 0.14) * currentProfile.spokeIntensity).toFixed(3) + ')';
                ctx.stroke();
            }

            // Nodes — drawn back-to-front so nearer ones sit on top.
            // Only the designated signal nodes carry the gold accent;
            // every other node is a quiet, small teal data point.
            var order = projected.map(function (p, idx) { return idx; });
            order.sort(function (ia, ib) { return projected[ia].depth - projected[ib].depth; });

            for (var k = 0; k < order.length; k++) {
                var idx = order[k];
                var p = projected[idx];
                var n = nodes[idx];
                var isSignal = spokeIndices.indexOf(idx) !== -1;
                var pulse = prefersReducedMotion ? 0 : Math.sin((time || 0) * 0.0012 + n.pulse + currentProfile.pulseStrength) * 0.5 + 0.5;
                var size = (isSignal ? 1.3 : 0.8) + p.depth * (isSignal ? 1.8 : 1.2);
                size *= 0.88 + pulse * 0.16 * currentProfile.nodeIntensity;
                var c = isSignal ? gold : accent;
                var alpha = ((isSignal ? 0.55 : 0.30) + p.depth * 0.45) * currentProfile.nodeIntensity;

                ctx.beginPath();
                ctx.arc(p.sx, p.sy, size, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(' + c.join(',') + ',' + alpha.toFixed(3) + ')';
                ctx.fill();

                if (isSignal && p.depth > 0.55) {
                    ctx.beginPath();
                    ctx.arc(p.sx, p.sy, size * 2.6, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(' + c.join(',') + ',' + (0.07 * p.depth * currentProfile.spokeIntensity).toFixed(3) + ')';
                    ctx.fill();
                }
            }

            // Distributed signal bloom — low-contrast halos around key
            // data nodes so intelligence reads as a field, not an object.
            for (var sg = 0; sg < spokeIndices.length; sg++) {
                var signalProjection = projected[spokeIndices[sg]];
                var signalPulse = prefersReducedMotion ? 0.5 : Math.sin((time || 0) * 0.001 + sg * 1.3) * 0.5 + 0.5;
                var bloomRadius = drawRadius * (0.10 + signalPulse * 0.03) * currentProfile.coherence;
                var signalGlow = ctx.createRadialGradient(
                    signalProjection.sx, signalProjection.sy, 0,
                    signalProjection.sx, signalProjection.sy, bloomRadius
                );
                signalGlow.addColorStop(0, 'rgba(' + accent.join(',') + ',' + ((0.12 + signalPulse * 0.08) * currentProfile.ambientStrength).toFixed(3) + ')');
                signalGlow.addColorStop(1, 'rgba(' + accent.join(',') + ',0)');
                ctx.beginPath();
                ctx.arc(signalProjection.sx, signalProjection.sy, bloomRadius, 0, Math.PI * 2);
                ctx.fillStyle = signalGlow;
                ctx.fill();
            }

            // Flow pulses — light packets traversing between signal nodes.
            if (!prefersReducedMotion) {
                for (var pi = 0; pi < pulses.length; pi++) {
                    var pulseObj = pulses[pi];
                    var t = pulseObj.t;
                    var sourceIdx = spokeIndices[pi % spokeIndices.length];
                    var targetIdx = spokeIndices[(pi + 1) % spokeIndices.length];
                    var source = projected[sourceIdx];
                    var target = projected[targetIdx];
                    var forward = Math.sin((time || 0) * 0.0006 + pulseObj.phase) >= 0;
                    var flowT = forward ? t : (1 - t);
                    var fade = t < 0.15 ? t / 0.15 : (t > 0.8 ? (1 - t) / 0.2 : 1);
                    if (fade <= 0) continue;
                    var px = source.sx + (target.sx - source.sx) * flowT;
                    var py = source.sy + (target.sy - source.sy) * flowT;
                    ctx.beginPath();
                    ctx.arc(px, py, 1.8, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(' + accent.join(',') + ',' + (fade * 0.85 * currentProfile.pulseStrength).toFixed(3) + ')';
                    ctx.fill();
                }
            }

            ctx.globalAlpha = 1;
        }

        function frame(time) {
            if (lastTime === null) lastTime = time;
            var dt = time - lastTime;
            lastTime = time;
            var blendAmount = Math.min(0.18, dt * 0.003);
            blendCurrentProfile(blendAmount);
            rotY += dt * BASE_ROT_SPEED * currentProfile.rotationSpeed;
            for (var pi = 0; pi < pulses.length; pi++) {
                pulses[pi].t += dt * pulses[pi].speed * currentProfile.pulseSpeed;
                if (pulses[pi].t > 1) pulses[pi].t -= 1;
            }
            draw(time);
            rafId = window.requestAnimationFrame(frame);
        }

        buildNodes();
        resize();
        setupStateController();
        setCoreState(CORE_STATES.INITIALIZATION);

        if (prefersReducedMotion) {
            draw(0);
        } else {
            rafId = window.requestAnimationFrame(frame);
        }

        var resizeTimer = null;
        window.addEventListener('resize', function () {
            window.clearTimeout(resizeTimer);
            resizeTimer = window.setTimeout(function () {
                resize();
                if (prefersReducedMotion) draw(0);
            }, 120);
        });

        if (!prefersReducedMotion) {
            document.addEventListener('visibilitychange', function () {
                if (document.hidden && rafId !== null) {
                    window.cancelAnimationFrame(rafId);
                    rafId = null;
                } else if (!document.hidden && rafId === null) {
                    lastTime = null;
                    rafId = window.requestAnimationFrame(frame);
                }
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', run);
    } else {
        run();
    }
})();

/* ============================================================
PROJECT MODAL — opens project links in an in-page iframe
============================================================ */
(function () {
  "use strict";

  function run() {
    var modal = document.getElementById("projectModal");
    if (!modal) return;

    var frame = document.getElementById("projectModalFrame");
    var titleEl = document.getElementById("projectModalTitle");
    var newTabLink = document.getElementById("projectModalNewTab");
    var lastFocused = null;

    function openModal(url, title) {
      lastFocused = document.activeElement;
      frame.src = url;
      titleEl.textContent = title || "Project";
      newTabLink.href = url;
      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
      document.body.classList.add("project-modal-lock");
      document.addEventListener("keydown", onKeydown);
    }

    function closeModal() {
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      document.body.classList.remove("project-modal-lock");
      document.removeEventListener("keydown", onKeydown);

      window.setTimeout(function () {
        frame.src = "about:blank";
      }, 250);

      if (lastFocused) {
        lastFocused.focus({ preventScroll: true });
      }
    }

    function onKeydown(e) {
      if (e.key === "Escape") {
        closeModal();
      }
    }

    document.querySelectorAll(".js-project-modal").forEach(function (link) {
      link.addEventListener("click", function (e) {
        if (
          e.metaKey ||
          e.ctrlKey ||
          e.shiftKey ||
          e.button === 1
        ) {
          return;
        }

        e.preventDefault();

        openModal(
          link.getAttribute("href"),
          link.getAttribute("data-project-title")
        );
      });
    });

    modal.querySelectorAll("[data-modal-close]").forEach(function (el) {
      el.addEventListener("click", closeModal);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();