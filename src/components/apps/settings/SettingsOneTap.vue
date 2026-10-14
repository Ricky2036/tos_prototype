<script setup>
import { ref, computed } from 'vue'
import phoneBodyImg from '../../../assets/img/onetap/phone_body.webp'
import icMute from '../../../assets/img/onetap/ic_mute.webp'
import icCamera from '../../../assets/img/onetap/ic_camera.webp'
import icFlashlight from '../../../assets/img/onetap/ic_flashlight.webp'
import icFolax from '../../../assets/img/onetap/ic_folax.webp'
import icFlashNote from '../../../assets/img/onetap/ic_flash_note.webp'
import icDisturb from '../../../assets/img/onetap/ic_disturb.webp'
import icHealth from '../../../assets/img/onetap/ic_health.webp'
import icScreenRecord from '../../../assets/img/onetap/ic_screen_record.webp'
import icRecord from '../../../assets/img/onetap/ic_record.webp'
import icNote from '../../../assets/img/onetap/ic_note.webp'
import icTranslate from '../../../assets/img/onetap/ic_translate.webp'
import icShortcutApp from '../../../assets/img/onetap/ic_shortcut_app.webp'
import icCustom from '../../../assets/img/onetap/ic_custom.webp'
import icNone from '../../../assets/img/onetap/ic_none.webp'

const emit = defineEmits(['back', 'navigate'])

// 完整对齐真机 14 项功能模式（提取自真机 TranssionFlexButton 与界面 hierarchy）
const modes = [
  {
    id: 'mute',
    name: '静音',
    alias: '静音模式',
    icon: icMute,
    glowColor: 'rgba(240, 110, 30, 0.45)',
    buttonBg: 'linear-gradient(180deg, #FA9434 0%, #E36418 100%)',
    subtitles: ['长按静音'],
    actionBtn: null
  },
  {
    id: 'camera',
    name: '相机',
    icon: icCamera,
    glowColor: 'rgba(240, 190, 50, 0.45)',
    buttonBg: 'linear-gradient(180deg, #F3C34E 0%, #D89F2A 100%)',
    subtitles: ['长按打开相机'],
    actionBtn: null
  },
  {
    id: 'flashlight',
    name: '手电筒',
    icon: icFlashlight,
    glowColor: 'rgba(100, 130, 245, 0.45)',
    buttonBg: 'linear-gradient(180deg, #8DA4F8 0%, #6380F0 100%)',
    subtitles: ['长按打开手电筒'],
    actionBtn: null
  },
  {
    id: 'folax',
    name: 'Folax',
    icon: icFolax,
    glowColor: 'rgba(60, 180, 215, 0.45)',
    buttonBg: 'linear-gradient(180deg, #66D0E6 0%, #36A7C0 100%)',
    subtitles: ['长按唤醒Folax'],
    actionBtn: null
  },
  {
    id: 'flash_note',
    name: '一键闪记',
    icon: icFlashNote,
    glowColor: 'rgba(110, 135, 205, 0.45)',
    buttonBg: 'linear-gradient(180deg, #8AA1DE 0%, #6B82C4 100%)',
    subtitles: ['长按触发一键闪记'],
    actionBtn: null
  },
  {
    id: 'disturb',
    name: '勿扰',
    icon: icDisturb,
    glowColor: 'rgba(120, 105, 220, 0.45)',
    buttonBg: 'linear-gradient(180deg, #8B81E2 0%, #6C61CF 100%)',
    subtitles: ['长按打开勿扰'],
    actionBtn: null
  },
  {
    id: 'health',
    name: '健康',
    icon: icHealth,
    glowColor: 'rgba(235, 155, 40, 0.45)',
    buttonBg: 'linear-gradient(180deg, #F1AE3C 0%, #D48E22 100%)',
    subtitles: ['长按打开健康'],
    actionBtn: null
  },
  {
    id: 'screen_record',
    name: '屏幕录制',
    icon: icScreenRecord,
    glowColor: 'rgba(230, 80, 70, 0.45)',
    buttonBg: 'linear-gradient(180deg, #EC6058 0%, #D7433B 100%)',
    subtitles: ['长按打开屏幕录制'],
    actionBtn: null
  },
  {
    id: 'sound_record',
    name: '录音',
    icon: icRecord,
    glowColor: 'rgba(230, 70, 110, 0.45)',
    buttonBg: 'linear-gradient(180deg, #E65A84 0%, #CF3B6A 100%)',
    subtitles: ['长按打开录音'],
    actionBtn: null
  },
  {
    id: 'note',
    name: '笔记速记',
    icon: icNote,
    glowColor: 'rgba(235, 155, 45, 0.45)',
    buttonBg: 'linear-gradient(180deg, #EEAA44 0%, #D28F2A 100%)',
    subtitles: ['长按打开笔记速记'],
    actionBtn: null
  },
  {
    id: 'translate',
    name: '翻译',
    alias: '翻译助手',
    icon: icTranslate,
    glowColor: 'rgba(90, 150, 230, 0.45)',
    buttonBg: 'linear-gradient(180deg, #74A8EB 0%, #4D87D3 100%)',
    subtitles: ['长按打开翻译'],
    actionBtn: null
  },
  {
    id: 'shortcut_app',
    name: '快捷应用',
    icon: icShortcutApp,
    glowColor: 'rgba(50, 130, 245, 0.45)',
    buttonBg: 'linear-gradient(180deg, #5196F5 0%, #2E7CF0 100%)',
    subtitles: ['长按快启应用'],
    actionBtn: { text: '去设置', type: 'primary' }
  },
  {
    id: 'custom',
    name: '自定义',
    icon: icCustom,
    glowColor: 'rgba(125, 130, 235, 0.45)',
    buttonBg: 'linear-gradient(180deg, #9196EE 0%, #6E74DF 100%)',
    subtitles: ['长按静音', '单击唤起一键闪记', '双击打开手电筒'],
    actionBtn: { text: '去修改', type: 'secondary' }
  },
  {
    id: 'none',
    name: '无操作',
    icon: icNone,
    glowColor: 'transparent',
    buttonBg: 'linear-gradient(180deg, #828489 0%, #636569 100%)',
    subtitles: [],
    actionBtn: null
  }
]

