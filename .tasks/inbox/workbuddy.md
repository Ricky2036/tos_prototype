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
