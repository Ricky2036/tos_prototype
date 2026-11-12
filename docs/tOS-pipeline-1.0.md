# tOS 复刻流水线 1.0（正式版）

> **本稿取代此前全部草稿（v1.0–v1.7）**，是唯一执行依据。
> 冻结声明：除数字外不再改方法。要改流程，需 AG / WB / DSH 三方同意并留痕。
> 历史沿革不再保留——七轮讨论的结论已全部并入本文，过程留在会话记录里。

---

## 0. 摘要

| 项 | 结论 |
|---|---|
| 病根 | 注册耦合（改一处动全身）· 假性护栏（57/82 源码正则测试）· 串行阻塞（任务板占 281/1031 提交）· 门禁缺位 |
| 打法 | 先拆注册点让并行成立 → 再把验收变成脚本数字 → 最后收紧 |
| 节奏 | **W0 3d → W1 4d → W2 6d → W3 6d → W4 5d（≈4.8 周）** |
| 门禁 | G0–G8 九道 + P1 非阻塞，三批上线：只提示 → 拦增量 → 全阻塞 |
| 如果只做一件事 | `verify.yml` + `gate:merge` + G7 断言棘轮 |

**这不是两周计划。** 6 个待建工具 + 2 个重构 + 65 个脚本收编，压进两周只会让门禁变成纸面文档。宁可承认 4.8 周。

---

## 1. 四个不变量

| 不变量 | 含义 | 抓手 |
|---|---|---|
| **基准溯源** | 尺寸必须绑定「来源设备 + 裁剪框 + X/Y 两个系数 + 入画布策略」 | spec 四字段（§4.4） |
| **单一事实源** | 标题、应用元数据、设计变量、通用控件各只有一处定义 | `settingsTitles.js`、统一应用清单、`tokens.css`、`ui/` |
| **错误左移** | 契约缺口、死入口、越界修改在实现与合并前暴露 | 死入口审计、认领校验、spec 完整性 |
| **门禁自动化** | 准入以脚本输出为准，本地合入前与远端 CI 双卡口 | `gate:merge` + `verify.yml` + 棘轮 |

---

## 2. 事实基线

| 指标 | 实测 | 复核 |
|---|---|---|
| 源码 | 125,648 行 / 273 `.vue` / 89 `.js` | 附录 A |
| `apps/settings/` | 45,188 行 / 134 文件 | 同上 |
| `system/` | 21,710 行 / 38 文件 | 同上 |
| 单文件 | ≥2000 行 **6** · 1500–1999 **5** · 1000–1499 **9** · 500–999 **40** | |
| 单测 | 82 文件 / 5,614 `assert` / **57** 个读源码做正则断言 / 用例 **819** | |
| e2e | **14** 套 / 1,024 `check()` / ~211s | |
| 零散验证脚本 | **65**（58 横杠 + 7 下划线），仅 14 个注册 | |
| `SettingsApp.vue` | 1,327 行 · 58 顶层 import · 75 搜索词条 · `.back?.()` 22 + `.back()` 3 · `view==='wifi'` 重复 2 次 | |
| 主壳分段 | template **348–1025（678 行）** · 搜索数组 **263–338（76 行/74 条）** · 34 子页各占 1 行 · 首页列表内联 ~600 行 | |
| 应用注册 | 38 应用仅 **10** 个有目录（28 占位） | |
| 加载策略 | `import.meta.glob` **0** · `() => import(` **0** · `defineAsyncComponent` **2** | |
| 任务板 | `ACTIVE_TASKS.md` **281 / 1,031** 提交（27%） | |
| CI | 仅 `deploy.yml`：`push:[main]` → `npm ci`（`:36` 跳过浏览器）→ `npm test` → `build` → 发布 | |
| 端口硬编码 | `vite.config.js` **4 处**：`17` / `251` / `355` / `371` | |
| 工具 | `tools/` 仅 `telemetry-server`；`pixel_gate.py` 339 行，**在仓外** | |
| 工作区 | 4 个 worktree（main/antigravity/codex/workbuddy），**无 dsh** | |
| git 自动化 | `.git/hooks` 空；无脚本执行 `git commit` | |

`[待验]`：固定 `wait()` 占 e2e 耗时 63% · 各簇行数估算。
`[口径]`：`uiautomator` 节点/空值类数字每次采集会变，**今后一律附 dump 文件名与字节数**。

---

## 3. 门禁

