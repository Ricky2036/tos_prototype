<script setup>
import { computed, ref } from 'vue'
import { useMessagesStore } from '../../../stores/messagesStore'
import { useI18nStore } from '../../../stores/i18nStore'
import { SETTINGS_GROUPS, msgText } from './msgData'
import MsgTopBar from './components/MsgTopBar.vue'
import MsgSwitch from './components/MsgSwitch.vue'
import SheetOptionPicker from '../../ui/SheetOptionPicker.vue'

/**
 * 短信设置（真机 ApplicationSettingsActivity）
 *
 * 几何：内容左右 16（54 物理）、卡片纯白圆角 14、分组标题 15px #545559、
 * 行高 51.9（带副标题 79.6）、分割线 1px #E0E0E0 且左右各内缩 16。
 */
const store = useMessagesStore()
const i18n = useI18nStore()
const t = computed(() => msgText(i18n.locale))
const emit = defineEmits(['back', 'open'])
const dbDialog = ref(false)

const rows = computed(() => SETTINGS_GROUPS)

const dbOptions = computed(() => [
  { value: 'wlan', label: t.value('dbWlan') },
  { value: 'wlanMobile', label: t.value('dbWlanMobile') },
  { value: 'off', label: t.value('dbOff') }
])

function valueOf(row) {
  if (row.type === 'switch') return ''
  if (row.valueKey) return t.value(row.valueKey)
  return ''
}

function onRow(row) {
  if (row.type === 'switch') {
    store.setSetting(row.id, !store.settings[row.id])
    return
  }
  if (row.id === 'dbUpdate') {
    dbDialog.value = true
    return
  }
  if (row.route) emit('open', row.route)
  if (row.id === 'xmessageService') emit('open', 'xmessage')
  if (row.external) emit('external', row.id)
}

function pickDb(id) {
  store.setSetting('dbUpdatePref', id)
  dbDialog.value = false
}

const dbValue = computed(() => {
  const map = { wlan: t.value('onlyWlan'), wlanMobile: t.value('dbWlanMobile'), off: t.value('dbOff') }
  return map[store.settings.dbUpdatePref] || t.value('onlyWlan')
})
</script>

<template>
  <div class="msg-settings-page" data-msg-page="settings">
    <MsgTopBar :title="t('settingsTitle')" @back="emit('back')" />

    <div class="settings-scroll scrollable">
      <div v-for="group in rows" :key="group.id" class="group">
        <div v-if="group.title" class="group-title">{{ group.title }}</div>
        <div class="card" :class="{ 'no-title': !group.title }">
          <div
            v-for="(row, i) in group.rows"
            :key="row.id"
            class="setting-row"
            :class="{ 'has-sub': !!row.subtitle, first: i === 0 }"
            :data-msg-setting="row.id"
            @click="onRow(row)"
          >
            <div class="row-text">
              <div class="row-title">{{ row.title }}</div>
              <div v-if="row.subtitle" class="row-sub">
                {{ row.subtitle }}<span v-if="row.subtitleLink" class="sub-link" data-msg-privacy>{{ row.subtitleLink }}</span>
              </div>
            </div>
            <div class="row-right">
              <span v-if="row.id === 'dbUpdate'" class="row-value">{{ dbValue }}</span>
              <span v-else-if="valueOf(row)" class="row-value">{{ valueOf(row) }}</span>
              <MsgSwitch
                v-if="row.type === 'switch'"
                :model-value="!!store.settings[row.id]"
                :aria-label="row.title"
                @update:model-value="store.setSetting(row.id, $event)"
              />
              <svg v-else width="9" height="16" viewBox="0 0 9 16" fill="none" class="chev">
                <path d="M1.4 1.6L7.4 8l-6 6.4" stroke="#C3C3C5" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      <div class="settings-tail" />
    </div>

    <!-- 单选弹层走项目标准件（底部弹出 + 顶部标题 + 关闭胶囊），不用居中对话框 -->
    <SheetOptionPicker
      :visible="dbDialog"
      :title="t('dbUpdateTitle')"
      :options="dbOptions"
      :model-value="store.settings.dbUpdatePref"
      :cancel-text="t('cancel')"
      show-bottom-cancel
      @update:model-value="pickDb"
      @close="dbDialog = false"
    />
  </div>
</template>

<style scoped>
.msg-settings-page {
  position: relative;
  height: 100%;
  background: #f0f1f2;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.settings-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 0 16px;
}
.group { margin-top: 6px; }
.group-title {
  padding: 10px 4px 8px;
  font-size: 15px;
  line-height: 20px;
  color: #545559;
}
.card {
  background: #fff;
  border-radius: 14px;
  overflow: hidden;
  margin-bottom: 18px;
}
.card.no-title { margin-top: 18px; }
.setting-row {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 51.9px;
  padding: 12px 16px;
  box-sizing: border-box;
  position: relative;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.setting-row::before {
  content: '';
  position: absolute;
  left: 16px;
  right: 16px;
  top: 0;
  height: 1px;
  background: #e0e0e0;
}
.setting-row.first::before { display: none; }
.setting-row.has-sub { min-height: 79.6px; }
.setting-row:active { background: #fafafa; }
.row-text { flex: 1; min-width: 0; }
.row-title {
  font-size: 16px;
  line-height: 22px;
  color: #000;
}
.row-sub {
  margin-top: 2px;
  font-size: 12.5px;
  line-height: 17px;
  color: #6b6b6d;
}
.sub-link { color: #3375f6; }
.row-right {
  flex: none;
  display: flex;
  align-items: center;
  gap: 6px;
}
.row-value {
  font-size: 15px;
  line-height: 20px;
  color: #8a8a8c;
}
.chev { flex: none; }
.settings-tail { height: 24px; }
</style>
