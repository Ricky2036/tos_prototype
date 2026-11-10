<script setup>
import { computed, ref } from 'vue'
import SubPageShell from '../subpage/SubPageShell.vue'
import ListCell from '../../../ui/ListCell.vue'
import ToggleSwitch from '../../../ui/ToggleSwitch.vue'
import LIcon from '../../../ui/LIcon.vue'
import SettingsSearchDock from '../../../ui/SettingsSearchDock.vue'
import AppIcon from '../../../ui/AppIcon.vue'
import { getGroup3Page } from './pages.js'
import { useSettingsGroup3Store } from '../../../../stores/settingsGroup3Store.js'
import { getApp } from '../../../../config/apps.js'
import { getRegisteredApps, registeredAppSize } from '../../../../composables/useRegisteredApps.js'
import RegisteredAppIcon from '../../../ui/RegisteredAppIcon.vue'
import { useNotificationsStore } from '../../../../stores/notificationsStore.js'

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
const notificationsStore = useNotificationsStore()
const page = computed(() => getGroup3Page(props.pageKey))
const title = computed(() => {
  // 单应用使用时间页：真机标题栏显示应用名，不是页面配置里的固定标题
  if (page.value?.titleFrom === 'selectedApp') return store.selectedApp.name
  return props.titleOverride || page.value?.title || '设置'
})
const query = ref('')
const searchActive = ref(false)

function closeSearch() {
  query.value = ''
  searchActive.value = false
}
const tipDismissed = ref(false)

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

function isTextBadge(icon) {
  return icon === '123' || icon === '258'
}

/* 应用列表一律走全仓公共清单 `getRegisteredApps()`（桌面注册表），
   图标交给 `RegisteredAppIcon` —— 不再在本渲染器里另写名单或首字色块。 */
const registeredAppRows = computed(() => getRegisteredApps().map((app, i) => ({
  title: app.name,
  appId: app.id,
  app,
  value: registeredAppSize(app, i),
  chevron: true,
  action: 'appDetail'
})))

/* 默认应用点某一行进去，标题就是分类名（电话 / 短信 / 浏览器…），
   真机上每类只有 2 个候选 + 一句说明，这里按 titleOverride 现查。 */
const DEFAULT_APP_CANDIDATES = {
  '电话': { options: ['电话', 'QQ音乐'], note: '这类应用可让您通过设备拨打及接听电话。' },
  '短信': { options: ['信息', '微信'], note: '这类应用可让您发送和接收短信。' },
  '浏览器': { options: ['Chrome', '浏览器'], note: '这类应用可让您浏览网页。' },
  '数字助理': { options: ['Folax', 'Google'], note: '这类应用可响应您的语音指令。' },
  '桌面': { options: ['XOS桌面系统', '系统桌面'], note: '这类应用可管理设备主屏幕。' },
  '图片': { options: ['智能图库', 'Google 相册'], note: '这类应用可查看您的照片和图片。' },
  '音频': { options: ['Visha播放器', 'QQ音乐'], note: '这类应用可播放音频内容。' },
  '视频': { options: ['Visha播放器', '腾讯视频'], note: '这类应用可播放视频内容。' },
  'APK': { options: ['软件包安装程序', 'App Center'], note: '这类应用可安装应用包。' },
  '钱包': { options: ['钱包', 'Google 钱包'], note: '这类应用可管理卡包与支付凭证。' },
  '来电显示与骚扰电话屏蔽': { options: ['Synergy Nexus', '电话'], note: '这类应用可识别来电并拦截骚扰电话。' },
  '应用商店': { options: ['App Center', 'Play 商店'], note: '这类应用可下载和更新应用。' }
}
const FALLBACK_CANDIDATE = { options: ['系统默认', '备选应用'], note: '选择要用于此操作的默认应用。' }
function candidateFor() {
  return DEFAULT_APP_CANDIDATES[props.titleOverride] || FALLBACK_CANDIDATE
}

