<script setup>
/**
 * 相册（Photos）—— 2026-10-12 由 placeholder 升级为完整应用。
 *
 * 参考图两张（Ricky 提供）：
 *   图 1 首页：右上悬浮胶囊按钮组（列表 / 勾选 / 设置）· 大标题「照片」·
 *             按日期分组的 3 列缩略图网格 · 底部「照片 / 相册 / 发现」悬浮栏 + 搜索圆钮
 *   图 2 全屏查看：返回 + 两行日期 · 居中大图 · 右下圆形按钮 ·
 *                 底部深色玻璃操作栏（分享 / 收藏 / 编辑 / 删除 / 更多）
 *
 * 照片数据复用**系统壁纸**（`wallpaperStore.PRESET_WALLPAPERS`）+ `public/photos/` 既有素材，
 * 见 `stores/photosStore.js`。
 *
 * 三条本仓铁律在这里的落地：
 *   ① 应用内浮层一律 `position: absolute`（`fixed` 的包含块会落到外层机身，四边各偏 16px）；
 *   ② 顶部 64px 是 `ScreenView` 的手势热区（z 85）⇒ 胶囊按钮组与全屏返回键都必须落到 64px 之下；
 *   ③ **大标题必须走通用件 `ui/LargeTitleHeader`**（sticky + 随滚动折叠 + 底色底幕），
 *      不许在本页自己写一份 —— 底幕是「滚动内容不压到状态栏图标」的唯一手段。
 */
import { computed, onMounted, watch } from 'vue'
import { usePhotosStore } from '../../../stores/photosStore.js'
import { useI18nStore } from '../../../stores/i18nStore.js'
import { useSystemChrome } from '../../../composables/useSystemChrome.js'
import { useLargeTitle, largeTitleVars } from '../../../composables/useLargeTitle.js'
import LargeTitleHeader from '../../ui/LargeTitleHeader.vue'
import FloatingTabBar from '../../ui/FloatingTabBar.vue'
import LIcon from '../../ui/LIcon.vue'
import ActionSheetModal from '../../ui/ActionSheetModal.vue'

defineProps({ app: { type: Object, default: () => ({}) } })

const store = usePhotosStore()
const i18n = useI18nStore()
const ph = (path) => i18n.ph(path)

/** 浅色首页用深色状态栏图标；全屏查看（黑底）切白色图标 */
const chromeStyle = computed(() => (store.viewer ? 'light' : 'dark'))
useSystemChrome(chromeStyle)

onMounted(() => {
  store.syncToday()
  /* 🔴 沉浸态必须在应用挂载时复位：`viewerChromeHidden` 存在 store 里，
     而「回桌面」只销毁应用 DOM（`AppWindow` 的 `v-if`），**不会**动 store。
     ⇒ 用户在隐藏态下回桌面再进相册，会看到「全屏 + 无状态栏 + 无任何按钮」，
       既回不去也不知道为什么（2026-10-12 探针实测复现）。 */
  store.showViewerChrome()
})

/* 大标题折叠：走通用件（曲线常量在 composables/useLargeTitle.js，全仓唯一来源，
   与设置页同一条曲线）。
   ⚠️ 必须**解构出 ref** —— `<script setup>` 只自动解包顶层 ref；写成
   `const lt = useLargeTitle()` 再传 `:progress="lt.progress"` 会把 ComputedRef 本身
   传下去，静默退化成恒 0（且不报错，2026-10-12 在设置页踩过）。 */
const { progress: titleProgress, onScroll: onTitleScroll } = useLargeTitle()

/* 折叠契约变量**同时挂到滚动容器上**（本来只挂在 `LargeTitleHeader` 自己的根上）。
   为什么：页面里还有别的元素要跟大标题共用同一条左缘基准（分组标题，见下），
   而它们不是 `LargeTitleHeader` 的后代 ⇒ 读不到 `--title-inset`。
   挂在这里 = 契约仍是**唯一来源**，页面不复制任何数字。*/
const titleVars = computed(() => largeTitleVars(titleProgress.value))

/* ---------------- 日期与时间本地化 ---------------- */
const LOCALE_TAG = { zh: 'zh-CN', en: 'en-US', bn: 'bn-BD' }
const tag = computed(() => LOCALE_TAG[i18n.locale] || 'zh-CN')

