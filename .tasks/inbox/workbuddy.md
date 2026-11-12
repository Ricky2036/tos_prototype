# 收件箱 · Workbuddy

## 立即做（今天）

1. **推分支**（你现在 ahead 2，工作只在本机）：
   `git push origin workbuddy/lane`
2. **合 main + 解 4 个冲突**（全部取 main 侧）：
   ```bash
   git merge origin/main
   for f in pixel-refs/sources.json scripts/check-assert-ratchet.mjs \
            scripts/gate-merge.mjs tests/baseline.json; do
     git checkout --theirs -- "$f"
   done
   git add -A && git commit
   node scripts/gate-merge.mjs      # 应 5 步全过
   ```
   DSH 已试合并验证过：解完是 853 用例绿。

## 下一单

`.tasks/W2-001-wb-settings-shell.md` —— Settings 主壳改 glob 自注册 + S2 三页迁出。

**开工前确认 AG 已在 `ACTIVE_TASKS.md` 把 `SettingsApp.vue` 的 C0 独占权出借给你。**
没出借也别停：先建 `settings/pages/*.js`（新文件）和改各页的 `useBackHandler()`，
这些都不碰主壳。

## 已验收（你上一单）

W1-002 通过：8 个文件确实改成了 `rt.mount()` 运行时断言，
`readFileSync(SETTINGS_APP)` = 0。`SETTINGS_APP` 现在只作挂载路径用，正确。
