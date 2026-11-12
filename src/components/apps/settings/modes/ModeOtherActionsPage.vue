<script setup>
import { ref } from 'vue'
import GlassNavBar from '../../../ui/GlassNavBar.vue'
import ModeActionCategoriesPage from './ModeActionCategoriesPage.vue'
import SheetOptionPicker from './SheetOptionPicker.vue'

const props = defineProps({
  initialActions: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['back', 'save'])

const activeSubView = ref('main') // 'main' | 'categories'

const currentActions = ref(
  props.initialActions ? JSON.parse(JSON.stringify(props.initialActions)) : []
)

const SUGGESTED_ACTIONS = [
  { key: 'grayScale', label: '灰阶', defaultValue: '开', options: ['开', '关'] },
  { key: 'darkMode', label: '黑暗模式', defaultValue: '开', options: ['开', '关'] },
  { key: 'eyeCare', label: '护眼模式', defaultValue: '开', options: ['开', '关'] },
  { key: 'soundMode', label: '声音模式和音量', defaultValue: '静音', options: ['声音', '振动', '静音'] },
  { key: 'powerSaving', label: '省电模式', defaultValue: '开', options: ['开', '关'] },
  { key: 'aod', label: '息屏提醒', defaultValue: '已关闭', options: ['始终显示', '点击以显示', '定时显示', '已关闭'] }
]

const activeOptionPickerItem = ref(null)

function isActionAdded(key) {
  return currentActions.value.some((a) => a.key === key)
}

function handleAddSuggested(item) {
  if (isActionAdded(item.key)) return
  if (item.options && item.options.length > 0) {
    activeOptionPickerItem.value = item
  } else {
    currentActions.value.push({
      key: item.key,
      label: item.label,
      value: item.defaultValue,
      enabled: true
    })
  }
}

function handleConfirmPickerOption(val) {
  if (activeOptionPickerItem.value) {
    const item = activeOptionPickerItem.value
    const existingIdx = currentActions.value.findIndex((a) => a.key === item.key)
    if (existingIdx !== -1) {
      currentActions.value[existingIdx].value = val
    } else {
      currentActions.value.push({
        key: item.key,
        label: item.label,
        value: val,
        enabled: true
      })
    }
    activeOptionPickerItem.value = null
  }
}

function handleRemoveAction(idx) {
  currentActions.value.splice(idx, 1)
}

function handleAddCustomAction(action) {
  const existingIdx = currentActions.value.findIndex((a) => a.key === action.key)
  if (existingIdx !== -1) {
    currentActions.value[existingIdx] = action
  } else {
    currentActions.value.push(action)
  }
  activeSubView.value = 'main'
}

function handleDone() {
  emit('save', currentActions.value)
}
</script>

<template>
  <div class="other-actions-fullscreen-page">
    <template v-if="activeSubView === 'main'">
      <GlassNavBar overlay title="其他动作" @back="emit('back')" />

      <div class="actions-scrollable-content">
        <!-- 大标题与说明文案 -->
        <div class="page-title-block">
          <h1 class="main-large-title">其他动作</h1>
          <p class="main-desc-note">将在开启该模式时应用您选择的设置。</p>
        </div>

        <!-- 顶部已配置卡片 -->
        <div v-if="currentActions.length === 0" class="empty-state-card">
          没有操作
        </div>

        <div v-else class="configured-actions-card">
          <div
            v-for="(act, idx) in currentActions"
            :key="act.key || idx"
            class="configured-action-row"
            :class="{ 'has-divider': idx < currentActions.length - 1 }"
          >
            <div class="configured-text-group">
              <div class="configured-action-name">{{ act.label }}</div>
              <div class="configured-action-val">{{ act.value }}</div>
            </div>
            <button class="remove-minus-btn" title="移除" @click="handleRemoveAction(idx)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2.6" stroke-linecap="round">
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- 建议的操作 -->
        <div class="section-label">建议的操作</div>
        <div class="suggestions-card">
          <div
            v-for="(sug, idx) in SUGGESTED_ACTIONS"
            :key="sug.key"
            class="suggestion-row"
            :class="{ 'has-divider': idx < SUGGESTED_ACTIONS.length - 1 }"
            @click="handleAddSuggested(sug)"
          >
            <div class="suggestion-name">{{ sug.label }}</div>
            <button class="add-plus-btn" title="添加">
              <svg v-if="!isActionAdded(sug.key)" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16A34A" stroke-width="2.4" stroke-linecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16A34A" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- 添加动作入口卡片 -->
        <div class="add-action-entry-card" @click="activeSubView = 'categories'">
          <div class="entry-title">添加动作</div>
        </div>
      </div>

      <!-- 底部悬浮双态胶囊栏 -->
      <div class="bottom-capsule-bar">
        <button class="capsule-btn btn-cancel" @click="emit('back')">取消</button>
        <div class="capsule-divider"></div>
        <button class="capsule-btn btn-confirm" @click="handleDone">完成</button>
      </div>

      <!-- 建议项参数选项选择器 -->
      <SheetOptionPicker
        v-if="activeOptionPickerItem"
        :title="activeOptionPickerItem.label"
        :options="activeOptionPickerItem.options"
        :model-value="activeOptionPickerItem.defaultValue"
        @cancel="activeOptionPickerItem = null"
        @confirm="handleConfirmPickerOption"
      />
    </template>

    <!-- 全量动作分类全屏子页 -->
    <ModeActionCategoriesPage
      v-else-if="activeSubView === 'categories'"
      @back="activeSubView = 'main'"
      @add-action="handleAddCustomAction"
    />
  </div>
</template>

<style scoped>
.other-actions-fullscreen-page {
  position: absolute;
  inset: 0;
  background: #F4F5F7;
  color: #18181B;
  z-index: 55;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.actions-scrollable-content {
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
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
  height: 84px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #71717A;
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 24px;
}

.configured-actions-card {
  background: #FFFFFF;
  border-radius: 24px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
  overflow: hidden;
  margin-bottom: 24px;
}

.configured-action-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
}

.configured-action-row.has-divider {
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.configured-text-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.configured-action-name {
  font-size: 16px;
  font-weight: 600;
  color: #18181B;
}

.configured-action-val {
  font-size: 13px;
  color: #71717A;
}

.remove-minus-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: #FEE2E2;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.15s ease;
}

.remove-minus-btn:active {
  transform: scale(0.9);
}

.section-label {
  font-size: 14px;
  font-weight: 600;
  color: #71717A;
  margin: 0 4px 10px 4px;
}

.suggestions-card {
  background: #FFFFFF;
  border-radius: 24px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
  overflow: hidden;
  margin-bottom: 20px;
}

.suggestion-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  cursor: pointer;
  background: #FFFFFF;
  transition: background-color 0.15s ease;
}

