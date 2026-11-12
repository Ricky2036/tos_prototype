/**
 * vueRuntime —— 让 node --test 里的断言跑在**真实渲染结果**上
 * ================================================================
 * 背景：S2 主壳要从「34 个页面静态 import」改成「glob 自注册」。
 *       原先那批 `readFileSync(X.vue)` + 正则的断言，一改 import 就整片假红，
 *       而且它们只证明「源码里有这串字符」，不证明「页面上真有这个东西」。
 *
 * 这里起一个最小 Vite dev server（只挂 @vitejs/plugin-vue，绕开 vite.config.js
 * 里的 save-defaults / telemetry 等副作用插件）+ 本机 Chrome，把 .vue 组件真正
 * 挂载进 DOM。之后断言的是渲染后的节点、文案、计算样式、点击后的路由变化。
 *
 * 约束：只放在 tests/ 下，不改 src/，不改 package.json，不依赖 jsdom。
 * 每个测试文件一个独立 server + browser；cacheDir 按 pid 隔离，避免并发预构建互踩。
 */
import { createServer } from 'vite'
import vue from '@vitejs/plugin-vue'
import { chromium } from 'playwright'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

/** 本机没有 bundled chromium 时退回系统 Chrome；两者都没有就交给 playwright 自己报错 */
function launchOptions() {
  const opts = { headless: true }
  const fromEnv = process.env.WB_CHROME
  if (fromEnv && fs.existsSync(fromEnv)) opts.executablePath = fromEnv
  else if (fs.existsSync(CHROME)) opts.executablePath = CHROME
  return opts
}

const HARNESS = `<!doctype html>
<html><head><meta charset="utf-8"><title>wb-runtime</title>
<style>
  html, body { margin: 0; padding: 0; }
  /* 真机画布：子页多为 position:absolute + inset:0，宿主没有高度就量不到可见像素 */
  .wb-host { position: relative; width: 360px; height: 788px; overflow: hidden; }
</style>
</head>
<body>
<script type="module">
  import { createApp, h, ref, computed, nextTick, watch } from 'vue'
  import { createPinia, setActivePinia } from 'pinia'
  import '/src/styles/tokens.css'
  import '/src/styles/global.css'
  import '/src/styles/layer-transitions.css'
  window.__wb = { createApp, h, ref, computed, nextTick, watch, createPinia, setActivePinia }
  window.__wbHosts = new Map()
  window.__wbSeq = 0
  window.__wbReady = true
</script>
</body></html>`

function harnessPlugin() {
  return {
    name: 'wb-runtime-harness',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!(req.url || '').startsWith('/__wb__')) return next()
        const html = await server.transformIndexHtml(req.url || '/__wb__/', HARNESS)
        res.setHeader('Content-Type', 'text/html; charset=utf-8')
        res.end(html)
      })
    },
  }
}

/**
 * 启动一次运行时。返回的对象需在测试结束后 close()。
 * 典型用法：
 *   const rt = await createRuntime()
 *   const h = await rt.mount('/src/components/apps/settings/SettingsApp.vue')
 *   assert.equal(await rt.count(h, '.settings-card'), 8)
 *   await rt.close()
 */
