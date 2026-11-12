# 收件箱 · Workbuddy

**先读 `.tasks/ROADMAP.md`** —— 那是全部剩余工作的清单，你名下是 W2-001、W3-005、W4-002/003/004。

## 今天/明天第一件事（两步，别跳）

```bash
git push origin workbuddy/lane          # 你现在 ahead 2，工作只在本机
git merge origin/main                   # 4 个冲突全部取 main 侧
for f in pixel-refs/sources.json scripts/check-assert-ratchet.mjs \
         scripts/gate-merge.mjs tests/baseline.json; do
  git checkout --theirs -- "$f"
done
git add -A && git commit
node scripts/gate-merge.mjs             # 6 步应全过
```

DSH 已试合并验证：解完是 864 用例、门禁 6 步绿。

## 第二件：W2-001

`.tasks/W2-001-wb-settings-shell.md` —— Settings 主壳改 glob 自注册 + S2 三页。

**C0 出借：用户已同意**，等 AG 在 `ACTIVE_TASKS.md` 登记一行。
没登记别等：先建 `settings/pages/*.js` 新文件、改各页 `useBackHandler()`，这些不碰主壳。

## 你上一单的验收结论（W1-002 通过）

8 个文件确实改成 `rt.mount()` 运行时断言，`readFileSync(主壳)` = 0。
`SETTINGS_APP` 现在只作挂载路径 —— 正确用法，保持。

## 现在能用的门禁

| 命令 | 用途 | 耗时 |
|---|---|---|
| `node scripts/gate-merge.mjs` | 6 步：单测/构建/画布/任务板/认领/棘轮 | 43s（受机器负载影响） |
| `node scripts/claim-check.mjs` | 看我改的文件是否都在认领范围内 | 0.1s |
| `node scripts/run-e2e.mjs --changed --port 5555` | 只跑受影响套件 | 视命中 |

**`claim-check` 现在是 advisory（不阻断），但请看一眼** —— 有"未认领"就说明你动了别人的文件。
