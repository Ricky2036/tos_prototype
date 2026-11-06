# Reference analysis

## Evidence order

Prefer, in order: inspectable source and animation metadata; original-rate screen recording; exported frame sequence; compressed/social video; static before/after frames; prose. Keep the original file untouched and derive analysis artifacts beside it.

## Normalize before measuring

1. Read container duration, average and real frame rate, time base, dimensions, rotation, and pixel format with `ffprobe`.
2. Correct rotation and crop device chrome only when it is outside the interaction being studied.
3. Preserve original timestamps. Variable-frame-rate recordings should be sampled by presentation timestamp, not by assuming frame index / nominal FPS.
4. Define a region of interest when a cursor, clock, video, or background animation would dominate motion energy.
5. Record the coordinate space for every measurement: reference pixels, normalized reference, viewport, parent, or local.

`inspect_reference.py` performs metadata extraction, frame-difference motion-energy analysis, onset/settle estimation, a contact sheet, and a motion trail. Its onset estimate is a starting point for inspection, not semantic truth.

## Build a motion decomposition

Describe the transition as phases:

| Phase | Question | Typical evidence |
|---|---|---|
| Trigger | What input starts it? | touch indicator, pressed state, gesture displacement |
| Response | How quickly is input acknowledged? | first changed pixel in the target ROI |
| Anticipation | Does it compress, dim, or stage? | short reverse or preparatory motion |
| Primary | What carries meaning? | dominant geometry/position/opacity track |
| Secondary | What overlaps or follows? | staggered children, scrim, text, shadow |
| Settle | When is it visually at rest? | motion energy returns to baseline |

For each element, track bounding box center/size, transform, opacity, clip/radius, blur, and occlusion only when the evidence supports it. A measured bounding box can conflate scale, layout, crop, and perspective; note that ambiguity.

## Separate observation from inference

- **Observed**: a timestamped pixel location, visible state, event, or container metadata.
- **Inferred**: an easing family, spring, hidden hierarchy, transform origin, or implementation mechanism that explains observations.
- **Chosen**: a design decision used because the reference cannot determine the value.

Confidence should fall when compression is heavy, motion blur masks edges, the sampling rate is low, the ROI is occluded, or multiple models explain the same frames.

## Useful derived traces

- normalized displacement `p(t) = (x(t)-x0)/(x1-x0)`;
- size or scale trace;
- opacity trace from alpha/source access, or carefully controlled luminance samples;
- finite-difference velocity and acceleration after modest smoothing;
- overshoot ratio and the time between extrema;
- per-frame motion energy for coarse onset and settle.

Do not fit derivatives from a heavily compressed or low-frame-rate clip without reporting uncertainty. Never use AI-interpolated frames as timestamps from the source.
