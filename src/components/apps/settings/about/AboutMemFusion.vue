<script setup>
import { computed } from 'vue'
import { useDeviceStore } from '../../../../stores/deviceStore'
import ListCell from '../../../ui/ListCell.vue'
import ToggleSwitch from '../../../ui/ToggleSwitch.vue'

const emit = defineEmits(['back'])
const deviceStore = useDeviceStore()

const sizeOptions = [
  { size: 3, label: '+3.00 GB' },
  { size: 6, label: '+6.00 GB' },
  { size: 12, label: '+12.00 GB' }
]

const totalCapacity = computed(() => {
  if (!deviceStore.memFusionEnabled) {
    return deviceStore.physicalRam
  }
  return deviceStore.physicalRam + deviceStore.memFusionSize
})

function handleToggle(val) {
  deviceStore.setMemFusionEnabled(val)
}

function handleSelectSize(sz) {
  if (!deviceStore.memFusionEnabled) return
  deviceStore.setMemFusionSize(sz)
}
</script>

<template>
  <div class="memfusion-page">
    <!-- 顶部导航栏 -->
    <div class="sub-nav-bar">
      <button class="nav-round-btn" aria-label="返回" type="button" @click="emit('back')">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M19 12H5M5 12L12 5M5 12L12 19" stroke="#1C1C1E" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <div class="nav-title">MemFusion 融合内存</div>
    </div>

    <!-- 滚动内容区 -->
    <div class="sub-scroll-body scrollable">
      <!-- 内存容量概览卡片 -->
      <div class="capacity-overview-card">
        <div class="overview-header">
          <div class="overview-title">可用运行内存</div>
          <div class="overview-value">
            <span class="num">{{ totalCapacity }}</span>
            <span class="unit">.00 GB</span>
          </div>
        </div>

        <!-- 进度条结构图 -->
        <div class="ram-track-wrap">
          <div class="ram-track">
            <div class="ram-segment physical" :style="{ width: `${(deviceStore.physicalRam / 24) * 100}%` }">
              <span class="segment-label">物理内存 {{ deviceStore.physicalRam }} GB</span>
            </div>
            <div
              v-if="deviceStore.memFusionEnabled"
              class="ram-segment fusion"
              :style="{ width: `${(deviceStore.memFusionSize / 24) * 100}%` }"
            >
              <span class="segment-label">融合 +{{ deviceStore.memFusionSize }} GB</span>
            </div>
          </div>
        </div>

        <div class="legend-row">
          <div class="legend-item">
            <span class="legend-dot dot-physical"></span>
            <span>物理运存 {{ deviceStore.physicalRam }}.00 GB</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot dot-fusion"></span>
            <span>
              {{ deviceStore.memFusionEnabled ? `融合扩展 +${deviceStore.memFusionSize}.00 GB` : '融合扩展已停用' }}
            </span>
          </div>
        </div>
      </div>

      <!-- 功能主开关 -->
      <div class="settings-card">
        <ListCell title="MemFusion 融合内存" subtitle="智能调配存储空间，提升后台多任务保活率" last>
          <template #right>
            <ToggleSwitch
              :model-value="deviceStore.memFusionEnabled"
              @update:model-value="handleToggle"
            />
          </template>
        </ListCell>
      </div>

      <!-- 扩展档位选择 -->
      <div class="group-header">扩展容量选择</div>
      <div class="settings-card" :class="{ 'card-disabled': !deviceStore.memFusionEnabled }">
        <ListCell
          v-for="(opt, idx) in sizeOptions"
          :key="opt.size"
          :title="opt.label"
          clickable
          :last="idx === sizeOptions.length - 1"
          @click="handleSelectSize(opt.size)"
        >
          <template v-if="deviceStore.memFusionEnabled && deviceStore.memFusionSize === opt.size" #right>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M5 13L9 17L19 7" stroke="#0077FF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </template>
        </ListCell>
      </div>

      <!-- 技术说明说明卡（四边细边框，无单侧竖线） -->
      <div class="info-note-card">
        <div class="note-title">关于融合内存</div>
        <div class="note-content">
          融合内存技术在系统物理运行内存不足时，将部分闲置机身存储空间划分作为虚拟内存调度使用。该功能能够明显降低后台大型应用与常驻工具的被查杀几率，减少再次切换进入时的冷启动重载时间。调整扩展容量后立即在系统中生效。
        </div>
      </div>

      <div class="scroll-bottom-spacer"></div>
    </div>
  </div>
