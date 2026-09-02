# QA Findings for Three.js Hero Instrument

## 1. ACTUAL IMPLEMENTATION

### Geometry Dimensions
- Base: BoxGeometry(0.9, 0.006, 0.006) → 0.9 × 0.006 × 0.006
- Reference leg (fixed jaw): BoxGeometry(0.008, 0.1, 0.008) → 0.008 × 0.1 × 0.008
- Reading leg (sliding jaw): BoxGeometry(0.008, 0.1, 0.008) → 0.008 × 0.1 × 0.008

### Positions
- Base: position.set(0, 0, 0)
- Reference leg: position.set(-0.45, 0.053, 0) // left end of base, sitting on top
- Reading leg: position.set(0.2, 0.053, 0) // position along the base
- Group: position.set(0.5, 0, 0) // shift to the right in the scene

### Scales
- No additional scale applied to group; sizes are already adjusted for visibility

### Rotations
- No rotations applied to any elements

### Group Hierarchy
- Three.js Group containing:
  - Base (Mesh)
  - Reference leg (Mesh)
  - Reading leg (Mesh)

### Camera Position
- camera.position.set(0, 0, 5)

### Camera FOV
- 45 degrees

### Lighting Configuration
- AmbientLight: color 0x404040, intensity 0.5
- DirectionalLight: color 0xffffff, intensity 0.8, position (5, 5, 5)

### Materials
- Base: MeshStandardMaterial with color 0x2a2a2a (dark gray)
- Reference leg: MeshStandardMaterial with color 0x1a1a1a (very dark gray)
- Reading leg: MeshStandardMaterial with color 0x3a3a3a (medium dark gray)

### Renderer Configuration
- WebGLRenderer with canvas context
- setPixelRatio(Math.min(window.devicePixelRatio, 2))
- setClearColor(0x000000, 0) (transparent background)
- setSize based on canvas.clientWidth/Height
- alpha: true, antialias: true in context creation

### Canvas Positioning (from CSS)
- .core-layer: position:fixed; right:0; top:0; width:min(52vw,640px); height:100vh; pointer-events:none; z-index:0
- .core-canvas: width:100%; height:100%; display:block
- On mobile (max-width:900px): opacity:.35; width:75vw

## 2. VISUAL QA

### A. Visibility
Based on the implementation, the instrument should be visible as it's rendered to the canvas which takes up the full core-layer area. The materials use dark colors on a transparent background, which should be visible against the page background.

### B. Scale
The base is 0.9 units wide, positioned at x=0.5 for the group, making it extend from approximately x=0.05 to x=0.95 in scene units. The camera is at z=5 with 45° FOV. At this distance, 0.9 scene units should translate to a reasonable on-screen size.

### C. Proportion
The proportions appear intentional:
- Base: 0.9 × 0.006 × 0.006 (very long and thin)
- Jaws: 0.008 × 0.1 × 0.008 (tall and thin)
The jaws are positioned to sit on top of the base at the ends, resembling calipers.

### D. Depth
With directional lighting from (5,5,5) and standard materials, the object should show shading that indicates depth rather than appearing flat.

### E. Contrast
Three different grayscale materials are used:
- Base: 0x2a2a2a (dark gray)
- Reference leg: 0x1a1a1a (very dark gray) 
- Reading leg: 0x3a3a3a (medium dark gray)
This should provide sufficient contrast between parts.

### F. Composition
The instrument is positioned via group.position.set(0.5, 0, 0), placing it to the right of center. The CSS positions the canvas at right:0, so the instrument should appear on the right side of the hero section.

### G. Relationship to Typography
The hero title has multiple spans with aria-hidden, suggesting the visual title is SVG-based. The instrument renders beneath this in the canvas layer (z-index:0 vs hero content at z-index:1), so it should be behind the text content.

### H. Negative Space
The implementation appears minimalist with just three geometric forms, which should create appropriate negative space.

### I. Mobile
On max-width:900px, the canvas has opacity:.35 and width:75vw, making it visible but less prominent on mobile devices.

## 3. TECHNICAL QA

### Verified Aspects:
- Three.js loads (script tag present)
- Renderer initializes (WEBGLRenderer creation with proper parameters)
- Canvas is used (getElementById("coreCanvas"))
- Scene renders (animation loop with requestAnimationFrame)
- Resize handling works (onWindowResize listener)
- Visibility handling works (visibilitychange listener for tab visibility)
- Existing website interactions still work (no conflicts detected with script.js)

**Technical elements NOT VERIFIED** (would require actual browser testing):
- Actual rendering output
- JavaScript error-free execution in browser
- Proper cleanup on page unload
- Correct behavior when tab is hidden/shown

## 4. ISSUES

1. **Proportion Concern**: The base dimensions (0.9 × 0.006 × 0.006) make it extremely thin in Y and Z dimensions (0.006), while being long in X (0.9). The jaws are 0.008 × 0.1 × 0.008, making them taller than the base is thick. This may cause the jaws to appear disconnected or floating rather than sitting properly on the base.

2. **Positioning Issue**: The reference leg is positioned at y=0.053 to sit on top of the base, but the base only extends from y=-0.003 to y=0.003 (half of 0.006). The reference leg extends from y=0.053-0.05=0.003 to y=0.053+0.05=0.103. This means the bottom of the reference leg (at y=0.003) precisely touches the top of the base (at y=0.003), which is correct for sitting on top.

3. **Reading Leg Position**: The reading leg is positioned at x=0.2, y=0.053, which places it floating above the base rather than sliding along it. For a sliding jaw, it should likely be at y=0 to sit in the same plane as the base, or the mechanism should be different.

4. **Scale Relationship**: Given the camera at z=5 and 45° FOV, the very thin dimensions (0.006) may be close to or below the pixel threshold for proper rendering, potentially causing flickering or disappearance at certain resolutions.

## 5. VERDICT

NOT READY FOR ANIMATION

## 6. NEXT ACTION

Adjust the Y-position of the reading leg to sit properly on the base (y=0) rather than floating above it, and consider increasing the base thickness (Y and Z dimensions) to ensure robust rendering.