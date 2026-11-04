<script setup>
import { ref } from 'vue'
import ListCell from '../../ui/ListCell.vue'

const emit = defineEmits(['back', 'navigate'])

// 提示反馈
const toastText = ref('')
let toastTimer = null
function showToast(msg) {
  toastText.value = msg
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastText.value = ''
  }, 2200)
}

function back() {
  emit('back')
  return true
}

defineExpose({ back })
</script>

<template>
  <div class="settings-apps-page">
    <!-- 顶部导航栏 -->
    <div class="apps-nav-bar">
      <button class="nav-round-btn" aria-label="返回" data-nav-back @click="emit('back')">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M19 12H5M5 12L12 5M5 12L12 19" stroke="#1C1C1E" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <div class="nav-title">应用管理</div>
      <div class="nav-placeholder"></div>
    </div>

    <!-- 滚动区域 -->
    <div class="apps-scroll-body scrollable">
      <!-- 卡片组 1: 应用更新 -->
      <div class="apps-card">
        <ListCell title="应用更新" chevron last @click="showToast('所有系统与第三方应用均已是最新版本')"/>
      </div>

      <!-- 卡片组 2: 应用核心管理 (4项) -->
      <div class="apps-card">
        <ListCell title="应用列表" chevron @click="showToast('已加载 81 个应用，包含 32 个系统应用')"/>
        <ListCell title="系统应用恢复" chevron @click="showToast('未发现可恢复的已卸载系统内置应用')"/>
        <ListCell
          title="应用双开"
          subtitle="同时使用两个相同的应用。"
          chevron
          @click="showToast('支持微信、WhatsApp、Facebook 等应用双开分身')"
        />
        <ListCell title="默认应用" chevron last @click="showToast('当前默认桌面：tOS Launcher，默认浏览器：Chrome')"/>
      </div>

      <!-- 卡片组 3: 辅助与媒体管理 (3项) -->
      <div class="apps-card">
        <ListCell title="屏幕使用时间" chevron @click="showToast('今日屏幕使用时间：3小时42分钟')"/>
        <ListCell title="联系人存储" chevron @click="showToast('联系人账户同步正常，已存储 628 位联系人')"/>
        <ListCell
          title="云端媒体设置"
          chevron
          last
          @click="showToast('云端媒体提供方：Google 相册，自动备份已开启')"
        >
          <template #value>
            <span class="media-service-tag">Google 相册</span>
          </template>
        </ListCell>
      </div>

      <!-- 卡片组 4: 你可能想找 -->
      <div class="recommend-box">
        <div class="recommend-title">你可能想找</div>
        <div class="recommend-links">
          <div class="recommend-link-item" @click="showToast('进入自启动管理')">自启动管理</div>
          <div class="recommend-link-item" @click="showToast('进入应用锁配置')">应用锁</div>
          <div class="recommend-link-item" @click="showToast('管理悬浮窗与修改系统设置等特殊权限')">特殊应用权限</div>
        </div>
      </div>

      <div class="bottom-spacer"></div>
    </div>

    <!-- 交互提示轻吐司 -->
    <Transition name="fade">
      <div v-if="toastText" class="apps-toast">{{ toastText }}</div>
    </Transition>
  </div>
</template>

<style scoped>
.settings-apps-page {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: #F2F3F5;
  color: #1C1C1E;
  z-index: 10;
  overflow: hidden;
}

/* 顶部导航栏 */
.apps-nav-bar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: calc(var(--safe-top, 0px) + 52px);
  padding: var(--safe-top, 0px) 16px 0 16px;
  background: #F2F3F5;
}

.nav-round-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #FFFFFF;
  border: none;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: background 0.15s ease, transform 0.1s ease;
}

.nav-round-btn:active {
  background: #E5E5EA;
  transform: scale(0.95);
}

.nav-title {
  font-size: 19px;
  font-weight: 600;
  color: #1C1C1E;
  letter-spacing: -0.2px;
}

.nav-placeholder {
  width: 40px;
}

/* 滚动区域 */
.apps-scroll-body {
  flex: 1;
  padding: 12px 16px 24px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* 列表卡片 */
.apps-card {
  background: #FFFFFF;
  border-radius: 18px;
  border: 1px solid rgba(0, 0, 0, 0.03);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.02);
  margin-bottom: 14px;
  overflow: hidden;
}

.media-service-tag {
  font-size: 14px;
  color: #8E8E93;
  margin-right: 4px;
}

/* 你可能想找 */
.recommend-box {
  background: #F7F8FA;
  border-radius: 18px;
  padding: 18px 16px;
  margin-top: 6px;
  margin-bottom: 24px;
  border: 1px solid rgba(0, 0, 0, 0.03);
}

.recommend-title {
  font-size: 14px;
  color: #8E8E93;
  margin-bottom: 14px;
}

.recommend-links {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.recommend-link-item {
  font-size: 15px;
  font-weight: 500;
  color: #007AFF;
  cursor: pointer;
  user-select: none;
  width: fit-content;
}

.recommend-link-item:active {
  opacity: 0.7;
}

.bottom-spacer {
  height: 40px;
}

/* 轻吐司 */
.apps-toast {
  position: absolute;
  left: 50%;
  bottom: 60px;
  transform: translateX(-50%);
  background: rgba(30, 30, 30, 0.88);
  backdrop-filter: blur(20px);
  color: #FFFFFF;
  font-size: 14px;
  padding: 10px 20px;
  border-radius: 20px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  pointer-events: none;
  z-index: 100;
  white-space: nowrap;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translate(-50%, 8px);
}
</style>
