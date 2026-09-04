/* ============================================================
   LIQUID GLASS SPATIAL ENGINE
   Apple-grade Liquid Glass Material + Spatial Parallax UI
   WebGL/DOM synchronization + Production hardening
   ============================================================ */

(function() {
  "use strict";

  var LiquidGlassEngine = {
    config: {
      reduceMotion: false,
      isCoarsePointer: false,
      supportsWebGL: false,
      isInitialized: false
    },
    state: {
      glassEngine: null
    },

    init: function() {
      if (this.config.isInitialized) return;

      this.detectCapabilities();
      if (this.config.reduceMotion || this.config.isCoarsePointer) {
        this.enableStaticMode();
        return;
      }

      // Skip card loading - no longer needed for CSS-only implementation
      // this.loadCards();
      this.initializeWebGL();
      // Skip card event listeners - handled in script.js
      // this.attachEventListeners();
      this.config.isInitialized = true;
    },

    detectCapabilities: function() {
      var reduceMotionMedia = window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)");
      this.config.reduceMotion = reduceMotionMedia ? reduceMotionMedia.matches : false;

      var coarsePointerMedia = window.matchMedia &&
        window.matchMedia('(pointer: coarse)');
      this.config.isCoarsePointer = coarsePointerMedia ? coarsePointerMedia.matches : false;

      try {
        var c = document.createElement('canvas');
        this.config.supportsWebGL = !!(
          c.getContext('webgl') ||
          c.getContext('experimental-webgl')
        );
      } catch(e) {
        this.config.supportsWebGL = false;
      }
    },

    // loadCards() removed - functionality moved to script.js CSS-only implementation

    initializeWebGL: function() {
      var canvasElement = document.getElementById('liquid-glass-canvas');
      if (!canvasElement || !this.config.supportsWebGL) return;
      if (typeof THREE === 'undefined') return;

      try {
        this.state.glassEngine = new WebGLLiquidGlassEngine(canvasElement);
      } catch(e) {
        console.warn('[LiquidGlass] WebGL initialization failed:', e.message);
      }
    },

    // attachEventListeners() modified - removed card listeners, kept window beforeunload
    attachEventListeners: function() {
      var self = this;
      window.addEventListener('beforeunload', self.onWindowUnload.bind(self));
    },

    // startVelocityLoop() removed - card animation now handled in script.js
    // onCardMouseMove() removed - card hover now handled in script.js
    // updateCard() removed - card hover now handled in script.js
    // findCardFromEvent() removed - card hover now handled in script.js
    // applyCardTransform() removed - card hover now handled in script.js
    // updateSpecularHighlight() removed - card hover now handled in script.js
    // syncWebGLLight() removed - card hover now handled in script.js
    // onCardMouseLeave() removed - card hover now handled in script.js
    // resetCard() removed - card hover now handled in script.js

    enableStaticMode: function() {
      // CSS-only Liquid Glass fallback (no transforms, no WebGL)
    },

    onWindowUnload: function() {
      if (this.state.glassEngine) {
        this.state.glassEngine.destroy();
      }
      // Removed card reset loop since cards are no longer managed by this file
      // Card styles are now reset via script.js CSS-only implementation
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      LiquidGlassEngine.init();
    });
  } else {
    LiquidGlassEngine.init();
  }

  window.LiquidGlassEngine = LiquidGlassEngine;
})();

