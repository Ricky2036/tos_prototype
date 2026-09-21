<script setup>
import { computed, onMounted, ref } from 'vue'
import { useHomeStore } from '../../../../stores/homeStore'
import { useWallpaperStore } from '../../../../stores/wallpaperStore'
import { useClock } from '../../../../composables/useClock'
import AppGrid from '../../../system/AppGrid.vue'
import LockScreen from '../../../system/LockScreen.vue'
import defaultWallpaper from '../../../../assets/img/wallpaper-lock.jpg'
import cubesWallpaper from '../../../../assets/img/personalization/generated/abstract-geometric-cubes.png'
import coastWallpaper from '../../../../assets/img/personalization/generated/nature-coast.jpg'
import personFieldWallpaper from '../../../../assets/img/personalization/generated/person-field.jpg'

import { useDepthSegmentation, getPresetDepthSubject } from '../../../../composables/useDepthSegmentation.js'

const emit = defineEmits(['back'])
const home = useHomeStore()
const wallpaperStore = useWallpaperStore()
const { timeShort } = useClock()
const { isAnalyzing, segmentImage } = useDepthSegmentation()

const fileInputRef = ref(null)
const isScanning = ref(false)
const scanToastText = ref('')

const screen = ref('overview')
const selectedWallpaper = ref(wallpaperStore.active || cubesWallpaper)
const activeWallpaper = computed(() => wallpaperStore.active || cubesWallpaper)

const wallpapers = [
  { id: 'abstract-geometric-cubes', src: cubesWallpaper, tone: '#4f8cff', title: '建筑·几何方块' },
  { id: 'nature-coast', src: coastWallpaper, tone: '#e6935b', title: '自然·海岸暮光' },
  { id: 'person-field', src: personFieldWallpaper, tone: '#e0a458', title: '人物·金色田野' },
  { id: 'default', src: defaultWallpaper, tone: '#4f8cff', title: '经典默认' }
]

const depthWallpapers = computed(() => {
  return wallpapers.filter((w) => !!getPresetDepthSubject(w.src))
})

const hasDepthSubjectForSelected = computed(() => {
  if (!selectedWallpaper.value) return false
  return !!getPresetDepthSubject(selectedWallpaper.value) || (selectedWallpaper.value === activeWallpaper.value && !!wallpaperStore.depthSubjectUrl)
})

onMounted(() => wallpaperStore.hydrate())

const pageTitle = computed(() => {
  if (screen.value === 'themes') return '添加新主题'
  if (screen.value === 'wallpapers') return '壁纸'
  return '主题与个性化'
})
const previewViewportStyle = computed(() => {
  const width = home.profile?.width || 360
  const height = home.profile?.height || 788
  return { width: `${width}px`, height: `${height}px`, transform: `scale(${142 / width})` }
})

function goBack() {
  if (screen.value !== 'overview') {
    screen.value = 'overview'
    return true
  }
  emit('back')
  return false
}

function openSection(id) {
  if (id === 'wallpaper') screen.value = 'wallpapers'
}

function chooseWallpaper(src) {
  selectedWallpaper.value = src
}

function chooseDepthTheme(item) {
  selectedWallpaper.value = item.src
  wallpaperStore.setDepthEnabled(true)
  wallpaperStore.apply(item.src)
  screen.value = 'overview'
}

function triggerGallerySelect() {
  fileInputRef.value?.click()
}

async function onCustomFileSelected(e) {
  const file = e.target.files?.[0]
  if (!file) return

  isScanning.value = true
  scanToastText.value = '正在智能提取景深主体...'

  try {
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

    selectedWallpaper.value = dataUrl

    // 触发端侧分割算法
    const res = await segmentImage(file)
    if (res.subjectUrl) {
      wallpaperStore.apply(dataUrl, res.subjectUrl)
      wallpaperStore.setDepthSubject(res.subjectUrl, res.occlusionRatio)
      wallpaperStore.setDepthEnabled(true)
      scanToastText.value = res.isSafe ? '景深主体提取成功' : '主体遮挡较多，已开启景深'
    } else {
      wallpaperStore.apply(dataUrl, '')
      scanToastText.value = '未检测到显著主体，已应用为常规壁纸'
    }
  } catch (err) {
    console.error('Custom file segmentation error:', err)
    scanToastText.value = '分析失败，已应用常规壁纸'
  } finally {
    isScanning.value = false
    setTimeout(() => { scanToastText.value = '' }, 2600)
    if (e.target) e.target.value = ''
  }
}

