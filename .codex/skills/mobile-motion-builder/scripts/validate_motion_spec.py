#!/usr/bin/env python3
"""Validate cross-field invariants in a Motion Spec without third-party packages."""

from __future__ import annotations

import argparse
import json
import math
import re
import sys
from pathlib import Path
from typing import Any


ID_PATTERN = re.compile(r"^[A-Za-z][A-Za-z0-9._-]*$")
MODEL_TYPES = {"tween", "keyframes", "spring", "decay", "gesture-map", "step"}
LEVELS = {f"G{index}-{name}" for index, name in enumerate(["functional", "semantic", "temporal", "motion", "visual", "quality"])}


class Validator:
    def __init__(self) -> None:
        self.errors: list[str] = []
        self.warnings: list[str] = []

    def error(self, path: str, message: str) -> None:
        self.errors.append(f"{path}: {message}")

    def warning(self, path: str, message: str) -> None:
        self.warnings.append(f"{path}: {message}")

    def require_object(self, value: Any, path: str) -> dict:
        if not isinstance(value, dict):
            self.error(path, "must be an object")
            return {}
        return value

    def require_list(self, value: Any, path: str) -> list:
        if not isinstance(value, list):
            self.error(path, "must be an array")
            return []
        return value

    def id_value(self, value: Any, path: str) -> str | None:
        if not isinstance(value, str) or not ID_PATTERN.fullmatch(value):
            self.error(path, "must match ^[A-Za-z][A-Za-z0-9._-]*$")
            return None
        return value

    def non_negative(self, value: Any, path: str) -> None:
        if not isinstance(value, (int, float)) or isinstance(value, bool) or not math.isfinite(value) or value < 0:
            self.error(path, "must be a finite non-negative number")

    def provenance(self, value: Any, path: str) -> None:
        item = self.require_object(value, path)
        if item.get("kind") not in {"observed", "inferred", "chosen"}:
            self.error(path + ".kind", "must be observed, inferred, or chosen")
        confidence = item.get("confidence")
        if not isinstance(confidence, (int, float)) or isinstance(confidence, bool) or not 0 <= confidence <= 1:
            self.error(path + ".confidence", "must be a number from 0 to 1")
        if item.get("kind") in {"inferred", "chosen"} and not item.get("reason"):
            self.warning(path + ".reason", "document why this value is not directly observed")

    def validate(self, document: Any) -> None:
        root = self.require_object(document, "$")
        required = ["schemaVersion", "meta", "context", "elements", "tracks", "accessibility", "acceptance"]
        for key in required:
            if key not in root:
                self.error("$", f"missing required field '{key}'")
        if root.get("schemaVersion") != "motion-spec.v1":
            self.error("$.schemaVersion", "must be 'motion-spec.v1'")

        meta = self.require_object(root.get("meta"), "$.meta")
        if meta.get("targetPlatform") not in {"mobile-web", "ios", "android", "react-native", "flutter", "unspecified"}:
            self.error("$.meta.targetPlatform", "unsupported target platform")
        viewport = self.require_object(meta.get("viewport"), "$.meta.viewport")
        for key in ("width", "height", "devicePixelRatio"):
            value = viewport.get(key)
            if not isinstance(value, (int, float)) or isinstance(value, bool) or value <= 0:
                self.error(f"$.meta.viewport.{key}", "must be greater than zero")
        reference = self.require_object(meta.get("reference"), "$.meta.reference")
        if reference.get("kind") not in {"video", "frame-sequence", "static-image", "description", "generated-ground-truth"}:
            self.error("$.meta.reference.kind", "unsupported reference kind")

        context = self.require_object(root.get("context"), "$.context")
        for key in ("purpose", "effectSummary", "meaningSummary", "initialState", "targetState"):
            if not isinstance(context.get(key), str) or not context[key].strip():
                self.error(f"$.context.{key}", "must be a non-empty string")

        element_ids: set[str] = set()
        parent_links: list[tuple[str, str, str]] = []
        elements = self.require_list(root.get("elements"), "$.elements")
        if not elements:
            self.error("$.elements", "must contain at least one element")
        for index, raw in enumerate(elements):
            path = f"$.elements[{index}]"
            item = self.require_object(raw, path)
            element_id = self.id_value(item.get("id"), path + ".id")
            if element_id:
                if element_id in element_ids:
                    self.error(path + ".id", "duplicate element id")
                element_ids.add(element_id)
            if not isinstance(item.get("role"), str) or not item["role"].strip():
                self.error(path + ".role", "must be a non-empty string")
            parent = item.get("parentId")
            if parent is not None and element_id:
                parent_links.append((element_id, str(parent), path + ".parentId"))
            self.provenance(item.get("provenance"), path + ".provenance")
        for element_id, parent, path in parent_links:
            if parent not in element_ids:
                self.error(path, f"unknown parent element '{parent}'")
            if parent == element_id:
                self.error(path, "an element cannot be its own parent")

        track_ids: set[str] = set()
        tracks = self.require_list(root.get("tracks"), "$.tracks")
        if not tracks:
            self.error("$.tracks", "must contain at least one track")
        for index, raw in enumerate(tracks):
            path = f"$.tracks[{index}]"
            item = self.require_object(raw, path)
            track_id = self.id_value(item.get("id"), path + ".id")
            if track_id:
                if track_id in track_ids:
                    self.error(path + ".id", "duplicate track id")
                track_ids.add(track_id)
            if item.get("elementId") not in element_ids:
                self.error(path + ".elementId", f"unknown element '{item.get('elementId')}'")
            if not isinstance(item.get("property"), str) or not item["property"].strip():
                self.error(path + ".property", "must be a non-empty string")
            timing = self.require_object(item.get("timing"), path + ".timing")
            for key in ("onsetMs", "durationMs"):
                if key not in timing:
                    self.error(path + ".timing", f"missing '{key}'")
                else:
                    self.non_negative(timing[key], path + ".timing." + key)
            for key in ("delayMs", "settlingMs"):
                if key in timing:
                    self.non_negative(timing[key], path + ".timing." + key)
            if isinstance(timing.get("settlingMs"), (int, float)) and isinstance(timing.get("onsetMs"), (int, float)):
                if timing["settlingMs"] < timing["onsetMs"]:
                    self.error(path + ".timing.settlingMs", "cannot be before onsetMs")
            self.model(item.get("model"), path + ".model")
            self.provenance(item.get("provenance"), path + ".provenance")

        coordination = self.require_list(root.get("coordination", []), "$.coordination")
        for index, raw in enumerate(coordination):
            path = f"$.coordination[{index}]"
            item = self.require_object(raw, path)
            ids = self.require_list(item.get("trackIds"), path + ".trackIds")
            if not ids:
                self.error(path + ".trackIds", "must contain at least one track")
            for track_id in ids:
                if track_id not in track_ids:
                    self.error(path + ".trackIds", f"unknown track '{track_id}'")

        interaction = self.require_object(root.get("interaction", {}), "$.interaction")
        if "inputTargetElementId" in interaction and interaction["inputTargetElementId"] not in element_ids:
            self.error("$.interaction.inputTargetElementId", "must reference an existing element")

        accessibility = self.require_object(root.get("accessibility"), "$.accessibility")
        if accessibility.get("reducedMotion") not in {"none", "shorten", "remove", "replace-with-fade", "custom"}:
            self.error("$.accessibility.reducedMotion", "unsupported reduced-motion behavior")
        if accessibility.get("informationEquivalent") is not True:
            self.error("$.accessibility.informationEquivalent", "must be true")
        if accessibility.get("reducedMotion") == "custom" and not accessibility.get("customBehavior"):
            self.error("$.accessibility.customBehavior", "is required for custom reduced motion")

        acceptance = self.require_object(root.get("acceptance"), "$.acceptance")
        metrics = self.require_list(acceptance.get("metrics"), "$.acceptance.metrics")
        metric_ids: set[str] = set()
        levels: set[str] = set()
        for index, raw in enumerate(metrics):
            path = f"$.acceptance.metrics[{index}]"
            item = self.require_object(raw, path)
            metric_id = self.id_value(item.get("id"), path + ".id")
            if metric_id:
                if metric_id in metric_ids:
                    self.error(path + ".id", "duplicate metric id")
                metric_ids.add(metric_id)
            level = item.get("level")
            if level not in LEVELS:
                self.error(path + ".level", "must be one of G0-functional through G5-quality")
            else:
                levels.add(level)
            if not isinstance(item.get("method"), str) or not item["method"].strip():
                self.error(path + ".method", "must be a non-empty string")
            if not isinstance(item.get("hardGate"), bool):
                self.error(path + ".hardGate", "must be boolean")
        for required_level in ("G0-functional", "G1-semantic"):
            if required_level not in levels:
                self.warning("$.acceptance.metrics", f"no {required_level} metric is defined")
        iterations = acceptance.get("maxAutomaticIterations")
        if not isinstance(iterations, int) or isinstance(iterations, bool) or not 0 <= iterations <= 20:
            self.error("$.acceptance.maxAutomaticIterations", "must be an integer from 0 to 20")
        self.non_negative(acceptance.get("minimumImprovement"), "$.acceptance.minimumImprovement")
        if not isinstance(acceptance.get("stopOnHardGateFailure"), bool):
            self.error("$.acceptance.stopOnHardGateFailure", "must be boolean")

    def model(self, value: Any, path: str) -> None:
        model = self.require_object(value, path)
        model_type = model.get("type")
        if model_type not in MODEL_TYPES:
            self.error(path + ".type", f"must be one of {sorted(MODEL_TYPES)}")
            return
        if model_type == "tween" and not isinstance(model.get("easing"), str):
            self.error(path + ".easing", "is required for a tween")
        elif model_type == "keyframes":
            frames = self.require_list(model.get("keyframes"), path + ".keyframes")
            offsets = []
            for index, frame in enumerate(frames):
                item = self.require_object(frame, f"{path}.keyframes[{index}]")
                offset = item.get("offset")
                if not isinstance(offset, (int, float)) or isinstance(offset, bool) or not 0 <= offset <= 1:
                    self.error(f"{path}.keyframes[{index}].offset", "must be from 0 to 1")
                else:
                    offsets.append(offset)
            if len(frames) < 2:
                self.error(path + ".keyframes", "must contain at least two keyframes")
            if offsets != sorted(offsets) or len(offsets) != len(set(offsets)):
                self.error(path + ".keyframes", "offsets must be strictly increasing")
            if offsets and (offsets[0] != 0 or offsets[-1] != 1):
                self.warning(path + ".keyframes", "consider explicit keyframes at offsets 0 and 1")
        elif model_type == "spring":
            parameterization = model.get("parameterization")
            if parameterization == "physical":
                for key in ("mass", "stiffness"):
                    value = model.get(key)
                    if not isinstance(value, (int, float)) or isinstance(value, bool) or value <= 0:
                        self.error(path + "." + key, "must be greater than zero for a physical spring")
                damping = model.get("damping")
                if not isinstance(damping, (int, float)) or isinstance(damping, bool) or damping < 0:
                    self.error(path + ".damping", "must be non-negative for a physical spring")
            elif parameterization == "perceptual":
                duration = model.get("durationMs")
                bounce = model.get("bounce")
                if not isinstance(duration, (int, float)) or duration <= 0:
                    self.error(path + ".durationMs", "must be greater than zero for a perceptual spring")
                if not isinstance(bounce, (int, float)) or not 0 <= bounce <= 1:
                    self.error(path + ".bounce", "must be from 0 to 1 for a perceptual spring")
            else:
                self.error(path + ".parameterization", "must be physical or perceptual")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("spec", type=Path)
    parser.add_argument("--json", action="store_true", help="Emit machine-readable result")
    args = parser.parse_args()
    try:
        document = json.loads(args.spec.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        print(f"error: {error}", file=sys.stderr)
        return 2
    validator = Validator()
    validator.validate(document)
    result = {"valid": not validator.errors, "errors": validator.errors, "warnings": validator.warnings}
    if args.json:
        print(json.dumps(result, indent=2, ensure_ascii=False))
    else:
        for message in validator.errors:
            print("ERROR", message)
        for message in validator.warnings:
            print("WARN ", message)
        print(f"{'VALID' if result['valid'] else 'INVALID'}: {len(validator.errors)} error(s), {len(validator.warnings)} warning(s)")
    return 0 if result["valid"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
