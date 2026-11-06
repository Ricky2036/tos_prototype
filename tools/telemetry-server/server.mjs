import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置项
const PORT = parseInt(process.env.PORT || '3333', 10);
const HOST = process.env.HOST || '0.0.0.0';
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'telemetry.db');

// 初始化 SQLite 数据库
const db = new DatabaseSync(DB_PATH);

// 开启 WAL 模式以提升并发写入性能与读取性能
db.prepare(`
  PRAGMA journal_mode = WAL;
  PRAGMA synchronous = NORMAL;

  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    session_id TEXT,
    skill TEXT NOT NULL,
    event TEXT NOT NULL,
    platform TEXT,
    node_version TEXT,
    properties TEXT,
    ip_hash TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
  CREATE INDEX IF NOT EXISTS idx_events_event ON events(event);
  CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);
  CREATE INDEX IF NOT EXISTS idx_events_skill ON events(skill);
`);

// 预编译 SQL 语句
const insertEventStmt = db.prepare(`
  INSERT INTO events (user_id, session_id, skill, event, platform, node_version, properties, ip_hash, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
`);

const statsTotalEventsStmt = db.prepare(`SELECT COUNT(*) as count FROM events WHERE skill = ?`);
const statsTotalUsersStmt = db.prepare(`SELECT COUNT(DISTINCT user_id) as count FROM events WHERE skill = ?`);
const statsTodayUsersStmt = db.prepare(`
  SELECT COUNT(DISTINCT user_id) as count FROM events 
  WHERE skill = ? AND date(created_at) = date('now')
`);
const stats7dUsersStmt = db.prepare(`
  SELECT COUNT(DISTINCT user_id) as count FROM events 
  WHERE skill = ? AND created_at >= datetime('now', '-7 days')
`);
const stats30dUsersStmt = db.prepare(`
  SELECT COUNT(DISTINCT user_id) as count FROM events 
  WHERE skill = ? AND created_at >= datetime('now', '-30 days')
`);
const statsEventsByTypeStmt = db.prepare(`
  SELECT event, COUNT(*) as count, COUNT(DISTINCT user_id) as unique_users 
  FROM events 
  WHERE skill = ?
  GROUP BY event 
  ORDER BY count DESC
`);
const statsPlatformsStmt = db.prepare(`
  SELECT platform, COUNT(*) as count, COUNT(DISTINCT user_id) as unique_users 
  FROM events 
  WHERE skill = ?
  GROUP BY platform 
  ORDER BY count DESC
`);
const statsDailyTrendStmt = db.prepare(`
  SELECT date(created_at) as day, COUNT(*) as total_events, COUNT(DISTINCT user_id) as active_users
  FROM events
  WHERE skill = ? AND created_at >= datetime('now', '-14 days')
  GROUP BY date(created_at)
  ORDER BY day ASC
`);
const recentEventsStmt = db.prepare(`
  SELECT id, user_id, event, platform, properties, created_at
  FROM events
  WHERE skill = ?
  ORDER BY id DESC
  LIMIT 25
`);

function getClientIpHash(req) {
  const forwarded = req.headers['x-forwarded-for'];
  const rawIp = forwarded ? forwarded.split(',')[0].trim() : req.socket.remoteAddress || '';
  return crypto.createHash('sha256').update(rawIp + 'salt_tOS_2026').digest('hex').slice(0, 12);
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1024 * 128) {
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, data) {
  const json = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Cache-Control': 'no-store'
  });
  res.end(json);
}

