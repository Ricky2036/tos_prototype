<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { useSystemStore } from '../../../stores/systemStore'
import { useBackHandler } from '../../../composables/backRegistry'
import printerPhoto from '../../../assets/img/oneleap-printer-photo.jpg'

const system = useSystemStore()

// 选中的设备：'recorder' | 'printer' | 'watch' | 'glasses' | null
const activeDevice = ref('recorder') // 默认展开录音充电宝控制卡，完美衔接录音 Demo 原型
const helpDismissed = ref(false)

// 录音充电宝状态
const recording = ref(false)
const paused = ref(false)
const recordSeconds = ref(0)
let recordTimer = null
const currentMode = ref('全向')
const currentModeCopy = ref('四周均衡拾音')
const modeSheetOpen = ref(false)
const charging = ref(false)

// 口袋打印机状态
const launchOverlayOpen = ref(false)
const launchProgress = ref(0)
let launchTimer = null

// 更多菜单
const moreMenuOpen = ref(false)

// 消息提示 (Toast)
const toastMessage = ref('')
let toastTimer = null

function showToast(msg) {
  toastMessage.value = msg
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastMessage.value = ''
  }, 1900)
}

// 录音机计时器与格式化
const formattedRecordTime = computed(() => {
  const m = String(Math.floor(recordSeconds.value / 60)).padStart(2, '0')
  const s = String(recordSeconds.value % 60).padStart(2, '0')
  return `${m}:${s}`
})

function startOrPauseRecording() {
  if (!recording.value) {
    recording.value = true
    paused.value = false
    recordSeconds.value = 0
    clearInterval(recordTimer)
    recordTimer = setInterval(() => {
      recordSeconds.value++
    }, 1000)
    showToast('已向录音机发送开始指令')
  } else {
    paused.value = !paused.value
    if (paused.value) {
      clearInterval(recordTimer)
      showToast('录音已暂停')
    } else {
      recordTimer = setInterval(() => {
        recordSeconds.value++
      }, 1000)
      showToast('录音已继续')
    }
  }
}

function stopRecording() {
  recording.value = false
  paused.value = false
  recordSeconds.value = 0
  clearInterval(recordTimer)
  showToast('录音已停止并保存至设备')
}

// 拾音模式切换
const PICKUP_MODES = [
  { mode: '全向', copy: '四周均衡拾音', desc: '适合随手记录与多人交谈', icon: '◎' },
  { mode: '定向', copy: '聚焦正前方人声', desc: '减少侧后方环境噪声', icon: '◉' },
  { mode: '会议', copy: '多人声场增强', desc: '增强远近不同位置的发言人', icon: '会' }
]

function selectMode(item) {
  currentMode.value = item.mode
  currentModeCopy.value = item.copy
  modeSheetOpen.value = false
  showToast(`已切换为${item.mode}拾音模式`)
}

// 反向充电切换
function toggleCharging() {
  charging.value = !charging.value
  showToast(charging.value ? '反向充电已开启，正在为手机供电 9W' : '反向充电已关闭')
}

// 口袋打印机：发起打印流程
function launchAIMatePrinter() {
  launchOverlayOpen.value = true
  launchProgress.value = 0
  if (launchTimer) clearInterval(launchTimer)

  const startTime = Date.now()
  const duration = 900

  launchTimer = setInterval(() => {
    const elapsed = Date.now() - startTime
    const p = Math.min(100, Math.round((elapsed / duration) * 100))
    launchProgress.value = p
    if (p >= 100) {
      clearInterval(launchTimer)
      setTimeout(() => {
        launchOverlayOpen.value = false
        showToast('已连接口袋打印机，请选择照片')
      }, 350)
    }
  }, 40)
}

// 设备选择
function selectDevice(name) {
  moreMenuOpen.value = false
  activeDevice.value = name
}


function closePanel() {
  activeDevice.value = null
  modeSheetOpen.value = false
}

// 更多菜单功能
function onRefreshDevices() {
  moreMenuOpen.value = false
  showToast('正在扫描并刷新附近生态设备...')
}

function onResetDemoState() {
  moreMenuOpen.value = false
  recording.value = false
  paused.value = false
  recordSeconds.value = 0
  clearInterval(recordTimer)
  charging.value = false
  currentMode.value = '全向'
  currentModeCopy.value = '四周均衡拾音'
  activeDevice.value = 'recorder'
  showToast('已重置设备快捷控制演示状态')
}

// 返回处理
function handleBack() {
  if (launchOverlayOpen.value) {
    launchOverlayOpen.value = false
    return true
  }
  if (modeSheetOpen.value) {
    modeSheetOpen.value = false
    return true
  }
  if (moreMenuOpen.value) {
    moreMenuOpen.value = false
    return true
  }
  if (activeDevice.value) {
    activeDevice.value = null
    return true
  }
  system.goHome()
  return true
}

// 注册系统侧滑返回
useBackHandler(() => {
  return handleBack()
})

onBeforeUnmount(() => {
  clearInterval(recordTimer)
  clearInterval(launchTimer)
  clearTimeout(toastTimer)
})
</script>

