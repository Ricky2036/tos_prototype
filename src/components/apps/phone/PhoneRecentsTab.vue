<script setup>
import { ref, computed } from 'vue'
import { usePhoneStore } from '../../../stores/phoneStore'

const phoneStore = usePhoneStore()
const emit = defineEmits(['scroll', 'openFlashCall', 'openDetail', 'openAddContact'])

// 匹配的联系人（在输入号码时直接在下方以列表形式展示，1:1 对齐真机）
const matchingContacts = computed(() => {
  const raw = phoneStore.dialedNumber.replace(/\D/g, '')
  if (!raw) return []
  return phoneStore.contacts.filter(c => {
    const cleanNum = c.number.replace(/\D/g, '')
    const cleanPin = (c.pinyin || '').toLowerCase()
    return cleanNum.includes(raw) || cleanPin.includes(raw)
  })
})

function highlightMatch(num, query) {
  if (!query) return [{ text: num, matched: false }]
  const cleanQ = query.replace(/\D/g, '')
  if (!cleanQ) return [{ text: num, matched: false }]
  const cleanNum = num.replace(/\D/g, '')
  const idx = cleanNum.indexOf(cleanQ)
  if (idx === -1) return [{ text: num, matched: false }]
  let currentClean = 0
  let startCharIdx = -1
  let endCharIdx = -1
  for (let i = 0; i < num.length; i++) {
    if (/\d/.test(num[i])) {
      if (currentClean === idx && startCharIdx === -1) startCharIdx = i
      if (currentClean === idx + cleanQ.length - 1) {
        endCharIdx = i + 1
        break
      }
      currentClean++
    }
  }
  if (startCharIdx === -1 || endCharIdx === -1) return [{ text: num, matched: false }]
  return [
    { text: num.slice(0, startCharIdx), matched: false },
    { text: num.slice(startCharIdx, endCharIdx), matched: true },
    { text: num.slice(endCharIdx), matched: false }
  ]
}

function handleCreateContact() {
  emit('openAddContact', { number: phoneStore.dialedNumber })
}

function handleAddToExisting() {
  phoneStore.currentTab = 'contacts'
}

function handleSendMessage() {
  phoneStore.startCall({ name: '短信服务', number: phoneStore.dialedNumber })
}

// 跟手滑动状态管理（参考 NotificationCenter.vue 契约）
const swipeOffsets = ref({}) // recentId -> offset number
const activeSwipeId = ref(null)
const transitionRowId = ref(null)

let pointerStartX = 0
let pointerStartY = 0
let pointerInitialOffset = 0
let pointerId = null
let pointerTarget = null
let gestureDecided = false
let isSwiping = false
let lastSwipeEndTime = 0
let justSwipedId = null
let longPressTimer = null

function getRowContentStyle(id) {
  const offset = swipeOffsets.value[id] || 0
  return {
    transform: `translateX(${offset}px)`
  }
}

function getActionsStyle(id) {
  const offset = swipeOffsets.value[id] || 0
  const progress = Math.min(1, Math.max(0, -offset / 136))
  const tx = (1 - progress) * 36
  return {
    transform: `translateX(${tx}px)`
  }
}

function onRowPointerDown(e, r) {
  if (e.target.closest('.info-btn, .swipe-btn, button')) return

  activeSwipeId.value = r.id
  pointerStartX = e.clientX
  pointerStartY = e.clientY
  pointerInitialOffset = swipeOffsets.value[r.id] || 0
  gestureDecided = false
  isSwiping = false
  pointerId = e.pointerId
  pointerTarget = e.currentTarget

  clearTimeout(longPressTimer)
  longPressTimer = setTimeout(() => {
    if (!isSwiping) {
      phoneStore.flashCallTarget = r
    }
  }, 550)
}

function onRowPointerMove(e, r) {
  if (activeSwipeId.value !== r.id) return
  const dx = e.clientX - pointerStartX
  const dy = e.clientY - pointerStartY

  if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
    clearTimeout(longPressTimer)
  }

  if (!gestureDecided) {
    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
      gestureDecided = true
      if (Math.abs(dx) > Math.abs(dy)) {
        isSwiping = true
        try {
          pointerTarget?.setPointerCapture(pointerId)
        } catch (_) {}
      } else {
        isSwiping = false
        // 垂直移动：收起拨号盘
        if (dy < -20 && phoneStore.isKeypadOpen) {
          phoneStore.isKeypadOpen = false
        }
      }
    }
  }

  if (isSwiping) {
    e.preventDefault?.()
    let nextOffset = pointerInitialOffset + dx
    // 右拉阻尼
    if (nextOffset > 0) nextOffset = nextOffset * 0.2
    // 左拉阻尼
    if (nextOffset < -136) nextOffset = -136 + (nextOffset + 136) * 0.2

    swipeOffsets.value = {
      ...swipeOffsets.value,
      [r.id]: nextOffset
    }
  }
}

