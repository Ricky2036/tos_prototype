#!/usr/bin/env python3
"""Inspect a motion reference and emit reusable temporal/visual evidence."""

from __future__ import annotations

import argparse
import csv
import json
import sys
from pathlib import Path

from motion_video import (
    detect_motion_region,
    evenly_spaced,
    ffmpeg_contact_sheet,
    ffmpeg_motion_trail,
    motion_energy,
    parse_roi,
    probe_video,
)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path, help="MP4/MOV/WebM/GIF reference")
    parser.add_argument("--outdir", type=Path, required=True, help="Directory for analysis artifacts")
    parser.add_argument("--roi", help="Optional pixel ROI as x,y,width,height")
    parser.add_argument("--samples", type=int, default=9, help="Contact-sheet frame count (default: 9)")
    return parser


def main() -> int:
    args = build_parser().parse_args()
    source = args.input.expanduser().resolve()
    if not source.is_file():
        print(f"error: input does not exist: {source}", file=sys.stderr)
        return 2
    if args.samples < 2 or args.samples > 30:
        print("error: --samples must be between 2 and 30", file=sys.stderr)
        return 2
    outdir = args.outdir.expanduser().resolve()
    outdir.mkdir(parents=True, exist_ok=True)
    try:
        metadata = probe_video(source)
        roi = parse_roi(args.roi, metadata["width"], metadata["height"])
        energies = motion_energy(source, metadata, roi)
        motion = detect_motion_region(energies)
        times = evenly_spaced(motion["onsetMs"], motion["settleMs"], args.samples)
        ffmpeg_contact_sheet(source, outdir / "contact-sheet.png", times)
        ffmpeg_motion_trail(source, outdir / "motion-trail.png", motion["onsetMs"], motion["settleMs"])
    except Exception as error:
        print(f"error: {error}", file=sys.stderr)
        return 1

    with (outdir / "motion-energy.csv").open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=["frame", "timeMs", "energy"])
        writer.writeheader()
        writer.writerows(energies)
    report = {
        "tool": "mobile-motion-builder/inspect_reference.py",
        "source": metadata,
        "analysis": {
            "roiPx": list(roi) if roi else None,
            "motion": motion,
            "sampleTimesMs": [round(value, 3) for value in times],
            "limitations": [
                "Motion onset and settle are pixel-difference estimates, not semantic event labels.",
                "Global camera, cursor, clock, or background movement can dominate unless excluded with --roi.",
                "Easing and spring parameters are not directly observed by this analysis.",
            ],
        },
        "artifacts": {
            "energyCsv": "motion-energy.csv",
            "contactSheet": "contact-sheet.png",
            "motionTrail": "motion-trail.png",
        },
    }
    (outdir / "reference.json").write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({
        "outdir": str(outdir),
        "onsetMs": motion["onsetMs"],
        "settleMs": motion["settleMs"],
        "peakEnergy": motion["peakEnergy"],
    }, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
