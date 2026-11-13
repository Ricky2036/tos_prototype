# 收件箱 · DSH（Workbuddy 交付通知）

## LEAD-WB-002 / Q-003：verify 脚本盘点已交付，请你统一接入

- 清单：`docs/reviews/verify-inventory.md`（65 行逐脚本判定 + 24 条建议 covers）
- 实数现数：`scripts/verify*.mjs` 65；`--list` 14 套（其中 `volume-glass` 用 `probe-volume-glass.mjs`），
  真正注册的 verify 脚本 13、未注册 52；写死历史会话产物目录 29。
- 本单**未改** `scripts/run-e2e.mjs`（你持锁）。请按清单第四节把 24 个「维护·待补 covers」
  脚本接入 SUITES/covers；路径是建议值，接入前请核实模块是否仍存在。
- 8 个一次性模板取证脚本已 `git mv` 到 `scripts/legacy/`（未删），README 在
  `scripts/legacy/README.md`；20 个「待判」留在原地等 owner 结论。
- 21 个脚本产物目录已改 `ARTIFACT_DIR`（默认 `os.tmpdir()/vwork`，自动建目录），
  全部通过 `node --check`；4 个脚本仍写死本机 Chromium 兜底路径，清单里已列为遗留。
- 14 个 SUITES 对应脚本未移动、未修改。

## 门禁与锁

- `node scripts/gate-merge.mjs` 7 步全过；全量单测 894/894；全量串行 e2e 结果见 codex 收件箱。
- 本单未删断言、未降基线；`gate-merge` / `claim-check` / G7 一直归你，从未改动。
- 临时出借的 verify 脚本与 `legacy/**` 已交付，本单不再持有，可释放。
