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

Example:

```json
{
  "url": "http://127.0.0.1:8080/detail",
  "outputDir": ".motion/candidate",
  "viewport": { "width": 393, "height": 852, "deviceScaleFactor": 1 },
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

`capture_web.mjs` uses Playwright. It writes PNGs and `capture-report.json`. Set `NODE_PATH` to a Playwright installation if it is not a local project dependency. By default the script advances ordinary wall-clock time between samples because this is compatible with CSS, WAAPI, and library animations. Use only local, stable pages and ascending sample times.

For deterministic app state, provide a `localStorage` object whose values are serialized strings. Use an `evaluate` action only for local test initialization that cannot be expressed through storage or user input, for example selecting an in-memory route state before the measured action.

For an exact frame-time harness, expose a test-only progress controller in the prototype. Driving a canonical progress value is more reliable than attempting to freeze every browser clock and third-party animation runtime.
