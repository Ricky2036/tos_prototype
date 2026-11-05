<script setup>
import SubPageShell from '../subpage/SubPageShell.vue'
import ListCell from '../../../ui/ListCell.vue'
import ToggleSwitch from '../../../ui/ToggleSwitch.vue'
import { useControlStore } from '../../../../stores/controlStore'
import { useNotificationSettingsStore } from '../../../../stores/notificationSettingsStore'

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
            <!-- 勿扰 -->
            <svg v-if="row.icon === 'moon'" width="15" height="15" viewBox="0 0 24 24" fill="#3C3C43">
              <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
            </svg>
            <!-- 网速：用文字图标还原真机的 0.01 KB/S -->
            <span v-else-if="row.icon === 'text'" class="sb-text">0.01<br />KB/S</span>
            <!-- 磁吸充电宝 -->
            <svg v-else-if="row.icon === 'battery'" width="15" height="15" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="8" width="17" height="9" rx="2.4" fill="#3C3C43" />
              <rect x="20" y="10.5" width="2" height="4" rx="1" fill="#3C3C43" />
              <path d="M6 12.4h3.2v-1.6h2.4v1.6H15v1.4h-3.4v1.6H9.2v-1.6H6z" fill="#FFFFFF" />
            </svg>
            <!-- 蓝牙 -->
            <svg v-else-if="row.icon === 'bluetooth'" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3C3C43" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M7 7l10 10-5 5V2l5 5L7 17" />
            </svg>
            <!-- 闹钟 -->
            <svg v-else-if="row.icon === 'alarm'" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3C3C43" stroke-width="2.2" stroke-linecap="round">
              <circle cx="12" cy="13" r="8" />
              <path d="M12 9.5V13l2.6 1.6M5 3.6 3.2 5.4M19 3.6l1.8 1.8" />
            </svg>
            <!-- 耳机 -->
            <svg v-else-if="row.icon === 'headset'" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3C3C43" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
              <rect x="2.6" y="13" width="4" height="7" rx="2" fill="#3C3C43" stroke="none" />
              <rect x="17.4" y="13" width="4" height="7" rx="2" fill="#3C3C43" stroke="none" />
            </svg>
            <!-- VPN -->
            <span v-else-if="row.icon === 'vpn'" class="sb-vpn">VPN</span>
            <!-- 流量节省 -->
            <svg v-else-if="row.icon === 'droplet'" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3C3C43" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 3s6 6.4 6 10a6 6 0 0 1-12 0c0-3.6 6-10 6-10z" />
              <path d="M9.5 14.6 14.5 10" />
            </svg>
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
  </SubPageShell>
</template>

<style scoped>
.sb-glyph {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  margin-right: 14px;
}

.sb-text {
  font-size: 7.5px;
  line-height: 8px;
  font-weight: 700;
  color: #3C3C43;
  text-align: center;
  letter-spacing: -0.2px;
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
