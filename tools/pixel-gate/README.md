# pixel-gate（图侧）

G8 几何门禁与 P1 像素对照的**图侧**工具。DOM 侧在 `scripts/gate-geometry.mjs`（另写）。

## 为什么是 Python

图侧只做一件事：把 PNG 当像素矩阵读。`Pillow + numpy` 一行能做完的事，
在 Node 生态里要额外拉 `pixelmatch`/`pngjs`/`sharp` 三个包。本机已有前者，零新增依赖。

**这不是设计偏好，是成本选择。** 如果哪天要做 DOM 侧，那是 Playwright 的活，
不要试图在这里加——见 `docs/tOS-pipeline-1.0.md` §3.3。

## 依赖

```bash
python3 -c "import PIL, numpy; print(PIL.__version__, numpy.__version__)"
# 12.3.0 2.5.3  ← 本机实测
```

没装：`pip3 install -r requirements.txt`

## 子命令

| 命令 | 用途 | 关键约定 |
|---|---|---|
| `grid <img> -o <out>` | 把网格画到参考图上 | **先看带格子的图，再测量**。顺序反了坐标会落进错误的 token |
| `probe <img> x,y,w,h` | 区域色值普查 | `--mode flat\|ink\|edge\|auto`；`--scale` 传 capture px / design pt |
| `crop <img> --rect x,y,w,h` | 裁屏 + 圆角遮罩 | `--to WxH` 缩放到参考尺寸；圆角遮罩去掉四角黑楔子 |
| `diff <ref> <mine> --regions r.json` | 逐区域 Δ | **只在同栅格器内比较**；跨来源只出并排图，绝不出均分数字 |

### 采样策略（为什么 `--mode` 必须选）

| 区域类型 | 用哪个 mode | 原因 |
|---|---|---|
| 页面 / 卡片 / 面板 | `flat` | 只认"和四邻同色"的像素，排除抗锯齿边缘 |
| 文字 | `ink` | 取最暗的 3%，其**众数是背景不是墨** |
| 1pt 分隔线 / 描边 | `edge` | 发丝线在缩小图里永远到不了满覆盖，要按缺陷量反解 |

`auto` 在覆盖率高时按 `flat`、否则按 `ink`，但**它替你做的判断可能是错的**。
拿不准就显式指定。

### `contrast` 是自曝字段

`ink` 模式输出 `contrast`。**≈0 说明框错了，不是颜色错了。**

实测过：探蓝字时窗口低了 10pt，返回 `{"value":"#F7F7F7","contrast":0.0,"core_px":15134}`
—— 一万五千个"墨芯"像素、对比度 0，一眼就知道框歪了。没有这个字段，会得到一个自信的错数。

## 自测

```bash
cd tools/pixel-gate && python3 selftest.py
```

16 项断言，用合成图跑，不需要真机截图。断言的都是已知答案：
同图 Δ=0、横移 3px Δ∈(0,8)、平坦区精确取色、框错时 contrast≈0、圆角四角透明。

## 已知限制

- **文字颜色不可信**：字号 < 16pt 时笔画只有 2–3px 宽，ink core 会被抗锯齿和 JPEG 拉灰。
  必须 @3x 原图，否则只测位置、不测颜色。
- `diff` 假定两张图已对齐到同一尺寸；缩放请先用 `crop --to`，不要在 `diff` 里隐式缩。
