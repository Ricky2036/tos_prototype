<script setup>
import { ref } from 'vue'
import { useModesAndRoutinesStore } from '../../../../stores/modesAndRoutinesStore.js'
import { getIconPath } from './modeIcons.js'
import GlassNavBar from '../../../ui/GlassNavBar.vue'
import RoutineConditionPicker from './RoutineConditionPicker.vue'
import RoutineActionPicker from './RoutineActionPicker.vue'

const props = defineProps({
  routineData: {
    type: Object,
    required: true
  },
  initialEditMode: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['back', 'saved', 'show-toast', 'open-share'])

const store = useModesAndRoutinesStore()

const isEditing = ref(props.initialEditMode)
const showConditionPicker = ref(false)
const showActionPicker = ref(false)

// 可编辑本地副本
const routineName = ref(props.routineData.name || '新建日常程序')
const routineDesc = ref(props.routineData.description || '满足您特定生活习惯的日常程序。')
const routineColor = ref(props.routineData.color || '#4F46E5')
const routineIcon = ref(props.routineData.iconKey || 'moon')
const conditions = ref(
  props.routineData.conditions ? JSON.parse(JSON.stringify(props.routineData.conditions)) : []
)
const actions = ref(
  props.routineData.actions ? JSON.parse(JSON.stringify(props.routineData.actions)) : []
)
const whenEnded = ref(
  props.routineData.whenEnded ? JSON.parse(JSON.stringify(props.routineData.whenEnded)) : [
    { id: 'end_restore', type: 'restore', title: '恢复设置', desc: '日常程序结束时返回运行前的状态' }
  ]
)

function removeCondition(idx) {
  conditions.value.splice(idx, 1)
}

function removeAction(idx) {
  actions.value.splice(idx, 1)
}

function onConditionSelected(cond) {
  conditions.value.push(cond)
  showConditionPicker.value = false
}

function onActionSelected(act) {
  actions.value.push(act)
  showActionPicker.value = false
}

function handleSave() {
  const payload = {
    id: props.routineData.id,
    name: routineName.value,
    description: routineDesc.value,
    color: routineColor.value,
    iconKey: routineIcon.value,
    conditions: conditions.value,
    actions: actions.value,
    whenEnded: whenEnded.value,
    enabled: true
  }

  store.addRoutine(payload)
  emit('show-toast', `日常程序“${payload.name}”已保存`)
  emit('saved', payload)
}

function handleShare() {
  emit('open-share', {
    title: routineName.value,
    text: routineDesc.value
  })
}
</script>

<template>
  <div class="routine-detail-page">
    <!-- 统一玻璃悬浮导航条 -->
    <GlassNavBar
      overlay
      :title="isEditing ? '编辑日常程序' : routineName"
      @back="emit('back')"
    >
      <template #right>
        <button
          v-if="!isEditing"
          class="nav-text-btn"
          @click="isEditing = true"
        >
          编辑
        </button>
      </template>
    </GlassNavBar>

    <!-- 滚动主体区 -->
    <div class="detail-scroll-body">
      <!-- 头部徽章与信息 -->
      <div class="routine-hero">
        <div class="routine-hero-badge" :style="{ backgroundColor: routineColor }">
          <svg
            width="34"
            height="34"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FFFFFF"
            stroke-width="2.2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path :d="getIconPath(routineIcon)" />
          </svg>
        </div>

        <div v-if="!isEditing" class="hero-info-view">
          <h1 class="hero-name">{{ routineName }}</h1>
          <p class="hero-desc">{{ routineDesc }}</p>
        </div>
        <div v-else class="hero-info-edit">
          <input
            v-model="routineName"
            type="text"
            class="edit-name-input"
            placeholder="日常程序名称"
          />
        </div>
      </div>

      <!-- 分组 1: 如果 (IF) -->
      <div class="logic-group">
        <div class="group-header-label">如果</div>
        <div class="logic-card">
          <div
            v-for="(cond, idx) in conditions"
            :key="cond.id || idx"
            class="logic-item-row"
            :class="{ 'border-bottom': idx !== conditions.length - 1 || isEditing }"
          >
            <div class="logic-item-info">
              <div class="logic-item-title">{{ cond.title }}</div>
              <div class="logic-item-value">{{ cond.value }}</div>
            </div>
            <button v-if="isEditing" class="remove-item-btn" @click="removeCondition(idx)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                <path d="M18 6 6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <div
            v-if="isEditing || conditions.length === 0"
            class="add-trigger-row"
            @click="showConditionPicker = true"
          >
            <div class="add-trigger-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round">
                <path d="M12 5v14M5 12h14"/>
              </svg>
            </div>
            <span class="add-trigger-text">添加此日常程序的触发条件</span>
          </div>
        </div>
      </div>

      <!-- 分组 2: 则 (THEN) -->
      <div class="logic-group">
        <div class="group-header-label">则</div>
        <div class="logic-card">
          <div
            v-for="(act, idx) in actions"
            :key="act.id || idx"
            class="logic-item-row"
            :class="{ 'border-bottom': idx !== actions.length - 1 || isEditing }"
          >
            <div class="logic-item-info">
              <div class="logic-item-title">{{ act.title }}</div>
              <div class="logic-item-value">{{ act.value }}</div>
            </div>
            <button v-if="isEditing" class="remove-item-btn" @click="removeAction(idx)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                <path d="M18 6 6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <div
            v-if="isEditing || actions.length === 0"
            class="add-trigger-row"
            @click="showActionPicker = true"
          >
            <div class="add-trigger-icon add-action-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round">
                <path d="M12 5v14M5 12h14"/>
              </svg>
            </div>
            <span class="add-trigger-text">添加此日常程序的操作</span>
          </div>
        </div>
      </div>

      <!-- 分组 3: 日常程序结束时 (WHEN ENDED) -->
      <div v-if="whenEnded && whenEnded.length > 0" class="logic-group">
        <div class="group-header-label">日常程序结束时</div>
        <div class="logic-card">
          <div
            v-for="(end, idx) in whenEnded"
            :key="end.id || idx"
            class="logic-item-row"
            :class="{ 'border-bottom': idx !== whenEnded.length - 1 }"
          >
            <div class="logic-item-info">
              <div class="logic-item-title">{{ end.title }}</div>
              <div class="logic-item-value">{{ end.desc }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部固定停靠操作条 -->
    <div class="routine-footer-dock">
      <template v-if="!isEditing">
        <button class="dock-action-item" @click="handleShare">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="18" cy="5" r="3"/>
            <circle cx="6" cy="12" r="3"/>
            <circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
          <span>分享</span>
        </button>

        <button class="dock-action-item dock-save-btn" @click="emit('show-toast', '已添加日常程序到桌面快捷方式')">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="2"/>
            <path d="M3 9h18"/>
            <path d="M9 21V9"/>
          </svg>
          <span>添加到主屏幕</span>
        </button>
      </template>

      <template v-else>
        <button class="footer-btn btn-cancel" @click="isEditing = false">
          取消
        </button>
        <button class="footer-btn btn-save" @click="handleSave">
          保存
        </button>
      </template>
    </div>

    <!-- 条件选择器弹层 -->
    <RoutineConditionPicker
      v-if="showConditionPicker"
      @close="showConditionPicker = false"
      @select="onConditionSelected"
    />

    <!-- 动作选择器弹层 -->
    <RoutineActionPicker
      v-if="showActionPicker"
      @close="showActionPicker = false"
      @select="onActionSelected"
    />
  </div>
</template>

<style scoped>
.routine-detail-page {
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

.detail-nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: var(--safe-top, 44px);
  height: calc(var(--safe-top, 44px) + 52px);
  padding-left: 8px;
  padding-right: 8px;
  flex: none;
  background: #F4F5F7;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  box-sizing: border-box;
}

.nav-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: #18181B;
  border-radius: 50%;
  cursor: pointer;
}

.nav-text-btn {
  border: none;
  background: transparent;
  color: #1B64DA;
  font-size: 15px;
  font-weight: 600;
  padding: 8px 12px;
  cursor: pointer;
}

.nav-title {
  font-size: 17px;
  font-weight: 600;
  color: #18181B;
}

.nav-actions {
  width: 50px;
  display: flex;
  justify-content: flex-end;
}

.nav-placeholder {
  width: 50px;
}

/* 滚动区 */
.detail-scroll-body {
  flex: 1;
  overflow-y: auto;
  padding: calc(var(--safe-top, 44px) + 54px) 16px 100px;
}

/* 头部 */
.routine-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 24px;
}