function parseISO(iso) {
  const [y, m, d] = String(iso || '').split('-').map(Number)
  return new Date(y || 1970, (m || 1) - 1, d || 1)
}
/** 分组标题：今天 / 昨天 / 2026年10月10日（长日期按语言本地化） */
function dayTitle(day) {
  if (day.daysAgo === 0) return ph('today')
  if (day.daysAgo === 1) return ph('yesterday')
  return parseISO(day.date).toLocaleDateString(tag.value, { year: 'numeric', month: 'long', day: 'numeric' })
}
function fullDate(iso) {
  return parseISO(iso).toLocaleDateString(tag.value, { year: 'numeric', month: 'long', day: 'numeric' })
}
function timeLabel(photo) {
  const [h, m] = String(photo.shotAt || '00:00').split(':').map(Number)
  const dt = parseISO(photo.date)
  dt.setHours(h || 0, m || 0, 0, 0)
  return dt.toLocaleTimeString(tag.value, { hour: 'numeric', minute: '2-digit' })
}
function weekdayShort(iso) {
  return parseISO(iso).toLocaleDateString(tag.value, { weekday: 'short' })
}

/* ---------------- 首页 ---------------- */
const tabs = computed(() => [
  { id: 'photos', name: ph('tab.photos'), lucide: 'image' },
  { id: 'albums', name: ph('tab.albums'), lucide: 'layers' },
  { id: 'discover', name: ph('tab.discover'), lucide: 'sparkles' }
])

function onTab(id) {
  store.setTab(id)
  if (id === 'albums') store.report('albums')
  else if (id === 'discover') store.report('discover')
}
function onHeadList() { store.report('listView') }
function onHeadSelect() { store.toggleSelecting(); store.report('selectMode') }
function onHeadSettings() { store.report('settings') }
function onSearch() { store.report('search') }

/* ---------------- 全屏查看 ---------------- */
const VIEWER_ACTIONS = [
  { key: 'share', icon: 'share', labelKey: 'viewer.share' },
  { key: 'favorite', icon: 'heart', labelKey: 'viewer.favorite' },
  { key: 'edit', icon: 'pencilLine', labelKey: 'viewer.edit' },
  { key: 'delete', icon: 'trash2', labelKey: 'viewer.delete' },
  { key: 'more', icon: 'moreVertical', labelKey: 'viewer.more' }
]

/** 左右切换；到边界停住不循环 —— 但必须给回执，否则用户以为按键坏了 */
function onStep(delta) {
  if (!store.stepViewer(delta)) store.report('lastPhoto')
}

function onViewerAction(key) {
  const v = store.viewer
  if (!v) return
  if (key === 'share') store.report('shared')
  else if (key === 'favorite') store.toggleFavorite(v.id)
  else if (key === 'edit') store.report('edit')
  else if (key === 'delete') store.askDelete(v.id)
  else if (key === 'more') store.openMore(v.id)
}

const moreOptions = computed(() => [
  { key: 'save', label: ph('more.save') },
  { key: 'copy', label: ph('more.copy') },
  { key: 'hide', label: ph('more.hide') },
  { key: 'info', label: ph('more.info') }
])
/** 每个「更多」选项给各自回执，不再一律吐「已分享」 */
const MORE_NOTICE = { save: 'saved', copy: 'copied', hide: 'hidden', info: 'settings' }
function onMoreSelect(opt) {
  store.closeMore()
  store.report(MORE_NOTICE[opt.key] || 'shared')
}

const deleteOptions = computed(() => [
  { key: 'confirm', label: ph('sheet.confirm'), color: '#FF3B30' }
])

/* ---------------- 回执 toast ---------------- */
const noticeText = computed(() => (store.notice ? ph(`notice.${store.notice.code}`) : ''))
let noticeTimer = null
function scheduleNoticeClear() {
  if (noticeTimer) clearTimeout(noticeTimer)
  noticeTimer = setTimeout(() => store.clearNotice(), 1800)
}
watch(() => store.notice, (v) => { if (v) scheduleNoticeClear() })
</script>

