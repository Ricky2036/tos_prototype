<script setup>
import GlassNavBar from '../../ui/GlassNavBar.vue'
import { ref } from 'vue'
import ListCell from '../../ui/ListCell.vue'
import ToggleSwitch from '../../ui/ToggleSwitch.vue'
import Group3SubPage from './group3/Group3SubPage.vue'
import { useGroup3Nav } from './group3/useGroup3Nav.js'
import '../../../styles/layer-transitions.css'

const emit = defineEmits(['back', 'navigate'])
const {
  stack: g3Stack, current: g3Current, isBack: g3IsBack,
  open: openG3, close: closeG3, consumeBack: consumeG3Back, onNavigate: onG3Navigate
} = useGroup3Nav('location')

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

// 主位置信息开关
const locationEnabled = ref(true)

function toggleLocation() {
  locationEnabled.value = !locationEnabled.value
  showToast(locationEnabled.value ? '已开启位置信息服务' : '已关闭位置信息服务')
}

function back() {
  if (consumeG3Back()) return true
  emit('back')
  return true
}

defineExpose({ back })
</script>

<template>
  <div class="settings-location-page">
    <!-- 顶部导航栏 -->
    <GlassNavBar overlay title="位置信息" @back="emit('back')" />

    <!-- 滚动区域 -->
    <div style="padding-top: var(--nav-h)" class="location-scroll-body scrollable">
      <!-- 主开关卡片 -->
      <div class="location-card">
        <ListCell title="使用位置信息" last>
          <template #value>
            <ToggleSwitch :model-value="locationEnabled" @update:model-value="toggleLocation" />
          </template>
        </ListCell>
      </div>

      <!-- 权限与服务卡片 -->
      <div class="location-card">
        <ListCell
          title="应用位置信息权限"
          subtitle="20 个应用（共 81 个应用）有权获取位置信息"
          chevron
          @click="openG3('locationPermission')"
        />
        <ListCell
          title="位置信息服务"
          chevron
          last
          @click="openG3('locationServices')"
        />
      </div>

      <!-- 近期位置信息访问 -->
      <div class="section-title">近期位置信息访问</div>
      <div class="location-card">
        <!-- Folax -->
        <ListCell
          title="Folax"
          subtitle="7分钟前"
          chevron
          @click="openG3('appLocationPermission')"
        >
          <template #icon>
            <div class="app-icon-squircle bg-folax">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="url(#folaxGrad)" stroke-width="2.5"/>
                <circle cx="12" cy="12" r="4" fill="#38BDF8"/>
                <defs>
                  <linearGradient id="folaxGrad" x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
                    <stop stop-color="#38BDF8"/>
                    <stop offset="0.5" stop-color="#818CF8"/>
                    <stop offset="1" stop-color="#F472B6"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </template>
        </ListCell>

        <!-- 天气 -->
        <ListCell
          title="天气"
          subtitle="64分钟前"
          chevron
          @click="openG3('appLocationPermission')"
        >
          <template #icon>
            <div class="app-icon-squircle bg-weather">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="9" cy="9" r="4" fill="#FDB813"/>
                <path d="M7 16a4 4 0 0 1-.5-7.97A5 5 0 0 1 16 7a4 4 0 0 1 3.9 3.1A3.5 3.5 0 0 1 18.5 17H7z" fill="#FFFFFF"/>
              </svg>
            </div>
          </template>
        </ListCell>

        <!-- Transsioner -->
        <ListCell
          title="Transsioner"
          subtitle="101分钟前"
          chevron
          @click="openG3('appLocationPermission')"
        >
          <template #icon>
            <div class="app-icon-squircle bg-transsioner">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="8" stroke="#34C759" stroke-width="2.5" stroke-dasharray="8 4"/>
                <circle cx="12" cy="12" r="3" fill="#007AFF"/>
              </svg>
            </div>
          </template>
        </ListCell>

        <!-- 查看全部 -->
        <ListCell
          title="查看全部"
          chevron
          last
          @click="openG3('recentLocation')"
        />
      </div>

      <div class="bottom-spacer"></div>
    </div>

    <!-- 交互提示轻吐司 -->
    <Transition name="fade">
      <div v-if="toastText" class="location-toast">{{ toastText }}</div>
    </Transition>
    <!-- 三级/四级页：统一层级转场 + 配置驱动渲染器 -->
    <Transition :name="g3IsBack ? 'slide-back' : 'slide'">
      <Group3SubPage
        v-if="g3Current"
        :key="`${g3Current.key}-${g3Stack.length}`"
        :page-key="g3Current.key"
        :title-override="g3Current.title"
        @back="closeG3"
        @navigate="onG3Navigate"
        @action="msg => showToast(`${msg} 已在原型中收录`)"
      />
    </Transition>
  </div>
</template>

<style scoped>
.settings-location-page {
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
.location-nav-bar {
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
.location-scroll-body {
  flex: 1;
  padding: 12px 16px 24px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* 列表卡片 */
.location-card {
  background: #FFFFFF;
  border-radius: 18px;
  border: 1px solid rgba(0, 0, 0, 0.03);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.02);
  margin-bottom: 14px;
  overflow: hidden;
}

/* 分组标题 */
.section-title {
  font-size: 14px;
  font-weight: 500;
  color: #8E8E93;
  margin: 16px 4px 10px 4px;
}

/* 应用图标容器 */
.app-icon-squircle {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex: none;
  margin-right: 14px;
}

.bg-folax {
  background: #F0F4FF;
}

.bg-weather {
  background: linear-gradient(135deg, #38BDF8, #0284C7);
}

.bg-transsioner {
  background: #F2F8F4;
}

.bottom-spacer {
  height: 40px;
}

/* 轻吐司 */
.location-toast {
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
