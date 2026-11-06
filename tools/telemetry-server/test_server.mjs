import http from 'node:http';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_PORT = 3399;
const TEST_DB = path.join(__dirname, 'test_telemetry.db');

// 清理旧的测试数据库
if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);

console.log('启动测试服务端...');
const proc = spawn('node', ['server.mjs'], {
  cwd: __dirname,
  env: {
    ...process.env,
    PORT: String(TEST_PORT),
    DB_PATH: TEST_DB
  },
  stdio: 'inherit'
});

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request({
      hostname: 'localhost',
      port: TEST_PORT,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
      }
    }, res => {
      let resBody = '';
      res.on('data', chunk => { resBody += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: resBody
        });
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function runTests() {
  await wait(800);

  try {
    // 1. 测试健康检查
    console.log('[测试 1] 健康检查 GET /health');
    const health = await request('GET', '/health');
    assert.strictEqual(health.statusCode, 200);
    const healthJson = JSON.parse(health.body);
    assert.strictEqual(healthJson.status, 'ok');

    // 2. 测试事件上报 POST /api/track
    console.log('[测试 2] 上报事件 POST /api/track');
    const track1 = await request('POST', '/api/track', {
      skill: 'tos-prototype',
      user_id: 'user_hash_aaa',
      event: 'dev_start',
      platform: 'darwin',
      node_version: 'v26.4.0',
      properties: { port: 5173 }
    });
    assert.strictEqual(track1.statusCode, 200);
    const track1Json = JSON.parse(track1.body);
    assert.strictEqual(track1Json.ok, true);

    const track2 = await request('POST', '/api/track', {
      skill: 'tos-prototype',
      user_id: 'user_hash_bbb',
      event: 'dev_start',
      platform: 'linux',
      properties: { port: 5174 }
    });
    assert.strictEqual(track2.statusCode, 200);

    const track3 = await request('POST', '/api/track', {
      skill: 'tos-prototype',
      user_id: 'user_hash_aaa',
      event: 'build',
      platform: 'darwin',
      properties: { duration_ms: 1500 }
    });
    assert.strictEqual(track3.statusCode, 200);

    // 3. 校验统计指标 GET /api/stats
    console.log('[测试 3] 验证聚合指标 GET /api/stats');
    const statsRes = await request('GET', '/api/stats?skill=tos-prototype');
    assert.strictEqual(statsRes.statusCode, 200);
    const stats = JSON.parse(statsRes.body);
    console.log('指标响应:', stats);

    assert.strictEqual(stats.total_events, 3);
    assert.strictEqual(stats.unique_users_total, 2);
    assert.strictEqual(stats.unique_users_today, 2);
    assert.strictEqual(stats.events_by_type.length, 2);

    // 4. 测试看板页面渲染 GET /dashboard
    console.log('[测试 4] 验证监控看板 HTML GET /dashboard');
    const dashboardRes = await request('GET', '/dashboard');
    assert.strictEqual(dashboardRes.statusCode, 200);
    assert.ok(dashboardRes.body.includes('tOS 原型技能使用统计看板'));

    // 5. 测试 CSV 导出 GET /api/export
    console.log('[测试 5] 验证 CSV 导出 GET /api/export');
    const exportRes = await request('GET', '/api/export?skill=tos-prototype');
    assert.strictEqual(exportRes.statusCode, 200);
    assert.ok(exportRes.body.includes('user_hash_aaa'));
    assert.ok(exportRes.body.includes('dev_start'));

    console.log('所有服务端自动化测试全部通过！');
  } finally {
    proc.kill('SIGINT');
    await wait(300);
    if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
    if (fs.existsSync(`${TEST_DB}-wal`)) fs.unlinkSync(`${TEST_DB}-wal`);
    if (fs.existsSync(`${TEST_DB}-shm`)) fs.unlinkSync(`${TEST_DB}-shm`);
  }
}

runTests().catch(err => {
  console.error('测试运行失败:', err);
  proc.kill('SIGINT');
  process.exit(1);
});