<template>
  <div class="oneleap-app" :class="{ 'is-recording': recording && !paused }">
    <!-- 背景光效与空间星轨 -->
    <div class="ambient-backdrop" @click="closePanel">
      <div class="ambient-glow a"></div>
      <div class="ambient-glow b"></div>
      <div class="ambient-glow c"></div>
      <div class="orbit-concentric"></div>
    </div>

    <!-- 顶部导航栏 -->
    <header class="app-header">
      <button class="nav-round-btn" aria-label="返回" @click="handleBack">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>
      <div class="header-title">
        <h1>OneLeap</h1>
        <span class="header-subtitle">互联中心</span>
      </div>
      <button class="nav-round-btn more" aria-label="更多" @click.stop="moreMenuOpen = !moreMenuOpen">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="2"></circle>
          <circle cx="12" cy="12" r="2"></circle>
          <circle cx="12" cy="19" r="2"></circle>
        </svg>
      </button>

      <!-- 更多操作弹层 -->
      <div v-if="moreMenuOpen" class="more-popover" @click.stop>
        <button class="popover-item" @click="onRefreshDevices">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="23 4 23 10 17 10"></polyline>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
          </svg>
          <span>刷新附近设备</span>
        </button>
        <div class="popover-divider"></div>
        <button class="popover-item" @click="onResetDemoState">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
            <path d="M3 3v5h5"></path>
          </svg>
          <span>重置演示状态</span>
        </button>
      </div>
    </header>

    <!-- 空间互联星轨与拓扑关系图 -->
    <main class="topology" @click="closePanel">
      <!-- 连线光效 (中心连各外围节点) -->
      <svg class="topology-lines" viewBox="0 0 360 420" preserveAspectRatio="none">
        <defs>
          <linearGradient id="linkRecorderGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="rgba(255, 255, 255, 0.15)" />
            <stop offset="60%" stop-color="rgba(241, 138, 67, 0.7)" />
            <stop offset="100%" stop-color="rgba(255, 180, 110, 0.9)" />
          </linearGradient>
          <linearGradient id="linkPrinterGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="rgba(255, 255, 255, 0.15)" />
            <stop offset="60%" stop-color="rgba(32, 228, 107, 0.65)" />
            <stop offset="100%" stop-color="rgba(110, 245, 160, 0.85)" />
          </linearGradient>
          <linearGradient id="linkWatchGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="rgba(255, 255, 255, 0.15)" />
            <stop offset="100%" stop-color="rgba(140, 175, 230, 0.5)" />
          </linearGradient>
          <linearGradient id="linkGlassesGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="rgba(255, 255, 255, 0.1)" />
            <stop offset="100%" stop-color="rgba(255, 255, 255, 0.25)" />
          </linearGradient>
        </defs>

        <!-- 连线: 中心(180, 190) -> 录音充电宝(278, 92) -->
        <line x1="180" y1="190" x2="278" y2="92" stroke="url(#linkRecorderGrad)" stroke-width="1.5" stroke-dasharray="3 3" class="line-pulse" />
        <!-- 连线: 中心(180, 190) -> 口袋打印机(78, 90) -->
        <line x1="180" y1="190" x2="78" y2="90" stroke="url(#linkPrinterGrad)" stroke-width="1.5" stroke-dasharray="3 3" />
        <!-- 连线: 中心(180, 190) -> OneLeap Watch(84, 290) -->
        <line x1="180" y1="190" x2="84" y2="290" stroke="url(#linkWatchGrad)" stroke-width="1.2" opacity="0.6" />
        <!-- 连线: 中心(180, 190) -> AI Audio Glasses(284, 280) -->
        <line x1="180" y1="190" x2="284" y2="280" stroke="url(#linkGlassesGrad)" stroke-width="1" opacity="0.35" />
      </svg>

      <!-- 中心节点：AI Mate 手机 -->
      <div class="node central-node" @click.stop>
        <div class="node-circle central-circle">
          <div class="phone-shape">
            <span class="phone-cam"></span>
            <span class="phone-speaker"></span>
          </div>
        </div>
        <span class="node-label">AI Mate 手机</span>
      </div>

      <!-- 节点 1：录音充电宝 -->
      <div
        class="node peripheral-node recorder-node"
        :class="{ active: activeDevice === 'recorder', 'recording-glow': recording && !paused }"
        @click.stop="selectDevice('recorder')"
      >
        <div class="node-circle recorder-circle">
          <div class="recorder-shape">
            <span class="mic-grill"></span>
            <span class="recorder-led" :class="{ 'led-red': recording && !paused, 'led-orange': paused }"></span>
          </div>
        </div>
        <span class="node-label">录音充电宝</span>
      </div>

      <!-- 节点 2：我的口袋打印机 -->
      <div
        class="node peripheral-node printer-node"
        :class="{ active: activeDevice === 'printer' }"
        @click.stop="selectDevice('printer')"
      >
        <div class="node-circle printer-circle">
          <div class="printer-shape">
            <div class="printer-photo-slip" :style="{ backgroundImage: `url(${printerPhoto})` }"></div>
            <span class="printer-led"></span>
          </div>
        </div>
        <span class="node-label">我的口袋打印机</span>
      </div>

      <!-- 节点 3：OneLeap Watch -->
      <div
        class="node peripheral-node watch-node"
        :class="{ active: activeDevice === 'watch' }"
        @click.stop="selectDevice('watch')"
      >
        <div class="node-circle watch-circle">
          <div class="watch-shape">
            <span class="watch-screen"></span>
          </div>
        </div>
        <span class="node-label">OneLeap Watch</span>
      </div>

      <!-- 节点 4：AI Audio Glasses -->
      <div
        class="node peripheral-node glasses-node"
        :class="{ active: activeDevice === 'glasses' }"
        @click.stop="selectDevice('glasses')"
      >
        <div class="node-circle glasses-circle">
          <div class="glasses-shape"></div>
        </div>
        <span class="node-label">AI 音频眼镜</span>
      </div>

      <!-- 空间状态胶囊 -->
      <div class="connection-pill">
        <span class="status-dot"></span>
        <span>设备已连接 · 4台在线</span>
      </div>
    </main>

    <!-- 底部常驻帮助卡片（当无设备被选且未主动关闭时展示） -->
    <transition name="slide-up">
      <section v-if="!activeDevice && !helpDismissed" class="help-card" @click.stop>
        <button class="close-help-btn" aria-label="关闭提示" @click="helpDismissed = true">×</button>
        <div class="help-content">
          <strong>如何控制设备？</strong>
          <small>轻触外围设备节点，快速展开控制面板与快捷指令。</small>
        </div>
        <div class="help-diagram">
          <span class="diagram-dot dot-1"></span>
          <span class="diagram-dot dot-2"></span>
          <span class="diagram-dot dot-3"></span>
          <span class="diagram-line line-1"></span>
          <span class="diagram-line line-2"></span>
        </div>
      </section>
    </transition>

    <!-- 底部控制卡 1：录音充电宝控制面板 -->
    <transition name="panel-sheet">
      <section v-if="activeDevice === 'recorder'" class="device-panel recorder-panel" @click.stop>
        <button class="panel-close-btn" aria-label="关闭控制卡" @click="closePanel">×</button>

        <div class="device-title-area">
          <div class="recorder-shape title-icon">
            <span class="mic-grill"></span>
            <span class="recorder-led" :class="{ 'led-red': recording && !paused, 'led-orange': paused }"></span>
          </div>
          <h2>录音充电宝</h2>
          <div class="device-meta-row">
            <span class="power-text">▰ 86% 电量</span>
            <span class="meta-divider">·</span>
            <span>蓝牙已连接</span>
          </div>
        </div>

        <!-- 录音主动作按钮 -->
        <button
          class="main-record-btn"
          :class="{ 'is-active-recording': recording }"
          @click="startOrPauseRecording"
        >
          <div class="record-btn-left">
            <span class="record-state-icon">{{ recording ? (paused ? '▶' : 'Ⅱ') : '●' }}</span>
            <span class="record-state-title">{{ recording ? (paused ? '继续录音' : '暂停录音') : '开始录音' }}</span>
          </div>
          <small class="record-btn-right" :class="{ 'timer-counting': recording && !paused }">
            {{ recording ? (paused ? '录音已暂停' : `正在录音 ${formattedRecordTime}`) : '设备端录制' }}
          </small>
        </button>

        <!-- 录音中停止按钮快捷栏 -->
        <div v-if="recording" class="record-sub-actions">
          <button class="stop-record-btn" @click="stopRecording">
            <span>■ 结束并保存录音</span>
          </button>
        </div>

        <!-- 拾音模式选择行 -->
        <button class="quick-row" @click="modeSheetOpen = true">
          <span class="row-icon">◎</span>
          <div class="row-copy">
            <b>拾音模式</b>
            <small>{{ currentMode }} · {{ currentModeCopy }}</small>
          </div>
          <span class="row-chevron">›</span>
        </button>

        <!-- 反向充电控制行 -->
        <div class="quick-row">
          <span class="row-icon">↯</span>
          <div class="row-copy">
            <b>反向充电</b>
            <small>{{ charging ? '已开启 · 正在为手机供电 9W' : '已关闭 · 节省设备电量' }}</small>
          </div>
          <button
            class="switch-control"
            :class="{ active: charging }"
            role="switch"
            :aria-checked="charging"
            @click="toggleCharging"
          ></button>
        </div>
      </section>
    </transition>

    <!-- 底部控制卡 2：口袋打印机控制面板 -->
    <transition name="panel-sheet">
      <section v-if="activeDevice === 'printer'" class="device-panel printer-panel" @click.stop>
        <button class="panel-close-btn" aria-label="关闭控制卡" @click="closePanel">×</button>

        <div class="device-title-area">
          <div class="printer-shape title-icon">
            <div class="printer-photo-slip" :style="{ backgroundImage: `url(${printerPhoto})` }"></div>
            <span class="printer-led"></span>
          </div>
          <h2>我的口袋打印机</h2>
          <div class="device-meta-row">
            <span class="battery-indicator">
              <span class="battery-fill" style="width: 78%"></span>
            </span>
            <span class="power-text">电量 78%</span>
            <span class="meta-divider">·</span>
            <span>相纸 5 / 5 张</span>
          </div>
        </div>

        <button class="only-action-btn" @click="launchAIMatePrinter">
          <span>开始打印</span>
        </button>
        <p class="action-caption">将在 AI Mate 中选择照片并完成打印</p>
      </section>
    </transition>

    <!-- 底部控制卡 3：OneLeap Watch 控制面板 -->
    <transition name="panel-sheet">
      <section v-if="activeDevice === 'watch'" class="device-panel watch-panel" @click.stop>
        <button class="panel-close-btn" aria-label="关闭控制卡" @click="closePanel">×</button>

        <div class="device-title-area">
          <div class="watch-shape title-icon">
            <span class="watch-screen"></span>
          </div>
          <h2>OneLeap Watch</h2>
          <div class="device-meta-row">
            <span class="power-text">▰ 92% 电量</span>
            <span class="meta-divider">·</span>
            <span>健康数据实时同步</span>
          </div>
        </div>

        <div class="quick-row">
          <span class="row-icon">♥</span>
          <div class="row-copy">
            <b>心率监测</b>
            <small>72 次/分 · 处于静息健康区间</small>
          </div>
        </div>

        <div class="quick-row">
          <span class="row-icon">👟</span>
          <div class="row-copy">
            <b>今日运动</b>
            <small>6,420 步 · 已达成今日目标的 64%</small>
          </div>
        </div>
      </section>
    </transition>

    <!-- 底部控制卡 4：AI 音频眼镜 控制面板 -->
    <transition name="panel-sheet">
      <section v-if="activeDevice === 'glasses'" class="device-panel glasses-panel" @click.stop>
        <button class="panel-close-btn" aria-label="关闭控制卡" @click="closePanel">×</button>

        <div class="device-title-area">
          <div class="glasses-shape title-icon"></div>
          <h2>AI 音频眼镜</h2>
          <div class="device-meta-row">
            <span class="power-text">▰ 65% 电量</span>
            <span class="meta-divider">·</span>
            <span>待机状态</span>
          </div>
        </div>

        <div class="quick-row">
          <span class="row-icon">♫</span>
          <div class="row-copy">
            <b>空间环绕音频</b>
            <small>已就绪 · 支持头部姿态追踪</small>
          </div>
        </div>
      </section>
    </transition>

    <!-- 拾音模式选择弹层 (Sheet) -->
    <div v-if="modeSheetOpen" class="sheet-modal-backdrop" @click="modeSheetOpen = false">
      <div class="sheet-modal-content" @click.stop>
        <div class="sheet-handle"></div>
        <div class="sheet-head-row">
          <h3>切换拾音模式</h3>
          <button class="sheet-close-icon" aria-label="关闭" @click="modeSheetOpen = false">×</button>
        </div>

        <div class="mode-options-list">
          <button
            v-for="item in PICKUP_MODES"
            :key="item.mode"
            class="mode-option-btn"
            :class="{ active: currentMode === item.mode }"
            @click="selectMode(item)"
          >
            <span class="mode-glyph">{{ item.icon }}</span>
            <div class="mode-text-wrap">
              <b>{{ item.mode }}</b>
              <small>{{ item.desc }}</small>
            </div>
            <span class="mode-check-circle"></span>
          </button>
        </div>
      </div>
    </div>

    <!-- 打印跳转动画全屏遮罩 -->
    <div v-if="launchOverlayOpen" class="launch-overlay" @click.stop>
      <div class="launch-modal-box">
        <div class="ai-mate-icon">
          <span class="ai-eye left"></span>
          <span class="ai-eye right"></span>
          <span class="ai-mouth"></span>
        </div>
        <strong>正在打开 AI Mate</strong>
        <p>前往口袋打印机页面</p>
        <div class="launch-loader-track">
          <div class="launch-loader-bar" :style="{ width: `${launchProgress}%` }"></div>
        </div>
      </div>
    </div>

    <!-- 底部悬浮提示 Toast -->
    <transition name="toast-fade">
      <div v-if="toastMessage" class="oneleap-toast">
        {{ toastMessage }}
      </div>
    </transition>
  </div>