| 门禁 | 检查 | 实现 | 上线 |
|---|---|---|---|
| **G0 探索覆盖度** | 仅新接真机模块：`visited/clickable = 100%`，点击无变化记 `no-op` | `[待建]` `tools/explore/` | W3 advisory，按模块启用 |
| **G1 死入口归零** | 带右箭头无 handler 的设置项新增 = 0 | 复用 `audit-settings-dead-entries.mjs --strict` | **W1 阻塞** |
| **G2 标题清单同源** | 标题来自 `settingsTitles.js`；清单无孤立硬编码 | 复用 `settingsTitles.test.js`、`registeredAppList.test.js` | **W1 阻塞** |
| **G3 单测构建** | `npm test` + `npm run build` | 已有 | **W0 阻塞** |
| **G4 增量/全量 e2e** | 命中流程跑通 | 扩展 `run-e2e.mjs` | **W2 阻塞** |
| **G5 裸样式棘轮** | `ui/` 外新增卡片阴影/圆角/毛玻璃只减不增 | `[待建]` 静态扫描 | W2 提示，W3 卡增量 |
| **G6 认领边界** | 改动 ∈ 认领簇 ∪ C0 锁 ∪ `[handoff]` 白名单 | `[待建]` `claim-check` + `.claims/` | W2 提示，**W3 阻塞** |
| **G7 断言棘轮** | 真实执行用例数只增不减 | `[待建]`，口径见 §3.2 | **W0 阻塞** |
| **G8 几何还原度** | 适用模块 DOM bbox 对齐 spec geometry | 两部分，见 §3.3 | W2 提示，**W3 阻塞** |
| **P1 像素并排** | 同浏览器改前/改后热图；跨来源只出并排图，**绝不出均差数字** | 迁入 `pixel_gate.py` | 按需，永不阻塞 |

### 3.1 容差分档

| 元素类 | 容差（画布 px） | 理由 |
|---|---|---|
| 分隔线 / 描边 / 图标内笔画 | **±0.5** | 1px 线允许偏 1.5px 等于没有约束 |
| 行高 / 栅格 / 内边距 / 容器宽高 | **±1.5** | 亚像素抖动需要留量 |
| 文本基线 / 字重位置 | **不卡**（只记录） | 字体渲染差异不可控，卡了只会假红 |

**量化步长定为 0.1 画布 px**（不是 0.5）。DOM rect 本来就是分数，凑 0.5 会让线类的 ±0.5 实际变成 ~0.75——留一个看起来比实际更严的数是隐患。

### 3.2 G7 计数口径

`grep` 会把注释掉的断言也算进去，不可用，必须用执行器输出。

#### 第一步：先抓真实收尾行（W0 第一件事）

14 套的收尾格式比预想的更散，**实测只有 3 套能被单一正则直接解析**：

| 收尾形态 | 套数 | 套件 |
|---|---|---|
| `[id] N PASS / M FAIL` | **3** | focus · dnd · settings-group3 |
| `===== …: N PASS / M FAIL =====` | 2 | cc-volume · hardware-volume |
| `走查 N 步 / 断言 M 条 / 通过 X 条 / 失败 Y 条` | 3 | photos · mori · recorder |
| `PASS N / FAIL M` | 1 | probe-volume-glass（探针，豁免） |
| **完全没有汇总行** | **4** | aimate-printer · aimate-flow · modes-and-routines · phone-flow |
| 待确认 | 1 | digital-health（只打 FAILURES 列表） |

跑一次 `node scripts/run-e2e.mjs --all --jobs 4`（约 82s），把每套最后 3 行原样存进 `tests/e2e-summary-baseline.txt`。**这是口径的唯一可靠来源，不要靠读代码猜。**

#### 第二步：统一到一种格式

统一为 `[id] N PASS / M FAIL`。

- 2 套 `=====` 形：改 print 模板即可
- 3 套"走查"形：加一行汇总即可（已有 `pass`/`fails` 变量）
- **4 套无汇总行：需要先补计数**。`aimate-printer` 是逐条 `console.log`，可能没有 `pass` 计数器，得先加统计再输出
- `probe-volume-glass` 保留原格式，在 `SUITES` 里标 `noChecks: true` 豁免

> 这一步不做，解析器只覆盖 **3/14**，而 photos / recorder / mori / aimate 这些最大的套件全在覆盖区外。

#### 第三步：按统一格式解析，解析不到即失败

```js
// run-e2e.mjs:352 附近，先算 checks 再推入
// 注意：现有字段只有 ok / fails，没有 pass / fail
const m = out.match(/\[[\w-]+\]\s+(\d+)\s+PASS\s*\/\s*(\d+)\s*FAIL/)
const checks = m ? { pass: Number(m[1]), fail: Number(m[2]) } : null
results.push({ id: s.id, ms, code, ok: code === 0, summary, fails, checks })
```

`:381` 已经用 `({ out, ...r }) => r` 剔掉 `out`，`checks` 会随 `...r` 自动带出，不用改那行。

**棘轮规则（不写这条等于没做）**：

- `checks === null` → **G7 失败**，不是跳过。除标了 `noChecks: true` 的探针外，任何一套解析不到计数都算门禁红。
- 理由：一旦允许"解析不到就跳过"，格式改一次就静默放行一批，回到零输入通过。

#### 单测侧

```bash
node --test --test-reporter=tap tests/*.test.js | grep -E "^# (pass|fail)"
# # pass 819
# # fail 0
```

