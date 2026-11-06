import os from 'node:os';
import http from 'node:http';
import https from 'node:https';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

/**
 * 获取上报服务端地址（动态读取环境变量，支持运行时重定向）
 */
export function getEndpoint() {
  return process.env.TOS_TELEMETRY_ENDPOINT || 'http://localhost:3333/api/track';
}

/**
 * 生成匿名唯一的设备哈希，保护开发者个人隐私
 */
export function getAnonymousUserId() {
  try {
    const rawSeed = `${os.hostname()}::${os.userInfo().username}::${os.platform()}::${os.arch()}`;
    return crypto.createHash('sha256').update(rawSeed).digest('hex').slice(0, 16);
  } catch {
    return 'anon_' + crypto.randomBytes(6).toString('hex');
  }
}

/**
 * 异步非阻塞上报事件
 * @param {string} eventName 事件标识，如 'dev_start' | 'build' | 'scaffold' | 'activate'
 * @param {Record<string, any>} [properties] 附加属性
 * @returns {Promise<boolean>}
 */
export async function trackEvent(eventName, properties = {}) {
  // 遵循通用防追踪标准与自定义关闭开关
  if (process.env.DO_NOT_TRACK === '1' || process.env.TOS_DISABLE_TELEMETRY === '1') {
    return false;
  }

  const payload = {
    skill: 'tos-prototype',
    user_id: getAnonymousUserId(),
    event: eventName,
    platform: process.platform,
    node_version: process.version,
    properties: {
      ...properties,
      timestamp: Date.now()
    }
  };

  return new Promise(resolve => {
    try {
      const endpoint = getEndpoint();
      const targetUrl = new URL(endpoint);
      const isHttps = targetUrl.protocol === 'https:';
      const client = isHttps ? https : http;
      const data = JSON.stringify(payload);

      const req = client.request(
        targetUrl,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(data)
          },
          timeout: 1000 // 严格限制 1 秒超时，避免阻塞开发流程
        },
        res => {
          res.resume(); // 消费响应数据释放 socket
          resolve(res.statusCode >= 200 && res.statusCode < 300);
        }
      );

      // 解除事件循环对该请求的引用，Node 进程退出时无需等待网络请求
      if (req.socket && req.socket.unref) {
        req.socket.unref();
      }
      req.on('socket', socket => {
        socket.unref();
      });

      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });

      req.on('error', () => {
        resolve(false); // 网络错误或服务端未启动时静默忽略
      });

      req.write(data);
      req.end();
    } catch {
      resolve(false);
    }
  });
}

// 支持终端直接命令行调用：node scripts/telemetry.mjs <event> [json_properties]
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const eventName = process.argv[2] || 'activate';
  let properties = {};
  if (process.argv[3]) {
    try {
      properties = JSON.parse(process.argv[3]);
    } catch {
      properties = { raw: process.argv[3] };
    }
  }

  trackEvent(eventName, properties).then(ok => {
    // 仅用于命令行测试输出，失败静默
    if (process.env.DEBUG_TELEMETRY === '1') {
      console.log(`[Telemetry] 上报事件 "${eventName}":`, ok ? '成功' : '未送达 (服务端未开启或已忽略)');
    }
  });
}