export async function createRuntime() {
  const server = await createServer({
    root: ROOT,
    configFile: false,
    logLevel: 'error',
    cacheDir: path.join(os.tmpdir(), `wb-vite-${process.pid}`),
    plugins: [vue(), harnessPlugin()],
    server: { host: '127.0.0.1', port: 0, strictPort: false },
    optimizeDeps: { noDiscovery: true, include: ['vue', 'pinia'] },
  })
  await server.listen()
  const base = server.resolvedUrls?.local?.[0]
  if (!base) throw new Error('Vite dev server 没给出可访问地址')

  const browser = await chromium.launch(launchOptions())
  const page = await browser.newPage({ viewport: { width: 360, height: 788 } })
  const pageErrors = []
  page.on('pageerror', (e) => pageErrors.push(e.message))
  await page.goto(`${base}__wb__/`, { waitUntil: 'load' })
  await page.waitForFunction(() => window.__wbReady === true, null, { timeout: 15000 })

  /** 浏览器端统一取 host：所有查询都落在这个容器里，不污染 document 其它部分 */
  const H = (id) => `window.__wbHosts.get(${JSON.stringify(id)})?.host`
  const call = (fnBody, arg) =>
    page.evaluate(
      ({ fnBody, arg }) => {
        // eslint-disable-next-line no-new-func
        const fn = new Function('arg', `return (${fnBody})(arg)`)
        return fn(arg)
      },
      { fnBody, arg },
    )

  const api = {
    page,
    pageErrors,
    base,

    /** 挂载一个 .vue 组件（路径以 /src/ 开头），返回 host id */
    async mount(componentPath, props = {}, opts = {}) {
      return page.evaluate(
        async ({ componentPath, props, opts }) => {
          const mod = await import(/* @vite-ignore */ componentPath)
          const Comp = mod.default
          const host = document.createElement('div')
          host.className = 'wb-host'
          host.id = `wb-host-${++window.__wbSeq}`
          document.body.appendChild(host)
          const app = window.__wb.createApp(Comp, props)
          let pinia = null
          if (opts.pinia !== false) {
            pinia = window.__wb.createPinia()
            app.use(pinia)
            window.__wb.setActivePinia(pinia)
          }
          app.config.warnHandler = () => {}
          app.mount(host)
          await window.__wb.nextTick()
          host.__wbPinia = pinia
          window.__wbHosts.set(host.id, { host, app, pinia })
          return host.id
        },
        { componentPath, props, opts },
      )
    },

    /** 批量挂载：逐个 import + mount，单个失败不影响其它（返回每条的 path/id/error） */
    async mountMany(componentPaths, opts = {}) {
      return page.evaluate(
        async ({ componentPaths, opts }) => {
          const out = []
          for (const p of componentPaths) {
            try {
              const mod = await import(/* @vite-ignore */ p)
              const host = document.createElement('div')
              host.className = 'wb-host'
              host.id = `wb-host-${++window.__wbSeq}`
              document.body.appendChild(host)
              const app = window.__wb.createApp(mod.default, {})
              let pinia = null
              if (opts.pinia !== false) {
                pinia = window.__wb.createPinia()
                app.use(pinia)
                window.__wb.setActivePinia(pinia)
              }
              app.config.warnHandler = () => {}
              app.mount(host)
              await window.__wb.nextTick()
              host.__wbPinia = pinia
              window.__wbHosts.set(host.id, { host, app, pinia })
              out.push({ path: p, id: host.id })
            } catch (e) {
              out.push({ path: p, id: null, error: String(e && e.message || e) })
            }
          }
          return out
        },
        { componentPaths, opts },
      )
    },

    async unmount(id) {
      await page.evaluate((hostId) => {
        const rec = window.__wbHosts.get(hostId)
        if (!rec) return
        rec.app.unmount()
        rec.host.remove()
        window.__wbHosts.delete(hostId)
      }, id)
    },

    /** 等 Vue 更新 + 可选的过渡时长（ms） */
    async settle(id, ms = 0) {
      await page.evaluate(
        async ({ ms }) => {
          await window.__wb.nextTick()
          if (ms > 0) await new Promise((r) => setTimeout(r, ms))
        },
        { ms },
      )
    },

    /** host 的全部可见文本（归一化空白） */
    async allText(id) {
      return call(
        `() => (${H(id)}?.textContent || '').replace(/\\s+/g, ' ').trim()`,
        null,
      )
    },

    async text(id, selector) {
      return call(
        `(a) => { const h = ${H(id)}; return (a.sel ? h.querySelector(a.sel) : h)?.textContent ?? null }`,
        { sel: selector || null },
      )
    },

    async texts(id, selector) {
      return call(
        `(a) => [...${H(id)}.querySelectorAll(a.sel)].map(e => e.textContent.trim())`,
        { sel: selector },
      )
    },

    async count(id, selector) {
      return call(`() => ${H(id)}.querySelectorAll(${JSON.stringify(selector)}).length`, null)
    },

    async exists(id, selector) {
      return call(`() => !!${H(id)}.querySelector(${JSON.stringify(selector)})`, null)
    },

    /** 只数看得见的像素：恒渲染槽位 + display:none 会让「数节点」假绿（红线 5） */
    async visibleCount(id, selector) {
      return call(
        `() => [...${H(id)}.querySelectorAll(${JSON.stringify(selector)})].filter(e => {
           const r = e.getBoundingClientRect()
           return r.width > 0 && r.height > 0 && getComputedStyle(e).display !== 'none'
         }).length`,
        null,
      )
    },

    async style(id, selector, prop) {
      return call(
        `(a) => { const e = ${H(id)}.querySelector(a.sel); return e ? getComputedStyle(e)[a.prop] : null }`,
        { sel: selector, prop },
      )
    },

    async styleMap(id, selector, props) {
      return call(
        `(a) => { const e = ${H(id)}.querySelector(a.sel); if (!e) return null;
           const cs = getComputedStyle(e); const o = {};
           for (const p of a.props) o[p] = cs[p]; return o }`,
        { sel: selector, props },
      )
    },

    async styleOfAll(id, selector, prop) {
      return call(
        `(a) => [...${H(id)}.querySelectorAll(a.sel)].map(e => getComputedStyle(e)[a.prop])`,
        { sel: selector, prop },
      )
    },

    async rect(id, selector) {
      return call(
        `() => { const e = ${H(id)}.querySelector(${JSON.stringify(selector)});
           if (!e) return null; const r = e.getBoundingClientRect();
           return { width: r.width, height: r.height, top: r.top, left: r.left } }`,
        null,
      )
    },

    async rects(id, selector) {
      return call(
        `() => [...${H(id)}.querySelectorAll(${JSON.stringify(selector)})].map(e => {
           const r = e.getBoundingClientRect(); return { width: r.width, height: r.height } })`,
        null,
      )
    },

    async classes(id, selector) {
      return call(
        `() => { const e = ${H(id)}.querySelector(${JSON.stringify(selector)});
           return e ? [...e.classList] : [] }`,
        null,
      )
    },

    async attr(id, selector, name) {
      return call(
        `(a) => ${H(id)}.querySelector(a.sel)?.getAttribute(a.name) ?? null`,
        { sel: selector, name },
      )
    },

    /** 真实点击：派发到 DOM 节点，随后等 Vue 更新 + 过渡 */
    async click(id, selector, ms = 280) {
      const ok = await page.evaluate(
        ({ hostId, sel }) => {
          const h = window.__wbHosts.get(hostId)?.host
          const el = h?.querySelector(sel)
          if (!el) return false
          el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }))
          return true
        },
        { hostId: id, sel: selector },
      )
      if (!ok) throw new Error(`click 目标不存在：${selector}`)
      await api.settle(id, ms)
      return ok
    },

    /** 点击带指定文案的元素（ListCell 渲染后文本在 .lc-title 里） */
    async clickText(id, selector, text, ms = 280) {
      const ok = await page.evaluate(
        ({ hostId, sel, text }) => {
          const h = window.__wbHosts.get(hostId)?.host
          const el = [...(h?.querySelectorAll(sel) || [])].find((e) => e.textContent.trim().includes(text))
          if (!el) return false
          el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }))
          return true
        },
        { hostId: id, sel: selector, text },
      )
      if (!ok) throw new Error(`clickText 没找到包含「${text}」的 ${selector}`)
      await api.settle(id, ms)
      return ok
    },

    /** 派发任意 DOM 事件（pointer / input / change 等） */
    async dispatch(id, selector, type, init = {}, ms = 0) {
      const ok = await page.evaluate(
        ({ hostId, sel, type, init }) => {
          const h = window.__wbHosts.get(hostId)?.host
          const el = h?.querySelector(sel)
          if (!el) return false
          const Ctor = type.startsWith('pointer') ? PointerEvent : type.startsWith('touch') ? TouchEvent : Event
          el.dispatchEvent(new Ctor(type, { bubbles: true, cancelable: true, ...init }))
          return true
        },
        { hostId: id, sel: selector, type, init },
      )
      if (!ok) throw new Error(`dispatch 目标不存在：${selector}`)
      await api.settle(id, ms)
      return ok
    },

    /** CSSOM 里是否真有这条规则（比「源码文本里有类名」强：浏览器是否认得它） */
    async hasCssRule(needle) {
      return page.evaluate((n) => {
        for (const sheet of document.styleSheets) {
          let rules
          try { rules = sheet.cssRules } catch { continue }
          for (const r of rules) if (r.cssText && r.cssText.includes(n)) return true
        }
        return false
      }, needle)
    },

    /** 点击后记录 host 内出现过的 class 序列（Transition 类名出现→消失） */
    async clickAndRecordClasses(id, selector, ms = 420) {
      return page.evaluate(
        async ({ hostId, sel, ms }) => {
          const h = window.__wbHosts.get(hostId).host
          const seen = []
          const grab = (node) => {
            if (node.nodeType === 1 && node.className && typeof node.className === 'string') {
              for (const c of node.classList) seen.push(c)
            }
          }
          const obs = new MutationObserver((muts) => {
            for (const m of muts) {
              if (m.type === 'attributes') grab(m.target)
              if (m.type === 'childList') for (const n of m.addedNodes) grab(n)
            }
          })
          obs.observe(h, { subtree: true, attributes: true, attributeFilter: ['class'], childList: true })
          const el = h.querySelector(sel)
          if (el) el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }))
          await new Promise((r) => setTimeout(r, ms))
          obs.disconnect()
          return [...new Set(seen)]
        },
        { hostId: id, sel: selector, ms },
      )
    },

    /** 逃生舱：直接在页面上下文里跑一段函数，参数用第二个对象传 */
    async evaluate(fn, arg) {
      return page.evaluate(fn, arg)
    },

    /** 页面里再动态 import 一个模块（用于运行时读组件导出的常量 / 操作 store） */
    async importKeys(spec) {
      return page.evaluate(async (s) => Object.keys(await import(/* @vite-ignore */ s)), spec)
    },

    async close() {
      await browser.close().catch(() => {})
      await server.close().catch(() => {})
    },
  }

  return api
}
