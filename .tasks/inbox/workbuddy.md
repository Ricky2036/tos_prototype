# 收件箱 · Workbuddy

> 每次开工前先读本文件；处理完把对应条目划掉或删除。

## 待办

### 1. S2 八个源码正则测试转运行时行为断言

单子：`.tasks/W1-002-wb-s2-tests.md`

起因：主壳要从「34 个页面静态 import」改成「glob 自注册」。那 8 个测试是
`readFileSync(SettingsApp.vue)` + 正则匹配源码文本，**一改 import 就整片假红**。

八改完之前 **S2 三页迁移不要开工**——顺序反了会制造一片假红，比不做更糟。

硬要求：
- **不许删断言换绿灯**，G7 棘轮会拦（基线 835 用例）
- 只改 `tests/`，**不碰 `src/`**
- 交付前跑 `node scripts/gate-merge.mjs`（~19s），必须全绿

---

## 已就绪、你可以直接用

| 命令 | 用途 | 耗时 |
|---|---|---|
| `node scripts/gate-merge.mjs` | 单测 + 构建 + 画布字面量 + G7 棘轮 | **19s** |
| `node scripts/check-assert-ratchet.mjs` | 只跑断言棘轮 | 7s |
| `node scripts/run-e2e.mjs --changed --port 5555` | 只跑受影响的套件 | 视命中 |

## 两个实测结论，和文档写的不一样

1. **全量 e2e 是 632 秒串行**，不是 AGENTS.md 原来写的 82 秒（那是 8 套时代的数，现在 14 套）。
   已改。
2. **`--jobs 4` 会造假失败**：settings-group3 并发跑 176/3 FAIL，单独跑 179/0 PASS。
   门禁一律串行，`--jobs` 只用于你本地临时看个大概。

## 一个新坑，别踩

`modes-and-routines` 这套不稳定：单独跑通过，全量串行跑到它时 `locator.click` 超时。
已标 `quarantined`，不参与 G4 判定。**不要**把它当回归基准。
