<script setup>
import { computed, ref } from 'vue'
import SubPageShell from '../subpage/SubPageShell.vue'
import ListCell from '../../../ui/ListCell.vue'
import ToggleSwitch from '../../../ui/ToggleSwitch.vue'
import LIcon from '../../../ui/LIcon.vue'
import SettingsSearchBar from '../../../ui/SettingsSearchBar.vue'
import { APP_ICONS, getGroup3Page } from './pages.js'
import { useSettingsGroup3Store } from '../../../../stores/settingsGroup3Store.js'
import { APPS, getApp } from '../../../../config/apps.js'
import { DRAWER_APPS } from '../../../../config/drawerApps.js'

/**
 * 第三组卡片三级/四级页通用渲染器。
 *
 * 只负责把 `group3/pages.js` 的配置翻译成页面；新增/修改页面一律改配置，
 * 不另写组件，避免一组的视觉漂开。外壳复用 `SubPageShell`（GlassNavBar +
 * 卡片/分组/说明/单选圆点的 :deep() 样式），转场由各二级页统一给。
 */
const props = defineProps({
  pageKey: { type: String, required: true },
  titleOverride: { type: String, default: '' }
})
const emit = defineEmits(['back', 'navigate', 'action'])

const store = useSettingsGroup3Store()
const page = computed(() => getGroup3Page(props.pageKey))
const title = computed(() => props.titleOverride || page.value?.title || '设置')
const query = ref('')

/* 配置里的图标名 → LUCIDE 的 camelCase 键（只认 lucide.js 里真实存在的键） */
const ICON_MAP = {
  grid: 'grid2x2',
  'map-pin': 'mapPin',
  camera: 'camera',
  mic: 'mic',
  plus: 'plus',
  'cloud-off': 'cloudOff',
  shield: 'shieldCheck',
  lock: 'lockKeyhole',
  face: 'scanFace'
}

const HERO_ICONS = {
  keypad: 'grid2x2',
  pattern: 'grid2x2',
  face: 'scanFace',
  lock: 'lockKeyhole',
  shield: 'shieldCheck',
  peek: 'eye',
  lend: 'smartphone',
  dual: 'layers',
  location: 'mapPin',
  appIcon: 'sparkles'
}

function iconName(row) {
  return ICON_MAP[row.icon] || ''
}

function appIconStyle(name) {
  const meta = APP_ICONS[name] || APP_ICONS.generic
  return { background: meta.bg, color: meta.fg }
}

function appIconText(name) {
  return (APP_ICONS[name] || APP_ICONS.generic).text
}

function isTextBadge(icon) {
  return icon === '123' || icon === '258'
}

/* 应用列表直接读桌面注册表：名字、图标路径与桌面/Dock/抽屉是同一份数据。
   ⚠️ 日历/时钟是 special 自绘图标，APPS 里没有 image，而 getApp 命中 primary 后
   不会再查 DRAWER_APPS；且 DRAWER_APPS 写的 /icons/calendar.png 并不存在。
   应用抽屉实际用的是 drawer/ 下这套资源，这里显式兜底，否则会渲染空白图标。 */
const SPECIAL_APP_ICONS = {
  calendar: '/icons/drawer/calendar_alt.png',
  clock: '/icons/drawer/clock.png'
}

function resolveAppImage(app) {
  return app.image || SPECIAL_APP_ICONS[app.id] ||
    DRAWER_APPS.find(d => d.id === app.id)?.icon || getApp(app.id)?.image || ''
}

const APP_SIZES = ['8.68 MB', '170 MB', '469 MB', '593 MB', '785 MB', '858 MB', '1.61 GB', '2.31 GB', '2.77 GB', '3.42 GB']
const registeredAppRows = computed(() => {
  return [...APPS]
    .sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN'))
    .map((app, i) => ({
      title: app.name,
      appId: app.id,
      appImage: resolveAppImage(app),
      value: APP_SIZES[(app.id.length + i) % APP_SIZES.length],
      chevron: true,
      action: 'appDetail'
    }))
})

function rowsFor(sec) {
  // ⚠️ useRegisteredApps 是【页面级】标志，不是 section 级。
  return page.value?.useRegisteredApps ? registeredAppRows.value : (sec.rows || [])
}

function filteredRows(sec) {
  const rows = rowsFor(sec)
  if (!props.pageKey || !page.value?.search) return rows
  const q = query.value.trim().toLowerCase()
  if (!q) return rows
  return rows.filter(r => (r.title || '').toLowerCase().includes(q))
}

