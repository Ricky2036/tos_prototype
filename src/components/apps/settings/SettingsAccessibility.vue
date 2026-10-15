<script setup>
import { ref } from 'vue'
import ListCell from '../../ui/ListCell.vue'
import LIcon from '../../ui/LIcon.vue'
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
      <!-- 顶部特性大卡片：标准无障碍关怀人形徽标 -->
      <div class="accessibility-hero-card">
        <div class="hero-icon-wrap">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="4.5" r="2.2" fill="#FFFFFF"/>
            <path d="M5.5 9C7.8 8.4 10 8.2 12 8.2C14 8.2 16.2 8.4 18.5 9" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round"/>
            <path d="M12 8.5V14.5M9.2 20.5L11.5 14.5H12.5L14.8 20.5" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="hero-title">辅助功能</div>
        <div class="hero-desc">
          通过视力、肢体活动能力、听力、语音和认知方面的辅助功能，使手机更贴合你的需求。
        </div>
      </div>

      <!-- 无障碍单项卡片：标准无障碍圆形徽标 -->
      <div class="settings-card">
        <ListCell title="无障碍" chevron last @click="handleItemTap('无障碍')">
          <template #icon>
            <div class="squircle-icon bg-blue-access">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9.2" stroke="#FFFFFF" stroke-width="1.6"/>
                <circle cx="12" cy="6.8" r="1.6" fill="#FFFFFF"/>
                <path d="M6.8 10.8C8.5 10.3 10.2 10.1 12 10.1C13.8 10.1 15.5 10.3 17.2 10.8" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round"/>
                <path d="M12 10.2V14.8M9.8 19L11.6 14.6H12.4L14.2 19" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
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
            <div class="squircle-icon bg-red-record">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="8.5" stroke="#FFFFFF" stroke-width="1.8"/>
                <circle cx="12" cy="12" r="4.2" fill="#FFFFFF"/>
              </svg>
            </div>
          </template>
        </ListCell>

        <!-- 截屏 -->
        <ListCell title="截屏" chevron @click="handleItemTap('截屏')">
          <template #icon>
            <div class="squircle-icon bg-amber-crop">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <rect x="4.5" y="3.5" width="15" height="17" rx="2.5" stroke="#FFFFFF" stroke-width="1.6"/>
                <path d="M8 7H6V9M16 7H18V9M8 17H6V15M16 17H18V15" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="12" cy="12" r="1.8" fill="#FFFFFF"/>
              </svg>
            </div>
          </template>
        </ListCell>

        <!-- 动作与手势 -->
        <ListCell title="动作与手势" chevron @click="handleItemTap('动作与手势')">
          <template #icon>
            <div class="squircle-icon bg-blue-gesture">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 4.2V12C12 11.3 11.4 10.8 10.7 10.8C10 10.8 9.5 11.3 9.5 12V13.8L8.1 12.6C7.5 12.1 6.6 12.2 6.1 12.8C5.6 13.4 5.7 14.3 6.3 14.8L10.2 18.5C11.1 19.4 12.3 20 13.6 20H15.2C17.6 20 19.5 18.1 19.5 15.7V12.5C19.5 11.8 18.9 11.2 18.2 11.2C17.7 11.2 17.2 11.5 17 12C16.8 11.4 16.3 11 15.6 11C15.1 11 14.7 11.3 14.4 11.7C14.2 11.2 13.7 10.8 13.1 10.8C12.5 10.8 12.1 11.1 12 11.5V4.2C12 3.5 11.4 3 10.7 3C10 3 9.5 3.5 9.5 4.2" fill="#FFFFFF"/>
                <path d="M14.5 3.2C16.8 4.2 18.5 6.2 19 8.5" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round"/>
              </svg>
            </div>
          </template>
        </ListCell>

        <!-- 智感握姿 -->
        <ListCell title="智感握姿" chevron last @click="handleItemTap('智感握姿')">
          <template #icon>
            <div class="squircle-icon bg-purple-grip">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <rect x="7.5" y="3.5" width="9" height="17" rx="2.5" stroke="#FFFFFF" stroke-width="1.6"/>
                <path d="M4.2 8C3.4 9.5 3.4 14.5 4.2 16M19.8 8C20.6 9.5 20.6 14.5 19.8 16" stroke="#FFFFFF" stroke-width="1.7" stroke-linecap="round"/>
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
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" stroke="#FFFFFF" stroke-width="1.6"/>
                <rect x="11" y="10" width="8.5" height="8.5" rx="2" fill="#FFFFFF"/>
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
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <rect x="3.5" y="3.5" width="17" height="17" rx="3" stroke="#FFFFFF" stroke-width="1.6"/>
                <line x1="12" y1="3.5" x2="12" y2="20.5" stroke="#FFFFFF" stroke-width="1.6"/>
                <rect x="5.5" y="6.5" width="4.5" height="2" rx="0.6" fill="#FFFFFF"/>
                <rect x="14" y="6.5" width="4.5" height="2" rx="0.6" fill="#FFFFFF"/>
                <rect x="5.5" y="10" width="3.5" height="1.5" rx="0.5" fill="#FFFFFF" fill-opacity="0.7"/>
                <rect x="14" y="10" width="3.5" height="1.5" rx="0.5" fill="#FFFFFF" fill-opacity="0.7"/>
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
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <rect x="3.5" y="4" width="17" height="16" rx="2.8" stroke="#FFFFFF" stroke-width="1.6"/>
                <line x1="15" y1="4" x2="15" y2="20" stroke="#FFFFFF" stroke-width="1.5"/>
                <rect x="16.8" y="9.5" width="2" height="5" rx="1" fill="#FFFFFF"/>
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
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="4.2" fill="#FFFFFF"/>
                <path d="M12 2.5V5M12 19V21.5M2.5 12H5M19 12H21.5M5.3 5.3L7.1 7.1M16.9 16.9L18.7 18.7M5.3 18.7L7.1 16.9M16.9 7.1L18.7 5.3" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round"/>
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
            <div class="squircle-icon bg-blue-access">
              <LIcon name="motionComfort" :size="20" />
            </div>
          </template>
        </ListCell>

        <!-- 游戏模式：全面复用现有真实游戏模式官方图标资产 -->
        <ListCell
          title="游戏模式"
          subtitle="提升游戏体验。"
          chevron
          last
          @click="handleItemTap('游戏模式')"
        >
          <template #icon>
            <img class="settings-entry-icon-img" src="/icons/games.png" alt="游戏模式" />
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
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M5.5 9.5V16.5C5.5 18.7 7.3 20.5 9.5 20.5H14.5C16.7 20.5 18.5 18.7 18.5 16.5V9.5H5.5Z" stroke="#FFFFFF" stroke-width="1.7" stroke-linejoin="round"/>
                <line x1="3.5" y1="9.5" x2="20.5" y2="9.5" stroke="#FFFFFF" stroke-width="1.7" stroke-linecap="round"/>
                <rect x="8.5" y="4" width="7" height="9" rx="1.5" fill="#FFFFFF"/>
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
  width: 64px;
  height: 64px;
  border-radius: 18px;
  background: #3898FC;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 14px;
  box-shadow: 0 4px 12px rgba(56, 152, 252, 0.25);
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

/* 圆形与圆角矩形图标基类 */
.circle-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  margin-right: 14px;
  color: #FFFFFF;
}

.squircle-icon {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  margin-right: 14px;
  color: #FFFFFF;
}

.settings-entry-icon-img {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  object-fit: contain;
  display: block;
  flex: none;
  margin-right: 14px;
}

.bg-blue-access { background: #1877F2; }
.bg-red-record { background: #F44336; }
.bg-amber-crop { background: #FF9800; }
.bg-blue-gesture { background: #2196F3; }
.bg-purple-grip { background: #5C6BC0; }
.bg-indigo-sidebar { background: #5E35B1; }
.bg-pink-float { background: #E91E63; }
.bg-green-split { background: #4CAF50; }
.bg-sky-outdoor { background: #03A9F4; }
.bg-coral-mistouch { background: #FF5722; }

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
