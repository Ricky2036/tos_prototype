---
name: mobile-motion-builder
description: Analyze, implement, reproduce, diagnose, or audit interaction motion in mobile prototypes from reference videos, frame sequences, Motion Specs, or behavior descriptions. Use for transition timing, easing or spring fitting, gesture-driven motion, motion-fidelity comparison, animation jank, and reduced-motion behavior in mobile web, iOS, Android, React Native, or Flutter. Do not use for ordinary static styling or general-purpose video editing.
---

# Mobile Motion Builder

Treat motion reconstruction as an evidence-driven engineering loop, not a prompt-writing exercise:

`reference -> observations -> Motion Spec -> implementation -> deterministic capture -> layered comparison -> bounded iteration`

## Choose the operating mode

- **Reproduce**: match a supplied reference in an existing prototype. Analyze, specify, implement, capture, and compare.
- **Design**: create motion from product intent. Start from purpose and state change, then write a Motion Spec before code.
- **Diagnose**: find why an implementation feels wrong. Inspect and report; do not modify code unless the user also asked for a fix.
- **Audit**: run the G0-G5 gates against an existing implementation and return evidence.

Do not claim precise timing, easing, spring parameters, or choreography from a static image. Mark such values as `chosen`, not `observed`.

## Grade the available evidence

Before implementation, record the evidence class:

- **A — inspectable source**: reference plus original design/runtime metadata. Highest confidence.
- **B — video or frame sequence**: measure pixels and timestamps; easing and spring parameters remain inferred.
- **C — static frames**: recover states and layout only; ask for a recording if exact motion is required.
- **D — prose only**: design plausible motion and state assumptions explicitly.

Every nontrivial value in the Motion Spec should carry provenance: `observed`, `inferred`, or `chosen`, with confidence from 0 to 1.

## Run the core workflow

### 1. Inspect the target before changing it

- Read repository instructions and identify the actual runtime, component, state owner, and existing animation system.
- Reuse the project's established animation library and tokens when suitable.
- Preserve unrelated user changes. Do not add a new dependency merely to express a basic tween or spring.
- **Visual Isolation**: Confine motion strictly to transitional properties (`transform`, `opacity`, `clip-path`). Never modify static typography, padding, or resting component styles to fix a transition.
- **Rollback First**: When correcting regressions, revert targeted lines via `git diff` / checkout rather than rewriting logic from scratch.
- Establish a reproducible route, viewport, initial state, trigger, and final-state assertion.

### 2. Analyze the reference

For a video, run:

```bash
python3 scripts/inspect_reference.py reference.mp4 --outdir .motion/reference
```

Use `--roi x,y,width,height` when unrelated video regions move. Inspect `reference.json`, `motion-energy.csv`, `contact-sheet.png`, and `motion-trail.png`. Read [reference-analysis.md](references/reference-analysis.md) when timestamps, cropping, or evidence quality are unclear.

Measure at least:

- trigger and first visible response;
- anticipation or press feedback;
- primary motion onset, peak, overshoot, and settle;
- enter/exit ordering and overlap;
- element trajectory, scale, opacity, clipping, blur, and z-order;
- interruption, reversal, repeated input, and gesture release behavior when visible.

Never treat interpolated frames as measured ground truth.

### 3. Write a Motion Spec before code

Copy [motion-spec.example.json](references/motion-spec.example.json), then validate and inspect its timeline:

```bash
python3 scripts/validate_motion_spec.py path/to/motion-spec.json --timeline
```

The `--timeline` flag generates an ASCII multi-track bar chart and a copy-pasteable Mermaid Gantt chart to review phase overlap and coordination before writing code. The contract must name the states, elements, tracks, timing, motion model, coordination, interaction semantics, reduced-motion behavior, and acceptance gates. Use [motion-spec.schema.json](references/motion-spec.schema.json) for editor support.

When a scalar trace is available as CSV columns `time_ms,value`, fit candidates instead of guessing:

```bash
python3 scripts/fit_motion.py trace.csv --out fit.json
```

Read [motion-model.md](references/motion-model.md) before choosing between tween, keyframes, spring, decay, or interactive gesture mapping.

### 4. Implement the state transition

- Preserve spatial continuity: make source and destination identity legible.
- Put semantic state in the component/state machine, not in animation callbacks alone.
- Separate gesture acquisition, state transition, and visual interpolation.
- Make interruption behavior explicit. A retargetable spring should preserve velocity; a modal sequence may instead lock or cancel.
- Use transforms and opacity for high-frequency visual motion where possible; animate layout deliberately when geometry itself is the meaning.
- **Viewport-Relative Stagger**: Calculate cascade/stagger delays strictly from items visible in the active viewport ($\ge 40\text{--}70\text{ms}$ discernible separation). Never index offscreen items with hard caps that collapse visible item delays. Offscreen elements must transition silently (0ms).
- **Full-Lifecycle Closure**: Ensure the entire sequence completes: `Trigger Feedback -> Element Motion -> Container Settlement` (e.g. auto-collapsing an empty parent overlay or canvas settle). Never terminate midway after element exit.
- Bind reduced-motion behavior to the platform preference and preserve information equivalence.

For mobile web implementation details, read [web.md](references/web.md). For native targets, follow the platform's existing framework and use the same Motion Spec and QA gates; do not translate CSS values mechanically into native APIs.

### 5. Capture deterministically

For mobile web, create a capture config (supporting Wall-Clock mode, Seek/Virtual Progress mode, element-level `targetSelector`, `recordVideo`, and interactive gesture actions like `drag` with `pauseBeforeUpMs` or `fling`), then run:

```bash
node scripts/capture_web.mjs capture.json
```

The capture runner writes sample PNGs, an automatic horizontal filmstrip (`contact-sheet.png`), and `capture-report.json`. Prefer stable test IDs. Freeze or disable unrelated clocks, network volatility, randomized content, carets, and live media.

### 6. Compare in layers

Run video-level temporal and visual comparison when both reference and candidate recordings exist:

```bash
python3 scripts/compare_motion.py reference.mp4 candidate.mp4 --outdir .motion/comparison
```

Evaluate in this order:

1. **G0 Functional** — trigger works and the intended final state is reached.
2. **G1 Semantic** — the right object, direction, hierarchy, and state relationship are represented.
3. **G2 Temporal** — latency, onset, duration, ordering, overlap, and settle time.
4. **G3 Motion** — trajectory, velocity shape, easing, overshoot, damping, continuity, and interruption.
5. **G4 Visual** — geometry, opacity, clipping, blur, color, shadow, and frame composition.
6. **G5 Quality** — jank, reduced-motion equivalence, input robustness, and device constraints.

G0 and G1 are hard gates. Do not polish pixels while they fail. Read [qa.md](references/qa.md) for metrics, thresholds, and report format.

### 7. Iterate with a stopping rule

- Change the smallest parameter set that explains the largest measured error.
- Re-capture from the same state and timestamps after every change.
- Stop after the Motion Spec's `maxAutomaticIterations`, when all hard gates pass and remaining deviations are below tolerance, or when improvement falls below `minimumImprovement`.
- If evidence cannot distinguish plausible models, report the ambiguity instead of inventing precision.

## Deliver the result

Return:

- changed files and the implemented state transition;
- Motion Spec path;
- capture and comparison artifact paths;
- G0-G5 results, with hard-gate failures first;
- remaining deviations and whether they are evidence limits, implementation limits, or deliberate product choices.

Do not describe a match as exact unless the comparison evidence supports it.
