<script setup>
import { ref } from 'vue'
import { useModesAndRoutinesStore } from '../../../../stores/modesAndRoutinesStore.js'
import { getIconPath } from './modeIcons.js'
import ToggleSwitch from '../../../ui/ToggleSwitch.vue'

const store = useModesAndRoutinesStore()

const emit = defineEmits(['open-routine', 'create-routine', 'show-toast'])

const showCueCard = ref(true)

function handleRoutineClick(routine) {
  emit('open-routine', routine.id)
}

function handleToggle(routine, e) {
  e.stopPropagation()
  store.toggleRoutine(routine.id)
}
</script>

<template>
  <div class="routines-tab-content">
    <!-- 快捷添加入口提示卡 -->
    <div v-if="showCueCard" class="cue-card">
      <div class="cue-body">
        通过将应用程序添加至您的主屏幕来快速访问您的所有日常程序。
      </div>
      <div class="cue-actions">
        <button class="cue-btn cue-btn-ghost" @click="showCueCard = false">
          现在不要
        </button>
        <button class="cue-btn cue-btn-primary" @click="emit('show-toast', '已添加日常程序至桌面')">
          添加
        </button>
      </div>
    </div>

    <!-- 空状态：当暂无日常程序时 -->
    <div v-if="store.routines.length === 0" class="empty-routines-container">
      <div class="empty-icon-wrap">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#A1A1AA" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      </div>
      <div class="empty-title">没有日常程序</div>
      <div class="empty-desc">创建日常程序可让您的生活更加方便。</div>
      <button class="create-empty-btn" @click="emit('create-routine')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
        <span>创建日常程序</span>
      </button>
    </div>

    <!-- 日常程序卡片列表 -->
    <div v-else class="routines-list">
      <div
        v-for="routine in store.routines"
        :key="routine.id"
        class="routine-card"
        :class="{ 'is-disabled': !routine.enabled }"
        @click="handleRoutineClick(routine)"
      >
        <div class="routine-icon-badge" :style="{ backgroundColor: routine.color }">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FFFFFF"
            stroke-width="2.1"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path :d="getIconPath(routine.iconKey)" />
          </svg>
        </div>

        <div class="routine-info">
          <div class="routine-name">{{ routine.name }}</div>
          <div class="routine-tags">
            <span v-if="routine.conditions && routine.conditions[0]" class="routine-tag tag-if">
              如果: {{ routine.conditions[0].title }}
            </span>
            <span v-if="routine.actions && routine.actions[0]" class="routine-tag tag-then">
              则: {{ routine.actions[0].title }}
            </span>
          </div>
        </div>

        <!-- 独立开关组件 -->
        <div class="routine-toggle-wrap" @click.stop>
          <ToggleSwitch
            :model-value="routine.enabled"
            color="blue"
            @update:model-value="store.toggleRoutine(routine.id)"
          />
        </div>
      </div>
    </div>

    <!-- 底部生态智能提示卡 -->
    <div class="smartthings-tip-card">
      <div class="tip-header">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1B64DA" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4M12 8h.01" />
        </svg>
        <span>提示</span>
      </div>
      <div class="tip-content">
        您可以在智能中枢或 AI Mate 中为您的智能家居设备联动设置日常程序。
      </div>
      <div class="tip-link" @click="emit('show-toast', '已关联智能中枢日常程序')">
        进入智能家居日常程序 &gt;
      </div>
    </div>
  </div>
</template>

<style scoped>
.routines-tab-content {
  padding: 0 16px calc(var(--home-indicator-inset, 14px) + 96px);
}

/* 提示卡片：四边微细边框，纯白底色 */
.cue-card {
  background: #FFFFFF;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 18px;
  padding: 16px 18px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
}

.cue-body {
  font-size: 14px;
  line-height: 1.45;
  color: #18181B;
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
  padding: 6px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.cue-btn:active {
  opacity: 0.7;
}

.cue-btn-ghost {
  color: #71717A;
}

.cue-btn-primary {
  color: #1B64DA;
}

/* 空状态 */
.empty-routines-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
}

.empty-icon-wrap {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: #FFFFFF;
  border: 1px solid rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
}

.empty-title {
  font-size: 18px;
  font-weight: 600;
  color: #18181B;
  margin-bottom: 6px;
}

.empty-desc {
  font-size: 14px;
  color: #71717A;
  margin-bottom: 24px;
}

.create-empty-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #1B64DA;
  color: #FFFFFF;
  border: none;
  border-radius: 9999px;
  padding: 10px 24px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(27, 100, 218, 0.25);
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.create-empty-btn:active {
  transform: scale(0.97);
  opacity: 0.85;
}

/* 日常程序卡片列表 */
.routines-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

.routine-card {
  display: flex;
  align-items: center;
  background: #FFFFFF;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 20px;
  padding: 14px 18px;
  cursor: pointer;
  transition: transform 0.15s ease, background 0.15s ease;
  user-select: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
}

.routine-card:active {
  transform: scale(0.985);
  background: #FAFAFA;
}

.routine-card.is-disabled {
  opacity: 0.65;
}

.routine-icon-badge {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  margin-right: 14px;
}

.routine-info {
  flex: 1;
  min-width: 0;
}

.routine-name {
  font-size: 16px;
  font-weight: 600;
  color: #18181B;
  margin-bottom: 4px;
}

.routine-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.routine-tag {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 6px;
}

.tag-if {
  color: #1B64DA;
  background: rgba(27, 100, 218, 0.08);
}

.tag-then {
  color: #059669;
  background: rgba(5, 150, 105, 0.08);
}

.routine-toggle-wrap {
  flex: none;
  margin-left: 10px;
}

/* 底部智能提示卡 */
.smartthings-tip-card {
  background: #FFFFFF;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 18px;
  padding: 16px 18px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
}

.tip-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #1B64DA;
  margin-bottom: 6px;
}

.tip-content {
  font-size: 13px;
  line-height: 1.45;
  color: #71717A;
  margin-bottom: 8px;
}

.tip-link {
  font-size: 13px;
  font-weight: 600;
  color: #1B64DA;
  cursor: pointer;
  display: inline-block;
}

.tip-link:active {
  opacity: 0.7;
}
</style>
