<script setup>
import { usePhoneStore } from '../../../../stores/phoneStore'
import GlassNavBar from '../../../ui/GlassNavBar.vue'
import bannerImg from '../../../../assets/img/phone_settings/call_display_banner.png'
import fullImg from '../../../../assets/img/phone_settings/call_display_full.png'

const phoneStore = usePhoneStore()
const emit = defineEmits(['back'])
</script>

<template>
  <div class="phone-settings-subpage">
    <GlassNavBar overlay title="来电显示" @back="emit('back')" />

    <div class="subpage-body">
      <!-- 统一白色大卡片容器包裹两个手机模型、标题文案与单选按钮 -->
      <div class="settings-card call-display-big-card">
        <div class="display-options-row">
          <!-- 模式 1：弹窗显示 -->
          <div
            class="display-option-col"
            @click="phoneStore.callDisplayMode = 'banner'"
          >
            <div class="model-frame">
              <img :src="bannerImg" class="phone-img" alt="弹窗显示" />
            </div>
            <div class="option-title">弹窗显示</div>
            <div class="custom-radio" :class="{ checked: phoneStore.callDisplayMode === 'banner' }">
              <div v-if="phoneStore.callDisplayMode === 'banner'" class="radio-core"></div>
            </div>
          </div>

          <!-- 模式 2：全屏显示 -->
          <div
            class="display-option-col"
            @click="phoneStore.callDisplayMode = 'fullscreen'"
          >
            <div class="model-frame">
              <img :src="fullImg" class="phone-img" alt="全屏显示" />
            </div>
            <div class="option-title">全屏显示</div>
            <div class="custom-radio" :class="{ checked: phoneStore.callDisplayMode === 'fullscreen' }">
              <div v-if="phoneStore.callDisplayMode === 'fullscreen'" class="radio-core"></div>
            </div>
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
  background: #F0F1F2;
  z-index: 60;
  display: flex;
  flex-direction: column;
}

.subpage-body {
  flex: 1;
  overflow-y: auto;
  padding: calc(var(--nav-h) + 12px) 16px 24px;
  -webkit-overflow-scrolling: touch;
}

.call-display-big-card {
  background: #FFFFFF;
  border-radius: 20px;
  padding: 24px 20px 22px;
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.display-options-row {
  display: flex;
  justify-content: center;
  gap: 24px;
}

.display-option-col {
  flex: 1;
  max-width: 156px;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  user-select: none;
  transition: transform 0.1s ease;
}

.display-option-col:active {
  transform: scale(0.98);
}

.model-frame {
  width: 100%;
  max-width: 122px;
  aspect-ratio: 329 / 644;
  display: flex;
  align-items: center;
  justify-content: center;
}

.phone-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.option-title {
  font-size: 15px;
  font-weight: 600;
  color: #1C1C1E;
  margin-top: 18px;
  margin-bottom: 12px;
  text-align: center;
}

.custom-radio {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid #D1D5DB;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.15s ease;
}

.custom-radio.checked {
  border-color: #00C853;
}

.radio-core {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: #00C853;
}
</style>
