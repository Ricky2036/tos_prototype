#!/usr/bin/env python3
"""Compare reference and candidate motion with aligned temporal and visual metrics."""

from __future__ import annotations

import argparse
import json
import math
import re
import sys
from pathlib import Path

from motion_video import (
    detect_motion_region,
    evenly_spaced,
    ffmpeg_contact_sheet,
    motion_energy,
    parse_roi,
    probe_video,
    require_binary,
    resample_curve,
    run,
)


SSIM_PATTERN = re.compile(r"All:([0-9.eE+-]+)")


def curve_rmse(first: list[float], second: list[float]) -> float:
    return math.sqrt(sum((a - b) ** 2 for a, b in zip(first, second)) / len(first))


def visual_ssim(
    reference: Path,
    candidate: Path,
    reference_meta: dict,
    reference_motion: dict,
    candidate_motion: dict,
) -> tuple[float | None, str | None]:
    common_duration_ms = min(
        reference_motion["settleMs"] - reference_motion["onsetMs"],
        candidate_motion["settleMs"] - candidate_motion["onsetMs"],
    )
    if common_duration_ms <= 0:
        return None, "No positive aligned motion window was detected."
    fps = min(60.0, reference_meta["avgFps"] or reference_meta["realFps"] or 30.0)
    width, height = reference_meta["width"], reference_meta["height"]
    filter_graph = (
        f"[0:v]trim=start={reference_motion['onsetMs']/1000:.6f}:duration={common_duration_ms/1000:.6f},"
        f"setpts=PTS-STARTPTS,fps={fps:.6f},scale={width}:{height}:flags=bicubic,format=yuv420p[r];"
        f"[1:v]trim=start={candidate_motion['onsetMs']/1000:.6f}:duration={common_duration_ms/1000:.6f},"
        f"setpts=PTS-STARTPTS,fps={fps:.6f},scale={width}:{height}:flags=bicubic,format=yuv420p[c];"
        "[r][c]ssim"
    )
    ffmpeg = require_binary("ffmpeg")
    try:
        result = run([
            ffmpeg, "-v", "info", "-i", str(reference), "-i", str(candidate),
            "-filter_complex", filter_graph, "-an", "-f", "null", "-",
        ])
    except Exception as error:
        return None, str(error)
    matches = SSIM_PATTERN.findall(result.stderr.decode("utf-8", errors="replace"))
    return (float(matches[-1]), None) if matches else (None, "ffmpeg did not report an SSIM score")


def grade_temporal(onset_delta: float, duration_delta_ratio: float, energy_rmse: float) -> str:
    if onset_delta <= 33 and duration_delta_ratio <= 0.08 and energy_rmse <= 0.15:
        return "pass"
    if onset_delta <= 66 and duration_delta_ratio <= 0.16 and energy_rmse <= 0.25:
        return "partial"
    return "fail"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("reference", type=Path)
    parser.add_argument("candidate", type=Path)
    parser.add_argument("--outdir", type=Path, required=True)
    parser.add_argument("--reference-roi", help="x,y,width,height in reference pixels")
    parser.add_argument("--candidate-roi", help="x,y,width,height in candidate pixels")
    args = parser.parse_args()
    reference = args.reference.expanduser().resolve()
    candidate = args.candidate.expanduser().resolve()
    if not reference.is_file() or not candidate.is_file():
        print("error: reference and candidate must both be files", file=sys.stderr)
        return 2
    outdir = args.outdir.expanduser().resolve()
    outdir.mkdir(parents=True, exist_ok=True)
    try:
        reference_meta = probe_video(reference)
        candidate_meta = probe_video(candidate)
        reference_roi = parse_roi(args.reference_roi, reference_meta["width"], reference_meta["height"])
        candidate_roi = parse_roi(args.candidate_roi, candidate_meta["width"], candidate_meta["height"])
        reference_energy = motion_energy(reference, reference_meta, reference_roi)
        candidate_energy = motion_energy(candidate, candidate_meta, candidate_roi)
        reference_motion = detect_motion_region(reference_energy)
        candidate_motion = detect_motion_region(candidate_energy)
        reference_curve = resample_curve(reference_energy, reference_motion["onsetMs"], reference_motion["settleMs"])
        candidate_curve = resample_curve(candidate_energy, candidate_motion["onsetMs"], candidate_motion["settleMs"])
        energy_error = curve_rmse(reference_curve, candidate_curve)
        ssim, ssim_error = visual_ssim(reference, candidate, reference_meta, reference_motion, candidate_motion)
        ffmpeg_contact_sheet(
            reference,
            outdir / "reference-contact-sheet.png",
            evenly_spaced(reference_motion["onsetMs"], reference_motion["settleMs"], 6),
            width=180,
        )
        ffmpeg_contact_sheet(
            candidate,
            outdir / "candidate-contact-sheet.png",
            evenly_spaced(candidate_motion["onsetMs"], candidate_motion["settleMs"], 6),
            width=180,
        )
    except Exception as error:
        print(f"error: {error}", file=sys.stderr)
        return 1

    reference_duration = max(0.0, reference_motion["settleMs"] - reference_motion["onsetMs"])
    candidate_duration = max(0.0, candidate_motion["settleMs"] - candidate_motion["onsetMs"])
    duration_delta = candidate_duration - reference_duration
    duration_delta_ratio = abs(duration_delta) / max(reference_duration, 1.0)
    onset_delta = abs(candidate_motion["onsetMs"] - reference_motion["onsetMs"])
    report = {
        "tool": "mobile-motion-builder/compare_motion.py",
        "alignment": "Each clip is aligned to its estimated first-motion frame; curves are resampled over each estimated active window.",
        "reference": {"metadata": reference_meta, "motion": reference_motion, "roiPx": list(reference_roi) if reference_roi else None},
        "candidate": {"metadata": candidate_meta, "motion": candidate_motion, "roiPx": list(candidate_roi) if candidate_roi else None},
        "metrics": {
            "onsetDeltaMs": round(onset_delta, 3),
            "referenceActiveDurationMs": round(reference_duration, 3),
            "candidateActiveDurationMs": round(candidate_duration, 3),
            "activeDurationDeltaMs": round(duration_delta, 3),
            "activeDurationDeltaRatio": round(duration_delta_ratio, 6),
            "normalizedMotionEnergyRmse": round(energy_error, 6),
            "alignedVideoSsim": round(ssim, 6) if ssim is not None else None,
        },
        "gates": {
            "G2-temporal": grade_temporal(onset_delta, duration_delta_ratio, energy_error),
            "G4-visual": "informational" if ssim is not None else "unavailable",
        },
        "warnings": ([ssim_error] if ssim_error else []) + [
            "This script cannot determine G0 functional or G1 semantic correctness; test those before interpreting pixel metrics.",
            "Global motion energy is not an element trajectory. Use ROIs or element tracking for G3 motion judgments.",
            "SSIM is sensitive to fonts, capture pipelines, viewport crops, and unrelated pixels.",
        ],
        "artifacts": {
            "referenceContactSheet": "reference-contact-sheet.png",
            "candidateContactSheet": "candidate-contact-sheet.png",
        },
    }
    (outdir / "comparison.json").write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({"outdir": str(outdir), **report["metrics"], **report["gates"]}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
