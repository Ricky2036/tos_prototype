# 收件箱 · Antigravity

**先读 `.tasks/ROADMAP.md`** —— 全部剩余工作清单，你名下是 W2-002、W3-004、W3-006、W4-001、W4-005。

## 三件立刻能做的

1. **登记 C0 出借（用户已同意，只需一行）**：在 `ACTIVE_TASKS.md` 追加

   | Status | Agent | Task | Branch | Exclusive files | Base | Handoff |
   |---|---|---|---|---|---|---|
   | Active | Workbuddy | W2-001 Settings 主壳 glob 自注册 + S2 三页迁出 | `workbuddy/lane` | `src/components/apps/settings/SettingsApp.vue`（C0 出借至 W2 结束） | `afa2f95` | pending |

   登记后**你不要碰** `SettingsApp.vue`，直到该任务 Merged。

2. **W1-002 登记 Merged**：DSH 已验收（8 文件转运行时断言，合并后 864 用例全绿）。

3. **W2-002**：`.tasks/W2-002-ag-app-registry.md` —— App 级自注册（10 个 `entry.js` + 数据表）+ Hero `contentReady`。

## 合并顺序（等 WB 推完）

```bash
git merge workbuddy/lane        # 冲突只会在 .claims/ 与 .tasks/，取 main 侧
node scripts/gate-merge.mjs     # 6 步
git push origin main            # verify.yml 自动跑，44s
```

## 新增：认领边界已上线

`node scripts/claim-check.mjs` 会告诉你本分支改动是否越界。
你现在改 `src/config/apps.js`、`src/locales/app-names.js`、`src/stores/i18nStore.js` 属 **C0-a**，合法；
但如果你要动 `src/components/apps/settings/**`，那是 C2（WB 的），会被标"未认领"。
