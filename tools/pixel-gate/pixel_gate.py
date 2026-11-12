#!/usr/bin/env python3
"""pixel-gate — 把"像不像"变成一张表。

四个子命令，对应 sp-clone-prototype 的 Phase 1/3/4：

  grid    把网格画到参考图上，先看带格子的图再测量
  probe   区域色值普查（flat / ink / edge 三种策略）
  crop    从整窗截图里裁出手机屏并缩放到参考 scale
  diff    逐区域 Δ 表，输出最差 band 排序

依赖：Pillow + numpy（本机已有，不引新依赖）
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

# ---------------------------------------------------------------- 颜色工具


def _lum(rgb: np.ndarray) -> np.ndarray:
    """感知亮度，0-255。"""
    return 0.2126 * rgb[..., 0] + 0.7152 * rgb[..., 1] + 0.0722 * rgb[..., 2]


def _hex(rgb) -> str:
    return "#{:02X}{:02X}{:02X}".format(*(int(round(c)) for c in rgb[:3]))


def _rgb(hexstr: str) -> tuple[int, int, int]:
    s = hexstr.lstrip("#")
    return tuple(int(s[i : i + 2], 16) for i in (0, 2, 4))


def _top_colors(arr: np.ndarray, k: int = 5) -> list[tuple[str, int, float]]:
    """返回 [(hex, count, share)]，按出现次数降序。"""
    flat = arr.reshape(-1, arr.shape[-1])[:, :3]
    uniq, counts = np.unique(flat, axis=0, return_counts=True)
    order = np.argsort(-counts)[:k]
    total = flat.shape[0]
    return [(_hex(uniq[i]), int(counts[i]), counts[i] / total) for i in order]


# ---------------------------------------------------------------- 采样策略


def sample_flat(arr: np.ndarray) -> dict:
    """底色：只认"和四邻同色"的像素，排除抗锯齿边缘。"""
    rgb = arr[..., :3].astype(np.int16)
    inner = rgb[1:-1, 1:-1]
    up, dn = rgb[:-2, 1:-1], rgb[2:, 1:-1]
    lf, rt = rgb[1:-1, :-2], rgb[1:-1, 2:]
    flat = (
        np.all(inner == up, axis=-1)
        & np.all(inner == dn, axis=-1)
        & np.all(inner == lf, axis=-1)
        & np.all(inner == rt, axis=-1)
    )
    if flat.sum() == 0:
        return {"mode": "flat", "error": "区域太小，没有平坦内部（改用 auto）"}
    px = inner[flat]
    uniq, counts = np.unique(px, axis=0, return_counts=True)
    best = uniq[np.argmax(counts)]
    return {
        "mode": "flat",
        "value": _hex(best),
        "coverage": float(flat.mean()),
        "candidates": [{"hex": _hex(u), "share": float(c / flat.sum())}
                       for u, c in zip(uniq[np.argsort(-counts)][:3],
                                       np.sort(counts)[::-1][:3])],
    }


def sample_ink(arr: np.ndarray, pct: float = 3.0) -> dict:
    """文字：取最暗的 pct%，它的中位数就是墨芯。"""
    flat = arr.reshape(-1, arr.shape[-1])[:, :3]
    lum = _lum(flat.astype(np.float32))
    thresh = np.percentile(lum, pct)
    core = flat[lum <= thresh]
    value = np.median(core, axis=0)
    bg = np.median(flat[lum >= np.percentile(lum, 90)], axis=0)
    contrast = float(_lum(np.array([bg], dtype=np.float32))[0] - _lum(np.array([value], dtype=np.float32))[0])
    return {
        "mode": "ink",
        "value": _hex(value),
        "background": _hex(bg),
        "contrast": round(contrast, 1),
        "core_px": int(core.shape[0]),
    }


def sample_edge(arr: np.ndarray) -> dict:
    """1pt 分隔线 / 描边：沿最暗的一行/列找 ink deficit。

    返回"线中心色"和"相对底色的覆盖率"，用来反解一个永远到不了
    满覆盖的发丝线。
    """
    lum = _lum(arr[..., :3].astype(np.float32))
    row_mean = lum.mean(axis=1)
    col_mean = lum.mean(axis=0)
    bg = float(np.percentile(lum, 90))
    if row_mean.min() < col_mean.min():
        idx = int(np.argmin(row_mean))
        profile = row_mean
        axis = "row"
    else:
        idx = int(np.argmin(col_mean))
        profile = col_mean
        axis = "col"
    dark = float(profile[idx])
    deficit = (bg - dark) / max(bg, 1e-6)
    line_px = arr[idx] if axis == "row" else arr[:, idx]
    return {
        "mode": "edge",
        "axis": axis,
        "index": idx,
        "value": _hex(np.median(line_px[:, :3], axis=0)),
        "background": round(bg, 1),
        "darkest": round(dark, 1),
        "deficit": round(deficit, 4),
    }


def probe(img: Image.Image, box: tuple[int, int, int, int], mode: str,
          scale: float = 1.0) -> dict:
    """box 用设计 pt 传入；scale = capture px / design pt。"""
    arr = np.asarray(img.convert("RGB"))
    x, y, w, h = (int(round(v * scale)) for v in box)
    x0, y0 = max(x, 0), max(y, 0)
    x1, y1 = min(x + w, arr.shape[1]), min(y + h, arr.shape[0])
    if x1 <= x0 or y1 <= y0:
        return {"error": f"box 越界: {box}"}
    sub = arr[y0:y1, x0:x1]
    out = {"box": [x0, y0, x1 - x0, y1 - y0], "size": sub.shape[1::-1]}
    if mode == "flat":
        out.update(sample_flat(sub))
    elif mode == "ink":
        out.update(sample_ink(sub))
    elif mode == "edge":
        out.update(sample_edge(sub))
    else:  # auto
        f = sample_flat(sub)
        if f.get("coverage", 0) >= 0.35:
            out.update(f)
        else:
            ink = sample_ink(sub)
            out.update(ink if ink["contrast"] > 40 else sample_flat(sub))
    out["top"] = [{"hex": h, "share": round(s, 3)} for h, _, s in _top_colors(sub, 4)]
    return out


# ---------------------------------------------------------------- 子命令


def cmd_grid(args) -> int:
    img = Image.open(args.input).convert("RGB")
    if args.scale and args.scale != 1.0:
        img = img.resize(
            (int(img.width / args.scale), int(img.height / args.scale)), Image.LANCZOS
        )
    zoom = max(1, args.zoom)
    out = img.resize((img.width * zoom, img.height * zoom), Image.NEAREST)
    d = ImageDraw.Draw(out, "RGBA")
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Menlo.ttc", 11 * zoom)
    except OSError:
        font = ImageFont.load_default()

    for x in range(0, img.width, args.minor):
        px = x * zoom
        major = x % args.major == 0
        d.line([(px, 0), (px, out.height)],
               fill=(255, 0, 0, 150) if major else (0, 200, 255, 70),
               width=2 * zoom if major else 1)
        if major:
            d.text((px + 2 * zoom, 2 * zoom), str(x), font=font, fill=(255, 0, 0, 255))
    for y in range(0, img.height, args.minor):
        py = y * zoom
        major = y % args.major == 0
        d.line([(0, py), (out.width, py)],
               fill=(255, 0, 0, 150) if major else (0, 200, 255, 70),
               width=2 * zoom if major else 1)
        if major:
            d.text((2 * zoom, py + 1 * zoom), str(y), font=font, fill=(255, 0, 0, 255))

    out.save(args.output)
    print(json.dumps({
        "output": str(args.output),
        "design_size": [img.width, img.height],
        "zoom": zoom,
        "minor": args.minor, "major": args.major,
    }, ensure_ascii=False, indent=2))
    return 0


def cmd_probe(args) -> int:
    img = Image.open(args.input)
    box = tuple(int(v) for v in args.box.split(","))
    if len(box) != 4:
        print("box 需要 x,y,w,h", file=sys.stderr)
        return 2
    result = probe(img, box, args.mode, args.scale)
    result["input"] = str(args.input)
    result["scale"] = args.scale
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


def cmd_crop(args) -> int:
    """裁屏：从整窗截图里切出设备屏，再缩放到参考 scale。"""
    img = Image.open(args.input)
    box = tuple(int(v) for v in args.rect.split(","))
    x, y, w, h = box
    phone = img.crop((x, y, x + w, y + h))

    if args.radius:
        # 圆角遮罩，避免四角黑楔子污染 Δ
        r = args.radius
        mask = Image.new("L", phone.size, 0)
        ImageDraw.Draw(mask).rounded_rectangle([0, 0, phone.width, phone.height],
                                               radius=r, fill=255)
        out = Image.new("RGBA", phone.size, (0, 0, 0, 0))
        out.paste(phone.convert("RGBA"), (0, 0), mask)
        phone = out

    if args.to:
        tw, th = (int(v) for v in args.to.split("x"))
        phone = phone.resize((tw, th), Image.LANCZOS)

    phone.save(args.output)
    print(json.dumps({
        "output": str(args.output),
        "from": list(box),
        "to": list(phone.size),
        "resampled": bool(args.to),
    }, ensure_ascii=False, indent=2))
    return 0


def cmd_diff(args) -> int:
    ref = Image.open(args.reference).convert("RGB")
    mine = Image.open(args.mine).convert("RGB")
    if mine.size != ref.size:
        mine = mine.resize(ref.size, Image.LANCZOS)

    a = np.asarray(ref, dtype=np.float32)
    b = np.asarray(mine, dtype=np.float32)
    delta = np.abs(a - b).mean(axis=-1)  # 每像素 0-255 的平均通道差

    regions = {}
    if args.regions:
        regions = json.loads(Path(args.regions).read_text(encoding="utf-8"))

    report = {"reference": str(args.reference), "mine": str(args.mine),
              "size": list(ref.size), "mean_delta": round(float(delta.mean()), 2),
              "p95_delta": round(float(np.percentile(delta, 95)), 2),
              "max_delta": round(float(delta.max()), 2), "regions": []}

    for name, (x, y, w, h) in regions.items():
        x0, y0 = max(x, 0), max(y, 0)
        x1, y1 = min(x + w, delta.shape[1]), min(y + h, delta.shape[0])
        if x1 <= x0 or y1 <= y0:
            continue
        sub = delta[y0:y1, x0:x1]
        report["regions"].append({
            "name": name,
            "box": [x0, y0, x1 - x0, y1 - y0],
            "mean": round(float(sub.mean()), 2),
            "max": round(float(sub.max()), 1),
            "pct_over_8": round(float((sub > 8).mean() * 100), 1),
        })

    if not regions:
        # 没有区域定义时，按 32px 横条排名，找出最不吻合的带
        bands = []
        for y in range(0, delta.shape[0], 32):
            sub = delta[y : y + 32]
            bands.append({"y": y, "mean": round(float(sub.mean()), 2)})
        report["worst_bands"] = sorted(bands, key=lambda b: -b["mean"])[:8]

    report["regions"].sort(key=lambda r: -r["mean"])

    if args.output:
        vis = np.clip(delta * 4, 0, 255).astype(np.uint8)
        Image.fromarray(vis, "L").save(args.output)
        report["heatmap"] = str(args.output)

    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)

    g = sub.add_parser("grid", help="把网格画到参考图上")
    g.add_argument("input", type=Path)
    g.add_argument("-o", "--output", type=Path, required=True)
    g.add_argument("--minor", type=int, default=10)
    g.add_argument("--major", type=int, default=50)
    g.add_argument("--zoom", type=int, default=2)
    g.add_argument("--scale", type=float, default=0, help="按 px/pt 先缩到设计尺寸")
    g.set_defaults(func=cmd_grid)

    s = sub.add_parser("probe", help="区域色值普查")
    s.add_argument("input", type=Path)
    s.add_argument("box", help="x,y,w,h（设计坐标）")
    s.add_argument("--mode", choices=["auto", "flat", "ink", "edge"], default="auto")
    s.add_argument("--scale", type=float, default=1.0, help="capture px / design pt，如 2.93")
    s.set_defaults(func=cmd_probe)

    c = sub.add_parser("crop", help="从整窗截图裁出设备屏")
    c.add_argument("input", type=Path)
    c.add_argument("--rect", required=True, help="x,y,w,h")
    c.add_argument("--radius", type=int, default=0)
    c.add_argument("--to", help="缩放到 WxH（参考尺寸）")
    c.add_argument("-o", "--output", type=Path, required=True)
    c.set_defaults(func=cmd_crop)

    d = sub.add_parser("diff", help="逐区域 Δ")
    d.add_argument("reference", type=Path)
    d.add_argument("mine", type=Path)
    d.add_argument("--regions", help="JSON: {name: [x,y,w,h]}")
    d.add_argument("-o", "--output", help="热力图输出路径")
    d.set_defaults(func=cmd_diff)

    args = p.parse_args()
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
