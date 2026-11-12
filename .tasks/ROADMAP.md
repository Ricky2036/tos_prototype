# 路线图 W2 → W4（一次交代清楚）

> 本文是剩余工作的唯一清单。每项都有 owner、依赖、可机器验的完成标志。
> 详细步骤看对应的 `.tasks/<id>.md`；本文只回答"还剩什么、谁做、怎么算做完"。

---

## 一、现在的家底

| 能力 | 状态 | 命令 / 位置 |
|---|---|---|
| 单元测试 | 864 用例全绿 | `node --test tests/*.test.js` |
| 断言棘轮 G7 | 阻塞（CI + 本地） | `check-assert-ratchet.mjs` |
| 生产构建 G3 | 阻塞 | `gate-merge` 第 2 步 |
| 画布换算门禁 | 阻塞，97 文件零违规 | `check-spec-literals.mjs` |
| 认领边界 G6 | **advisory**，刚上线 | `claim-check.mjs` + `.claims/` |
| e2e 棘轮 G4 | 13 套参与，1 套隔离 | `run-e2e.mjs` + `baseline.json` |
| G8 图侧 | 已交付 | `tools/pixel-gate/`（16 项自测） |
| G8 DOM 侧 | 已交付，**未接真实页面** | `gate-geometry.mjs` |
| G8 输入 | 已交付 | `spec-gen.mjs` |
| CI | 每次 push 跑 G3+G7，44s | `.github/workflows/verify.yml` |
| 合入门禁 | 6 步，实测 43s | `gate-merge.mjs` |

**没有的东西**：G5 裸样式棘轮、G0 探索覆盖、`.claims` 之外的簇登记、G8 在真实页面上的标定。

---

## 二、W2（本周）：让并行成立

| ID | Owner | 任务 | 依赖 | 完成标志 |
|---|---|---|---|---|
| **W2-001** | Workbuddy | Settings 主壳改 glob 自注册 + S2 三页迁出 | 先 push + 合 main；AG 登记 C0 出借 | 加第 35 页后 `git diff --stat SettingsApp.vue` = 空 |
| **W2-002** | AG | App 级自注册（10 个 `entry.js` + 数据表）+ Hero `contentReady` | 无 | 加模块不改 `apps.js`/`registry.js`；真机逐帧无白闪 |
| **W2-003** | DSH | G6 认领边界 | — | ✅ **已完成**（`.claims/` + `claim-check` + 11 项测试，已接进 gate） |

**W2 出口条件**：三条 lane 能各自认领簇、互不碰文件；主壳不再是唯一注册点。

---

## 三、W3（下周）：把门禁转阻塞

| ID | Owner | 任务 | 依赖 | 完成标志 |
|---|---|---|---|---|
| **W3-001** | DSH | G8 在 S2 三页标定，偏差 <0.5 画布 px 后把 G8 转阻塞 | W2-001 落地 | `gate-geometry --min-match 0.8` 在 3 页全绿；G8 进 `gate-merge` 且阻塞 |
| **W3-002** | DSH | G5 裸样式棘轮（`ui/` 外的圆角/阴影/毛玻璃只减不增） | — | 先记基线，再卡增量；有单测 |
| **W3-003** | DSH | G0 探索覆盖（`tools/explore/`），仅新模块接入时启用 | 真机可用 | 产出 `coverage.json`；树节点 <20 时判采集失败 |
| **W3-004** | AG | 65 个 `verify-*.mjs` 分类收编（维护中的补进 SUITES，废弃的移 `scripts/legacy/`） | — | `run-e2e --list` 能覆盖全部维护中的套件 |
| **W3-005** | WB | 剩余 49 个源码正则测试按簇懒改 | 每迁一簇改一簇 | 每簇迁完后 `grep -l readFileSync` 少 1 个 |
| **W3-006** | AG | `modes-and-routines` 不稳定定位（C5） | — | 全量串行跑 3 次全绿，解除隔离 |
| **W3-007** | DSH | `gate:merge` 稳定在 60s 内 | — | 连跑 3 次取中位数 |

