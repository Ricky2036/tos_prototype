<script setup>
import { computed, ref } from 'vue'
import { useI18nStore } from '../../../stores/i18nStore'
import { msgText } from './msgData'
import MsgTopBar from './components/MsgTopBar.vue'

/**
 * 骚扰拦截（真机跳系统组件 `com.android.server.telecomui` 的 BlockListActivity）
 * 两个 Tab（通话 / 短信）+ 空态插画；原型内直接落地，避免点「骚扰拦截」没反应。
 */
const i18n = useI18nStore()
const t = computed(() => msgText(i18n.locale))
const emit = defineEmits(['back'])

const tab = ref('sms')
</script>

<template>
  <div class="msg-spam-page" data-msg-page="spam">
    <MsgTopBar :title="t('spamBlock')" @back="emit('back')">
      <template #right>
        <button class="more-btn" type="button">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#1E1E20">
            <circle cx="12" cy="5" r="1.7" />
            <circle cx="12" cy="12" r="1.7" />
            <circle cx="12" cy="19" r="1.7" />
          </svg>
        </button>
      </template>
    </MsgTopBar>

    <div class="spam-tabs">
      <button class="spam-tab" :class="{ on: tab === 'call' }" type="button" data-msg-spam-tab="call" @click="tab = 'call'">
        {{ t('callTab') }}
      </button>
      <button class="spam-tab" :class="{ on: tab === 'sms' }" type="button" data-msg-spam-tab="sms" @click="tab = 'sms'">
        {{ t('smsTab') }}
      </button>
    </div>

    <div class="spam-body">
      <div class="spam-empty">
        <svg width="118" height="96" viewBox="0 0 118 96" fill="none">
          <defs>
            <linearGradient id="spam-bubble-a" x1="30" y1="8" x2="86" y2="70" gradientUnits="userSpaceOnUse">
              <stop stop-color="#DCE2EE" />
              <stop offset="1" stop-color="#C3CCDF" />
            </linearGradient>
            <linearGradient id="spam-bubble-b" x1="10" y1="40" x2="66" y2="92" gradientUnits="userSpaceOnUse">
              <stop stop-color="#E6EAF3" />
              <stop offset="1" stop-color="#CDD5E4" />
            </linearGradient>
          </defs>
          <path d="M38 10h34c9.4 0 17 7.2 17 16.2v14.6c0 9-7.6 16.2-17 16.2H60l-9.4 8.4v-8.4H38c-9.4 0-17-7.2-17-16.2V26.2C21 17.2 28.6 10 38 10z" fill="url(#spam-bubble-a)" />
          <circle cx="46" cy="33" r="3.1" fill="#fff" />
          <circle cx="56" cy="33" r="3.1" fill="#fff" />
          <circle cx="66" cy="33" r="3.1" fill="#fff" />
          <path d="M22 44h26c8.3 0 15 6.4 15 14.4v11.4c0 8-6.7 14.4-15 14.4H43l-8.2 7.4V77.6H22c-8.3 0-15-6.4-15-14.4V58.4C7 50.4 13.7 44 22 44z" fill="url(#spam-bubble-b)" />
        </svg>
        <div class="spam-text">{{ t('blockedEmpty') }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.msg-spam-page {
  height: 100%;
  background: #f0f1f2;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.more-btn {
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 50%;
  background: #fdfdfd;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05), 0 4px 10px rgba(0, 0, 0, 0.045);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.spam-tabs {
  flex: none;
  display: flex;
  padding: 6px 40px 0;
}
.spam-tab {
  flex: 1;
  height: 44px;
  border: none;
  background: transparent;
  font-size: 17px;
  color: #1e1e20;
  position: relative;
  cursor: pointer;
}
.spam-tab.on { color: #3375f6; font-weight: 500; }
.spam-tab.on::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: 2px;
  width: 30px;
  height: 3px;
  border-radius: 2px;
  background: #3375f6;
  transform: translateX(-50%);
}
.spam-body {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-bottom: 90px;
}
.spam-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
}
.spam-text {
  font-size: 15px;
  color: #3d3d3f;
}
</style>
