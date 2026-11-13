# CALLBACK-02 独立审查报告（v2 · 按当前实现订正）

- 审查者：DSH（不参与实现，不改对方文件，不连真机）
- 时间：2026-11-13 18:0x–18:3x
- 被审目录：`/Users/jingzhan.chen/Workbuddy/2026-08-02-23-04-06/.local-evidence/callback-02/bin/`
- 可追溯工件（已入库）：`docs/reviews/callback-02/{run-tests.mjs,codex-stub.mjs,results.json}`

## 核查版本（实现审查期间在变动，以哈希为准）

| 时刻 | `finish.mjs` | 结论差异 |
|---|---|---|
| 17:53 | （旧版） | 无 P0 |
| 18:04:09 | `2a59f2fe7581c404…` | **有 P0：boot 路径 ReferenceError** |
| **18:04:22** | **`4f1ce0b66935bff345916334448f03413b32e88fc6a33ce723aa190f1551f106`** | **P0 已修**（本报告基线） |

`ack.mjs` = `3d05a15c652f0de7…`（18:02:42）；`status.mjs` = `9aa360b7110fc64c…`（17:49:58）。
所有结论在 **4f1ce0b6** 上复现；`results.json` 记录每例退出码与关键输出。

---

## 结论摘要

| 级别 | 项 | 状态 |
|---|---|---|
| ~~P0~~ | 首次 boot 崩溃 | **已在 4f1ce0b6 修复**（`controllerPrompt(eventFileArg)`）；建议补回归测试 |
| P1 | `delivery=rejected` 仍按"已送达"落 ledger 并返回 0 | 仍存在 |
| P1 | 陈旧锁无 TTL / 无持锁者信息，崩溃后永久阻塞 | 仍存在 |
| P2 | 同 ID 改内容：拒绝正确，但无结构化回执 | 仍存在 |
| P2 | `state.repo_root` 在 boot 时固化，跨 worktree 误导 | 仍存在 |
| ✅ | 幂等、失败回执不标送达、`next_task` 严格 null、ack 串行化、artifact 必填 | 符合契约 |

---

## P1-a · `delivery=rejected` 被当作已送达

**证据**（T2，4f1ce0b6）：

```
T2 首次(rejected): code=0 calls=1
ledger: REJ → { status:'review', delivery:'rejected', task_status:'complete' }
```

契约第 15 行：`delivery` 表示**收件是否有效**。rejected = 收件无效，不应进入"已处理"，
否则 `ack` 会把一次无效投递消费成闭环，生产者失去重试信号。且 `task_status=complete` 与
`delivery=rejected` 组合自相矛盾，代码不做交叉校验。

**最小修复**：rejected 照常落 `receipts/`，但 ledger 仅在 `delivery==='accepted'` 时登记；
`finish` 对 rejected 返回非 0（3），提示可重试。

---

## P1-b · 陈旧锁永久阻塞

**证据**（T5）：预置 `.lock` 目录后

```
code=2  锁仍存在=true  finish: 锁被占用（.lock 存在），本次未送达，可重试
```

锁内无 `owner/pid/created_at`，无陈旧判定；进程被杀后需人工 `rmdir` 才能恢复。

**最小修复**：锁内写 `{pid,owner,created_at}`；超时（如 15 分钟）且 pid 不存在时回收并记
`lock.recovered`；回收前二次确认 pid 不存在，避免误抢正在跑的审查。

---

## P2-a · 同 ID 改内容：拒绝正确但无结构化反馈

**证据**（T2 重发）：

```
code=2  finish: REJECT EV-T2-0001 已存在且内容不同（…），拒绝覆盖
事件 artifact 仍为 ["art/a.txt"]（新内容被丢弃）
```

拒绝本身正确（防静默覆盖），但只输出到 stderr，`status`/回执都读不到；也未文档化
"修正内容必须换 event_id"。

**最小修复**：写 `receipts/<id>.conflict.json`（含两侧摘要），或在 stdout 输出机器可读行。

---

## P2-b · `state.repo_root` 固化

**证据**（T0 首次 boot 后 state 内容）：

```json
{ "session_id": "thread-stub-0001", "repo_root": "<boot 时的 cwd>" }
```

`finish` 实际用**调用者**的 `--repo`/cwd 作为 `-C`。于是 `status.mjs` 展示的 repo_root
可能与主控实际审查的仓库不一致（AG/DSH 报备时看到的是 workbuddy 路径）。

**最小修复**：区分 `boot_repo_root` 与 `last_repo_root`，`status` 两者都显示；
或在 resume 时校验不一致并显式告警。

---

## 已核实符合契约（附证据）

| 契约要求 | 结果 | 证据 |
|---|---|---|
| 重复事件返回原回执、不重复调用模型 | ✅ | T1：二次提交 `DUPLICATE`，stub 调用数仍 **1** |
| 失败回执不标送达、事件可重试 | ✅ | T4：`code=3`、`receipt=null`、ledger 无记录、`ack` 拒绝（exit 3） |
| `next_task` 未批准必须 null | ✅ | T3：回执带 `SET-NEW-99` → `exit 3`「必须严格为 null」 |
| ack 与 finish 互斥 | ✅ | T6：并发 ack 两者均 `exit 0`、`consumed=2/2`、ledger 一致 |
| ack 必须引用有效回执 | ✅ | T4：无有效回执时 `exit 3`，不写 `consumed/` |
| artifact 缺失不可填成通过 | ✅ | 缺 `--artifact` 即 `exit 2` |
| 首次 boot 可用（P0 回归） | ✅ | T0：`code=0`、state 与 receipt 均生成 |

---

## 未验证（不冒充已覆盖）

1. **真实 `codex exec resume` 的回执质量**：本轮全部 stub，未消耗模型额度。
   仅一次真实投递用于把本报告送主控（event `cb527c3c…`），其回执另行消费。
2. 两个不同 worktree **并发 finish**（同 `.lock`）未实测，只测了单目录内并发 ack。
3. `-C` 改变后 codex 是否尊重新 cwd（stub 不解析 cwd）。
4. 契约第 24–27 行两项真实验收（WB SET-WB-01 / AG SET-AG-01a）属主控职责，本轮未跑。

## 边界

只读审查，未修改 `bin/` 任何文件；stub 与测试仅在本仓 `docs/reviews/callback-02/`；
未重启客户端、未开调试端口、未连真机、未跑全量浏览器。
