// Hero 3D scene that visualizes the trajectory from operator → economics/CS → financial tools.
// It replaces the existing core-canvas with a WebGL renderer.

import { TrajectoryShader } from './TrajectoryShader.js';
import { shouldUseWebGL, prefersReducedMotion } from '../utils.js';

// Get Three.js from the global scope (loaded by init.js via loadThreeJS())
const THREE = window.THREE;
if (!THREE) {
  console.error('THREE is not defined. HeroScene requires three.js to be loaded first.');
}

export class HeroScene {
  /**
   * @param {HTMLCanvasElement} canvas - The canvas to render into (should be the core-canvas).
   * @param {Object} options - Optional configuration.
   */
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.options = {
      backgroundColor: 0x1b211f, // dark background to match the site
      ...options
    };

    // Check if WebGL should be used
    if (!shouldUseWebGL()) {
      this.renderer = null;
      this.trajectoryMesh = null;
      this.isVisible = false;
      return; // early exit to avoid further setup
    }

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true // we want transparency to see the page background
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);

    this.scene = new THREE.Scene();
    // Transparent background to let the page background show through
    this.scene.background = null;

    this.camera = new THREE.PerspectiveCamera(45, canvas.width / canvas.height, 0.1, 100);
    this.camera.position.set(0, 0, 2.5);

    // Lights
    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight.position.set(5, 10, 7);
    this.scene.add(directionalLight);

    // Create the trajectory using our custom shader
    this.createTrajectory();

    // Start the render loop
    this.clock = new THREE.Clock();
    this.isVisible = true;
    this.animate = this.animate.bind(this);
    this.onVisibilityChange = this.onVisibilityChange.bind(this);
    this.onResize = this.onResize.bind(this);

    // Initialize size
    this.onResize();

    // Listen for visibility changes to pause/resume
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    window.addEventListener('resize', this.onResize);

    // Start render loop if page is visible and not reduced motion
    if (!document.hidden && !prefersReducedMotion()) {
      this.animate();
    } else if (!document.hidden) {
      // Render a single static frame for reduced motion
      this.animate();
    }
  }

  /**
   * Create the trajectory mesh using the custom TrajectoryShader
   */
  createTrajectory() {
    const width = 0.25;  // X-axis (short dimension)
    const height = 1.0;  // Y-axis (long dimension) - adjusted for ~48% screen coverage
    const widthSegments = 1;
    const heightSegments = 64;
    const geometry = new THREE.PlaneGeometry(width, height, widthSegments, heightSegments);

    // Create material from our trajectory shader
    const material = new THREE.RawShaderMaterial({
      vertexShader: TrajectoryShader.vertexShader,
      fragmentShader: TrajectoryShader.fragmentShader,
      transparent: true,
      glslVersion: THREE.GLSL3,
      uniforms: {
        uOffset: { value: new THREE.Vector3(0.25, 0.5, 0) }, // positioned so bottom sits at y=0, top at y=1.0
        uTime: { value: 0 },
        uProgress: { value: 0.0 },
        uColorStart: { value: new THREE.Color(0x2d2d2d) }, // dark gray for operator
        uColorEnd: { value: new THREE.Color(0x53d7a6) },    // teal for financial
        uLineWidth: { value: 0.21 }
      }
    });

    this.trajectoryMesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.trajectoryMesh);
  }

  onResize() {
    // Only update if renderer exists
    if (!this.renderer) return;

    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    // Debug: Check if we're getting valid dimensions
    if (width <= 0 || height <= 0) {
      // Skip rendering if invalid dimensions
    }
  }

  onVisibilityChange() {
    // Only handle visibility if renderer exists
    if (!this.renderer) return;

    this.isVisible = !document.hidden;
    if (this.isVisible && !prefersReducedMotion()) {
      this.animate();
    } else if (this.isVisible) {
      // Render a single static frame for reduced motion when becoming visible
      this.animate();
    }
  }

  animate() {
    // Only animate if renderer exists
    if (!this.renderer) return;

    // If reduced motion, just return after rendering (single frame already handled in constructor/visibility change)
    if (prefersReducedMotion()) {
      return;
    }

    if (!this.isVisible) {
      return;
    }

    const elapsed = this.clock.getElapsedTime();

    // Update trajectory uniforms - only if they exist
    if (this.trajectoryMesh && this.trajectoryMesh.material.uniforms) {
      // Only update uniforms that exist in our shader
      if (this.trajectoryMesh.material.uniforms.uTime) {
        this.trajectoryMesh.material.uniforms.uTime.value = elapsed;
      }
      if (this.trajectoryMesh.material.uniforms.uProgress) {
        // Animate progress from 0 to 1 over 10 seconds (can be repurposed for subtle pulse)
        this.trajectoryMesh.material.uniforms.uProgress.value = (elapsed * 0.1) % 1.0;
      }
      // Note: modelViewMatrix and projectionMatrix are automatically set by RawShaderMaterial
    }

    // No rotation to prevent edge-on disappearance
    // this.trajectoryMesh.rotation.y = elapsed * 0.1;
    // this.trajectoryMesh.rotation.x = elapsed * 0.05;
    // Keeping rotation at zero (default)

    this.renderer.render(this.scene, this.camera);

    requestAnimationFrame(this.animate);
  }

  dispose() {
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    window.removeEventListener('resize', this.onResize);
    if (this.trajectoryMesh) {
      this.trajectoryMesh.geometry.dispose();
      this.trajectoryMesh.material.dispose();
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
    if (this.trajectoryMesh) {
      this.scene.remove(this.trajectoryMesh);
    }
  }
}