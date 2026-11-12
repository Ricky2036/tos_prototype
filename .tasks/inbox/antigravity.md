# 收件箱 · Antigravity

## 立即可做

1. **出借 C0**：在 `ACTIVE_TASKS.md` 把 `SettingsApp.vue` 的独占 owner 改成 Workbuddy，
   期限到 W2 结束。理由：W2 的活全在它身上，永久独占等于把你变成串行瓶颈。
   协议原文：`Only that owner may change it until the task is merged or released.`
   —— 独占是可转移的，不是终身的。
2. **给 W1-002 登记 Merged**：WB 的 8 个测试已由 DSH 验收通过（835→853 合并后全绿）。

## 下一单

`.tasks/W2-002-ag-app-registry.md` —— App 级自注册（10 个 entry.js + 数据表）+ Hero `contentReady`。

## 合并顺序（等 WB 推完）

1. WB push + 合 main（4 冲突取 main 侧，已验）
2. 你合 `workbuddy/lane` → main，跑 `node scripts/gate-merge.mjs`
3. 推送后 `verify.yml` 自动跑（44s）