<template>
  <div class="photos-app">
    <!-- ============ 首页 ============ -->
    <div class="pv-page" data-photos-page>
      <div class="pv-scroll" :style="titleVars" @scroll.passive="onTitleScroll">
        <!-- 大标题条（通用件）：sticky + 随滚动折叠 36→22px + 底色底幕。
             底幕透明度和折叠进度同值 ⇒ 内容从下面穿过时被盖住，不会与状态栏图标重叠。 -->
        <LargeTitleHeader
          :progress="titleProgress"
          scrim="244, 245, 247"
          data-photos-title-bar
        >
          <span data-photos-title>{{ ph('title') }}</span>
          <!-- 右上悬浮胶囊（进 #accessory 槽 ⇒ 跟着标题条一起钉在顶部，落在 64px 热区之下） -->
          <template #accessory>
            <div class="pv-head" data-photos-head>
              <button class="pv-head-btn" data-photos-head-list :title="ph('head.list')" @click="onHeadList">
                <LIcon name="list" :size="19" />
              </button>
              <button class="pv-head-btn" :class="{ on: store.selecting }" data-photos-head-select
                :title="ph('head.select')" @click="onHeadSelect">
                <LIcon name="check" :size="19" />
              </button>
              <button class="pv-head-btn" data-photos-head-settings :title="ph('head.settings')" @click="onHeadSettings">
                <LIcon name="settings" :size="19" />
              </button>
            </div>
          </template>
        </LargeTitleHeader>

        <template v-if="store.albumTab === 'photos'">
          <section v-for="day in store.days" :key="day.daysAgo" class="pv-day" :data-photos-day="day.daysAgo">
            <h2 class="pv-day-title" data-photos-day-title>{{ dayTitle(day) }}</h2>
            <div class="pv-grid" data-photos-grid>
              <button
                v-for="p in day.items"
                :key="p.id"
                class="pv-cell"
                :data-photo="p.id"
                @click="store.openViewer(p.id)"
              >
                <img :src="p.src" :alt="p.id" loading="lazy" />
                <span v-if="p.favorite" class="pv-cell-fav" data-photo-fav>
                  <LIcon name="heart" :size="13" filled />
                </span>
              </button>
            </div>
          </section>
          <p v-if="!store.days.length" class="pv-empty" data-photos-empty>{{ ph('empty') }}</p>
        </template>
        <p v-else class="pv-empty" data-photos-empty>{{ ph(`notice.${store.albumTab}`) }}</p>

        <div class="pv-pad" />
      </div>

      <!-- 底部悬浮栏 + 搜索圆钮 -->
      <FloatingTabBar
        :model-value="store.albumTab"
        :tabs="tabs"
        height="62px"
        bottom="22px"
        accent-color="#007AFF"
        :dark="false"
        data-photos-tabbar
        :aria-label="ph('tab.aria')"
        @change="onTab"
      >
        <template #icon="{ tab, active }">
          <span class="pv-tab-icon" :class="{ on: active }"><LIcon :name="tab.lucide" :size="21" /></span>
        </template>
      </FloatingTabBar>
      <button class="pv-search" data-photos-search :title="ph('search')" @click="onSearch">
        <LIcon name="search" :size="21" />
      </button>
    </div>

    <!-- ============ 全屏查看 ============ -->
    <!-- 沉浸态：`data-immersive-chrome` 被两处消费 —— 本页 CSS 藏「顶栏 / 扫描钮 / 操作栏」，
         `ScreenView.vue` 的 `:has()` 藏**系统状态栏**（它在应用树之外，本页 scoped 样式够不到）。
         ⚠️ 必须写 `|| null` —— 传 `false` 属性会以 `"false"` 存在，`:has()` 照样命中。 -->
    <div
      v-if="store.viewer"
      class="pv-viewer"
      data-photos-viewer
      :data-immersive-chrome="store.viewerChromeHidden || null"
    >
      <!-- 舞台铺满整屏 ⇒ 图片在**屏幕**（而不是「顶栏以下剩余区域」）里垂直居中。
           顶栏 / 扫描钮 / 操作栏都改成浮在它上面的覆盖层（z 更高），所以图片可以通高。
           点舞台（左右 32% 被 prev/next 占用）切换 chrome 显隐。 -->
      <div class="pv-v-stage" data-photos-viewer-stage @click="store.toggleViewerChrome()">
        <img :src="store.viewer.src" :alt="store.viewer.id" class="pv-v-img" data-photos-viewer-img />
        <!-- `.stop` 必须留着：否则点「上一张/下一张」会连带切换 chrome -->
        <button class="pv-v-nav prev" data-photos-viewer-prev @click.stop="onStep(-1)" />
        <button class="pv-v-nav next" data-photos-viewer-next @click.stop="onStep(1)" />
      </div>

      <header class="pv-v-head" @click="store.toggleViewerChrome()">
        <button class="pv-v-back" data-photos-viewer-back :title="ph('viewer.back')" @click.stop="store.closeViewer()">
          <LIcon name="arrowLeft" :size="22" />
        </button>
        <div class="pv-v-meta">
          <em data-photos-viewer-date>{{ fullDate(store.viewer.date) }}</em>
          <small data-photos-viewer-time>{{ timeLabel(store.viewer) }} {{ weekdayShort(store.viewer.date) }}</small>
        </div>
      </header>

      <button class="pv-v-scan" data-photos-viewer-scan :title="ph('viewer.scan')" @click="store.report('scan')">
        <LIcon name="scanFace" :size="22" />
      </button>

      <div class="pv-v-bar" data-photos-viewer-bar>
        <button
          v-for="act in VIEWER_ACTIONS"
          :key="act.key"
          class="pv-v-act"
          :class="{ on: act.key === 'favorite' && store.viewer.favorite }"
          :data-photos-action="act.key"
          :title="ph(act.labelKey)"
          @click="onViewerAction(act.key)"
        >
          <LIcon :name="act.icon" :size="22" :filled="act.key === 'favorite' && store.viewer.favorite" />
        </button>
      </div>
    </div>

    <!-- ============ 弹层（一律 absolute） ============ -->
    <!-- ⚠️ 状态清理必须挂在 `@cancel` 上，**不能**挂 `@update:visible`。
         `ActionSheetModal.onSelect()` 是先 emit `update:visible(false)` 再 emit `select`
         ⇒ 挂 update:visible 会在 `confirmDelete()` 跑到之前就把 `pendingDeleteId` 清成 null，
         删除变成点了没反应（2026-10-12 由 verify-photos-flow 抓到）。 -->
    <ActionSheetModal
      :visible="!!store.moreId"
      :title="ph('sheet.moreTitle')"
      :options="moreOptions"
      :cancel-text="ph('sheet.cancel')"
      @cancel="store.closeMore()"
      @select="onMoreSelect"
    />
    <ActionSheetModal
      :visible="!!store.pendingDeleteId"
      :title="ph('sheet.deleteTitle')"
      :options="deleteOptions"
      :cancel-text="ph('sheet.cancel')"
      @cancel="store.cancelDelete()"
      @select="() => store.confirmDelete()"
    />

    <Transition name="pv-toast">
      <div v-if="noticeText" class="pv-toast" data-photos-toast>{{ noticeText }}</div>
    </Transition>
  </div>
