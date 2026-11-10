<script setup>
import { ref, computed } from 'vue'
import { useModesAndRoutinesStore } from '../../../../stores/modesAndRoutinesStore.js'
import { getIconPath } from './modeIcons.js'
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
    <!-- 顶部导航条 -->
    <div class="detail-nav-bar">
      <button class="nav-btn" @click="emit('back')">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m15 18-6-6 6-6"/>
        </svg>
      </button>

      <div class="nav-title">
        {{ isEditing ? '编辑日常程序' : routineName }}
      </div>

      <div class="nav-actions">
        <button
          v-if="!isEditing"
          class="nav-text-btn"
          @click="isEditing = true"
        >
          编辑
        </button>
        <div v-else class="nav-placeholder"></div>
      </div>
    </div>

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
            <button
              v-if="isEditing"
              class="remove-item-btn"
              @click="removeCondition(idx)"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>

          <!-- 添加条件按钮（编辑模式） -->
          <div
            v-if="isEditing"
            class="add-trigger-row"
            @click="showConditionPicker = true"
          >
            <div class="add-trigger-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </div>
            <span class="add-trigger-text">添加条件</span>
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
            <button
              v-if="isEditing"
              class="remove-item-btn"
              @click="removeAction(idx)"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>

          <!-- 添加动作按钮（编辑模式） -->
          <div
            v-if="isEditing"
            class="add-trigger-row"
            @click="showActionPicker = true"
          >
            <div class="add-trigger-icon add-action-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </div>
            <span class="add-trigger-text">添加动作</span>
          </div>
        </div>
      </div>

      <!-- 分组 3: 当日常程序结束时 -->
      <div class="logic-group">
        <div class="group-header-label">当日常程序结束时</div>
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

    <!-- 底部操作坞 -->
    <div class="routine-footer-dock">
      <!-- 查看模式下：编辑 / 分享 / 保存 -->
      <template v-if="!isEditing">
        <button class="dock-action-item" @click="isEditing = true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
          </svg>
          <span>编辑</span>
        </button>

        <button class="dock-action-item" @click="handleShare">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="18" cy="5" r="3"/>
            <circle cx="6" cy="12" r="3"/>
            <circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
          <span>分享</span>
        </button>

        <button class="dock-action-item dock-save-btn" @click="handleSave">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
            <polyline points="17 21 17 13 7 13 7 21"/>
            <polyline points="7 3 7 8 15 8"/>
          </svg>
          <span>保存</span>
        </button>
      </template>

      <!-- 编辑模式下：取消 / 保存 -->
      <template v-else>
        <button class="footer-btn btn-cancel" @click="isEditing = false">
          取消
        </button>
        <button class="footer-btn btn-save" @click="handleSave">
          保存
        </button>
      </template>
    </div>

    <!-- 条件拾取器模态页 -->
    <RoutineConditionPicker
      v-if="showConditionPicker"
      @close="showConditionPicker = false"
      @select="onConditionSelected"
    />

    <!-- 动作拾取器模态页 -->
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
  background: var(--color-bg-primary, #000000);
  z-index: 50;
  overflow: hidden;
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
  border-bottom: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
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
  color: var(--color-text-primary, #FFFFFF);
  border-radius: 50%;
  cursor: pointer;
}

.nav-text-btn {
  border: none;
  background: transparent;
  color: #3B82F6;
  font-size: 15px;
  font-weight: 600;
  padding: 8px 12px;
  cursor: pointer;
}

.nav-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--color-text-primary, #FFFFFF);
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
  padding: 20px 16px 100px;
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
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35);
}

.hero-name {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-text-primary, #FFFFFF);
  margin-bottom: 4px;
}

.hero-desc {
  font-size: 13px;
  color: var(--color-text-secondary, #8E8E93);
  max-width: 260px;
}

.edit-name-input {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  color: #FFFFFF;
  font-size: 17px;
  font-weight: 600;
  padding: 8px 16px;
  text-align: center;
  outline: none;
}

/* 逻辑卡片 */
.logic-group {
  margin-bottom: 20px;
}

.group-header-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary, #FFFFFF);
  margin-bottom: 8px;
  padding: 0 4px;
}

.logic-card {
  background: var(--color-card-bg, rgba(255, 255, 255, 0.05));
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
  border-radius: 16px;
  overflow: hidden;
}

.logic-item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
}

.logic-item-row.border-bottom {
  border-bottom: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.06));
}

.logic-item-info {
  flex: 1;
  min-width: 0;
}

.logic-item-title {
  font-size: 15px;
  font-weight: 500;
  color: var(--color-text-primary, #FFFFFF);
  margin-bottom: 2px;
}

.logic-item-value {
  font-size: 13px;
  color: var(--color-text-secondary, #8E8E93);
}

.remove-item-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: #EF4444;
  color: #FFFFFF;
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
  padding: 14px 16px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.add-trigger-row:active {
  background: rgba(255, 255, 255, 0.06);
}

.add-trigger-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(59, 130, 246, 0.15);
  color: #3B82F6;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
}

.add-action-icon {
  background: rgba(16, 185, 129, 0.15);
  color: #10B981;
}

.add-trigger-text {
  font-size: 15px;
  font-weight: 500;
  color: #3B82F6;
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
  background: rgba(18, 18, 20, 0.94);
  backdrop-filter: blur(20px);
  border-top: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
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
  color: var(--color-text-secondary, #A1A1AA);
  font-size: 11px;
  font-weight: 500;
  padding: 6px 16px;
  border-radius: 12px;
  cursor: pointer;
  transition: color 0.15s ease;
}

.dock-action-item:active {
  color: #FFFFFF;
}

.dock-save-btn {
  color: #3B82F6;
  font-weight: 600;
}

.footer-btn {
  flex: 1;
  height: 44px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}

.btn-cancel {
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.12));
  background: rgba(255, 255, 255, 0.06);
  color: var(--color-text-secondary, #A1A1AA);
}

.btn-save {
  border: none;
  background: #2563EB;
  color: #FFFFFF;
}
</style>
