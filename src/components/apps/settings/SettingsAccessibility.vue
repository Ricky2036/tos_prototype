<script setup>
import { ref } from 'vue'
import ListCell from '../../ui/ListCell.vue'
import ToggleSwitch from '../../ui/ToggleSwitch.vue'

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
    <!-- 顶部导航栏 -->
    <div class="accessibility-nav-bar">
      <button class="nav-round-btn" aria-label="返回" data-nav-back @click="emit('back')">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M19 12H5M5 12L12 5M5 12L12 19" stroke="#1C1C1E" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <div class="nav-title">辅助功能</div>
      <div class="nav-placeholder"></div>
    </div>

    <!-- 滚动内容区 -->
    <div class="accessibility-scroll-body scrollable">
      <!-- 顶部特性卡片 -->
      <div class="accessibility-hero-card">
        <div class="hero-icon-wrap">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
            <rect width="24" height="24" rx="6" fill="#3B82F6"/>
            <!-- 人形微标 -->
            <circle cx="12" cy="7" r="2.2" fill="#FFFFFF"/>
            <path d="M7 11.5C8.5 11 10.2 10.5 12 10.5C13.8 10.5 15.5 11 17 11.5M12 11V15M9.5 20L11.5 15H12.5L14.5 20" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="hero-title">辅助功能</div>
        <div class="hero-desc">
          通过视力、肢体活动能力、听力、语音和认知方面的辅助功能，使手机更贴合你的需求。
        </div>
      </div>

      <!-- 无障碍卡片 -->
      <div class="settings-card">
        <ListCell title="无障碍" chevron last @click="handleItemTap('无障碍')">
          <template #icon>
            <div class="squircle-icon bg-blue-access">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#FFFFFF" stroke-width="2"/>
                <circle cx="12" cy="7.5" r="1.8" fill="#FFFFFF"/>
                <path d="M7.5 11.5H16.5M12 11.5V16M9.5 20L12 16L14.5 20" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </template>
        </ListCell>
      </div>

      <!-- 交互控制卡片组 -->
      <div class="settings-card">
        <!-- 录屏 -->
        <ListCell title="录屏" chevron @click="handleItemTap('录屏')">
          <template #icon>
            <div class="squircle-icon bg-coral-record">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="6" width="13" height="12" rx="3" fill="#FFFFFF"/>
                <path d="M16 10L21 7V17L16 14V10Z" fill="#FFFFFF"/>
              </svg>
            </div>
          </template>
        </ListCell>

        <!-- 截屏 -->
        <ListCell title="截屏" chevron @click="handleItemTap('截屏')">
          <template #icon>
            <div class="squircle-icon bg-amber-crop">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M6 3V17C6 17.5523 6.44772 18 7 18H21M18 21V7C18 6.44772 17.5523 6 17 6H3" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </div>
          </template>
        </ListCell>

        <!-- 动作与手势 -->
        <ListCell title="动作与手势" chevron @click="handleItemTap('动作与手势')">
          <template #icon>
            <div class="squircle-icon bg-blue-gesture">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 11V4.5C12 3.67 11.33 3 10.5 3C9.67 3 9 3.67 9 4.5V13.5L7.2 11.7C6.6 11.1 5.6 11.1 5 11.7C4.4 12.3 4.4 13.3 5 13.9L9.5 18.4C10.7 19.6 12.3 20.3 14 20.3H16C18.8 20.3 21 18.1 21 15.3V11.5C21 10.7 20.3 10 19.5 10C18.7 10 18 10.7 18 11.5V11C18 10.2 17.3 9.5 16.5 9.5C15.7 9.5 15 10.2 15 11V10.5C15 9.7 14.3 9 13.5 9C12.7 9 12 9.7 12 10.5V11Z" fill="#FFFFFF"/>
              </svg>
            </div>
          </template>
        </ListCell>

        <!-- 智感握姿 -->
        <ListCell title="智感握姿" chevron last @click="handleItemTap('智感握姿')">
          <template #icon>
            <div class="squircle-icon bg-purple-grip">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect x="7" y="3" width="10" height="18" rx="2.5" stroke="#FFFFFF" stroke-width="2"/>
                <path d="M4 8H5M4 12H5M4 16H5M19 8H20M19 12H20M19 16H20" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </div>
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
            <div class="squircle-icon bg-pink-float">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="4" width="18" height="16" rx="3" stroke="#FFFFFF" stroke-width="2"/>
                <rect x="11" y="10" width="8" height="8" rx="2" fill="#FFFFFF"/>
              </svg>
            </div>
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
            <div class="squircle-icon bg-green-split">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect x="4" y="3" width="7" height="18" rx="2" fill="#FFFFFF"/>
                <rect x="13" y="3" width="7" height="18" rx="2" fill="#FFFFFF"/>
              </svg>
            </div>
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
            <div class="squircle-icon bg-indigo-sidebar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="4" width="18" height="16" rx="3" stroke="#FFFFFF" stroke-width="2"/>
                <line x1="16" y1="4" x2="16" y2="20" stroke="#FFFFFF" stroke-width="2"/>
              </svg>
            </div>
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
            <div class="squircle-icon bg-sky-outdoor">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M3 19L9 9L14 16L17 12L21 19H3Z" fill="#FFFFFF"/>
              </svg>
            </div>
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
            <div class="squircle-icon bg-royal-motion">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="7" cy="7" r="2" fill="#FFFFFF"/>
                <circle cx="12" cy="7" r="2" fill="#FFFFFF"/>
                <circle cx="17" cy="7" r="2" fill="#FFFFFF"/>
                <circle cx="7" cy="12" r="2" fill="#FFFFFF"/>
                <circle cx="12" cy="12" r="2" fill="#FFFFFF"/>
                <circle cx="17" cy="12" r="2" fill="#FFFFFF"/>
                <circle cx="7" cy="17" r="2" fill="#FFFFFF"/>
                <circle cx="12" cy="17" r="2" fill="#FFFFFF"/>
                <circle cx="17" cy="17" r="2" fill="#FFFFFF"/>
              </svg>
            </div>
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
            <div class="squircle-icon bg-mint-game">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="6" width="20" height="12" rx="4" fill="#FFFFFF"/>
                <path d="M7 10V14M5 12H9M15 12H15.01M17 10H17.01M17 14H17.01M19 12H19.01" stroke="#10B981" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </div>
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
            <div class="squircle-icon bg-coral-mistouch">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="#FFFFFF" stroke-width="2"/>
                <path d="M8 8L16 16M12 7V12M10 16H14" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </div>
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

      <!-- 底部安全间距 -->
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

/* 导航栏 */
.accessibility-nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
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
  font-size: 17px;
  font-weight: 600;
  color: #1C1C1E;
  letter-spacing: -0.2px;
}

.nav-placeholder {
  width: 36px;
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
  border-radius: 20px;
  background: #3B82F6;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 14px;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
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

/* 图标样式 */
.squircle-icon {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bg-blue-access { background: #3B82F6; }
.bg-coral-record { background: #EF4444; }
.bg-amber-crop { background: #F59E0B; }
.bg-blue-gesture { background: #2563EB; }
.bg-purple-grip { background: #8B5CF6; }

.bg-pink-float { background: #EC4899; }
.bg-green-split { background: #10B981; }
.bg-indigo-sidebar { background: #6366F1; }

.bg-sky-outdoor { background: #0EA5E9; }
.bg-royal-motion { background: #3B82F6; }
.bg-mint-game { background: #10B981; }
.bg-coral-mistouch { background: #F97316; }

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
