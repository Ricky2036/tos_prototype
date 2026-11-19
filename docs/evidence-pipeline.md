# 证据驱动的 UI 验收（evidence-pipeline）

> 背景：11-14 的 `SET-SYS-01`（设置→系统 10 行 + 9 个子页）在**没有任何子页真机证据**的情况下被实现并标 merged，
> 单测与 `gate:merge` 全绿；11-16 由人逐页指出错误后，用 3 天做了 7 个修复提交。
> 根因不是执行者不认真，是流程里**没有任何东西会因「没取证」变红**。
>
> 这份目录让「没取证 / 做漏了 / 自造了」变成机器事实。

---

## 1. 四层，各管一件事

| 层 | 命令 | 判定 | 产物 |
|---|---|---|---|
| 契约 | `node tools/contract/spec-batch.mjs --dir spec/captures/<module> --source infinix-1208 --out spec` | 真机 dump → 页面语义模型（行/分组头/页头），id 稳定唯一 | `spec/<pageId>.geometry.json`（含 `xml_sha256`） |
| 覆盖 | `node tools/contract/spec-coverage.mjs --repo . --spec-root spec` | 代码里的每个 settings 页面是否有契约 | 表格 + **无 spec 时退出码 3** |
| 判决 | `node tools/accept/accept.mjs --spec … --url … --recipe … --build-dir dist --out reports/accept/<task>` | 渲染 DOM vs 契约逐节点比 + 集合差 | `verdict.json` / `report.md` / 并排图 |
| 门禁 | `node tools/accept/gate-acceptance.mjs --repo . --spec-root spec --url … --since origin/main --until HEAD --block` | 本次改动触碰的页面逐页判定；无契约 = `blocked_no_spec` | `gate.json` / `gate.md` |
| 签核 | `node tools/gate/sign.mjs sign|verify --verdict …` | 签核者 ≠ 实现者；waiver 带到期日；改判决书即失效 | 签名后的 verdict |

`gate:merge` 已接入 **G0b 契约覆盖（advisory）**：只报红不阻塞。看到数字之后再分档收紧（见 §4）。

---

## 2. 为什么不能拿「a11y 行框」直接比行高

实测（`.local-evidence/SET-DSH-01/system.xml` + `03-system-page.png`）：

- a11y 可点行框高度 176 / **163** / 176 / **187** …（不一致），但截图分隔线恰好落在这些边界上；
- 行内容墨迹高度恒定 **47–49px**，而内容中心相对行框中心在 **+5.8 / −7.5 之间正负交替**。

→ **a11y 行框在行间空隙里来回滑动，它吸收的是行距，不是行高。**
列表页必须用「行距 + 首行锚点 + 卡片偏移」判，即 `--list-metrics`：
`spec/settings-system.list-metrics.json`（pitch 48.8 画布 px、首行中心 128.1、逐卡偏移）。

其它角色的可比盒（`tools/accept/lib/diff.mjs::BOX_MODES`）：

| 角色 | 比什么 | 理由 |
|---|---|---|
| 行/容器 | 四边 | a11y 可点容器就是行本身 |
| 页头返回 | 左边缘 + 垂直中心 | a11y 是 44×44 触摸目标、DOM 是 34×34 视觉按钮 |
| 页头标题 / 分组头 | 文本盒顶边 / 中心 | a11y 文本节点 vs DOM line-box、满宽容器，宽高不可比 |

---

## 3. 已知读数（2026-11-18 实测）

```
settings 模块 18 页：有 spec 10 页 / 无 spec 8 页；有 dump/证据 16 页；可 G8 10 页
无 spec 页面 8 / 共 18
```

证据入库存放：`spec/captures/device-infinix/<pageId>/page.xml` + `page.png`（设备 Infinix X6878，1208×2644）。
13 页里 9 页是系统子页（dump 来自 11-16 的遍历取证），1 页是系统主页，其余为日期/时区/常驻地/安全。
仍缺 8 页，分两类（清单见 `spec/captures/device-infinix/MANIFEST.md`）：

- **真没采到**（4）：`display`（只有截图无 dump）、`sound`（无）、`accessibility`（只有说明）、`system-google-backup`（遍历未采）
- **采错了页（3）**：`system/system-reset-phone`（dump 实际是「定时开关机与重启」）、`system/system-usb-backup`（实际是「设置定时开机」弹层）、
  `dateTime/date-time-residence-picker`（实际是「日期与时间」页本体；常驻地是底部弹层不是独立页）
- **清单重复（1）**：`dateTime/settings-date-time` 与 `settings/dateTime` 是同一屏的组件/路由两份，未重复计。