</template>

<style scoped>
.oneleap-app {
  position: absolute;
  inset: 0;
  background: #121826;
  color: #f7f8fb;
  font-family: var(--font-stack);
  overflow: hidden;
  user-select: none;
  -webkit-user-select: none;
}

/* 背景光效与空间星轨 */
.ambient-backdrop {
  position: absolute;
  inset: 0;
  pointer-events: auto;
  overflow: hidden;
  background: radial-gradient(circle at 14% 9%, rgba(255, 255, 255, 0.28), transparent 30%),
              radial-gradient(circle at 82% 57%, rgba(36, 40, 59, 0.45), transparent 36%),
              linear-gradient(145deg, #444a5a 0%, #1e2432 46%, #0d1523 100%);
}

.ambient-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(48px);
  pointer-events: none;
}
.ambient-glow.a {
  left: -20px;
  top: 100px;
  width: 180px;
  height: 180px;
  background: rgba(32, 228, 107, 0.08);
}
.ambient-glow.b {
  right: -40px;
  top: 60px;
  width: 220px;
  height: 220px;
  background: rgba(241, 138, 67, 0.12);
}
.ambient-glow.c {
  left: 20%;
  bottom: 120px;
  width: 240px;
  height: 240px;
  background: rgba(66, 120, 240, 0.08);
}

