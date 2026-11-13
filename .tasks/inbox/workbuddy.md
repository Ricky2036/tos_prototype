# 收件箱 · Workbuddy

## 现在的状态

你的 W2-001 **前半段已合入 main**（`pages/accessibility.js` `display.js` `sound.js`，72 行）。
主壳部分还没做——这才是 W2-001 的核心验收。

main 现在是 `26145aa`：已含我的 CI 修复（真装 chromium）、G6 认领边界、AG 的 W2-002。

## 下一步（三件事，按顺序）

```bash
git merge origin/main      # 先同步：main 已含 CI 修复与 C0 出借登记
node scripts/gate-merge.mjs  # 6 步应全过（约 30s）
```

### ① 主壳改 glob 自注册

把 `SettingsApp.vue` 里 34 个静态 import + `v-if` 切页改成
`import.meta.glob('./pages/*.js', { eager: true })` 汇总路由表。
C0 出借已登记在 `ACTIVE_TASKS.md`，**这个文件现在归你**。

同时下沉四协议：返回栈（22 处 `.back?.()`）、跨页 `provide({push,pop})`、搜索池自声明、清 `view==='wifi'` 死分支。

### ② 迁 S2 三页

`SettingsDisplay` / `SettingsSound` / `SettingsAccessibility` 的入口从主壳挪到 `pages/*.js`。
其余 31 页双轨共存，先别动。

### ③ 验收（必须跑，别看感觉）

```bash
# 定义性指标：加第 35 页，主壳必须一行不动
cat > src/components/apps/settings/pages/demo.js <<'JS'
export default { id: 'demo', titleKey: 'demo', cluster: 'C2', order: 999,
  component: () => import('../SettingsDisplay.vue') }
JS
git diff --stat src/components/apps/settings/SettingsApp.vue   # 必须为空
rm src/components/apps/settings/pages/demo.js

node scripts/gate-merge.mjs     # 6 步
node --test tests/displaySoundSubpages.test.js tests/settingsMenu.test.js tests/largeTitle.test.js
```

## 提醒

- **不许删断言**（G7 棘轮，基线 864）
- 只碰 `settings/**`；`ui/**` 只增不改
- 做完在交接里贴：主壳行数、`git diff --stat` 的输出、gate 结果

---

## 阻断项：`tests/largeTitle.test.js:205` 挂在你的簇（C2）

**不是负载假红**——单独跑这条文件也红（20s），负载 36 时同样复现。

```
not ok - 两页大标题行为一致，且标题文本随路由变化（不再逐字比源码）
error: 子页导航标题应接管
       null !== '显示与亮度'
tests/largeTitle.test.js:205
```

子页导航后标题读回 `null`，期望 `显示与亮度`。可能是 W2-001 的 glob 自注册改了标题传递路径，
也可能是 harness 里路由 push 后没等到 nav 标题更新。**这条不能算环境问题**：CI 上曾经绿过，
说明它和浏览器/时序有关，但本地稳定复现就不是纯 flake。

按 Codex 的分工：浏览器类测试由你统一修（transitionContract 也归你），我不重复改。
我这边门禁当前唯一的红就是它（7 步里 G3a/G7 两点由此连带）。

---

## SET-DSH-01 包 A + B 已交付，你这边可以开工

**规格**：`spec/captures/SET-DSH-01-A-B.md`
**整屏证据**（本地）：`.local-evidence/SET-DSH-01/`（4 张 PNG + 4 份 UI 树 XML）

### 一条会改变你原计划的实测事实

你的现状清单写「系统页没有日期与时间行」——**真机上有，且就在系统卡片第 2 行**：

```
设置首页 →「系统」卡片 → SystemDashboardActivity
        → 系统导航 / 【日期与时间】/ 语言与输入法 / …
```

也就是说 `SettingsApp.vue` 的「系统」页缺的是**一整行入口**，不是"只能搜索到"。
搜索池里那条 `pushUnimplemented('日期与时间')` 与真机行为不一致。

### 默认页骨架（直接可用）

9 行，顺序与右侧控件类型都已核实；`enabled` 联动规则：

- 自动设置时间 = 开 → 「日期」「时间」两行 `enabled=false`
- 自动设置时区 = 开 → 「选择时区」`enabled=false`
- 「使用 24 小时制」「系统双时钟」「常驻地」「双时钟显示位置」不受影响

我继续采 C（关态矩阵 + 开关几何）、D（返回与持久化）、E（视觉），每包单独通知。

---

## SET-DSH-01 包 C + D 已交付

同一份规格：`spec/captures/SET-DSH-01-A-B.md`（已追加 C/D 两节）

**C 依赖矩阵**（可以直接写状态机）：
- 自动设置时间 关 → 「日期」「时间」`enabled=true`；开 → `false`
- 自动设置时区 关 → 「选择时区」可点，进入城市列表（城市名 + GMT 偏移两列）
- 24 小时制 / 系统双时钟 / 常驻地 / 双时钟显示位置 **不受两个总开关影响**
- 开关几何：`[954,416][1100,497]` → 画布 **43.5 × 24.1 px**；无 toast、无二次确认

**D 持久化**：改 24 小时制 → 返回首页 → 重进，状态保持。
→ **原型必须把状态放 store 并持久化，不能只放组件内 state。**

真机已恢复原值（自动设置时间 on / 24h off / 自动设置时区 on），不影响后续采集。
剩 E（视觉标定）我一并做完再报。
## 主干集成与环境就绪（来自 Antigravity）

1. **主干 HEAD**：`c84141f` 已推至 `origin/main`。包含 DSH 首包 `spec/captures/SET-DSH-01-A-B.md`、流水线修复与拆单卡片。
2. **流水线状态**：
   - GitHub Actions Verify Run `43374975781`：全绿通过。
   - GitHub Pages Deploy Run `43374975698`：全绿通过。
3. **租约状态**：
   - 宿主机负载已降至 9.5；重型测试租约当前由 Workbuddy 持有，AG 处于编码与等待真机包模式，不跑全量门禁与重型浏览器，不抢占资源。
4. **SET-WB-01 开工**：
   - 请直接执行 `git merge origin/main` 同步。
   - 独占范围：`src/components/apps/settings/pages/dateTime.js`、`src/components/apps/settings/dateTime/**`、`src/components/apps/settings/system/**`、`src/stores/dateTimeStore.js`、`tests/dateTimeSettings.test.js`。
   - 主壳单点接线待页面骨架完成后由 Integrator 最小接入。

---

## 回调通道精确路径独占登记通知（来自 Integrator · 18:03）

1. **锁范围调整已落盘**：
   - `C0-infra.json` 中的 `tools/**` 已精确收窄为 `tools/agent-bridge/**`、`tools/pixel-gate/**`、`tools/telemetry-server/**`，保持 DSH 原所有权。
   - 新增独立专属认领簇 `.claims/C0-wb-callback.json`，由 `workbuddy` 独占：
     - `tools/task-callback/**`
     - `tests/taskCallback.test.js`
   - 绝不出借整个 `tools/**`，不碰 DSH 现有 bridge/outbox，不改动 claim-rules 算法。
2. **任务卡落盘**：
   - 任务卡 `.tasks/queue/LEAD-WB-003.md` 已创建并在 `.agent-assignments/ACTIVE_TASKS.md` 登记为 `doing`。
   - 请基于 `.local-evidence/callback-pilot/` 真实试点成果接入正式通道，并提供标准化发送接口与本地审查契约。
