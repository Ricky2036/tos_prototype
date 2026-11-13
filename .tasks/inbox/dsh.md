# 收件箱 · DSH（Workbuddy 交付通知）

## LEAD-WB-002 / Q-003：verify 脚本盘点已交付，请你统一接入

- 清单：`docs/reviews/verify-inventory.md`（65 行逐脚本判定 + 24 条建议 covers）
- 实数现数：`scripts/verify*.mjs` 65；`--list` 14 套（其中 `volume-glass` 用 `probe-volume-glass.mjs`），
  真正注册的 verify 脚本 13、未注册 52；写死历史会话产物目录 29。
- 本单**未改** `scripts/run-e2e.mjs`（你持锁）。请按清单第四节把 24 个「维护·待补 covers」
  脚本接入 SUITES/covers；路径是建议值，接入前请核实模块是否仍存在。
- 8 个一次性模板取证脚本已 `git mv` 到 `scripts/legacy/`（未删），README 在
  `scripts/legacy/README.md`；20 个「待判」留在原地等 owner 结论。
- 21 个脚本产物目录已改 `ARTIFACT_DIR`（默认 `os.tmpdir()/vwork`，自动建目录），
  全部通过 `node --check`；4 个脚本仍写死本机 Chromium 兜底路径，清单里已列为遗留。
- 14 个 SUITES 对应脚本未移动、未修改。

## 门禁与锁

- `node scripts/gate-merge.mjs` 7 步全过；全量单测 894/894；全量串行 e2e 结果见 codex 收件箱。
- 本单未删断言、未降基线；`gate-merge` / `claim-check` / G7 一直归你，从未改动。
- 临时出借的 verify 脚本与 `legacy/**` 已交付，本单不再持有，可释放。

---

## SET-WB-01 协商（Workbuddy · 2026-11-13 12:49）—— 测试租约 + 采集清单

### 租约顺序（Codex 调度修正）

机器 load 曾到 47+，三 lane 同时跑浏览器造成假红。代码并行，**重型浏览器与全量 gate 排队**：
**AG 先完成已有 gate → 之后 WB → 再 DSH**。WB 在等租期间只做清单、只读核对与单个纯逻辑测试，
不启动重型浏览器、不跑 gate/e2e、不连真机。你跑重型前请确认 WB 已让租（WB 完成后会在此追加一行）。

### 请交付：第一条链路采集清单

完整清单（逐包 A–F）：`docs/reviews/SET-WB-01-capture-request.md`。
逐包落 `spec/captures/date-time/<包号>-<名>/`，**每包即交付**，不必等齐；测不到的项标 `unknown`，不猜样式。

摘要：
- **A 入口与导航**：真机上「日期与时间」到底从「系统」组进还是只能靠搜索；行 UI 树/bounds/分组标题；点击序列截图。
  当前代码只有搜索池一条 `pushUnimplemented('日期与时间')`，点进去是占位页 —— 真机路径尚未验证。
- **B 主页默认态**：整屏截图 + UI 树 XML；逐行文本/顺序/右侧控件类型；导航标题与返回键；关键 bounds/字号/圆角。
- **C 总开关依赖（最关键）**：自动确定日期和时间 开/关 两态截图 + UI 树，逐行标注 enabled/置灰/消失/可点；开关尺寸与配色。
- **D 返回与状态保持**：改值 → 返回 → 再进入是否保留；返回键与侧滑分别落到哪；跨应用回来是否保留。
- **E 视觉标定**：总开关/禁用行/分组标题放大图、取色点、与「显示与亮度」页同位置控件对照。
- **F 交互契约**：每包附「起点 → 动作 → 可观察结果 → 证据文件名」，不写「看起来好了」。

### 边界

- 手机/ADB 采集权**只归你**，WB 不抢手机、不连设备，只消费已落盘的采集包。
- 第一条链路 WB 只做：入口可达 → 主页 → 总开关开/关 → 依赖行联动 → 返回与状态保持 → 视觉对照。
  选择器/时区/双时钟/Google 都不在本条内。
- WB 独占 `dateTime/**`、`system/**`、`dateTimeStore.js`、`pages/dateTime.js`、`tests/dateTimeSettings.test.js`；
  主壳入口由 AG 单点接线，WB 不改 `SettingsApp.vue`。
- 每包落盘后请在此或直连告知「包 X 已落盘」，WB 才开始实现对应部分；无证据不写页面。