// 默认激活项对齐真机为自定义 (索引 12)
const currentIndex = ref(12)
const activeModeId = ref('custom')

const currentMode = computed(() => modes[currentIndex.value])
const isCurrentActive = computed(() => currentMode.value.id === activeModeId.value)

// 左右相邻项（无循环循环溢出，端点处自然隐去）
const prevMode = computed(() => (currentIndex.value > 0 ? modes[currentIndex.value - 1] : null))
const nextMode = computed(() => (currentIndex.value < modes.length - 1 ? modes[currentIndex.value + 1] : null))

function goToPrev() {
  if (currentIndex.value > 0) {
    currentIndex.value--
  }
}

function goToNext() {
  if (currentIndex.value < modes.length - 1) {
    currentIndex.value++
  }
}

function goToIndex(idx) {
  if (idx >= 0 && idx < modes.length) {
    currentIndex.value = idx
  }
}

// 拖拽与跟手滑动手势
const dragX = ref(0)
const isDragging = ref(false)
let startClientX = 0
let startClientY = 0
let isHorizontalDrag = false

function onPointerDown(e) {
  startClientX = e.clientX
  startClientY = e.clientY
  isDragging.value = true
  isHorizontalDrag = false
  dragX.value = 0
}

function onPointerMove(e) {
  if (!isDragging.value) return
  const dx = e.clientX - startClientX
  const dy = e.clientY - startClientY

  if (!isHorizontalDrag) {
    if (Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(dy)) {
      isHorizontalDrag = true
    } else if (Math.abs(dy) > 10) {
      isDragging.value = false
      return
    }
  }

  if (isHorizontalDrag) {
    // 边界阻尼
    if (
      (currentIndex.value === 0 && dx > 0) ||
      (currentIndex.value === modes.length - 1 && dx < 0)
    ) {
      dragX.value = dx * 0.28
    } else {
      dragX.value = dx
    }
  }
}