.routine-hero-badge {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 14px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
}

.hero-name {
  font-size: 20px;
  font-weight: 700;
  color: #18181B;
  margin-bottom: 4px;
}

.hero-desc {
  font-size: 13px;
  color: #71717A;
  max-width: 260px;
}

.edit-name-input {
  background: #FFFFFF;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  color: #18181B;
  font-size: 17px;
  font-weight: 600;
  padding: 8px 16px;
  text-align: center;
  outline: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
}

/* 逻辑卡片 */
.logic-group {
  margin-bottom: 20px;
}

.group-header-label {
  font-size: 14px;
  font-weight: 600;
  color: #18181B;
  margin-bottom: 8px;
  padding: 0 4px;
}

.logic-card {
  background: #FFFFFF;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
}

.logic-item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px;
}

.logic-item-row.border-bottom {
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.logic-item-info {
  flex: 1;
  min-width: 0;
}

.logic-item-title {
  font-size: 15px;
  font-weight: 600;
  color: #18181B;
  margin-bottom: 2px;
}

.logic-item-value {
  font-size: 13px;
  color: #71717A;
}

.remove-item-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: rgba(239, 68, 68, 0.12);
  color: #EF4444;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex: none;
  margin-left: 12px;
}

.add-trigger-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 18px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.add-trigger-row:active {
  background: #FAFAFA;
}

.add-trigger-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(27, 100, 218, 0.1);
  color: #1B64DA;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
}

.add-action-icon {
  background: rgba(5, 150, 105, 0.1);
  color: #059669;
}

.add-trigger-text {
  font-size: 15px;
  font-weight: 500;
  color: #1B64DA;
}

/* 底部操作坞 */
.routine-footer-dock {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: calc(64px + var(--home-indicator-inset, 14px));
  padding: 0 16px var(--home-indicator-inset, 14px);
  display: flex;
  align-items: center;
  justify-content: space-around;
  gap: 12px;
  background: #FFFFFF;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  box-sizing: border-box;
  z-index: 20;
}

.dock-action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  border: none;
  background: transparent;
  color: #71717A;
  font-size: 11px;
  font-weight: 500;
  padding: 6px 16px;
  border-radius: 12px;
  cursor: pointer;
  transition: color 0.15s ease;
}

.dock-action-item:active {
  color: #18181B;
}

.dock-save-btn {
  color: #1B64DA;
  font-weight: 600;
}

.footer-btn {
  flex: 1;
  height: 44px;
  border-radius: 9999px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}

.btn-cancel {
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: #F4F5F7;
  color: #71717A;
}

.btn-save {
  border: none;
  background: #1B64DA;
  color: #FFFFFF;
}
</style>
