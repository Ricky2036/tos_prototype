<script setup>
import { ref } from 'vue'
import GlassNavBar from '../../../ui/GlassNavBar.vue'
import ModeDndSubpage from './ModeDndSubpage.vue'
import ModeAppLimitsSubpage from './ModeAppLimitsSubpage.vue'

const props = defineProps({
  initialDnd: {
    type: Object,
    default: () => ({ enabled: false })
  },
  initialAppLimits: {
    type: Object,
    default: () => ({ enabled: false })
  }
})

const emit = defineEmits(['back', 'save'])

const activeSubView = ref('main') // 'main' | 'dnd' | 'appLimits'

const currentDnd = ref(props.initialDnd?.enabled ? { ...props.initialDnd } : null)
const currentAppLimits = ref(props.initialAppLimits?.enabled ? { ...props.initialAppLimits } : null)

function handleOpenDnd() {
  activeSubView.value = 'dnd'
}

function handleOpenAppLimits() {
  activeSubView.value = 'appLimits'
}

function handleSaveDnd(data) {
  currentDnd.value = data
  activeSubView.value = 'main'
}

function handleSaveAppLimits(data) {
  currentAppLimits.value = data
  activeSubView.value = 'main'
}

function handleRemoveDnd() {
  currentDnd.value = null
}

function handleRemoveAppLimits() {
  currentAppLimits.value = null
}

function handleDone() {
  emit('save', {
    dnd: currentDnd.value || { enabled: false },
    appLimits: currentAppLimits.value || { enabled: false }
  })
}
</script>

<template>
  <div class="mode-fullscreen-page">
    <!-- 主视图 -->
    <template v-if="activeSubView === 'main'">
      <GlassNavBar overlay title="保持专注" @back="emit('back')" />

      <div class="page-scrollable-content">
        <div class="page-title-block">
          <h1 class="main-large-title">保持专注</h1>
          <p class="main-desc-note">将在开启该模式时应用您选择的设置。</p>
        </div>

        <!-- 顶部已配置卡片（未添加时显示“没有操作”，添加后展示各项带红色删除按键） -->
        <div v-if="!currentDnd && !currentAppLimits" class="empty-state-card">
          没有操作
        </div>

        <div v-else class="configured-items-card">
          <div v-if="currentDnd" class="configured-row" @click="handleOpenDnd">
            <div class="configured-text-group">
              <div class="configured-name">免打扰</div>
              <div class="configured-sub">{{ currentDnd.summary || '开' }}</div>
            </div>
            <button class="remove-minus-btn" title="移除" @click.stop="handleRemoveDnd">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2.6" stroke-linecap="round">
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
          </div>

          <div v-if="currentAppLimits" class="configured-row" @click="handleOpenAppLimits">
            <div class="configured-text-group">
              <div class="configured-name">限制应用程序使用</div>
              <div class="configured-sub">{{ currentAppLimits.summary || '已启用' }}</div>
            </div>
            <button class="remove-minus-btn" title="移除" @click.stop="handleRemoveAppLimits">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2.6" stroke-linecap="round">
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- 建议的操作卡片组 -->
        <div v-if="!currentDnd || !currentAppLimits" class="section-label">建议的操作</div>
        <div v-if="!currentDnd || !currentAppLimits" class="suggestions-card">
          <div
            v-if="!currentDnd"
            class="suggestion-row"
            @click="handleOpenDnd"
          >
            <div class="suggestion-name">免打扰</div>
            <button class="add-plus-btn" title="添加">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16A34A" stroke-width="2.4" stroke-linecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
          </div>

          <div
            v-if="!currentAppLimits"
            class="suggestion-row"
            @click="handleOpenAppLimits"
          >
            <div class="suggestion-name">限制应用程序使用</div>
            <button class="add-plus-btn" title="添加">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16A34A" stroke-width="2.4" stroke-linecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- 底部悬浮双态胶囊栏 -->
      <div class="bottom-capsule-bar">
        <button class="capsule-btn btn-cancel" @click="emit('back')">取消</button>
        <div class="capsule-divider"></div>
        <button class="capsule-btn btn-confirm" @click="handleDone">完成</button>
      </div>
    </template>

    <!-- 免打扰设置全屏子页 -->
    <ModeDndSubpage
      v-else-if="activeSubView === 'dnd'"
      :initial-data="currentDnd"
      @back="activeSubView = 'main'"
      @save="handleSaveDnd"
    />

    <!-- 限制应用程序全屏子页 -->
    <ModeAppLimitsSubpage
      v-else-if="activeSubView === 'appLimits'"
      :initial-apps="currentAppLimits?.apps"
      @back="activeSubView = 'main'"
      @save="handleSaveAppLimits"
    />
  </div>
