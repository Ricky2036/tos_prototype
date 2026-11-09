<script setup>
import { ref } from 'vue'
import { usePhoneStore } from '../../../stores/phoneStore'

const phoneStore = usePhoneStore()
const emit = defineEmits(['scroll', 'openFlashCall', 'openDetail'])

// 侧滑操作状态：当前滑开操作栏的记录 ID
const swipedRowId = ref(null)

// 滑动手势检测
let touchStartX = 0
let touchStartY = 0
let isHorizontalDrag = false
let longPressTimer = null

function handleTouchStart(e, r) {
  if (e.touches?.length) {
    touchStartX = e.touches[0].clientX
    touchStartY = e.touches[0].clientY
    isHorizontalDrag = false

    // 长按手势检测（500ms 触发 Flash Call）
    clearTimeout(longPressTimer)
    longPressTimer = setTimeout(() => {
      phoneStore.flashCallTarget = r
    }, 550)
  }
}

function handleTouchMove(e, r) {
  if (!e.touches?.length) return
  const dx = e.touches[0].clientX - touchStartX
  const dy = e.touches[0].clientY - touchStartY

  // 如果有明显移动，取消长按
  if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
    clearTimeout(longPressTimer)
  }

  // 垂直移动：收起拨号盘
  if (Math.abs(dy) > Math.abs(dx)) {
    if (dy < -30 && phoneStore.isKeypadOpen) {
      phoneStore.isKeypadOpen = false
    }
    return
  }

  // 水平滑动判定
  if (Math.abs(dx) > 15) {
    isHorizontalDrag = true
    if (dx < -45) {
      // 向左滑开操作菜单
      swipedRowId.value = r.id
    } else if (dx > 45 && swipedRowId.value === r.id) {
      // 向右滑动收回
      swipedRowId.value = null
    }
  }
}

function handleTouchEnd(e, r) {
  clearTimeout(longPressTimer)
}

function handleItemClick(recent) {
  if (swipedRowId.value) {
    swipedRowId.value = null
    return
  }
  phoneStore.startCall(recent)
}

function handleInfoClick(e, recent) {
  e.stopPropagation()
  swipedRowId.value = null
  phoneStore.selectedRecent = recent
}

function handleLongPress(recent) {
  clearTimeout(longPressTimer)
  phoneStore.flashCallTarget = recent
}

function handleDeleteRecent(e, id) {
  e.stopPropagation()
  phoneStore.removeRecent(id)
  swipedRowId.value = null
}

function handleQuickCall(e, recent) {
  e.stopPropagation()
  phoneStore.startCall(recent)
  swipedRowId.value = null
}
</script>

<template>
  <div class="phone-recents-tab">
    <!-- 空状态提示 -->
    <div v-if="phoneStore.filteredRecents.length === 0" class="recents-empty-state">
      <div class="empty-icon-wrap">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
        </svg>
      </div>
      <div class="empty-text">
        {{ phoneStore.recentsFilter === 'missed' ? '暂无未接来电' : '暂无通话记录' }}
      </div>
    </div>

    <!-- 通话记录列表（支持滑动手势与折叠联动） -->
    <div v-else class="recents-list">
      <div
        v-for="r in phoneStore.filteredRecents"
        :key="r.id"
        class="recent-swipe-cell"
        :class="{ 'is-swiped': swipedRowId === r.id }"
        @touchstart.passive="handleTouchStart($event, r)"
        @touchmove.passive="handleTouchMove($event, r)"
        @touchend.passive="handleTouchEnd($event, r)"
      >
        <!-- 侧滑露出的操作底板（呼叫与删除） -->
        <div class="swipe-actions-bg">
          <button class="swipe-btn btn-call" title="呼叫" @click="handleQuickCall($event, r)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#FFFFFF">
              <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-2.2 2.2a15.047 15.047 0 01-6.59-6.59l2.2-2.21a.96.96 0 00.25-1.01A11.36 11.36 0 018.57 3.9c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.52c0-.55-.45-1-.99-1z" />
            </svg>
            <span class="swipe-label">呼叫</span>
          </button>
          <button class="swipe-btn btn-delete" title="删除" @click="handleDeleteRecent($event, r.id)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.2">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
            </svg>
            <span class="swipe-label">删除</span>
          </button>
        </div>

        <!-- 前景主要内容行 -->
        <div
          class="recent-row-content"
          @click="handleItemClick(r)"
          @contextmenu.prevent="handleLongPress(r)"
        >
          <!-- 通话方向/状态图标 -->
          <div class="call-type-icon">
            <!-- 呼入已接听：弧形灰箭头 -->
            <svg v-if="r.type === 'incoming'" width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M19 5L5 19M5 19H15M5 19V9" stroke="#8E8E93" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <!-- 未接来电：红色听筒加向下箭头 -->
            <svg v-else-if="r.type === 'missed'" width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" fill="#FF3B30" />
              <path d="M16 4L11 9M11 9H15M11 9V5" stroke="#FF3B30" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <!-- 拨出呼叫：右上绿箭头 -->
            <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M5 19L19 5M19 5H9M19 5V15" stroke="#10B981" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>

          <!-- 通话对象主体与归属地 -->
          <div class="call-info-col">
            <div class="primary-line" :class="{ 'text-missed': r.type === 'missed' }">
              {{ r.name || r.number }}
              <span v-if="r.count" class="call-count">({{ r.count }})</span>
            </div>
            <div class="secondary-line">
              <span v-if="r.hd" class="hd-badge">HD</span>
              <span class="location-tag">{{ r.tag }}</span>
            </div>
          </div>

          <!-- 时间与详情按钮 -->
          <div class="call-time-col">
            <span class="time-label">{{ r.time }}</span>
          </div>
          <button class="info-btn" title="查看通话详情" @click="handleInfoClick($event, r)">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#1C1C1E" stroke-width="1.8" />
              <path d="M12 11V17M12 7.5V8" stroke="#1C1C1E" stroke-width="2" stroke-linecap="round" />
            </svg>
          </button>
        </div>
      </div>

      <!-- 底部安全留白，确保不被悬浮底栏遮挡 -->
      <div class="bottom-safe-space"></div>
    </div>
  </div>
