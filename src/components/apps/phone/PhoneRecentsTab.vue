<script setup>
import { ref } from 'vue'
import { usePhoneStore } from '../../../stores/phoneStore'

const phoneStore = usePhoneStore()
const emit = defineEmits(['scroll', 'openFlashCall'])

// 滑动状态检测
let touchStartY = 0
let touchStartX = 0

function handleTouchStart(e) {
  if (e.touches?.length) {
    touchStartY = e.touches[0].clientY
    touchStartX = e.touches[0].clientX
  }
}

function handleTouchMove(e) {
  if (!e.touches?.length) return
  const dy = e.touches[0].clientY - touchStartY
  const dx = e.touches[0].clientX - touchStartX

  // 向上滑动且拨号盘开启时，收起拨号盘
  if (dy < -40 && phoneStore.isKeypadOpen && Math.abs(dy) > Math.abs(dx)) {
    phoneStore.isKeypadOpen = false
  }
}

function handleScroll(e) {
  emit('scroll', e)
  // 向上滚动列表自动收起拨号盘
  if (e.target.scrollTop > 30 && phoneStore.isKeypadOpen) {
    phoneStore.isKeypadOpen = false
  }
}

function handleItemClick(recent) {
  phoneStore.startCall(recent)
}

function handleInfoClick(e, recent) {
  e.stopPropagation()
  phoneStore.startCall(recent)
}

function handleLongPress(recent) {
  phoneStore.flashCallTarget = recent
}

function triggerFlashCallBanner() {
  phoneStore.flashCallTarget = phoneStore.recents[0] || { name: '常用联系人', number: '138 0000 0000' }
}
</script>

<template>
  <div class="phone-recents-tab">
    <!-- 筛选标签栏：全部类型 | 未接来电 -->
    <div class="recents-filter-bar">
      <button
        class="filter-tab-btn"
        :class="{ active: phoneStore.recentsFilter === 'all' }"
        @click="phoneStore.recentsFilter = 'all'"
      >
        全部类型
        <div v-if="phoneStore.recentsFilter === 'all'" class="filter-indicator"></div>
      </button>
      <button
        class="filter-tab-btn"
        :class="{ active: phoneStore.recentsFilter === 'missed' }"
        @click="phoneStore.recentsFilter = 'missed'"
      >
        未接来电
        <div v-if="phoneStore.recentsFilter === 'missed'" class="filter-indicator"></div>
      </button>
    </div>

    <!-- 未接来电状态下的 FLASH CALL 彩色品牌横幅 -->
    <div
      v-if="phoneStore.recentsFilter === 'missed'"
      class="flash-call-banner"
      @click="triggerFlashCallBanner"
    >
      <div class="flash-call-glow-text">FLASH CALL</div>
      <div class="flash-call-dots">
        <span class="dot d1"></span>
        <span class="dot d2"></span>
        <span class="dot d3"></span>
      </div>
    </div>

    <!-- 通话记录列表（支持滑动手势与折叠联动） -->
    <div class="recents-list">
      <div
        v-for="r in phoneStore.filteredRecents"
        :key="r.id"
        class="recent-row"
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
        <button class="info-btn" @click="handleInfoClick($event, r)">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#1C1C1E" stroke-width="1.8" />
            <path d="M12 11V17M12 7.5V8" stroke="#1C1C1E" stroke-width="2" stroke-linecap="round" />
          </svg>
        </button>
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
  background: #FFFFFF;
}

/* 筛选分类栏：吸顶常驻，紧贴折叠大标题下缘，列表上滑时绝不移走 */
.recents-filter-bar {
  position: sticky;
  top: calc(var(--safe-top, 54px) + var(--title-height, 48px));
  z-index: 11;
  background: #FFFFFF;
  display: flex;
  align-items: center;
  padding: 6px 24px 8px;
  gap: 32px;
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.05);
}

/* 向上延伸白色遮挡幕，彻底防止列表滚动时文字从标题间隙穿透漏出 */
.recents-filter-bar::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 100%;
  height: 90px;
  background: #FFFFFF;
  pointer-events: none;
  z-index: -1;
}

.filter-tab-btn {
  position: relative;
  background: none;
  border: none;
  padding: 4px 0 6px;
  font-size: 15px;
  font-weight: 500;
  color: #8E8E93;
  cursor: pointer;
  transition: color 0.18s ease;
}

.filter-tab-btn.active {
  color: #1C1C1E;
  font-weight: 600;
}

.filter-indicator {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 32px;
  height: 3px;
  border-radius: 2px;
  background-color: #00C853;
}

/* Flash Call 横幅 */
.flash-call-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 12px 20px 4px;
  padding: 12px 18px;
  background: linear-gradient(135deg, #F0FDF4 0%, #E0F2FE 100%);
  border-radius: 14px;
  border: 1px solid rgba(0, 200, 83, 0.15);
  cursor: pointer;
}

.flash-call-glow-text {
  font-size: 17px;
  font-weight: 800;
  letter-spacing: 2px;
  background: linear-gradient(90deg, #0284C7, #00C853);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.flash-call-dots {
  display: flex;
  gap: 4px;
}
.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #00C853;
  opacity: 0.6;
}

/* 通话记录列表 */
.recents-list {
  padding: 4px 0 0;
  width: 100%;
}

.recent-row {
  display: flex;
  align-items: center;
  padding: 13px 20px;
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.04);
  cursor: pointer;
  user-select: none;
  transition: background-color 0.15s ease;
}

.recent-row:active {
  background-color: rgba(0, 0, 0, 0.03);
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
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  border-radius: 50%;
}
.info-btn:active {
  opacity: 0.6;
}

.bottom-safe-space {
  height: 140px;
}
</style>
