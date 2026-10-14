<template>
  <div class="settings-satellite-page">
    <div class="satellite-nav">
      <button class="nav-back-btn" aria-label="返回" data-nav-back @click="emit('back')">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
      </button>
      <div class="nav-title">星链卫星网络</div>
    </div>

    <div class="satellite-scroll-content">
      <!-- 提示胶囊条 -->
      <div class="status-banner">
        <svg class="info-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
        <span>当前未插入支持星链的 SIM 卡。</span>
      </div>

      <!-- 关于卫星连接 -->
      <div class="info-card">
        <div class="card-headline">关于卫星连接</div>
        <div class="card-desc">
          您可以使用特定运营商提供的卫星直连服务来使用短信或者数据服务。
        </div>
      </div>

      <!-- 使用指南与注意事项 -->
      <div class="guide-card">
        <div class="guide-section">
          <div class="card-headline">使用指南</div>

          <div class="guide-item">
            <div class="guide-item-title">1. 自动触发</div>
            <div class="guide-item-text">手机完全没有移动网络时，会自动尝试连接到卫星。</div>
          </div>

          <div class="guide-item">
            <div class="guide-item-title">2. 环境要求</div>
            <div class="guide-item-text">为获得最佳卫星连接信号，请将手机对准天空，确保无建筑物、树木等遮挡。</div>
          </div>

          <div class="guide-item">
            <div class="guide-item-title">3. 功能使用</div>
            <div class="guide-item-text">连接成功后，您可以向任何人发送短信（包括紧急服务），并可在某些特定应用上受限地使用数据。一旦地面移动网络恢复，手机会自动重新连接地面移动网络。</div>
          </div>
        </div>

        <div class="guide-section note-section">
          <div class="card-headline">注意事项</div>

          <div class="guide-item">
            <div class="guide-item-title">1. 地区限制</div>
            <div class="guide-item-text">卫星连接仅在部分地区可用，可查看运营商官网了解详情。</div>
          </div>

          <div class="guide-item">
            <div class="guide-item-title">2. 环境干扰</div>
            <div class="guide-item-text">卫星连接并非一直稳定可用。受天气、建筑物遮挡、卫星移动等因素影响，可能会出现信号不稳定或连接断开的情况。</div>
          </div>

          <div class="guide-item">
            <div class="guide-item-title">3. 资费与套餐</div>
            <div class="guide-item-text">资费与套餐请以运营商公布的政策为准，具体费用及开通方式可咨询运营商。</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const emit = defineEmits(['back'])

function back() {
  emit('back')
  return true
}

defineExpose({ back })
</script>

<style scoped>
.settings-satellite-page {
  position: absolute;
  inset: 0;
  background: #f4f5f7;
  display: flex;
  flex-direction: column;
  z-index: 20;
  color: #111;
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
}

.satellite-nav {
  position: sticky;
  top: 0;
  width: 100%;
  height: calc(var(--safe-top, 0px) + 52px);
  padding: var(--safe-top, 0px) 16px 0 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  background: #f4f5f7;
  flex-shrink: 0;
  z-index: 10;
  box-sizing: border-box;
}

.nav-back-btn {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.04);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #1a1a1a;
  transition: background 0.15s;
}

.nav-back-btn:active {
  background: rgba(0, 0, 0, 0.08);
}

.nav-title {
  font-size: 20px;
  font-weight: 700;
  color: #111;
  letter-spacing: -0.2px;
}

.satellite-scroll-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px 16px 36px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  scrollbar-width: none;
}

.satellite-scroll-content::-webkit-scrollbar {
  display: none;
}

.status-banner {
  background: #eceef1;
  border-radius: 18px;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 13.5px;
  color: #727a84;
}

.info-icon {
  flex-shrink: 0;
  color: #8c939e;
}

.info-card,
.guide-card {
  background: #ffffff;
  border-radius: 22px;
  padding: 20px 18px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(0, 0, 0, 0.03);
}

.card-headline {
  font-size: 17.5px;
  font-weight: 700;
  color: #18191c;
  margin-bottom: 12px;
  letter-spacing: -0.2px;
}

.card-desc {
  font-size: 14px;
  line-height: 1.6;
  color: #555c65;
}

.guide-section {
  display: flex;
  flex-direction: column;
}

.note-section {
  margin-top: 26px;
}

.guide-item {
  margin-top: 12px;
}

.guide-item-title {
  font-size: 15px;
  font-weight: 600;
  color: #1a1c1e;
  margin-bottom: 4px;
}

.guide-item-text {
  font-size: 13.5px;
  line-height: 1.55;
  color: #636a75;
}
</style>
