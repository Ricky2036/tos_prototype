#!/usr/bin/env python3
"""Fit a scalar time/value trace to tween and spring candidates."""

from __future__ import annotations

import argparse
import csv
import json
import math
import sys
from pathlib import Path
from typing import Callable


PRESETS = {
    "linear": (0.0, 0.0, 1.0, 1.0),
    "ease": (0.25, 0.1, 0.25, 1.0),
    "ease-in": (0.42, 0.0, 1.0, 1.0),
    "ease-out": (0.0, 0.0, 0.58, 1.0),
    "ease-in-out": (0.42, 0.0, 0.58, 1.0),
    "material-standard": (0.2, 0.0, 0.0, 1.0),
    "material-decelerate": (0.0, 0.0, 0.2, 1.0),
}


def cubic(a: float, b: float, c: float, d: float, t: float) -> float:
    mt = 1.0 - t
    return mt * mt * mt * a + 3 * mt * mt * t * b + 3 * mt * t * t * c + t * t * t * d


def cubic_derivative(a: float, b: float, c: float, d: float, t: float) -> float:
    mt = 1.0 - t
    return 3 * mt * mt * (b - a) + 6 * mt * t * (c - b) + 3 * t * t * (d - c)


def bezier_progress(x: float, params: tuple[float, float, float, float]) -> float:
    x1, y1, x2, y2 = params
    t = x
    for _ in range(8):
        estimate = cubic(0.0, x1, x2, 1.0, t) - x
        derivative = cubic_derivative(0.0, x1, x2, 1.0, t)
        if abs(estimate) < 1e-7 or abs(derivative) < 1e-7:
            break
        candidate = t - estimate / derivative
        if not 0 <= candidate <= 1:
            break
        t = candidate
    else:
        return cubic(0.0, y1, y2, 1.0, t)
    low, high = 0.0, 1.0
    for _ in range(24):
        estimate_x = cubic(0.0, x1, x2, 1.0, t)
        if abs(estimate_x - x) < 1e-7:
            break
        if estimate_x < x:
            low = t
        else:
            high = t
        t = (low + high) / 2.0
    return cubic(0.0, y1, y2, 1.0, t)


def spring_progress(time_seconds: float, zeta: float, omega: float) -> float:
    if zeta < 1.0 - 1e-6:
        root = math.sqrt(1.0 - zeta * zeta)
        damped = omega * root
        return 1.0 - math.exp(-zeta * omega * time_seconds) * (
            math.cos(damped * time_seconds) + zeta / root * math.sin(damped * time_seconds)
        )
    if zeta <= 1.0 + 1e-6:
        return 1.0 - math.exp(-omega * time_seconds) * (1.0 + omega * time_seconds)
    root = math.sqrt(zeta * zeta - 1.0)
    r1 = -omega * (zeta - root)
    r2 = -omega * (zeta + root)
    a = -r2 / (r1 - r2)
    b = r1 / (r1 - r2)
    return 1.0 - a * math.exp(r1 * time_seconds) - b * math.exp(r2 * time_seconds)


def rmse(expected: list[float], actual: list[float]) -> float:
    return math.sqrt(sum((a - b) ** 2 for a, b in zip(expected, actual)) / len(expected))


def score_function(times: list[float], values: list[float], function: Callable[[float], float]) -> float:
    return rmse(values, [function(time) for time in times])


def load_trace(path: Path) -> tuple[list[float], list[float], dict]:
    with path.open(newline="", encoding="utf-8-sig") as handle:
        rows = list(csv.DictReader(handle))
    if len(rows) < 5 or not {"time_ms", "value"}.issubset(rows[0]):
        raise ValueError("CSV must contain at least five rows with columns time_ms,value")
    points = sorted((float(row["time_ms"]), float(row["value"])) for row in rows)
    if any(not math.isfinite(value) for point in points for value in point):
        raise ValueError("Trace contains non-finite values")
    start_time, end_time = points[0][0], points[-1][0]
    if end_time <= start_time:
        raise ValueError("time_ms must span a positive duration")
    start_value, end_value = points[0][1], points[-1][1]
    delta = end_value - start_value
    if abs(delta) < 1e-9:
        raise ValueError("First and final values are equal; provide the active transition window")
    duration_seconds = (end_time - start_time) / 1000.0
    times_normalized = [(time - start_time) / (end_time - start_time) for time, _ in points]
    times_seconds = [(time - start_time) / 1000.0 for time, _ in points]
    values = [(value - start_value) / delta for _, value in points]
    meta = {
        "samples": len(points),
        "startTimeMs": start_time,
        "endTimeMs": end_time,
        "durationMs": end_time - start_time,
        "startValue": start_value,
        "endValue": end_value,
        "overshootRatio": max(0.0, max(values) - 1.0),
    }
    return times_normalized, values, {**meta, "timesSeconds": times_seconds, "durationSeconds": duration_seconds}