.orbit-concentric {
  position: absolute;
  inset: 0;
  opacity: 0.26;
  background: repeating-radial-gradient(circle at 50% 36%, transparent 0 26px, rgba(255, 255, 255, 0.035) 27px 28px);
  pointer-events: none;
}

/* 顶部导航栏 (适配状态栏 54px 高度) */
.app-header {
  position: absolute;
  top: var(--safe-top, 54px);
  left: 16px;
  right: 16px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 40;
}

.nav-round-btn {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  transition: transform 0.15s ease, background 0.15s ease;
}
.nav-round-btn:active {
  transform: scale(0.92);
  background: rgba(255, 255, 255, 0.22);
}

.header-title {
  text-align: center;
}
.header-title h1 {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.2px;
  line-height: 1.2;
}
.header-subtitle {
  font-size: 9.5px;
  color: rgba(255, 255, 255, 0.6);
  letter-spacing: 0.5px;
}

/* 更多操作弹层 */
.more-popover {
  position: absolute;
  top: 48px;
  right: 0;
  width: 148px;
  background: rgba(30, 36, 48, 0.94);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 14px;
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.4);
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  z-index: 50;
  animation: popoverIn 0.18s cubic-bezier(0.2, 0.8, 0.2, 1);
}
@keyframes popoverIn {
  from { opacity: 0; transform: translateY(-8px) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.popover-item {
  width: 100%;
  border: none;
  background: transparent;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 8px 10px;
  border-radius: 9px;
  font-size: 11px;
  cursor: pointer;
  text-align: left;
}
.popover-item:hover, .popover-item:active {
  background: rgba(255, 255, 255, 0.1);
}
.popover-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
  margin: 2px 4px;
}

/* 拓扑区域 */
.topology {
  position: absolute;
  inset: calc(var(--safe-top, 54px) + 48px) 0 280px;
  overflow: visible;
}

.topology-lines {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.line-pulse {
  animation: lineDash 18s linear infinite;
}
@keyframes lineDash {
  to { stroke-dashoffset: -120; }
}

/* 拓扑节点通用样式 */
.node {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  cursor: pointer;
  z-index: 10;
  transition: transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.node:active {
  transform: scale(0.94);
}

.node-circle {
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(18, 23, 33, 0.82);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.28);
  transition: box-shadow 0.25s ease, border-color 0.25s ease;
}

.node-label {
  display: block;
  font-size: 10.5px;
  font-weight: 500;
  color: #e4e7ee;
  margin-top: 8px;
  line-height: 1.25;
  white-space: nowrap;
}

/* 中心节点：手机 */
.central-node {
  left: 50%;
  top: 138px;
  transform: translateX(-50%);
  cursor: default;
}
.central-node:active {
  transform: translateX(-50%);
}
.central-circle {
  width: 98px;
  height: 98px;
  border-color: rgba(255, 255, 255, 0.22);
  box-shadow: 0 0 25px rgba(255, 255, 255, 0.1),
              0 0 0 16px rgba(255, 255, 255, 0.025),
              0 0 0 34px rgba(255, 255, 255, 0.012);
  animation: centralPulse 3.6s ease-in-out infinite;
}
@keyframes centralPulse {
  50% {
    box-shadow: 0 0 34px rgba(255, 255, 255, 0.16),
                0 0 0 20px rgba(255, 255, 255, 0.035),
                0 0 0 42px rgba(255, 255, 255, 0.018);
  }
}

.phone-shape {
  width: 29px;
  height: 52px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.6);
  background: linear-gradient(145deg, #f4f5f7, #8e939d);
  box-shadow: inset 0 0 0 1.5px rgba(0, 0, 0, 0.2);
  position: relative;
}
.phone-cam {
  position: absolute;
  top: 4px;
  left: 50%;
  transform: translateX(-50%);
  width: 3.5px;
  height: 3.5px;
  border-radius: 50%;
  background: #33363a;
}
.phone-speaker {
  position: absolute;
  top: 2px;
  left: 50%;
  transform: translateX(-50%);
  width: 8px;
  height: 1px;
  background: rgba(0, 0, 0, 0.4);
}

/* 节点 1：录音充电宝 (右上) */
.recorder-node {
  right: 22px;
  top: 48px;
}
.recorder-circle {
  width: 74px;
  height: 74px;
  border-right: 2.5px solid #f18a43;
  box-shadow: 0 0 18px rgba(241, 138, 67, 0.28);
}
.recorder-node.active .recorder-circle {
  border-color: #f18a43;
  box-shadow: 0 0 24px rgba(241, 138, 67, 0.5);
}
.recorder-node.recording-glow .recorder-circle {
  animation: recorderGlow 1.2s ease-in-out infinite;
}
@keyframes recorderGlow {
  50% {
    box-shadow: 0 0 0 8px rgba(241, 138, 67, 0.16),
                0 0 28px rgba(241, 138, 67, 0.6);
  }
}

.recorder-shape {
  width: 34px;
  height: 40px;
  border-radius: 8px;
  background: linear-gradient(145deg, #f0f2f5, #888d96);
  position: relative;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.4);
}
.mic-grill {
  position: absolute;
  top: 6px;
  left: 7px;
  right: 7px;
  height: 12px;
  background: radial-gradient(circle, #444 1px, transparent 1.6px);
  background-size: 4px 4px;
}
.recorder-led {
  position: absolute;
  bottom: 6px;
  right: 6px;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #66df96;
}
.recorder-led.led-red {
  background: #ff4942;
  box-shadow: 0 0 6px #ff4942;
}
.recorder-led.led-orange {
  background: #f18a43;
}

/* 节点 2：我的口袋打印机 (左上) */
.printer-node {
  left: 20px;
  top: 46px;
}
.printer-circle {
  width: 74px;
  height: 74px;
  border-right: 2.5px solid #20e46b;
  box-shadow: 0 0 18px rgba(32, 228, 107, 0.24);
}
.printer-node.active .printer-circle {
  border-color: #20e46b;
  box-shadow: 0 0 24px rgba(32, 228, 107, 0.45);
}

.printer-shape {
  width: 38px;
  height: 26px;
  border-radius: 7px;
  background: linear-gradient(145deg, #f4f5f8, #bdc1c7);
  position: relative;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.4);
}
.printer-photo-slip {
  position: absolute;
  top: -12px;
  left: 6px;
  width: 26px;
  height: 20px;
  border: 2px solid #ffffff;
  border-radius: 2px;
  background-size: cover;
  background-position: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.28);
}
.printer-led {
  position: absolute;
  bottom: 4px;
  right: 5px;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #20e46b;
}

/* 节点 3：OneLeap Watch (左下) */
.watch-node {
  left: 28px;
  top: 246px;
}
.watch-circle {
  width: 62px;
  height: 62px;
  border-color: rgba(255, 255, 255, 0.16);
}
.watch-node.active .watch-circle {
  border-color: #8cafef;
  box-shadow: 0 0 20px rgba(140, 175, 239, 0.4);
}
.watch-shape {
  width: 22px;
  height: 28px;
  border: 3.5px solid #d4d7dc;
  border-radius: 9px;
  background: #20242d;
  box-shadow: 0 -8px 0 -5px #d4d7dc, 0 8px 0 -5px #d4d7dc;
}

/* 节点 4：AI Audio Glasses (右下) */
.glasses-node {
  right: 28px;
  top: 246px;
  opacity: 0.65;
}
.glasses-circle {
  width: 62px;
  height: 62px;
  border-color: rgba(255, 255, 255, 0.12);
}
.glasses-node.active .glasses-circle {
  border-color: rgba(255, 255, 255, 0.35);
  box-shadow: 0 0 16px rgba(255, 255, 255, 0.2);
}
.glasses-shape {
  width: 32px;
  height: 13px;
  border: 3px solid #d4d7dc;
  border-radius: 7px;
  position: relative;
}
.glasses-shape::after {
  content: "";
  position: absolute;
  left: 9px;
  top: 2px;
  width: 8px;
  border-top: 2px solid #d4d7dc;
}

/* 连接状态胶囊 */
.connection-pill {
  position: absolute;
  left: 50%;
  bottom: 12px;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  font-weight: 500;
  color: #d8dbe4;
  background: rgba(15, 20, 30, 0.82);
  border: 1px solid rgba(255, 255, 255, 0.12);
  padding: 5px 12px;
  border-radius: 999px;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.25);
  white-space: nowrap;
}
.status-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #20e46b;
  box-shadow: 0 0 6px #20e46b;
}

