<script setup>
import { ref, computed } from 'vue'
import GlassNavBar from '../../../ui/GlassNavBar.vue'
import ModeConditionCategoriesPage from './ModeConditionCategoriesPage.vue'

const props = defineProps({
  mode: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['back', 'save', 'show-toast'])

const activeSubView = ref('main') // 'main' | 'categories' | 'sleepSchedule'

const currentCondition = ref(
  props.mode.condition ? JSON.parse(JSON.stringify(props.mode.condition)) : null
)

// 针对不同预设模式的推荐条件
const recommendedCondition = computed(() => {
  switch (props.mode.id) {
    case 'sleep':
      return { type: 'sleep_schedule', title: '睡眠时间表', desc: '设置就寝时间与叫醒闹钟', value: '22:00 - 次日 07:00 (每天)' }
    case 'driving':
      return { type: 'bluetooth', title: '连接到车载蓝牙', desc: '车载系统或蓝牙连接', value: '车载蓝牙设备' }
    case 'work':
      return { type: 'time_period', title: '工作时间段', desc: '固定办公日程', value: '工作日 09:00 - 18:00' }
    case 'exercise':
      return { type: 'context', title: '运动健身', desc: '开始跑步或锻炼', value: '检测到运动锻炼' }
    case 'gaming':
      return { type: 'app', title: '打开游戏应用', desc: '启动游戏时自动开启', value: '检测到游戏启动' }
    default:
      return { type: 'time_period', title: '特定时间段', desc: '固定开启时间', value: '22:00 - 次日 07:00 (每天)' }
  }
})

// 睡眠时间表表单
const bedTime = ref('22:00')
const wakeTime = ref('07:00')

function handleAddSuggested() {
  if (props.mode.id === 'sleep') {
    activeSubView.value = 'sleepSchedule'
  } else {
    currentCondition.value = {
      type: recommendedCondition.value.type,
      title: recommendedCondition.value.title,
      value: recommendedCondition.value.value,
      enabled: true
    }
  }
}

function handleSaveSleepSchedule() {
  currentCondition.value = {
    type: 'sleep_schedule',
    title: '睡眠时间表',
    value: `${bedTime.value} - 次日 ${wakeTime.value} (工作日)`,
    enabled: true
  }
  activeSubView.value = 'main'
  emit('show-toast', '已更新睡眠时间表')
}

function handleRemoveCondition() {
  currentCondition.value = null
}

function handleSelectConditionFromCategories(cond) {
  currentCondition.value = cond
  activeSubView.value = 'main'
}

function handleDone() {
  emit('save', currentCondition.value)
}
</script>

<template>
  <div class="auto-turn-on-fullscreen-page">
    <template v-if="activeSubView === 'main'">
      <GlassNavBar overlay title="自动开启" @back="emit('back')" />

      <div class="page-scrollable-content">
        <!-- 大标题与说明文案 -->
        <div class="page-title-block">
          <h1 class="main-large-title">自动开启</h1>
          <p class="main-desc-note">选择此模式何时开启。</p>
        </div>

        <!-- 顶部当前条件状态卡片 -->
        <div v-if="!currentCondition" class="empty-state-card">
          无条件
        </div>

        <div v-else class="configured-cond-card">
          <div class="configured-cond-row">
            <div class="configured-text-group">
              <div class="configured-title">{{ currentCondition.title }}</div>
              <div class="configured-val">{{ currentCondition.value }}</div>
            </div>
            <button class="remove-minus-btn" title="移除" @click="handleRemoveCondition">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2.6" stroke-linecap="round">
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- 建议的条件 -->
        <div v-if="!currentCondition" class="section-label">建议的条件</div>
        <div v-if="!currentCondition" class="suggestions-card">
          <div class="suggestion-row" @click="handleAddSuggested">
            <div class="suggestion-info">
              <div class="suggestion-name">{{ recommendedCondition.title }}</div>
              <div class="suggestion-desc">{{ recommendedCondition.desc }}</div>
            </div>
            <button class="add-plus-btn" title="添加">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16A34A" stroke-width="2.4" stroke-linecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- 添加条件卡片 -->
        <div class="add-cond-entry-card" @click="activeSubView = 'categories'">
          <div class="entry-title">添加条件</div>
        </div>
      </div>

      <!-- 底部悬浮双态胶囊栏 -->
      <div class="bottom-capsule-bar">
        <button class="capsule-btn btn-cancel" @click="emit('back')">取消</button>
        <div class="capsule-divider"></div>
        <button class="capsule-btn btn-confirm" @click="handleDone">完成</button>
      </div>
    </template>

    <!-- 睡眠时间表配置子页 -->
    <template v-else-if="activeSubView === 'sleepSchedule'">
      <GlassNavBar overlay title="睡眠时间表" @back="activeSubView = 'main'" />

      <div class="page-scrollable-content">
        <div class="schedule-edit-card">
          <div class="schedule-field-row">
            <span class="field-label">就寝时间</span>
            <input v-model="bedTime" type="time" class="time-picker-input" />
          </div>
          <div class="field-divider"></div>
          <div class="schedule-field-row">
            <span class="field-label">叫醒时间</span>
            <input v-model="wakeTime" type="time" class="time-picker-input" />
          </div>
        </div>
      </div>

      <div class="bottom-capsule-bar">
        <button class="capsule-btn btn-cancel" @click="activeSubView = 'main'">取消</button>
        <div class="capsule-divider"></div>
        <button class="capsule-btn btn-confirm" @click="handleSaveSleepSchedule">保存</button>
      </div>
    </template>

    <!-- 条件全部分类全屏子页 -->
    <ModeConditionCategoriesPage
      v-else-if="activeSubView === 'categories'"
      @back="activeSubView = 'main'"
      @select="handleSelectConditionFromCategories"
    />
  </div>
</template>

<style scoped>
.auto-turn-on-fullscreen-page {
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

.configured-cond-card {
  background: #FFFFFF;
  border-radius: 24px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
  overflow: hidden;
  margin-bottom: 24px;
}

.configured-cond-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
}

.configured-text-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.configured-title {
  font-size: 16px;
  font-weight: 600;
  color: #18181B;
}

.configured-val {
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

.suggestion-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.suggestion-name {
  font-size: 16px;
  font-weight: 500;
  color: #18181B;
}

.suggestion-desc {
  font-size: 13px;
  color: #71717A;
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

.add-cond-entry-card {
  background: #FFFFFF;
  border-radius: 24px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
  padding: 18px 20px;
  cursor: pointer;
  transition: transform 0.15s ease;
}

.add-cond-entry-card:active {
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

.schedule-edit-card {
  background: #FFFFFF;
  border-radius: 24px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
  overflow: hidden;
  padding: 8px 16px;
}

.schedule-field-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 4px;
}

.field-label {
  font-size: 16px;
  font-weight: 500;
  color: #18181B;
}

.time-picker-input {
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  padding: 8px 12px;
  font-size: 16px;
  font-weight: 600;
  color: #18181B;
  background: #F4F5F7;
}

.field-divider {
  height: 1px;
  background: rgba(0, 0, 0, 0.05);
}
</style>
