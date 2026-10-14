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
  showToast(mode === 'balanced' ? '已切换至均衡模式' : '已开启省电模式')
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
    <!-- 顶部导航栏：左对齐真机规范 -->
    <div class="battery-nav-bar">
      <button class="nav-round-btn" aria-label="返回" data-nav-back @click="emit('back')">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M19 12H5M5 12L12 5M5 12L12 19" stroke="#1C1C1E" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <div class="nav-title">电池与省电</div>
    </div>

    <!-- 滚动区域 -->
    <div class="battery-scroll-body scrollable">
      <!-- 顶部电量指示区 -->
      <div class="battery-hero-section">
        <div class="battery-percentage-wrap">
          <span class="percentage-num">91</span>
          <span class="percentage-unit">%</span>
        </div>
        <div class="hero-remaining-text">剩余 27 小时 51 分钟</div>

        <!-- 充电进度能量条胶囊 -->
        <div class="charging-capsule-bar">
          <div class="charging-fill-track" style="width: 91%;">
            <svg class="charging-bolt" width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M13 2L4 14H12L11 22L20 10H12L13 2Z" fill="#FFFFFF"/>
            </svg>
            <span class="charging-text">正在充电</span>
          </div>
        </div>
      </div>

      <!-- 分组标题：电池模式 -->
      <div class="section-sub-title">
        <span>电池模式</span>
        <button class="info-icon-btn" aria-label="说明" @click="showToast('电池模式说明')">ⓘ</button>
      </div>

      <!-- 模式双选卡片 -->
      <div class="battery-modes-row">
        <!-- 省电模式 -->
        <button
          class="mode-select-card"
          :class="{ selected: selectedMode === 'saver' }"
          @click="selectMode('saver')"
        >
          <div class="mode-icon-wrap">
            <svg width="28" height="16" viewBox="0 0 28 16" fill="none">
              <rect x="1" y="1" width="23" height="14" rx="3.5" stroke="#1C1C1E" stroke-width="1.8"/>
              <path d="M26 6V10" stroke="#1C1C1E" stroke-width="2" stroke-linecap="round"/>
              <!-- 绿叶 -->
              <path d="M7 11C7 7 11 5 15 5C15 9 11 11 7 11Z" fill="#10B981"/>
            </svg>
          </div>
          <div class="mode-name">省电模式</div>
          <div class="mode-time">30 小时 44 分钟</div>
        </button>

        <!-- 均衡模式 -->
        <button
          class="mode-select-card"
          :class="{ selected: selectedMode === 'balanced' }"
          @click="selectMode('balanced')"
        >
          <div class="mode-icon-wrap">
            <svg width="28" height="16" viewBox="0 0 28 16" fill="none">
              <rect x="1" y="1" width="23" height="14" rx="3.5" :stroke="selectedMode === 'balanced' ? '#007AFF' : '#1C1C1E'" stroke-width="1.8"/>
              <path d="M26 6V10" :stroke="selectedMode === 'balanced' ? '#007AFF' : '#1C1C1E'" stroke-width="2" stroke-linecap="round"/>
              <rect x="5" y="4.5" width="4" height="7" rx="1.5" :fill="selectedMode === 'balanced' ? '#007AFF' : '#1C1C1E'"/>
              <rect x="11" y="4.5" width="4" height="7" rx="1.5" :fill="selectedMode === 'balanced' ? '#007AFF' : '#1C1C1E'"/>
            </svg>
          </div>
          <div class="mode-name" :class="{ active: selectedMode === 'balanced' }">均衡模式</div>
          <div class="mode-time">27 小时 51 分钟</div>
        </button>
      </div>

      <!-- 超级省电开关：真机纯净卡片 -->
      <div class="settings-card super-saver-card">
        <ListCell
          title="超级省电"
          subtitle="预计可用 33 小时 58 分钟。"
          last
        >
          <template #right>
            <ToggleSwitch v-model="superSaver" />
          </template>
        </ListCell>
      </div>

      <!-- 分组标题：电池设置 -->
      <div class="section-sub-title">电池设置</div>
      <div class="settings-card clean-list-card">
        <ListCell title="省电管理" chevron @click="handleItemTap('省电管理')" />
        <ListCell title="充电设置" chevron @click="handleItemTap('充电设置')" />
        <ListCell title="电池健康" value="最大容量 100%" chevron last @click="handleItemTap('电池健康')" />
      </div>

      <!-- 电池使用情况图表卡片 -->
      <div class="section-sub-title">电池使用情况</div>
      <div class="chart-container-card">
        <div class="usage-header-row" aria-label="距上次充满电已使用 9 小时 13 分钟">
          <div class="usage-subtitle">距上次充满电已使用</div>
          <div class="usage-title">9 小时 13 分钟</div>
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
          <div class="chart-bars-wrap">
            <div class="chart-y-axis">
              <span>100%</span>
              <span>50%</span>
              <span>0%</span>
            </div>
            <div class="chart-bars-content">
              <!-- 放电蓝条 -->
              <span class="bar-col blue" style="height: 98%;"></span>
              <span class="bar-col blue" style="height: 96%;"></span>
              <span class="bar-col blue" style="height: 94%;"></span>
              <span class="bar-col blue" style="height: 90%;"></span>
              <span class="bar-col blue" style="height: 86%;"></span>
              <span class="bar-col blue" style="height: 84%;"></span>
              <span class="bar-col blue" style="height: 80%;"></span>
              <!-- 充电绿条 -->
              <span class="bar-col green" style="height: 98%;"></span>
              <span class="bar-col green" style="height: 98%;"></span>
              <span class="bar-col green" style="height: 100%;"></span>
              <span class="bar-col green" style="height: 100%;"></span>
              <span class="bar-col green" style="height: 100%;"></span>
              <span class="bar-col green" style="height: 100%;"></span>
              <span class="bar-col green" style="height: 100%;"></span>
              <span class="bar-col green" style="height: 100%;"></span>
              <!-- 放电 -->
              <span class="bar-col blue" style="height: 92%;"></span>
              <span class="bar-col blue" style="height: 86%;"></span>
              <span class="bar-col blue" style="height: 78%;"></span>
              <span class="bar-col blue" style="height: 76%;"></span>
              <span class="bar-col blue" style="height: 75%;"></span>
              <span class="bar-col blue" style="height: 74%;"></span>
              <!-- 恢复充电 -->
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
          <span>活动时长</span>
          <span class="info-mark">ⓘ</span>
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

      <!-- 耗电占比排行：全面复用现有真实应用图标资产 -->
      <div class="section-sub-title">耗电占比排行（过去 24 小时）</div>
      <div class="settings-card app-ranking-card">
        <!-- 哔哩哔哩 -->
        <ListCell
          title="哔哩哔哩"
          subtitle="前台 37 分钟 · 后台 52 分钟"
          value="54%"
          chevron
          @click="handleItemTap('哔哩哔哩耗电详情')"
        >
          <template #icon>
            <img class="app-rank-icon" src="/icons/drawer/bilibili.png" alt="哔哩哔哩" />
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
            <img class="app-rank-icon" src="/icons/drawer/tencent_video.png" alt="腾讯视频" />
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
            <img class="app-rank-icon" src="/icons/drawer/wechat.png" alt="微信" />
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
            <img class="app-rank-icon" src="/icons/settings.png" alt="系统界面" />
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
            <img class="app-rank-icon" src="/icons/camera.png" alt="相机" />
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

