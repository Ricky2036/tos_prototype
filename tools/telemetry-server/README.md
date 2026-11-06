# tOS 原型技能使用统计服务

本目录包含一套专为 `tOS Prototype` 技能打造的轻量使用量统计与数据监控服务端。

基于 Node.js 原生标准库与内置轻量数据库（无需安装第三方依赖包），开箱即用，具备毫秒级响应、WAL 并发写入以及可视化的使用数据看板。

---

## 一、核心特性

1. **零第三方依赖**：纯基于 Node.js 原生 HTTP 服务与内建数据库模块，克隆即可运行。
2. **严格隐私保护**：客户端使用单向硬件与账户特征哈希生成唯一标识，服务端不记录真实用户名、项目代码或私有文件内容。
3. **真实使用量统计**：
   - 累计独立使用人数（按设备去重）
   - 近 7 日活跃人数、今日活跃人数
   - 各项操作触发分布（开发服务启动、测试运行、静态编译、原型脚手架复制）
   - 近 14 日活跃人数走势
4. **开箱即用看板**：自带监控页面与 CSV 数据导出能力。

---

## 二、本地快速启动

在具备 Node.js（建议版本 22 或以上）的环境中直接执行：

```bash
node server.mjs
```

启动成功后：
- 监控看板：`http://localhost:3333/dashboard`
- 指标接口：`http://localhost:3333/api/stats`
- 上报接口：`http://localhost:3333/api/track`

如需更改端口或数据库存储路径，可传入环境变量：

```bash
PORT=8080 DB_PATH=/var/data/telemetry.db node server.mjs
```

---

## 三、Docker 容器化部署

通过 Docker 镜像可在团队私有服务器、虚拟机或云服务中一键部署：

```bash
# 1. 构建镜像
docker build -t tos-telemetry-server .

# 2. 启动容器（映射 3333 端口，挂载本地数据目录）
docker run -d \
  --name tos-telemetry \
  -p 3333:3333 \
  -v $(pwd)/data:/app/data \
  --restart unless-stopped \
  tos-telemetry-server
```

---

## 四、接口文档说明

### 1. 事件上报接口
- **请求方式**：`POST /api/track`
- **请求头**：`Content-Type: application/json`
- **请求体参数**：
  - `skill` (字符串，必填)：技能标识，默认 `tos-prototype`
  - `user_id` (字符串，必填)：匿名设备哈希
  - `event` (字符串，必填)：事件动作名称（如 `dev_start`、`build`、`test`、`activate`）
  - `platform` (字符串，选填)：运行操作系统（如 `darwin`、`linux`、`win32`）
  - `node_version` (字符串，选填)：环境运行时版本
  - `properties` (对象，选填)：事件附带的执行参数与元数据

### 2. 统计指标接口
- **请求方式**：`GET /api/stats?skill=tos-prototype`
- **返回字段**：
  - `total_events`：总事件数
  - `unique_users_total`：累计独立人数
  - `unique_users_7d`：近 7 天活跃人数
  - `unique_users_today`：今日活跃人数
  - `events_by_type`：各事件频次与独立人数统计
  - `daily_trend`：每日活跃趋势时间序列
  - `recent_events`：最近 25 条调用明细

### 3. 数据导出接口
- **请求方式**：`GET /api/export?skill=tos-prototype`
- **说明**：直接下载结构化的 CSV 格式日志流水文件。