</template>

<style scoped>
.photos-app {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--bg-grouped, #f2f2f7);
  color: var(--label, #111);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC', sans-serif;
  -webkit-tap-highlight-color: transparent;
}

.pv-page { position: absolute; inset: 0; }

/* 滚动容器：底部渐隐遮罩挂在**自身盒子**上，锚点与底栏几何同源
   （bottom 22px + 高 62px ⇒ 底栏占 100%-84px ~ 100%-22px） */
.pv-scroll {
  height: 100%;
  overflow-y: auto;
  --tabbar-fade: linear-gradient(to bottom, black 0%, black calc(100% - 92px),
    rgba(0, 0, 0, 0.45) calc(100% - 55px), transparent calc(100% - 22px));
  -webkit-mask-image: var(--tabbar-fade);
  mask-image: var(--tabbar-fade);
}
.pv-pad { height: 110px; }

/* ---- 右上胶囊按钮组 ----
   ⚠️ 定位交给通用件的 `#accessory` 槽（落点 = 折叠后标题行盒的垂直中心，
   右内缩走契约的 `--title-accessory-right`）。这里只负责外观 ——
   再写 top/right 会叠加成双份偏移。
   尺寸按 2026-10-12 参考图反解：图标中心距 46.35px、胶囊 144.7×40.3px、
   图标墨迹右内缩 34.3px ⇒ 按钮 44×33 + gap 2px（中心距 = 44+2 = 46 ✅）。 */
.pv-head {
  position: relative;
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 3px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 0.5px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}
.pv-head-btn {
  width: 44px;
  height: 33px;
  border: none;
  border-radius: 9999px;
  background: transparent;
  color: #1c1c1e;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.pv-head-btn:active { background: rgba(0, 0, 0, 0.06); }
.pv-head-btn.on { color: #007aff; background: rgba(0, 122, 255, 0.1); }

/* ---- 大标题 ----
   样式已搬进通用件 `ui/LargeTitleHeader.vue`（sticky + 折叠曲线 + 底色底幕）。
   这里只留「改视觉请改哪里」的指引，别再在本页重画一份。 */

/* ---- 日期分组 ----
   🔴 左缘契约：**分组标题与大标题同一条竖线**（Ricky 2026-10-12 用竖线标注的缺陷）。
   参考图量测（距屏左，设计px）：大标题墨迹 25.9 · 分组标题墨迹 26.3 —— 两者同线；
   改前本仓 26.0 / 17.0，差 9px（分组标题走的是 2 + 14 的私有内缩，与大标题无关）。

   `--title-inset` 是唯一来源（`useLargeTitle.js` 契约，页面把 `largeTitleVars()` 挂在
   `.pv-scroll` 上 ⇒ 这里继承得到），**不要在本页再写死一个数字**。

   `+ 1px` 是**字体度量补偿**，不是随手调的手感值：同一左缘下，17px 分组标题的左边距
   （side bearing）是 1.0px，而 36px 大标题是 2.0px —— 两者「盒对齐」时墨迹仍差 1px。
   加上这 1px，两条墨迹才真正落在同一竖线上（实测 26.0 / 26.0）。 */
.pv-day { margin-bottom: 16px; }
.pv-day-title {
  margin: 0 calc(var(--title-inset, 24px) + 1px) 8px;
  font-size: 17px;
  font-weight: 600;
  color: var(--label, #111);
}
/* 网格贴屏边（参考图里照片也是贴到 x=0 的），左右各 2px ⇒ 内缩放在网格自己身上，
   别再放回 `.pv-day`：那会把分组标题的基准一起推走。 */
.pv-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px; padding: 0 2px; }
.pv-cell {
  position: relative;
  aspect-ratio: 1 / 1;
  border: none;
  padding: 0;
  overflow: hidden;
  background: #e5e5ea;
  cursor: pointer;
}
.pv-cell img { width: 100%; height: 100%; object-fit: cover; display: block; }
.pv-cell:active img { transform: scale(0.97); }
.pv-cell-fav {
  position: absolute;
  left: 5px;
  bottom: 5px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(6px);
}

.pv-empty {
  margin: 40px 16px;
  font-size: 15px;
  text-align: center;
  color: var(--label-secondary, #8e8e93);
}

/* ---- 底部栏：给右侧搜索圆钮让位 ----
   ⚠️ FloatingTabBar 自身是 `left:50% + translateX(-50%) + width: calc(100% - 44px)`，
   这里整体左移并把宽度缩掉「右 22px + 圆钮 62px + 间隙 10px」。 */
.photos-app :deep(.floating-tab-bar) {
  left: 22px;
  transform: none;
  width: calc(100% - 22px - 22px - 62px - 10px);
  max-width: none;
}
.pv-tab-icon { display: flex; color: #8e8e93; }
.pv-tab-icon.on { color: #007aff; }

.pv-search {
  position: absolute;
  right: 22px;
  bottom: 22px;
  width: 62px;
  height: 62px;
  border: 0.5px solid rgba(0, 0, 0, 0.08);
  border-radius: 9999px;
  background: rgba(245, 245, 247, 0.88);
  backdrop-filter: blur(28px);
  -webkit-backdrop-filter: blur(28px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.08);
  color: #1c1c1e;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 25;
}

/* ---- 全屏查看 ---- */
.pv-viewer {
  position: absolute;
  inset: 0;
  z-index: 40;
  background: #000;
}
/* 顶栏是**覆盖层**（不是 flex 子项）—— 舞台要铺满整屏，图片才会在屏幕里垂直居中。
   z 3 > 舞台 z 1 ⇒ 顶栏永远压在图片上、且先吃到点击。
   高度：按钮落到 64px 热区之下（--safe-top 54 + 内容区 56，按钮 38px 居中 ⇒ 中心 82px） */
.pv-v-head {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: calc(var(--safe-top, 44px) + 56px);
  padding: var(--safe-top, 44px) 12px 0;
  display: flex;
  align-items: center;
  gap: 10px;
  z-index: 3;
  transition: opacity 0.22s ease; /* 沉浸态淡出/淡入：与 StatusBar 自带的 0.22s 对齐 */
}
.pv-v-back {
  width: 38px;
  height: 38px;
  flex: none;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.16);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.pv-v-meta { min-width: 0; display: flex; flex-direction: column; gap: 1px; color: #fff; }
.pv-v-meta em { font-style: normal; font-size: 17px; font-weight: 600; }
.pv-v-meta small { font-size: 13px; color: rgba(255, 255, 255, 0.62); }

/* 舞台 = 整个屏幕（`inset: 0`）⇒ 图片在**屏幕**里垂直居中（不是「顶栏以下的剩余区」）。
   原来它是 flex:1 子项，盒子是 y 110~788、中心 449，而屏幕中心是 394
   ⇒ 图片被压低了 55px（Ricky 2026-10-12 报「图片要在屏幕中上下居中」）。
   z 1 ⇒ 顶栏(3) / 扫描钮(2) / 操作栏(3) 都浮在它上面。 */
.pv-v-stage {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
.pv-v-img { max-width: 100%; max-height: 100%; object-fit: contain; display: block; }
/* 左右各 32% 是「上一张 / 下一张」，剩下的中间区域点一下切换 chrome */
.pv-v-nav { position: absolute; top: 0; bottom: 0; width: 32%; border: none; background: transparent; cursor: pointer; z-index: 2; }
.pv-v-nav.prev { left: 0; }
.pv-v-nav.next { right: 0; }

/* 右下圆形按钮：骑在操作栏上方右侧
   竖向栈：标准底栏位 22 + 操作栏高 56 + 间隙 10 = 88 */
.pv-v-scan {
  position: absolute;
  right: 18px;
  bottom: calc(22px + 56px + 10px);
  width: 52px;
  height: 52px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.94);
  color: #4b3cff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.45);
  cursor: pointer;
  z-index: 3;
  transition: opacity 0.22s ease;
}

/* 底部操作栏：深色玻璃胶囊
   ⚠️ bottom 取 22px —— 与本仓标准底栏位（FloatingTabBar 默认 `bottom="22px"`）同值，
   首页底栏与全屏操作栏在同一水平线上，切换时不跳。别再改回
   `home-indicator-zone + 10px`（实测会高出标准位 22px ⇒ 「距离底部的位置太高」）。 */
.pv-v-bar {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 22px;
  margin: 0 auto;
  width: fit-content;
  max-width: calc(100% - 40px);
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 6px;
  border-radius: 9999px;
  background: rgba(28, 28, 30, 0.72);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 0.5px solid rgba(255, 255, 255, 0.14);
  z-index: 3;
  transition: opacity 0.22s ease;
}
.pv-v-act {
  width: 52px;
  height: 44px;
  border: none;
  border-radius: 9999px;
  background: transparent;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.pv-v-act:active { background: rgba(255, 255, 255, 0.14); }
.pv-v-act.on { color: #ff2d55; }

/* ---- 沉浸态：点屏幕中部隐藏「顶栏 + 扫描钮 + 操作栏」----
   ⚠️ 与 ScreenView 的 `:has([data-immersive-chrome]) .status-bar`（藏系统状态栏）**成对**：
      只做这里 ⇒ 状态栏图标留在黑底上；只做那边 ⇒ 按钮留在黑底上。两个都必须有。
   ⚠️ 必须同时给 `pointer-events: none` —— 只把 opacity 设 0 的话，
      看不见的返回键 / 上一张 / 操作栏仍然吃点击（「点了没反应」这类不可见缺陷）。
   过渡时长写在各自的基础规则里（`opacity 0.22s`，与 StatusBar 自带值对齐），
   ⛔ 不要为了 DRY 写以类名起头的分组规则 —— 会撞上「类名表无重复规则头」守卫（见该用例注释）。 */
.pv-viewer[data-immersive-chrome] .pv-v-head,
.pv-viewer[data-immersive-chrome] .pv-v-scan,
.pv-viewer[data-immersive-chrome] .pv-v-bar {
  opacity: 0;
  pointer-events: none;
}

/* ---- toast（absolute，不用 fixed；居中用 margin auto 而非 translateX） ----
   🔴 竖向栈必须整串推导：标准底栏位 22 + 操作栏 56 + 间隙 10 + 扫描钮 52 + 间隙 10 = 150。
   原来只写了 `home-indicator-zone + 104px`（=138），与扫描钮（当时 120~172）竖直重叠 34px，
   只因回执文案短、靠水平空隙侥幸不撞 —— 换成英文/孟加拉语长回执就会压在按钮上。 */
.pv-toast {
  position: absolute;
  left: 0;
  right: 0;
  bottom: calc(22px + 56px + 10px + 52px + 10px);
  margin: 0 auto;
  width: fit-content;
  max-width: calc(100% - 40px);
  padding: 9px 16px;
  border-radius: 9999px;
  background: rgba(28, 28, 30, 0.86);
  color: #fff;
  font-size: 13px;
  z-index: 60;
}
.pv-toast-enter-active, .pv-toast-leave-active { transition: opacity 0.2s ease; }
.pv-toast-enter-from, .pv-toast-leave-to { opacity: 0; }
</style>
