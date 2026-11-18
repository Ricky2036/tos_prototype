# SET-SYS-02 · 设置→系统 页面：按真机实测把四处间距改对（处方已机器验证）

- size: S
- status: ready
- priority: P1
- claim: C0-a
- owner: Antigravity（`tokens.css` 属共享文件，需集成者持锁；页面文件在 AG lane）
- 提出/验证：DSH（`dsh/lane` @ `40452cb`）
- depends: 无（处方已用运行时注入在**当前 HEAD 构建**上验证为 13/13 通过）

## 为什么现在才提

`SET-SYS-01` 在 11-14 实现时，9 个子页零真机证据；页面几何从未被任何脚本量过。
现在补了契约与判决器（`tools/accept/`、`spec/settings/system.geometry.json`），
把「设置→系统」判成 2/13 通过，并把 13 条红拆成四件独立的间距问题——**处方已用运行时注入验证到 13/13**。

## 实物证据

- 契约：`spec/settings/system.geometry.json`（13 节点 = 2 页头 + 10 行 + 1 分组头，来自 `.local-evidence/SET-DSH-01/system.xml`）
- 行距指标：`spec/settings-system.list-metrics.json`（行距 48.8 画布 px、首行中心 128.1、逐卡偏移）
- 模拟处方：`tools/accept/recipes/settings-system-prescription.mjs`
  - 未注入：**2/13 pass**
  - 注入后：**13/13 pass，exit 0**（同一构建 `/tmp/dist-head` = HEAD `247e92b`）

## 要改的四件事（每件都有实测来源）

### 1）`src/styles/tokens.css`（共享，需集成者持锁）

```diff
-  --safe-top: 54px;           /* 状态栏高度 */
+  --safe-top: 42px;           /* 状态栏高度：对齐 Infinix X6878 实测（返回按钮顶边 141 device px → 42 画布 px） */
```

> 影响面：`--nav-h = --safe-top + 46`，**所有带页头的设置页整体上移 12px**。
> 合并前至少要对所有已有契约的页面跑一遍 `tools/accept/accept.mjs`；没有契约的页面属于未知，见下方"不许做什么"。

### 2）`src/components/apps/settings/system/SettingsSystem.vue`

```diff
 .system-body {
-  padding: 12px 16px 40px;
+  padding: 15.7px 16px 40px;
   display: flex;
   flex-direction: column;
-  gap: 12px;
+  gap: 0;                       /* 真机四段间隔不等，见下 */
 }
 
+.system-card[data-test='system-card-2'] { margin-top: 24.6px; }
+.group-header[data-test='system-group-header'] { margin-top: 19.7px; margin-bottom: 3.1px; }
+.system-card[data-test='system-card-3'] { margin-top: 3.1px; }
+.system-card[data-test='system-card-4'] { margin-top: 23.2px; }
+
+/* 行距：真机 163.8 device px = 48.8 画布 px（当前 ListCell 是 min-height:52px） */
+:deep(.list-cell) { min-height: 48.8px; }
```

> 数值来源：真机 `03-system-page.png` 的行内容中心间距（6 个样本 162.0–169.0 device px，中位 163.8）
> 与首行锚点 128.1 画布 px；四段卡片间距按「卡片首行内容中心相对首行中心」反解：
> +171.0 / +323.9 / +493.5 画布 px（对应上方四个 margin）。
> **不要把这些数字改回整数**——它们是从 3.355 device/画布 的换算里来的，取整会重新引入 1–2px 误差。

## 验收（改完必须跑；两条都要）

```bash
# ① 真实验收：不再注入任何东西，直接对产品代码判
node tools/accept/accept.mjs \
  --spec spec/settings/system.geometry.json \
  --url http://127.0.0.1:1111/ --page settings/system \
  --recipe tools/accept/recipes/settings-system.mjs \
  --build-dir dist --list-metrics spec/settings-system.list-metrics.json \
  --out reports/accept/SET-SYS-02
# 期望：PASS 13/13，exit 0

# ② 回归：全局 token 改动后，已有契约的页面必须逐页跑
node tools/contract/spec-coverage.mjs --repo . --spec-root spec   # 看哪些页有契约
```

签核由**非实现者** lane 执行：

```bash
node tools/gate/sign.mjs sign --verdict reports/accept/SET-SYS-02/verdict.json --by dsh --role accept
```

## 不许做什么

- **不许**在没跑 ① 的情况下声称完成（11-14 的教训：单测绿 ≠ 界面对）。
- **不许**为了让判决变绿去改 `spec/`（契约来自真机；改它是篡改真相，`gate-acceptance` 有节点棘轮会拦）。
- **不许**把 `--safe-top` 改完就合并：它影响所有设置页，必须逐页回归；没有契约的页面要在 PR 里显式列出（"未知影响面"）。
- **不许**把四段 margin 合并成一个 `gap`——真机这四段本来就不等长。

## 完成后

1. 更新 `.agent-assignments/ACTIVE_TASKS.md`（集成者）。
2. 删除 `tools/accept/recipes/settings-system-prescription.mjs`（它是模拟处方，验完即弃；真实代码改完就该用 `settings-system.mjs` 直接绿）。
3. 契约与判决器留在仓库里，此后每次改动 `settings/system` 都会被 `gate-acceptance` 盯住。