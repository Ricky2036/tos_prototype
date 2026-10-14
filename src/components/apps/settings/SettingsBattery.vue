<script setup>
import { ref } from 'vue'
import ListCell from '../../ui/ListCell.vue'
import ToggleSwitch from '../../ui/ToggleSwitch.vue'

const emit = defineEmits(['back', 'navigate'])

// 电池模式选择：'balanced' (均衡) 或 'saver' (省电)
const selectedMode = ref('balanced')
const superSaver = ref(false)

// 时间维度：'24h' | '7d'
const timeRange = ref('24h')

// 提示反馈
const toastText = ref('')
let toastTimer = null
function showToast(msg) {
  toastText.value = msg
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastText.value = ''
  }, 2200)
}

function selectMode(mode) {
  selectedMode.value = mode
  showToast(mode === 'balanced' ? '已切换至均衡模式' : '已开启省电模式，降低后台耗电')
}

function handleItemTap(name) {
  showToast(`已进入${name}`)
}

function back() {
  emit('back')
  return true
}

defineExpose({ back })
</script>

<template>
  <div class="settings-battery-page">
    <!-- 顶部导航栏 -->
    <div class="battery-nav-bar">
      <button class="nav-round-btn" aria-label="返回" data-nav-back @click="emit('back')">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M19 12H5M5 12L12 5M5 12L12 19" stroke="#1C1C1E" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <div class="nav-title">电池与省电</div>
      <div class="nav-placeholder"></div>
    </div>

    <!-- 滚动区域 -->
    <div class="battery-scroll-body scrollable">
      <!-- 顶部电量指示卡片 -->
      <div class="battery-hero-card">
        <div class="hero-top-row">
          <div class="battery-percentage-wrap">
            <span class="percentage-num">91</span>
            <span class="percentage-unit">%</span>
          </div>
          <div class="charging-pill-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M13 2L4 14H12L11 22L20 10H12L13 2Z" fill="#10B981"/>
            </svg>
            <span>正在充电</span>
          </div>
        </div>
        <div class="hero-remaining-text">剩余 27 小时 51 分钟</div>
      </div>

      <!-- 模式双选卡片 -->
      <div class="battery-modes-row">
        <!-- 省电模式 -->
        <button
          class="mode-select-card"
          :class="{ selected: selectedMode === 'saver' }"
          @click="selectMode('saver')"
        >
          <div class="mode-card-header">
            <span class="mode-name">省电模式</span>
            <div class="radio-indicator" :class="{ active: selectedMode === 'saver' }"></div>
          </div>
          <div class="mode-time">30 小时 44 分钟</div>
        </button>

        <!-- 均衡模式 -->
        <button
          class="mode-select-card"
          :class="{ selected: selectedMode === 'balanced' }"
          @click="selectMode('balanced')"
        >
          <div class="mode-card-header">
            <span class="mode-name">均衡模式</span>
            <div class="radio-indicator" :class="{ active: selectedMode === 'balanced' }"></div>
          </div>
          <div class="mode-time">27 小时 51 分钟</div>
        </button>
      </div>

      <!-- 超级省电开关 -->
      <div class="settings-card">
        <ListCell
          title="超级省电"
          subtitle="极致省电模式，仅保留电话、短信和时钟等基础功能。"
          last
        >
          <template #icon>
            <div class="squircle-icon bg-emerald-battery">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="7" width="16" height="10" rx="2" stroke="#FFFFFF" stroke-width="2"/>
                <line x1="20" y1="10" x2="20" y2="14" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>
                <line x1="6" y1="12" x2="10" y2="12" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </div>
          </template>
          <template #right>
            <ToggleSwitch v-model="superSaver" />
          </template>
        </ListCell>
      </div>

      <!-- 电池设置组 -->
      <div class="settings-card">
        <ListCell title="省电管理" chevron @click="handleItemTap('省电管理')">
          <template #icon>
            <div class="squircle-icon bg-blue-gear">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="3" stroke="#FFFFFF" stroke-width="2"/>
                <path d="M19.4 15A1.65 1.65 0 0 0 20 16.3V18A2 2 0 0 1 18 20H6A2 2 0 0 1 4 18V16.3A1.65 1.65 0 0 0 4.6 15" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </div>
          </template>
        </ListCell>
        <ListCell title="充电设置" chevron @click="handleItemTap('充电设置')">
          <template #icon>
            <div class="squircle-icon bg-amber-bolt">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M13 2L4 14H12L11 22L20 10H12L13 2Z" fill="#FFFFFF"/>
              </svg>
            </div>
          </template>
        </ListCell>
        <ListCell title="电池健康" value="最大容量 100%" chevron last @click="handleItemTap('电池健康')">
          <template #icon>
            <div class="squircle-icon bg-green-heart">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z" fill="#FFFFFF"/>
              </svg>
            </div>
          </template>
        </ListCell>
      </div>

      <!-- 电池使用情况图表卡片 -->
      <div class="chart-container-card">
        <div class="usage-header-row">
          <div class="usage-title">距上次充满电已使用 9 小时 13 分钟</div>
        </div>

        <!-- 过去 24 小时 / 过去 7 天分段切换 -->
        <div class="segmented-control-bar">
          <button
            class="segment-btn"
            :class="{ active: timeRange === '24h' }"
            @click="timeRange = '24h'"
          >
            过去 24 小时
          </button>
          <button
            class="segment-btn"
            :class="{ active: timeRange === '7d' }"
            @click="timeRange = '7d'"
          >
            过去 7 天
          </button>
        </div>

        <!-- 电池电量柱形走势图 -->
        <div class="chart-section-title">电池电量</div>
        <div class="battery-level-chart">
          <!-- 柱子模拟对齐真机 24h 序列 -->
          <div class="chart-bars-wrap">
            <div class="chart-y-axis">
              <span>100%</span>
              <span>50%</span>
              <span>0%</span>
            </div>
            <div class="chart-bars-content">
              <!-- 17-21 (蓝条) -->
              <span class="bar-col blue" style="height: 98%;"></span>
              <span class="bar-col blue" style="height: 96%;"></span>
              <span class="bar-col blue" style="height: 94%;"></span>
              <span class="bar-col blue" style="height: 90%;"></span>
              <span class="bar-col blue" style="height: 86%;"></span>
              <span class="bar-col blue" style="height: 84%;"></span>
              <span class="bar-col blue" style="height: 80%;"></span>
              <!-- 01-05 (绿条充电中) -->
              <span class="bar-col green" style="height: 98%;"></span>
              <span class="bar-col green" style="height: 98%;"></span>
              <span class="bar-col green" style="height: 100%;"></span>
              <span class="bar-col green" style="height: 100%;"></span>
              <span class="bar-col green" style="height: 100%;"></span>
              <span class="bar-col green" style="height: 100%;"></span>
              <span class="bar-col green" style="height: 100%;"></span>
              <span class="bar-col green" style="height: 100%;"></span>
              <!-- 09-13 (放电) -->
              <span class="bar-col blue" style="height: 92%;"></span>
              <span class="bar-col blue" style="height: 86%;"></span>
              <span class="bar-col blue" style="height: 78%;"></span>
              <span class="bar-col blue" style="height: 76%;"></span>
              <span class="bar-col blue" style="height: 75%;"></span>
              <span class="bar-col blue" style="height: 74%;"></span>
              <!-- 13-17 (充电恢复) -->
              <span class="bar-col green" style="height: 80%;"></span>
              <span class="bar-col green" style="height: 86%;"></span>
              <span class="bar-col green" style="height: 91%;"></span>
            </div>
          </div>
          <!-- X 轴刻度 -->
          <div class="chart-x-axis">
            <span>17</span>
            <span>21</span>
            <span>01</span>
            <span>05</span>
            <span>09</span>
            <span>13</span>
          </div>
        </div>

        <!-- 活动时长 -->
        <div class="chart-section-title" style="margin-top: 24px;">
          活动时长 <span class="info-mark">ⓘ</span>
        </div>
        <div class="activity-legend-row">
          <div class="legend-item">
            <span class="dot-legend dot-screen-on"></span>
            <span class="legend-text">亮屏活动时长</span>
            <span class="legend-val">2 小时 3 分钟</span>
          </div>
          <div class="legend-item">
            <span class="dot-legend dot-screen-off"></span>
            <span class="legend-text">息屏活动时长</span>
            <span class="legend-val">7 小时</span>
          </div>
        </div>

        <!-- 屏幕活动柱图 -->
        <div class="activity-chart">
          <div class="chart-bars-wrap">
            <div class="chart-y-axis">
              <span>60 分钟</span>
              <span>30 分钟</span>
              <span>0 分钟</span>
            </div>
            <div class="chart-bars-content activity-bars">
              <span class="act-col col-1"></span>
              <span class="act-col col-2"></span>
              <span class="act-col col-3"></span>
              <span class="act-col col-4"></span>
              <span class="act-col col-5"></span>
              <span class="act-col col-6"></span>
            </div>
          </div>
          <div class="chart-x-axis">
            <span>17</span>
            <span>21</span>
            <span>01</span>
            <span>05</span>
            <span>09</span>
            <span>13</span>
          </div>
        </div>
      </div>

      <!-- 耗电占比排行 -->
      <div class="ranking-header">耗电占比排行（过去 24 小时）</div>
      <div class="settings-card">
        <!-- 哔哩哔哩 -->
        <ListCell
          title="哔哩哔哩"
          subtitle="前台 37 分钟 · 后台 52 分钟"
          value="54%"
          chevron
          @click="handleItemTap('哔哩哔哩耗电详情')"
        >
          <template #icon>
            <div class="app-icon-bili">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <rect width="24" height="24" rx="6" fill="#FB7299"/>
                <path d="M7 6L5 3.5M17 6L19 3.5M6 6H18C19.1 6 20 6.9 20 8V17C20 18.1 19.1 19 18 19H6C4.9 19 4 18.1 4 17V8C4 6.9 4.9 6 6 6Z" stroke="#FFFFFF" stroke-width="1.8"/>
                <circle cx="9" cy="12" r="1.5" fill="#FFFFFF"/>
                <circle cx="15" cy="12" r="1.5" fill="#FFFFFF"/>
              </svg>
            </div>
          </template>
        </ListCell>

        <!-- 腾讯视频 -->
        <ListCell
          title="腾讯视频"
          subtitle="前台 40 分钟"
          value="20%"
          chevron
          @click="handleItemTap('腾讯视频耗电详情')"
        >
          <template #icon>
            <div class="app-icon-tx">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <rect width="24" height="24" rx="6" fill="#FFFFFF" stroke="#E5E5EA"/>
                <path d="M8 6L18 12L8 18V6Z" fill="#00C853"/>
                <path d="M8 6L13 12L8 18V6Z" fill="#FFA000"/>
              </svg>
            </div>
          </template>
        </ListCell>

        <!-- 微信 -->
        <ListCell
          title="微信"
          subtitle="前台 28 分钟 · 后台 1 小时 15 分钟"
          value="12%"
          chevron
          @click="handleItemTap('微信耗电详情')"
        >
          <template #icon>
            <div class="squircle-icon bg-green-wechat">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M9 4C5.1 4 2 6.7 2 10C2 11.9 3 13.5 4.6 14.6L4 17.5L7.2 16C7.8 16.2 8.4 16.3 9 16.3C8.9 15.9 8.9 15.4 8.9 15C8.9 11.7 12 9 15.9 9C16.3 9 16.7 9 17.1 9.1C16.1 6.2 12.8 4 9 4Z" fill="#FFFFFF"/>
                <path d="M15.5 10C12.5 10 10 12.2 10 15C10 16.5 10.8 17.8 12 18.7L11.5 21L14 19.8C14.5 19.9 15 20 15.5 20C18.5 20 21 17.8 21 15C21 12.2 18.5 10 15.5 10Z" fill="#FFFFFF"/>
              </svg>
            </div>
          </template>
        </ListCell>

        <!-- 系统界面 -->
        <ListCell
          title="系统界面"
          subtitle="前台 18 分钟"
          value="8%"
          chevron
          @click="handleItemTap('系统界面耗电详情')"
        >
          <template #icon>
            <div class="squircle-icon bg-gray-sys">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="4" stroke="#FFFFFF" stroke-width="2"/>
                <line x1="3" y1="9" x2="21" y2="9" stroke="#FFFFFF" stroke-width="2"/>
              </svg>
            </div>
          </template>
        </ListCell>

        <!-- 相机 -->
        <ListCell
          title="相机"
          subtitle="前台 6 分钟"
          value="6%"
          chevron
          last
          @click="handleItemTap('相机耗电详情')"
        >
          <template #icon>
            <div class="squircle-icon bg-zinc-cam">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M23 19C23 20.1 22.1 21 21 21H3C1.9 21 1 20.1 1 19V8C1 6.9 1.9 6 3 6H7L9 3H15L17 6H21C22.1 6 23 6.9 23 8V19Z" fill="#FFFFFF"/>
                <circle cx="12" cy="13" r="3.5" fill="#3F3F46"/>
              </svg>
            </div>
          </template>
        </ListCell>
      </div>

      <div class="bottom-spacer"></div>
    </div>

    <!-- 浮动提示 Toast -->
    <transition name="toast-fade">
      <div v-if="toastText" class="settings-toast">{{ toastText }}</div>
    </transition>
  </div>
