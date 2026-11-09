<script setup>
import GlassNavBar from '../../ui/GlassNavBar.vue'
import { ref } from 'vue'
import ListCell from '../../ui/ListCell.vue'
import Group3SubPage from './group3/Group3SubPage.vue'
import { useGroup3Nav } from './group3/useGroup3Nav.js'
import '../../../styles/layer-transitions.css'

const emit = defineEmits(['back', 'navigate'])
const {
  stack: g3Stack, current: g3Current, isBack: g3IsBack,
  open: openG3, close: closeG3, consumeBack: consumeG3Back, onNavigate: onG3Navigate
} = useGroup3Nav('appsManage')

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
  if (consumeG3Back()) return true
  emit('back')
  return true
}

defineExpose({ back })
</script>

<template>
  <div class="settings-apps-page">
    <!-- 顶部导航栏 -->
    <GlassNavBar overlay title="应用管理" @back="emit('back')" />

    <!-- 滚动区域 -->
    <div style="padding-top: var(--nav-h)" class="apps-scroll-body scrollable">
      <!-- 卡片组 1: 应用更新 -->
      <div class="apps-card">
        <ListCell title="应用更新" chevron last @click="openG3('appUpdate')"/>
      </div>

      <!-- 卡片组 2: 应用核心管理 (4项) -->
      <div class="apps-card">
        <ListCell title="应用列表" chevron @click="openG3('appList')"/>
        <ListCell title="系统应用恢复" chevron @click="openG3('appRestore')"/>
        <ListCell
          title="应用双开"
          subtitle="同时使用两个相同的应用。"
          chevron
          @click="openG3('appClone')"
        />
        <ListCell title="默认应用" chevron last @click="openG3('defaultApps')"/>
      </div>

      <!-- 卡片组 3: 辅助与媒体管理 (3项) -->
      <div class="apps-card">
        <ListCell title="屏幕使用时间" chevron @click="openG3('screenTime')"/>
        <ListCell title="联系人存储" chevron @click="openG3('contactsStorage')"/>
        <ListCell
          title="云端媒体设置"
          chevron
          last
          @click="openG3('cloudMedia')"
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
          <div class="recommend-link-item" @click="openG3('autoStart')">自启动管理</div>
          <div class="recommend-link-item" @click="openG3('appLock')">应用锁</div>
          <div class="recommend-link-item" @click="openG3('specialAppAccess')">特殊应用权限</div>
        </div>
      </div>

      <div class="bottom-spacer"></div>
    </div>

    <!-- 交互提示轻吐司 -->
    <Transition name="fade">
      <div v-if="toastText" class="apps-toast">{{ toastText }}</div>
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