function onRowClick(row) {
  if (row.toggle || row.radio || row.disabled) return
  if (row.action) {
    emit('navigate', { key: row.action, title: row.actionTitle ? row.title : '' })
  } else if (row.chevron || row.run) {
    emit('action', row.title)
  }
}

function onLinkClick(link) {
  if (link.action) emit('navigate', { key: link.action, title: '' })
  else emit('action', link.label)
}

function onToggle(row, value) {
  store.setSwitch(row.toggle, value)
}

function onRadio(row) {
  store.setChoice(row.radio, row.radioValue)
}

/* 环形图：按 segments 的值占比生成 dasharray（真机「过去 24 小时」权限使用分布） */
const donutSegments = computed(() => {
  const d = page.value?.sections?.find(s => s.donut)?.donut
  if (!d) return []
  const total = d.segments.reduce((sum, s) => sum + s.value, 0) || 1
  const circumference = 2 * Math.PI * 62
  let offset = 0
  return d.segments.map(s => {
    const len = (s.value / total) * circumference * 0.78
    const seg = { ...s, dash: `${len} ${circumference - len}`, offset: -offset, gap: 0 }
    offset += len + 6
    return seg
  })
})

const donutLabel = computed(() => page.value?.sections?.find(s => s.donut)?.donut?.label || '')
</script>