def fit_bezier(times: list[float], values: list[float]) -> dict:
    candidates = []
    for name, params in PRESETS.items():
        error = score_function(times, values, lambda time, p=params: bezier_progress(time, p))
        candidates.append({"name": name, "params": list(params), "rmse": error})
    best = min(candidates, key=lambda item: item["rmse"])
    params = list(best["params"])
    best_error = best["rmse"]
    # Bounded coordinate descent gives a useful custom curve without SciPy.
    for step in (0.2, 0.1, 0.05, 0.025, 0.01, 0.005):
        improved = True
        while improved:
            improved = False
            for index in range(4):
                for direction in (-1.0, 1.0):
                    trial = params[:]
                    trial[index] += direction * step
                    if index in (0, 2):
                        trial[index] = min(1.0, max(0.0, trial[index]))
                    else:
                        trial[index] = min(2.0, max(-1.0, trial[index]))
                    trial_params = tuple(trial)
                    error = score_function(times, values, lambda time, p=trial_params: bezier_progress(time, p))
                    if error + 1e-9 < best_error:
                        params, best_error, improved = trial, error, True
    return {
        "type": "tween",
        "easing": f"cubic-bezier({', '.join(f'{value:.4g}' for value in params)})",
        "controlPoints": params,
        "rmse": best_error,
        "closestPreset": best,
        "presetCandidates": sorted(candidates, key=lambda item: item["rmse"]),
    }


def fit_spring(times_seconds: list[float], values: list[float]) -> dict:
    best = {"rmse": float("inf"), "zeta": None, "omega": None}
    zetas = [0.15 + index * 0.05 for index in range(38)]
    omegas = [2.0 + index * 1.0 for index in range(79)]
    for zeta in zetas:
        for omega in omegas:
            error = score_function(times_seconds, values, lambda time, z=zeta, w=omega: spring_progress(time, z, w))
            if error < best["rmse"]:
                best = {"rmse": error, "zeta": zeta, "omega": omega}
    zeta, omega = float(best["zeta"]), float(best["omega"])
    for z_step, w_step in ((0.02, 0.5), (0.01, 0.2), (0.005, 0.1)):
        for z_index in range(-5, 6):
            for w_index in range(-5, 6):
                trial_zeta = max(0.02, zeta + z_index * z_step)
                trial_omega = max(0.1, omega + w_index * w_step)
                error = score_function(times_seconds, values, lambda time, z=trial_zeta, w=trial_omega: spring_progress(time, z, w))
                if error < best["rmse"]:
                    best = {"rmse": error, "zeta": trial_zeta, "omega": trial_omega}
                    zeta, omega = trial_zeta, trial_omega
    mass = 1.0
    stiffness = omega * omega * mass
    damping = 2.0 * zeta * omega * mass
    return {
        "type": "spring",
        "parameterization": "physical",
        "mass": mass,
        "stiffness": stiffness,
        "damping": damping,
        "initialVelocity": 0.0,
        "dampingRatio": zeta,
        "naturalFrequency": omega,
        "rmse": best["rmse"],
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("trace", type=Path, help="CSV with time_ms,value columns")
    parser.add_argument("--out", type=Path, help="Write JSON result to this path")
    args = parser.parse_args()
    try:
        times, values, meta = load_trace(args.trace)
        tween = fit_bezier(times, values)
        spring = fit_spring(meta.pop("timesSeconds"), values)
    except (OSError, ValueError) as error:
        print(f"error: {error}", file=sys.stderr)
        return 2
    candidates = sorted([tween, spring], key=lambda item: item["rmse"])
    winner = candidates[0]
    runner_up = candidates[1]
    relative_gain = (runner_up["rmse"] - winner["rmse"]) / max(runner_up["rmse"], 1e-9)
    if relative_gain < 0.08:
        recommendation = "ambiguous"
        reason = "Candidate errors differ by less than 8%; use interaction semantics and interruption behavior to choose."
    else:
        recommendation = winner["type"]
        reason = f"{winner['type']} reduces RMSE by {relative_gain:.1%} versus the other model."
    result = {
        "source": str(args.trace.resolve()),
        "normalization": meta,
        "candidates": candidates,
        "recommendedModel": recommendation,
        "reason": reason,
        "limitations": [
            "This is a diagnostic fit to one scalar trace, not proof of the original implementation model.",
            "The spring fit assumes a zero-velocity unit step; gesture-release traces require a velocity-aware fit.",
        ],
    }
    output = json.dumps(result, indent=2, ensure_ascii=False) + "\n"
    if args.out:
        args.out.parent.mkdir(parents=True, exist_ok=True)
        args.out.write_text(output, encoding="utf-8")
        print(str(args.out.resolve()))
    else:
        print(output, end="")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