</template>

<style scoped>
.memfusion-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #F4F5F7;
  position: relative;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang SC", "Segoe UI", Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
}

.sub-nav-bar {
  position: sticky;
  top: 0;
  width: 100%;
  height: calc(var(--safe-top, 0px) + 52px);
  padding: var(--safe-top, 0px) 16px 0 16px;
  display: flex;
  align-items: center;
  background: #F4F5F7;
  z-index: 10;
  box-sizing: border-box;
}

.nav-round-btn {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: none;
  background: #EAECEF;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex: none;
  transition: background 0.15s ease, transform 0.1s ease;
}

.nav-round-btn:active {
  background: #DFE2E6;
  transform: scale(0.96);
}

.nav-title {
  font-size: 20px;
  font-weight: 600;
  color: #111111;
  letter-spacing: -0.3px;
  margin-left: 14px;
}

.sub-scroll-body {
  flex: 1;
  padding: 12px 16px 32px 16px;
  overflow-y: auto;
  overflow-x: hidden;
  box-sizing: border-box;
  -webkit-overflow-scrolling: touch;
}

/* 概览卡片 */
.capacity-overview-card {
  background: #FFFFFF;
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 14px;
  border: 1px solid rgba(0, 0, 0, 0.04);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
}

.overview-header {
  margin-bottom: 16px;
}

.overview-title {
  font-size: 13.5px;
  color: #8E8E93;
  margin-bottom: 4px;
}

.overview-value {
  color: #111111;
  display: flex;
  align-items: baseline;
}

.overview-value .num {
  font-size: 32px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.5px;
}

.overview-value .unit {
  font-size: 16px;
  font-weight: 500;
  margin-left: 4px;
  color: #8E8E93;
}

.ram-track-wrap {
  margin-bottom: 14px;
}

.ram-track {
  width: 100%;
  height: 28px;
  background: #EAECEF;
  border-radius: 14px;
  overflow: hidden;
  display: flex;
  position: relative;
}

.ram-segment {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: width 0.3s cubic-bezier(0.2, 0.9, 0.4, 1);
  overflow: hidden;
  white-space: nowrap;
}

.ram-segment.physical {
  background: #0077FF;
  color: #FFFFFF;
}

.ram-segment.fusion {
  background: #34C759;
  color: #FFFFFF;
}

.segment-label {
  font-size: 11px;
  font-weight: 500;
  padding: 0 6px;
  text-overflow: ellipsis;
  overflow: hidden;
}

.legend-row {
  display: flex;
  gap: 18px;
  font-size: 12.5px;
  color: #636366;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.dot-physical {
  background: #0077FF;
}

.dot-fusion {
  background: #34C759;
}

.settings-card {
  background: #FFFFFF;
  border-radius: 20px;
  margin-bottom: 14px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.card-disabled {
  opacity: 0.45;
  pointer-events: none;
}

.group-header {
  font-size: 13px;
  font-weight: 500;
  color: #8E8E93;
  margin: 16px 0 8px 12px;
}

/* 规整的说明卡，严禁左侧竖线 */
.info-note-card {
  background: #FFFFFF;
  border-radius: 18px;
  padding: 16px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
  margin-top: 8px;
}

.note-title {
  font-size: 14px;
  font-weight: 600;
  color: #1C1C1E;
  margin-bottom: 8px;
}

.note-content {
  font-size: 13px;
  color: #636366;
  line-height: 1.6;
}

.scroll-bottom-spacer {
  height: 48px;
}
</style>