<template>
  <SubPageShell
    :title="title"
    :floating-action="page?.cta || ''"
    @back="emit('back')"
    @action="emit('action', page?.cta || '')"
  >
    <template v-if="page">
      <!-- 排序标签（应用列表） -->
      <div v-if="page.sort" class="g3-sort">{{ page.sort }}
        <LIcon name="arrowDownUp" :size="13" :stroke-width="1.8" />
      </div>

      <!-- 顶层头图：纯引导页 / 功能说明页共用，避免「配置写了却不渲染」的静默失效 -->
      <div v-if="page.hero" class="g3-hero" :class="`is-${page.hero.variant}`">
        <div class="g3-hero-art">
          <div v-if="page.hero.variant === 'appIcon'" class="g3-hero-app">F</div>
          <LIcon v-else :name="HERO_ICONS[page.hero.variant] || 'shieldCheck'" :size="54" :stroke-width="1.35" />
        </div>
        <div v-if="page.hero.title" class="g3-hero-title">{{ page.hero.title }}</div>
        <div v-if="page.hero.caption" class="g3-hero-caption">{{ page.hero.caption }}</div>
        <div v-if="page.hero.dots" class="g3-hero-dots">
          <span v-for="i in page.hero.dots" :key="i" class="g3-dot" :class="{ on: i === 1 }"></span>
        </div>
      </div>

      <template v-for="(sec, si) in page.sections" :key="si">
        <!-- 头图 -->
        <div v-if="sec.hero" class="g3-hero" :class="`is-${sec.hero.variant}`">
          <div class="g3-hero-art">
            <div v-if="sec.hero.variant === 'appIcon'" class="g3-hero-app">F</div>
            <LIcon v-else :name="HERO_ICONS[sec.hero.variant] || 'shieldCheck'" :size="54" :stroke-width="1.35" />
          </div>
          <div v-if="sec.hero.title" class="g3-hero-title">{{ sec.hero.title }}</div>
          <div v-if="sec.hero.caption" class="g3-hero-caption">{{ sec.hero.caption }}</div>
          <div v-if="sec.hero.dots" class="g3-hero-dots">
            <span v-for="i in sec.hero.dots" :key="i" class="g3-dot" :class="{ on: i === 1 }"></span>
          </div>
        </div>

        <!-- 空态 -->
        <div v-else-if="sec.empty" class="g3-empty">
          <div class="g3-empty-art"><LIcon name="packageBox" :size="46" :stroke-width="1.2" /></div>
          <div class="g3-empty-text">{{ sec.empty.text }}</div>
        </div>

        <!-- 权限使用环形图 -->
        <div v-else-if="sec.donut" class="g3-donut">
          <svg viewBox="0 0 160 160" width="160" height="160" aria-hidden="true">
            <circle cx="80" cy="80" r="62" fill="none" stroke="#E5E5EA" stroke-width="14" />
            <circle
              v-for="(seg, i) in donutSegments"
              :key="i"
              cx="80" cy="80" r="62" fill="none"
              :stroke="seg.color" stroke-width="14" stroke-linecap="round"
              :stroke-dasharray="seg.dash"
              :stroke-dashoffset="seg.offset"
              transform="rotate(-90 80 80)"
            />
          </svg>
          <div class="g3-donut-label">{{ donutLabel }}</div>
          <div class="g3-donut-legend">
            <span v-for="(seg, i) in sec.donut.segments" :key="i">
              <i :style="{ background: seg.color }"></i>{{ seg.name }}
            </span>
          </div>
        </div>

        <!-- 蓝色链接块（你可能想找 / 查看全部权限） -->
        <div v-else-if="sec.links" class="g3-link-box" :class="{ 'is-pill': !sec.title }">
          <div v-if="sec.title" class="g3-link-title">{{ sec.title }}</div>
          <button
            v-for="(link, li) in sec.links"
            :key="li"
            type="button"
            class="g3-link"
            :class="{ 'is-pill-link': !sec.title }"
            @click="onLinkClick(link)"
          >{{ link.label }}</button>
        </div>

        <!-- 蓝色引导小标题（权限授予页） -->
        <div v-else-if="sec.accentNote" class="g3-accent-note">{{ sec.accentNote }}</div>

        <!-- 多段说明 -->
        <div v-else-if="sec.notes" class="g3-notes">
          <p v-for="(n, ni) in sec.notes" :key="ni">{{ n }}</p>
        </div>

        <!-- 卡片 -->
        <template v-else>
          <div v-if="sec.header" class="section-header">{{ sec.header }}</div>
          <div v-if="filteredRows(sec).length" class="settings-card">
            <ListCell
              v-for="(row, ri) in filteredRows(sec)"
              :key="`${row.title}-${ri}`"
              :title="row.title"
              :subtitle="row.subtitle || ''"
              :value="row.value || ''"
              :chevron="Boolean(row.chevron) && !row.toggle && !row.radio"
              :clickable="Boolean(row.toggle || row.radio || row.chevron || row.run)"
              :disabled="Boolean(row.disabled)"
              :last="ri === filteredRows(sec).length - 1"
              @click="onRowClick(row)"
            >
              <template v-if="row.appImage" #icon>
                <img class="g3-app-icon is-image" :src="row.appImage" alt="" draggable="false" />
              </template>
              <template v-else-if="row.appIcon" #icon>
                <div class="g3-app-icon" :style="appIconStyle(row.appIcon)">{{ appIconText(row.appIcon) }}</div>
              </template>
              <template v-else-if="row.icon && isTextBadge(row.icon)" #icon>
                <div class="g3-badge-icon">{{ row.icon }}</div>
              </template>
              <template v-else-if="row.icon && iconName(row)" #icon>
                <div class="g3-glyph-icon"><LIcon :name="iconName(row)" :size="19" :stroke-width="1.8" /></div>
              </template>

              <template v-if="row.toggle" #right>
                <ToggleSwitch
                  color="blue"
                  :model-value="store.getSwitch(row.toggle)"
                  @update:model-value="v => onToggle(row, v)"
                  @click.stop
                />
              </template>
              <template v-else-if="row.radio" #right>
                <span class="opt-radio" :class="{ checked: store.getChoice(row.radio) === row.radioValue }"></span>
              </template>
            </ListCell>
          </div>
          <div v-if="sec.note" class="card-note">{{ sec.note }}</div>
        </template>
      </template>

      <!-- 与首页一致的底部留白：44 搜索框 + 25 底距 + 余量 -->
      <div v-if="page.search" class="g3-search-spacer"></div>

      <div v-if="page.footerBadge" class="g3-footer-badge">
        <LIcon name="shieldCheck" :size="13" :stroke-width="2" />
        <span>{{ page.footerBadge }}</span>
      </div>
    </template>

    <!-- 统一控件：与设置首页同一个 SettingsSearchBar，位置/渐隐参数也完全一致 -->
    <template #bottom>
      <div v-if="page?.search" class="g3-floating-search">
        <SettingsSearchBar v-model="query" placeholder="搜索" @clear="query = ''" />
      </div>
    </template>
  </SubPageShell>
</template>

<style scoped>
.g3-sort {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  color: #8E8E93;
  padding: 4px 4px 8px;
}