// 渲染管理监控看板页面 (纯原生 HTML/CSS/JS，四边微细边框设计，严禁竖线卡片与 AI 陈词滥调)
function renderDashboardHtml() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>tOS 原型技能使用统计看板</title>
  <style>
    :root {
      --bg: #f8fafc;
      --surface: #ffffff;
      --surface-subtle: #f1f5f9;
      --border-subtle: #e2e8f0;
      --border-focus: #cbd5e1;
      --text-main: #0f172a;
      --text-muted: #64748b;
      --primary: #2563eb;
      --primary-light: #eff6ff;
      --accent: #059669;
      --accent-light: #ecfdf5;
      --radius-sm: 8px;
      --radius-md: 12px;
      --radius-lg: 16px;
      --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: var(--bg);
      color: var(--text-main);
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "PingFang SC", "Segoe UI", Roboto, sans-serif;
      line-height: 1.5;
      padding: 32px 24px;
    }

    .container {
      max-width: 1120px;
      margin: 0 auto;
    }

    /* 顶部导航与操作栏 */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 28px;
      padding-bottom: 20px;
      border-bottom: 1px solid var(--border-subtle);
    }

    .brand {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .brand h1 {
      font-size: 20px;
      font-weight: 600;
      color: var(--text-main);
      letter-spacing: -0.01em;
    }

    .brand p {
      font-size: 13px;
      color: var(--text-muted);
    }

    .controls {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: var(--surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      padding: 7px 14px;
      font-size: 13px;
      font-weight: 500;
      color: var(--text-main);
      cursor: pointer;
      text-decoration: none;
      transition: all 0.15s ease;
    }

    .btn:hover {
      background: var(--surface-subtle);
      border-color: var(--border-focus);
    }

    .btn-primary {
      background: var(--primary);
      border-color: var(--primary);
      color: #ffffff;
    }

    .btn-primary:hover {
      background: #1d4ed8;
      border-color: #1d4ed8;
    }

    /* 指标卡片网格 */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
      gap: 16px;
      margin-bottom: 28px;
    }

    .card {
      background: var(--surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 20px;
      box-shadow: var(--shadow-sm);
    }

    .card-label {
      font-size: 13px;
      color: var(--text-muted);
      margin-bottom: 8px;
      font-weight: 500;
    }

    .card-value {
      font-size: 28px;
      font-weight: 700;
      color: var(--text-main);
      letter-spacing: -0.02em;
    }

    .card-sub {
      font-size: 12px;
      color: var(--text-muted);
      margin-top: 6px;
    }

    /* 图表与明细双栏布局 */
    .layout-split {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 20px;
      margin-bottom: 28px;
    }

    @media (max-width: 860px) {
      .layout-split {
        grid-template-columns: 1fr;
      }
    }

    .panel-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--text-main);
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    /* 趋势条形图 */
    .chart-container {
      height: 180px;
      display: flex;
      align-items: flex-end;
      gap: 12px;
      padding-top: 24px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--border-subtle);
    }

    .bar-group {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      height: 100%;
      justify-content: flex-end;
    }

    .bar-pill {
      width: 100%;
      max-width: 24px;
      background: var(--primary);
      border-radius: 4px 4px 0 0;
      min-height: 4px;
      transition: height 0.3s ease;
      position: relative;
    }

    .bar-pill:hover::after {
      content: attr(data-tooltip);
      position: absolute;
      bottom: calc(100% + 6px);
      left: 50%;
      transform: translateX(-50%);
      background: #1e293b;
      color: #fff;
      font-size: 11px;
      padding: 3px 6px;
      border-radius: 4px;
      white-space: nowrap;
      z-index: 10;
    }

    .bar-label {
      font-size: 11px;
      color: var(--text-muted);
      transform: scale(0.9);
    }

    /* 列表与表格 */
    .stat-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .stat-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      background: var(--surface-subtle);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      font-size: 13px;
    }

    .stat-item .name {
      font-weight: 500;
      color: var(--text-main);
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .stat-item .count {
      font-weight: 600;
      color: var(--text-muted);
    }

    /* 实时日志表格 */
    .table-container {
      overflow-x: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      text-align: left;
    }

    th {
      background: var(--surface-subtle);
      color: var(--text-muted);
      font-weight: 500;
      padding: 10px 14px;
      border-bottom: 1px solid var(--border-subtle);
    }

    td {
      padding: 12px 14px;
      border-bottom: 1px solid var(--border-subtle);
      color: var(--text-main);
    }

    tr:last-child td {
      border-bottom: none;
    }

    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 500;
      background: var(--surface-subtle);
      border: 1px solid var(--border-subtle);
      color: var(--text-muted);
    }

    .badge-dev {
      background: var(--primary-light);
      border-color: #bfdbfe;
      color: var(--primary);
    }

    .badge-activate {
      background: var(--accent-light);
      border-color: #a7f3d0;
      color: var(--accent);
    }

    .code-chip {
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 12px;
      background: var(--surface-subtle);
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid var(--border-subtle);
    }

    .meta-time {
      color: var(--text-muted);
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <header class="header">
      <div class="brand">
        <h1>tOS 原型技能使用统计看板</h1>
        <p>独立用户去重统计 · 真实执行链路监控 · 本地 SQLite 高并发存储</p>
      </div>
      <div class="controls">
        <button class="btn" onclick="fetchStats()">刷新数据</button>
        <a class="btn btn-primary" href="/api/export" download="tos_telemetry.csv">导出 CSV</a>
      </div>
    </header>

    <!-- 核心指标 -->
    <section class="kpi-grid">
      <div class="card">
        <div class="card-label">累计独立使用人数</div>
        <div class="card-value" id="kpi-total-users">-</div>
        <div class="card-sub">经单向哈希去重的独立设备数</div>
      </div>
      <div class="card">
        <div class="card-label">近 7 日活跃人数</div>
        <div class="card-value" id="kpi-7d-users">-</div>
        <div class="card-sub">过去一周内实际运行该技能的人数</div>
      </div>
      <div class="card">
        <div class="card-label">今日使用人数</div>
        <div class="card-value" id="kpi-today-users">-</div>
        <div class="card-sub">当天激活或运行开发服务的用户</div>
      </div>
      <div class="card">
        <div class="card-label">总事件触发次数</div>
        <div class="card-value" id="kpi-total-events">-</div>
        <div class="card-sub">包含启动、编译、测试与脚手架调用</div>
      </div>
    </section>

    <!-- 图表与明细 -->
    <div class="layout-split">
      <div class="card">
        <div class="panel-title">
          <span>近 14 日使用人数走势</span>
          <span style="font-size: 12px; color: var(--text-muted);" id="trend-summary">日活柱状图</span>
        </div>
        <div class="chart-container" id="trend-chart">
          <!-- 动态注入柱状图 -->
        </div>
      </div>

      <div class="card">
        <div class="panel-title">事件类型分布</div>
        <ul class="stat-list" id="event-list">
          <!-- 动态注入事件列表 -->
        </ul>
      </div>
    </div>

    <!-- 最近使用明细流水 -->
    <div class="card">
      <div class="panel-title">最近活跃调用记录</div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>时间</th>
              <th>事件动作</th>
              <th>用户标识 (哈希)</th>
              <th>操作系统</th>
              <th>执行上下文</th>
            </tr>
          </thead>
          <tbody id="recent-tbody">
            <tr>
              <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 24px;">正在载入最新数据...</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <script>
    async function fetchStats() {
      try {
        const res = await fetch('/api/stats?skill=tos-prototype');
        const data = await res.json();
        renderDashboard(data);
      } catch (err) {
        console.error('加载监控指标失败:', err);
      }
    }

    function renderDashboard(data) {
      document.getElementById('kpi-total-users').innerText = data.unique_users_total.toLocaleString();
      document.getElementById('kpi-7d-users').innerText = data.unique_users_7d.toLocaleString();
      document.getElementById('kpi-today-users').innerText = data.unique_users_today.toLocaleString();
      document.getElementById('kpi-total-events').innerText = data.total_events.toLocaleString();

      // 渲染柱状图
      const chartEl = document.getElementById('trend-chart');
      chartEl.innerHTML = '';
      const trend = data.daily_trend || [];
      const maxUsers = Math.max(...trend.map(t => t.active_users), 1);

      if (trend.length === 0) {
        chartEl.innerHTML = '<div style="margin: auto; color: var(--text-muted); font-size: 13px;">暂无趋势数据</div>';
      } else {
        trend.forEach(item => {
          const barGroup = document.createElement('div');
          barGroup.className = 'bar-group';
          const heightPct = Math.max((item.active_users / maxUsers) * 100, 6);
          const shortDay = item.day.slice(5);

          barGroup.innerHTML = \`
            <div class="bar-pill" style="height: \${heightPct}%;" data-tooltip="\${item.day}: \${item.active_users} 人 (\${item.total_events} 次)"></div>
            <div class="bar-label">\${shortDay}</div>
          \`;
          chartEl.appendChild(barGroup);
        });
      }

      // 渲染事件分布
      const eventListEl = document.getElementById('event-list');
      eventListEl.innerHTML = '';
      (data.events_by_type || []).forEach(ev => {
        const li = document.createElement('li');
        li.className = 'stat-item';
        li.innerHTML = \`
          <span class="name"><span class="badge">\${ev.event}</span></span>
          <span class="count">\${ev.unique_users} 人 / \${ev.count} 次</span>
        \`;
        eventListEl.appendChild(li);
      });

      // 渲染最新调用明细
      const tbody = document.getElementById('recent-tbody');
      tbody.innerHTML = '';
      if (!data.recent_events || data.recent_events.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 24px;">暂无调用记录</td></tr>';
        return;
      }

      data.recent_events.forEach(item => {
        const tr = document.createElement('tr');
        const badgeClass = item.event === 'dev_start' ? 'badge badge-dev' : (item.event === 'activate' ? 'badge badge-activate' : 'badge');
        tr.innerHTML = \`
          <td class="meta-time">\${item.created_at}</td>
          <td><span class="\${badgeClass}">\${item.event}</span></td>
          <td><span class="code-chip">\${item.user_id}</span></td>
          <td>\${item.platform || '未知'}</td>
          <td><span class="code-chip" style="max-width: 280px; overflow: hidden; text-overflow: ellipsis; display: inline-block;">\${item.properties || '{}'}</span></td>
        \`;
        tbody.appendChild(tr);
      });
    }

    // 页面加载自动获取
    fetchStats();
    // 每 30 秒自动刷新一次
    setInterval(fetchStats, 30000);
  </script>
</body>
</html>`;
}

// HTTP 服务请求分发
const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // 跨域预检
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  // 1. 监控看板页面
  if (pathname === '/' || pathname === '/dashboard') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(renderDashboardHtml());
  }

  // 2. 健康检查
  if (pathname === '/health') {
    return sendJson(res, 200, { status: 'ok', timestamp: new Date().toISOString() });
  }

  // 3. 事件上报接口
  if (pathname === '/api/track' && req.method === 'POST') {
    try {
      const data = await parseJsonBody(req);
      const skill = String(data.skill || 'tos-prototype').trim();
      const userId = String(data.user_id || '').trim();
      const event = String(data.event || 'unknown').trim();
      const sessionId = data.session_id ? String(data.session_id) : null;
      const platform = data.platform ? String(data.platform) : null;
      const nodeVersion = data.node_version ? String(data.node_version) : null;
      const properties = data.properties ? JSON.stringify(data.properties) : '{}';
      const ipHash = getClientIpHash(req);

      if (!userId) {
        return sendJson(res, 400, { error: 'Missing user_id' });
      }

      insertEventStmt.run(userId, sessionId, skill, event, platform, nodeVersion, properties, ipHash);
      return sendJson(res, 200, { ok: true, status: 'recorded' });
    } catch (err) {
      return sendJson(res, 500, { error: err.message });
    }
  }

  // 4. 数据统计指标接口
  if (pathname === '/api/stats' && req.method === 'GET') {
    try {
      const skill = parsedUrl.searchParams.get('skill') || 'tos-prototype';
      const totalEvents = statsTotalEventsStmt.get(skill)?.count || 0;
      const totalUsers = statsTotalUsersStmt.get(skill)?.count || 0;
      const todayUsers = statsTodayUsersStmt.get(skill)?.count || 0;
      const users7d = stats7dUsersStmt.get(skill)?.count || 0;
      const users30d = stats30dUsersStmt.get(skill)?.count || 0;
      const eventsByType = statsEventsByTypeStmt.all(skill) || [];
      const platforms = statsPlatformsStmt.all(skill) || [];
      const dailyTrend = statsDailyTrendStmt.all(skill) || [];
      const recentEvents = recentEventsStmt.all(skill) || [];

      return sendJson(res, 200, {
        skill,
        total_events: totalEvents,
        unique_users_total: totalUsers,
        unique_users_today: todayUsers,
        unique_users_7d: users7d,
        unique_users_30d: users30d,
        events_by_type: eventsByType,
        platforms,
        daily_trend: dailyTrend,
        recent_events: recentEvents
      });
    } catch (err) {
      return sendJson(res, 500, { error: err.message });
    }
  }

  // 5. CSV 导出接口
  if (pathname === '/api/export' && req.method === 'GET') {
    try {
      const skill = parsedUrl.searchParams.get('skill') || 'tos-prototype';
      const rows = db.prepare('SELECT id, user_id, event, platform, properties, created_at FROM events WHERE skill = ? ORDER BY id DESC LIMIT 5000').all(skill);

      let csv = 'id,user_id,event,platform,properties,created_at\n';
      for (const row of rows) {
        const safeProps = `"${(row.properties || '').replace(/"/g, '""')}"`;
        csv += `${row.id},${row.user_id},${row.event},${row.platform || ''},${safeProps},${row.created_at}\n`;
      }

      res.writeHead(200, {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="tos_telemetry_${Date.now()}.csv"`
      });
      return res.end(csv);
    } catch (err) {
      return sendJson(res, 500, { error: err.message });
    }
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not Found');
});

server.listen(PORT, HOST, () => {
  console.log(`[tOS Telemetry Server] 接收服务已就绪: http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
  console.log(`[tOS Telemetry Server] 数据存储路径: ${DB_PATH}`);
  console.log(`[tOS Telemetry Server] 监控看板地址: http://localhost:${PORT}/dashboard`);
});