/* 底部常驻帮助卡片 */
.help-card {
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: calc(var(--safe-bottom, 34px) + 8px);
  height: 108px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(22, 27, 38, 0.84);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  padding: 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.35);
  z-index: 20;
}
.close-help-btn {
  position: absolute;
  top: 10px;
  right: 12px;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: #8c93a0;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.help-content {
  flex: 1;
  padding-right: 12px;
}
.help-content strong {
  display: block;
  font-size: 13.5px;
  font-weight: 600;
  color: #fff;
}
.help-content small {
  display: block;
  margin-top: 6px;
  color: #9299a6;
  font-size: 10px;
  line-height: 1.4;
}
.help-diagram {
  position: relative;
  width: 82px;
  height: 54px;
  flex: none;
}
.diagram-dot {
  position: absolute;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #2e3444;
  border: 1px solid #4a5266;
}
.diagram-dot.dot-1 { left: 0; top: 18px; }
.diagram-dot.dot-2 { left: 30px; top: 0; }
.diagram-dot.dot-3 { right: 0; top: 22px; }
.diagram-line {
  position: absolute;
  height: 1px;
  background: #525a6e;
}
.diagram-line.line-1 {
  width: 32px;
  left: 14px;
  top: 20px;
  transform: rotate(-30deg);
}
.diagram-line.line-2 {
  width: 34px;
  left: 42px;
  top: 22px;
  transform: rotate(34deg);
}