function applyWallpaper() {
  wallpaperStore.apply(selectedWallpaper.value)
}

defineExpose({ back: () => {
  if (screen.value === 'overview') return false
  screen.value = 'overview'
  return true
} })

const menuItems = [
  { id: 'wallpaper', label: '壁纸', icon: 'image', color: '#7658ff' },
  { id: 'aod', label: '息屏显示', icon: 'phone', color: '#48484a' },
  { id: 'icons', label: '图标', icon: 'grid', color: 'transparent' },
  { id: 'font', label: '字体', icon: 'font', color: '#087cff' },
  { id: 'color', label: '系统颜色', icon: 'palette', color: '#20cbd0' },
  { id: 'lock', label: '锁屏设置', icon: 'lock', color: '#087cff' },
  { id: 'desktop', label: '桌面设置', icon: 'desktop', color: '#7558ff' }
]
</script>

<template>
  <div class="personalization-root">
    <header class="personalization-header">
      <button class="round-back" aria-label="返回" @click="goBack">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5m6-7-7 7 7 7" /></svg>
      </button>
      <h1>{{ pageTitle }}</h1>
    </header>

    <Transition name="personalization-slide" mode="out-in">
      <main v-if="screen === 'overview'" key="overview" class="personalization-scroll overview-page">
        <div class="section-kicker">当前</div>

        <div class="current-theme-stage">
          <div class="theme-pair">
            <article class="device-preview lock-preview">
              <div class="preview-viewport preview-lock-viewport" :style="previewViewportStyle">
                <LockScreen />
              </div>
              <button class="edit-pill">编辑</button>
            </article>
            <article class="device-preview home-preview" :style="{ backgroundImage: `url(${activeWallpaper})` }">
              <div class="preview-viewport preview-home-viewport" :style="previewViewportStyle">
                <AppGrid
                  :page-index="home.currentPage"
                  :item-ids="home.pages[home.currentPage] || []"
                  :items="home.items"
                  :positions="home.positions[home.currentPage] || {}"
                  :folders="home.folders"
                  :profile="home.profile"
                  :register-home-anchors="false"
                />
              </div>
              <button class="edit-pill">编辑</button>
            </article>
          </div>
        </div>

        <button class="add-theme-button" @click="screen = 'themes'">
          <span class="plus-ring"><svg viewBox="0 0 20 20"><path d="M10 5v10M5 10h10" /></svg></span> 添加新主题
        </button>

        <section class="personalization-menu">
          <button v-for="(item, index) in menuItems" :key="item.id" class="menu-row" @click="openSection(item.id)">
            <span class="menu-icon" :style="{ background: item.color }" :class="`icon-${item.icon}`">
              <svg v-if="item.icon === 'image'" class="filled-wallpaper-glyph" viewBox="0 0 24 24" aria-hidden="true">
                <rect x="2.5" y="3" width="19" height="18" rx="3.6" fill="#fff" />
                <circle cx="8.7" cy="8.7" r="1.7" fill="#7658ff" />
                <path d="m5 17 4.1-4.4 3.15 2.75 2.65-3.05 4.15 4.7Z" fill="#7658ff" />
              </svg>
              <svg v-else-if="item.icon === 'phone'" class="filled-phone-glyph" viewBox="0 0 24 24" aria-hidden="true">
                <rect x="4.25" y="1.5" width="15.5" height="21" rx="3.4" fill="#fff" />
                <rect x="9" y="18.7" width="6" height="1.35" rx=".675" fill="#3f3f42" />
              </svg>
              <svg v-else-if="item.icon === 'grid'" class="color-grid-glyph" viewBox="0 0 28 28" aria-hidden="true">
                <rect class="grid-shell" x="0.75" y="0.75" width="26.5" height="26.5" rx="7" />
                <rect x="5" y="5" width="7.6" height="7.6" rx="2.15" fill="#ff4b12" />
                <rect x="15.4" y="5" width="7.6" height="7.6" rx="2.15" fill="#087cff" />
                <rect x="5" y="15.4" width="7.6" height="7.6" rx="2.15" fill="#ffd51b" />
                <rect x="15.4" y="15.4" width="7.6" height="7.6" rx="2.15" fill="#20c96b" />
              </svg>
              <span v-else-if="item.icon === 'font'" class="font-glyph">Aa</span>
              <svg v-else-if="item.icon === 'palette'" class="filled-palette-glyph" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#fff" d="M12 2.5a9.5 9.5 0 1 0 0 19h1.55a2.35 2.35 0 0 0 1.52-4.14 1.65 1.65 0 0 1 1.08-2.91h1.55A3.8 3.8 0 0 0 21.5 10.7 8.45 8.45 0 0 0 12 2.5Zm-4.6 10.15a1.35 1.35 0 1 1 0-2.7 1.35 1.35 0 0 1 0 2.7Zm2.45-4.3a1.35 1.35 0 1 1 0-2.7 1.35 1.35 0 0 1 0 2.7Zm5.15.35A1.35 1.35 0 1 1 15 6a1.35 1.35 0 0 1 0 2.7Z" />
              </svg>
              <svg v-else-if="item.icon === 'lock'" class="filled-lock-glyph" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#fff" fill-rule="evenodd" d="M7.2 9V7a4.8 4.8 0 0 1 9.6 0v2h.7a2.8 2.8 0 0 1 2.8 2.8v7.4a2.8 2.8 0 0 1-2.8 2.8h-11a2.8 2.8 0 0 1-2.8-2.8v-7.4A2.8 2.8 0 0 1 6.5 9h.7Zm2.35 0h4.9V7a2.45 2.45 0 0 0-4.9 0v2Z" />
              </svg>
              <svg v-else class="filled-desktop-glyph" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#fff" d="M12 2.4 21 9v10.2a2.4 2.4 0 0 1-2.4 2.4H5.4A2.4 2.4 0 0 1 3 19.2V9l9-6.6Z" />
                <rect x="7.7" y="17.3" width="8.6" height="1.65" rx=".825" fill="#5f48e8" />
              </svg>
            </span>
            <span class="menu-label">{{ item.label }}</span>
            <svg class="chevron" viewBox="0 0 24 24"><path d="m9 5 7 7-7 7" /></svg>
          </button>
        </section>
      </main>

      <main v-else-if="screen === 'themes'" key="themes" class="personalization-scroll themes-page">
        <nav class="theme-actions">
          <button v-for="action in [
            { label: '图库', type: 'gallery' }, { label: '景深', type: 'layers' },
            { label: '3D 效果', type: 'cube' }, { label: 'AI 随心主题', type: 'magic' }
          ]" :key="action.type">
            <span class="round-action" :class="`action-${action.type}`">
              <svg v-if="action.type === 'gallery'" viewBox="0 0 24 24"><rect x="3.5" y="4" width="17" height="16" rx="3"/><path d="m5.5 17 4-4 3 2.5 2.7-3 3.3 4.5"/></svg>
              <svg v-else-if="action.type === 'layers'" viewBox="0 0 24 24"><path d="m12 4 8 4-8 4-8-4Z"/><path d="m5 12 7 3.5 7-3.5M5 16l7 3.5 7-3.5"/></svg>
              <b v-else-if="action.type === 'cube'">3D</b>
              <svg v-else viewBox="0 0 24 24"><path d="m6 18 9-9 3 3-9 9H6Z"/><path d="m5 3 .7 2.3L8 6l-2.3.7L5 9l-.7-2.3L2 6l2.3-.7ZM18 3l.6 1.8 1.9.7-1.9.6L18 8l-.6-1.9-1.9-.6 1.9-.7Z"/></svg>
            </span>
            <span>{{ action.label }}</span>
          </button>
        </nav>

        <section class="theme-section">
          <div class="section-heading"><h2>品牌</h2><span>›</span></div>
          <div class="theme-card-row">
            <button v-for="wallpaper in wallpapers" :key="wallpaper.id" class="market-theme" @click="chooseWallpaper(wallpaper.src)">
              <img :src="wallpaper.src" :alt="wallpaper.title">
              <span class="market-time">09:26</span>
              <span class="download-mark">↓</span>
            </button>
          </div>
        </section>

        <section class="theme-section depth-section">
          <div class="section-heading"><h2>景深推荐</h2><span>›</span></div>
          <div class="depth-row">
            <button
              v-for="item in depthWallpapers"
              :key="item.id"
              class="depth-card"
              @click="chooseDepthTheme(item)"
            >
              <img :src="item.src" :alt="item.title" class="depth-card-bg" />
              <div class="depth-card-overlay">
                <small>周日, 9月20日</small>
                <b>09:30</b>
                <span class="depth-badge">景深</span>
              </div>
              <span class="depth-card-label">{{ item.title }}</span>
            </button>
          </div>
        </section>
      </main>

      <main v-else key="wallpapers" class="personalization-scroll wallpapers-page">
        <!-- 隐藏的原生相册文件选择器 -->
        <input
          ref="fileInputRef"
          type="file"
          accept="image/*"
          style="display: none;"
          @change="onCustomFileSelected"
        />

        <button class="gallery-card" @click="triggerGallerySelect">
          <span class="gallery-icon"><svg viewBox="0 0 24 24"><rect x="3.5" y="4" width="17" height="16" rx="3"/><path d="m5.5 17 4-4 3 2.5 2.7-3 3.3 4.5"/></svg></span>
          <span>从图库选择 (智能抠图景深)</span>
        </button>

        <!-- 扫描分析提示浮层 -->
        <Transition name="fade">
          <div v-if="isScanning || scanToastText" class="scanning-toast">
            <span v-if="isScanning" class="scan-spinner"></span>
            <span>{{ scanToastText }}</span>
          </div>
        </Transition>

        <h2 class="wallpaper-heading">静态壁纸</h2>
        <div class="wallpaper-grid">
          <button v-for="wallpaper in wallpapers" :key="wallpaper.id" class="wallpaper-tile" :class="{ selected: selectedWallpaper === wallpaper.src }" @click="chooseWallpaper(wallpaper.src)">
            <img :src="wallpaper.src" :alt="wallpaper.title">
            <span class="selection-check">✓</span>
          </button>
        </div>

        <!-- 景深开关卡片：当选中壁纸具备景深主体时展示 -->
        <div v-if="hasDepthSubjectForSelected" class="depth-toggle-card">
          <div class="depth-toggle-left">
            <div class="depth-toggle-title">
              <svg class="depth-icon" viewBox="0 0 24 24">
                <path d="m12 4 8 4-8 4-8-4Z"/>
                <path d="m5 12 7 3.5 7-3.5M5 16l7 3.5 7-3.5"/>
              </svg>
              <span>景深时钟穿插效果</span>
            </div>
            <div class="depth-toggle-desc">时钟置于主体后方，呈现 3D 纵深立体质感</div>
          </div>
          <button
            type="button"
            class="depth-switch"
            :class="{ active: wallpaperStore.depthEnabled }"
            role="switch"
            :aria-checked="wallpaperStore.depthEnabled"
            @click="wallpaperStore.setDepthEnabled(!wallpaperStore.depthEnabled)"
          >
            <span class="depth-switch-knob"></span>
          </button>
        </div>

        <button class="apply-wallpaper" :disabled="selectedWallpaper === activeWallpaper" @click="applyWallpaper">
          {{ selectedWallpaper === activeWallpaper ? '当前壁纸' : '设为当前' }}
        </button>
      </main>
    </Transition>
  </div>