**转阻塞的顺序**：G5 → G8 → G6 → G0。每转一条，先跑满一周确认无误报。

---

## 四、W4（再下周）：主壳瘦身

只有 W2-001、W3-005 都完成后才开始，否则会同时改主壳和测试。

| ID | Owner | 任务 | 量 | 完成标志 |
|---|---|---|---|---|
| **W4-001** | AG | 首页列表数据化（`SettingsApp.vue` 里约 600 行内联列表 → 数据 + 渲染循环） | −600 | 主壳行数下降；首页视觉零变化（G8 或截图对照） |
| **W4-002** | WB | 搜索池按页声明（`allSearchableItems` 76 行 → 各页 `searchItems`） | −76 | 搜索仍能命中全部条目（`settingsSearch.test.js` 绿） |
| **W4-003** | WB | 剩余 31 页迁出 + 返回链/导航注入下沉 | −133 以上 | `wc -l SettingsApp.vue` < 450 |
| **W4-004** | WB | `SettingsCloudBackup.vue`（2035 行）拆分 | — | 单文件 < 800 行，`SettingsCloudBackup` 相关测试绿 |
| **W4-005** | AG | `DevConsole.vue`（2701 行）拆分（最后做，返工风险最低） | — | 同上 |

> W4 的算术：`1327 − 600 − 76 − 68 = 583`，距 450 还差 133，**只能靠 W4-003 的返回链下沉补上**。
> 前三块做完不做 W4-003，主壳会停在 583 然后永远"差一点"。

---

## 五、剩余债（谁认领簇谁负责）

| 债 | 现存 | 规则 |
|---|---|---|
| 未注册的 `verify-*.mjs` | 65 个里 51 个没进 SUITES | 归该簇 owner，W3-004 统一收编 |
| 源码正则测试 | 55 个文件 | 迁一簇清一簇，W3-005 |
| `modes-and-routines` flaky | 1 套（已隔离） | C5 owner，W3-006 |
| 30 个脚本写死 `/Users/…/.gemini/…` | 30 个 | 归该簇 owner，改 `ARTIFACT_DIR` 环境变量 |
| 裸样式存量 | 待测 | G5 上线时记基线，之后只减不增 |
| `AGENTS.md` 第 40 行「48 files」 | 1 处 | 已修（现为 82 文件 / 864 用例） |

---

## 六、铁律（三条，别踩）

1. **不许删断言换绿灯**。G7 棘轮会拦；确需缩减必须同批改 `tests/baseline.json` 并说明。
2. **不许从别人的分支 checkout 文件到自己的 worktree**。要同步就合 main。
3. **合入前必跑 `gate-merge`**，红了不许合。CI 是兜底，不是第一道闸。

---

## 七、当前阻塞项（需要人）

| 项 | 卡在谁 | 怎么解 |
|---|---|---|
| WB 的 2 个 commit 未推送 | Workbuddy | `git push origin workbuddy/lane` |
| C0 出借未登记 | AG | 在 `ACTIVE_TASKS.md` 加一行（用户已同意） |
| `SettingsApp.vue` 归还 | AG | W2-001 Merged 后收回独占 |

---

## 八、Agent 直连通道（免复制粘贴）

桌面 Agent 若以 `--remote-debugging-port` 启动，端口写在
`~/Library/Application Support/<app>/DevToolsActivePort`，读到即可用 CDP 直连。

```bash
node tools/agent-bridge/read.mjs antigravity --tail 1500
node tools/agent-bridge/send.mjs antigravity "文字"        # 先加 --dry 自检
```

| 应用 | 状态 |
|---|---|
| Antigravity | ✅ 已通（自带随机调试端口），读写验证过 |
| WorkBuddy | ⬜ 需一次性带端口重启：`open -a WorkBuddy --args --remote-debugging-port=9222` |

注意：发出去的消息在对方窗口里就是「用户输入」，它会立即执行。**不可撤回，发前先 `--dry`。**
