<script setup>
import { computed } from 'vue'
import { useI18nStore } from '../../../../stores/i18nStore'
import { msgText } from '../msgData'
import MsgTopBar from '../components/MsgTopBar.vue'

/** 更多设置（真机 MoreSettingActivity）：三行两个卡片 */
const i18n = useI18nStore()
const t = computed(() => msgText(i18n.locale))
const emit = defineEmits(['back', 'open'])
</script>

<template>
  <div class="msg-sub-page" data-msg-page="more-settings">
    <MsgTopBar :title="t('moreSettings')" @back="emit('back')" />
    <div class="sub-scroll scrollable">
      <div class="card">
        <div class="row first" data-msg-setting="smsc" @click="emit('external', 'smsc')">
          <span class="title">{{ t('moreSmsc') }}</span>
          <svg width="9" height="16" viewBox="0 0 9 16" fill="none"><path d="M1.4 1.6L7.4 8l-6 6.4" stroke="#C3C3C5" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg>
        </div>
        <div class="row" data-msg-setting="simSms" @click="emit('open', 'simSms')">
          <span class="title">{{ t('moreSimSms') }}</span>
          <svg width="9" height="16" viewBox="0 0 9 16" fill="none"><path d="M1.4 1.6L7.4 8l-6 6.4" stroke="#C3C3C5" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg>
        </div>
      </div>
      <div class="card">
        <div class="row first" data-msg-setting="cellBroadcast" @click="emit('external', 'cellBroadcast')">
          <span class="title">{{ t('moreCellBroadcast') }}</span>
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
  margin-bottom: 18px;
  margin-top: 6px;
}
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 51.9px;
  padding: 0 16px;
  position: relative;
  cursor: pointer;
}
.row::before {
  content: '';
  position: absolute;
  left: 16px;
  right: 16px;
  top: 0;
  height: 1px;
  background: #e0e0e0;
}
.row.first::before { display: none; }
.row:active { background: #fafafa; }
.title { font-size: 16px; color: #000; }
</style>