基线落 `tests/baseline.json`，字段名用 **`cases`**（不是 `asserts`——`# pass 819` 是用例数，不是 5,614 条断言）：

```json
{ "suite": { "cases": 819, "checks": { "pass": 1024, "fail": 0 } } }
```

逐套件比对 `current >= baseline`，不允许 A 套件 +10 抵 B 套件 −15；下调唯一途径是同批提交基线变更。

> 局限：可被"加 100 条平凡断言"绕过。它只保证下限不被侵蚀。

### 3.3 G8 不是一个工具能做完的

`pixel_gate.py` 四个子命令全部基于 `PIL.Image`，**没有任何 DOM 能力**。拆两侧，只共享换算表：

| 侧 | 实现 | 职责 | 工作量 |
|---|---|---|---|
| 图侧 | `tools/pixel-gate/`（Python，迁入现成） | `crop`、并排图、同栅格器 diff | ~0.5 天 |
| DOM 侧 | `scripts/gate-geometry.mjs`（Node + Playwright） | 开页 → 归一化 → 读 rect → 与 `geometry.yaml` 逐节点比 → 出偏差表 | **新写 ~200 行，1.5 天** |

DOM 侧三条实现要求：

1. **归一化系数从容器 rect 现算**：`const k = shell.getBoundingClientRect().width / 360`。不要读全局 `scale`、不要读 `devicePixelRatio`——`App.vue:135` 的 `.phone-scale` 有 `transform: scale()`（`:48` 按视口高度算），`getBoundingClientRect()` 返回的是缩放后 px。本仓已踩过：`verify-app-switcher` 在 430×932 视口下量值偏 **1.194×**，39 条全假 FAIL。
2. 比较前**四舍五入到 0.1 画布 px**（按 §3.1）。
3. **先用 3 个已知页标定**（偏差应 <0.5px），再转阻塞。

### 3.4 均差的正确用法

```
同栅格器（同浏览器，改前 vs 改后） → 灵敏的回归探测器，可用
跨栅格器（真机截图 vs Chrome 截图） → 无可比性，只出并排图
```

同图 `Δ0.00`、横移 3px `Δ3.55` 证明工具灵敏度，但它们是同栅格器自比，不能外推成"还原度标尺"。

---

## 4. 坐标系

### 4.0 入画布策略（必须先拍死）

| 策略 | 三星页表现 | 与 `ky` 的关系 |
|---|---|---|
| **拉伸填充** | 纵向拉 1.02%，底部对齐 788 | 与 `ky` 自洽 ✅ |
| 等比留边 | 纵向按 `kx`，底部空 8px | 与 `ky` 冲突 ❌ |

**决定：拉伸填充。**

理由：整个原型是「一台 360×788 的手机」，任何来源都必须填满画布；留边会在屏底露白，且不同来源混排时高度不一致。代价是三星页纵向拉长 **1.02%**、iOS 页 **0.74%**。

三条配套规则：

1. 这个拉伸**是设计选择，不是缺陷**，禁止事后"修复"。
2. 实现者不得"照着截图等比抄"——照抄会得到 `kx`，与 spec 的 `ky` 差到底部 8px。
3. **G8 的作用之一就是强制执行本策略**：它比的就是 `ky` 空间的 spec 与 DOM。

### 4.1 双系数

```
canvas_x = src_x × kx      kx = 360 / src_w
canvas_y = src_y × ky      ky = 788 / src_h
```

| `source` | 原始像素 | `kx` | `ky` | 偏差 | 判定 |
|---|---|---|---|---|---|
| `infinix-1208` | 1208×2644 | 0.29801 | 0.29803 | 0.01% | 单系数可用 |
| `samsung-1080` | 1080×2340 | 0.33333 | 0.33675 | **1.02%** | **必须分轴** |
| `ios-1320` | 1320×2868 | 0.27273 | 0.27476 | **0.74%** | 必须分轴；**不跑 G8** |

阈值：`|kx/ky − 1| < 0.2%` 可用单系数；超过必须分轴，**禁止用 `kx` 代 `ky`**。用 `kx` 算高得 780.0，底部空 8px。

### 4.2 `source` 适用范围

| `source` | 适用 | G8 |
|---|---|---|
| `infinix-1208` | 设置主干、账号、通知、数字健康 | 是 |
| `samsung-1080` | 三星复刻页（模式和日常程序等） | 是（需匹配采样机） |
| `ios-1320` | iOS 规格页（专注、控制中心、灵动岛、多任务、相册） | 否 |
| `custom-spec` | 自研交互与高动效（桌面网格、锁屏景深） | 否 |

### 4.3 四条铁律