/* 底部设备控制卡 (Device Panels) */
.device-panel {
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: calc(var(--safe-bottom, 34px) + 6px);
  padding: 18px;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(28, 33, 44, 0.88);
  backdrop-filter: blur(28px);
  -webkit-backdrop-filter: blur(28px);
  box-shadow: 0 20px 48px rgba(0, 0, 0, 0.4);
  z-index: 30;
}

.panel-close-btn {
  position: absolute;
  right: 14px;
  top: 14px;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  color: #c4c8d2;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.panel-close-btn:active {
  background: rgba(255, 255, 255, 0.18);
}

.device-title-area {
  text-align: center;
  margin-bottom: 15px;
}
.title-icon {
  margin: 0 auto 8px;
  transform: scale(0.9);
}
.device-title-area h2 {
  font-size: 16.5px;
  font-weight: 700;
  margin: 0;
  color: #fff;
}
.device-meta-row {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 7px;
  margin-top: 6px;
  font-size: 10px;
  color: #a2a7b4;
}
.power-text {
  color: #5edf9a;
  font-weight: 600;
}
.meta-divider {
  opacity: 0.5;
}

.battery-indicator {
  display: inline-block;
  width: 17px;
  height: 8.5px;
  border: 1px solid #8e94a0;
  border-radius: 2px;
  padding: 1px;
}
.battery-fill {
  display: block;
  height: 100%;
  border-radius: 1px;
  background: #20e46b;
}

