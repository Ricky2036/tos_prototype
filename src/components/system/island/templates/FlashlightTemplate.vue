<script setup>
import { computed } from 'vue'
import { useOs16IslandStore } from '../../../../stores/os16IslandStore'

const store = useOs16IslandStore()

const isOn = computed(() => store.baseTemplateState?.isFlashlightOn ?? false)

function onToggle() {
  store.toggleFlashlight()
}
</script>

<template>
  <div class="os16-base-card" @click.stop="onToggle" role="region" aria-label="手电筒实时卡片">
    <!-- 左侧手电筒图标与状态指示 (严格对应 Figma 298:18670 原厂矢量) -->
    <div class="fl-left">
      <div class="icon-wrap" :class="{ 'is-lit': isOn }">
        <svg class="icon-svg" :class="{ 'is-lit-svg': isOn }" viewBox="218 949 14 30" fill="none">
          <defs>
            <linearGradient id="fl_lit_grad" x1="224.999" y1="949" x2="224.999" y2="979" gradientUnits="userSpaceOnUse">
              <stop stop-color="#FFF275"/>
              <stop offset="0.3" stop-color="#FFD600"/>
              <stop offset="1" stop-color="#FF9900"/>
            </linearGradient>
            <linearGradient id="fl_dim_grad" x1="224.999" y1="949" x2="224.999" y2="979" gradientUnits="userSpaceOnUse">
              <stop stop-color="#8E8E93"/>
              <stop offset="1" stop-color="#636366"/>
            </linearGradient>
            <filter id="fl_glow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="0" stdDeviation="3.5" flood-color="#FFD600" flood-opacity="0.8"/>
            </filter>
          </defs>
          <path
            d="M231.993 954C231.983 954.804 231.953 955.344 231.851 955.868C231.719 956.543 231.5 957.198 231.201 957.816C230.864 958.514 230.389 959.147 229.439 960.413L229.319 960.573C229.201 960.732 229.141 960.811 229.099 960.898C229.061 960.976 229.034 961.057 229.018 961.142C228.999 961.237 228.999 961.335 228.999 961.533V975.8C228.999 976.92 228.999 977.48 228.781 977.908C228.59 978.284 228.283 978.59 227.907 978.782C227.479 979 226.919 979 225.799 979H224.199C223.079 979 222.519 979 222.091 978.782C221.715 978.59 221.409 978.284 221.217 977.908C220.999 977.48 220.999 976.92 220.999 975.8V961.533C220.999 961.335 220.999 961.237 220.98 961.142C220.964 961.057 220.937 960.976 220.899 960.898C220.857 960.811 220.797 960.732 220.679 960.573L220.559 960.413C219.609 959.147 219.134 958.514 218.797 957.816C218.498 957.198 218.279 956.543 218.147 955.868C218.045 955.344 218.015 954.804 218.005 954H231.993ZM224.999 963C224.171 963 223.499 963.672 223.499 964.5V967.5C223.499 968.328 224.171 969 224.999 969C225.827 969 226.499 968.328 226.499 967.5V964.5C226.499 963.672 225.827 963 224.999 963ZM224.999 966C225.551 966 225.999 966.448 225.999 967V967.5C225.999 968.052 225.551 968.5 224.999 968.5C224.447 968.5 223.999 968.052 223.999 967.5V967C223.999 966.448 224.447 966 224.999 966ZM228.799 949C229.919 949 230.479 949 230.907 949.218C231.283 949.41 231.59 949.716 231.781 950.092C231.986 950.493 231.997 951.012 231.998 952H218C218.001 951.012 218.012 950.493 218.217 950.092C218.409 949.716 218.715 949.41 219.091 949.218C219.519 949 220.079 949 221.199 949H228.799Z"
            :fill="isOn ? 'url(#fl_lit_grad)' : 'url(#fl_dim_grad)'"
            :filter="isOn ? 'url(#fl_glow)' : 'none'"
          />
        </svg>
      </div>

      <div class="text-col">
        <div class="main-title">{{ isOn ? 'Open' : 'Closed' }}</div>
        <div class="sub-text">Flashlight</div>
      </div>
    </div>

    <!-- 右侧操作胶囊按键 -->
    <div class="card-actions">
      <button
        class="capsule-btn"
        :class="{ 'is-on-btn': isOn }"
        @click.stop="onToggle"
        title="开启/关闭手电筒"
      >
        {{ isOn ? 'Close' : 'Open' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.os16-base-card {
  position: relative;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  padding: 12px 16px;
  background: transparent;
  border-radius: 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  user-select: none;
  cursor: pointer;
  overflow: hidden;
}

.fl-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.icon-wrap {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease;
  flex-shrink: 0;
}

.icon-svg {
  width: 14px;
  height: 28px;
  display: block;
  transition: transform 0.2s ease, filter 0.2s ease;
}

.icon-svg.is-lit-svg {
  filter: drop-shadow(0 0 10px rgba(255, 214, 0, 0.85));
}

.text-col {
  display: flex;
  flex-direction: column;
}

.main-title {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.25;
  color: #ffffff;
  letter-spacing: -0.2px;
}

.sub-text {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  font-size: 13px;
  font-weight: 400;
  line-height: 1.25;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 3px;
}

.card-actions {
  display: flex;
  align-items: center;
}

.capsule-btn {
  width: 56px;
  height: 32px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.25);
  border: none;
  outline: none;
  color: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease, transform 0.1s ease, color 0.15s ease;
}

.capsule-btn:hover {
  background: rgba(255, 255, 255, 0.32);
}

.capsule-btn:active {
  transform: scale(0.94);
}

.capsule-btn.is-on-btn {
  background: #ffffff;
  color: #000000;
}
</style>
