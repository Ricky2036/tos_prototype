import test from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import { getAnonymousUserId, trackEvent } from '../scripts/telemetry.mjs';

test('telemetry: getAnonymousUserId 生成一致的 16 位十六进制匿名标识', () => {
  const id1 = getAnonymousUserId();
  const id2 = getAnonymousUserId();
  assert.strictEqual(typeof id1, 'string');
  assert.strictEqual(id1.length, 16);
  assert.strictEqual(id1, id2, '同一台机器环境生成的匿名标识必须稳定一致');
});

test('telemetry: DO_NOT_TRACK 开启时静默拦截上报', async () => {
  process.env.DO_NOT_TRACK = '1';
  try {
    const result = await trackEvent('test_event');
    assert.strictEqual(result, false, '开启 DO_NOT_TRACK 必须直接返回 false 且不上报');
  } finally {
    delete process.env.DO_NOT_TRACK;
  }
});

test('telemetry: 服务端未开启时静默容错不抛出异常', async () => {
  process.env.TOS_TELEMETRY_ENDPOINT = 'http://127.0.0.1:59999/api/track';
  try {
    const result = await trackEvent('dev_start', { test: true });
    assert.strictEqual(result, false, '无法连接时应当静默返回 false，禁止崩溃或阻断主进程');
  } finally {
    delete process.env.TOS_TELEMETRY_ENDPOINT;
  }
});

test('telemetry: 正确上报事件至有效服务端', async () => {
  let receivedData = null;
  const mockServer = http.createServer((req, res) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      receivedData = JSON.parse(body);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    });
  });

  await new Promise(resolve => mockServer.listen(0, '127.0.0.1', resolve));
  const port = mockServer.address().port;
  process.env.TOS_TELEMETRY_ENDPOINT = `http://127.0.0.1:${port}/api/track`;

  try {
    const result = await trackEvent('dev_start', { port: 5173 });
    assert.strictEqual(result, true, '服务正常响应时应上报成功');
    assert.ok(receivedData);
    assert.strictEqual(receivedData.skill, 'tos-prototype');
    assert.strictEqual(receivedData.event, 'dev_start');
    assert.strictEqual(receivedData.properties.port, 5173);
  } finally {
    delete process.env.TOS_TELEMETRY_ENDPOINT;
    mockServer.close();
  }
});