</template>

<style scoped>
.phone-recents-tab {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: calc(100% + 200px);
  background: #FFFFFF;
  margin-top: calc(var(--title-progress, 0) * 38px);
}

/* 空状态 */
.recents-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120px 20px;
}

.empty-icon-wrap {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: #F2F3F5;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 15px;
  color: #8E8E93;
}

/* 通话记录列表 */
.recents-list {
  padding: 4px 0 0;
  width: 100%;
}

.recent-swipe-cell {
  position: relative;
  width: 100%;
  overflow: hidden;
  background: #FFFFFF;
}

/* 侧滑底板 */
.swipe-actions-bg {
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  display: flex;
  width: 136px;
  z-index: 1;
}

.swipe-btn {
  flex: 1;
  border: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.swipe-btn:active {
  opacity: 0.85;
}

.btn-call {
  background: #00C853;
}

.btn-delete {
  background: #FF3B30;
}

.swipe-label {
  font-size: 11px;
  font-weight: 500;
  color: #FFFFFF;
}

/* 前景内容行（侧滑移动） */
.recent-row-content {
  position: relative;
  display: flex;
  align-items: center;
  padding: 13px 20px;
  background: #FFFFFF;
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.04);
  cursor: pointer;
  user-select: none;
  z-index: 2;
  transition: transform 0.22s cubic-bezier(0.25, 1, 0.5, 1), background-color 0.15s ease;
  will-change: transform;
}

.recent-swipe-cell.is-swiped .recent-row-content {
  transform: translateX(-136px);
}

.recent-row-content:active {
  background-color: rgba(0, 0, 0, 0.02);
}

.call-type-icon {
  width: 28px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex-shrink: 0;
}

.call-info-col {
  flex: 1;
  min-width: 0;
}

.primary-line {
  font-size: 16px;
  font-weight: 500;
  color: #1C1C1E;
  margin-bottom: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.primary-line.text-missed {
  color: #FF3B30;
}

.call-count {
  font-size: 14px;
  color: #8E8E93;
  margin-left: 4px;
}

.secondary-line {
  display: flex;
  align-items: center;
  gap: 6px;
}

.hd-badge {
  font-size: 9px;
  font-weight: 700;
  color: #8E8E93;
  border: 0.8px solid #C7C7CC;
  border-radius: 3px;
  padding: 0 3px;
  line-height: 13px;
}

.location-tag {
  font-size: 12px;
  color: #8E8E93;
}

.call-time-col {
  margin-left: 8px;
  margin-right: 12px;
  flex-shrink: 0;
}

.time-label {
  font-size: 13px;
  color: #8E8E93;
}

.info-btn {
  background: none;
  border: none;
  padding: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  border-radius: 50%;
  transition: background-color 0.15s ease;
}

.info-btn:active {
  background-color: rgba(0, 0, 0, 0.06);
}

.bottom-safe-space {
  height: 180px;
}
</style>
