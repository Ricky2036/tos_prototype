<script setup>
import { ref } from 'vue'
import ListCell from '../../ui/ListCell.vue'
import ToggleSwitch from '../../ui/ToggleSwitch.vue'

import heroIcon from '../../../assets/icons/accessibility/hero.webp'
import accessibilityIcon from '../../../assets/icons/accessibility/accessibility.webp'
import recordIcon from '../../../assets/icons/accessibility/record.webp'
import screenshotIcon from '../../../assets/icons/accessibility/screenshot.webp'
import gestureIcon from '../../../assets/icons/accessibility/gesture.webp'
import gripIcon from '../../../assets/icons/accessibility/grip.webp'
import floatWindowIcon from '../../../assets/icons/accessibility/float_window.webp'
import splitIcon from '../../../assets/icons/accessibility/split.webp'
import sidebarIcon from '../../../assets/icons/accessibility/sidebar.webp'
import outdoorIcon from '../../../assets/icons/accessibility/outdoor.webp'
import motionIcon from '../../../assets/icons/accessibility/motion.webp'
import gameIcon from '../../../assets/icons/accessibility/game.webp'
import mistouchIcon from '../../../assets/icons/accessibility/mistouch.webp'

const emit = defineEmits(['back', 'navigate'])

// 交互状态
const antiMistouch = ref(true)

// 浮层反馈提示
const toastText = ref('')
let toastTimer = null
function showToast(msg) {
  toastText.value = msg
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastText.value = ''
  }, 2200)
}

function handleItemTap(name) {
  showToast(`已进入${name}设置`)
}

function back() {
  emit('back')
  return true
}

defineExpose({ back })
</script>

<template>
  <div class="settings-accessibility-page">
    <!-- 顶部导航栏：左对齐大标题 -->
    <div class="accessibility-nav-bar">
      <button class="nav-round-btn" aria-label="返回" data-nav-back @click="emit('back')">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M19 12H5M5 12L12 5M5 12L12 19" stroke="#1C1C1E" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <div class="nav-title">辅助功能</div>
    </div>

    <!-- 滚动内容区 -->
    <div class="accessibility-scroll-body scrollable">
      <!-- 顶部特性大卡片：真机悬浮特色晶核徽标 -->
      <!-- 顶部特性大卡片：真机官方高保真晶核徽标 -->
      <div class="accessibility-hero-card">
        <div class="hero-icon-wrap">
          <img :src="heroIcon" class="hero-icon-img" alt="辅助功能" draggable="false" />
        </div>
        <div class="hero-title">辅助功能</div>
        <div class="hero-desc">
          通过视力、肢体活动能力、听力、语音和认知方面的辅助功能，使手机更贴合你的需求。
        </div>
      </div>

      <!-- 无障碍单项卡片 -->
      <div class="settings-card">
        <ListCell title="无障碍" chevron last @click="handleItemTap('无障碍')">
          <template #icon>
            <img :src="accessibilityIcon" class="cell-entry-icon" alt="无障碍" draggable="false" />
          </template>
        </ListCell>
      </div>

      <!-- 交互控制卡片组 -->
      <div class="settings-card">
        <!-- 录屏 -->
        <ListCell title="录屏" chevron @click="handleItemTap('录屏')">
          <template #icon>
            <img :src="recordIcon" class="cell-entry-icon" alt="录屏" draggable="false" />
          </template>
        </ListCell>

        <!-- 截屏 -->
        <ListCell title="截屏" chevron @click="handleItemTap('截屏')">
          <template #icon>
            <img :src="screenshotIcon" class="cell-entry-icon" alt="截屏" draggable="false" />
          </template>
        </ListCell>

        <!-- 动作与手势 -->
        <ListCell title="动作与手势" chevron @click="handleItemTap('动作与手势')">
          <template #icon>
            <img :src="gestureIcon" class="cell-entry-icon" alt="动作与手势" draggable="false" />
          </template>
        </ListCell>

        <!-- 智感握姿 -->
        <ListCell title="智感握姿" chevron last @click="handleItemTap('智感握姿')">
          <template #icon>
            <img :src="gripIcon" class="cell-entry-icon" alt="智感握姿" draggable="false" />
          </template>
        </ListCell>
      </div>

      <!-- 快捷多任务卡片组 -->
      <div class="settings-card">
        <!-- 小窗 -->
        <ListCell
          title="小窗"
          subtitle="便捷高效的全局应用浮窗。"
          chevron
          @click="handleItemTap('小窗')"
        >
          <template #icon>
            <img :src="floatWindowIcon" class="cell-entry-icon" alt="小窗" draggable="false" />
          </template>
        </ListCell>

        <!-- 应用分屏 -->
        <ListCell
          title="应用分屏"
          subtitle="屏幕内同时显示两个应用界面。"
          chevron
          @click="handleItemTap('应用分屏')"
        >
          <template #icon>
            <img :src="splitIcon" class="cell-entry-icon" alt="应用分屏" draggable="false" />
          </template>
        </ListCell>

        <!-- 智能侧边栏 -->
        <ListCell
          title="智能侧边栏"
          subtitle="访问多任务窗口与智能场景助手。"
          chevron
          last
          @click="handleItemTap('智能侧边栏')"
        >
          <template #icon>
            <img :src="sidebarIcon" class="cell-entry-icon" alt="智能侧边栏" draggable="false" />
          </template>
        </ListCell>
      </div>

      <!-- 场景与性能增强卡片组 -->
      <div class="settings-card">
        <!-- 户外增强 -->
        <ListCell
          title="户外增强"
          subtitle="户外使用时增强屏幕亮度、网络质量等。"
          chevron
          @click="handleItemTap('户外增强')"
        >
          <template #icon>
            <img :src="outdoorIcon" class="cell-entry-icon" alt="户外增强" draggable="false" />
          </template>
        </ListCell>

        <!-- 晕动舒缓显示 -->
        <ListCell
          title="晕动舒缓显示"
          subtitle="有助于缓解乘坐交通工具引起的晕动症，但可能会增加耗电与发热。"
          chevron
          @click="handleItemTap('晕动舒缓显示')"
        >
          <template #icon>
            <img :src="motionIcon" class="cell-entry-icon" alt="晕动舒缓显示" draggable="false" />
          </template>
        </ListCell>

        <!-- 游戏模式 -->
        <ListCell
          title="游戏模式"
          subtitle="提升游戏体验。"
          chevron
          last
          @click="handleItemTap('游戏模式')"
        >
          <template #icon>
            <img :src="gameIcon" class="cell-entry-icon" alt="游戏模式" draggable="false" />
          </template>
        </ListCell>
      </div>

      <!-- 防误触独立卡片 -->
      <div class="settings-card">
        <ListCell
          title="防误触模式"
          subtitle="手机在口袋中时防止误触。"
          last
        >
          <template #icon>
            <img :src="mistouchIcon" class="cell-entry-icon" alt="防误触模式" draggable="false" />
          </template>
          <template #right>
            <ToggleSwitch v-model="antiMistouch" />
          </template>
        </ListCell>
      </div>

      <!-- 你可能想找 -->
      <div class="relative-links-box">
        <div class="relative-title">你可能想找</div>
        <div class="relative-links">
          <button class="relative-link-btn" @click="handleItemTap('应用双开')">应用双开</button>
          <button class="relative-link-btn" @click="handleItemTap('防偷窥')">防偷窥</button>
          <button class="relative-link-btn" @click="handleItemTap('数字健康')">数字健康</button>
        </div>
      </div>

      <div class="bottom-spacer"></div>
    </div>

    <!-- 浮动提示 Toast -->
    <transition name="toast-fade">
      <div v-if="toastText" class="settings-toast">{{ toastText }}</div>
    </transition>
  </div>