/* 导航栏：左对齐大标题 */
.battery-nav-bar {
  display: flex;
  align-items: center;
  gap: 12px;
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
  font-size: 20px;
  font-weight: 600;
  color: #1C1C1E;
  letter-spacing: -0.3px;
}

/* 滚动区域 */
.battery-scroll-body {
  flex: 1;
  padding: 8px 16px 32px 16px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* 顶部电量指示区 */
.battery-hero-section {
  padding: 12px 4px 16px 4px;
}

.battery-percentage-wrap {
  display: flex;
  align-items: baseline;
  line-height: 1;
}

.percentage-num {
  font-size: 52px;
  font-weight: 700;
  color: #1C1C1E;
  letter-spacing: -1.5px;
}

.percentage-unit {
  font-size: 24px;
  font-weight: 600;
  color: #1C1C1E;
  margin-left: 2px;
}

.hero-remaining-text {
  font-size: 14px;
  color: #8E8E93;
  margin-top: 6px;
  margin-bottom: 16px;
}

/* 充电进度胶囊条 */
.charging-capsule-bar {
  height: 38px;
  border-radius: 999px;
  background: #DCFCE7;
  position: relative;
  overflow: hidden;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.04);
}

.charging-fill-track {
  height: 100%;
  background: #34C759;
  border-radius: 999px;
  display: flex;
  align-items: center;
  padding-left: 16px;
  gap: 6px;
  color: #FFFFFF;
  transition: width 0.3s ease;
}