function onRowPointerUp(e, r) {
  clearTimeout(longPressTimer)
  if (activeSwipeId.value !== r.id) return

  if (isSwiping) {
    lastSwipeEndTime = Date.now()
    justSwipedId = r.id
    transitionRowId.value = r.id

    setTimeout(() => {
      if (justSwipedId === r.id) justSwipedId = null
    }, 350)
    setTimeout(() => {
      if (transitionRowId.value === r.id) transitionRowId.value = null
    }, 280)

    const currentOffset = swipeOffsets.value[r.id] || 0
    if (currentOffset < -45) {
      const newOffsets = {}
      newOffsets[r.id] = -136
      swipeOffsets.value = newOffsets
    } else {
      const next = { ...swipeOffsets.value }
      delete next[r.id]
      swipeOffsets.value = next
    }
  }

  try {
    pointerTarget?.releasePointerCapture(pointerId)
  } catch (_) {}
  activeSwipeId.value = null
  isSwiping = false
  gestureDecided = false
  pointerTarget = null
  pointerId = null
}

function handleItemClick(e, r) {
  // 1. 如果刚完成滑动操作（350ms 内），拦截合成的 click 事件，严禁误触发拨号
  if (Date.now() - lastSwipeEndTime < 350 || justSwipedId === r.id) {
    justSwipedId = null
    return
  }

  // 2. 如果当前行正处于滑开状态，点击行为是收起菜单，绝不拨号
  if ((swipeOffsets.value[r.id] || 0) < -10) {
    const next = { ...swipeOffsets.value }
    delete next[r.id]
    swipeOffsets.value = next
    return
  }

  // 3. 如果列表中有其他行处于滑开状态，点击任意行先关闭所有滑开的菜单，不拨号
  if (Object.values(swipeOffsets.value).some(v => v < -10)) {
    swipeOffsets.value = {}
    return
  }

  // 4. 正常点击无滑开状态才进入拨号
  phoneStore.startCall(r)
}

function handleInfoClick(e, recent) {
  e.stopPropagation()
  swipeOffsets.value = {}
  phoneStore.selectedRecent = recent
}

function handleLongPress(recent) {
  clearTimeout(longPressTimer)
  phoneStore.flashCallTarget = recent
}

function handleDeleteRecent(e, id) {
  e.stopPropagation()
  phoneStore.removeRecent(id)
  const next = { ...swipeOffsets.value }
  delete next[id]
  swipeOffsets.value = next
}

function handleQuickCall(e, recent) {
  e.stopPropagation()
  phoneStore.startCall(recent)
  const next = { ...swipeOffsets.value }
  delete next[recent.id]
  swipeOffsets.value = next
}
</script>

<template>
  <div class="phone-recents-tab">
    <!-- 1. 号码输入时的智能匹配联系人列表与快速动作（1:1 对齐真机） -->
    <div v-if="phoneStore.dialedNumber" class="matched-section">
      <div v-if="matchingContacts.length > 0" class="matched-group-title">所有联系人</div>
      <div
        v-for="c in matchingContacts"
        :key="c.id"
        class="matched-contact-row"
        @click="phoneStore.startCall(c)"
      >
        <div class="contact-avatar-circle" :style="{ backgroundColor: c.color || '#3B82F6' }">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="#FFFFFF">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        </div>
        <div class="matched-info-col">
          <div class="matched-name">{{ c.name }}</div>
          <div class="matched-sub-row">
            <span class="matched-type-tag">{{ c.company ? '单位' : '手机' }}</span>
            <span class="matched-number-line">
              <span
                v-for="(part, idx) in highlightMatch(c.number, phoneStore.dialedNumber)"
                :key="idx"
                :class="{ 'match-green': part.matched }"
              >{{ part.text }}</span>
            </span>
          </div>
        </div>
        <button class="info-btn" title="查看联系人详情" @click.stop="phoneStore.selectedContact = c">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#1C1C1E" stroke-width="1.8" />
            <path d="M12 11V17M12 7.5V8" stroke="#1C1C1E" stroke-width="2" stroke-linecap="round" />
          </svg>
        </button>
      </div>

      <!-- 快捷动作列表（新建联系人 / 添加到现有联系人 / 发送短信） -->
      <div class="matched-actions-list">
        <div class="matched-action-item" @click="handleCreateContact">
          <div class="action-icon-circle">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1C1C1E" stroke-width="2" stroke-linecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </div>
          <span class="action-item-label">新建联系人</span>
        </div>
        <div class="matched-action-item" @click="handleAddToExisting">
          <div class="action-icon-circle">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1C1C1E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <line x1="20" y1="8" x2="20" y2="14" />
              <line x1="23" y1="11" x2="17" y2="11" />
            </svg>
          </div>
          <span class="action-item-label">添加到现有联系人</span>
        </div>
        <div class="matched-action-item" @click="handleSendMessage">
          <div class="action-icon-circle">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1C1C1E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
            </svg>
          </div>
          <span class="action-item-label">发送短信</span>
        </div>
      </div>
      <!-- 底部安全留白 -->
      <div class="bottom-safe-space"></div>
    </div>

    <!-- 2. 空状态提示（未输入号码且无记录） -->
    <div v-else-if="phoneStore.filteredRecents.length === 0" class="recents-empty-state">
      <div class="empty-icon-wrap">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
        </svg>
      </div>
      <div class="empty-text">
        {{ phoneStore.recentsFilter === 'missed' ? '暂无未接来电' : '暂无通话记录' }}
      </div>
    </div>

    <!-- 3. 通话记录列表（支持滑动手势与折叠联动） -->
    <div v-else class="recents-list">
      <div
        v-for="r in phoneStore.filteredRecents"
        :key="r.id"
        class="recent-swipe-cell"
      >
        <!-- 侧滑露出的操作底板（呼叫与删除，带跟手视差） -->
        <div class="swipe-actions-bg" :class="{ 'is-active': (swipeOffsets[r.id] || 0) < -2 }">
          <div class="swipe-actions-inner" :style="getActionsStyle(r.id)">
            <button class="swipe-btn btn-call" title="呼叫" @click.stop="handleQuickCall($event, r)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#FFFFFF">
                <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-2.2 2.2a15.047 15.047 0 01-6.59-6.59l2.2-2.21a.96.96 0 00.25-1.01A11.36 11.36 0 018.57 3.9c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.52c0-.55-.45-1-.99-1z" />
              </svg>
              <span class="swipe-label">呼叫</span>
            </button>
            <button class="swipe-btn btn-delete" title="删除" @click.stop="handleDeleteRecent($event, r.id)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.2">
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
              </svg>
              <span class="swipe-label">删除</span>
            </button>
          </div>
        </div>

        <!-- 前景主要内容行（1:1 跟手滑动，纯白底色完全覆盖底板） -->
        <div
          class="recent-row-content"
          :style="getRowContentStyle(r.id)"
          :class="{
            'is-swiping': activeSwipeId === r.id,
            'has-swipe-transition': transitionRowId === r.id
          }"
          @pointerdown="onRowPointerDown($event, r)"
          @pointermove="onRowPointerMove($event, r)"
          @pointerup="onRowPointerUp($event, r)"
          @pointercancel="onRowPointerUp($event, r)"
          @click="handleItemClick($event, r)"
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
  touch-action: pan-y;
}