/* 录音主动作大按钮 */
.main-record-btn {
  width: 100%;
  min-height: 48px;
  border: none;
  border-radius: 14px;
  background: #12d477;
  color: #052011;
  font-size: 13px;
  font-weight: 750;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: transform 0.15s ease, background 0.2s ease;
}
.main-record-btn:active {
  transform: scale(0.985);
}

.record-btn-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.record-state-icon {
  font-size: 13px;
}
.record-btn-right {
  font-size: 10px;
  color: rgba(0, 0, 0, 0.65);
}

.main-record-btn.is-active-recording {
  background: #242933;
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #fff;
}
.main-record-btn.is-active-recording .record-btn-right {
  color: #ff7d82;
  font-weight: 600;
}
.timer-counting {
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.3px;
}

/* 结束录音快捷按钮 */
.record-sub-actions {
  margin-top: 8px;
}
.stop-record-btn {
  width: 100%;
  height: 36px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.06);
  color: #d2d5dc;
  font-size: 11px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.stop-record-btn:active {
  background: rgba(255, 255, 255, 0.12);
}

/* 快捷控制行 */
.quick-row {
  width: 100%;
  min-height: 48px;
  margin-top: 9px;
  padding: 0 14px;
  border: none;
  border-radius: 13px;
  background: rgba(255, 255, 255, 0.065);
  display: flex;
  align-items: center;
  text-align: left;
  gap: 11px;
  color: inherit;
  cursor: pointer;
}
.row-icon {
  font-size: 15px;
  width: 22px;
  text-align: center;
  color: #f0f2f5;
}
.row-copy {
  flex: 1;
}
.row-copy b {
  display: block;
  font-size: 11.5px;
  font-weight: 600;
  color: #fff;
}
.row-copy small {
  display: block;
  font-size: 9px;
  color: #9ca1ad;
  margin-top: 2px;
}
.row-chevron {
  font-size: 18px;
  color: #cfd2da;
}

