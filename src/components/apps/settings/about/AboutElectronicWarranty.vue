<script setup>
import GlassNavBar from '../../../ui/GlassNavBar.vue'
import { computed } from 'vue'
import { useDeviceStore } from '../../../../stores/deviceStore'
import ListCell from '../../../ui/ListCell.vue'

const emit = defineEmits(['back'])
const deviceStore = useDeviceStore()

// 计算剩余保修天数
const remainingDays = computed(() => {
  const target = new Date('2027-08-14').getTime()
  const now = new Date('2026-10-28').getTime()
  const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24))
  return Math.max(0, diff)
})
</script>

<template>
  <div class="warranty-card-page">
    <!-- 顶部导航栏 -->
    <GlassNavBar title="电子保修卡" @back="emit('back')" />

    <!-- 滚动区域 -->
    <div class="sub-scroll-body scrollable">
      <!-- 官方电子保修卡面 -->
      <div class="warranty-hero-card">
        <div class="card-chip-row">
          <div class="warranty-brand">Infinix Care 官方保修</div>
          <div class="warranty-status-badge">保障中</div>
        </div>

        <div class="card-device-name">{{ deviceStore.deviceName }}</div>
        <div class="card-imei">IMEI: {{ deviceStore.imei1 }}</div>

        <div class="card-footer-row">
          <div class="footer-meta">
            <span class="meta-label">质保到期日</span>
            <span class="meta-date">{{ deviceStore.warrantyEndDate }}</span>
          </div>
          <div class="footer-days">
            <span class="days-num">{{ remainingDays }}</span>
            <span class="days-label">天剩余</span>
          </div>
        </div>
      </div>

      <!-- 保修基本信息列表 -->
      <div class="group-header">保修凭证详情</div>
      <div class="settings-card">
        <ListCell title="设备机型" :value="deviceStore.model" />
        <ListCell title="主机状态" value="全国联保已激活" />
        <ListCell title="初次激活时间" :value="deviceStore.warrantyStartDate" />
        <ListCell title="整机质保期限" value="12 个月" />
        <ListCell title="主要部件质保" value="24 个月" last />
      </div>

      <!-- 专属保障权益列表 -->
      <div class="group-header">服务权益保障</div>
      <div class="settings-card">
        <ListCell
          title="官方售后网点检测"
          subtitle="全国联保授权服务中心享终身免费外观与系统检测"
        />
        <ListCell
          title="100% 原厂原装备件"
          subtitle="所有维修及更换部件均通过官方严苛品控认证"
        />
        <ListCell
          title="双向免费双程寄修"
          subtitle="保修期内非人为损坏寄修服务由官方全额承担运费"
          last
        />
      </div>

      <div class="scroll-bottom-spacer"></div>
    </div>
  </div>
</template>

<style scoped>
.warranty-card-page {
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

/* 电子保卡卡面 */
.warranty-hero-card {
  background: linear-gradient(135deg, #2C3038 0%, #17191C 100%);
  border-radius: 20px;
  padding: 22px 20px 20px 20px;
  color: #FFFFFF;
  margin-bottom: 14px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
}

.card-chip-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.warranty-brand {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: #D1D5DB;
}

.warranty-status-badge {
  background: rgba(52, 199, 89, 0.18);
  border: 1px solid rgba(52, 199, 89, 0.4);
  color: #34C759;
  font-size: 12px;
  font-weight: 600;
  padding: 3px 9px;
  border-radius: 12px;
}

.card-device-name {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.3px;
  margin-bottom: 4px;
}

.card-imei {
  font-size: 12.5px;
  color: #9CA3AF;
  font-variant-numeric: tabular-nums;
  margin-bottom: 28px;
}

.card-footer-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  padding-top: 14px;
}

.footer-meta {
  display: flex;
  flex-direction: column;
}

.meta-label {
  font-size: 11.5px;
  color: #9CA3AF;
  margin-bottom: 2px;
}

.meta-date {
  font-size: 14px;
  font-weight: 600;
  color: #F3F4F6;
  font-variant-numeric: tabular-nums;
}

.footer-days {
  text-align: right;
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.days-num {
  font-size: 26px;
  font-weight: 700;
  color: #0077FF;
  font-variant-numeric: tabular-nums;
}

.days-label {
  font-size: 12px;
  color: #9CA3AF;
}

.settings-card {
background: #FFFFFF;
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 14px;
}

.group-header {
  font-size: 13px;
  font-weight: 500;
  color: #8E8E93;
  margin: 16px 0 8px 12px;
}

.scroll-bottom-spacer {
  height: 48px;
}

.warranty-card-page :deep(.lc-right) {
  min-width: 0;
  flex: 1;
  justify-content: flex-end;
}

.warranty-card-page :deep(.lc-value) {
  font-size: 13.5px;
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