</template>

<style scoped>
.mode-fullscreen-page {
  position: absolute;
  inset: 0;
  background: #F4F5F7;
  color: #18181B;
  z-index: 55;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.page-scrollable-content {
  flex: 1;
  overflow-y: auto;
  padding: calc(var(--safe-top, 44px) + 64px) 20px calc(var(--home-indicator-inset, 14px) + 90px);
}

.page-title-block {
  margin-bottom: 24px;
}

.main-large-title {
  font-size: 28px;
  font-weight: 700;
  color: #18181B;
  margin: 0 0 8px;
}

.main-desc-note {
  font-size: 14px;
  color: #71717A;
  margin: 0;
  line-height: 1.5;
}

.empty-state-card {
  background: #FFFFFF;
  border-radius: 24px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  padding: 32px 20px;
  text-align: center;
  font-size: 16px;
  font-weight: 500;
  color: #71717A;
  margin-bottom: 28px;
}

.configured-items-card {
  background: #FFFFFF;
  border-radius: 20px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  overflow: hidden;
  margin-bottom: 28px;
}

.configured-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.configured-row:last-child {
  border-bottom: none;
}

.configured-row:active {
  background-color: rgba(0, 0, 0, 0.03);
}

.configured-text-group {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.configured-name {
  font-size: 16px;
  font-weight: 500;
  color: #18181B;
}

.configured-sub {
  font-size: 13.5px;
  color: #2563EB;
}

.remove-minus-btn {
  background: none;
  border: none;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 50%;
  transition: background-color 0.15s ease;
}

.remove-minus-btn:active {
  background-color: rgba(239, 68, 68, 0.1);
}

.section-label {
  font-size: 13.5px;
  font-weight: 600;
  color: #71717A;
  margin: 0 4px 10px;
}

.suggestions-card {
  background: #FFFFFF;
  border-radius: 20px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.suggestion-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.suggestion-row:last-child {
  border-bottom: none;
}

.suggestion-row:active {
  background-color: rgba(0, 0, 0, 0.03);
}

.suggestion-name {
  font-size: 16px;
  font-weight: 500;
  color: #18181B;
}

.add-plus-btn {
  background: none;
  border: none;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 50%;
  transition: background-color 0.15s ease;
}

.add-plus-btn:active {
  background-color: rgba(22, 163, 74, 0.1);
}

/* 底部悬浮双态胶囊栏 */
.bottom-capsule-bar {
  position: absolute;
  bottom: calc(var(--home-indicator-inset, 14px) + 16px);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-radius: 30px;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.06);
  padding: 4px;
  z-index: 65;
}

.capsule-btn {
  background: none;
  border: none;
  padding: 10px 24px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  border-radius: 24px;
  white-space: nowrap;
  transition: all 0.15s ease;
}

.btn-cancel {
  color: #71717A;
}

.btn-confirm {
  color: #1B64DA;
  font-weight: 600;
}

.capsule-btn:active {
  background-color: rgba(0, 0, 0, 0.06);
}

.capsule-divider {
  width: 1px;
  height: 18px;
  background: rgba(0, 0, 0, 0.08);
}
</style>
