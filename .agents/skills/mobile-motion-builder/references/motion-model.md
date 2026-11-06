# Motion model selection

Choose the model that explains behavior and interaction, not merely the one that can approximate the sampled pixels.

## Decision guide

- Use a **tween** when duration is intentional, endpoints are fixed, the path is monotonic, and interruption does not need natural velocity continuity.
- Use **keyframes** for authored multi-stage choreography, discrete holds, path bends, or property changes that one easing curve cannot express.
- Use a **spring** when the motion retargets, carries velocity, has physically related overshoot/settle, or responds continuously after a gesture release.
- Use **decay/inertia** when released velocity should continue and slow under friction, often followed by snapping or bounds handling.
- Use **gesture mapping** while the user's finger directly controls progress; on release, hand off position and velocity to a spring, decay, or state transition.

## Tween

A cubic Bézier easing has control points `(x1,y1,x2,y2)`, with `x1,x2` constrained to `[0,1]` for a single-valued time mapping. Fit it to normalized progress, not raw pixels. Report duration separately from the curve.

Avoid extreme control points that numerically match a noisy trace but introduce implausible velocity. Prefer a simpler known curve when its error is effectively equivalent.

## Spring

For a unit step, a physical spring is described by mass `m`, stiffness `k`, damping `c`, and initial velocity `v0`. Useful derived values are natural frequency `ωn = sqrt(k/m)` and damping ratio `ζ = c/(2*sqrt(k*m))`.

- `ζ < 1`: underdamped, possible overshoot.
- `ζ = 1`: critically damped.
- `ζ > 1`: overdamped.

Spring `duration` is normally an observed/perceptual settling time, not the integration input. Do not transplant spring numbers across libraries until their parameter units and rest thresholds are confirmed.

## Keyframes and choreography

Keyframe offsets must be ordered from 0 to 1. Put inter-element relations in `coordination` rather than duplicating magic delays. Express choreography using overlap, sequence, stagger, and synchronization anchors.

## Interruptibility

Specify one behavior:

- cancel and return;
- cancel and snap to target;
- queue input;
- ignore input while running;
- retarget from current value;
- retarget while preserving current velocity.

The last option generally requires a stateful spring or animation system exposing velocity. Reversing a fixed-duration tween from its current visual position can create a velocity discontinuity even when position is continuous.

## Direct manipulation and gesture physics

Interactive mobile gestures (App Switcher card decks, bottom sheet drawer pull, swipe-to-dismiss, rubber-banding edges) require modeling beyond static tweens:

1. **Tracking ratio & linearity**:
   - `trackingRatio = 1.0`: 1:1 finger lockstep.
   - Non-linear progressive scaling: $y = f(x)$ applied during multi-card chain reactions (e.g. background cards compress with geometric decay as primary card is dragged).
2. **Rubber-band damping**:
   - Standard logarithmic resistance at boundaries: $f(x) = (x \cdot d \cdot c) / (d + c \cdot x)$ or square-root damping $f(x) = \text{sign}(x) \cdot \sqrt{|x|} \cdot c$.
3. **Release & velocity inheritance**:
   - **Pause-to-zero rule**: If finger rests stationary for $> 100\text{ ms}$ before release, release velocity must be forced to $0$, triggering positional snap rather than directional fling.
   - **Fling threshold**: Fast flicks with $|v| > v_{\text{threshold}}$ (typically $0.5\text{ px/ms}$) commit the transition regardless of distance traveled; slow releases below threshold commit only if distance crosses the positional threshold ($> 50\%$).
   - Velocity must seed the initial velocity $v_0$ of the post-release settle spring to guarantee $C^1$ velocity continuity.

## Perceptual priorities

Tune in this order: state correctness, direction/spatial continuity, response latency, phase ordering, total duration/settle, velocity shape, overshoot, then small visual details. Small timing errors at the trigger and handoff usually feel worse than similar errors near rest.

