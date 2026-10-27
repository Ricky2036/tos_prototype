<script setup>
import { computed } from 'vue'
import { useOs16IslandStore } from '../../../../stores/os16IslandStore'

import iconVoiceRec from '../../../../assets/island/base/icon_voice_rec.svg'

const store = useOs16IslandStore()

function onStop() {
  store.closeTemplate()
}
</script>

<template>
  <div class="os16-base-card" role="region" aria-label="语音录音实时卡片">
    <!-- 左侧声波图标 (纯矢量声波) -->
    <div class="card-icon-wrap">
      <img :src="iconVoiceRec" alt="录音" class="icon-svg" />
    </div>

    <!-- 中部动态计时排版 -->
    <div class="card-text-col">
      <div class="main-title">29:07</div>
      <div class="sub-text">Voice Recording...</div>
    </div>

    <!-- 右侧结束操作按键 (严格 42x42 纯圆) -->
    <div class="card-actions">
      <button class="act-btn btn-stop" @click.stop="onStop" title="结束录音">
        <div class="stop-square"></div>
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
  user-select: none;
  overflow: hidden;
}

.card-icon-wrap {
  width: 36px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: transparent;
}

.icon-svg {
  width: 36px;
  height: 30px;
  display: block;
}

.card-text-col {
  margin-left: 14px;
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.main-title {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.25;
  color: #ffffff;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.2px;
}

.sub-text {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  font-size: 12.5px;
  font-weight: 400;
  line-height: 1.25;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-actions {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  margin-left: 12px;
}

.act-btn {
  width: 42px;
  height: 42px;
  min-width: 42px;
  min-height: 42px;
  max-width: 42px;
  max-height: 42px;
  border-radius: 50%;
  border: none;
  outline: none;
  padding: 0;
  margin: 0;
  box-sizing: border-box;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s ease, background 0.15s ease;
}

.act-btn:active {
  transform: scale(0.92);
}

.btn-stop {
  background: #fc4c3f;
  box-shadow: none;
}

.btn-stop:hover {
  background: #ff5e52;
}

.stop-square {
  width: 14.17px;
  height: 14.17px;
  background: #ffffff;
  border-radius: 2.5px;
}
</style>