1. **采集设备必须与 `source` 匹配，两维都校验**：先 `wm size` 取实际 `w×h`，不符（换机/改分辨率/投屏缩放）**直接报错退出**，不静默套用。
2. **G8 必须消除舞台缩放**（§3.3 条 1）。
3. **禁止一个 spec 混用两个来源**：拆子 spec，各带 `source` 与 `crop`，节点标同一 `element-id`。
4. **`crop` 与 `bounds` 同框**：`uiautomator` 的 `bounds` 是含状态栏的整屏绝对坐标，`crop` 也从整屏左上角起算。

### 4.4 spec 必填字段

```yaml
source:  infinix-1208
canvas:  { w: 360, h: 788 }
crop:    { x: 22, y: 118, w: 316, h: 57 }
```

脚本里**禁止**出现字面量 `0.298` / `0.3333` / `360/1208`，一律查表，静态检查报错。

---

## 5. 契约分层

| 分段 | 内容与来源 | 校验 |
|---|---|---|
| **`geometry`** | `uiautomator` + `crop` 脚本提取：`bounds`/`text`/`clickable`/层级 | G8，容差见 §3.1 |
| **`appearance`** | 关键图标/卡片附 `crop`（<8KB，入库）+ 一句形态描述 | 字段非空 + 图存在 |
| **`unknowns`** | 看不清、被遮挡、暂缺，显式列出 | 非空不得进「可实施」 |

实测行内图标 `content-desc` 基本全空，所以**只有几何适合机器提取，外观是 0%**。近期返工多数是外观类（盘径、间距、有无底盘、字号偏 1–2px），必须靠 crop + 人工描述兜住。

### 5.1 `spec-gen`（G8 的前置）

```
adb dump (xml) ──► scripts/spec-gen.mjs ──► spec/<page>/geometry.yaml + crops/*.png
                     ├─ 按 source 查表：kx 用于 x/w，ky 用于 y/h（不可混用）
                     ├─ 每个 ImageView 输出 crop 框，供人工补 appearance
                     └─ content-desc 为空 → 自动写入 unknowns: [icon-form]
```

**G8 没有它就没有输入。**

---

## 6. 两个注册点重构

### 6.1 App 级

1. **统一纯数据应用表**（替代 `apps.js`/`drawerApps.js`/`app-names.js`/`ScreenView.vue` 的重复定义）：`id`、`names`(zh/en/bn)、`initial`、`pinyin`、`dock`/`pinned`/`page`、`icon`、`heroBackground`、`special`、`darkStatusBar`、`hiddenOnDesktop`。保持 38 应用的抽屉与桌面索引契约。
2. **仅 10 个深度应用**建 `apps/<id>/entry.js` → `{ id, component: () => import() }`；`registry.js` 用 glob 汇总，未注册回落 `PlaceholderApp.vue`。
3. 移除 `vite.config.js` 手工枚举的 `manualChunks`。

**不要**给 28 个占位应用建空目录。

### 6.2 Settings 级：四协议同步下沉

1. 页面元数据自声明 `settings/pages/<id>.js`：`id`/`cluster`/`titleKey`/`group`/`order`/`searchItems`/`component`；主壳 glob 汇总路由、标题、搜索池。
2. 返回栈下沉：删掉主壳轮询链（22 处 `.back?.()` + 3 处 `.back()`）；有三级页的二级页自行 `useBackHandler()`。
3. 跨页导航注入：主壳 `provide({ push, pop, pushUnimplemented })`，淘汰数十个定制 `@open-*`。
4. 清死分支：`view === 'wifi'` 重复 2 次，其一失效（约 914 行）。

### 6.3 W2 的验收是定义性指标

> **新增第 35 个页面时，`SettingsApp.vue` 的 diff = 0 行。**
>
> 验证：加一个 `pages/demo.js`，跑 `git diff --stat SettingsApp.vue`，输出必须为空。

行数只作附带记录（净减 ≥ 15）。`<450` 移到 W4。

### 6.4 Hero 白闪：`ready` 不是可用的就绪信号

`AppWindow.vue` 的 `ready.value = true` 在 **`:168`** 与 **`:180`**，都无条件，与异步子组件是否挂载无关。把淡入挂在 `ready` 上等于没等。

| 信号 | 控制 | 置位时机 |
|---|---|---|
| `ready` | `heroFill` 与图标过渡 | 保持现状（`hero.beginOpen` 之后） |
| `contentReady` | `.aw-content` 的 opacity | 异步组件 `@vue:mounted` 或 `<Suspense>` resolve |

外加**按下即预载**：桌面图标 `pointerdown` 触发 `preload()`。

验收：**真机录屏逐帧**看 hero 展开末段是否露底色。单测抓不住。

### 6.5 S2 试点与测试懒改

1. **先改测试**：S2 涉及的 **8 个**源码正则测试转运行时行为断言——`displaySoundSubpages`、`cardSpec`、`settingsFeatureGroup`、`transitionContract`、`sheetModalAnim`、`phoneApp`，以及 `settingsMenu`、`largeTitle` 中涉及显示/声音/无障碍的部分。
2. **其余 49 个按簇进度逐批改造**，不要一次性全改。
3. **双轨迁移**：建 `settings/pages/`，迁三页，其余 31 页共存。
4. **验收**：S2 零触碰主壳 · 单测与构建全绿 · 新增第 35 页主壳 diff = 0 · 真机冷启动无白闪。

