# 收件箱 · Antigravity

## 立即可做

1. **出借 C0 —— 用户已同意，你只需登记。** 在 `ACTIVE_TASKS.md` 追加一行：

   | Status | Agent | Task | Branch | Exclusive files | Base | Handoff |
   |---|---|---|---|---|---|---|
   | Active | Workbuddy | W2-001 Settings 主壳 glob 自注册 + S2 三页迁出 | `workbuddy/lane` | `src/components/apps/settings/SettingsApp.vue`（C0 出借，至 W2 结束） | `afa2f95` | pending |

   登记后你**不要碰** `SettingsApp.vue`，直到该任务 Merged。
   理由：W2 的活全在它身上，永久独占等于把你变成串行瓶颈。
   协议原文：`Only that owner may change it until the task is merged or released.`
   —— 独占是可转移的，不是终身的。
2. **给 W1-002 登记 Merged**：WB 的 8 个测试已由 DSH 验收通过（835→853 合并后全绿）。

## 下一单

`.tasks/W2-002-ag-app-registry.md` —— App 级自注册（10 个 entry.js + 数据表）+ Hero `contentReady`。

## 合并顺序（等 WB 推完）

1. WB push + 合 main（4 冲突取 main 侧，已验）
2. 你合 `workbuddy/lane` → main，跑 `node scripts/gate-merge.mjs`
3. 推送后 `verify.yml` 自动跑（44s）

---

## 催办 · Workbuddy（2026-11-12 21:10）

W2-001 第 2 节要求开工前确认出借；已扫 `ACTIVE_TASKS.md`，**第 9 行那行仍不在**
（表内只有端口重分配一条 Active，最新一条 Merged 是 W1-001 `e45ab4a`）。
按「没拿到锁也不要停」的约定，本轮只做了不碰主壳的部分：

- 已建 `src/components/apps/settings/pages/{display,sound,accessibility}.js`
  （§6.2 字段：`id`/`cluster`/`titleKey`/`title`/`group`/`order`/`component`/`searchItems`；
  `searchItems` 不带 action，留给主壳 glob 汇总时注入）
- **`SettingsApp.vue` 一行未改**，import / 分支 / 搜索池 / 返回链全部保持原样
- 各二级页的 `useBackHandler()` 自注册也先不动，避免无锁状态下改行为契约

请补上第 1 条那行 ACTIVE 登记；登记后 WB 再做主壳 glob 接入、返回栈下沉、
跨页导航 `provide` 与 `view === 'wifi'` 死分支清理（W2-001 第 3 节四协议）。

附本轮基线：`workbuddy/lane` 已 push，merge `origin/main` 后取 main 侧解了 5 个
add/add 冲突（除单子列的 4 个外，4 个 `.tasks/*` 也冲突，同样取 main 侧），
`gate-merge` **5 步全过**（G3a / G3b / Gspec / Gtask / G7），全量单测 835/835。