</template>

<style scoped>
.settings-battery-page {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: var(--bg-subtle, #F2F2F7);
  color: #1C1C1E;
  overflow: hidden;
  user-select: none;
}

/* 导航栏 */
.battery-nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: calc(var(--safe-top, 0px) + 52px);
  padding: var(--safe-top, 0px) 16px 0 16px;
  background: #F2F2F7;
  flex-shrink: 0;
  z-index: 10;
}

.nav-round-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.05);
  border: none;
  outline: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s ease;
}

.nav-round-btn:active {
  background: rgba(0, 0, 0, 0.1);
}

.nav-title {
  font-size: 17px;
  font-weight: 600;
  color: #1C1C1E;
  letter-spacing: -0.2px;
}

.nav-placeholder {
  width: 36px;
}

/* 滚动区域 */
.battery-scroll-body {
  flex: 1;
  padding: 8px 16px 32px 16px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* 顶部电量 Hero */
.battery-hero-card {
  background: #FFFFFF;
  border-radius: 20px;
  padding: 22px 20px 20px 20px;
  margin-bottom: 12px;
  border: 1px solid rgba(0, 0, 0, 0.03);
}

.hero-top-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 4px;
}

.battery-percentage-wrap {
  display: flex;
  align-items: baseline;
}

.percentage-num {
  font-size: 48px;
  font-weight: 700;
  line-height: 1;
  color: #1C1C1E;
  letter-spacing: -1px;
}

