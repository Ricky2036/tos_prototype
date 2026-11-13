<script setup>
import SubPageShell from '../subpage/SubPageShell.vue'
import ListCell from '../../../ui/ListCell.vue'
import ToggleSwitch from '../../../ui/ToggleSwitch.vue'
import AccOutdoorSchedule from './AccOutdoorSchedule.vue'
import { computed, ref } from 'vue'
import { useAccessibilitySettingsStore } from '../../../../stores/accessibilitySettingsStore.js'
import { parseTimeValue, to12Hour, pad2 } from '../../../../utils/timePicker.js'
import './acc.css'

/**
 * 户外增强（真机 com.android.settings SubSettings）
 * 顶部卡：标题 + 说明 + 总开关（默认关）。
 * 分组「自动开关」：定时开启（值「已关闭 / 已开启」）。
 * 分组「支持的功能」：三项各自默认开，但**总开关关时整行置灰、不可点**（真机两态实测）。
 */
const emit = defineEmits(['back'])
const acc = useAccessibilitySettingsStore()

const showSchedule = ref(false)
const isBack = ref(false)

function openSchedule() {
  isBack.value = false
  showSchedule.value = true
}
function closeSchedule() {
  isBack.value = true
  showSchedule.value = false
}

/** 真机行内值格式：上午/下午 + 12 小时 + 两位分钟，如「下午11:43」 */
function rowTime(hhmm) {
  const { hour24, minute } = parseTimeValue(hhmm)
  const { hour12, period } = to12Hour(hour24)
  return `${period}${hour12}:${pad2(minute)}`
}

const scheduleValue = computed(() =>
  acc.outdoorSchedule === 'scheduled'
    ? `${rowTime(acc.outdoorStart)} - ${rowTime(acc.outdoorEnd)}`
    : '已关闭'
)
</script>

<template>
  <AccOutdoorSchedule v-if="showSchedule" @back="closeSchedule" />
  <SubPageShell v-else title="户外增强" @back="emit('back')">
    <div class="acc-page">
      <div class="acc-card" data-testid="outdoor-master">
        <div class="acc-master">
          <div class="acc-master-text">
            <div class="acc-master-title">户外增强</div>
            <div class="acc-master-desc">可增强屏幕亮度、网络质量等，但会增加耗电量，省电模式下将会自动关闭。</div>
          </div>
          <ToggleSwitch
            :model-value="acc.outdoorEnabled"
            color="blue"
            @update:model-value="v => acc.setFlag('outdoorEnabled', v)"
          />
        </div>
      </div>

      <div class="acc-group-title">自动开关</div>
      <div class="acc-card">
        <ListCell
          data-testid="outdoor-schedule-row"
          title="定时开启"
          :value="scheduleValue"
          chevron
          last
          @click="openSchedule"
        />
      </div>

      <div class="acc-group-title">支持的功能</div>
      <div
        class="acc-card"
        data-testid="outdoor-features"
        :class="{ 'acc-dim': !acc.outdoorFeaturesEditable }"
        :aria-disabled="!acc.outdoorFeaturesEditable"
      >
        <ListCell
          title="屏幕亮度增强"
          subtitle="在“自动调节亮度”开启时生效，提升户外场景下的亮度舒适性。"
        >
          <template #right>
            <ToggleSwitch
              :model-value="acc.outdoorBrightness"
              color="blue"
              :disabled="!acc.outdoorFeaturesEditable"
              @update:model-value="v => acc.setFlag('outdoorBrightness', v)"
            />
          </template>
        </ListCell>
        <ListCell
          title="通话增强（免提）"
          subtitle="未连接耳机时，系统通话将默认免提，并优化降噪。"
        >
          <template #right>
            <ToggleSwitch
              :model-value="acc.outdoorHandsFree"
              color="blue"
              :disabled="!acc.outdoorFeaturesEditable"
              @update:model-value="v => acc.setFlag('outdoorHandsFree', v)"
            />
          </template>
        </ListCell>
        <ListCell
          title="延长自动息屏时间"
          subtitle="20 分钟内无操作才会自动息屏，无需频繁解锁。"
          last
        >
          <template #right>
            <ToggleSwitch
              :model-value="acc.outdoorExtendScreenOff"
              color="blue"
              :disabled="!acc.outdoorFeaturesEditable"
              @update:model-value="v => acc.setFlag('outdoorExtendScreenOff', v)"
            />
          </template>
        </ListCell>
      </div>
    </div>
  </SubPageShell>
</template>
