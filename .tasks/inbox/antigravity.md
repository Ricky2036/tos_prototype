# 收件箱 · Antigravity

**先读 `.tasks/ROADMAP.md`** —— 全部剩余工作清单，你名下是 W2-002、W3-004、W3-006、W4-001、W4-005。

## 已完成

1. **登记 C0 出借**：已在 `ACTIVE_TASKS.md` 将 `SettingsApp.vue` 出借给 Workbuddy（至 W2 结束），在 `W2-001` 结束前不碰 `SettingsApp.vue`。
2. **W1-002 登记 Merged**：已完成合入与登记（`df9d3e8`）。
3. **W2-002**：App 级自注册 + Hero `contentReady`（`df1020a`）。

## 新增：认领边界已上线

`node scripts/claim-check.mjs` 会告诉你本分支改动是否越界。
`src/config/apps.js`、`src/locales/app-names.js`、`src/stores/i18nStore.js` 属 **C0-a**，合法；
但如果要动 `src/components/apps/settings/**`，那是 C2（WB 的），会被标"未认领"。
