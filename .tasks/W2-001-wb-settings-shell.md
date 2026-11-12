# W2-001 · Workbuddy：Settings 主壳自注册 + S2 三页迁出

- 类型：常规任务
- 状态：Active
- 簇：C0-a（`SettingsApp.vue` 部分，**需 Integrator 出借独占权**）+ C2
- Owner：Workbuddy
- 依据：`docs/tOS-pipeline-1.0.md` §6.2 / §6.3 / §6.5

## 0. 先做这两步（不做则一切基于旧基线）

```bash
git push origin workbuddy/lane
git merge origin/main
# 冲突固定是这 4 个，全部取 main 侧（merge main 时 main 是 theirs）：
for f in pixel-refs/sources.json scripts/check-assert-ratchet.mjs \
         scripts/gate-merge.mjs tests/baseline.json; do
  git checkout --theirs -- "$f"
done
git add -A && git commit
node scripts/gate-merge.mjs        # 应 5 步全过，853 用例
```

> DSH 已做过一次试合并验证：解完这 4 个文件后是 `853 pass / 0 fail`，门禁 5 步全过（48.2s）。

## 1. 目标

把主壳从「34 个页面静态 import + v-if 切页」改成「glob 自注册」，并迁出 S2 三页
（显示 / 声音 / 无障碍）。

## 2. 关键约束：C0 锁

`SettingsApp.vue` 属 C0-a，默认只有 Integrator 能改。**用户已于 2026-11-12 同意出借**，
只差 AG 在 `ACTIVE_TASKS.md` 登记一行。开工前扫一眼那行在不在；不在就先做右侧"能先做"的部分，
同时在 `.tasks/inbox/antigravity.md` 里催一下——**不要自己去改 ACTIVE_TASKS.md**。

**没拿到锁也不要停**，先做不碰主壳的部分：

| 能先做 | 不能做 |
|---|---|
| 建 `settings/pages/display.js` `sound.js` `accessibility.js`（新文件） | 改 `SettingsApp.vue` 任何一行 |
| 各页组件内部把返回拦截改 `useBackHandler()` 自注册 | 删主壳里的 import/分支 |
| 写 `pages/*.js` 的 `searchItems` 自声明 | 改搜索池 |

## 3. 四协议下沉（缺一条就不算完成）

1. **import → glob**：`import.meta.glob('./pages/*.js', { eager: true })` 汇总路由表、标题表、搜索池
2. **返回栈**：删掉主壳 22 处 `.back?.()` + 3 处 `.back()` 的轮询判断链；有三级页的二级页在自身 `useBackHandler()`
3. **跨页导航**：主壳 `provide({ push, pop, pushUnimplemented })`，淘汰定制 `@open-*`
4. **清死分支**：`view === 'wifi'` 重复 2 次，其一失效（约 914 行）

## 4. 验收（可机器验，别用"看起来好了"交活）

```bash
# ① 定义性指标：加一个页面，主壳不动
cat > src/components/apps/settings/pages/demo.js <<'JS'
export default { id: 'demo', titleKey: 'demo', cluster: 'C2', order: 999,
  component: () => import('../SettingsDisplay.vue') }
JS
git diff --stat src/components/apps/settings/SettingsApp.vue   # 必须是空
rm src/components/apps/settings/pages/demo.js

# ② 全量门禁
node scripts/gate-merge.mjs      # 5 步全过

# ③ 主壳瘦身副产物
wc -l src/components/apps/settings/SettingsApp.vue   # 记录，不作为本单验收
```

## 5. 红线

- **不许删断言换绿灯**（G7 棘轮，基线 853）
- S2 八个测试已由你转成运行时断言，**别再改回读源码**
- 只碰 `src/components/apps/settings/**` 与 `SettingsApp.vue`；`ui/**` 只增不改
