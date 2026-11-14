# COORD-WATCH-01 交付报告 · 协作监测（事件记录 + 低成本巡检）

- 分支：`dsh/lane`
- 代码提交：`a9947fc`（本报告单独一提交）
- 范围：**新增** `tools/team-watch/**`、`.tasks/queue/COORD-WATCH-01.md`、本报告；未改 `tools/task-callback/**`、未动旧 receipts、未改任何其他 worktree 源码
- 运行进程：`team-watch watch` **pid 69842**（60s 定时）
- 共享状态：`/Users/jingzhan.chen/Workbuddy/2026-08-02-23-04-06/.local-evidence/team-watch/`
  （由 `git rev-parse --git-common-dir` 的上一级解析，四个 worktree 共用；`.local-evidence/` 已在 .gitignore）
- 端口：不启动新服务；只读探测 9999（集成验收）+ 7777/5555/1111（lane 环境信息）

## 一、精确文件

```
tools/team-watch/
├── watch.mjs                 # CLI：scan / emit / watch / status / ack / start / stop
├── README.md                 # 契约、单行 emit 用法、判定规则、限制
├── lib/config.mjs            # 从 git common-dir / worktree list 推导默认配置，可 --config 覆盖
├── lib/git.mjs               # HEAD + dirty 内容哈希 + 任务卡 status/owner + docs/reports（只读）
├── lib/scan.mjs              # 快照/对比/进展/停工判定
├── lib/events.mjs            # 幂等 emit、冲突记录、ack、status 聚合
├── lib/summary.mjs           # summary.json/.md（有界、只写事实）
├── lib/store.mjs             # 原子写、JSONL 追加、独占锁、pid 存活判断
├── lib/http.mjs              # 端口探测（超时/离线给出原因）
├── lib/logger.mjs            # 2MB 滚动日志
└── test/teamWatch.test.js    # 11 例隔离测试（临时 git 仓库 + 临时 home）
.tasks/queue/COORD-WATCH-01.md
docs/reports/COORD-WATCH-01.md
```

## 二、命令（可直接复制）

```bash
# 单次只读扫描（首次只建 baseline）
node tools/team-watch/watch.mjs scan
node tools/team-watch/watch.mjs scan --json

# 显式报备（AG/WB/DSH 单行）
node tools/team-watch/watch.mjs emit --task SET-BAT-01 --agent dsh --event delivery-ready \
  --sha 40bb303 --artifact docs/reports/SET-BAT-01-delivery.md --next-action "等 AG 集成到 9999"

# 后台巡检 / 停止（只动自己 pid）
node tools/team-watch/watch.mjs start
node tools/team-watch/watch.mjs stop

# 只读查看 / 标记已读（不代表验收完成）
node tools/team-watch/watch.mjs status [--json]
node tools/team-watch/watch.mjs ack --event <event_id> --by antigravity --note "看过"

# 测试
node --test tools/team-watch/test/teamWatch.test.js
```

`--event` 仅接受 `delivery-ready | blocked | test-failed | integrated`；`--event-id` 省略时默认
`<task>:<event>:<sha>`。同 ID 同内容返回原记录（`duplicate`），同 ID 异内容写 `conflicts.jsonl`
且**原事件与其哈希不变**，退出码 3。

## 三、实现要点

