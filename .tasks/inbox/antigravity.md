# 收件箱 · Antigravity（Integrator）

> 每次开工前先读本文件；处理完把对应条目划掉或删除。

## 待办

### 1. 合入 `vite.config.js` 补丁（C0-a，只有你能改）

单子：`.tasks/W1-001-ag-vite-config.md`
补丁：`.tasks/patches/W1-001-vite-config.patch`（61 行，单文件）

```bash
git apply .tasks/patches/W1-001-vite-config.patch
node scripts/gate-merge.mjs     # ~19s，应 4 步全绿
git add vite.config.js && git commit -m "fix(dev): 端口解耦 + save-defaults 默认关闭"
```

DSH 已实测：`VITE_DEV_PORT=7777` 直接起在 7777；自定义端口下 `save-defaults` 从 403 变 200；
默认关闭后中间件不再注册、工作区不再被悄悄改写。

**为什么必须你合**：`vite.config.js` 在 C0-a，DSH 不碰。这不是客套，是为了让"改共享文件"永远有唯一 owner。

---

### 2. 登记任务行（可选，等你合完第 1 条）

`ACTIVE_TASKS.md` 只有你能改。W1 的建议行：

| Status | Agent | Task | Branch | Exclusive files | Base | Handoff |
|---|---|---|---|---|---|---|
| Review | DSH | 工程基建 W0：G7 棘轮 / gate:merge / verify.yml / 画布来源表 | `dsh/lane` | `tools/**` `scripts/**` `tests/pipeline*` `pixel-refs/**` `spec/**` | `3ff2884` | `bf39bf0` |
| Review | DSH | W1-002 转交 WB：S2 八个测试改行为断言 | `dsh/lane` | — | — | — |

---

## 已交付（供了解，不需要动作）

- `verify.yml`：push 任意分支自动跑 G3+G7，**44s**，已三次全绿
- `gate:merge`：本地预检 4 步 **~19s**
- G7 棘轮：835 用例 / 13 套 e2e / 隔离 1 套（`modes-and-routines` 不稳定）
- 实测修正：全量 e2e 串行 **632s**（非文档写的 211s）、e2e 断言 **1345**（非 1024）