function rowsFor(sec) {
  // ⚠️ useRegisteredApps 是【页面级】标志，不是 section 级。
  if (page.value?.useRegisteredApps) return registeredAppRows.value
  if (sec.dynamicRows === 'defaultAppPicker') {
    return candidateFor().options.map(o => ({ title: o, radio: 'defaultAppChoice', radioValue: o }))
  }
  return sec.rows || []
}

function noteFor(sec) {
  if (sec.dynamicNote === 'defaultAppPicker') return candidateFor().note
  return sec.note || ''
}

const heroApp = computed(() => getApp(store.selectedApp.appId) || null)

function filteredRows(sec) {
  const rows = rowsFor(sec)
  if (!props.pageKey || !page.value?.search) return rows
  const q = query.value.trim().toLowerCase()
  if (!q) return rows
  return rows.filter(r => (r.title || '').toLowerCase().includes(q))
}

function onRowClick(row) {
  if (row.disabled) return
  // 「通知 / 管理通知」跳到【现有】的 SettingsNotifications 应用详情子页，
  // 不走 group3 自己的页面栈。setAppTarget 会被 SettingsApp 的 watch 消费。
  if (row.openAppNotifications) {
    notificationsStore.setAppTarget(store.selectedApp.appId || 'wechat')
    return
  }
  // 🔴 以前这里写 `if (row.toggle || row.radio) return`，把整行点击全吞了：
  //    19 个单选项点不动、78 个开关行点整行没反应（只有点开关本体才有效）。
  //    现在按行类型给每种「看起来能点」的行一个明确副作用。
  if (row.radio) {
    onRadio(row)
    return
  }
  if (row.toggle) {
    // 开关本体带 @click.stop，不会冒泡到这里造成二次翻转
    onToggle(row, !store.getSwitch(row.toggle))
    return
  }
  if (row.action === 'appDetail') {
    store.setSelectedApp({ name: row.title, appId: row.appId, size: row.value, version: 'V1.0.0' })
  }
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

        <!-- 应用信息：图标 + 名称 + 版本（图标与桌面同源） -->
        <div v-else-if="sec.appHero" class="g3-app-hero">
          <div class="g3-app-hero-icon">
            <AppIcon
              v-if="heroApp?.special"
              :app="heroApp"
              :size="64"
              :show-label="false"
              :show-badge="false"
              :launch-on-click="false"
            />
            <img v-else :src="heroApp?.image || '/icons/settings.png'" alt="" draggable="false" />
          </div>
          <div class="g3-app-hero-name">{{ store.selectedApp.name }}</div>
          <div class="g3-app-hero-ver">{{ store.selectedApp.version }}</div>
        </div>

        <!-- 应用信息：开启 / 卸载 / 强行停止 -->
        <div v-else-if="sec.tripleActions" class="g3-triple">
          <button
            v-for="act in sec.tripleActions"
            :key="act.label"
            type="button"
            class="g3-triple-btn"
            @click="emit('action', act.label)"
          >
            <LIcon :name="act.icon" :size="22" :stroke-width="1.7" />
            <span>{{ act.label }}</span>
          </button>
        </div>

        <!-- 应用活动详情：下拉 + 总时长 + 周柱状图 + 日期切换 -->
        <div v-else-if="sec.usage" class="g3-usage">
          <div class="g3-usage-dropdowns">
            <span
              v-for="d in (sec.usage.dropdowns || [sec.usage.dropdown])"
              :key="d"
              class="g3-usage-dropdown"
              @click="emit('action', d)"
            >
              {{ d }}<LIcon name="chevronDown" :size="13" :stroke-width="2" />
            </span>
          </div>
          <div v-if="sec.usage.appIcon" class="g3-usage-app-icon">
            <AppIcon
              v-if="heroApp?.special"
              :app="heroApp" :size="40" :show-label="false" :show-badge="false" :launch-on-click="false"
            />
            <img v-else :src="heroApp?.image || '/icons/settings.png'" alt="" draggable="false" />
          </div>
          <div class="g3-usage-value">{{ sec.usage.value }}</div>
          <div class="g3-usage-unit">{{ sec.usage.unit }}</div>
          <div class="g3-usage-chart">
            <div class="g3-chart-ticks"><span v-for="t in sec.usage.ticks" :key="t">{{ t }}</span></div>
            <div class="g3-chart-bars">
              <div v-for="b in sec.usage.bars" :key="b.label" class="g3-bar-col">
                <div class="g3-bar-track"><div class="g3-bar-fill" :style="{ height: (b.h * 100) + '%' }"></div></div>
                <span>{{ b.label }}</span>
              </div>
            </div>
          </div>
          <div class="g3-usage-date">
            <LIcon name="chevronLeft" :size="16" :stroke-width="2" class="g3-usage-arrow" @click="emit('action', '上一天')" />
            <span>{{ sec.usage.date }}</span>
            <LIcon name="chevronRight" :size="16" :stroke-width="2" class="g3-usage-arrow" @click="emit('action', '下一天')" />
          </div>
        </div>

        <!-- 可关闭的灰色提示卡（为应用设置定时器） -->
        <div v-else-if="sec.tip && !tipDismissed" class="g3-tip">
          <div class="g3-tip-hourglass"><LIcon name="timer" :size="20" :stroke-width="1.8" /></div>
          <div class="g3-tip-title">{{ sec.tip.title }}</div>
          <div class="g3-tip-text">{{ sec.tip.text }}</div>
          <button type="button" class="g3-tip-close" aria-label="关闭" @click="tipDismissed = true">
            <LIcon name="x" :size="16" :stroke-width="2" />
          </button>
        </div>

        <!-- 蓝色分组小标题（云端媒体设置） -->
        <div v-else-if="sec.accentHeader" class="g3-accent-header">{{ sec.accentHeader }}</div>

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
              <template v-if="row.link" #title><span class="g3-link-title">{{ row.title }}</span></template>
              <template v-if="row.app || row.appImage || row.appIcon" #icon>
                <RegisteredAppIcon :app="row.app" :name="row.title" :src="row.appImage" :size="36" />
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
                <span v-if="row.gear" class="g3-right-extra">
                  <span class="g3-vline"></span>
                  <button type="button" class="g3-gear" aria-label="云端媒体账号设置" @click.stop="emit('navigate', { key: row.action, title: '' })">
                    <LIcon name="settings2" :size="19" :stroke-width="1.8" />
                  </button>
                  <LIcon name="chevronRight" :size="14" :stroke-width="1.8" class="g3-chevron" />
                </span>
              </template>
              <template v-else-if="row.timer || row.info" #right>
                <LIcon :name="row.info ? 'info' : 'timer'" :size="19" :stroke-width="1.8" class="g3-row-glyph" />
              </template>
            </ListCell>
          </div>
          <div v-if="noteFor(sec)" class="card-note">{{ noteFor(sec) }}</div>
        </template>
      </template>

      <!-- 与首页一致的底部留白：44 搜索框 + 25 底距 + 余量 -->
      <div v-if="page.search" class="g3-search-spacer"></div>

      <div v-if="page.footerBadge" class="g3-footer-badge">
        <LIcon name="shieldCheck" :size="13" :stroke-width="2" />
        <span>{{ page.footerBadge }}</span>
      </div>
    </template>

    <!-- 全仓标准搜索 Dock：点击后隐藏麦克风、出现圆形返回按钮 -->
    <template #bottom>
      <SettingsSearchDock
        v-if="page?.search"
        v-model="query"
        :active="searchActive"
        placeholder="搜索"
        fade-color="#F0F1F2"
        @activate="searchActive = true"
        @back="closeSearch"
        @clear="query = ''"
      />
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


/* ===== 应用信息头部 ===== */
.g3-app-hero { display: flex; flex-direction: column; align-items: center; padding: 16px 0 20px; }
.g3-app-hero-icon { width: 64px; height: 64px; border-radius: 16px; overflow: hidden; margin-bottom: 10px; }
.g3-app-hero-icon img { width: 100%; height: 100%; object-fit: cover; display: block; }
.g3-app-hero-icon :deep(.app-icon) { background: none; border: 0; padding: 0; width: 64px; gap: 0; }
.g3-app-hero-icon :deep(.icon-tile) { box-shadow: none; }
.g3-app-hero-name { font-size: 17px; font-weight: 600; color: #1C1C1E; }
.g3-app-hero-ver { font-size: 12px; color: #8E8E93; margin-top: 3px; }

/* ===== 开启 / 卸载 / 强行停止 ===== */
.g3-triple { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 12px; }
.g3-triple-btn {
  height: 78px;
  border: none;
  border-radius: 16px;
  background: #FFFFFF;
  color: #1C1C1E;
  font-family: inherit;
  font-size: 13px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 7px;
  cursor: pointer;
}
.g3-triple-btn:active { background: #E9E9EB; }

/* ===== 应用活动详情 ===== */
.g3-usage { display: flex; flex-direction: column; align-items: center; padding: 10px 0 16px; }
.g3-usage-dropdowns { display: flex; gap: 10px; margin-bottom: 14px; }
.g3-usage-dropdown { cursor: pointer; }
.g3-usage-arrow { cursor: pointer; }
.g3-usage-dropdown {
  display: inline-flex; align-items: center; gap: 5px;
  background: #DCEBFF; color: #1C5FD6;
  font-size: 13px; padding: 7px 16px; border-radius: 18px;
}
.g3-usage-app-icon { width: 40px; height: 40px; border-radius: 12px; overflow: hidden; margin-bottom: 8px; }
.g3-usage-app-icon img { width: 100%; height: 100%; object-fit: cover; display: block; }
.g3-usage-app-icon :deep(.app-icon) { background: none; border: 0; padding: 0; width: 40px; gap: 0; }
.g3-link-title { color: #2F6BF6; font-size: 15px; }
.g3-usage-value { font-size: 34px; font-weight: 300; color: #1C1C1E; line-height: 1.15; }
.g3-usage-unit { font-size: 13px; color: #8E8E93; margin-bottom: 16px; }
.g3-usage-chart { width: 100%; display: flex; gap: 8px; }
.g3-chart-ticks { display: flex; flex-direction: column; justify-content: space-between; height: 96px; font-size: 11px; color: #8E8E93; flex: none; }
.g3-chart-bars { flex: 1; display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
.g3-bar-col { display: flex; flex-direction: column; align-items: center; gap: 5px; }
.g3-bar-track { width: 100%; height: 96px; display: flex; align-items: flex-end; border-top: 1px solid #E5E5EA; }
.g3-bar-fill { width: 60%; background: #2F6BF6; border-radius: 2px 2px 0 0; }
.g3-bar-col > span { font-size: 11px; color: #3C3C43; white-space: nowrap; }
.g3-usage-date { display: flex; align-items: center; gap: 26px; margin-top: 14px; font-size: 15px; color: #1C1C1E; }

/* ===== 可关闭提示卡 ===== */
.g3-tip {
  position: relative;
  background: #E9E9EC;
  border-radius: 18px;
  padding: 16px 16px 16px 52px;
  margin-bottom: 12px;
}
.g3-tip-hourglass { position: absolute; left: 16px; top: 18px; color: #3C3C43; }
.g3-tip-title { font-size: 15px; font-weight: 600; color: #1C1C1E; margin-bottom: 5px; }
.g3-tip-text { font-size: 13px; line-height: 19px; color: #3C3C43; }
.g3-tip-close { position: absolute; right: 12px; top: 14px; border: none; background: none; padding: 2px; color: #3C3C43; cursor: pointer; }
.g3-accent-header { font-size: 13px; color: #2F6BF6; padding: 8px 4px 8px; }

/* ===== 行右侧附加图形 ===== */
.g3-right-extra { display: inline-flex; align-items: center; gap: 10px; margin-left: 12px; }
.g3-vline { width: 1px; height: 24px; background: #E5E5EA; }
.g3-gear { border: none; background: none; padding: 0; color: #2F6BF6; cursor: pointer; display: flex; }
.g3-row-glyph { color: #3C3C43; margin-left: 12px; }
.g3-chevron { color: #C5C5C7; }
</style>