---

## 7. 角色与所有权

### 7.1 角色

| 角色 | 目录 | 分支 | 端口 | 状态 |
|---|---|---|---|---|
| **Integrator（AG）** | `2026-08-02-23-04-06` | `main` | 9999 | 在册。合并、`gate:merge`、生成任务板、独占 C0-a |
| **Builder-A（WB）** | `tos-workbuddy` | `workbuddy/lane` | 5555 | 在册 |
| **Builder-B（DSH）** | `tos-dsh` | `dsh/lane` | 7777 | **`[待建]`**：worktree / 分支 / `.agent-assignments/dsh.md` / `AGENTS.md` 角色表，**四件一起做才算存在** |
| ~~Codex~~ | ~~`tos-codex`~~ | ~~`codex/lane`~~ | ~~8888~~ | **正式下线**，落地见 §7.2 |

### 7.2 Codex 下线

1. `AGENTS.md:3 / :11 / :31` 移除 Codex 行与分支说明
2. `.agent-assignments/codex.md` 归档为 `codex.md.retired`，注明日期与去向
3. `tos-codex` worktree 归档（`git worktree remove` 前确认无未提交改动）；原所有权（桌面网格 / 个性化 / 主题）并入 **C8**

> 文档说"在线"、实际不在，比没有文档更危险——后续 Agent 会按文档去找一个不存在的人。

### 7.3 C0 分两层

| 层 | 范围 | 规则 |
|---|---|---|
| **C0-a 结构层** | `ScreenView` `AppWindow` `StatusBar` `HomeIndicator` `ThreeButtonNav` `tokens.css` `global.css` `vite.config.js` 注册壳协议 `backRegistry.js` | AG **独占**，需 C0 锁 |
| **C0-b 控件层** | `src/components/ui/**` | **只增不改**：可加文件、可加向后兼容可选 props；禁止改既有 props 语义 / 默认样式 / DOM 结构 |

### 7.4 簇

| 簇 | 范围 | 规模 | 备注 |
|---|---|---|---|
| **C0** | 见 §7.3 | ~8k | 分层所有 |
| **C1** | Settings·连接与网络 | ~4.8k | |
| **C2** | Settings·显示/声音/无障碍 | ~4.0k | **自注册试点簇** |
| **C3** | Settings·账号/云/钱包 | ~7.5k | 链路长 |
| **C4** | Settings·通知/数字健康/专注/勿扰 | ~8.5k | 最大 |
| **C5** | Settings·模式和日常程序 | ~7.4k | `samsung-1080` 口径 |
| **C6** | Settings·系统信息与杂项 | ~8.6k | 拆短任务 |
| **C7** | 系统浮层 | ~15k | 交互最密，G4 主战场 |
| **C8** | 桌面与个性化 | ~5k | 含 Codex 遗产 |
| **C9** | 电话 | ~9.8k | |
| **C10** | 生态应用（aimate/oneleap） | ~9.8k | 重点拔固定等待 |
| **C11** | 小应用池 | ~5k | 短任务 |
| **C12** | 隐私 | ~0.6k | 短任务 |

跨簇小改：由目标簇负责人开 `[handoff]` 单 + 文件白名单，G6 放行。

---

## 8. 提交纪律与设备租约

### 8.1 改动静默丢失

各 worktree 有独立 HEAD 与工作区，**别方 `checkout`/`reset` 改不到你的文件**。

会引起"改动丢失假象"的三件事，没有一件被证实对多文件回退负责——按流程防，不按归因防：

| 来源 | 机制 | 影响面 |
|---|---|---|
| `save-defaults` 中间件 | `vite.config.js:15` 指向 `src/stores/controlStore.js`，`writeFileSync` 覆盖；触发点是控制台微调滑杆（`controlStore.js:608/:652`） | 仅此一文件。**W0 改显式开关，默认关** |
| Agent 宿主自动提交 | 时序不可控 | 每轮改动先手动 commit 并记 SHA |
| 同 worktree 内写操作 | 批跑前后记 SHA | 局部 |

排查用这三条，**不要用 `git reflog`**——它只记 ref 移动，工作树文件被改写时一条都不会有：

```bash
git status --porcelain
git diff --stat
git rev-parse HEAD
```

纪律：unmerged 分支禁 `git clean -fd`；lock 清理用 `mv` 不用 `rm`（`-delete` 会触发批量删除护栏，实测一次 8 个确认弹窗）。

### 8.2 真机租约