/* 侧滑底板：仅当滑动时展示与激活点击 */
.swipe-actions-bg {
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  display: flex;
  width: 136px;
  z-index: 1;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease;
  overflow: hidden;
}

.swipe-actions-bg.is-active {
  opacity: 1;
  pointer-events: auto;
}

.swipe-actions-inner {
  display: flex;
  width: 100%;
  height: 100%;
  will-change: transform;
  transition: transform 0.1s linear;
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

/* 前景内容行（跟手滑动） */
.recent-row-content {
  position: relative;
  display: flex;
  align-items: center;
  padding: 13px 20px;
  background-color: #FFFFFF;
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.04);
  cursor: pointer;
  user-select: none;
  z-index: 2;
  touch-action: pan-y;
  will-change: transform;
}

/* 正在跟手滑动：无 transition，实时像素对齐，背景绝对纯白不透明 */
.recent-row-content.is-swiping {
  transition: none !important;
  background-color: #FFFFFF !important;
}

/* 松手后的平滑回弹 / 吸附过渡 */
.recent-row-content.has-swipe-transition {
  transition: transform 0.28s cubic-bezier(0.25, 1, 0.5, 1) !important;
}

.recent-swipe-cell.is-swiped .recent-row-content {
  transform: translateX(-136px);
}

.recent-row-content:active {
  background-color: #FAFAFA;
}

/* 输入号码时智能匹配联系人列表与快速动作（1:1 对齐真机） */
.matched-section {
  width: 100%;
  padding: 8px 0 0;
  background: #FFFFFF;
}

.matched-group-title {
  padding: 6px 20px 4px;
  font-size: 13px;
  font-weight: 500;
  color: #8E8E93;
}

.matched-contact-row {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.04);
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.matched-contact-row:active {
  background-color: #F8F9FA;
}

.contact-avatar-circle {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-right: 14px;
}

.matched-info-col {
  flex: 1;
  min-width: 0;
}

.matched-name {
  font-size: 16px;
  font-weight: 500;
  color: #1C1C1E;
  margin-bottom: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.matched-sub-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #8E8E93;
}

.matched-type-tag {
  font-size: 12px;
  color: #8E8E93;
}

.matched-number-line {
  letter-spacing: 0.2px;
}

.match-green {
  color: #00C853;
  font-weight: 600;
}

.matched-actions-list {
  padding: 12px 0;
  display: flex;
  flex-direction: column;
}

.matched-action-item {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  gap: 16px;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.matched-action-item:active {
  background-color: #F8F9FA;
}

.action-icon-circle {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: #F2F3F5;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.action-item-label {
  font-size: 16px;
  color: #1C1C1E;
  font-weight: 400;
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
