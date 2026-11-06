# Mobile web implementation and capture

## Implementation routing

Use the project's existing mechanism first:

- CSS transitions/animations for simple declarative tweens and keyframes;
- Web Animations API when timeline control, cancellation, or `finished` coordination matters;
- an existing React animation library for gestures, layout projection, shared elements, or springs;
- `requestAnimationFrame` only for behavior the established tools cannot express cleanly.

Avoid adding an animation dependency for one basic effect. If a new runtime is genuinely needed, explain the bundle and maintenance tradeoff before adding it.

## State ownership

The product state should determine the destination; animation interpolates between states. Keep transient gesture values separate from committed navigation or selection state. Ensure cleanup on unmount, route change, and cancellation.

Prefer stable selectors such as `data-testid`. Avoid selectors coupled to generated class names or text that localization can change.

## Rendering and performance

- Prefer `transform` and `opacity` for high-frequency animation.
- Apply `will-change` narrowly and temporarily; it is a hint, not a fix.
- Use layout animation when size/position change is the semantic event, but measure it on target devices.
- Avoid reading layout after writing style repeatedly in the same frame.
- Be deliberate about stacking contexts, clipping, fixed-position ancestors, and transform origins.
- Freeze randomized content, timers, carets, animated media, and network-dependent layout during comparison captures.

## Reduced motion

Bind to `prefers-reduced-motion`. Reduce or replace large translation, zoom, parallax, and repeated ambient movement while preserving state feedback and information. A short cross-fade or immediate state change is often appropriate; it is not always correct to remove all feedback.

## Deterministic capture config

`capture_web.mjs` supports two capture modes:

### Mode A: Wall-Clock Mode (Default)
Advances ordinary wall-clock time between samples. Compatible with CSS, WAAPI, and third-party library animations.

```json
{
  "url": "http://127.0.0.1:8080/detail",
  "outputDir": ".motion/candidate",
  "viewport": { "width": 393, "height": 852, "deviceScaleFactor": 1 },
  "targetSelector": ".screen",
  "recordVideo": true,
  "reducedMotion": "no-preference",
  "initialWaitMs": 300,
  "actions": [
    { "type": "click", "selector": "[data-testid='feed-card-42']" }
  ],
  "samples": [
    { "name": "trigger", "timeMs": 0 },
    { "name": "mid", "timeMs": 220 },
    { "name": "settled", "timeMs": 620 }
  ]
}
```

### Mode B: Seek Mode (Virtual Progress / Stepping)
Eliminates time drift and frame drops by directly driving a canonical progress value or harness controller (`window.__motionSeek(progress)`):

```json
{
  "url": "http://127.0.0.1:8080/detail",
  "outputDir": ".motion/candidate",
  "mode": "seek",
  "seek": {
    "function": "window.__motionSeek",
    "domain": "progress"
  },
  "targetSelector": ".screen",
  "samples": [
    { "name": "start", "progress": 0.0 },
    { "name": "quarter", "progress": 0.25 },
    { "name": "mid", "progress": 0.5 },
    { "name": "three-quarters", "progress": 0.75 },
    { "name": "end", "progress": 1.0 }
  ]
}
```

### Key Capabilities
- **`targetSelector`**: Restricts screenshot capture to the mobile viewport element (e.g. `.screen` or `.phone-frame`), avoiding desktop browser window borders.
- **`recordVideo: true`**: Automatically captures interaction video (`interaction.webm` and `interaction.mp4`).
- **Automatic Contact Sheet**: Stitches captured sample frames into a unified horizontal filmstrip (`contact-sheet.png`).
- **Interactive Gestures**: Supports `drag` with `pauseBeforeUpMs` (testing pause-to-zero rule), `fling`, and `evaluate`.
- **Browser Autodetection**: Automatically locates installed Playwright Chromium binaries if unconfigured.

