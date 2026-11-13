# scripts/legacy —— 已废弃的一次性取证脚本（只存档，不删除）

本目录由 LEAD-WB-002 / Q-003 建立（2026-11-13）。**这些脚本不再运行，也不进 SUITES**，
保留的唯一目的是留住当时的行为与截图命名记录。分类理由见
`docs/reviews/verify-inventory.md`。

## 为什么是这 8 个

同时满足三条才归档，避免「看着旧就扔」：

1. 2026-10-26/27 同一批生成，命名/注释都指向某轮一次性模板与图标截图取证；
2. 产物目录写死 `/Users/jingzhan.chen/.gemini/antigravity/brain/24ce81d7-…/`
   这类**已消失的历史会话目录**，在其它机器/lane 上必然跑不起来；
3. 未注册 `run-e2e.mjs` 的 SUITES，也未被任何文档或其它脚本引用。

| 脚本 | 原用途 | 归档理由 |
| --- | --- | --- |
| `verify-os16-templates.mjs` | OS16 通知模板截图 | 一次性模板取证，历史会话产物路径 |
| `verify_all_native_templates.mjs` | 原生通知模板截图 | 同上 |
| `verify_buttons_figma.mjs` | Figma 按钮截图 | 同上 |
| `verify_charging_and_hotspot.mjs` | 充电/热点状态栏截图 | 同上 |
| `verify_devconsole_icons.mjs` | DevConsole 图标截图 | 同上 |
| `verify_fixes.mjs` | 灵动岛若干修复截图 | 同上 |
| `verify_food_layer_separated.mjs` | 通知卡片图层分离截图 | 同上 |
| `verify_interactive_cards.mjs` | 通知交互卡片截图 | 同上 |

## 使用约定

- 不要直接从这里复制回 `scripts/` 当回归套件用；如需复用，先按
  `docs/reviews/verify-inventory.md` 的 ARTIFACT_DIR 约定改造成可移植脚本。
- 不要删除本目录内容：它们是该轮视觉结论的唯一行为记录。
- 后续若确认仍有价值，走「补 covers + 移回 `scripts/`」，而不是就地运行。