.percentage-unit {
  font-size: 22px;
  font-weight: 600;
  color: #1C1C1E;
  margin-left: 2px;
}

.charging-pill-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(16, 185, 129, 0.12);
  color: #10B981;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 600;
}

.hero-remaining-text {
  font-size: 14px;
  color: #8E8E93;
  font-weight: 400;
}

/* 模式双选卡片 */
.battery-modes-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 12px;
}

.mode-select-card {
  background: #FFFFFF;
  border-radius: 16px;
  padding: 16px;
  border: 1.5px solid transparent;
  display: flex;
  flex-direction: column;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
}

.mode-select-card.selected {
  border-color: #007AFF;
  background: #FFFFFF;
}

.mode-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.mode-name {
  font-size: 15px;
  font-weight: 600;
  color: #1C1C1E;
}

.radio-indicator {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 1.5px solid #C7C7CC;
  position: relative;
  transition: all 0.2s ease;
}

.radio-indicator.active {
  border-color: #007AFF;
  background: #007AFF;
}

.radio-indicator.active::after {
  content: '';
  position: absolute;
  top: 5px;
  left: 5px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #FFFFFF;
}

.mode-time {
  font-size: 12px;
  color: #8E8E93;
}

/* 卡片容器 */
.settings-card {
  background: #FFFFFF;
  border-radius: 16px;
  margin-bottom: 12px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.03);
}