/* ===== 头图：统一光晕 + 单色线性图标，不自绘应用图标 ===== */
.g3-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 18px 12px 16px;
  margin-bottom: 4px;
}
.g3-hero-art {
  width: 132px;
  height: 132px;
  border-radius: 50%;
  background: radial-gradient(circle at 40% 35%, #FFFFFF 0%, #EAF1FF 55%, #DFE9FB 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2F6BF6;
  margin-bottom: 12px;
}
.g3-hero.is-peek .g3-hero-art,
.g3-hero.is-lend .g3-hero-art { background: radial-gradient(circle at 40% 35%, #FFFFFF 0%, #E9F7EF 55%, #DCEFE3 100%); color: #34A853; }
.g3-hero.is-dual .g3-hero-art { background: radial-gradient(circle at 40% 35%, #FFFFFF 0%, #E9F7EF 55%, #D8EEDF 100%); color: #34A853; }
.g3-hero.is-location .g3-hero-art { background: transparent; color: #1C1C1E; }
.g3-hero.is-appIcon .g3-hero-art { width: 60px; height: 60px; border-radius: 18px; background: #EEF1F6; color: #6E7BEF; }
.g3-hero-app { font-size: 28px; font-weight: 600; }
.g3-hero-title { font-size: 17px; font-weight: 600; color: #1C1C1E; margin-bottom: 6px; }
.g3-hero-caption { font-size: 13px; line-height: 19px; color: #8E8E93; max-width: 280px; }
.g3-hero-dots { display: flex; gap: 6px; margin-top: 14px; }
.g3-dot { width: 6px; height: 6px; border-radius: 50%; background: #D1D1D6; }
.g3-dot.on { background: #3C3C43; }

/* ===== 空态 ===== */
.g3-empty { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 96px 0 40px; }
.g3-empty-art { color: #D7DAE2; }
.g3-empty-text { font-size: 14px; color: #8E8E93; }

/* ===== 环形图 ===== */
.g3-donut { position: relative; display: flex; flex-direction: column; align-items: center; padding: 8px 0 16px; }
.g3-donut-label { position: absolute; top: 76px; font-size: 14px; color: #3C3C43; }
.g3-donut-legend { display: flex; gap: 14px; font-size: 13px; color: #3C3C43; margin-top: 4px; }
.g3-donut-legend span { display: inline-flex; align-items: center; gap: 5px; }
.g3-donut-legend i { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }

/* ===== 蓝色链接块 ===== */
.g3-link-box {
  background: #F2F3F6;
  border-radius: 16px;
  padding: 14px 16px;
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 14px;
}
.g3-link-box.is-pill { background: transparent; padding: 4px 0 12px; }
.g3-link-title { font-size: 13px; color: #8E8E93; }
.g3-link {
  border: none;
  background: none;
  padding: 0;
  font-family: inherit;
  font-size: 15px;
  font-weight: 500;
  color: #2F6BF6;
  cursor: pointer;
  text-align: left;
}
.g3-link:active { opacity: 0.6; }
.g3-link.is-pill-link {
  background: #FFFFFF;
  border-radius: 20px;
  padding: 9px 16px;
  font-size: 14px;
}

/* ===== 说明 ===== */
.g3-accent-note { font-size: 13px; color: #2F6BF6; padding: 4px 4px 10px; }
.g3-notes { padding: 0 4px 14px; }
.g3-notes p { margin: 0 0 8px; font-size: 13px; line-height: 19px; color: #8E8E93; }

/* ===== 行内图标 ===== */
.g3-app-icon.is-image {
  object-fit: cover;
  border: 0.5px solid rgba(0, 0, 0, 0.06);
}
.g3-app-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 17px;
  font-weight: 600;
  margin-right: 14px;
  flex: none;
}
.g3-glyph-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3C3C43;
  margin-right: 14px;
  flex: none;
}
.g3-badge-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1.5px solid #C7C7CC;
  color: #3C3C43;
  font-size: 11px;
  font-weight: 600;
  margin-right: 14px;
  flex: none;
}

/* ===== 底部悬浮搜索栏 =====
   ⚠️ 参数逐项对齐 SettingsApp.vue 的 .settings-floating-search（真机实测）：
   左右 27 / 离屏底 25 / 高 44（在 SettingsSearchBar 内）/ 底部渐隐遮罩。
   有单测守卫比对两处数值，改一边不改进另一边会立刻红。 */
.g3-floating-search {
  position: absolute;
  bottom: 25px;
  left: 27px;
  right: 27px;
  z-index: 10;
  pointer-events: auto;
}
.g3-floating-search::before {
  content: '';
  position: absolute;
  z-index: -1;
  left: -27px;
  right: -27px;
  top: -34px;
  bottom: -25px;
  background: linear-gradient(
    to bottom,
    rgba(240, 241, 242, 0) 0%,
    rgba(240, 241, 242, 0.88) 38%,
    #F0F1F2 68%,
    #F0F1F2 100%
  );
  pointer-events: none;
}
.g3-search-spacer {
  height: 92px;
  width: 100%;
  flex: none;
}

.g3-footer-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  color: #34C759;
  font-size: 12px;
  font-weight: 500;
  padding: 8px 0 4px;
}
.g3-footer-badge span { color: #8E8E93; }
</style>
