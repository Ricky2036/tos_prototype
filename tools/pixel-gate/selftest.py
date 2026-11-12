#!/usr/bin/env python3
"""pixel-gate 自测 —— 用合成图验证四个子命令，不需要真机截图。

跑法：
    cd tools/pixel-gate && python3 selftest.py

断言的都是**已知答案**：
  - 同图 diff → Δ 0.00
  - 横移 3px → Δ > 0 且 <= 8
  - 平坦区 probe → 精确等于填入的颜色
  - 墨芯 probe → 接近填入的文字色
  - grid 产出文件且尺寸按 zoom 放大
  - crop + radius 产出 RGBA（四角透明）
"""

from __future__ import annotations

import json
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent
CLI = HERE / "pixel_gate.py"

BG = (247, 247, 247)
CARD = (255, 255, 255)
INK = (0, 0, 0)


def run(*args: str) -> dict:
    """跑一个子命令并解析它的 JSON 输出。"""
    r = subprocess.run(
        [sys.executable, str(CLI), *args],
        capture_output=True, text=True, check=True,
    )
    return json.loads(r.stdout)


def make_reference(path: Path) -> None:
    """造一张 360×788 的假屏幕：底板 + 一张白卡 + 一条标题墨迹。"""
    im = Image.new("RGB", (360, 788), BG)
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([24, 120, 336, 300], radius=16, fill=CARD)
    d.rectangle([24, 312, 336, 368], fill=CARD)
    for i in range(8):  # 标题笔画，保证有墨芯
        d.rectangle([40 + i * 22, 140, 52 + i * 22, 164], fill=INK)
    im.save(path)


def main() -> int:
    failures: list[str] = []

    def check(name: str, cond: bool, detail: str = "") -> None:
        print(f"  {'ok  ' if cond else 'FAIL'} {name}{('  ' + detail) if detail else ''}")
        if not cond:
            failures.append(name)

    with tempfile.TemporaryDirectory() as td:
        tmp = Path(td)
        ref = tmp / "ref.png"
        make_reference(ref)

        print("[grid]")
        g = run("grid", str(ref), "-o", str(tmp / "g.png"), "--zoom", "2", "--minor", "10", "--major", "50")
        out = tmp / "g.png"
        check("产出文件", out.exists(), str(out.name))
        check("zoom 生效", Image.open(out).size == (720, 1576), str(Image.open(out).size))

        print("[probe] 平坦底色")
        p = run("probe", str(ref), "40,60,60,20", "--mode", "flat")
        check("值等于底板色", p.get("value") == "#F7F7F7", str(p.get("value")))
        check("覆盖率高", p.get("coverage", 0) > 0.9, f"{p.get('coverage')}")

        print("[probe] 卡片底色")
        p = run("probe", str(ref), "40,200,60,20", "--mode", "flat")
        check("值等于卡片色", p.get("value") == "#FFFFFF", str(p.get("value")))

        print("[probe] 文字墨芯")
        p = run("probe", str(ref), "40,140,190,24", "--mode", "ink")
        check("墨芯接近黑", p.get("value") == "#000000", str(p.get("value")))
        check("对比度足够", p.get("contrast", 0) > 100, f"{p.get('contrast')}")

        print("[probe] 框错时应自曝（对比度≈0）")
        p = run("probe", str(ref), "40,400,60,20", "--mode", "ink")
        check("对比度接近 0", abs(p.get("contrast", 99)) < 5, f"{p.get('contrast')}")

        print("[diff] 同图")
        d = run("diff", str(ref), str(ref))
        check("Δ = 0", d["mean_delta"] == 0.0, str(d["mean_delta"]))

        print("[diff] 横移 3px")
        shifted = tmp / "shift.png"
        arr = np.asarray(Image.open(ref))
        Image.fromarray(np.roll(arr, 3, axis=1)).save(shifted)
        d = run("diff", str(ref), str(shifted))
        check("Δ > 0", d["mean_delta"] > 0, str(d["mean_delta"]))
        check("Δ 未爆表", d["mean_delta"] < 8, str(d["mean_delta"]))

        print("[diff] 分区")
        regions = tmp / "regions.json"
        regions.write_text(json.dumps({"card": [24, 120, 312, 180], "bg": [0, 0, 360, 100]}))
        d = run("diff", str(ref), str(shifted), "--regions", str(regions))
        check("输出两个区", len(d["regions"]) == 2, str(len(d["regions"])))
        check("按 Δ 降序", d["regions"][0]["mean"] >= d["regions"][1]["mean"])

        print("[crop]")
        c = run("crop", str(ref), "--rect", "0,0,360,788", "--radius", "40", "-o", str(tmp / "c.png"))
        im = Image.open(tmp / "c.png")
        check("输出 RGBA", im.mode == "RGBA", im.mode)
        check("左上角透明", im.getpixel((0, 0))[3] == 0, str(im.getpixel((0, 0))))

    print()
    if failures:
        print(f"FAILED {len(failures)}: {failures}")
        return 1
    print("selftest PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