</template>

<style scoped>
.settings-accessibility-page {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: var(--bg-subtle, #F2F2F7);
  color: #1C1C1E;
  overflow: hidden;
  user-select: none;
}

/* 导航栏：左对齐大标题 */
.accessibility-nav-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  height: calc(var(--safe-top, 0px) + 52px);
  padding: var(--safe-top, 0px) 16px 0 16px;
  background: #F2F2F7;
  flex-shrink: 0;
  z-index: 10;
}

.nav-round-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.05);
  border: none;
  outline: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s ease;
}

.nav-round-btn:active {
  background: rgba(0, 0, 0, 0.1);
}

.nav-title {
  font-size: 20px;
  font-weight: 600;
  color: #1C1C1E;
  letter-spacing: -0.3px;
}

/* 滚动区域 */
.accessibility-scroll-body {
  flex: 1;
  padding: 8px 16px 32px 16px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* 顶部大卡片 */
.accessibility-hero-card {
  background: #FFFFFF;
  border-radius: 20px;
  padding: 24px 20px 20px 20px;
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  border: 1px solid rgba(0, 0, 0, 0.03);
}

.hero-icon-wrap {
  width: 68px;
  height: 68px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 14px;
}

.hero-icon-img {
  width: 68px;
  height: 68px;
  object-fit: contain;
  display: block;
  user-select: none;
  pointer-events: none;
}

.hero-title {
  font-size: 19px;
  font-weight: 700;
  color: #1C1C1E;
  margin-bottom: 8px;
}

.hero-desc {
  font-size: 13px;
  line-height: 1.55;
  color: #8E8E93;
  max-width: 290px;
}

/* 设置卡片容器 */
.settings-card {
  background: #FFFFFF;
  border-radius: 16px;
  margin-bottom: 12px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.03);
}

.cell-entry-icon {
  width: 32px;
  height: 32px;
  object-fit: contain;
  display: block;
  flex: none;
  margin-right: 14px;
  user-select: none;
  pointer-events: none;
}

/* 你可能想找 */
.relative-links-box {
  background: #EAEAEF;
  border-radius: 16px;
  padding: 16px;
  margin-top: 8px;
  margin-bottom: 16px;
}

.relative-title {
  font-size: 13px;
  color: #8E8E93;
  font-weight: 500;
  margin-bottom: 10px;
}

.relative-links {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.relative-link-btn {
  background: none;
  border: none;
  padding: 0;
  font-size: 15px;
  font-weight: 500;
  color: #007AFF;
  text-align: left;
  cursor: pointer;
}

.relative-link-btn:active {
  opacity: 0.6;
}

.bottom-spacer {
  height: 24px;
}

/* Toast */
.settings-toast {
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(28, 28, 30, 0.88);
  color: #FFFFFF;
  padding: 8px 18px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  pointer-events: none;
  z-index: 100;
  white-space: nowrap;
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, 8px);
}
</style>
