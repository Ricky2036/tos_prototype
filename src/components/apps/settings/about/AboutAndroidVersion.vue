<script setup>
import { ref } from 'vue'
import { useDeviceStore } from '../../../../stores/deviceStore'
import ListCell from '../../../ui/ListCell.vue'

const emit = defineEmits(['back'])
const deviceStore = useDeviceStore()

// 彩蛋状态
const showEasterEgg = ref(false)
const tapCount = ref(0)
let tapTimer = null

function handleVersionTap() {
  tapCount.value++
  if (tapTimer) clearTimeout(tapTimer)
  tapTimer = setTimeout(() => {
    tapCount.value = 0
  }, 1200)

  if (tapCount.value >= 3) {
    showEasterEgg.value = true
    tapCount.value = 0
  }
}
</script>

<template>
  <div class="android-version-page">
    <!-- 顶部导航栏 -->
    <div class="sub-nav-bar">
      <button class="nav-round-btn" aria-label="返回" type="button" @click="emit('back')">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M19 12H5M5 12L12 5M5 12L12 19" stroke="#1C1C1E" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <div class="nav-title">Android 版本</div>
    </div>

    <!-- 滚动区域 -->
    <div class="sub-scroll-body scrollable">
      <!-- 头部 Android 17 官方徽标卡 -->
      <div class="android-hero-card" @click="handleVersionTap">
        <div class="badge-ring">
          <div class="badge-inner">
            <span class="badge-num">17</span>
          </div>
        </div>
        <div class="hero-title">Android 17</div>
        <div class="hero-sub">快速连续轻击可开启系统版本彩蛋</div>
      </div>

      <!-- 版本参数列表卡片 -->
      <div class="settings-card">
        <ListCell
          title="Android 版本"
          :value="deviceStore.androidVersion"
          clickable
          @click="handleVersionTap"
        />
        <ListCell
          title="Android 安全更新"
          :value="deviceStore.securityPatchDate"
        />
        <ListCell
          title="Google Play 系统更新"
          :value="deviceStore.googlePlayUpdateDate"
        />
        <ListCell
          title="基带版本"
          :value="deviceStore.basebandVersion"
        />
        <ListCell
          title="内核版本"
          :value="deviceStore.kernelVersion"
        />
        <ListCell
          title="内部版本号"
          :value="deviceStore.buildNumber"
          last
        />
      </div>

      <div class="scroll-bottom-spacer"></div>
    </div>

    <!-- Android 17 彩蛋弹层 -->
    <Transition name="egg-pop">
      <div v-if="showEasterEgg" class="easter-egg-mask" @click="showEasterEgg = false">
        <div class="egg-dial-wrap">
          <div class="egg-outer-ring">
            <div class="egg-sun-ray" v-for="n in 12" :key="n" :style="{ transform: `rotate(${(n - 1) * 30}deg)` }"></div>
          </div>
          <div class="egg-core">
            <span class="egg-brand">Android</span>
            <span class="egg-big-17">17</span>
            <span class="egg-tag">XOS Powered</span>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.android-version-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #F4F5F7;
  position: relative;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang SC", "Segoe UI", Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
}

.sub-nav-bar {
  position: sticky;
  top: 0;
  width: 100%;
  height: calc(var(--safe-top, 0px) + 52px);
  padding: var(--safe-top, 0px) 16px 0 16px;
  display: flex;
  align-items: center;
  background: #F4F5F7;
  z-index: 10;
  box-sizing: border-box;
}

.nav-round-btn {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: none;
  background: #EAECEF;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex: none;
  transition: background 0.15s ease, transform 0.1s ease;
}

.nav-round-btn:active {
  background: #DFE2E6;
  transform: scale(0.96);
}

.nav-title {
  font-size: 20px;
  font-weight: 600;
  color: #111111;
  letter-spacing: -0.3px;
  margin-left: 14px;
}

.sub-scroll-body {
  flex: 1;
  padding: 12px 16px 32px 16px;
  overflow-y: auto;
  overflow-x: hidden;
  box-sizing: border-box;
  -webkit-overflow-scrolling: touch;
}

/* 顶部徽标卡片 */
.android-hero-card {
  background: #FFFFFF;
  border-radius: 20px;
  padding: 28px 20px;
  margin-bottom: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(0, 0, 0, 0.04);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  cursor: pointer;
  user-select: none;
}

.badge-ring {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  background: linear-gradient(135deg, #34A853 0%, #0077FF 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  box-sizing: border-box;
  margin-bottom: 16px;
  box-shadow: 0 8px 20px rgba(0, 119, 255, 0.25);
  transition: transform 0.2s cubic-bezier(0.18, 0.89, 0.32, 1.25);
}

.android-hero-card:active .badge-ring {
  transform: scale(0.94);
}

.badge-inner {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
}

.badge-num {
  font-size: 38px;
  font-weight: 800;
  color: #111111;
  letter-spacing: -1px;
}

.hero-title {
  font-size: 20px;
  font-weight: 600;
  color: #111111;
  margin-bottom: 4px;
}

.hero-sub {
  font-size: 13px;
  color: #8E8E93;
}

.settings-card {
  background: #FFFFFF;
  border-radius: 20px;
  margin-bottom: 14px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.scroll-bottom-spacer {
  height: 48px;
}

.android-version-page :deep(.lc-right) {
  min-width: 0;
  flex: 1;
  justify-content: flex-end;
}

.android-version-page :deep(.lc-value) {
  font-size: 13.5px;
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 彩蛋弹层 */
.easter-egg-mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.egg-dial-wrap {
  width: 240px;
  height: 240px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: eggSpin 14s linear infinite;
}

@keyframes eggSpin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.egg-outer-ring {
  position: absolute;
  inset: 0;
}

.egg-sun-ray {
  position: absolute;
  top: 0;
  left: 50%;
  width: 4px;
  height: 18px;
  margin-left: -2px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 2px;
  transform-origin: center 120px;
}

.egg-core {
  width: 170px;
  height: 170px;
  border-radius: 50%;
  background: #FFFFFF;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
}

.egg-brand {
  font-size: 12px;
  font-weight: 600;
  color: #34A853;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.egg-big-17 {
  font-size: 68px;
  font-weight: 900;
  color: #111111;
  line-height: 1;
  letter-spacing: -2px;
}

.egg-tag {
  font-size: 11px;
  color: #8E8E93;
  margin-top: 2px;
}

.egg-pop-enter-active,
.egg-pop-leave-active {
  transition: opacity 0.25s ease, transform 0.25s cubic-bezier(0.18, 0.89, 0.32, 1.25);
}

.egg-pop-enter-from,
.egg-pop-leave-to {
  opacity: 0;
  transform: scale(0.85);
}
</style>