.suggestion-row:active {
  background-color: #F8F9FA;
}

.suggestion-row.has-divider {
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.suggestion-name {
  font-size: 16px;
  font-weight: 500;
  color: #18181B;
}

.add-plus-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.add-action-entry-card {
  background: #FFFFFF;
  border-radius: 24px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
  padding: 18px 20px;
  cursor: pointer;
  transition: transform 0.15s ease;
}

.add-action-entry-card:active {
  transform: scale(0.985);
}

.entry-title {
  font-size: 16px;
  font-weight: 500;
  color: #18181B;
}

.bottom-capsule-bar {
  position: absolute;
  bottom: calc(var(--home-indicator-inset, 14px) + 16px);
  left: 50%;
  transform: translateX(-50%);
  background: #FFFFFF;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  padding: 6px 12px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12);
  border: 1px solid rgba(0, 0, 0, 0.06);
  z-index: 20;
}

.capsule-btn {
  background: transparent;
  border: none;
  padding: 8px 24px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  border-radius: 9999px;
  white-space: nowrap;
  transition: opacity 0.15s ease;
}

.capsule-btn:active {
  opacity: 0.6;
}

.btn-cancel {
  color: #18181B;
}

.btn-confirm {
  color: #1B64DA;
}

.capsule-divider {
  width: 1px;
  height: 16px;
  background: rgba(0, 0, 0, 0.1);
}
</style>
