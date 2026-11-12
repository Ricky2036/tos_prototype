<script setup>
import { computed, ref } from 'vue'
import { useModesAndRoutinesStore } from '../../../../stores/modesAndRoutinesStore.js'
import { getIconPath } from './modeIcons.js'
import GlassNavBar from '../../../ui/GlassNavBar.vue'
import ModeAutoTurnOnPage from './ModeAutoTurnOnPage.vue'
import ModeStayFocusedPage from './ModeStayFocusedPage.vue'
import ModeOtherActionsPage from './ModeOtherActionsPage.vue'
import ModeDurationModal from './ModeDurationModal.vue'
import ModeDeleteConfirmModal from './ModeDeleteConfirmModal.vue'

const props = defineProps({
  modeId: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['back', 'show-toast', 'delete-mode'])

const store = useModesAndRoutinesStore()

const currentMode = computed(() => {
  return store.getMode(props.modeId) || {}
})

const isActive = computed(() => {
  return store.activeModeId === props.modeId
})

const isScrolled = ref(false)
function onScroll(e) {
  isScrolled.value = e.target.scrollTop > 40
}

const showMoreMenu = ref(false)
const showAutoTurnOnPage = ref(false)
const showStayFocusedPage = ref(false)
const showOtherActionsPage = ref(false)
const showDurationModal = ref(false)
const showDeleteConfirm = ref(false)
const showSleepCue = ref(props.modeId === 'sleep')

const hasActiveSubpage = computed(() =>
  showAutoTurnOnPage.value || showStayFocusedPage.value || showOtherActionsPage.value
)

function handleToggleActive() {
  store.toggleMode(props.modeId)
  if (isActive.value) {
    emit('show-toast', `“${currentMode.value.name}”模式已开启`)
  } else {
    emit('show-toast', `“${currentMode.value.name}”模式已关闭`)
  }
}

function handleSaveCondition(cond) {
  showAutoTurnOnPage.value = false
  store.updateMode(props.modeId, { condition: cond })
  emit('show-toast', cond ? '已设置自动开启条件' : '已清除自动开启条件')
}

function handleSaveStayFocused(data) {
  showStayFocusedPage.value = false
  store.updateMode(props.modeId, { dnd: data.dnd, appLimits: data.appLimits })
  emit('show-toast', data.dnd?.enabled ? '已启用免打扰' : '已更新保持专注')
}

function handleSaveOtherActions(actions) {
  showOtherActionsPage.value = false
  store.updateMode(props.modeId, { settingsChanges: actions })
  emit('show-toast', '已更新其他动作')
}

function handleSelectDuration(dur) {
  showDurationModal.value = false
  store.updateMode(props.modeId, { duration: dur })
  emit('show-toast', `持续时间已设为：${dur}`)
}

function handleConfirmDelete() {
  showDeleteConfirm.value = false
  store.deleteMode(props.modeId)
  emit('delete-mode', props.modeId)
}
</script>

<template>
  <div class="mode-detail-page" @click="showMoreMenu = false">
    <!-- 主详情视图（当没有全屏二级子页时渲染） -->
    <template v-if="!hasActiveSubpage">
      <GlassNavBar
        overlay
        :title="isScrolled ? currentMode.name : ''"
        @back="emit('back')"
      >
        <template #right>
          <button
            class="mode-more-btn nav-round-btn"
            title="更多选项"
            @click.stop="showMoreMenu = !showMoreMenu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="1"/>
              <circle cx="12" cy="5" r="1"/>
              <circle cx="12" cy="19" r="1"/>
            </svg>
          </button>
        </template>
      </GlassNavBar>

      <!-- 更多选项弹出菜单 -->
      <div v-if="showMoreMenu" class="more-menu-popover" @click.stop>
        <div class="more-menu-item" @click="showDurationModal = true; showMoreMenu = false">
          持续时间
        </div>
        <div class="more-menu-item text-danger" @click="showDeleteConfirm = true; showMoreMenu = false">
          删除
        </div>
      </div>

      <!-- 滚动主体内容 -->
      <div class="detail-body-scrollable" @scroll="onScroll">
        <!-- 头部大图标与状态动作 -->
        <div class="hero-section">
          <div
            class="hero-icon-badge"
            :style="{ backgroundColor: currentMode.color || '#1B64DA' }"
          >
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#FFFFFF"
              stroke-width="2.2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path :d="getIconPath(currentMode.iconKey)" />
            </svg>
          </div>

          <h1 class="hero-title">{{ currentMode.name }}</h1>
          <p v-if="isActive" class="hero-active-subtitle">
            直到您将其关闭
          </p>
          <p v-else-if="currentMode.description" class="hero-desc">
            {{ currentMode.description }}
          </p>

          <!-- 主控开启/关闭胶囊按钮 -->
          <button
            class="hero-action-btn"
            :class="{ 'is-active': isActive }"
            @click="handleToggleActive"
          >
            {{ isActive ? '关闭' : '启用' }}
          </button>
        </div>

        <!-- 睡眠模式专属简易提示卡片 -->
        <div v-if="showSleepCue" class="cue-card">
          <div class="cue-body">
            使用简单的设置，了解睡眠模式的更多操作。
          </div>
          <div class="cue-actions">
            <button class="cue-btn cue-btn-ghost" @click="showSleepCue = false">
              现在不要
            </button>
            <button class="cue-btn cue-btn-primary" @click="showAutoTurnOnPage = true; showSleepCue = false">
              设置
            </button>
          </div>
        </div>

        <!-- 分组 0: 手动开启 -->
        <div class="detail-group">
          <div class="group-header">手动开启</div>
          <div class="group-card">
            <div class="cell-row" @click="showDurationModal = true">
              <div class="cell-main">
                <div class="cell-title">持续时间</div>
                <div class="cell-sub">{{ currentMode.duration || '直至您将其关闭' }}</div>
              </div>
              <div class="cell-chevron">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m9 18 6-6-6-6"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- 分组 1: 自动开启 -->
        <div class="detail-group">
          <div class="group-card">
            <div class="cell-row" @click="showAutoTurnOnPage = true">
              <div class="cell-main">
                <div class="cell-title">自动开启</div>
                <template v-if="currentMode.condition">
                  <div class="cell-sub">
                    {{ currentMode.condition.title }}: {{ currentMode.condition.value }}
                  </div>
                </template>
                <template v-else>
                  <div class="cell-sub empty-hint">
                    + 何时启动此模式
                  </div>
                </template>
              </div>
              <div class="cell-chevron">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m9 18 6-6-6-6"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- 分组 2: 选择此模式的功能 (保持专注) -->
        <div class="detail-group">
          <div class="group-header">选择此模式的功能</div>
          <div class="group-card">
            <div class="cell-row" @click="showStayFocusedPage = true">
              <div class="cell-main">
                <div class="cell-title">保持专注</div>
                <div v-if="currentMode.dnd?.enabled" class="cell-sub highlight-sub">
                  — 免打扰: 开 (允许: {{ currentMode.dnd.allowedContacts || '无人' }})
                </div>
                <div v-else-if="currentMode.appLimits?.enabled" class="cell-sub highlight-sub">
                  — 限制应用程序使用: 已启用
                </div>
                <div v-else class="cell-sub empty-hint">
                  + 避免干扰的方法
                </div>
              </div>
              <div class="cell-chevron">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m9 18 6-6-6-6"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- 分组 3: 更改外观 -->
        <div class="detail-group">
          <div class="group-header">更改外观</div>
          <div class="wallpaper-preview-grid">
            <div class="wallpaper-preview-card" @click="emit('show-toast', '已关联锁定屏幕外观')">
              <div class="wallpaper-mock lockscreen-mock">
                <div class="mock-clock">12:00</div>
                <div class="mock-dock-bar"></div>
              </div>
              <div class="wallpaper-card-label">锁定屏幕</div>
            </div>
            <div class="wallpaper-preview-card" @click="emit('show-toast', '已关联主屏幕外观')">
              <div class="wallpaper-mock homescreen-mock">
                <div class="mock-grid">
                  <span class="mock-dot"></span>
                  <span class="mock-dot"></span>
                  <span class="mock-dot"></span>
                  <span class="mock-dot"></span>
                </div>
              </div>
              <div class="wallpaper-card-label">主屏幕</div>
            </div>
          </div>
        </div>

        <!-- 分组 4: 其他动作 -->
        <div class="detail-group">
          <div class="group-card">
            <div class="cell-row" @click="showOtherActionsPage = true">
              <div class="cell-main">
                <div class="cell-title">其他动作</div>
                <div v-if="currentMode.settingsChanges && currentMode.settingsChanges.length > 0" class="actions-summary-col">
                  <div
                    v-for="act in currentMode.settingsChanges"
                    :key="act.key"
                    class="action-summary-row"
                  >
                    <span class="action-summary-label">{{ act.label }}</span>
                    <span class="action-summary-val">{{ act.value }}</span>
                  </div>
                </div>
                <div v-else class="cell-sub empty-hint">
                  + 此模式的更多操作
                </div>
              </div>
              <div class="cell-chevron">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m9 18 6-6-6-6"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 持续时间弹窗 -->
      <ModeDurationModal
        v-if="showDurationModal"
        :current-duration="currentMode.duration"
        @close="showDurationModal = false"
        @select="handleSelectDuration"
      />

      <!-- 删除确认弹窗 -->
      <ModeDeleteConfirmModal
        v-if="showDeleteConfirm"
        :mode-name="currentMode.name"
        @close="showDeleteConfirm = false"
        @confirm="handleConfirmDelete"
      />
    </template>

    <!-- 全屏二级子页：自动开启 -->
    <ModeAutoTurnOnPage
      v-if="showAutoTurnOnPage"
      :mode="currentMode"
      @back="showAutoTurnOnPage = false"
      @save="handleSaveCondition"
      @show-toast="emit('show-toast', $event)"
    />

    <!-- 全屏二级子页：保持专注 -->
    <ModeStayFocusedPage
      v-if="showStayFocusedPage"
      :initial-dnd="currentMode.dnd"
      :initial-app-limits="currentMode.appLimits"
      @back="showStayFocusedPage = false"
      @save="handleSaveStayFocused"
    />

    <!-- 全屏二级子页：其他动作 -->
    <ModeOtherActionsPage
      v-if="showOtherActionsPage"
      :initial-actions="currentMode.settingsChanges"
      @back="showOtherActionsPage = false"
      @save="handleSaveOtherActions"
    />
  </div>
</template>

<style scoped>
.mode-detail-page {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: #F4F5F7;
  color: #18181B;
  z-index: 50;
  overflow: hidden;
  user-select: none;
}

.nav-round-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: #18181B;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.nav-round-btn:active {
  background: rgba(0, 0, 0, 0.05);
}