- 独占锁 `mkdir .device-lock`（`owner`/`serial`/`expires`），抢不到即排队；60s 心跳；结束无论成败都 `input keyevent HOME`
- 所有 `adb` 命令强制 `-s <serial>`（实测出现过 `more than one device` 而 `adb devices` 只列一台）
- `uiautomator dump` 外层 30s 超时 + 最多 2 次复位重试（会偶发不返回也不报错；zsh 无 `timeout`，用 `python3 subprocess.run(timeout=30)`）
- 整屏截图与原始树放 `.local-evidence/`；仅单图标 `crop`（<8KB）与文本契约入 Git

---

## 9. 任务板与交接单

- **任务板**：只在 `.tasks/<cluster>-<id>.md` 新增，脚本汇总生成 `ACTIVE_TASKS.md`，仅 Integrator 提交
- **交接单**：`npm run handoff` 自动输出，禁止手填；尖括号是占位，未实测不得填数

```markdown
## <cluster> / <task>
- 分支 / SHA：<branch> @ <sha>
- 远端同步：<local> vs <remote>（判据 git ls-remote）
- 认领校验（G6）：PASS（改动 <N> 文件，全部在白名单内）
- 死入口（G1）：<实测>（基线 <实测>）
- 标题与清单（G2）：PASS
- 单测与构建（G3）：<N> 文件 / <M> 用例 PASS · build PASS
- 端到端（G4）：--changed 命中 <K> 套，<K>/<K> PASS，<X>s
- 断言棘轮（G7）：单测 <n>/<baseline> · e2e <m>/<baseline>
- 几何（G8）：max bbox 偏差 <实测> 画布 px（线 ±0.5 / 容器 ±1.5）
- 探索覆盖（G0）：visited <n>/<n> · no-op <n>（仅新模块）
- 裸样式（G5）：新增 <n>（存量 <n>）
- 像素并排（P1）：已输出 / 未跑（原因）｜跨来源仅并排图
- 未跑检查与已知风险：
```

---

## 10. 分期（含 owner）

| 阶段 | 工期 | 交付 | Owner | 前置 |
|---|---|---|---|---|
| **W0 地基** | **3d** | `tos-dsh` 四件落地 | DSH | 拍板 #1 |
| | | 抓 14 套真实收尾行存档 → 统一格式 → 解析器 | DSH | — |
| | | `verify.yml`（分层触发，§10.1）+ `gate:merge` | DSH | — |
| | | G7 基线 + 棘轮脚本 | DSH | 上两项 |
| | | `source` 表（kx/ky）+ §4.0 策略写入 spec 模板 | DSH | — |
| | | `save-defaults` 改显式开关、默认关 | DSH 提 patch | **AG 持 C0-a 锁合入** |
| **W1 解耦前置** | 4d | 端口 4 处参数化（`17/251/355/371`） | AG | W0 |
| | | `.tasks/` 拆单 + 主表生成脚本 | AG | — |
| | | S2 八个测试转运行时行为断言 | WB | — |
| | | `pixel_gate.py` 迁入 `tools/pixel-gate/` | DSH | — |
| **W2 注册点重构** | 6d | `spec-gen.mjs` | DSH | W1 |
| | | App 数据表 + 10 个 `entry.js` | AG | WB 协助核对 |
| | | 主壳 glob 接入 + S2 三页迁出 | AG（壳）+ WB（页面） | 测试已改 |
| | | `gate-geometry.mjs`（提示级，先 3 页标定） | DSH | `spec-gen` |
| | | Hero `contentReady` + 按下预载 | AG | — |
| **W3 门禁收口** | 6d | G1/G4 转阻塞 | WB + AG 接线 | W2 |
| | | G5/G6/G8 转阻塞；G0 advisory | DSH | W2 |
| | | 65 脚本分类收编 + 逐条拔固定等待 | C1/C2/C3→WB，C7/C8→AG，DSH 出框架 | — |
| | | `npm run handoff` | DSH | — |
| **W4 主壳瘦身** | 5d | 首页列表数据化 −600 | AG | W3 |
| | | 搜索池按页声明 −76 | WB | 页面元数据就位 |
| | | 剩余 31 页迁出 + 返回链/导航注入下沉 ≥134 | WB + AG | — |
| | | `SettingsCloudBackup.vue`（2035 行）拆分 | WB | — |

### 10.1 `verify.yml` 的触发分层

三个 lane 都是自动提交 + 自动推送。若 `push: ['**']` 全量跑（chromium 40–60s + e2e 211s），每次推送 5 分钟起步，第一次超时就会被摘掉——**那才是真正的纸面门禁**。

| 触发 | 跑什么 | 预算 |
|---|---|---|
| `push: ['**']` | G3（`npm test` + `build`）+ G7 棘轮 | < 90s |
| `workflow_dispatch` / nightly | `run-e2e --all`（G4）+ G8 | ~4 min |
| `push: [main]` | 现有 `deploy.yml` 再跑一次 G3 兜底 | 现状 |

门禁的价值在"跑得起来并被相信"，不在"每次推送都跑全套"。

