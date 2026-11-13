# 收件箱 · Codex（主导派单）

## DEV-001 · 真机 USB 供电保持亮屏 —— 已完成设置，跨 10 分钟待验

- **serial**：`159467059A001123`（实测，非 emulator）
- 机型：Infinix X6878 · Android 17 · `X6878-17.0.0.046(OP001PF001AZ)FANS`

| 项 | 原值 | 现值 |
|---|---|---|
| `stay_on_while_plugged_in` | **0** | **2**（USB 位） |
| `screen_off_timeout` | 600000 | **600000（未改，保留 10 分钟）** |
| 供电 | USB powered=true / status=2 / 37% | 未插拔 |

读回 `dumpsys power`：`mWakefulness=Awake`、`mStayOn=true`、`mStayOnWhilePluggedInSetting=2`、`mScreenOffTimeoutSetting=600000`。

**明确未做**：未关锁屏安全、未 root、未周期点屏。

**跨 10 分钟验证：通过。**
- 22 次采样（每 30s，12:10–12:21）全部 `mWakefulness=Awake`
- 复核 `mState=ON` / `mScreenState=ON` / `mStayOn=true`
- `mLastWakeTime` 距今约 **21 分钟**无用户输入（跨过 600000ms 阈值）
- `screencap` 2,714,934 字节（有画面）

恢复命令（采完必跑）：
```bash
adb -s 159467059A001123 shell svc power stayon false
adb -s 159467059A001123 shell settings put global stay_on_while_plugged_in 0
adb -s 159467059A001123 shell settings put system screen_off_timeout 600000
```

证据：`.local-evidence/DEV-001-keepawake.md`（本地，未入库）

---

## 当前进度（LEAD-DSH-001/002）

- **LEAD-DSH-001 完成并已推** `dsh/lane`：G6 加执行者身份层（`--actor`/`CLAIM_ACTOR`/分支推断），
  `unauthorized` 与 `no-actor` 两类问题在 `--strict` 下必须红；`lendTo` 出借；integrator 可跨簇。
  验收 21 项含「WB 过 / DSH 未授权红 / 出借后过 / 重叠未认领仍红」。
- **C0-infra 已收窄**，新增 `C0-wb-lend`（gen-task-board / legacy / verify-* / validate-queue 出借给 WB），
  不再用 `scripts/**` 大锁挡人。
- **LEAD-DSH-002 进行中**：`lib/e2e-evidence.mjs` 已写完并 15 项测试通过（缺失/过期/他提交/他工作区/
  计数不可解析/非零退出/缺套件 七种冒充全部判红）；`run-e2e --out` 写带 sha+worktree+时间戳的证据；
  棘轮改为只认显式 `--e2e-report`，`--unit-only` 明确只验单测；`gate-merge` 已把 G4 挪到 G7 之前。
  正在修初始化顺序并跑门禁。

**环境提示**：本机 load average **63**（10 核，四个 Agent 同时跑），浏览器类测试在此负载下会超时假红。
建议重浏览器测试按 AG→WB→DSH 排队（已收到该指令，我会照办）。
