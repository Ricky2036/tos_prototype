<script setup>
import { computed } from 'vue'
import { useOs16IslandStore } from '../../../../stores/os16IslandStore'

import iconHangup from '../../../../assets/island/base/icon_hangup.svg'
import iconAnswer from '../../../../assets/island/base/icon_answer.svg'

const store = useOs16IslandStore()

const isSpeaker = computed(() => store.baseTemplateState?.isCallSpeaker ?? false)

function onHangup() {
  store.closeTemplate()
}

function onToggleSpeaker() {
  store.toggleCallSpeaker()
}
</script>

<template>
  <div class="os16-base-card" role="region" aria-label="电话通话实时卡片">
    <!-- 左侧联系人姓名与电话号码 -->
    <div class="contact-info-left">
      <div class="contact-name">Gdragon</div>
      <div class="contact-number">130 3987 9876</div>
    </div>

    <!-- 右侧通话操作按键：红底挂断 + 绿底免提/接听 -->
    <div class="card-actions">
      <!-- 挂断按键 (红底) -->
      <button class="call-btn btn-hangup" @click.stop="onHangup" title="挂断电话">
        <img :src="iconHangup" alt="挂断" class="btn-svg" />
      </button>

      <!-- 免提/接听按键 (绿底) -->
      <button
        class="call-btn btn-speaker"
        :class="{ active: isSpeaker }"
        @click.stop="onToggleSpeaker"
        title="开启/关闭免提"
      >
        <img :src="iconAnswer" alt="免提" class="btn-svg" />
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
  padding: 12px 18px;
  background: transparent;
  border-radius: 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  user-select: none;
  overflow: hidden;
}

.contact-info-left {
  display: flex;
  flex-direction: column;
}

.contact-name {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.25;
  color: #ffffff;
  letter-spacing: -0.2px;
}

.contact-number {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  font-size: 13px;
  font-weight: 400;
  line-height: 1.25;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 3px;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.2px;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 14px;
}

.call-btn {
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
  transition: transform 0.15s ease, filter 0.15s ease;
}

.call-btn:active {
  transform: scale(0.92);
}

.btn-hangup {
  background: #f54240;
  box-shadow: none;
}

.btn-hangup:hover {
  filter: brightness(1.1);
}

.btn-speaker {
  background: #28cc71;
  box-shadow: none;
}

.btn-speaker:hover {
  filter: brightness(1.1);
}

.btn-speaker.active {
  background: #22b362;
}

.btn-svg {
  display: block;
}
</style>
