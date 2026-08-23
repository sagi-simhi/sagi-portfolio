// Entry point for WebGL initialization. Called from script.js.
// This file handles the capability check, loads Three.js, and sets up the shared WebGL context
// and per-element 2D canvases for the glass highlight effect.

import { shouldUseWebGL, loadThreeJS } from './utils.js';

// List of selectors for elements that should receive the liquid-glass highlight.
// These are the elements that currently have the CSS glass effect (::before and ::after).
const GLASS_SELECTORS = [
  '.site-header .nav-container', // nav
  '.project-card',
  '.edu-card',
  '.stack-group',
  '.project-modal-window'
];

let gl = null; // WebGL2RenderingContext
let program = null; // WebGL shader program (glass shader)
let sharedCanvas = null; // The hidden WebGL canvas used as the shared render target
let frameID = null; // requestAnimationFrame ID
let initialized = false;

// Vertex shader: just passes through the position.
const vertexShaderSource = `#version 300 es\nin vec2 aPosition;\nvoid main() {\n  gl_Position = vec4(aPosition, 0.0, 1.0);\n}`;

// Fragment shader: implements the liquid glass effect.
const fragmentShaderSource = `#version 300 es
precision highp float;

// Uniforms (all in device pixel space unless noted)
uniform vec4 uRect;          // x, y, w, h of element (top-left origin, device pixels)
uniform float uRadius;       // border-radius in pixels (device pixels)
uniform vec2 uViewport;      // viewport size (width, height) in device pixels
uniform float uTime;         // time in seconds
uniform float uIsLight;      // 0 for dark theme, 1 for light theme
uniform float uBgAmbientA;   // scroll-driven ambient alpha for first gradient
uniform float uBgAmbientB;   // scroll-driven ambient alpha for second gradient
uniform vec3 uBaseColor;     // --bg-base
uniform vec3 uAccentColor;   // accent color (teal)
uniform vec3 uGoldColor;     // gold color
uniform vec3 uVioletColor;   // violet color
uniform vec3 uGridLineColor; // grid line color (accent * grid-line-opacity)

// Output
out vec4 fragColor;

// ------------------------------------------------------------------
// Helper: procedural background (exact copy of the CSS gradients)
// ------------------------------------------------------------------
vec3 backgroundColor(vec2 uv) {
  // uv: 0-1 top-left origin, matches the fixed-gradient definition
  // We'll compute the four layers from the body background.

  // Convert UV to pixel coordinates (pix = uv * uViewport); // now in device pixels, top-left origin
  vec2 pix = uv * uViewport;

  // Layer 1: radial-gradient(1200px 600px at 15% -10%, rgba(83,215,166,var(--bg-ambient-a)),transparent 60%)
  vec2 center1 = vec2(0.15 * uViewport.x, -0.10 * uViewport.y);
  vec2 d1 = pix - center1;
  float dist1 = length(d1 / vec2(1200.0, 600.0));
  float gradient1 = smoothstep(0.60, 0.61, dist1);
  vec3 color1 = uAccentColor * uBgAmbientA;

  // Layer 2: radial-gradient(900px 500px at 90% 0%, rgba(201,161,90,var(--bg-ambient-b)),transparent 55%)
  vec2 center2 = vec2(0.90 * uViewport.x, 0.0 * uViewport.y);
  vec2 d2 = pix - center2;
  float dist2 = length(d2 / vec2(900.0, 500.0));
  float gradient2 = smoothstep(0.55, 0.56, dist2);
  vec3 color2 = uGoldColor * uBgAmbientB;

  // Layer 3: radial-gradient(900px 650px at 52% 52%, rgba(var(--violet-rgb),.05),transparent 62%)
  vec2 center3 = vec2(0.52 * uViewport.x, 0.52 * uViewport.y);
  vec2 d3 = pix - center3;
  float dist3 = length(d3 / vec2(900.0, 650.0));
  float gradient3 = smoothstep(0.62, 0.63, dist3);
  vec3 color3 = uVioletColor * 0.05;

  // Layer 4 and 5: repeating-linear-gradient for the grid lines.
  // We'll compute two overlapping gradients: one at 90 degrees (vertical lines) and one at 0 degrees (horizontal lines).
  // Vertical lines
  float gridX = mod(pix.x, 28.0);
  float distToVert = abs(gridX - 14.0);
  float verticalLineMask = step(distToVert, 0.5);
  // Horizontal lines
  float gridY = mod(pix.y, 28.0);
  float distToHoriz = abs(gridY - 14.0);
  float horizontalLineMask = step(distToHoriz, 0.5);
  // Combine
  float gridLineMask = max(verticalLineMask, horizontalLineMask);
  vec3 gridLine = uGridLineColor * gridLineMask;

  // Base color
  vec3 baseColor = uBaseColor;

  // Combine layers
  vec3 color = baseColor;
  color += color1 * gradient1;
  color += color2 * gradient2;
  color += color3 * gradient3;
  color += gridLine;

  // Clamp to [0,1]
  return clamp(color, 0.0, 1.0);
}

// ------------------------------------------------------------------
// Helper: rounded-rect SDF (pixel space, centered)
// Returns <0 inside, >0 outside, distance in pixels.
// ------------------------------------------------------------------
float roundedRectSDF(vec2 p, vec2 halfSize, float radius) {
  vec2 d = abs(p) - halfSize;
  float outside = length(max(d, vec2(0.0)));
  float inside  = min(max(d.x, d.y), 0.0);
  return outside + inside - radius;
}

// ------------------------------------------------------------------
// Main
// ------------------------------------------------------------------
void main() {
  // Convert gl_FragCoord (bottom-left origin) to top-left pixel coords
  vec2 pix = gl_FragCoord.xy;
  pix.y = uViewport.y - pix.y;   // now origin top-left, matches CSS

  // ----- Early-out using rounded-rect SDF -----
  vec2 centered = pix - (uRect.xy + uRect.zw * 0.5); // shift to element-local, centered
  vec2 halfSize = uRect.zw * 0.5;
  float dist = roundedRectSDF(centered, halfSize, uRadius);
  if (dist >= 0.0) {          // outside the rounded rect
    fragColor = vec4(0.0);    // fully transparent
    return;
  }

  // ----- Compute glass highlight (procedural background + distortion) -----
  // 1. UV for background sampling (0-1, top-left)
  vec2 uv = pix / uViewport;

  // 2. Base background colour (what would be behind the glass)
  vec3 bg = backgroundColor(uv);

  // 3. Simple procedural distortion (you can replace with a normal map later)
  vec2 distortion = sin(uv * vec2(12.0, 8.0) + uTime * 0.5) * 0.002;

  // 4. Refraction – sample the displaced background
  vec3 refracted = backgroundColor(uv + distortion);

  // 5. Chromatic aberration – slight RGB offset
  vec2 offset = vec2(0.001, 0.001);
  vec2 rPos = uv + distortion + offset;
  vec2 gPos = uv + distortion;
  vec2 bPos = uv + distortion - offset;
  vec3 rSample = backgroundColor(rPos);
  vec3 gSample = backgroundColor(gPos);
  vec3 bSample = backgroundColor(bPos);
  vec3 chroma;
  chroma.r = rSample.r;
  chroma.g = gSample.g;
  chroma.b = bSample.b;

  // 6. Fresnel highlight – approximate using view-direction
  // We'll use a fake Fresnel that increases towards the edges of the element.
  vec2 local = (centered + halfSize) / (2.0 * halfSize); // 0 to 1 in each axis
  float edgeDistance = min(min(local.x, local.y), 1.0 - max(local.x, local.y));
  float fresnel = 1.0 - edgeDistance * 2.0;
  fresnel = clamp(fresnel, 0.0, 1.0);
  // Adjust highlight intensity based on theme (brighter in dark theme)
  float highlightIntensity = mix(0.1, 0.3, uIsLight);
  vec3 highlight = mix(vec3(0.0), vec3(1.0), fresnel) * highlightIntensity;

  // 7. Final glass colour
  vec3 glass = mix(refracted, chroma, 0.1) + highlight;

  fragColor = vec4(glass, 1.0);
}`;