.charging-bolt {
  display: block;
}

.charging-text {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: -0.1px;
}

/* 分组标题 */
.section-sub-title {
  font-size: 13px;
  color: #8E8E93;
  font-weight: 500;
  margin: 16px 4px 8px 4px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.info-icon-btn {
  background: none;
  border: none;
  font-size: 13px;
  color: #8E8E93;
  cursor: pointer;
  padding: 0 4px;
}

/* 模式双选卡片 */
.battery-modes-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 12px;
}

.mode-select-card {
  background: #F8F8FA;
  border-radius: 16px;
  padding: 16px 14px;
  border: 2px solid transparent;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
}

.mode-select-card.selected {
  background: #FFFFFF;
  border-color: #007AFF;
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.08);
}

.mode-icon-wrap {
  margin-bottom: 12px;
}

.mode-name {
  font-size: 15px;
  font-weight: 600;
  color: #1C1C1E;
  margin-bottom: 4px;
}

.mode-name.active {
  color: #007AFF;
}

.mode-time {
  font-size: 12px;
  color: #8E8E93;
}

/* 设置卡片容器 */
.settings-card {
  background: #FFFFFF;
  border-radius: 16px;
  margin-bottom: 12px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.03);
}

/* 图表容器大卡片 */
.chart-container-card {
  background: #FFFFFF;
  border-radius: 16px;
  padding: 18px 16px;
  margin-bottom: 12px;
  border: 1px solid rgba(0, 0, 0, 0.03);
}

.usage-header-row {
  margin-bottom: 14px;
}

.usage-subtitle {
  font-size: 12px;
  color: #8E8E93;
  margin-bottom: 2px;
}

.usage-title {
  font-size: 17px;
  font-weight: 700;
  color: #1C1C1E;
}

/* 分段切换按钮组 */
.segmented-control-bar {
  display: flex;
  background: #F2F2F7;
  border-radius: 10px;
  padding: 2px;
  margin-bottom: 20px;
}

.segment-btn {
  flex: 1;
  padding: 7px 0;
  font-size: 13px;
  font-weight: 500;
  border: none;
  background: transparent;
  color: #8E8E93;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.segment-btn.active {
  background: #FFFFFF;
  color: #1C1C1E;
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.chart-section-title {
  font-size: 14px;
  font-weight: 600;
  color: #1C1C1E;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.info-mark {
  font-size: 12px;
  color: #8E8E93;
}

/* 柱形电量图 */
.battery-level-chart {
  display: flex;
  flex-direction: column;
}

.chart-bars-wrap {
  display: flex;
  height: 100px;
  position: relative;
  border-bottom: 1px dashed #E5E5EA;
}

.chart-y-axis {
  width: 44px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  font-size: 10px;
  color: #AEAEB2;
  padding-bottom: 2px;
}

.chart-bars-content {
  flex: 1;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: 0 4px;
}

.bar-col {
  width: 4px;
  border-radius: 2px 2px 0 0;
}

.bar-col.blue { background: #3B82F6; }
.bar-col.green { background: #10B981; }

.chart-x-axis {
  display: flex;
  justify-content: space-between;
  padding-left: 44px;
  padding-right: 4px;
  margin-top: 6px;
  font-size: 10px;
  color: #AEAEB2;
}

/* 活动时长图例 */
.activity-legend-row {
  display: flex;
  gap: 24px;
  margin-bottom: 14px;
}

.legend-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.dot-legend {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  display: inline-block;
}

.dot-screen-on { background: #3B82F6; }
.dot-screen-off { background: #93C5FD; }

.legend-text {
  font-size: 11px;
  color: #8E8E93;
}

.legend-val {
  font-size: 14px;
  font-weight: 600;
  color: #1C1C1E;
}

.activity-bars .act-col {
  width: 14px;
  border-radius: 3px 3px 0 0;
  background: #3B82F6;
}

.act-col.col-1 { height: 28%; }
.act-col.col-2 { height: 65%; }
.act-col.col-3 { height: 90%; }
.act-col.col-4 { height: 42%; }
.act-col.col-5 { height: 80%; }
.act-col.col-6 { height: 15%; }

/* 应用图标复用：官方应用图标类 */
.app-rank-icon {
  width: 38px;
  height: 38px;
  border-radius: 9px;
  object-fit: contain;
  display: block;
  flex: none;
  margin-right: 14px;
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