</template>

<style scoped>
.personalization-root { --ink:#f7f7fa; min-height:100%; height:100%; background:#000; color:var(--ink); overflow:hidden; font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display","PingFang SC",sans-serif; }
.personalization-header { height:calc(var(--safe-top) + 58px); padding:var(--safe-top) 18px 0; display:flex; align-items:center; gap:14px; box-sizing:border-box; background:linear-gradient(#000 72%,rgba(0,0,0,.92)); position:relative; z-index:4; }
.personalization-header h1 { margin:0; font-size:21px; font-weight:700; letter-spacing:-.4px; }
.round-back { width:42px; height:42px; border:1px solid rgba(255,255,255,.16); border-radius:50%; background:linear-gradient(145deg,rgba(255,255,255,.17),rgba(255,255,255,.055) 62%); color:white; display:grid; place-items:center; padding:0; box-shadow:inset 0 1px 1px rgba(255,255,255,.22),inset 0 -1px rgba(0,0,0,.32),0 7px 20px rgba(0,0,0,.38); backdrop-filter:blur(22px) saturate(155%); -webkit-backdrop-filter:blur(22px) saturate(155%); }
.round-back::before { content:""; position:absolute; width:28px; height:12px; border-radius:50%; background:radial-gradient(ellipse,rgba(255,255,255,.13),transparent 70%); transform:translateY(-10px); pointer-events:none; }
.round-back svg { width:24px; height:24px; fill:none; stroke:currentColor; stroke-width:1.8; stroke-linecap:round; stroke-linejoin:round; }
.personalization-scroll { height:calc(100% - var(--safe-top) - 58px); overflow:auto; scrollbar-width:none; box-sizing:border-box; padding-bottom:calc(var(--safe-bottom) + 30px); }
.personalization-scroll::-webkit-scrollbar { display:none; }
.overview-page { padding-top:20px; }
.section-kicker { text-align:center; color:#c6c6cb; font-size:14px; font-weight:600; margin:0 0 24px; }
.current-theme-stage { width:100%; overflow:hidden; }
.theme-pair { display:flex; justify-content:center; gap:10px; padding:0 20px; }
.device-preview { width:142px; height:284px; border-radius:22px; position:relative; overflow:hidden; flex:none; background-position:center; background-size:cover; box-shadow:0 16px 30px rgba(0,0,0,.62),inset 0 0 0 .5px rgba(255,255,255,.2); }
.device-preview::after { content:""; position:absolute; inset:0; background:linear-gradient(rgba(0,0,0,.04),rgba(0,0,0,.1)); pointer-events:none; }
.preview-viewport { position:absolute; left:0; top:0; transform-origin:top left; pointer-events:none; overflow:hidden; }
.preview-viewport :deep(.lock-screen),.preview-viewport :deep(.app-grid) { pointer-events:none!important; }
.preview-lock-viewport :deep(.ls-clip),
.preview-lock-viewport :deep(.ls-pill-container),
.preview-lock-viewport :deep(.ls-shortcuts) { display:none!important; }
.preview-home-viewport :deep(.widget-name),.preview-home-viewport :deep(.icon-label) { text-shadow:none!important; }
.edit-pill { position:absolute; z-index:30; bottom:14px; left:50%; transform:translateX(-50%); box-sizing:border-box; width:62px; height:28px; padding:0; border:1px solid rgba(255,255,255,.22); border-radius:14px; color:rgba(255,255,255,.96); background:linear-gradient(180deg,rgba(255,255,255,.36),rgba(255,255,255,.19)); backdrop-filter:blur(20px) saturate(125%) brightness(1.08); -webkit-backdrop-filter:blur(20px) saturate(125%) brightness(1.08); box-shadow:none; display:flex; align-items:center; justify-content:center; font:500 10px/1 var(--font-stack); text-align:center; }
.add-theme-button { position:relative; isolation:isolate; margin:44px auto 36px; display:flex; align-items:center; justify-content:center; gap:9px; border:1px solid rgba(255,255,255,.17); background:linear-gradient(180deg,rgba(60,60,66,.72),rgba(19,19,22,.64)); color:white; height:46px; min-width:184px; padding:0 30px; border-radius:24px; font-size:15px; font-weight:650; box-shadow:inset 0 1px rgba(255,255,255,.21),inset 0 -1px rgba(0,0,0,.4),0 10px 30px rgba(0,0,0,.54); backdrop-filter:blur(22px) saturate(155%); -webkit-backdrop-filter:blur(22px) saturate(155%); overflow:hidden; }
.add-theme-button::before { content:""; position:absolute; z-index:-1; left:11%; right:11%; top:-11px; height:25px; border-radius:50%; background:radial-gradient(ellipse,rgba(255,255,255,.28),rgba(255,255,255,.05) 48%,transparent 74%); }
.plus-ring { width:20px; height:20px; border:1.6px solid rgba(255,255,255,.94); border-radius:50%; display:grid; place-items:center; box-sizing:border-box; flex:none; }
.plus-ring svg { width:13px; height:13px; fill:none; stroke:white; stroke-width:1.8; stroke-linecap:round; }
.personalization-menu { margin:0 16px; border-radius:20px; background:#1b1b1d; padding:0 12px; overflow:hidden; }
.menu-row { width:100%; min-height:62px; display:flex; align-items:center; gap:14px; color:white; border:0; border-bottom:1px solid rgba(255,255,255,.1); background:transparent; padding:0 2px; text-align:left; }
.menu-row:last-child { border-bottom:0; }
.menu-icon { width:35px; height:35px; flex:none; border-radius:10px; display:grid; place-items:center; box-shadow:none; overflow:hidden; }
.icon-image { background:linear-gradient(145deg,#8b6aff,#5a3bea)!important; }.icon-phone { background:linear-gradient(145deg,#4b4b4f,#242426)!important; }.icon-font,.icon-lock { background:linear-gradient(145deg,#178dff,#0060e8)!important; }.icon-palette { background:linear-gradient(145deg,#35dbdf,#08aeb9)!important; }.icon-desktop { background:linear-gradient(145deg,#896fff,#5740e5)!important; }
.menu-icon svg { width:20px; height:20px; fill:none; stroke:white; stroke-width:1.8; stroke-linecap:round; stroke-linejoin:round; vector-effect:non-scaling-stroke; }
.menu-icon .filled-wallpaper-glyph { width:20px; height:20px; stroke:none; }
.menu-icon .filled-phone-glyph { width:22px; height:26px; stroke:none; }
.menu-icon .color-grid-glyph { width:35px; height:35px; stroke:none; overflow:visible; }
.color-grid-glyph .grid-shell { fill:#f7f7f8; stroke:#d9d9dc; stroke-width:.7; }
.icon-palette .filled-palette-glyph { width:20px; height:20px; stroke:none; }
.icon-lock .filled-lock-glyph { width:19px; height:21px; stroke:none; }
.icon-desktop .filled-desktop-glyph { width:20px; height:20px; stroke:none; }
.font-glyph { font:400 19px/1 Georgia,serif; transform:translateY(-.5px); }
.menu-label { flex:1; font:450 15.5px/1.3 var(--font-stack); }
.chevron { width:21px; height:21px; fill:none; stroke:#77777b; stroke-width:2; stroke-linecap:round; stroke-linejoin:round; }
.theme-actions { display:grid; grid-template-columns:repeat(4,1fr); gap:4px; padding:46px 15px 34px; }
.theme-actions button { border:0; background:none; color:white; display:flex; flex-direction:column; align-items:center; gap:10px; font-size:12px; white-space:nowrap; }
.round-action { width:66px; height:66px; border-radius:50%; display:grid; place-items:center; background:#1c1c1e; border:1px solid rgba(255,255,255,.12); }
.round-action svg { width:29px; height:29px; fill:none; stroke:#ff9f0a; stroke-width:2; stroke-linecap:round; stroke-linejoin:round; }
.action-layers svg { stroke:#ff7a16; }.action-cube b { color:#0a84ff; font-size:19px; }.action-magic svg { stroke:#d946ef; }
.theme-section { margin-top:4px; }
.section-heading { height:55px; padding:0 22px; display:flex; align-items:center; justify-content:space-between; }
.section-heading h2 { margin:0; font-size:21px; }.section-heading span { font-size:36px; color:#b8b8be; font-weight:200; }
.theme-card-row,.depth-row { display:flex; gap:10px; overflow-x:auto; padding:0 17px 18px; scroll-snap-type:x mandatory; scrollbar-width:none; }
.theme-card-row::-webkit-scrollbar,.depth-row::-webkit-scrollbar { display:none; }
.market-theme,.depth-card { width:130px; height:277px; border:0; border-radius:18px; overflow:hidden; flex:none; position:relative; padding:0; scroll-snap-align:start; background:#111; color:white; }
.market-theme img { width:100%; height:100%; object-fit:cover; }
.market-time { position:absolute; top:30px; left:0; right:0; text-align:center; font-size:37px; color:rgba(255,255,255,.66); font-weight:600; letter-spacing:-3px; }
.download-mark { position:absolute; right:9px; bottom:10px; width:22px; height:22px; font-size:24px; font-weight:700; }
.depth-section { margin-top:4px; }
.depth-card { width:130px; height:277px; border:0; border-radius:18px; overflow:hidden; flex:none; position:relative; padding:0; scroll-snap-align:start; background:#111; color:white; cursor:pointer; }
.depth-card-bg { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
.depth-card-overlay { position:absolute; inset:0; background:linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.6) 100%); display:flex; flex-direction:column; align-items:center; padding-top:28px; box-sizing:border-box; }
.depth-card-overlay small { font-size:10px; color:rgba(255,255,255,0.85); font-weight:500; }
.depth-card-overlay b { font-size:42px; letter-spacing:-2px; color:rgba(255,255,255,0.95); font-weight:700; margin-top:2px; }
.depth-badge { margin-top:auto; margin-bottom:28px; background:rgba(255,255,255,0.25); backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px); padding:2px 10px; border-radius:10px; font-size:11px; font-weight:600; color:white; }
.depth-card-label { position:absolute; bottom:8px; left:0; right:0; text-align:center; font-size:12px; font-weight:500; color:rgba(255,255,255,0.8); }

.depth-toggle-card { margin-top:20px; padding:14px 16px; border-radius:16px; background:#1c1c1e; border:1px solid rgba(255,255,255,0.1); display:flex; align-items:center; justify-content:space-between; gap:12px; }
.depth-toggle-left { display:flex; flex-direction:column; gap:4px; }
.depth-toggle-title { display:flex; align-items:center; gap:8px; font-size:16px; font-weight:600; color:white; }
.depth-icon { width:18px; height:18px; stroke:#ff9f0a; stroke-width:2; fill:none; }
.depth-toggle-desc { font-size:12px; color:#8e8e93; line-height:1.3; }
.depth-switch { width:48px; height:28px; border-radius:14px; background:#39393d; border:none; position:relative; cursor:pointer; padding:2px; transition:background-color 0.2s ease; flex-shrink:0; }
.depth-switch.active { background:#34c759; }
.depth-switch-knob { width:24px; height:24px; border-radius:50%; background:white; display:block; box-shadow:0 2px 4px rgba(0,0,0,0.2); transition:transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1); }
.depth-switch.active .depth-switch-knob { transform:translateX(20px); }

.scanning-toast { position:fixed; bottom:80px; left:50%; transform:translateX(-50%); background:rgba(30,30,32,0.92); backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px); border:1px solid rgba(255,255,255,0.18); padding:10px 18px; border-radius:20px; display:flex; align-items:center; gap:10px; font-size:14px; font-weight:500; color:white; z-index:100; box-shadow:0 12px 30px rgba(0,0,0,0.5); }
.scan-spinner { width:14px; height:14px; border:2px solid rgba(255,255,255,0.3); border-top-color:white; border-radius:50%; animation:scan-spin 0.8s linear infinite; }
@keyframes scan-spin { to { transform:rotate(360deg); } }

.wallpapers-page { padding:44px 17px 100px; position:relative; }
.gallery-card { width:100%; height:74px; border:0; border-radius:18px; background:#1b1b1d; color:white; display:flex; align-items:center; gap:18px; padding:0 17px; font-size:19px; font-weight:650; text-align:left; }
.gallery-icon { width:42px; height:42px; border-radius:12px; background:#ff9f0a; display:grid; place-items:center; }
.gallery-icon svg { width:27px; height:27px; fill:none; stroke:white; stroke-width:1.8; stroke-linecap:round; stroke-linejoin:round; }
.wallpaper-heading { margin:26px 17px 18px; font-size:22px; }
.wallpaper-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; }
.wallpaper-tile { border:1px solid rgba(255,255,255,.12); padding:0; border-radius:17px; overflow:hidden; aspect-ratio:.47; position:relative; background:#111; }
.wallpaper-tile img { width:100%; height:100%; display:block; object-fit:cover; }
.wallpaper-tile.selected { box-shadow:0 0 0 2px #0a84ff; }
.selection-check { position:absolute; right:8px; top:8px; width:23px; height:23px; border-radius:50%; display:none; place-items:center; background:#0a84ff; color:white; font-size:14px; font-weight:800; }
.wallpaper-tile.selected .selection-check { display:grid; }
.apply-wallpaper { position:sticky; bottom:14px; margin:26px auto 0; display:block; border:0; min-width:150px; height:45px; border-radius:23px; background:#0a84ff; color:white; font-size:16px; font-weight:650; box-shadow:0 10px 28px rgba(0,0,0,.6); }
.apply-wallpaper:disabled { background:#29292c; color:#8f8f95; }
.personalization-slide-enter-active,.personalization-slide-leave-active { transition:transform .28s cubic-bezier(.22,.8,.25,1),opacity .2s ease; }
.personalization-slide-enter-from { transform:translateX(14%); opacity:0; }.personalization-slide-leave-to { transform:translateX(-8%); opacity:0; }
@media (max-width:340px) { .device-preview { width:131px; height:262px; }.round-action { width:59px; height:59px; }.theme-actions { padding-inline:8px; }.menu-label { font-size:16px; } }
@media (prefers-reduced-motion:reduce) { .personalization-slide-enter-active,.personalization-slide-leave-active { transition-duration:.01ms; } }
</style>
