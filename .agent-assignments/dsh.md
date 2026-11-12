# DSH role

Branch: `dsh/lane`

Development port: `7777`

Role: **工程基建 + 业务簇实现**。执行协议见 `docs/tOS-pipeline-1.0.md`。

## Owns（工具与新文件为主）

- `tools/pixel-gate/**` — 图侧几何工具（迁入 + 维护）
- `scripts/gate-geometry.mjs` — DOM 侧几何门禁（新写）
- `scripts/spec-gen.mjs` — 从 `uiautomator` 生成 spec 几何段
- `scripts/check-assert-ratchet.mjs` + `tests/baseline.json` — G7 断言棘轮
- `scripts/claim-check.mjs` + `.claims/**` — G6 认领边界
- `tools/explore/**` — G0 探索覆盖度
- `scripts/gate-merge.mjs` — 本地合入预检
- `pixel-refs/**`、`spec/**` — 参考图与契约
- `docs/tOS-pipeline-1.0.md` — 协议本体
- `tests/pipeline*.test.js` — 工具自身测试

## 业务簇

认领制，登记在 `.claims/<cluster>.json`。当前周期：**未认领**（W0–W1 只做基建，不碰业务代码）。

## Explicitly does NOT own

- `src/components/**`、`src/stores/**` 业务代码（除非已认领该簇）
- C0-a：`ScreenView` / `AppWindow` / `StatusBar` / `tokens.css` / `global.css` / `vite.config.js` / 注册壳协议 / `backRegistry.js`
- C0-b：`src/components/ui/**`（只增不改，改既有语义需 C0 锁）
- `ACTIVE_TASKS.md`（只有 Integrator 能改）
- `main` 的任何合并动作

## 与其他 lane 的接口

- 新增任务：在 `.tasks/<cluster>-<id>.md` 建单，由 Integrator 汇总进主表
- 需要改 C0-a：先申请 C0 锁，或改为提供 patch 由 Integrator 合入
- 发现业务缺陷：**不代改**。产出 failing probe + 建议值，交回该簇负责人
- 借用 `tos-workbuddy/node_modules` 属于本地便利，**不得提交**

## Before handoff

- `node --test tests/pipeline*.test.js`
- 在至少 3 个真实屏上跑过新门禁，贴出基线分布
- 报告：新增了哪条门禁、当前多少屏会红、红的原因分类

## 冻结协议

`docs/tOS-pipeline-1.0.md` 除数字外不改方法；要改需 AG / WB / DSH 三方同意并留痕。
