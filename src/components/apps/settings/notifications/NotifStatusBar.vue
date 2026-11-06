<script setup>
import SubPageShell from '../subpage/SubPageShell.vue'
import ListCell from '../../../ui/ListCell.vue'
import LIcon from '../../../ui/LIcon.vue'
import ToggleSwitch from '../../../ui/ToggleSwitch.vue'
import { useControlStore } from '../../../../stores/controlStore'
import { ref } from 'vue'
import { useNotificationSettingsStore } from '../../../../stores/notificationSettingsStore'
import NotifRemindStyleSheet from './NotifRemindStyleSheet.vue'

/**
 * 状态栏（通知与状态栏 → 状态栏）
 *
 * 真机为：通知提醒方式行 + 显示电量百分比 + 「状态栏图标显示」8 项带图标的开关。
 * ⚠️ 勿扰 / 蓝牙两项直接读写 controlStore —— 状态栏上真的会画这两个图标
 *    （`src/utils/statusBarIndicators.js`），所以这里的开关必须与桌面状态栏同源。
 */
const emit = defineEmits(['back'])
const control = useControlStore()
const notifSettings = useNotificationSettingsStore()
const showRemindSheet = ref(false)

function isOn(row) {
  if (row.kind === 'control') return Boolean(control[row.controlKey])
  return Boolean(notifSettings[row.key])
}

function setOn(row, value) {
  if (row.kind === 'control') {
    control.setFlag(row.controlKey, value)
    return
  }
  notifSettings.setBool(row.key, value)
}
</script>

<template>
  <SubPageShell title="状态栏" @back="emit('back')">
    <div class="settings-card">
      <ListCell
        title="通知提醒方式"
        :value="notifSettings.remindStyle"
        subtitle="有通知时在状态栏显示单色图标。"
        chevron
        clickable
        @click="showRemindSheet = true"
      />
      <ListCell title="显示电量百分比" last>
        <template #right>
          <ToggleSwitch
            :model-value="notifSettings.showBatteryPercent"
            color="blue"
            @update:model-value="v => notifSettings.setBool('showBatteryPercent', v)"
          />
        </template>
      </ListCell>
    </div>

    <div class="section-header">状态栏图标显示</div>
    <div class="settings-card">
      <ListCell
        v-for="(row, i) in notifSettings.iconRows()"
        :key="row.key"
        :title="row.label"
        :last="i === notifSettings.iconRows().length - 1"
      >
        <template #icon>
          <div class="sb-glyph">
            <!-- 网速：真机就是「0.01 / KB/S」两行文字 -->
            <span v-if="row.text" class="sb-text">0.01<br />KB/S</span>
            <!-- VPN：真机是深色小胶囊 + VPN 字样 -->
            <span v-else-if="row.lucide === 'vpn'" class="sb-vpn">VPN</span>
            <!-- 其余全部复用 lucide 图标 -->
            <LIcon
              v-else
              :name="row.lucide"
              :size="19"
              :stroke-width="2"
              :filled="Boolean(row.filled)"
              style="color: #1C1C1E"
            />
          </div>
        </template>
        <template #right>
          <ToggleSwitch
            :model-value="isOn(row)"
            color="blue"
            @update:model-value="v => setOn(row, v)"
          />
        </template>
      </ListCell>
    </div>

    <NotifRemindStyleSheet :visible="showRemindSheet" @close="showRemindSheet = false" />
  </SubPageShell>
</template>

<style scoped>
.sb-glyph {
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  margin-right: 14px;
}

.sb-text {
  font-size: 8px;
  line-height: 8.5px;
  font-weight: 700;
  color: #1C1C1E;
  text-align: center;
  letter-spacing: -0.3px;
}

.sb-vpn {
  font-size: 8px;
  font-weight: 800;
  color: #FFFFFF;
  background: #3C3C43;
  border-radius: 3px;
  padding: 1.5px 3px;
  letter-spacing: -0.2px;
}
</style>