function onPointerUp(e) {
  if (!isDragging.value) return
  isDragging.value = false

  const dx = dragX.value
  dragX.value = 0

  if (Math.abs(dx) > 42) {
    if (dx > 0 && currentIndex.value > 0) {
      currentIndex.value--
    } else if (dx < 0 && currentIndex.value < modes.length - 1) {
      currentIndex.value++
    }
  }
}

// Toast
const toastText = ref('')
let toastTimer = null
function showToast(msg) {
  toastText.value = msg
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastText.value = ''
  }, 2200)
}

function applyActive() {
  activeModeId.value = currentMode.value.id
  showToast(`已将 One-Tap 按键设定为「${currentMode.value.name}」`)
}

function handleActionBtn(action) {
  showToast(`已进入「${action.text}」配置`)
}

function back() {
  emit('back')
  return true
}

defineExpose({ back })
</script>

<template>
  <div class="onetap-page" aria-label="One-Tap Button">
    <!-- 顶部导航栏: One-Tap Button -->
    <div class="onetap-nav-bar" aria-label="One-Tap Button">
      <button class="nav-round-btn" aria-label="返回" data-nav-back @click="back">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M19 12H5M5 12L12 5M5 12L12 19" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>

    <!-- 主展示舞台：高精度手机侧边中框 + 真实物理按键与左右预告 -->
    <div
      class="onetap-stage"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    >
      <!-- 左侧预告图标 -->
      <button
        class="flank-icon-btn left-flank"
        :class="{ hidden: !prevMode }"
        aria-label="上一项"
        @click.stop="goToPrev"
      >
        <img
          v-if="prevMode"
          :src="prevMode.icon"
          class="flank-icon-img"
          alt=""
          draggable="false"
        />
      </button>

      <!-- 手机侧边金属中框整体（自带物理凹槽与上下自然渐隐） -->
      <div class="chassis-column phone-rail">
        <img
          :src="phoneBodyImg"
          class="chassis-bg-img"
          alt=""
          draggable="false"
        />

        <!-- 药丸按键发光与实体按键组（跟随拖拽平滑平移） -->
        <div
          class="button-capsule-wrap button-cavity"
          :style="{
            transform: `translate(calc(-50% + ${dragX}px), -50%)`,
            transition: isDragging ? 'none' : 'transform 0.36s cubic-bezier(0.22, 1, 0.36, 1)'
          }"
        >
          <!-- 径向光晕溢出 -->
          <div
            class="capsule-glow"
            :style="{ background: currentMode.glowColor }"
          ></div>

          <!-- 3D 实体按键跑道药丸 -->
          <div
            class="capsule-button active-capsule-button"
            :style="{ background: currentMode.buttonBg }"
          >
            <!-- 按键内层凸面微高光 -->
            <div class="capsule-specular"></div>

            <!-- 图标呈现 -->
            <img
              :src="currentMode.icon"
              class="capsule-icon-img"
              alt=""
              draggable="false"
            />
          </div>
        </div>
      </div>

      <!-- 右侧预告图标 -->
      <button
        class="flank-icon-btn right-flank"
        :class="{ hidden: !nextMode }"
        aria-label="下一项"
        @click.stop="goToNext"
      >
        <img
          v-if="nextMode"
          :src="nextMode.icon"
          class="flank-icon-img"
          alt=""
          draggable="false"
        />
      </button>
    </div>

    <!-- 模式说明与操作区域（高精度锁定固定高度，彻底杜绝切换时上下跳行） -->
    <div class="onetap-info-deck">
      <div class="mode-title-box">
        <span class="mode-title">{{ currentMode.name }}</span>
      </div>

      <!-- 固定 56px 高度容器，无论单行/三行/空行均不发生布局位移 -->
      <div class="mode-subtitles-box">
        <div
          v-for="(sub, idx) in currentMode.subtitles"
          :key="idx"
          class="mode-sub-line"
        >
          {{ sub }}
        </div>
      </div>

      <!-- 固定 38px 操作按钮插槽，无按钮时留空占位，保证下方指示点与底栏绝不位移 -->
      <div class="mode-action-slot">
        <button
          v-if="currentMode.actionBtn"
          class="action-pill-btn"
          :class="`btn-${currentMode.actionBtn.type}`"
          @click="handleActionBtn(currentMode.actionBtn)"
        >
          {{ currentMode.actionBtn.text }}
        </button>
      </div>
    </div>

    <!-- 底部控制栏：14 个页面指示点 + 设定/使用中按钮 -->
    <div class="onetap-bottom-bar">
      <!-- 14 项点阵指示器 -->
      <div class="dots-row pagination-dots">
        <button
          v-for="(m, idx) in modes"
          :key="m.id"
          class="dot-node"
          :class="{ active: idx === currentIndex }"
          :aria-label="m.name"
          @click="goToIndex(idx)"
        ></button>
      </div>

      <!-- 底部主操作按钮 -->
      <button
        class="apply-btn"
        :class="{ 'is-active': isCurrentActive }"
        :disabled="isCurrentActive"
        @click="applyActive"
      >
        {{ isCurrentActive ? '使用中' : '设定' }}
      </button>
    </div>

    <!-- 浮层 Toast -->
    <transition name="toast-fade">
      <div v-if="toastText" class="onetap-toast">
        {{ toastText }}
      </div>
    </transition>
  </div>
