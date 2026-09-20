<script setup>
import { computed, ref } from 'vue'
import currentWallpaper from '../../../../assets/img/wallpaper-lock.jpg'
import bronzeWallpaper from '../../../../assets/img/personalization/glass-bronze.png'
import blueWallpaper from '../../../../assets/img/personalization/glass-blue.png'
import mintWallpaper from '../../../../assets/img/personalization/glass-mint.png'
import roseWallpaper from '../../../../assets/img/personalization/glass-rose.png'
import colorIconsArtwork from '../../../../assets/img/personalization/color-icons.png'

const emit = defineEmits(['back'])

const screen = ref('overview')
const selectedWallpaper = ref(currentWallpaper)
const activeWallpaper = ref(currentWallpaper)

const wallpapers = [
  { id: 'bronze', src: bronzeWallpaper, tone: '#d9974e', title: '鎏金玻璃' },
  { id: 'blue', src: blueWallpaper, tone: '#4789ff', title: '深海蓝光' },
  { id: 'mint', src: mintWallpaper, tone: '#38e6c1', title: '薄荷极光' },
  { id: 'rose', src: roseWallpaper, tone: '#ff4fa1', title: '玫瑰霓虹' }
]

const pageTitle = computed(() => {
  if (screen.value === 'themes') return '添加新主题'
  if (screen.value === 'wallpapers') return '壁纸'
  return '主题与个性化'
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

function applyWallpaper() {
  activeWallpaper.value = selectedWallpaper.value
}

defineExpose({ back: () => {
  if (screen.value === 'overview') return false
  screen.value = 'overview'
  return true
} })

const menuItems = [
  { id: 'wallpaper', label: '壁纸', icon: 'image', color: '#7658ff' },
  { id: 'aod', label: '息屏显示', icon: 'phone', color: '#48484a' },
  { id: 'icons', label: '图标', icon: 'grid', color: '#ffffff' },
  { id: 'font', label: '字体', icon: 'font', color: '#087cff' },
  { id: 'color', label: '系统颜色', icon: 'palette', color: '#20cbd0' },
  { id: 'lock', label: '锁屏设置', icon: 'lock', color: '#087cff' },
  { id: 'home', label: '桌面设置', icon: 'home', color: '#7558ff' }
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
            <article class="device-preview lock-preview" :style="{ backgroundImage: `url(${activeWallpaper})` }">
              <div class="preview-date">周日, 9月20日</div>
              <div class="preview-clock">18:16</div>
              <button class="edit-pill">编辑</button>
            </article>
            <article class="device-preview home-preview" :style="{ backgroundImage: `url(${activeWallpaper})` }">
              <div class="mini-app-grid">
                <span v-for="n in 16" :key="n" :style="{ '--i': n }"></span>
              </div>
              <div class="mini-dock"><i v-for="n in 4" :key="n"></i></div>
              <button class="edit-pill">编辑</button>
            </article>
          </div>
        </div>

        <button class="add-theme-button" @click="screen = 'themes'">
          <span class="plus-ring">+</span> 添加新主题
        </button>

        <section class="personalization-menu">
          <button v-for="(item, index) in menuItems" :key="item.id" class="menu-row" @click="openSection(item.id)">
            <span class="menu-icon" :style="{ background: item.color }" :class="`icon-${item.icon}`">
              <img v-if="item.icon === 'grid'" :src="colorIconsArtwork" alt="">
              <svg v-if="item.icon === 'image'" viewBox="0 0 24 24"><rect x="3.5" y="4" width="17" height="16" rx="3"/><circle cx="9" cy="9" r="1.5"/><path d="m5.5 17 4-4 3 2.5 2.7-3 3.3 4.5"/></svg>
              <svg v-else-if="item.icon === 'phone'" viewBox="0 0 24 24"><rect x="7" y="3" width="10" height="18" rx="2.5"/><path d="M10 18h4"/></svg>
              <span v-else-if="item.icon === 'font'" class="font-glyph">Aa</span>
              <svg v-else-if="item.icon === 'palette'" viewBox="0 0 24 24"><path d="M12 3a9 9 0 1 0 0 18h1.4a2 2 0 0 0 1.3-3.5 1.7 1.7 0 0 1 1.1-3h1.7A3.5 3.5 0 0 0 21 11 8 8 0 0 0 12 3Z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="15" cy="7.5" r="1"/></svg>
              <svg v-else-if="item.icon === 'lock'" viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="11" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>
              <svg v-else viewBox="0 0 24 24"><path d="m4 11 8-7 8 7v9H4Z"/><path d="M9 20v-5h6v5"/></svg>
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
          <div class="section-heading"><h2>景深</h2><span>›</span></div>
          <div class="depth-row">
            <article class="depth-card depth-sky"><small>Mon, Dec 18</small><b>09:30</b><span class="skater">●</span><i>↓</i></article>
            <article class="depth-card depth-flower"><small>Mon, Dec 18</small><b>09:30</b><span class="flower">✦</span><i>↓</i></article>
            <article class="depth-card depth-forest"><small>Mon, Dec 18</small><b>09:30</b><span class="forest">◢</span><i>↓</i></article>
          </div>
        </section>
      </main>

      <main v-else key="wallpapers" class="personalization-scroll wallpapers-page">
        <button class="gallery-card">
          <span class="gallery-icon"><svg viewBox="0 0 24 24"><rect x="3.5" y="4" width="17" height="16" rx="3"/><path d="m5.5 17 4-4 3 2.5 2.7-3 3.3 4.5"/></svg></span>
          <span>从图库选择</span>
        </button>
        <h2 class="wallpaper-heading">静态壁纸</h2>
        <div class="wallpaper-grid">
          <button v-for="wallpaper in wallpapers" :key="wallpaper.id" class="wallpaper-tile" :class="{ selected: selectedWallpaper === wallpaper.src }" @click="chooseWallpaper(wallpaper.src)">
            <img :src="wallpaper.src" :alt="wallpaper.title">
            <span class="selection-check">✓</span>
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
.round-back { width:42px; height:42px; border:1px solid rgba(255,255,255,.12); border-radius:50%; background:rgba(255,255,255,.09); color:white; display:grid; place-items:center; padding:0; box-shadow:inset 0 1px rgba(255,255,255,.08); }
.round-back svg { width:24px; height:24px; fill:none; stroke:currentColor; stroke-width:1.8; stroke-linecap:round; stroke-linejoin:round; }
.personalization-scroll { height:calc(100% - var(--safe-top) - 58px); overflow:auto; scrollbar-width:none; box-sizing:border-box; padding-bottom:calc(var(--safe-bottom) + 30px); }
.personalization-scroll::-webkit-scrollbar { display:none; }
.overview-page { padding-top:20px; }
.section-kicker { text-align:center; color:#c6c6cb; font-size:14px; font-weight:600; margin:0 0 24px; }
.current-theme-stage { width:100%; overflow:hidden; }
.theme-pair { display:flex; justify-content:center; gap:10px; padding:0 20px; }
.device-preview { width:142px; height:284px; border-radius:22px; position:relative; overflow:hidden; flex:none; background-position:center; background-size:cover; box-shadow:0 16px 24px rgba(0,0,0,.55); }
.device-preview::after { content:""; position:absolute; inset:0; background:linear-gradient(rgba(0,0,0,.04),rgba(0,0,0,.1)); pointer-events:none; }
.preview-date { position:absolute; top:26px; left:0; right:0; text-align:center; z-index:1; font-size:8px; font-weight:600; }
.preview-clock { position:absolute; top:39px; left:0; right:0; text-align:center; z-index:1; font-size:33px; line-height:1; font-weight:650; letter-spacing:-2px; }
.edit-pill { position:absolute; z-index:2; bottom:14px; left:50%; transform:translateX(-50%); border:0; border-radius:18px; padding:7px 18px; color:white; background:rgba(128,128,132,.62); backdrop-filter:blur(14px); font-size:10px; }
.mini-app-grid { position:absolute; inset:62px 14px 66px; display:grid; grid-template-columns:repeat(4,1fr); gap:9px 7px; z-index:1; }
.mini-app-grid span { aspect-ratio:1; border-radius:7px; background:hsl(calc(var(--i) * 38deg) 82% 56%); box-shadow:inset 0 0 0 1px rgba(255,255,255,.3); }
.mini-dock { position:absolute; bottom:49px; left:13px; right:13px; height:28px; border-radius:12px; background:rgba(255,255,255,.2); display:flex; align-items:center; justify-content:space-around; z-index:1; }
.mini-dock i { width:20px; height:20px; border-radius:6px; background:#f4f4f4; }
.add-theme-button { margin:44px auto 36px; display:flex; align-items:center; gap:8px; border:1px solid rgba(255,255,255,.14); background:linear-gradient(180deg,rgba(255,255,255,.14),rgba(255,255,255,.06)); color:white; height:46px; padding:0 34px; border-radius:24px; font-size:15px; font-weight:650; box-shadow:0 8px 24px rgba(0,0,0,.4); }
.plus-ring { width:18px; height:18px; border:1.8px solid white; border-radius:50%; display:grid; place-items:center; font-size:18px; line-height:14px; }
.personalization-menu { margin:0 16px; border-radius:20px; background:#1b1b1d; padding:0 12px; overflow:hidden; }
.menu-row { width:100%; min-height:62px; display:flex; align-items:center; gap:14px; color:white; border:0; border-bottom:1px solid rgba(255,255,255,.1); background:transparent; padding:0 2px; text-align:left; }
.menu-row:last-child { border-bottom:0; }
.menu-icon { width:35px; height:35px; flex:none; border-radius:10px; display:grid; place-items:center; box-shadow:inset 0 1px rgba(255,255,255,.24); }
.menu-icon svg { width:22px; height:22px; fill:none; stroke:white; stroke-width:1.8; stroke-linecap:round; stroke-linejoin:round; }
.menu-icon img { width:100%; height:100%; object-fit:contain; border-radius:10px; }
.font-glyph { font:400 22px/1 Georgia,serif; }
.menu-label { flex:1; font-size:17px; font-weight:600; }
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
.depth-card { padding:15px 9px; box-sizing:border-box; text-align:center; background:#2965a5; }
.depth-card small { display:block; font-size:7px; }.depth-card b { display:block; font-size:43px; letter-spacing:-4px; color:rgba(255,255,255,.76); }.depth-card i { position:absolute; right:9px; bottom:8px; font-size:22px; font-style:normal; }
.depth-sky { background:linear-gradient(#1c4b91,#70b8e7 62%,#232a35); }.depth-sky .skater { display:block; font-size:85px; transform:translateY(20px); color:#f4f4f4; }
.depth-flower { background:linear-gradient(140deg,#7149b9,#9f65dc 48%,#251840); }.depth-flower .flower { display:block; font-size:105px; color:#bba1ff; transform:translateY(23px); }
.depth-forest { background:linear-gradient(145deg,#063d24,#2e7c3d 48%,#8caa4d); }.depth-forest .forest { display:block; font-size:95px; color:#173715; transform:translateY(23px); }
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
