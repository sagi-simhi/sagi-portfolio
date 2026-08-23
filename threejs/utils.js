// Capability checks and dynamic Three.js loader

/**
 * Returns true if the browser can create a WebGL2 rendering context.
 * Falls back to WebGL1 for shaders that only need GLSL ES 1.00,
 * but our shaders target #version 300 es, so we require WebGL2.
 */
export function isWebGLAvailable() {
  const canvas = document.createElement('canvas');
  return !!canvas.getContext('webgl2');
}

/**
 * Returns true if the user has expressed a preference for reduced motion.
 */
export function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Rough heuristic for low‑end devices: less than 2GB RAM or fewer than 4 logical cores.
 * Adjust as needed.
 */
export function isLowEndDevice() {
  const mem = navigator.deviceMemory; // in GB, may be undefined
  const conc = navigator.hardwareConcurrency;
  return (mem !== undefined && mem < 2) || (conc !== undefined && conc < 4);
}

/**
 * Final gate: should we attempt to use WebGL?
 */
export function shouldUseWebGL() {
  return (
    isWebGLAvailable() &&
    !prefersReducedMotion() &&
    !isLowEndDevice()
    // Optionally exclude known problematic mobile browsers here
  );
}

/**
 * Loads Three.js as an ES module from a CDN.
 * Caches the module on window.THREE to avoid re‑fetching.
 * @returns {Promise<*>} Promise resolving to the Three.js namespace.
 */
export async function loadThreeJS() {
  if (window.THREE) {
    return window.THREE;
  }
  // Using jsDelivr for reliability; pin to a specific version.
  const module = await import('https://cdn.jsdelivr.net/npm/three@0.166.0/build/three.module.js');
  window.THREE = module;
  return module;
}