</template>

<style scoped>
.onetap-page {
  width: 100%;
  height: 100%;
  background: #000000;
  color: #FFFFFF;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  user-select: none;
  -webkit-user-select: none;
}

/* 顶部导航返回 */
.onetap-nav-bar {
  height: calc(var(--safe-top, 44px) + 52px);
  padding-top: var(--safe-top, 44px);
  display: flex;
  align-items: center;
  padding-left: 16px;
  padding-right: 16px;
  flex: none;
  z-index: 10;
  box-sizing: border-box;
}

.nav-round-btn {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s ease;
  touch-action: manipulation;
}

.nav-round-btn:active {
  background: rgba(255, 255, 255, 0.16);
}

/* 主展示舞台 */
.onetap-stage {
  flex: 1;
  min-height: 350px;
  max-height: 490px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: pan-y;
  cursor: grab;
}

.onetap-stage:active {
  cursor: grabbing;
}

/* 侧边预告图标 */
.flank-icon-btn {
  position: absolute;
  top: 49.6%;
  transform: translateY(-50%);
  width: 48px;
  height: 48px;
  background: none;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.35;
  transition: opacity 0.25s ease, transform 0.2s ease;
  cursor: pointer;
  z-index: 5;
  touch-action: manipulation;
}

.flank-icon-btn.left-flank {
  left: 22px;
}

.flank-icon-btn.right-flank {
  right: 22px;
}

.flank-icon-btn.hidden {
  opacity: 0;
  pointer-events: none;
}

.flank-icon-btn:active {
  opacity: 0.7;
  transform: translateY(-50%) scale(1.1);
}

.flank-icon-img {
  width: 34px;
  height: 34px;
  object-fit: contain;
  pointer-events: none;
  filter: brightness(0.9);
}

/* 手机侧边金属中框柱：添加上下平滑渐隐 Mask，彻底消除硬切边缘 */
.chassis-column {
  width: 216px;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%);
  mask-image: linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%);
}

