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
| T2 | `delivery=rejected` 不得按送达处理 | `finish code=3`、`status=idle`、`ack code=3`（拒收被显式记录，非"标记送达"） | ✅（原 P1 已撤回，见下） |
| T2b | 同 ID 内容冲突需结构化拒绝 | `code=2`，结构化 ✅；**但覆盖了原回执** ❌ | ⚠️ P1（新） |
| T3 | 未批准 `next_task` 必须为 null | `code=3`「必须严格为 null」 | ✅ |
| T4 | 模型失败不标送达、不可消费 | `code=3`，ledger 无记录，`ack code=3` | ✅ |
| T5 | 死 pid 残留锁可释放 | `code=0`，锁消失 | ✅ |
| T5b | 活 pid 锁不得强抢 | `code=2`，锁保留 | ✅ |
| T6 | 并发 ack 不丢更新 | 退出码 `[0,2]`，`consumed=1`，锁冲突提示明确"稍后重试" | ✅（原 P2 已撤回） |
| T7/T7b | finish/ack 成功后锁必须释放 | 两例 `lockGone=true` | ✅ |

## 已撤回的两条（经主控指出后复核，判据不成立）

**撤回 1 · `delivery=rejected` 写 ledger。** 契约区分 `delivery`（收件有效性）与
`task_status`（任务验收）。实测当前实现对 rejected 返回 `code=3`、ledger 记 `status='idle'`、
`ack` 拒绝消费——"记录拒收"不等于"标记送达"。我此前用 `ledgerHasTask=true` 下结论属判据错误，
**撤回**。

**撤回 2 · 并发 ack 未文档化。** 契约第 11 行已写明"并发失败可重试，不标送达"，
`ack` 的锁冲突提示也明确"稍后重试"。**撤回**。

## P1 · 内容冲突会覆盖已送达的回执（新，实测算到）

**复现链**（`/tmp/cb02-ovr`，全部 stub）：

```
1) finish --event-id EV-OVR-0001 --artifact a.txt
   → OK … delivery=accepted；receipts/EV-OVR-0001.json 内含 receipt

2) finish --event-id EV-OVR-0001 --artifact b.txt      # 同 id，内容不同
   → REJECT … 拒绝覆盖；冲突记录 -> receipts/EV-OVR-0001.json   ← 同一路径！

3) 检查回执文件
   receipt 字段 = 缺失   delivery = None   error = content-conflict

4) ack --event EV-OVR-0001
   → ack: 回执无有效内容（前次失败或冲突记录），不能消费确认；请重试 finish
```

**危害**：一次错误重发会让**已经成功送达**的事件永久失去回执、无法被消费确认；
审计链被覆盖，且提示文案"拒绝覆盖"与实际行为相反，误导操作者。
（后续再发同样内容会重新调模型并覆盖回冲突记录，等于用一次模型调用"恢复"，原回执不可追回。）

**最小修复**：冲突记录另存 `receipts/<id>.conflict.json`（或 `conflicts/<id>-<ts>.json`），
**绝不写已存在有效回执的路径**；`ack` 只读主回执文件。

**建议用例**：T2b 增加断言——冲突后 `receipts/<id>.json` 的 `receipt` 仍在、且仍可 `ack`。

## P1（已撤回，留档）· `delivery=rejected` 仍写入 ledger

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