> 采错页的三份 dump 已从契约里剔除（不是"缺"，是"错"——错证据比没证据更危险：它会让人以为做对了）。

判决（`settings/system`，对 11-14 构建 `0c945b6`）：

- 13 个契约节点全部命中（`missing=0 extra=0`），几何红；
- 拆因后是四件事：① `--safe-top: 54px`（真机 42）② 首行锚点差 3.7px ③ 行距 52 vs 48.8 ④ 卡片间隔逐卡少 12.6 / 15.9 / 27.1；
- ①②③ 已用运行时注入验证（注入后 DOM 行距 = 48.8 与真机一致），④ 需逐卡核对。

---

## 4. 落地顺序（每一档都能独立回滚）

1. **现在**：G0b advisory（已接）。先让全仓库看见「17 页没有契约」。
2. 补 dump → 生成契约（`spec/captures/<pageId>/<pageId>.xml` + `.png` → `spec-batch`）。
3. G0b 转 new-only：**新增页面**无契约即阻塞（存量豁免）。
4. G8a/G8b 接入 `gate-acceptance`：判决书必须由**非实现者**签核才能进判定；缺签核 = `blocked_unsigned`。
5. 旧 `scripts/verify-*.mjs`（58 个）逐个迁成 `tools/accept/recipes/<page>.mjs`，迁完删原脚本。

> 收紧原则不变：**先 advisory 看数字，再 new-only 拦增量，最后 blocking 全拦。**
> 反过来一次性全阻塞，会被 17 页存量红灯淹没，最后一定演变成加 `--force` 绕过。

---

## 5. 边界（别把这套东西当万能）

- 机器只判「结构 / 位置 / 有无 / 集合差」，**不判**颜色、图标形态、圆角、字体、文案、交互态、动态内容。
- 外观仍要人看——但人只需要看**一张并排图**（`side-by-side.png`）+ 一个 waiver 列表，不用逐页找问题。
- 契约来自真机；没有真机 dump 的页面，机器只能判「没有证据」，不能判「做错了」。
---

## 6. 已核验的处方（settings/system）

2026-11-18 实测（HEAD `247e92b`，构建 `/tmp/dist-head`）：

| 状态 | 判决 |
|---|---|
| 当前产品代码 | **2/13** pass（`--list-metrics` 口径） |
| 按下列处方运行时注入 | **13/13** pass，exit 0 |

处方（来源：真机 `03-system-page.png` + `system.xml`，见 `spec/settings-system.list-metrics.json`）：

| # | 位置 | 值 | 实测依据 |
|---|---|---|---|
| ① | `tokens.css --safe-top` | 54 → **42px** | 真机返回按钮顶边 141 device px = 42 画布 px |
| ② | `.system-body` padding-top | 12 → **15.7px** | 首行内容中心 128.1 画布 px |
| ③ | `.list-cell` min-height | 52 → **48.8px** | 行距 163.8 device px（6 样本 162.0–169.0） |
| ④ | 卡片间距（逐项） | card2 **24.6** / group **19.7+3.1** / card3 **3.1** / card4 **23.2** | 卡片首行中心偏移 +171.0 / +323.9 / +493.5 |

模拟处方脚本：`tools/accept/recipes/settings-system-prescription.mjs`（验完即弃）。
任务单：`.tasks/queue/SET-SYS-02.md`（含逐条 diff 与验收命令）。

> ⚠️ ① 是共享 token，改它等于所有带页头的设置页整体上移 12px。
> 合并前必须对**所有已有契约的页面**跑一遍 accept；没有契约的页面要显式列为「未知影响面」，不能默认没影响。

---

## 7. 全页面基线（2026-11-18）

`tools/accept/run-baseline.mjs` 一轮跑完所有有契约的页面（不跳页、不放宽容差、不改 spec）：

```
10 页里 0 页 0 fail / 10 页有 fail / 0 页环境错误
合计 131 节点：pass 2 / fail 108 / missing 21 / extra 14
```

- 汇总：`reports/accept/baseline/summary.md`（逐页 verdict 同目录）
- **跨页系统性偏移**：`header:back` 在 10/10 页全红，Δy 全部 **+18.0~+20.1**；`header:title` 10/10，Δy +13.7~+15.7 —— 与 SET-SYS-02 的 `--safe-top 54→42` 方向一致，说明这不是某一页的错，是全局 token。
- 非全局缺口（真缺陷）：时区页缺 6 个城市；语言页缺「温度」行；开发者选项缺「错误报告处理程序」「WebView 开发者工具」且多「USB 调试」。
- scale 全部 1.0000（壳 360×788），换算无异常。

> 这张表就是 11-14 缺的那样东西：**不用等人逐页点，机器一次给全量清单**。