// WebGL Liquid Glass Engine
function WebGLLiquidGlassEngine(canvasElement) {
  if (!canvasElement || typeof THREE === 'undefined') {
    throw new Error('Missing canvas or THREE.js');
  }

  var self = this;
  var canvas = canvasElement;
  var renderer = null;
  var scene = null;
  var camera = null;
  var nodes = [];
  var latticeLines = [];
  var lights = [];
  var animationId = null;
  var resizeObserver = null;
  var themeObserver = null;
  var isDestroyed = false;
  var scrollVelocity = 0;
  var lastScrollY = 0;
  var pointLightMain = null;
  var rimLight = null;
  var envMap = null;

  function getThemePalette() {
    var isLight = document.documentElement.getAttribute('data-theme') === 'light';
    if (isLight) {
      return {
        primary: 0x0071E3,
        secondary: 0xAEAEB2,
        steel: 0xC7C7CC,
        light: 0x409CFF,
        line: 0xD1D1D6,
        glow: 0x0071E3,
        bg: 0xf5f5f7
      };
    }
    return {
      primary: 0x0A84FF,
      secondary: 0x636366,
      steel: 0x8E8E93,
      light: 0x409CFF,
      line: 0x545458,
      glow: 0x0A84FF,
      bg: 0x000000
    };
  }

  this.init = function() {
    try {
      self.initRenderer();
      self.initScene();
      self.createEnvironmentMap();
      self.initLighting();
      self.createLattice();
      self.setupThemeWatcher();
      self.setupResizeHandling();
      self.setupScrollTracking();
      self.startAnimation();
      self.applyThemePalette();
    } catch (e) {
      console.error('[WebGL] Init failed:', e);
      throw e;
    }
  };

  this.initRenderer = function() {
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
      precision: 'highp',
      stencil: false,
      depth: true
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(canvas.clientWidth || window.innerWidth, canvas.clientHeight || window.innerHeight);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
  };

  this.initScene = function() {
    scene = new THREE.Scene();
    scene.background = null;
    scene.fog = null;

    camera = new THREE.PerspectiveCamera(48, (canvas.clientWidth || window.innerWidth) / (canvas.clientHeight || window.innerHeight), 0.08, 1000);
    camera.position.set(0, 0, 16);
  };

  this.createEnvironmentMap = function() {
    var palette = getThemePalette();
    var textureCanvas = document.createElement('canvas');
    textureCanvas.width = 256;
    textureCanvas.height = 256;
    var ctx = textureCanvas.getContext('2d');
    var gradient = ctx.createRadialGradient(128, 128, 10, 128, 128, 220);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.2, '#' + palette.primary.toString(16).padStart(6, '0'));
    gradient.addColorStop(0.5, '#' + palette.secondary.toString(16).padStart(6, '0'));
    gradient.addColorStop(1, '#' + palette.steel.toString(16).padStart(6, '0'));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
    envMap = new THREE.CanvasTexture(textureCanvas);
    envMap.encoding = THREE.sRGBEncoding;
  };

  this.initLighting = function() {
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);
    lights.push(ambientLight);

    pointLightMain = new THREE.PointLight(getThemePalette().glow, 1.8, 60, 2.0);
    pointLightMain.position.set(8, 10, 14);
    scene.add(pointLightMain);
    lights.push(pointLightMain);

    rimLight = new THREE.PointLight(getThemePalette().steel, 0.65, 60, 2.0);
    rimLight.position.set(-8, -8, -10);
    scene.add(rimLight);
    lights.push(rimLight);
  };

  this.createLattice = function() {
    var palette = getThemePalette();
    var count = 18;
    var spacing = 2.2;
    var start = -(count - 1) * spacing / 2;
    var nodesList = [];
    var lineSegments = [];

    for (var x = 0; x < count; x++) {
      for (var y = 0; y < count; y++) {
        var offset = (x + y) % 2 === 0 ? 0.7 : -0.7;
        var px = start + x * spacing + offset * 0.55;
        var py = start + y * spacing + (Math.sin((x + 1) * 0.7) * 0.8);
        var pz = (Math.cos(x * 0.85) * 1.4) + (Math.sin(y * 0.8) * 1.1);

        var material = new THREE.MeshPhysicalMaterial({
          color: (x + y) % 2 === 0 ? palette.primary : palette.steel,
          metalness: 0.05,
          roughness: 0.02,
          transmission: 0.96,
          ior: 1.58,
          clearcoat: 1.0,
          clearcoatRoughness: 0.02,
          transparent: true,
          opacity: 0.92,
          envMap: envMap,
          envMapIntensity: 2.2,
          side: THREE.DoubleSide
        });

        var mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(0.18, 1), material);
        mesh.position.set(px, py, pz);
        mesh.userData = {
          baseX: px,
          baseY: py,
          baseZ: pz,
          amplitude: 0.28 + (x * 0.02),
          frequency: 0.7 + (y * 0.12),
          phase: (x * 0.6) + (y * 0.35)
        };
        nodes.push(mesh);
        nodesList.push(mesh);
        scene.add(mesh);
      }
    }

    for (var i = 0; i < nodesList.length; i++) {
      for (var j = i + 1; j < nodesList.length; j++) {
        var a = nodesList[i].position;
        var b = nodesList[j].position;
        var dist = a.distanceTo(b);
        if (dist < 2.9) {
          lineSegments.push(a.x, a.y, a.z, b.x, b.y, b.z);
        }
      }
    }

    var lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(lineSegments, 3));
    var lineMaterial = new THREE.LineBasicMaterial({
      color: palette.line,
      transparent: true,
      opacity: 0.42,
      depthWrite: false
    });

    var lattice = new THREE.LineSegments(lineGeometry, lineMaterial);
    latticeLines.push(lattice);
    scene.add(lattice);
  };

  this.applyThemePalette = function() {
    if (!scene || isDestroyed || !nodes.length) return;
    var palette = getThemePalette();
    nodes.forEach(function(mesh, index) {
      var color = index % 2 === 0 ? palette.primary : palette.steel;
      if (mesh.material && mesh.material.color) {
        mesh.material.color.setHex(color);
      }
    });

    latticeLines.forEach(function(line) {
      if (line.material && line.material.color) {
        line.material.color.setHex(palette.line);
      }
    });

    if (pointLightMain) {
      pointLightMain.color.setHex(palette.glow);
      pointLightMain.intensity = 1.7;
    }
    if (rimLight) {
      rimLight.color.setHex(palette.steel);
    }
  };

  this.setupThemeWatcher = function() {
    if (typeof MutationObserver === 'undefined') return;
    themeObserver = new MutationObserver(function() {
      self.applyThemePalette();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });
  };

  this.setupResizeHandling = function() {
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(self.handleResize);
      resizeObserver.observe(canvas);
    }
    window.addEventListener('resize', self.handleResize, { passive: true });
  };

  this.setupScrollTracking = function() {
    window.addEventListener('scroll', self.updateScrollVelocity, { passive: true });
  };

  this.updateScrollVelocity = function() {
    var currentScrollY = window.scrollY || 0;
    scrollVelocity = currentScrollY - lastScrollY;
    lastScrollY = currentScrollY;
  };

  this.startAnimation = function() {
    self.animate();
  };

  this.animate = function() {
    if (isDestroyed) return;
    animationId = requestAnimationFrame(self.animate);

    try {
      var time = Date.now() * 0.0015;
      var dampedScrollVelocity = scrollVelocity * 0.8;

      nodes.forEach(function(mesh) {
        var userData = mesh.userData || {};
        var swayX = Math.sin(time * userData.frequency + userData.phase) * userData.amplitude;
        var swayY = Math.cos(time * (userData.frequency * 0.85) + userData.phase) * userData.amplitude * 0.8;
        mesh.position.x = userData.baseX + swayX + dampedScrollVelocity * 0.02;
        mesh.position.y = userData.baseY + swayY + (dampedScrollVelocity * 0.01);
        mesh.position.z = userData.baseZ + Math.sin(time + userData.phase) * 0.5;
        mesh.rotation.x += 0.006;
        mesh.rotation.y += 0.008;
      });

      latticeLines.forEach(function(line) {
        line.rotation.y += 0.0015;
        line.rotation.x = Math.sin(time * 0.4) * 0.35;
      });

      scrollVelocity *= 0.92;

      if (renderer && scene && camera) {
        renderer.render(scene, camera);
      }
    } catch (e) {
      console.error('[WebGL] Render error:', e);
    }
  };

  this.updateLightPosition = function(x, y, z) {
    if (pointLightMain && !isDestroyed) {
      var easing = 0.14;
      pointLightMain.position.x += (x - pointLightMain.position.x) * easing;
      pointLightMain.position.y += (y - pointLightMain.position.y) * easing;
      pointLightMain.position.z = z;
      pointLightMain.intensity = 1.5 + Math.abs(scrollVelocity) * 0.04;
    }
    if (rimLight && !isDestroyed) {
      rimLight.position.x = -8 + x * 0.35;
      rimLight.position.y = -8 + y * 0.25;
    }
  };

  this.handleResize = function() {
    if (isDestroyed || !canvas || !renderer || !camera) return;
    var width = canvas.clientWidth || window.innerWidth;
    var height = canvas.clientHeight || window.innerHeight;
    if (width <= 0 || height <= 0) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  };

  this.destroy = function() {
    if (isDestroyed) return;
    isDestroyed = true;

    if (animationId) cancelAnimationFrame(animationId);
    if (resizeObserver) resizeObserver.disconnect();
    if (themeObserver) themeObserver.disconnect();
    window.removeEventListener('resize', self.handleResize);
    window.removeEventListener('scroll', self.updateScrollVelocity);

    nodes.forEach(function(mesh) {
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) {
        if (mesh.material.map) mesh.material.map.dispose();
        if (mesh.material.envMap) mesh.material.envMap.dispose();
        mesh.material.dispose();
      }
      if (mesh.parent) mesh.parent.remove(mesh);
    });

    latticeLines.forEach(function(line) {
      if (line.geometry) line.geometry.dispose();
      if (line.material) line.material.dispose();
      if (line.parent) line.parent.remove(line);
    });

    lights.forEach(function(light) {
      if (light.shadow && light.shadow.map) {
        light.shadow.map.dispose();
      }
    });

    if (envMap) envMap.dispose();

    if (renderer) {
      try {
        renderer.dispose();
        renderer.forceContextLoss();
      } catch (e) {}
    }

    nodes = [];
    latticeLines = [];
    lights = [];
    scene = null;
    camera = null;
    renderer = null;
    pointLightMain = null;
    rimLight = null;
    envMap = null;
  };

  this.init();
}