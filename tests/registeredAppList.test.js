import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import {
  getRegisteredApps, findRegisteredApp, resolveAppIcon, registeredAppSize
} from '../src/composables/useRegisteredApps.js'
import { APPS } from '../src/config/apps.js'

const read = (p) => fs.readFileSync(path.resolve(p), 'utf-8')
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '')
const COMPOSABLE = 'src/composables/useRegisteredApps.js'
const LIST = 'src/components/ui/RegisteredAppList.vue'
const ICON = 'src/components/ui/RegisteredAppIcon.vue'

/* ==================== 公共数据层 ==================== */
test('注册应用清单与桌面 APPS 完全同源，图标无空缺', () => {
  const list = getRegisteredApps()
  assert.equal(list.length, APPS.length, '数量必须与桌面注册表一致')
  assert.equal(new Set(list.map(a => a.id)).size, list.length, 'id 不重复')
  for (const a of list) {
    assert.ok(a.id && a.name, '每项都要有 id / name')
    assert.ok(a.image || a.specialApp, `${a.name} 既没有 PNG 也不是桌面自绘图标`)
    if (a.image) assert.match(a.image, /^\/icons\//, `${a.name} 图标必须来自项目图标资源`)
  }
  assert.ok(list.every((a, i) => i === 0 || list[i - 1].name.localeCompare(a.name, 'zh-Hans-CN') <= 0), '按中文名 A-Z 排序')
})

test('special 应用（日历/时钟）交给桌面 AppIcon，不再用静态 PNG 冒充', () => {
  const calendar = findRegisteredApp('calendar')
  const clock = findRegisteredApp('clock')
  assert.ok(calendar.specialApp && clock.specialApp)
  assert.equal(calendar.image, '')
  assert.equal(clock.image, '')
  assert.equal(resolveAppIcon({ id: 'calendar', special: 'calendar' }).image, '')
  const desktop = strip(read('src/components/ui/AppIcon.vue'))
  assert.match(desktop, /app\.special === 'calendar'/)
  assert.match(desktop, /app\.special === 'clock'/)
})

test('按 id 或中文名都能查到同一应用；展示大小稳定', () => {
  assert.equal(findRegisteredApp('微信')?.id, findRegisteredApp('wechat')?.id)
  assert.equal(findRegisteredApp('不存在的'), null)
  const a = getRegisteredApps()[0]
  assert.equal(registeredAppSize(a, 0), registeredAppSize(a, 0))
  assert.match(registeredAppSize(a, 0), /MB|GB/)
})

/* ==================== 公共组件契约 ==================== */
test('RegisteredAppList 默认读注册表，右侧/搜索/点击由调用方注入', () => {
  const src = strip(read(LIST))
  assert.match(src, /getRegisteredApps\(\)/, '默认清单必须来自公共注册表')
  assert.match(src, /import ListCell from '\.\/ListCell\.vue'/)
  assert.match(src, /import RegisteredAppIcon from '\.\/RegisteredAppIcon\.vue'/)
  assert.match(src, /data-registered-app-list/)
  assert.match(src, /<slot name="right"/, '右侧要能被勿扰开关 / 应用列表数值覆盖')
  assert.match(src, /emit\('row-click', app\)/)
  assert.match(src, /props\.query/, '支持搜索过滤')
})

test('RegisteredAppIcon 三种来源优先级固定，且不再有首字色块', () => {
  const src = strip(read(ICON))
  assert.match(src, /findRegisteredApp/)
  assert.match(src, /:app="resolved\.specialApp"/, 'special → 桌面 AppIcon')
  assert.match(src, /src \|\| resolved\.image/, 'PNG 优先注册表、其次外部真实资源')
  assert.match(src, /LIcon v-else/, '兜底用通用图标')
  assert.doesNotMatch(src, /slice\(0, ?1\)|首字|background: meta|APP_ICONS/, '⛔ 禁止首字 + 彩色底块假图标')
})

/* ==================== 防回潮：应用列表页不许再自造清单 ==================== */
test('勿扰「应用提醒」与设置「应用列表」都接入公共组件，硬编码清单已删除', () => {
  const dnd = strip(read('src/components/apps/settings/dnd/DndAppsPage.vue'))
  const g3 = strip(read('src/components/apps/settings/group3/Group3SubPage.vue'))
  assert.match(dnd, /RegisteredAppList/, '勿扰应用提醒必须用公共列表')
  assert.match(dnd, /isAllowed\(app\.id\)/, '按注册表 id 关联开关')
  assert.doesNotMatch(dnd, /dndApps\.js|dndAppFallback|is-fallback|DND_APPS/, '不得再引用硬编码清单')
  assert.match(g3, /getRegisteredApps\(\)/, '设置应用列表必须用公共注册表')
  assert.match(g3, /RegisteredAppIcon/, '图标走公共组件')
  assert.doesNotMatch(g3, /resolveAppImage|appIconStyle|g3-app-icon|g3-live-icon/, '不得再自造图标')
  assert.equal(fs.existsSync(path.resolve('src/components/apps/settings/dnd/dndApps.js')), false,
    '硬编码的 dndApps.js 应已移除')
})

test('设置目录下不允许再出现新的「应用清单常量」或首字色块工具', () => {
  const offenders = []
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name)
      if (e.isDirectory()) walk(p)
      else if (e.name.endsWith('.js') || e.name.endsWith('.vue')) {
        const t = read(p)
        if (/export const (DND_APPS|APP_LIST|APPLICATIONS)\b/.test(t)) offenders.push(`${p}: 硬编码清单`)
        if (/appIconStyle|dndAppFallback/.test(t)) offenders.push(`${p}: 首字色块工具`)
      }
    }
  }
  walk('src/components/apps/settings')
  assert.deepEqual(offenders, [], offenders.join('\n'))
})

test('守卫有牙齿：把公共列表的默认数据源换掉 / 塞回色块都要报红', () => {
  const src = strip(read(LIST))
  assert.match(src, /getRegisteredApps\(\)/)
  assert.doesNotMatch(src.replace('getRegisteredApps()', '[]'), /default: \(\) => getRegisteredApps\(\)/)
  const icon = strip(read(ICON))
  assert.doesNotMatch(icon, /slice\(0, ?1\)/)
  assert.match(icon.replace('LIcon v-else', 'LIcon v-else') + '\n{{ x.slice(0,1) }}', /slice\(0,1\)/, '判据本身能抓到色块写法')
})
