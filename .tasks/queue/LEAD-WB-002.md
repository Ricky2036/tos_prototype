# LEAD-WB-002 · verify 脚本盘点与归档（接 Q-003）

- size: M
- status: doing
- claim: C0-infra
- owner: workbuddy
- depends: []
- files: [docs/reviews/verify-inventory.md, scripts/legacy/README.md, scripts/legacy/**]
- 验收：`docs/reviews/verify-inventory.md` 覆盖全部 65 行；`node scripts/run-e2e.mjs --list` 仍 14 套；`scripts/legacy/README.md` 存在

## 背景

Q-003 说「65 个 verify 脚本、51 个未注册、30 个写死个人路径」，
但这三个数都是旧快照。本单先现数再逐个判定，不照抄。

## 实数（本单现数）

- `scripts/verify*.mjs` = **65**；`--list` = 14 套，其中 `volume-glass` 用 `probe-volume-glass.mjs`，
  故真正注册的 verify 脚本是 **13**，未注册 **52**（不是 51）。
- 写死历史会话产物目录 `/Users/.../brain/<uuid>/` = **29**（不是 30）。
- 分类：13 已注册维护 / 24 维护待补 covers / 20 待判 / 8 归档 = 65。
- 49 个脚本未被任何文档或其它脚本引用 —— 这是「既不被跑也不敢删」的根因。

## 做什么

1. `docs/reviews/verify-inventory.md`：逐脚本「判定 + 理由 + 关联流程/建议 covers」65 行
2. 归档 8 个高置信度废弃脚本到 `scripts/legacy/`（git mv，不删）+ README
3. 21 个脚本产物目录改 `ARTIFACT_DIR`，默认 `os.tmpdir()/vwork` 且自动建目录
4. 记录 covers 缺口清单交 DSH

## 进展（Workbuddy）

- 已完成 1–4；21 个改造脚本 + 全部 57 个 `scripts/verify*.mjs` 通过 `node --check`。
- 未改 `scripts/run-e2e.mjs`（DSH 持锁）；SUITES 对应 14 个脚本未移动、未修改。
- 未删除任何脚本；待判 20 个留在原地等 owner 结论。

## 不许做什么

- 不许直接删脚本；不许改 run-e2e；不许删断言降基线换绿
