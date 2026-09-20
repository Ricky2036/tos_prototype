# Motion QA

## Gates

| Gate | Pass question | Example evidence |
|---|---|---|
| G0 Functional | Did the action work and reach the intended state? | assertions, final screenshot, DOM/app state |
| G1 Semantic | Is the correct object/state relationship communicated? | source/destination identity, direction, hierarchy |
| G2 Temporal | Are response, onset, duration, overlap, and settle aligned? | timestamp deltas, motion-energy curve |
| G3 Motion | Does the path and velocity shape match? | tracked position/scale, overshoot, curve RMSE |
| G4 Visual | Do corresponding frames look right? | masks, overlays, SSIM/VMAF, geometry deltas |
| G5 Quality | Is it robust, accessible, and smooth enough? | reduced-motion run, repeated input, traces |

G0 and G1 are hard gates by default. A high image similarity score cannot compensate for the wrong final state or wrong object identity.

## Alignment rules

- Align clips by the semantic trigger or first target response, not by file start.
- Compare at original reference timestamps when possible.
- Normalize coordinate spaces only after confirming viewports and crops represent the same content.
- Mask unrelated status bars, clocks, cursors, live media, and randomized content.
- Use a region of interest for element-level judgments; retain a full-frame check for composition and occlusion.

## Suggested starting tolerances

These are defaults to tune, not universal quality laws:

- input response delta: ≤ 33 ms for 60 Hz references;
- primary phase duration: within ±8% or ±33 ms, whichever is larger;
- normalized tracked-position RMSE: ≤ 0.03;
- final geometry: ≤ 2 CSS px at the target viewport;
- opacity: ≤ 0.05 absolute difference in a controlled ROI;
- dropped/long frames: no repeated frame over the platform budget in the tested path;
- reduced-motion: all functional assertions pass and the documented substitution is present.

Compression, font rendering, subpixel rasterization, and device capture pipelines can lower pixel scores without changing perceived motion. Report metric limitations.

## Iteration protocol

1. Run G0/G1 and stop if either fails.
2. Find the largest G2/G3 deviation.
3. Change one coherent parameter group: trigger/delay, duration, easing, spring, path, or choreography.
4. Capture with the same route, viewport, data, action, and sample times.
5. Record score change and keep the change only if it improves the intended gates without regression.
6. Stop at the declared iteration limit or minimum improvement.

## Report template

```text
Outcome: pass | partial | fail
Evidence class: A | B | C | D
Hard gates: G0 ..., G1 ...
Largest deviations:
  - G2: ...
  - G3: ...
  - G4: ...
Quality/accessibility: ...
Artifacts: Motion Spec, reference analysis, candidate capture, comparison report
Remaining uncertainty: observed / inferred / chosen values that still matter
```