/* 开关控件 */
.switch-control {
  width: 42px;
  height: 24px;
  border: none;
  border-radius: 12px;
  background: #4e5360;
  padding: 2.5px;
  cursor: pointer;
  position: relative;
  transition: background 0.2s ease;
}
.switch-control::before {
  content: "";
  display: block;
  width: 19px;
  height: 19px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
  transition: transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.switch-control.active {
  background: #12d477;
}
.switch-control.active::before {
  transform: translateX(18px);
}

/* 口袋打印机主操作按钮 */
.only-action-btn {
  width: 100%;
  margin-top: 14px;
  border: none;
  border-radius: 13px;
  padding: 13px;
  background: #20e46b;
  color: #0b2a15;
  font-size: 13px;
  font-weight: 850;
  cursor: pointer;
  transition: transform 0.15s ease;
}
.only-action-btn:active {
  transform: scale(0.985);
}
.action-caption {
  margin: 9px 0 0;
  text-align: center;
  color: #888f98;
  font-size: 9.5px;
}

/* 拾音模式选择弹层 (Sheet) */
.sheet-modal-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(3, 6, 13, 0.6);
  z-index: 80;
  display: flex;
  align-items: flex-end;
  animation: fadeIn 0.2s ease;
}
.sheet-modal-content {
  width: 100%;
  border-radius: 24px 24px 0 0;
  background: #1e222a;
  padding: 12px 18px calc(var(--safe-bottom, 34px) + 16px);
  animation: sheetUp 0.24s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.sheet-handle {
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background: #4e525d;
  margin: 0 auto 14px;
}
.sheet-head-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.sheet-head-row h3 {
  font-size: 16px;
  font-weight: 700;
  margin: 0;
}
.sheet-close-icon {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 50%;
  background: #2e333d;
  color: #c4c7cf;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.mode-options-list {
  margin-top: 14px;
  border-radius: 14px;
  overflow: hidden;
}
.mode-option-btn {
  width: 100%;
  min-height: 58px;
  border: none;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  background: #272b35;
  padding: 0 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  text-align: left;
}
.mode-option-btn:first-child {
  border-top: none;
}
.mode-glyph {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: #343944;
  color: #d4d7de;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}
.mode-text-wrap {
  flex: 1;
}
.mode-text-wrap b {
  display: block;
  font-size: 12px;
  color: #fff;
}
.mode-text-wrap small {
  display: block;
  font-size: 9px;
  color: #989ea9;
  margin-top: 2px;
}
.mode-check-circle {
  width: 18px;
  height: 18px;
  border: 1.5px solid #5a606d;
  border-radius: 50%;
}
.mode-option-btn.active .mode-check-circle {
  border: 5px solid #12d477;
  background: #fff;
}
.mode-option-btn.active .mode-glyph {
  background: rgba(18, 212, 119, 0.16);
  color: #12d477;
}

/* 打印跳转全屏加载遮罩 */
.launch-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(12, 16, 24, 0.82);
  backdrop-filter: blur(22px);
  -webkit-backdrop-filter: blur(22px);
  z-index: 90;
  animation: fadeIn 0.22s ease;
}
.launch-modal-box {
  text-align: center;
  animation: popBox 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
}
@keyframes popBox {
  from { transform: scale(0.78); opacity: 0.2; }
  to { transform: scale(1); opacity: 1; }
}

.ai-mate-icon {
  width: 72px;
  height: 72px;
  margin: 0 auto 16px;
  border-radius: 22px;
  background: #f7f7f5;
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.4);
  position: relative;
}
.ai-eye {
  position: absolute;
  top: 24px;
  width: 7.5px;
  height: 7.5px;
  border-radius: 50%;
  background: #172332;
}
.ai-eye.left { left: 20px; }
.ai-eye.right { right: 20px; }
.ai-mouth {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  top: 44px;
  width: 26px;
  height: 6px;
  border-bottom: 3.5px solid #172332;
  border-radius: 50%;
}

.launch-modal-box strong {
  display: block;
  font-size: 16px;
  color: #fff;
}
.launch-modal-box p {
  margin: 6px 0 0;
  color: #9fa5af;
  font-size: 11px;
}

.launch-loader-track {
  width: 72px;
  height: 4px;
  margin: 18px auto 0;
  border-radius: 99px;
  background: #2e343d;
  overflow: hidden;
}
.launch-loader-bar {
  height: 100%;
  border-radius: inherit;
  background: #20e46b;
  transition: width 0.05s linear;
}

/* 浮层提示 Toast */
.oneleap-toast {
  position: absolute;
  left: 50%;
  bottom: calc(var(--safe-bottom, 34px) + 260px);
  transform: translateX(-50%);
  max-width: 82%;
  white-space: nowrap;
  padding: 8px 15px;
  border-radius: 12px;
  background: rgba(10, 14, 22, 0.88);
  border: 1px solid rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  color: #fff;
  font-size: 11px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
  z-index: 100;
  animation: toastPop 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
}
@keyframes toastPop {
  from { opacity: 0; transform: translate(-50%, 8px); }
  to { opacity: 1; transform: translate(-50%, 0); }
}

/* 动画过度 */
.slide-up-enter-active, .slide-up-leave-active {
  transition: transform 0.26s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.22s ease;
}
.slide-up-enter-from, .slide-up-leave-to {
  transform: translateY(24px);
  opacity: 0;
}

.panel-sheet-enter-active, .panel-sheet-leave-active {
  transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.24s ease;
}
.panel-sheet-enter-from, .panel-sheet-leave-to {
  transform: translateY(calc(100% + 18px));
  opacity: 0;
}

.toast-fade-enter-active, .toast-fade-leave-active {
  transition: opacity 0.18s ease;
}
.toast-fade-enter-from, .toast-fade-leave-to {
  opacity: 0;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes sheetUp {
  from { transform: translateY(60px); }
  to { transform: translateY(0); }
}
</style>
