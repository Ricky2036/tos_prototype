# 交接页 · 2026-11-13 18:5x

> 用途：新会话接手时读这一页就够，不必回溯旧对话。
> 旧会话已完成：tOS 原型协作协议 v2、agent-autoloop 接入、真机采集 SET-DSH-01/02、CALLBACK-02 独立审查。

## 一、现在的分支状态

| | |
|---|---|
| `origin/main` | `461af32` |
| `dsh/lane` | `0f6831f`（**落后 main**，且有 8 个未合提交，全是文档/审查产物） |
| 未合内容 | `docs/reviews/callback-02/*`、`.tasks/queue/CALLBACK-02-REVIEW.md` |

**接手第一件事**：`git merge origin/main`（会有 `.tasks/inbox/workbuddy.md` 的文本冲突，
两边段落都保留即可），然后让 AG 合 `dsh/lane`。

## 二、项目结构（三接口）

| 文件 | 作用 |
|---|---|
| `AGENTS.md` | 所有 Agent 开工先读：角色、从队列取活、收件箱 |
| `docs/roles-v2.md` | 角色与成本路由（替代 `tOS-pipeline-1.0.md` §7） |
| `docs/tOS-pipeline-1.0.md` | 执行协议：流水线、门禁 G0–G8、坐标、提交纪律 |
| `.tasks/queue/` | 拉取式队列，`TEMPLATE.md` 是格式 |

角色：**Codex 按需规划**（额度紧，拆解/架构）· **AG 集成** · **WB 构建** · **DSH 基建** · 用户拍板。

## 三、环境事实（都是踩过坑换来的）

**真机**

- serial `159467059A001123`，Infinix X6878，Android 17，逻辑宽 402.7dp
- 采集前开保活：`adb -s <serial> shell svc power stayon usb`，采完还原
  `svc power stayon false` + `settings put global stay_on_while_plugged_in 0`
- **`uiautomator dump` 在这台机器上永不返回**，但文件会写成。必须：
  ```bash
  adb -s <serial> shell "uiautomator dump --compressed /data/local/tmp/cap.xml" &
  sleep 7 && adb -s <serial> pull /data/local/tmp/cap.xml out.xml
  ```
  直接等返回值会误判成"这台机器 a11y 不可用"。

**通道**

| Agent | 通道 | 状态 |
|---|---|---|
| Antigravity | `node tools/agent-bridge/send.mjs antigravity "..."`（CDP :59755） | ✅ 可用 |
| WorkBuddy | 无 | ❌ 调试端口起不来（守护进程会无参数重启）；只能经 AG 转达 |
| Codex | 无直连 | ChatGPT.app 未开 CDP；`~/.codex/ipc/*.sock` 是私有协议，不碰 |

**agent-autoloop**

- 中台 `http://127.0.0.1:3350`；规则在 `~/.agent-autoloop/rules.json`
- 两条规则：「早报」每天 08:00（写 `docs/briefs/`）、「拆解」手动触发
- 早报用 `codex-brief` 这个 agent，**权限 full**（edit 档写不了 `.git`、也禁网）

## 四、门禁与纪律

- `node scripts/gate-merge.mjs` —— 7 步 / 约 20s；`--with-e2e` 会先跑 G4 再验 G7
- e2e 证据必须显式：`--e2e-report <本轮文件>` 或 `--unit-only`，**绝不默认读 /tmp**
- G6 认领边界要带身份：`--actor <workbuddy|dsh|integrator|codex>` 或 `CLAIM_ACTOR`
- **本地跑浏览器测试不可信**：四个 Agent 同机时 load 常到 50+（10 核），会假红。
  先单文件复跑确认，别急着改代码。

## 五、未完成 / 需要注意

| 项 | 状态 |
|---|---|
| SET-DSH-01（日期与时间） | 卡片仍 `doing`；包 A–E 已交付，采集已完成，可关 |
| `docs/reviews/callback-02/` | 审查已由 Codex 接收，**已结案，不要再发 finish** |
| `results.json` 的哈希 | 绑的是 `8ee8d585`，不是 main 现状；要复核请重跑 `run-tests.mjs` |
| 日期页实现 | WB 在做；`SettingsApp.vue` 的「系统」页缺「日期与时间」入口行（真机有） |

## 六、给新会话的开场白（照抄即可）

> 接手 tOS 原型。先读 `AGENTS.md`、`docs/roles-v2.md`、`.tasks/HANDOFF.md`，
> 然后 `git merge origin/main` 到我这个 lane。当前空闲，等派活。
