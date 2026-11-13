# CALLBACK-02-REVIEW · 独立审查 callback-02 入口

- size: M
- status: done
- claim: C0-infra
- owner: DSH
- depends: []
- 来源：Codex 指派（转述），验收依据 = `tos-codex/docs/reviews/callback-supervisor-contract.md`
- 验收：审查报告入库（`docs/reviews/callback-02/review.md`）+ 可复现测试工件 + 经 finish 入口送主控并消费 ack

## 边界

不改实现、不改对方文件、不连真机、不跑全量浏览器、不重启客户端。

## 交付

- `docs/reviews/callback-02/{review.md,run-tests.mjs,codex-stub.mjs,results.json}`
- 结论（v8，绑定 finish `8ee8d585`）：7 项实测通过；新增 P1「内容冲突覆盖已送达回执」；P2「repo_root 固化」
- 已撤回经主控指出判据不成立的两条（rejected 写 ledger、并发 ack 未文档化），正文对应段落已删/改标
- P1 准确表述：冲突重发覆盖**原回执** → 当下不可消费；重投原始内容可**生成新回执**恢复（多花 1 次模型调用）
- 留档：审查期间修复的三个缺陷（boot 崩溃 / 锁永不释放 / unlock 失效）+ 代码变动快于审查周期的流程问题
