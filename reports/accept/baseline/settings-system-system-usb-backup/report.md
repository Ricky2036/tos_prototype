# 验收判决书 · settings/system/system-usb-backup

> 渲染结果 vs 真机契约。机器只陈述事实；人只审异常。

- **spec**：`/Users/jingzhan.chen/Workbuddy/agent-workspaces/tos-dsh/spec/settings/system/system-usb-backup.geometry.json`（sha256 `f5538dbb9ba4c23afec5afc733c16cd79d88294b866faf7ad3d8b2c18d971eab`）
- **commit**：`n/a`
- **url**：`http://127.0.0.1:7812/`
- **容器**：`.screen-view`　**缩放**：1（画布 360×788 → DOM 360×788）
- **生成时间**：2026-11-18T12:20:53.005Z

## 逐节点几何

| 节点 | 角色 | 期望(x,y,w,h) | 实测(x,y,w,h) | Δ | 判定 | 命中方式 | 文本 |
|---|---|---|---|---|---|---|---|
| header:title | header-title | 80.2,51.3,199.7,21.2 | — | — | ⬜ MISSING | — | ✗（实测「∅」） |
| header:back | header-back | 16.1,39.9,44.1,44.1 | 16,60,34,34 | dx -0.1 dy 20.1 dw -10.1 dh -10.1（worst 15） | ❌ FAIL | role:header-back | — |
| row:时间 | row | 16.1,112.1,327.8,63.8 | — | — | ⬜ MISSING | — | ✗（实测「∅」） |
| row:重复 | row | 16.1,175.8,327.8,63.8 | — | — | ⬜ MISSING | — | ✗（实测「∅」） |

## 集合差 · extras（DOM 有、spec 没有 → 自造）

| # | 文本 | 实测(x,y,w,h) | 选择器线索 |
|---|---|---|---|
| 1 | 备份数据至 USB 存储设备将通讯录、信息、照片与应用数据导出 | 16,300,328,66.7 | `.list-cell（无行级 data-* 属性）` |
| 2 | 从 USB 存储设备恢复数据导入此前备份的数据 | 16,366.7,328,65.7 | `.list-cell（无行级 data-* 属性）` |

## 集合差 · missing（spec 有、DOM 没有 → 漏做）

- ⬜ `header:title`（header-title，期望 80.2,51.3,199.7,21.2，文本「[object Object]」）
- ⬜ `row:时间`（row，期望 16.1,112.1,327.8,63.8，文本「[object Object]」）
- ⬜ `row:重复`（row，期望 16.1,175.8,327.8,63.8，文本「[object Object]」）

## 合计

- spec 节点 **4**；命中 **1/4**（matchRate **0.25**）
- pass **0** / fail **1** / missing **3** / extra **2** / skipped **0**
- **结论**：❌ **不通过**：1 个几何超差，3 个漏做，2 个自造（门槛 min-match=0.9）

## 复现命令

```bash
node tools/accept/accept.mjs \
  --spec /Users/jingzhan.chen/Workbuddy/agent-workspaces/tos-dsh/spec/settings/system/system-usb-backup.geometry.json \
  --url http://127.0.0.1:7812/ \
  --page settings/system/system-usb-backup \
  --recipe /Users/jingzhan.chen/Workbuddy/agent-workspaces/tos-dsh/tools/accept/recipes/by-text-path.mjs \
  --build-dir /tmp/dist-head \
  --out /Users/jingzhan.chen/Workbuddy/agent-workspaces/tos-dsh/reports/accept/baseline/settings-system-system-usb-backup
```

## 定位诊断（不影响判定，供人复核）

- `header:title`：text-not-found —— 精确文本「设置定时开机」不存在
- `row:时间`：text-not-found —— 精确文本「时间」不存在
- `row:重复`：text-not-found —— 精确文本「重复」不存在