.chassis-bg-img {
  width: 100%;
  height: 100%;
  object-fit: fill;
  display: block;
}

/* 实体药丸按键容器：精确对齐底图凹槽几何中心 (Y ≈ 49.6%) */
.button-capsule-wrap {
  position: absolute;
  left: 50%;
  top: 49.6%;
  width: 110px;
  height: 240px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 径向光晕 */
.capsule-glow {
  position: absolute;
  width: 180px;
  height: 320px;
  border-radius: 50%;
  filter: blur(32px);
  opacity: 0.85;
  pointer-events: none;
  transition: background 0.32s ease;
}

/* 3D 药丸按键本体 */
.capsule-button {
  width: 108px;
  height: 236px;
  border-radius: 54px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow:
    inset 0 1px 1.5px rgba(255, 255, 255, 0.45),
    inset 0 -1.5px 3px rgba(0, 0, 0, 0.4),
    0 2px 12px rgba(0, 0, 0, 0.55);
  transition: background 0.32s ease;
  overflow: hidden;
}

.capsule-specular {
  position: absolute;
  inset: 0;
  border-radius: 54px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0) 50%, rgba(0, 0, 0, 0.15) 100%);
  pointer-events: none;
}

.capsule-icon-img {
  width: 50px;
  height: 50px;
  object-fit: contain;
  position: relative;
  z-index: 2;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.25));
  pointer-events: none;
}

/* 模式说明甲板区（结构性锁定垂直高度，零跳变） */
.onetap-info-deck {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: none;
}

.mode-title-box {
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 6px;
}

.mode-title {
  font-size: 26px;
  font-weight: 600;
  color: #FFFFFF;
  letter-spacing: -0.3px;
}

.mode-subtitles-box {
  height: 56px;
  min-height: 56px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
}

.mode-sub-line {
  font-size: 14.5px;
  color: #8E8E93;
  line-height: 1.35;
  text-align: center;
  transition: opacity 0.2s ease;
}

/* 按钮占位插槽（高度恒定 38px） */
.mode-action-slot {
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 10px;
  margin-bottom: 12px;
}

.action-pill-btn {
  height: 32px;
  padding: 0 18px;
  border-radius: 16px;
  font-size: 13.5px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: transform 0.15s ease, opacity 0.15s ease;
  touch-action: manipulation;
}

.action-pill-btn.btn-primary {
  background: #2E7CF6;
  color: #FFFFFF;
}

.action-pill-btn.btn-secondary {
  background: #2C2C2E;
  color: #E5E5EA;
}

.action-pill-btn:active {
  transform: scale(0.96);
  opacity: 0.85;
}

/* 底部控制栏（指示点 + 设定按钮） */
.onetap-bottom-bar {
  width: 100%;
  padding: 0 20px 24px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: none;
}

.dots-row {
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  margin-bottom: 16px;
}

.dot-node {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  border: none;
  padding: 0;
  cursor: pointer;
  transition: background 0.25s ease, transform 0.25s ease;
  touch-action: manipulation;
}

.dot-node.active {
  background: #FFFFFF;
  transform: scale(1.3);
}

.apply-btn {
  width: 100%;
  height: 48px;
  border-radius: 24px;
  border: none;
  font-size: 16px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #242426;
  color: #FFFFFF;
  cursor: pointer;
  transition: background 0.2s ease, opacity 0.2s ease, transform 0.15s ease;
  touch-action: manipulation;
}

.apply-btn:not(.is-active):active {
  transform: scale(0.98);
  background: #333336;
}

.apply-btn.is-active {
  background: #242426;
  color: #737377;
  cursor: default;
}

/* Toast 提示 */
.onetap-toast {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(30, 30, 32, 0.94);
  color: #FFFFFF;
  padding: 10px 20px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  pointer-events: none;
  z-index: 100;
  text-align: center;
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, -42%);
}
</style>