/**
 * Compiles a shader from source.
 * @param {WebGL2RenderingContext} gl
 * @param {number} type - gl.VERTEX_SHADER or gl.FRAGMENT_SHADER
 * @param {string} source
 * @returns {WebGLShader}
 */
function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    console.error('Could not compile shader:', info);
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

/**
 * Creates a shader program from vertex and fragment sources.
 * @param {WebGL2RenderingContext} gl
 * @param {string} vertexSrc
 * @param {string} fragmentSrc
 * @returns {WebGLProgram}
 */
function createProgram(gl, vertexSrc, fragmentSrc) {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSrc);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSrc);
  if (!vertexShader || !fragmentShader) return null;

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program);
    console.error('Could not link program:', info);
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

/**
 * Initializes the shared WebGL context and the glass shader program.
 * @returns {boolean} true if successful
 */
function initGL() {
  // Create the shared canvas if it doesn't exist.
  sharedCanvas = document.getElementById('gl-shared');
  if (!sharedCanvas) {
    sharedCanvas = document.createElement('canvas');
    sharedCanvas.id = 'gl-shared';
    sharedCanvas.style.position = 'fixed';
    sharedCanvas.style.top = '0';
    sharedCanvas.style.left = '0';
    sharedCanvas.style.width = '100vw';
    sharedCanvas.style.height = '100vh';
    sharedCanvas.style.pointerEvents = 'none';
    sharedCanvas.style.zIndex = '-1'; // behind everything
    document.body.appendChild(sharedCanvas);
  }

  // Set the drawing buffer size to match the device pixel ratio.
  const dpr = window.devicePixelRatio;
  sharedCanvas.width = Math.round(window.innerWidth * dpr);
  sharedCanvas.height = Math.round(window.innerHeight * dpr);

  // Get the WebGL2 context.
  gl = sharedCanvas.getContext('webgl2', { antialias: false, alpha: true });
  if (!gl) {
    console.error('Failed to get WebGL2 context');
    return false;
  }

  // Create the glass shader program.
  program = createProgram(gl, vertexShaderSource, fragmentShaderSource);
  if (!program) {
    console.error('Failed to create shader program');
    return false;
  }

  // We'll use a simple triangle strip to render a quad covering the entire scissor rectangle.
  // No need for a vertex buffer; we can use gl.drawArrays with hardcoded positions in the shader.
  // However, we still need to tell GL about the attribute location.
  const positionAttributeLocation = gl.getAttribLocation(program, 'aPosition');
  gl.enableVertexAttribArray(positionAttributeLocation);

  // We'll bind a dummy buffer for the attribute, but we can also use vertexAttribPointer with a constant.
  // For simplicity, we'll create a buffer with a single triangle strip (two triangles) covering [-1,1] in clip space.
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  // positions for a triangle strip that covers the viewport in clip space (-1 to 1)
// Order: bottom-left, bottom-right, top-left, top-right
  const positions = new Float32Array([
    -1, -1,
     1, -1,
    -1,  1,
     1,  1
  ]);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
  gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

  // Cache uniform locations.
  program.uRectLoc = gl.getUniformLocation(program, 'uRect');
  program.uRadiusLoc = gl.getUniformLocation(program, 'uRadius');
  program.uViewportLoc = gl.getUniformLocation(program, 'uViewport');
  program.uTimeLoc = gl.getUniformLocation(program, 'uTime');
  program.uIsLightLoc = gl.getUniformLocation(program, 'uIsLight');
  program.uBgAmbientALoc = gl.getUniformLocation(program, 'uBgAmbientA');
  program.uBgAmbientBLoc = gl.getUniformLocation(program, 'uBgAmbientB');
  program.uBaseColorLoc = gl.getUniformLocation(program, 'uBaseColor');
  program.uAccentColorLoc = gl.getUniformLocation(program, 'uAccentColor');
  program.uGoldColorLoc = gl.getUniformLocation(program, 'uGoldColor');
  program.uVioletColorLoc = gl.getUniformLocation(program, 'uVioletColor');
  program.uGridLineColorLoc = gl.getUniformLocation(program, 'uGridLineColor');

  return true;
}

