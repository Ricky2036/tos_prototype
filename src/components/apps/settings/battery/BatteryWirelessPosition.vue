<script setup>
/**
 * 无线充电感应位置（真机：充电设置 → 无线充电感应位置）
 * 全屏半透明模态：标题 + 说明 + 大圆闪电示意图 + 底部圆形关闭键。
 * 证据：`.local-evidence/SET-BAT-01/07-wireless-position.*`
 */
const emit = defineEmits(['back'])
</script>

<template>
  <div class="wireless-overlay" @click.self="emit('back')">
    <div class="wo-title">无线充电感应位置</div>
    <div class="wo-desc">请将手机反转至背面，将图示中心与无线充电器中心对准，充电体验更佳。</div>

    <div class="wo-figure">
      <span class="wo-ring"></span>
      <svg class="wo-bolt" width="96" height="96" viewBox="0 0 24 24" fill="none">
        <path d="M13.2 2.4L5.6 13.1H11L10.2 21.6L18.4 10.4H12.7L13.2 2.4Z" fill="#C7C7CC" />
      </svg>
    </div>

    <button type="button" class="wo-close" aria-label="关闭" @click="emit('back')">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M6 6L18 18M18 6L6 18" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.wireless-overlay {
  position: absolute;
  inset: 0;
  z-index: 40;
  background: rgba(0, 0, 0, 0.72);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: calc(var(--safe-top, 0px) + 46px) 32px 40px;
  color: #FFFFFF;
}

.wo-title { font-size: 26px; font-weight: 700; letter-spacing: -0.4px; }

.wo-desc {
  font-size: 15px;
  line-height: 24px;
  color: rgba(255, 255, 255, 0.82);
  margin-top: 18px;
  max-width: 300px;
}

.wo-figure {
  position: relative;
  flex: 1;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.wo-ring {
  position: absolute;
  width: 285px;
  height: 285px;
  border-radius: 50%;
  border: 7px solid rgba(199, 199, 204, 0.55);
}

.wo-bolt { position: relative; }

.wo-close {
  width: 62px;
  height: 62px;
  border-radius: 50%;
  border: none;
  background: rgba(120, 120, 128, 0.36);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin-bottom: 16px;
}
</style>
