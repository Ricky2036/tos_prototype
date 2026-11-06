#!/usr/bin/env python3
"""Small ffmpeg-backed utilities shared by motion analysis scripts."""

from __future__ import annotations

import json
import math
import shutil
import statistics
import subprocess
from pathlib import Path
from typing import Iterable


def require_binary(name: str) -> str:
    path = shutil.which(name)
    if not path:
        raise RuntimeError(f"Required binary '{name}' was not found on PATH.")
    return path


def run(command: list[str], *, capture_stdout: bool = True) -> subprocess.CompletedProcess:
    result = subprocess.run(
        command,
        check=False,
        stdout=subprocess.PIPE if capture_stdout else None,
        stderr=subprocess.PIPE,
    )
    if result.returncode:
        stderr = result.stderr.decode("utf-8", errors="replace").strip()
        raise RuntimeError(f"Command failed ({result.returncode}): {' '.join(command[:4])}\n{stderr}")
    return result


def parse_rate(value: str | None) -> float:
    if not value or value in {"0/0", "N/A"}:
        return 0.0
    if "/" in value:
        a, b = value.split("/", 1)
        return float(a) / float(b) if float(b) else 0.0
    return float(value)


def probe_video(path: Path) -> dict:
    ffprobe = require_binary("ffprobe")
    result = run([
        ffprobe,
        "-v", "error",
        "-select_streams", "v:0",
        "-show_entries",
        "stream=width,height,avg_frame_rate,r_frame_rate,time_base,duration,nb_frames,pix_fmt:stream_tags=rotate:format=duration,size,bit_rate,format_name",
        "-of", "json",
        str(path),
    ])
    raw = json.loads(result.stdout)
    streams = raw.get("streams", [])
    if not streams:
        raise RuntimeError(f"No video stream found in {path}")
    stream = streams[0]
    fmt = raw.get("format", {})
    duration = float(stream.get("duration") or fmt.get("duration") or 0.0)
    return {
        "path": str(path.resolve()),
        "width": int(stream["width"]),
        "height": int(stream["height"]),
        "avgFps": parse_rate(stream.get("avg_frame_rate")),
        "realFps": parse_rate(stream.get("r_frame_rate")),
        "timeBase": stream.get("time_base"),
        "durationMs": round(duration * 1000.0, 3),
        "frameCount": int(stream["nb_frames"]) if str(stream.get("nb_frames", "")).isdigit() else None,
        "pixelFormat": stream.get("pix_fmt"),
        "rotation": int((stream.get("tags") or {}).get("rotate", 0)),
        "container": fmt.get("format_name"),
        "sizeBytes": int(fmt["size"]) if str(fmt.get("size", "")).isdigit() else None,
        "bitRate": int(fmt["bit_rate"]) if str(fmt.get("bit_rate", "")).isdigit() else None,
    }


def parse_roi(value: str | None, width: int, height: int) -> tuple[int, int, int, int] | None:
    if value is None:
        return None
    parts = [int(float(part.strip())) for part in value.split(",")]
    if len(parts) != 4:
        raise ValueError("ROI must be x,y,width,height")
    x, y, w, h = parts
    if w <= 0 or h <= 0 or x < 0 or y < 0 or x + w > width or y + h > height:
        raise ValueError(f"ROI {parts} is outside the {width}x{height} video.")
    return x, y, w, h


def _analysis_size(width: int, height: int, max_width: int = 160) -> tuple[int, int]:
    if width <= max_width:
        out_width = width
        out_height = height
    else:
        out_width = max_width
        out_height = round(height * max_width / width)
    out_width = max(2, out_width - out_width % 2)
    out_height = max(2, out_height - out_height % 2)
    return out_width, out_height


def motion_energy(path: Path, metadata: dict, roi: tuple[int, int, int, int] | None = None) -> list[dict]:
    """Decode a small grayscale stream and compute mean absolute frame differences."""
    ffmpeg = require_binary("ffmpeg")
    source_width = roi[2] if roi else metadata["width"]
    source_height = roi[3] if roi else metadata["height"]
    width, height = _analysis_size(source_width, source_height)
    filters: list[str] = []
    if roi:
        x, y, w, h = roi
        filters.append(f"crop={w}:{h}:{x}:{y}")
    filters.extend([f"scale={width}:{height}:flags=area", "format=gray"])
    result = run([
        ffmpeg, "-v", "error", "-i", str(path),
        "-map", "0:v:0", "-an", "-sn", "-dn",
        "-vf", ",".join(filters),
        "-f", "rawvideo", "-pix_fmt", "gray", "-",
    ])
    frame_size = width * height
    raw = result.stdout
    frame_count = len(raw) // frame_size
    if frame_count < 2:
        raise RuntimeError("The video did not contain enough decodable frames.")
    fps = metadata["avgFps"] or metadata["realFps"] or 30.0
    energies = [{"frame": 0, "timeMs": 0.0, "energy": 0.0}]
    previous = raw[:frame_size]
    for index in range(1, frame_count):
        current = raw[index * frame_size:(index + 1) * frame_size]
        total = sum(abs(a - b) for a, b in zip(current, previous))
        energies.append({
            "frame": index,
            "timeMs": round(index * 1000.0 / fps, 3),
            "energy": total / (frame_size * 255.0),
        })
        previous = current
    return energies