/**
 * Updates the shared WebGL canvas size when the window resizes or DPR changes.
 */
function onResize() {
  if (!gl) return;
  const dpr = window.devicePixelRatio;
  sharedCanvas.width = Math.round(window.innerWidth * dpr);
  sharedCanvas.height = Math.round(window.innerHeight * dpr);
  gl.viewport(0, 0, sharedCanvas.width, sharedCanvas.height);
}

/**
 * Updates the uniforms that change frequently (time, scroll-driven values, etc.).
 * We'll call this once per frame before rendering the elements.
 */
function updateUniforms() {
  if (!gl || !program) return;

  // Time in seconds
  gl.uniform1f(program.uTimeLoc, performance.now() / 1000);

  // Theme flag: 0 for dark, 1 for light
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  gl.uniform1f(program.uIsLightLoc, isLight ? 1.0 : 0.0);

  // Scroll-driven ambient values (from the CSS custom properties on the root element)
  const root = document.documentElement;
  const bgAmbientA = parseFloat(getComputedStyle(root).getPropertyValue('--bg-ambient-a')) || 0.0;
  const bgAmbientB = parseFloat(getComputedStyle(root).getPropertyValue('--bg-ambient-b')) || 0.0;
  gl.uniform1f(program.uBgAmbientALoc, bgAmbientA);
  gl.uniform1f(program.uBgAmbientBLoc, bgAmbientB);

  // Base colors (from CSS custom properties)
  const baseColor = getComputedStyle(root).getPropertyValue('--bg-base');
  const accentColor = getComputedStyle(root).getPropertyValue('--accent');
  const goldColor = getComputedStyle(root).getPropertyValue('--gold');
  const violetColor = getComputedStyle(root).getPropertyValue('--violet');
  const gridLineOpacity = parseFloat(getComputedStyle(root).getPropertyValue('--grid-line-opacity')) || 0.0;

  // Convert hex colors to RGB vec3 (assuming they are in hex format like #53d7a6)
  function hexToRgb(hex) {
    // Remove the '#' if present
    hex = hex.replace(/^#/, '');
    // Parse the hex string
    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return [r / 255.0, g / 255.0, b / 255.0];
  }

  const baseRgb = hexToRgb(baseColor);
  const accentRgb = hexToRgb(accentColor);
  const goldRgb = hexToRgb(goldColor);
  const violetRgb = hexToRgb(violetColor);

  // Grid line color: accent color multiplied by the opacity
  const gridLineRgb = [
    accentRgb[0] * gridLineOpacity,
    accentRgb[1] * gridLineOpacity,
    accentRgb[2] * gridLineOpacity
  ];

  gl.uniform3fv(program.uBaseColorLoc, baseRgb);
  gl.uniform3fv(program.uAccentColorLoc, accentRgb);
  gl.uniform3fv(program.uGoldColorLoc, goldRgb);
  gl.uniform3fv(program.uVioletColorLoc, violetRgb);
  gl.uniform3fv(program.uGridLineColorLoc, gridLineRgb);
}

/**
 * Renders one frame: for each glass element, set the scissor to its bounds,
 * render the glass shader to the shared WebGL canvas, then copy the result
 * to the element's 2D canvas.
 */
function render() {
  if (!gl || !program) return;

  // Use our glass shader program.
  gl.useProgram(program);

  // Update uniforms that change over time or with scroll/theme.
  updateUniforms();

  // Clear the entire shared canvas to transparent (we only want to draw inside the scissor rects).
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // For each glass element, set scissor and draw.
  document.querySelectorAll(GLASS_SELECTORS.join(',')).forEach(element => {
    // Get the element's bounding box in CSS pixels (top-left origin).
    const rect = element.getBoundingClientRect();
    const dpr = window.devicePixelRatio;

    // Convert to device pixels for the scissor test and for the 2D canvas copy later.
    const scissorX = Math.round(rect.left * dpr);
    const scissorY = Math.round((sharedCanvas.height - (rect.top + rect.height) * dpr)); // flip Y
    const scissorWidth = Math.round(rect.width * dpr);
    const scissorHeight = Math.round(rect.height * dpr);

    // Pass the element's rectangle and radius as uniforms (in device pixels).
    const radiusPx = parseFloat(getComputedStyle(element).borderTopLeftRadius); // CSS pixels
    const uRect = [
      rect.left * dpr,
      rect.top * dpr,
      rect.width * dpr,
      rect.height * dpr
    ];
    const uRadius = radiusPx * dpr;

    gl.uniform4f(program.uRectLoc,  ...uRect);
    gl.uniform1f(program.uRadiusLoc, uRadius);

    // Enable scissor test and set the rectangle.
    gl.enable(gl.SCISSOR_TEST);
    gl.scissor(scissorX, scissorY, scissorWidth, scissorHeight);

    // Draw a triangle strip that covers the entire scissor rectangle (our shader outputs the glass effect).
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    gl.disable(gl.SCISSOR_TEST);

    // Now copy the relevant region from the shared WebGL canvas to the element's 2D canvas.
    const highlightCanvas = element.querySelector('.glass-highlight');
    if (highlightCanvas) {
      const ctx2d = highlightCanvas.getContext('2d');
      // Ensure the 2D canvas is the right size (device pixels).
      highlightCanvas.width = scissorWidth;
      highlightCanvas.height = scissorHeight;
      ctx2d.clearRect(0, 0, scissorWidth, scissorHeight);
      ctx2d.drawImage(
        sharedCanvas,
        scissorX, scissorY, scissorWidth, scissorHeight, // source rect in shared canvas (device pixels)
        0, 0, scissorWidth, scissorHeight                // dest rect in 2D canvas
      );
    }
  });

  // Request the next frame.
  frameID = requestAnimationFrame(render);
}

/**
 * Starts the render loop.
 */
function startRenderLoop() {
  cancelAnimationFrame(frameID);
  frameID = requestAnimationFrame(render);
}

/**
 * Stops the render loop (e.g., when page is hidden).
 */
function stopRenderLoop() {
  cancelAnimationFrame(frameID);
  frameID = null;
}

/**
 * Sets up listeners for resize, visibility change, and scroll (to trigger a render).
 * We don't need to update per-element data on every frame; we just need to redraw when layout changes.
 * For simplicity, we'll redraw on resize, visibility change, and scroll.
 */
function setupListeners() {
  window.addEventListener('resize', () => {
    onResize();
    startRenderLoop(); // ensure we're rendering after a resize
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopRenderLoop();
    } else {
      startRenderLoop();
    }
  });

  // We'll also trigger a render on scroll (to update the scroll-dependent ambient values).
  window.addEventListener('scroll', startRenderLoop);
}

