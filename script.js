/* ============================================================
   SAGI SIMHI - DATA ANALYST PORTFOLIO
   Vanilla JS interactions
   ============================================================ */

(function () {
  "use strict";

  // Check for reduced motion preference
  const reduceMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // DOM Elements
  const siteNav = document.getElementById("siteNav");
  const navAnchors = document.querySelectorAll('.nav-links a[href^="#"]');
  const navLinkMap = {};
  const navAliasMap = { approach: "about" }; // For backward compatibility

  // Build nav link map
  navAnchors.forEach(function (anchor) {
    const id = anchor.getAttribute("href").slice(1);
    navLinkMap[id] = anchor;
  });

  // Set active nav link based on section in viewport
  function setActiveNavLink(id) {
    const mappedId = navAliasMap[id] || id;
    navAnchors.forEach(function (anchor) {
      const isActive = anchor === navLinkMap[mappedId];
      anchor.classList.toggle("nav-link-active", isActive);
      if (isActive) {
        anchor.setAttribute("aria-current", "location");
      } else {
        anchor.removeAttribute("aria-current");
      }
    });
  }

  // Get nav height for scroll offset calculation
  function getNavOffset() {
    return siteNav ? siteNav.getBoundingClientRect().height + 16 : 0;
  }

  // Smooth scroll to target element
  function scrollToTarget(target) {
    if (!target) return;

    const top = target.getBoundingClientRect().top + window.scrollY - getNavOffset();
    window.scrollTo({
      top: Math.max(0, top),
      behavior: reduceMotion ? "auto" : "smooth"
    });
  }

  // Handle anchor click events
  function handleAnchorClick(event) {
    const href = this.getAttribute("href");
    if (!href || href.charAt(0) !== "#" || href.length < 2) return;

    const target = document.querySelector(href);
    if (!target) return;

    event.preventDefault();
    setActiveNavLink(href.slice(1));
    scrollToTarget(target);
    // Update URL without scrolling
    history.pushState(null, "", href);
  }

  // Handle nav brand/logo click (scroll to top)
  function handleNavBrandClick() {
    const navBrand = document.getElementById("navBrand");
    if (navBrand) {
      navBrand.addEventListener("click", function (event) {
        event.preventDefault();
        setActiveNavLink(null);
        window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
        history.pushState(null, "", "#top");
      });
    }
  }

  // Initialize anchor click handlers
  function initAnchorHandlers() {
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      if (anchor !== document.getElementById("navBrand")) {
        anchor.addEventListener("click", handleAnchorClick);
      }
    });
    handleNavBrandClick();
  }

  // Update scroll-based properties for parallax/ambient effects
  function updateScrollState() {
    const scrollY = window.scrollY || 0;
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const progress = Math.min(1, Math.max(0, scrollY / maxScroll));
    const root = document.documentElement;

    // Ambient background adjustments based on scroll
    root.style.setProperty("--bg-ambient-a", (0.12 - progress * 0.02).toFixed(3));
    root.style.setProperty("--bg-ambient-b", (0.08 - progress * 0.015).toFixed(3));
    root.style.setProperty("--bg-overlay-opacity", (0.02 + progress * 0.01).toFixed(3));

    // Nav scrolled state
    if (siteNav) {
      siteNav.classList.toggle("nav-scrolled", scrollY > 40);
    }
  }

  // Scroll event listener with throttling via requestAnimationFrame
  function initScrollHandlers() {
    let scrollTicking = false;

    window.addEventListener("scroll", function () {
      if (scrollTicking) return;
      scrollTicking = true;
      window.requestAnimationFrame(function () {
        updateScrollState();
        scrollTicking = false;
      });
    }, { passive: true });

    // Initial call
    updateScrollState();
  }

  // Handle hash change (for back/forward navigation)
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

  // Initialize reveal animations using GSAP ScrollTrigger with enhanced performance and transform conflict resolution
  function initRevealAnimations() {
    // Return early if reduced motion is preferred
    if (reduceMotion) return;

    // Check if GSAP is available
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      console.warn('GSAP or ScrollTrigger not available. Falling back to basic reveal animations.');
      // Fallback to original Intersection Observer method
      const revealTargets = document.querySelectorAll(
        ".education-item, .skill-category, .timeline-item, .project-card"
      );

      if ("IntersectionObserver" in window && revealTargets.length) {
        const revealObserver = new IntersectionObserver(function (entries, observer) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("reveal-visible");
            observer.unobserve(entry.target);
          });
        }, {
          threshold: 0.1,
          rootMargin: "0px 0px -80px 0px"
        });

        revealTargets.forEach(function (element) {
          element.classList.add("reveal");
          revealObserver.observe(element);
        });
      } else {
        // If no IntersectionObserver, show immediately
        revealTargets.forEach(function (element) {
          element.classList.add("reveal-visible");
        });
      }
      return;
    }

    // Animate education items with fade-up (using clearProps to resolve transform conflicts)
    const educationItems = gsap.utils.toArray(".education-item");
    if (educationItems.length) {
      educationItems.forEach((item) => {
        gsap.fromTo(
          item,
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: "power3.out",
            clearProps: "transform", // Remove inline transforms after animation to allow CSS hover to work
            scrollTrigger: {
              trigger: item,
              start: "top 80%",
              toggleActions: "play none none none", // Only play once
            }
          }
        );
      });
    }

    // Animate skill categories with fade-up (using clearProps to resolve transform conflicts)
    const skillCategories = gsap.utils.toArray(".skill-category");
    if (skillCategories.length) {
      skillCategories.forEach((category) => {
        gsap.fromTo(
          category,
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: "power3.out",
            clearProps: "transform", // Remove inline transforms after animation to allow CSS hover to work
            scrollTrigger: {
              trigger: category,
              start: "top 80%",
              toggleActions: "play none none none",
            }
          }
        );
      });
    }

    // Animate timeline items with fade-up and staggered timing (using GSAP's built-in stagger)
    const timelineItems = gsap.utils.toArray(".timeline-item");
    if (timelineItems.length) {
      gsap.fromTo(
        timelineItems,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "power3.out",
          stagger: 0.05, // GSAP's built-in staggering (more efficient than index-based delay)
          clearProps: "transform", // Remove inline transforms after animation to allow CSS hover to work
          scrollTrigger: {
            trigger: "self", // Each element triggers its own animation
            start: "top 80%",
            toggleActions: "play none none none",
          }
        }
      );
    }

    // Animate project cards with fade-up and scale (using clearProps to resolve transform conflicts)
    const projectCards = gsap.utils.toArray(".project-card");
    if (projectCards.length) {
      projectCards.forEach((card) => {
        gsap.fromTo(
          card,
          { opacity: 0, y: 20, scale: 0.98 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.6,
            ease: "power3.out",
            clearProps: "transform", // Remove inline transforms after animation to allow CSS hover to work
            scrollTrigger: {
              trigger: card,
              start: "top 80%",
              toggleActions: "play none none none",
            }
          }
        );
      });
    }

    // Animate section headers and content blocks
    const sectionHeaders = gsap.utils.toArray("main .section .section-title, main .hero .hero-title");
    if (sectionHeaders.length) {
      sectionHeaders.forEach((header) => {
        gsap.fromTo(
          header,
          { opacity: 0, y: 10 },
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            ease: "power3.out",
            clearProps: "transform", // Remove inline transforms after animation to allow CSS hover to work
            scrollTrigger: {
              trigger: header,
              start: "top 85%",
              toggleActions: "play none none none",
            }
          }
        );
      });
    }

    // Animate section descriptions and paragraph content with subtle stagger
    const sectionText = gsap.utils.toArray(
      "main .section .section-description, main .hero .hero-description, " +
      "main .section p, main .hero p, " +
      ".skill-list li, .education-item p, .timeline-description li, .project-description"
    );
    if (sectionText.length) {
      gsap.fromTo(
        sectionText,
        { opacity: 0, y: 15 },
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          ease: "power3.out",
          stagger: 0.02, // GSAP's built-in staggering (more efficient than index-based delay)
          clearProps: "transform", // Remove inline transforms after animation to allow CSS hover to work
          scrollTrigger: {
            trigger: "self", // Each element triggers its own animation
            start: "top 85%",
            toggleActions: "play none none none",
          }
        }
      );
    }
  }

  // Initialize section activation on scroll
  function initSectionActivation() {
    const activatableSections = document.querySelectorAll("main .section, main .hero");

    if (!reduceMotion && "IntersectionObserver" in window && activatableSections.length) {
      const activationObserver = new IntersectionObserver(function (entries, observer) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-active");
          observer.unobserve(entry.target);
        });
      }, {
        threshold: 0.2,
        rootMargin: "0px 0px -35% 0px"
      });

      activatableSections.forEach(function (section) {
        activationObserver.observe(section);
      });
    } else {
      // If reduced motion or no IntersectionObserver, activate immediately
      activatableSections.forEach(function (section) {
        section.classList.add("is-active");
      });
    }
  }

  // Initialize current year in footer (if element exists)
  function initCurrentYear() {
    const yearElement = document.getElementById("currentYear");
    if (yearElement) {
      yearElement.textContent = new Date().getFullYear();
    }
  }

  // Liquid Glass Effects Initialization
  function initLiquidGlassEffects() {
    if (reduceMotion) return; // Skip if reduced motion is preferred

    // Check if animejs is available
    if (typeof anime === 'undefined') {
      console.warn('AnimeJS is not loaded. Liquid Glass effects require AnimeJS.');
      return;
    }

    // Get displacement filter function (simplified version)
    function getDisplacementFilter(options) {
      const { height, width, radius, depth, strength = 100, chromaticAberration = 0 } = options;

      // Create SVG filter for displacement effect
      return `data:image/svg+xml;utf8,<svg height="${height}" width="${width}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg"><defs><filter id="displace" color-interpolation-filters="sRGB"><feImage x="0" y="0" height="${height}" width="${width}" href="data:image/svg+xml;utf8,<svg height="${height}" width="${width}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="Y" x1="0" x2="0" y1="${Math.ceil((radius / height) * 15)}%" y2="${Math.floor(100 - (radius / height) * 15)}%"><stop offset="0%" stop-color="#0F0" /><stop offset="100%" stop-color="#000" /></linearGradient><linearGradient id="X" x1="${Math.ceil((radius / width) * 15)}%" x2="${Math.floor(100 - (radius / width) * 15)}%" y1="0" y2="0"><stop offset="0%" stop-color="#F00" /><stop offset="100%" stop-color="#000" /></linearGradient></defs><rect x="0" y="0" height="${height}" width="${width}" fill="#808080" /><g filter="blur(2px)"><rect x="0" y="0" height="${height}" width="${width}" fill="#000080" /><rect x="0" y="0" height="${height}" width="${width}" fill="url(#Y)" class="mix" /><rect x="0" y="0" height="${height}" width="${width}" fill="url(#X)" class="mix" /><rect x="${depth}" y="${depth}" height="${height - 2 * depth}" width="${width - 2 * depth}" fill="#808080" rx="${radius}" ry="${radius}" filter="blur(${depth}px)" /></g></svg>" result="displacementMap" /><feDisplacementMap in="SourceGraphic" in2="displacementMap" scale="${strength + chromaticAberration * 2}" xChannelSelector="R" yChannelSelector="G" /><feColorMatrix type="matrix" values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0" result="displacedR" /><feDisplacementMap in="SourceGraphic" in2="displacementMap" scale="${strength + chromaticAberration}" xChannelSelector="R" yChannelSelector="G" /><feColorMatrix type="matrix" values="0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 1" result="displacedG" /><feDisplacementMap in="SourceGraphic" in2="displacementMap" scale="${strength}" xChannelSelector="R" yChannelSelector="G" /><feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1" result="displacedB" /><feBlend in="displacedR" in2="displacedG" mode="screen" /><feBlend in2="displacedB" mode="screen" /></filter></defs></svg>#displace`;
    }

    function redrawGlass(glassElement) {
      const liquidGlass = glassElement.querySelector('#liquid-glass');
      if (!liquidGlass) return;

      const bgImage = glassElement.querySelector('.lg-bg-image');
      const bgImageImg = bgImage ? bgImage.querySelector('img') : null;
      const content = glassElement.querySelector('.lg-content');
      const spinner = glassElement.querySelector('.animate-spin-hover, .lg-bg-image');
      const spinnerImage = spinner ? spinner.querySelector('img') : null;

      const rect = content.getBoundingClientRect();
      const width = Math.round(rect.width);
      const height = Math.round(rect.height);

      const blur = parseFloat(liquidGlass.dataset.blur || "0");
      const chromaticAberration = parseFloat(liquidGlass.dataset.cab || "0");
      const depth = parseFloat(liquidGlass.dataset.depth || "10");
      const strength = parseFloat(liquidGlass.dataset.strength || "100");
      const saturate = parseFloat(liquidGlass.dataset.saturate || "1.5");
      const brightness = parseFloat(liquidGlass.dataset.brightness || "1.1");
      const radius = parseFloat(glassElement.style.borderRadius || "0");

      liquidGlass.style.height = `${height}px`;
      liquidGlass.style.width = `${width}px`;

      if (bgImageImg) {
        bgImageImg.style.width = `${width}px`;
        bgImageImg.style.height = `${width}px`;
      }

      // Apply backdrop filter for the liquid glass effect
      if (window.CSS && window.CSS.supports && window.CSS.supports('backdrop-filter: blur(0px)')) {
        const filterOptions = {
          height,
          width,
          radius,
          depth,
          strength,
          chromaticAberration
        };
        liquidGlass.style.backdropFilter = `blur(${blur / 2}px) url('${getDisplacementFilter(filterOptions)}') blur(${blur}px) brightness(${brightness}) saturate(${saturate})`;
      } else {
        // Fallback for browsers that don't support backdrop-filter properly
        if (spinner && spinnerImage) {
          spinnerImage.style.filter = `blur(${width / 50}px) saturate(180%)`;
        } else {
          liquidGlass.style["-webkit-backdrop-filter"] = `blur(${width / 10}px) saturate(180%)`;
        }
      }
    }

    function initGlass() {
      document.querySelectorAll('.liquid-glass').forEach((glass) => {
        // Add the liquid-glass inner structure if it doesn't exist
        if (!glass.querySelector('#liquid-glass')) {
          const originalContent = glass.innerHTML;
          glass.innerHTML = `
            <div class="lg-overlay-bg absolute inset-0 z-1" style="background: ${glass.classList.contains('button') ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.3)'};"></div>
            ${glass.querySelector('.lg-bg-container') ? '' : ''}
            <div class="lg-content relative z-3 flex w-full items-center justify-center text-center">
              ${originalContent}
            </div>
            <div class="lg-filter-layer absolute inset-0 z-2">
              <div id="liquid-glass"
                   data-blur="${glass.dataset.blur || 0}"
                   data-cab="${glass.dataset.chromaticAberration || 0}"
                   data-depth="${glass.dataset.depth || 10}"
                   data-strength="${glass.dataset.strength || 100}"
                   data-saturate="${glass.dataset.saturate || (glass.classList.contains('button') ? 1.6 : 1.5)}"
                   data-brightness="${glass.dataset.brightness || (glass.classList.contains('button') ? 1.6 : 1.1)}"
                   class="glass-box m-0! glass-${glass.dataset.color || 'transparent'} ${glass.className}"
              ></div>
            </div>
          `;
        }

        redrawGlass(glass);

        const resizeObserver = new ResizeObserver(() => {
          redrawGlass(glass);
        });
        resizeObserver.observe(glass);

        const spinner = glass.querySelector('.animate-spin-hover, .lg-bg-image');
        const spinnerImage = spinner ? spinner.querySelector('img') : null;

        if (!reduceMotion && spinner && spinnerImage) {
          spinnerImage.style.filter = `saturate(180%)`;
          glass.style.boxShadow = glass.classList.contains('button')
            ? "0px 0px 2px white"
            : "0px 0px 1px white";
        }

        if (!spinner?.classList.contains('animate-spin-hover')) return;

        let currentRotation = 0;
        let animation = null;

        glass.addEventListener('mouseenter', () => {
          if (animation) {
            animation.play();
          } else {
            animation = anime({
              targets: spinner,
              rotate: [currentRotation, currentRotation + 360],
              duration: 20000,
              easing: 'linear',
              loop: true
            });
          }
        });

        glass.addEventListener('mouseleave', () => {
          if (animation) {
            const matrix = getComputedStyle(spinner).transform;
            if (matrix && matrix !== 'none') {
              const values = matrix.match(/matrix\(([^)]+)\)/)?.[1]?.split(', ');
              if (values) {
                const a = parseFloat(values[0]);
                const b = parseFloat(values[1]);
                currentRotation = Math.atan2(b, a) * (180 / Math.PI);
                currentRotation = ((currentRotation % 360) + 360) % 360;
              }
            }
            animation.pause();
            animation = null;
            anime.set(spinner, { rotate: currentRotation });
          }
        });
      });
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initGlass);
    } else {
      initGlass();
    }
  }

  // Initialize all functionality
  function init() {
    initAnchorHandlers();
    initScrollHandlers();
    initHashHandler();
    initRevealAnimations();
    initSectionActivation();
    initCurrentYear();
    initLiquidGlassEffects();
  }

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();