def detect_motion_region(energies: list[dict]) -> dict:
    values = [float(row["energy"]) for row in energies[1:]]
    if not values:
        return {"threshold": 0.0, "onsetMs": 0.0, "settleMs": 0.0, "activeFrameCount": 0}
    baseline_count = max(3, min(len(values), round(len(values) * 0.2)))
    # Use the quietest portion rather than assuming the clip starts at rest.
    baseline = sorted(values)[:baseline_count]
    median = statistics.median(baseline)
    mad = statistics.median(abs(value - median) for value in baseline)
    threshold = max(0.002, median + 6.0 * mad)
    active = [index + 1 for index, value in enumerate(values) if value > threshold]
    if not active:
        peak_index = max(range(len(values)), key=values.__getitem__) + 1
        active = [peak_index]
    # Bridge one-frame gaps; require two quiet frames before declaring settled.
    onset = active[0]
    settle = active[-1]
    for index in range(onset, len(energies) - 2):
        if energies[index]["energy"] <= threshold and energies[index + 1]["energy"] <= threshold:
            if any(row["energy"] > threshold for row in energies[index + 2:]):
                continue
            settle = index
            break
    return {
        "threshold": round(threshold, 8),
        "baselineMedian": round(median, 8),
        "baselineMad": round(mad, 8),
        "onsetFrame": onset,
        "onsetMs": energies[onset]["timeMs"],
        "settleFrame": settle,
        "settleMs": energies[settle]["timeMs"],
        "activeFrameCount": len(active),
        "peakEnergy": round(max(values), 8),
    }


def evenly_spaced(start_ms: float, end_ms: float, count: int) -> list[float]:
    if count <= 1 or end_ms <= start_ms:
        return [start_ms]
    return [start_ms + (end_ms - start_ms) * index / (count - 1) for index in range(count)]


def ffmpeg_contact_sheet(path: Path, output: Path, times_ms: Iterable[float], *, width: int = 220) -> None:
    ffmpeg = require_binary("ffmpeg")
    times = list(times_ms)
    if not times:
        return
    inputs: list[str] = []
    filters: list[str] = []
    labels: list[str] = []
    for index, time_ms in enumerate(times):
        inputs.extend(["-ss", f"{max(0.0, time_ms) / 1000.0:.6f}", "-i", str(path)])
        label = f"v{index}"
        # Keep this compatible with minimal ffmpeg builds that omit drawtext.
        # Exact timestamps are recorded in reference.json/comparison.json.
        filters.append(f"[{index}:v]scale={width}:-2:flags=lanczos[{label}]")
        labels.append(f"[{label}]")
    if len(times) == 1:
        filters.append(f"{labels[0]}null[out]")
    else:
        columns = min(3, len(times))
        filters.append("".join(labels) + f"xstack=inputs={len(times)}:layout=" + _xstack_layout(len(times), columns, width) + "[out]")
    command = [ffmpeg, "-y", "-v", "error", *inputs, "-filter_complex", ";".join(filters), "-map", "[out]", "-frames:v", "1", str(output)]
    run(command, capture_stdout=False)


def _xstack_layout(count: int, columns: int, width: int) -> str:
    # xstack can use previous input dimensions, avoiding a guessed scaled height.
    layout = []
    for index in range(count):
        col = index % columns
        row = index // columns
        x = "0" if col == 0 else "+".join(f"w{i}" for i in range(col))
        y = "0" if row == 0 else "+".join(f"h{i * columns}" for i in range(row))
        layout.append(f"{x}_{y}")
    return "|".join(layout)


def ffmpeg_motion_trail(path: Path, output: Path, start_ms: float, end_ms: float) -> None:
    ffmpeg = require_binary("ffmpeg")
    duration = max(0.05, (end_ms - start_ms) / 1000.0)
    run([
        ffmpeg, "-y", "-v", "error",
        "-ss", f"{max(0.0, start_ms) / 1000.0:.6f}",
        "-t", f"{duration:.6f}",
        "-i", str(path),
        "-vf", "fps=12,scale=480:-2:flags=area,tmix=frames=8:weights='1 1 1 1 1 1 1 1'",
        "-frames:v", "1", str(output),
    ], capture_stdout=False)


def resample_curve(rows: list[dict], onset_ms: float, settle_ms: float, points: int = 101) -> list[float]:
    window = [row for row in rows if onset_ms <= float(row["timeMs"]) <= settle_ms]
    if len(window) < 2:
        window = rows
    if len(window) < 2:
        return [0.0] * points
    times = [float(row["timeMs"]) for row in window]
    values = [float(row["energy"]) for row in window]
    start, end = times[0], times[-1]
    peak = max(values) or 1.0
    output: list[float] = []
    cursor = 0
    for index in range(points):
        target = start + (end - start) * index / (points - 1)
        while cursor + 1 < len(times) and times[cursor + 1] < target:
            cursor += 1
        if cursor + 1 >= len(times) or times[cursor + 1] == times[cursor]:
            value = values[cursor]
        else:
            ratio = (target - times[cursor]) / (times[cursor + 1] - times[cursor])
            value = values[cursor] + (values[cursor + 1] - values[cursor]) * ratio
        output.append(value / peak)
    return output
