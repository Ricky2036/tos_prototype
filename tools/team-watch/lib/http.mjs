/**
 * 端口探测（只读）
 * ================
 * 9999 是集成验收口；lane 端口仅作环境信息。
 * 离线/超时/非 2xx 都必须给出准确原因，不吞异常。
 */
export async function probePort(port, timeoutMs = 2000) {
  const url = `http://127.0.0.1:${port}/`
  const started = Date.now()
  try {
    const res = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(timeoutMs) })
    return {
      url,
      up: true,
      status: res.status,
      ok: res.ok,
      ms: Date.now() - started,
      error: null
    }
  } catch (e) {
    const name = e && e.name
    let error = `${name || 'Error'}: ${e && e.message ? e.message : String(e)}`
    if (name === 'TimeoutError' || /timed out/i.test(error)) error = `timeout after ${timeoutMs}ms`
    else if (e && e.cause && e.cause.code) error = `${e.cause.code}: ${e.cause.message || ''}`.trim()
    return { url, up: false, status: null, ok: false, ms: Date.now() - started, error }
  }
}

export async function probeRoots(roots, timeoutMs) {
  const out = {}
  await Promise.all(roots.filter((r) => r.port).map(async (r) => {
    out[r.id] = await probePort(r.port, timeoutMs)
  }))
  return out
}