### 10.2 W4 的算术

```
1327  −600（首页列表）  −76（搜索池）  −68（34 标签 + 34 import，累计口径）
──────
 583   ← 仍高于 450，需再减 ≥134
```

那 134 行只能来自剩余 31 页的返回链（22 处）+ push/pop 注入接线。**W4 的第四块不是可选项。**

两条补充：

1. `−68` 是累计口径（含 W2 已迁 3 页），与同表「剩余 31 页」不矛盾，handoff 时不要混用。
2. `−600` 是估算（template 678 减 34 标签行后取整）。**W4 第一天先 `wc -l` 实测起点再排工期**，±30 行就够吃掉 134 的余量。

---

## 11. 反模式

1. 删减或注释断言换绿灯（确需缩减必须同批更新 `baseline.json`）
2. 未 commit 就跑全量 e2e
3. 拿 `1080×2340` 的坐标乘 `0.2980`，或用 `kx` 代 `ky`
4. 忽略 `App.vue` 舞台缩放，直接拿 `getBoundingClientRect()` 做几何断言
5. 在 `SettingsApp.vue` 继续加页面 import / 搜索硬编码 / 子页 `ref`
6. e2e 里新增无条件固定长等待
7. 跨栅格器输出均差数字
8. 手写控件、硬套不匹配控件（应报 GAP）
9. 改别人认领的簇；Builder 顺手摸手机
10. 一边拆注册点、一边保留依赖字面 import 的正则测试
11. 把高清截图/录屏/原始控件树提交进 Git
12. **把还没入库的东西写成"已有/已复用"**（已踩 5 次；`[待建]` 必须标出）
13. **把顺序依赖型任务排成并行**（`spec-gen`→G8、`.claims/`→G6、`entry.js`→Hero 预载）
14. **对着截图等比抄**（会得到 `kx`，与 §4.0 拉伸策略冲突）

---

## 12. 风险与止损

| 风险 | 触发 | 止损 |
|---|---|---|
| 契约撰写变瓶颈 | spec 靠手抄 | `geometry` 100% 脚本生成；`appearance` 只要求小图+一句话；缺的进 `unknowns` |
| G8 假红 | 未归一化 / 亚像素 / 入画布策略不一致 | 系数从容器 rect 现算；步长 0.1；3 页标定后再阻塞 |
| G8 无输入 | `spec-gen` 没做 | 与 G8 同批交付，不做完不上线 |
| G0 假绿/不可达 | 自绘控件不在 a11y 树 / 无限滚动 | 补视觉可点区域扫描；不可达标 `sampled`，调分母不放宽分子 |
| 拆壳大面积回归 | 34+ 页同迁 | 双轨共存，先只迁 S2，失败只回滚 3 个文件 |
| Hero 白闪 | 异步分包未就绪 | 按下预载 + `contentReady` 独立于 `ready`；真机逐帧 |
| 门禁走形式 | `gate:merge` 被绕 / CI 没装浏览器 | `verify.yml` 分层触发；`main` 上再跑一次 |
| 工具链串行 | 6 个工具压一人 | §10 已分配；DSH 的 W2 若延期，**G8 顺延到 W3** |
| 计划长于预期 | 想两周做完 | 承认 4.8 周；压缩只会让门禁变纸面 |

---

## 13. 需拍板（3 项）

| # | 事项 | 建议 |
|---|---|---|
| 1 | `tos-dsh` 目录名 / 分支 `dsh/lane` / 端口 **7777** | 按此建，四件一起落地。端口需 30 秒确认不撞本机服务 |
| 2 | 合入方式 | 维持本地 cherry-pick + `gate:merge`；CI 触发按 §10.1 分层，不做 PR 流程 |
| 3 | 自动提交开关 | 关闭，统一由开发者/Agent 每轮自验后显式 commit 并记 SHA |

---

## 14. 执行手册（Runbook）

### 14.1 启动清单（约 40 分钟）

```bash
# 1) 确认端口（30 秒）
lsof -nP -iTCP:7777 -sTCP:LISTEN || echo "7777 可用"

# 2) 建 worktree（在任一已验证干净的 worktree 里执行）
cd ~/Workbuddy/agent-workspaces/tos-workbuddy
git fetch origin
git worktree add ../tos-dsh -b dsh/lane origin/main

# 3) 四件套
#    - .agent-assignments/dsh.md
#    - AGENTS.md 角色表 + 目录名映射 + 端口表
#    - docs/tOS-pipeline-1.0.md（本文）
#    - .tasks/ 目录 + 第一张单
```

**四件缺一件就回滚重来。** 文档与 worktree 不一致是最贵的坑。

### 14.2 W0 逐日检查点

