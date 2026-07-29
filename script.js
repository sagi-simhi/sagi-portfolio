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
   A slow-rotating node-sphere rendered on <canvas id="coreCanvas">,
   sitting behind the hero's candlestick read-out. Plain canvas 2D,
   no dependencies. Respects prefers-reduced-motion by drawing one
   static frame instead of looping.
   ============================================================ */
(function initFinancialCore() {
    function run() {
        var canvas = document.getElementById('coreCanvas');
        if (!canvas || !canvas.getContext) return;

        var ctx = canvas.getContext('2d');
        var prefersReducedMotion = window.matchMedia &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        var accent = [83, 215, 166];   // #53D7A6
        var gold = [201, 161, 90];     // secondary accent, used sparingly

        var nodes = [];
        var NODE_COUNT = 46;
        var LINK_DISTANCE = 0.62; // in unit-sphere space
        var width = 0, height = 0, radius = 0, dpr = 1;
        var rotY = 0, rotX = 0.35;
        var rafId = null;
        var lastTime = null;

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

        function project(node) {
            // Rotate around Y then X.
            var cosY = Math.cos(rotY), sinY = Math.sin(rotY);
            var x1 = node.x * cosY - node.z * sinY;
            var z1 = node.x * sinY + node.z * cosY;

            var cosX = Math.cos(rotX), sinX = Math.sin(rotX);
            var y1 = node.y * cosX - z1 * sinX;
            var z2 = node.y * sinX + z1 * cosX;

            var perspective = 2.4 / (2.4 - z2); // z2 in [-1, 1]
            return {
                sx: width * 0.56 + x1 * radius * perspective,
                sy: height * 0.5 + y1 * radius * perspective,
                depth: (z2 + 1) / 2, // 0 (far) .. 1 (near)
                scale: perspective
            };
        }

        function draw(time) {
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.clearRect(0, 0, width, height);

            var projected = nodes.map(project);

            // Soft ambient glow at the core's center.
            var cx = width * 0.56, cy = height * 0.5;
            var glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 1.6);
            glow.addColorStop(0, 'rgba(' + accent.join(',') + ',0.10)');
            glow.addColorStop(1, 'rgba(' + accent.join(',') + ',0)');
            ctx.fillStyle = glow;
            ctx.fillRect(0, 0, width, height);

            // Connections — only between near-enough neighbors, so the
            // sphere reads as a structured lattice, not a tangle.
            ctx.lineWidth = 1;
            for (var i = 0; i < nodes.length; i++) {
                for (var j = i + 1; j < nodes.length; j++) {
                    var a = nodes[i], b = nodes[j];
                    var dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
                    var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
                    if (dist > LINK_DISTANCE) continue;
                    var pa = projected[i], pb = projected[j];
                    var avgDepth = (pa.depth + pb.depth) / 2;
                    var opacity = (1 - dist / LINK_DISTANCE) * avgDepth * 0.35;
                    if (opacity <= 0.01) continue;
                    ctx.strokeStyle = 'rgba(' + accent.join(',') + ',' + opacity.toFixed(3) + ')';
                    ctx.beginPath();
                    ctx.moveTo(pa.sx, pa.sy);
                    ctx.lineTo(pb.sx, pb.sy);
                    ctx.stroke();
                }
            }

            // Nodes — drawn back-to-front so nearer ones sit on top.
            var order = projected.map(function (p, idx) { return idx; });
            order.sort(function (ia, ib) { return projected[ia].depth - projected[ib].depth; });

            for (var k = 0; k < order.length; k++) {
                var idx = order[k];
                var p = projected[idx];
                var n = nodes[idx];
                var pulse = prefersReducedMotion ? 0 : Math.sin((time || 0) * 0.0016 + n.pulse) * 0.5 + 0.5;
                var size = (0.9 + p.depth * 1.6) * (0.85 + pulse * 0.3);
                var isGold = idx % 11 === 0; // rare secondary-accent nodes
                var c = isGold ? gold : accent;
                var alpha = 0.35 + p.depth * 0.55;

                ctx.beginPath();
                ctx.arc(p.sx, p.sy, size, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(' + c.join(',') + ',' + alpha.toFixed(3) + ')';
                ctx.fill();

                if (p.depth > 0.7) {
                    ctx.beginPath();
                    ctx.arc(p.sx, p.sy, size * 2.4, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(' + c.join(',') + ',' + (0.05 * p.depth).toFixed(3) + ')';
                    ctx.fill();
                }
            }
        }

        function frame(time) {
            if (lastTime === null) lastTime = time;
            var dt = time - lastTime;
            lastTime = time;
            rotY += dt * 0.00012; // slow, deliberate — not spinning like a toy
            draw(time);
            rafId = window.requestAnimationFrame(frame);
        }

        buildNodes();
        resize();

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

        // Pause the animation loop when the hero scrolls out of view —
        // keeps the effect cinematic without burning cycles once the
        // person has scrolled past it.
        if ('IntersectionObserver' in window && !prefersReducedMotion) {
            var observer = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting && rafId === null) {
                        lastTime = null;
                        rafId = window.requestAnimationFrame(frame);
                    } else if (!entry.isIntersecting && rafId !== null) {
                        window.cancelAnimationFrame(rafId);
                        rafId = null;
                    }
                });
            }, { threshold: 0.05 });
            observer.observe(canvas.parentElement);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', run);
    } else {
        run();
    }
})();