.more-menu-popover {
  position: absolute;
  top: calc(var(--safe-top, 44px) + 48px);
  right: 14px;
  background: #FFFFFF;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 16px;
  padding: 6px;
  min-width: 140px;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.1);
  z-index: 80;
}

.more-menu-item {
  padding: 10px 14px;
  font-size: 15px;
  font-weight: 500;
  color: #18181B;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.more-menu-item:active {
  background: #F4F5F7;
}

.more-menu-item.text-danger {
  color: #EF4444;
}

.detail-body-scrollable {
  flex: 1;
  overflow-y: auto;
  padding: calc(var(--safe-top, 44px) + 54px) 16px calc(var(--home-indicator-inset, 14px) + 40px);
}

/* 顶部英雄区 */
.hero-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 16px 20px 24px;
}

.hero-icon-badge {
  width: 68px;
  height: 68px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 14px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.hero-title {
  font-size: 24px;
  font-weight: 700;
  color: #18181B;
  margin: 0 0 6px;
}

.hero-desc {
  font-size: 14px;
  color: #71717A;
  margin: 0 0 18px;
  max-width: 320px;
  line-height: 1.45;
}

.hero-active-subtitle {
  font-size: 14px;
  color: #1B64DA;
  font-weight: 600;
  margin: 0 0 18px;
}

.hero-action-btn {
  padding: 10px 32px;
  border-radius: 9999px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  background: #1B64DA;
  color: #FFFFFF;
  box-shadow: 0 4px 16px rgba(27, 100, 218, 0.25);
  transition: transform 0.15s ease, background 0.15s ease;
}

.hero-action-btn:active {
  transform: scale(0.96);
}

.hero-action-btn.is-active {
  background: #E4E4E7;
  color: #18181B;
  box-shadow: none;
}

/* 睡眠专属卡片 */
.cue-card {
  background: #FFFFFF;
  border-radius: 20px;
  padding: 16px 18px;
  margin-bottom: 20px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
}

.cue-body {
  font-size: 14px;
  color: #18181B;
  line-height: 1.45;
  margin-bottom: 12px;
}

.cue-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.cue-btn {
  border: none;
  background: transparent;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
}

.cue-btn-ghost {
  color: #71717A;
}

.cue-btn-primary {
  color: #1B64DA;
}

/* 详情分组卡片 */
.detail-group {
  margin-bottom: 18px;
}

.group-header {
  font-size: 13px;
  font-weight: 600;
  color: #71717A;
  margin: 0 4px 8px 4px;
}

.group-card {
  background: #FFFFFF;
  border-radius: 24px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
  overflow: hidden;
}

.cell-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px;
  cursor: pointer;
  background: #FFFFFF;
  transition: background-color 0.15s ease;
}