| 要求 | 实现 |
|---|---|
| 只采事实、不调模型 | 全部本地 Node 内置库；无 fetch 外部、无 LLM、无 CLI 唤醒；事件只落 JSONL |
| 3 执行 worktree + 集成根 | `git worktree list` 按分支识别 `dsh/lane`、`workbuddy/lane`、`antigravity/lane`、`main`（integration，9999） |
| 共享运行目录 | `git rev-parse --git-common-dir` 的上一级 + `.local-evidence/team-watch` |
| scan 只读 + 指纹 + baseline | HEAD、dirty 路径/状态/**内容哈希**、任务卡、docs/reports；首轮不含 changes/stalls，不写事件 |
| emit 幂等/冲突/并发 | 读-判-写全程持 `.events.lock`；append JSONL；临时文件+rename 落快照/摘要 |
| watch 60s + 变化才写 | 普通 `setTimeout` 链（不依赖 daemon）；事实变化才发 `scan-change` + 重写 summary |
| 停工 | 内容进展 ≥30min 每段只发一次 `suspected-stall`；HEAD/dirty 内容/任务卡/报告都算进展；端口不算；blocked 原因进摘要 |
| status/ack | 独立只读命令；ack 写 `acks.jsonl`，不写 done |
| start/stop | 只对 `watch.pid` 发 SIGTERM，`ps` 校验 cmdline；锁/pid 退出清理 |
| 日志/异常 | 2MB 滚动；git/HTTP 指数退避重试；离线写 `DOWN + 原因`；坏 root 记 `errors` 且仍写快照（退出码 2） |

## 四、测试结果

`node --test tools/team-watch/test/teamWatch.test.js` → **11/11 PASS**（约 5s）：

| 用例 | 覆盖点 |
|---|---|
| baseline | 首轮只建快照；不写事件、不报停工 |
| 无变化去重 | 重复 scan 指纹稳定、无事件 |
| dirty 内容更新 | 同路径/同数量、只改内容也识别为进展 |
| emit 冲突 | 同 ID 同内容幂等；异内容记冲突且原事件/哈希不变 |
| 并发写 | 8 个进程并发 emit：8 条、无坏行、无重复 ID |
| 停工/恢复 | 超时只报一次；有进展清除；再次停滞是新一段 |
| 阻塞原因 | blocked 卡原因进 stall 与 summary |
| ack | 只写已读；事件状态不变；重复 ack 幂等 |
| 坏路径 | root 不存在 → errors 写入、退出码 2、仍写快照 |
| 离线端口 | 9999 不可达 → summary `DOWN + ECONNREFUSED/timeout`，不崩 |
| start/stop | 写 pid/log；stop 后进程退出并清理；只管理自身 pid |

全部在 `os.tmpdir()` 的临时 git 仓库与临时 home 中执行，**没有向生产队列写测试事件**。

## 五、真实三 lane 演示（本机）

`scan` 实测（2026-11-14 08:16–08:18 Asia/Shanghai）：

| root | branch | HEAD | dirty | 端口 | 任务卡（汇总） |
|---|---|---|---|---|---|
| dsh | `dsh/lane` | `a9947fc` | 1 | UP 200 | blocked 17 / ready 13 / done 6 / doing 2 |
| workbuddy | `workbuddy/lane` | `83d479a` | 16 | UP 200 | blocked 17 / ready 13 / done 5 / review 2 / doing 1 |
| antigravity | `antigravity/lane` | `41c0da6` | 101 | UP 200 | blocked 18 / ready 11 / done 7 / doing 4 / review 1 |
| integration | `main` | `c36d9f1` | 0 | UP 200 | blocked 18 / ready 12 / done 6 / doing 4 / review 1 |

- 首轮状态：`BASELINE（首轮只记录，不推断完成）`
- watch 启动后第一次 tick 检测到 antigravity dirty 变化 → 追加 `scan-change`（真实变化，非测试数据）
- 事件队列累计 1 条 `scan-change`；`status` 显示未读 1、冲突 0
- watch 日志：`watch start pid=69842 interval=60000ms stall=1800000ms`，之后 lastTick 每 60s 更新

共享目录内容：`snapshot.json`、`summary.json`（约 4KB）、`summary.md`（约 1.6KB）、`events.jsonl`、
`conflicts.jsonl`（空）、`acks.jsonl`（空）、`watch.pid`、`watch.log`、`.events.lock`/`watch.lock`（仅在使用时存在）。

## 六、边界与已知限制

1. **事件不等于唤醒**：本工具不往聊天框输入、不调用任何 CLI/模型；原生每小时巡检需要自己
   `scan`/`status`/读 `events.jsonl`。不新增 launchd/cron/登录启动。
2. **手动 `scan` 会推进快照**：如果人工 scan 先看到了变化，watch 不会重复发同一条 `scan-change`
   （这正是「不重复计入」的副作用）；需要 watch 完整记录时不要手扫。
3. **停工按 lane 判定**：每个 lane 每段停工期最多一条 `suspected-stall`，不会每 60s 重复；
   lane 之间有差异时分别展示。
4. **blocked 原因**只认卡里显式的「阻塞/等待/原因：」行；没写的会显示「卡里未写阻塞原因」，
   不猜测。
5. **9999** 只作为集成验收口的可达性事实；不代表任何验收结论。
6. `COORD-WATCH-01` 的 ID 是两位数字，仓库任务板生成器只收 3–4 位 ID，因此这张卡不会出现在
   `ACTIVE_TASKS` 的生成区块里（不影响运行；AG 登记时可保留原 ID）。
7. 未跑产品全量 E2E（本单只交付独立工具；测试不依赖浏览器）。

## 七、给 AG 的集成说明

- 取 `a9947fc` + 本报告提交；文件仅在 `tools/team-watch/**`、`.tasks/queue/COORD-WATCH-01.md`、
  `docs/reports/COORD-WATCH-01.md`，无共享文件改动，无 SettingsApp / 样式 / store 交叉。
- 集成后如需常驻，由 AG 在 9999 环境自行 `node tools/team-watch/watch.mjs start`（本机当前 69842
  在 dsh worktree 下运行，路径是该 worktree 的 `tools/team-watch/watch.mjs`）。
- AG/WB 报备单行用法：
  `node tools/team-watch/watch.mjs emit --task <ID> --agent ag|wb --event delivery-ready|blocked|test-failed|integrated --sha <sha> --artifact <path> --next-action "…"`