| 日 | 动作 | 验收（一条命令） |
|---|---|---|
| D1 上午 | 抓 14 套真实收尾行 | `cat tests/e2e-summary-baseline.txt \| wc -l` = 14 |
| D1 下午 | 统一格式 + 解析器 | `node scripts/run-e2e.mjs --all --json && jq '[.results[].checks] \| map(select(.==null)) \| length'` = **0** |
| D2 上午 | `baseline.json` + 棘轮脚本 | 故意删一条断言 → 门禁变红；恢复 → 变绿 |
| D2 下午 | `verify.yml` + `gate:merge` | 推一个分支，GitHub 上看到 G3+G7 两个 check |
| D3 上午 | `source` 表 + spec 模板 + 静态检查 | 手写 `0.298` 被拦下 |
| D3 下午 | `save-defaults` 开关（提 patch） | 开关关闭时，点滑杆 `git status` 无 diff |

### 14.3 每个阶段你只需要看一个数字

| 阶段 | 你只审这一个 |
|---|---|
| W0 | `jq` 那条：解析不到计数的套件数 = **0** |
| W1 | `--port 7777` 下 `save-defaults` 返回码 ≠ **403** |
| W2 | `git diff --stat SettingsApp.vue`（加第 35 页后）= **空** |
| W3 | `run-e2e --all` 的套件数 = **14**，且零假失败 |
| W4 | `wc -l SettingsApp.vue` < **450** |

其余细节由交接单承载，不需要你逐条核。

### 14.4 每周固定动作

- 周一：AG 生成 `ACTIVE_TASKS.md`，三方核对认领表（`.claims/`）
- 周五：跑一次 `gate:merge` 全量 + `run-e2e --all`，把耗时记进 `docs/metrics.md`
- 每周只允许改一次 `tests/baseline.json`，且必须单独成 commit

---

## 附录 A：复核命令

```bash
cd <worktree>

# 测试与脚本
ls tests/*.test.js | wc -l                                   # 82
grep -l readFileSync tests/*.test.js | wc -l                 # 57
grep -c "    id: '" scripts/run-e2e.mjs                      # 14
ls scripts/verify*.mjs | wc -l                               # 65
ls scripts/verify_*.mjs                                      # 7

# 主壳结构
f=src/components/apps/settings/SettingsApp.vue
wc -l $f                                                     # 1327
awk '/^<template>/{s=NR} /^<\/template>/{print s"-"NR; exit}' $f   # 348-1025
awk 'NR>=263 && /^\]/{print NR-263+1; exit}' $f               # 76
grep -c '\.back?\.' $f                                       # 22
grep -c "view === 'wifi'" $f                                  # 2

# 坐标系
python3 -c "
for n,w,h in [('infinix',1208,2644),('samsung',1080,2340),('ios',1320,2868)]:
    kx,ky=360/w,788/h
    print('%-8s kx=%.5f ky=%.5f 偏差=%.2f%% 用kx算高=%.1f 差%+.1f'%(n,kx,ky,abs(kx/ky-1)*100,h*kx,h*kx-788))
"

# 舞台缩放
grep -n "phone-scale" src/App.vue                            # 135
sed -n '43,50p' src/App.vue

# Hero
grep -c "getBoundingClientRect\|querySelector" src/composables/useHeroTransition.js   # 0
grep -n "ready.value = true\|hero.beginOpen" src/components/system/AppWindow.vue      # 168/175/180

# G7 数据源
grep -n "results.push" scripts/run-e2e.mjs                   # 352：字段只有 ok / fails
grep -n "JSON.stringify" scripts/run-e2e.mjs                 # 381：已剔掉 out
grep -n "checks" scripts/run-e2e.mjs                         # 无 → 必须先加
node --test --test-reporter=tap tests/*.test.js | grep -E "^# (pass|fail)"   # 819 / 0

# 14 套收尾格式实测（W0 D1 的依据）
node scripts/run-e2e.mjs --all --jobs 4 2>&1 | tail -40

# 仓库现状
git worktree list                                            # 4 个，无 dsh
ls .agent-assignments/                                       # 4 个，无 dsh.md
ls tools/                                                    # 仅 telemetry-server
ls -la ~/Documents/DSH/tools/pixel_gate.py                   # 339 行，仓外
grep -n "PLAYWRIGHT" .github/workflows/deploy.yml            # 36
grep -n "5555\|DEV_SERVER_PORT" vite.config.js               # 17/251/355/371
```

---

## 附录 B：版本说明

历时七轮讨论，1.0 是本方案的第一个正式版本。过程稿（v1.0–v1.7）已作废，不再维护。

核定的三层结构：

- **诊断**：注册耦合 / 假性护栏 / 串行阻塞 / 门禁缺位
- **方法**：基准溯源 · 单一事实源 · 错误左移 · 门禁自动化
- **执行**：W0–W4，4.8 周，owner 到人，每阶段一个验收数字

**所有数字可用附录 A 复算。任何一条被推翻，请附命令与输出。**
**反向约束：凡 `[待建]` 条目，在真正进入仓库前，不得在其它章节以"已有"引用。**
