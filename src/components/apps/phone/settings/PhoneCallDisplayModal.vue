<script setup>
import { usePhoneStore } from '../../../../stores/phoneStore'

const phoneStore = usePhoneStore()
const emit = defineEmits(['back'])
</script>

<template>
  <div class="phone-settings-subpage">
    <div class="subpage-header">
      <button class="back-btn" @click="emit('back')">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#1C1C1E" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
      <div class="header-title">来电显示</div>
    </div>

    <div class="subpage-body">
      <div class="display-modes-container">
        <!-- 模式 1：弹窗显示 -->
        <div
          class="mode-card"
          :class="{ active: phoneStore.callDisplayMode === 'banner' }"
          @click="phoneStore.callDisplayMode = 'banner'"
        >
          <div class="card-mockup-frame">
            <!-- 灵动岛弹窗模拟 -->
            <div class="island-banner-mock">
              <div class="island-btn red"></div>
              <div class="island-btn green"></div>
            </div>
          </div>
          <div class="mode-label">弹窗显示</div>
          <div class="mode-radio" :class="{ checked: phoneStore.callDisplayMode === 'banner' }">
            <div v-if="phoneStore.callDisplayMode === 'banner'" class="radio-dot"></div>
          </div>
        </div>

        <!-- 模式 2：全屏显示 -->
        <div
          class="mode-card"
          :class="{ active: phoneStore.callDisplayMode === 'fullscreen' }"
          @click="phoneStore.callDisplayMode = 'fullscreen'"
        >
          <div class="card-mockup-frame full-frame">
            <div class="full-mockup-top"></div>
            <div class="full-call-actions">
              <div class="full-btn red"></div>
              <div class="full-btn green"></div>
            </div>
          </div>
          <div class="mode-label">全屏显示</div>
          <div class="mode-radio" :class="{ checked: phoneStore.callDisplayMode === 'fullscreen' }">
            <div v-if="phoneStore.callDisplayMode === 'fullscreen'" class="radio-dot"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.phone-settings-subpage {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #FFFFFF;
  z-index: 60;
  display: flex;
  flex-direction: column;
}

.subpage-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  gap: 12px;
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.05);
}

.back-btn {
  background: none;
  border: none;
  padding: 6px;
  cursor: pointer;
  display: flex;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: #1C1C1E;
}

.subpage-body {
  flex: 1;
  padding: 40px 20px;
}

.display-modes-container {
  display: flex;
  gap: 20px;
  justify-content: center;
}

.mode-card {
  flex: 1;
  max-width: 170px;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}

.card-mockup-frame {
  width: 100%;
  height: 250px;
  border: 2px solid #E5E7EB;
  border-radius: 28px;
  background: #FFFFFF;
  padding: 12px 10px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03);
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: border-color 0.18s ease;
}

.mode-card.active .card-mockup-frame {
  border-color: #00C853;
}

/* 灵动岛弹窗模拟 */
.island-banner-mock {
  width: 100%;
  height: 32px;
  background: #000000;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  padding: 0 10px;
}

.island-btn {
  width: 16px;
  height: 16px;
  border-radius: 50%;
}
.island-btn.red { background: #EF4444; }
.island-btn.green { background: #10B981; }

/* 全屏模拟 */
.full-frame {
  justify-content: space-between;
}
.full-mockup-top {
  width: 50%;
  height: 12px;
  background: #E5E7EB;
  border-radius: 6px;
}
.full-call-actions {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}
.full-btn {
  width: 24px;
  height: 24px;
  border-radius: 50%;
}
.full-btn.red { background: #EF4444; }
.full-btn.green { background: #10B981; }

.mode-label {
  font-size: 15px;
  font-weight: 500;
  color: #1C1C1E;
  margin: 16px 0 10px;
}

.mode-radio {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid #D1D1D6;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.mode-radio.checked {
  border-color: #00C853;
}

.radio-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #00C853;
}
</style>
