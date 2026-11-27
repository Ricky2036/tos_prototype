<script setup>
import { computed } from 'vue'
import { useI18nStore } from '../../../../stores/i18nStore'
import { msgText } from '../msgData'
import MsgTopBar from '../components/MsgTopBar.vue'

/** SIM 卡短信（真机 SimCardSmsActivity）：一张卡片 + SIM 图标 */
const i18n = useI18nStore()
const t = computed(() => msgText(i18n.locale))
const emit = defineEmits(['back'])
</script>

<template>
  <div class="msg-sub-page" data-msg-page="sim-sms">
    <MsgTopBar :title="t('moreSimSms')" @back="emit('back')" />
    <div class="sub-scroll scrollable">
      <div class="card">
        <div class="row" data-msg-sim-sms>
          <span class="sim-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1E1E20" stroke-width="1.5" stroke-linejoin="round">
              <path d="M6.2 3.4h7.6l4.2 4.2v13c0 .5-.4.9-.9.9H6.2c-.5 0-.9-.4-.9-.9V4.3c0-.5.4-.9.9-.9z" />
              <rect x="8.4" y="10" width="6.6" height="5.4" rx="1.1" />
            </svg>
          </span>
          <div class="texts">
            <div class="title">{{ t('simSmsSub') }}</div>
            <div class="value">+8613200007890</div>
          </div>
          <svg width="9" height="16" viewBox="0 0 9 16" fill="none"><path d="M1.4 1.6L7.4 8l-6 6.4" stroke="#C3C3C5" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.msg-sub-page {
  height: 100%;
  background: #f0f1f2;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.sub-scroll { flex: 1; overflow-y: auto; padding: 6px 16px; }
.card {
  background: #fff;
  border-radius: 14px;
  overflow: hidden;
  margin-top: 6px;
}
.row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 16px;
  min-height: 70px;
  box-sizing: border-box;
}
.sim-icon { flex: none; display: flex; }
.texts { flex: 1; min-width: 0; }
.title { font-size: 16px; line-height: 22px; color: #000; }
.value { font-size: 13px; line-height: 18px; color: #8a8a8c; margin-top: 2px; }
</style>
