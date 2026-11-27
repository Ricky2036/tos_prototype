<script setup>
import { computed } from 'vue'
import { useI18nStore } from '../../../../stores/i18nStore'
import { msgText } from '../msgData'
import MsgTopBar from '../components/MsgTopBar.vue'

/** 关于（真机 AboutActivity）：单行「版本号 / 17.0.0.078」 */
const i18n = useI18nStore()
const t = computed(() => msgText(i18n.locale))
const emit = defineEmits(['back'])
</script>

<template>
  <div class="msg-sub-page" data-msg-page="about">
    <MsgTopBar :title="t('about')" @back="emit('back')" />
    <div class="sub-scroll scrollable">
      <div class="card">
        <div class="row" data-msg-version>
          <div class="texts">
            <div class="title">{{ t('version') }}</div>
            <div class="value">17.0.0.078</div>
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
  justify-content: space-between;
  padding: 12px 16px;
  min-height: 62px;
  box-sizing: border-box;
}
.title { font-size: 16px; line-height: 22px; color: #000; }
.value { font-size: 13px; line-height: 18px; color: #8a8a8c; margin-top: 2px; }
</style>
