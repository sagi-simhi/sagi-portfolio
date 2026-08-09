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
      return "-" + topOffset + "px 0px -40px 0px";
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
   Financial Intelligence Core — Three.js Prototype (Phase 1)
   A restrained mint-green particle system that evolves with scroll.
   ============================================================ */
(function initFinancialCore() {
    // Configuration
    const CONFIG = {
        PARTICLE_COUNT_DESKTOP: 150,
        PARTICLE_COUNT_MOBILE: 50,
        BREAKPOINT_MOBILE: 768,
        // Scroll progress ranges from 0 (top) to 1 (bottom)
        // We'll use it to lerp between dispersed and organized states
    };

    let scene, camera, renderer, points, clock;
    let initialPositions = null;
    let targetPositions = null;
    let scrollProgress = 0;
    let resizeObserver = null;
    let animationFrameId = null;
    let threeJsLoaded = false;
    let loadingError = null;
    let reducedMotion = false; // tracks prefers-reduced-motion state

    // Wait for Three.js to load, then initialize
    function loadThreeJs() {
        return new Promise((resolve, reject) => {
            if (window.THREE) {
                resolve(window.THREE);
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.min.js';
            script.onload = () => resolve(window.THREE);
            script.onerror = () => reject(new Error('Failed to load Three.js'));
            document.head.appendChild(script);
        });
    }

    // Initialize Three.js scene
    function initThreeJs() {
        console.log('[Financial Intelligence Core] initThreeJs called');
        const canvas = document.getElementById('coreCanvas');
        if (!canvas) {
            console.warn('coreCanvas not found');
            return false;
        }

        // Ensure canvas fills its parent element
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        // Get the THREE global
        const THREE = window.THREE;
        if (!THREE) {
            console.warn('THREE not defined');
            return false;
        }

        // Create scene
        scene = new THREE.Scene();

        // Camera
        camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
        camera.position.set(0, 0, 10);
        camera.lookAt(0, 0, 0);

        // Renderer
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); // Limit DPR
        renderer.setClearColor(0x000000, 0); // Transparent background
        // We'll rely on the core-layer's CSS for atmospheric depth
        renderer.setSize(rect.width, rect.height, false);

        // Create particle geometry
        const particleCount = window.innerWidth < CONFIG.BREAKPOINT_MOBILE
            ? CONFIG.PARTICLE_COUNT_MOBILE
            : CONFIG.PARTICLE_COUNT_DESKTOP;

        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);

        // Mint green color
        const mintColor = new THREE.Color(0x53d7a6);

        // Initialize random positions (dispersed state)
        for (let i = 0; i < particleCount; i++) {
            // Random position in a cube of size 10
            positions[i * 3] = (Math.random() - 0.5) * 10;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 10;

            // Color
            colors[i * 3] = mintColor.r;
            colors[i * 3 + 1] = mintColor.g;
            colors[i * 3 + 2] = mintColor.b;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        // Material
        const material = new THREE.ShaderMaterial({
            vertexShader: `
                attribute vec3 color;
                varying vec3 vColor;
                void main() {
                    vColor = color;
                    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
                    gl_Position = projectionMatrix * mvPosition;
                    gl_PointSize = 2.0 * (300.0 / -mvPosition.z);
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                void main() {
                    gl_FragColor = vec4(vColor, 1.0);
                }
            `,
            vertexColors: true,
            transparent: true,
            depthWrite: false
        });

        points = new THREE.Points(geometry, material);
        scene.add(points);

        // Store initial positions (already in geometry)
        initialPositions = new Float32Array(positions);
        // Target positions: organize into a sphere (radius 3)
        targetPositions = new Float32Array(particleCount * 3);
        for (let i = 0; i < particleCount; i++) {
            // Distribute points on a sphere using Fibonacci sphere
            const iPhi = Math.acos(-1 + (2 * i) / (particleCount - 1));
            const iTheta = Math.sqrt(Math.PI * 2) * iPhi;
            const radius = 3;
            targetPositions[i * 3] = radius * Math.cos(iTheta) * Math.sin(iPhi);
            targetPositions[i * 3 + 1] = radius * Math.sin(iTheta) * Math.sin(iPhi);
            targetPositions[i * 3 + 2] = radius * Math.cos(iPhi);
        }

        // Set camera initial position
        camera.position.z = 10;

        // Clock for animation
        clock = new THREE.Clock();

        // Start rendering
        animate();

        threeJsLoaded = true;
        return true;
    }

    // Animation loop
    function animate() {
        animationFrameId = requestAnimationFrame(animate);

        const delta = clock.getDelta();

        // Update particle positions based on scroll progress unless reduced motion
        if (initialPositions && targetPositions && !reducedMotion) {
            const positions = points.geometry.attributes.position.array;
            for (let i = 0; i < initialPositions.length; i++) {
                positions[i] = initialPositions[i] + (targetPositions[i] - initialPositions[i]) * scrollProgress;
            }
            points.geometry.attributes.position.needsUpdate = true;
        }

        renderer.render(scene, camera);
    }

    // Handle scroll
    function onScroll() {
        if (reducedMotion) {
            // In reduced motion, show a static coherent state (organized sphere)
            scrollProgress = 1.0;
            return;
        }
        const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
        scrollProgress = maxScroll === 0 ? 0 : window.scrollY / maxScroll;
        // Clamp between 0 and 1
        scrollProgress = Math.min(1, Math.max(0, scrollProgress));
    }

    // Handle resize
    function onResize() {
        const canvas = document.getElementById('coreCanvas');
        if (!canvas || !renderer) return;

        const rect = canvas.parentElement.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;

        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();

        // Adjust particle count based on width
        const particleCount = window.innerWidth < CONFIG.BREAKPOINT_MOBILE
            ? CONFIG.PARTICLE_COUNT_MOBILE
            : CONFIG.PARTICLE_COUNT_DESKTOP;

        // If particle count changed, we need to recreate geometry
        // For simplicity in Phase 1, we'll just update the existing geometry size if needed
        // But to keep it simple, we'll not change particle count on resize in this prototype.
        // We'll just update the renderer size.
    }

    // Handle visibility change
    function onVisibilityChange() {
        if (document.hidden) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        } else if (animationFrameId === null) {
            animate();
        }
    }

    // Handle reduced motion change
    function onReduceMotionChange(event) {
        reducedMotion = event.matches;
        // If reduced motion becomes true, we immediately set scrollProgress to show static state
        if (reducedMotion) {
            scrollProgress = 1.0;
        }
        // If reduced motion becomes false, scroll will be updated on next scroll event
    }

    // Initialize
    function init() {
        loadThreeJs()
            .then(initThreeJs)
            .then(() => {
                // Set up initial reduced motion state
                const reduceMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
                reducedMotion = reduceMedia.matches;
                if (reducedMotion) {
                    scrollProgress = 1.0;
                }
                // Set up event listeners
                window.addEventListener('scroll', onScroll, { passive: true });
                window.addEventListener('resize', onResize);
                document.addEventListener('visibilitychange', onVisibilityChange);
                reduceMedia.addEventListener('change', onReduceMotionChange);
                // Initial resize
                onResize();
            })
            .catch((err) => {
                loadingError = err;
                console.warn('Three.js failed to load, falling back to background only:', err);
                // If Three.js fails, we leave the core-layer as is (just the CSS background)
                // No further action needed.
            });
    }

    // Start
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Return a cleanup function for potential future use (not needed now)
    return function cleanup() {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        if (resizeObserver) {
            resizeObserver.disconnect();
        }
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onResize);
        document.removeEventListener('visibilitychange', onVisibilityChange);
    };
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