/**
 * Main entry point: check if we should use WebGL, and if so, initialize everything.
 */
async function init() {
  if (!shouldUseWebGL()) {
    console.log('WebGL not available or disabled; falling back to CSS glass.');
    return;
  }

  try {
    await loadThreeJS(); // we load three.js even though we don't use it yet in Milestone 1; it's ready for Milestone 2.
  } catch (e) {
    console.error('Failed to load Three.js:', e);
    return;
  }

  if (!initGL()) {
    console.error('Failed to initialize WebGL context');
    return;
  }

  // Create the per-element 2D canvases for the glass highlight.
  // We do this after we know WebGL is working, but before we start rendering.
  document.querySelectorAll(GLASS_SELECTORS.join(',')).forEach(element => {
    // Only add the canvas if it doesn't already exist.
    if (!element.querySelector('.glass-highlight')) {
      const canvas = document.createElement('canvas');
      canvas.className = 'glass-highlight';
      canvas.setAttribute('aria-hidden', 'true');
      // Styles will be applied via CSS (see below).
      element.appendChild(canvas);
    }
  });

  // Add a marker class to the html element so we can disable the CSS ::after highlights.
  document.documentElement.classList.add('js-webgl-active');

  // Set up the initial size and listeners.
  onResize();
  setupListeners();

  // Start the render loop.
  startRenderLoop();
}

/**
 * Call this to shut down and clean up (optional).
 */
function dispose() {
  if (gl) {
    gl.useProgram(null);
    if (program) {
      gl.deleteProgram(program);
      program = null;
    }
    // Note: we are not deleting the shared canvas or the per-element canvases here;
    // they will be removed by the page lifecycle or we can do it explicitly if needed.
  }
  stopRenderLoop();
  document.documentElement.classList.remove('js-webgl-active');
  // Optionally remove the shared canvas and the per-element canvases if we want to clean up the DOM.
}

// Export for ES module usage
export { init, dispose };
// Also export a default for compatibility (if needed)
export default { init, dispose };