.squircle-icon {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bg-emerald-battery { background: #10B981; }
.bg-blue-gear { background: #3B82F6; }
.bg-amber-bolt { background: #F59E0B; }
.bg-green-heart { background: #10B981; }
.bg-green-wechat { background: #07C160; }
.bg-gray-sys { background: #64748B; }
.bg-zinc-cam { background: #3F3F46; }

.app-icon-bili, .app-icon-tx {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 图表容器 */
.chart-container-card {
  background: #FFFFFF;
  border-radius: 20px;
  padding: 20px 16px;
  margin-bottom: 16px;
  border: 1px solid rgba(0, 0, 0, 0.03);
}

.usage-header-row {
  margin-bottom: 14px;
}

.usage-title {
  font-size: 16px;
  font-weight: 600;
  color: #1C1C1E;
}

.segmented-control-bar {
  display: flex;
  background: #EBEBF0;
  border-radius: 10px;
  padding: 2px;
  margin-bottom: 18px;
}

.segment-btn {
  flex: 1;
  padding: 6px 0;
  border-radius: 8px;
  border: none;
  background: transparent;
  font-size: 13px;
  font-weight: 500;
  color: #8E8E93;
  cursor: pointer;
  transition: all 0.2s ease;
}

.segment-btn.active {
  background: #FFFFFF;
  color: #1C1C1E;
  font-weight: 600;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.chart-section-title {
  font-size: 14px;
  font-weight: 600;
  color: #1C1C1E;
  margin-bottom: 10px;
}

.info-mark {
  color: #8E8E93;
  font-weight: normal;
  margin-left: 2px;
}

/* 走势图 */
.battery-level-chart {
  display: flex;
  flex-direction: column;
}

.chart-bars-wrap {
  display: flex;
  align-items: flex-end;
  height: 90px;
  gap: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.chart-y-axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
  font-size: 10px;
  color: #8E8E93;
  padding-right: 4px;
}

.chart-bars-content {
  flex: 1;
  height: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: 0 4px;
}

.bar-col {
  width: 3.5px;
  border-radius: 2px;
  transition: height 0.3s ease;
}

.bar-col.blue { background: #3B82F6; }
.bar-col.green { background: #10B981; }

.chart-x-axis {
  display: flex;
  justify-content: space-between;
  padding-left: 36px;
  padding-right: 8px;
  padding-top: 6px;
  font-size: 10px;
  color: #8E8E93;
}

/* 活动时长 */
.activity-legend-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.dot-legend {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.dot-screen-on { background: #3B82F6; }
.dot-screen-off { background: #93C5FD; }

.legend-text {
  font-size: 11px;
  color: #8E8E93;
}

.legend-val {
  font-size: 12px;
  font-weight: 600;
  color: #1C1C1E;
  margin-left: 2px;
}

.activity-bars {
  align-items: flex-end;
  gap: 16px;
}

.act-col {
  width: 14px;
  border-radius: 4px 4px 0 0;
  background: #93C5FD;
  position: relative;
}

.act-col.col-1 { height: 60%; background: #93C5FD; }
.act-col.col-2 { height: 75%; background: #93C5FD; }
.act-col.col-3 { height: 20%; background: #3B82F6; }
.act-col.col-4 { height: 85%; background: #93C5FD; }
.act-col.col-5 { height: 95%; background: #3B82F6; }
.act-col.col-6 { height: 10%; background: #93C5FD; }

/* 排行列表 */
.ranking-header {
  font-size: 13px;
  color: #8E8E93;
  margin-left: 4px;
  margin-bottom: 8px;
  font-weight: 500;
}

.bottom-spacer {
  height: 24px;
}

/* Toast */
.settings-toast {
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(28, 28, 30, 0.88);
  color: #FFFFFF;
  padding: 8px 18px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  pointer-events: none;
  z-index: 100;
  white-space: nowrap;
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, 8px);
}
</style>
