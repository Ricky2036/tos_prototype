# Desktop multi-select pickup and drop baseline

## Reference evidence

- Evidence class: **B — 24 fps video**.
- Viewport: `592 × 1280`.
- Semantic observations:
  - Around `5.00–5.30s`, selected icons leave their cells and gather into one counted stack.
  - During the drag, the front icon stays legible while up to three rear icons expose offset edges; the count badge represents the complete selection.
  - Around `9.50s`, release begins. Icons fan from the stack directly to their destination cells without an intermediate fade or teleport.
  - The group is visually settled around `10.00s`; selection remains active afterward.
- Easing and exact spring constants are inferred because the source contains no runtime metadata.

## Implementation baseline

- Dragging any selected member moves the selected IDs in their existing global order.
- All selected source cells become drag sources, rather than hiding only the pressed member.
- Pickup uses a four-layer maximum visual stack plus a badge containing the full selected count.
- Drop uses one visual clone per selected item. Real destination cells remain hidden until their matching clone reaches the final DOM frame.
- Pointer follow only writes the drag root transform. Drop clones only animate `transform` and `opacity`.
- Reduced motion commits the same group order and performs an immediate visual handoff.

## Acceptance result

- **G0 Functional:** pass in component/store regression; group reorder is committed through `home.moveItems`.
- **G1 Semantic:** pass in source-level regression; all selected sources, stack, per-item destination clones, and destination handoff are represented.
- **G2 Temporal:** chosen `360–450ms` staggered settle remains within the video-derived `420 ± 80ms` window.
- **G3 Motion:** inferred `cubic-bezier(.22,1,.36,1)` preserves a fast release and soft settle without opacity-driven disappearance.
- **G4 Visual:** stack depth is capped at four visible layers; count badge shows total selection.
- **G5 Quality:** tests and production build pass; reduced-motion path and clone cleanup are explicit.

Reference-analysis artifacts live in `.motion/references/multi-select-drop/`.
