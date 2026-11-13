# CALLBACK-02 独立审查报告 · v5

- 审查者：DSH（不参与实现，不改对方文件，不连真机，不跑全量浏览器）
- 被审目录：`/Users/jingzhan.chen/Workbuddy/2026-08-02-23-04-06/.local-evidence/callback-02/bin/`
- 复现工件（入库，可独立运行）：`docs/reviews/callback-02/{run-tests.mjs,codex-stub.mjs,results.json}`
- 运行方式：`node docs/reviews/callback-02/run-tests.mjs`（脚本按自身位置解析 stub，不依赖 cwd；
  用例全部使用 `/tmp/cb02-review/*` 独立 `CB02_HOME`，不触碰共享目录、不调真实模型）

## 被审版本（完整 sha256，`results.json` 内同名记录）

| 文件 | sha256 |
|---|---|
| `finish.mjs` | `8ee8d585508a47d5e3b6a26a4ca7673d33e6823875eabe8f5129e105aa1e378d` |
| `ack.mjs` | `9fdede9e95bc1226d197c9dc3fff90f8291b06565d54f29705c6ebc980a5c85f` |
| `unlock.mjs` | `e0a479cd2d322e6f134a9fbc16d48f4eee8fe4f17043285f498024f700b27cea` |
| `status.mjs` | `9aa360b7110fc64cf6a16fe43b168d17e0f6cc8c8f4ef2f1a2a24232e7e637d1` |

> 审查期间实现变动 4 次（`2a59f2fe` → `4f1ce0b6` → `8ee8d585` …）。本报告只对上表版本负责；
> 结论随版本失效，`results.json` 每次运行会重算哈希。

## 逐项结果（实测）

| 用例 | 契约要求 | 实测 | 判定 |
|---|---|---|---|
| T0 | 首次 boot 可用 | `code=0`，`state.json` 生成 | ✅ |
| T1 | 重复事件返回原回执、不额外调模型 | `DUPLICATE`，`extraModelCalls=0` | ✅ |
| T2 | `delivery=rejected` 不得按送达处理 | `finish code=3` ✅；`ack code=3` ✅；**但 ledger 仍写入** ❌ | ⚠️ P1 |
| T2b | 同 ID 内容冲突需结构化拒绝 | `code=2`，`structured=true` | ✅ |
| T3 | 未批准 `next_task` 必须为 null | `code=3`「必须严格为 null」 | ✅ |
| T4 | 模型失败不标送达、不可消费 | `code=3`，ledger 无记录，`ack code=3` | ✅ |
| T5 | 死 pid 残留锁可释放 | `code=0`，锁消失 | ✅ |
| T5b | 活 pid 锁不得强抢 | `code=2`，锁保留 | ✅ |
| T6 | 并发 ack 不丢更新 | 退出码 `[0,2]`，`consumed=1` | ⚠️ P2 |
| T7/T7b | finish/ack 成功后锁必须释放 | 两例 `lockGone=true` | ✅ |

## P1 · `delivery=rejected` 仍写入 ledger

```
T2: finish code=3 · ack code=3 · ledgerHasTask=true
ledger: T2 → { status:'idle', delivery:'rejected', task_status:'complete' }
```

退出码已按建议改为失败，`ack` 也拒绝消费——**但 ledger 仍登记了 `delivery=rejected` 且
`task_status=complete`**，`status.mjs` 会照此展示，读者容易把"收件无效"读成"任务完成"。

**最小修复**：rejected/失败一律不写 `tasks[task]`；若要留痕，写到独立 `deliveries.json`
（或给条目加 `recorded:false` 标记并在 `status` 中显式渲染为"收件无效"），不得让
`task_status` 与 `delivery` 组合出"rejected + complete"这种自相矛盾展示。

## P2 · 并发 ack 的第二个调用返回 2（可重试）

`T6: codes=[0,2], consumed=1`。串行化本身正确（不丢更新），但契约未写明"发送方应重试"。
建议在契约或 README 写明：`ack` 遇到锁占用是**可重试**，不是失败。

## P2 · `state.repo_root` 在 boot 时固化

`finish` 用调用者的 `--repo`/cwd 作为 `-C`，而 `status.mjs` 展示的是 boot 时的 `repo_root`。
跨 worktree 报备时，展示值与实际被审仓库可能不一致。建议区分
`boot_repo_root` / `last_repo_root` 并同时展示。

## 审查过程中被修复的三个缺陷（留档）

审查期间先后实测并上报，随后在实现中修复：

1. **boot 路径 `ReferenceError: eventFile is not defined`**（`2a59f2fe`，18:04:09）→ `4f1ce0b6` 修。
2. **锁永不释放**：`releaseLock()` 用 `rmdirSync(dir,{recursive:true})`，Node 26 抛错且被空 `catch`
   吞掉，导致每次成功运行都留下锁、下一次必被挡（受控实测：成功返回后 `.lock` 仍在）→ `8ee8d585` 修。
3. **`unlock.mjs` 同一废弃 API**，唯一官方恢复入口失效 → `e0a479cd` 修。

旁证：审查期间连续观察到三把「持有者 pid 已死」的残留锁（84714 / 87159 / 87702）。

## 流程问题（比单点缺陷更值得处理）

**实现变动快于审查周期**：20 分钟内 4 个版本，每次复审结论都会滞后。
建议：复审前冻结一个候选 SHA（`git` 或目录快照），报告与其绑定；修复方改完先冻结再送审，
否则"审查通过"永远追不上代码。

## 未验证

1. 真实 `codex exec resume` 的回执质量（本轮全部 stub）。
2. 两个不同 worktree 同时 `finish` 的真实竞争。
3. `-C` 改变后 codex 是否尊重新 cwd。
4. 契约第 24–27 行两项真实验收属主控职责，本轮未代为判定。