.cell-row:active {
  background-color: #F8F9FA;
}

.cell-main {
  flex: 1;
  min-width: 0;
}

.cell-title {
  font-size: 16px;
  font-weight: 600;
  color: #18181B;
  margin-bottom: 2px;
}

.cell-sub {
  font-size: 14px;
  color: #71717A;
}

.cell-sub.highlight-sub {
  color: #1B64DA;
  font-weight: 500;
}

.cell-sub.empty-hint {
  color: #71717A;
}

.cell-chevron {
  display: flex;
  align-items: center;
  color: #A1A1AA;
}

/* 外观预览卡片 */
.wallpaper-preview-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.wallpaper-preview-card {
  background: #FFFFFF;
  border-radius: 20px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  padding: 14px 12px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
  transition: transform 0.15s ease;
}

.wallpaper-preview-card:active {
  transform: scale(0.97);
}

.wallpaper-mock {
  width: 90px;
  height: 150px;
  border-radius: 12px;
  background: linear-gradient(135deg, #CBD5E1 0%, #94A3B8 100%);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  padding: 10px 6px;
  box-sizing: border-box;
  margin-bottom: 10px;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.3);
}

.mock-clock {
  font-size: 14px;
  font-weight: 700;
  color: #FFFFFF;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.mock-dock-bar {
  width: 50px;
  height: 6px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.5);
}

.mock-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-top: 30px;
}

.mock-dot {
  width: 14px;
  height: 14px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.6);
}

.wallpaper-card-label {
  font-size: 13px;
  font-weight: 600;
  color: #18181B;
}

.actions-summary-col {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.action-summary-row {
  display: flex;
  gap: 6px;
  font-size: 14px;
}

.action-summary-label {
  font-weight: 600;
  color: #18181B;
}

.action-summary-val {
  color: #1B64DA;
}
</style>
