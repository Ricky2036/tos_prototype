# tOS folder anchor transition baseline

- Mode: Audit / current implementation baseline
- Evidence: Class A, inspectable Vue source and deterministic browser runtime
- Route: `http://127.0.0.1:8888/`
- Viewport: `393 × 852`, DPR 1, portrait mobile emulation
- Initial state: fresh browser context on the unlocked desktop
- Trigger: click the first `[data-home-item^="folder:"]`
- Final assertion: folder overlay, title and at least one folder app are visible
- Reverse trigger: click the overlay at `(8, 8)` after the open animation settles
- Reverse assertion: overlay is detached and the source folder shell is visible

The former external reference videos were temporary WeChat files and are no longer present. This baseline therefore records the current implementation honestly; it does not claim an external visual match.

## Current declared timing

| Phase | Duration | Model | Provenance |
| --- | ---: | --- | --- |
| Panel, icons and backdrop open | 320 ms | `cubic-bezier(0.2, 0.9, 0.25, 1)` | observed in source |
| Title open | 220 ms after 70 ms delay | same tween | observed in source |
| Panel and icons close | 260 ms | `cubic-bezier(0.25, 1, 0.5, 1)` | observed in source |
| Reduced motion | 1 ms | immediate equivalent state | observed in source |

## First capture result

- G0 Functional: **pass**. Open assertions 3/3, close assertions 2/2, reduced-motion assertions 2/2.
- G1 Semantic: **pass for the current implementation baseline**. The same two app identities remain visible from desktop preview through the expanded grid, and the closing panel returns to the selected source folder.
- G2 Temporal: **baseline recorded**. Declared open/close durations are 320/260 ms. Wall-clock screenshot capture costs roughly 44–81 ms per frame, so these PNGs establish named visual checkpoints but are not frame-exact timing evidence.
- G3 Motion: **pass by visual inspection for continuity**. No detached clone or mid-flight identity swap is visible. External-reference curve matching is unavailable because the former temporary videos are missing.
- G4 Visual: **pass for endpoint composition**. Open settles as a centered glass panel; close restores the original desktop composition without a residual overlay. Pixel-error measurement awaits an external reference or a progress-controlled harness.
- G5 Quality: **pass for reduced-motion equivalence**. With `reducedMotion=reduce`, the overlay, title and apps reach the same usable state; no console errors or page errors were recorded.

## Artifacts

- Open report: `artifacts/open/capture-report.json` — 6 samples, functional pass.
- Close report: `artifacts/close/capture-report.json` — 5 samples, functional pass.
- Reduced-motion report: `artifacts/reduced/capture-report.json` — 2 samples, functional pass.
- Contact sheet: `artifacts/contact-sheet.jpg`.

The artifact directory is ignored by Git. Re-run the three capture configs to regenerate it on the same machine.

## Next bounded iteration

Obtain or preserve an external reference video, align it at the semantic tap, and compare the 0/80/160/240/320 ms open checkpoints. Until that evidence exists, timing changes should be labeled `chosen` rather than presented as measured reference values.
