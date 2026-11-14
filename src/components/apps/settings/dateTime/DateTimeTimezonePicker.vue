<script setup>
/**
 * 选择时区 · 城市列表
 * ===========================================
 * 证据：spec/captures/SET-DSH-01-A-B.md 包 C2。
 * 真机：自动设置时区=关 时点「选择时区」进入城市列表。
 * 点击城市写回 store.timezone 并返回上一级。
 */
import { inject } from 'vue'
import SubPageShell from '../subpage/SubPageShell.vue'
import ListCell from '../../../ui/ListCell.vue'
import { useDateTimeStore } from '../../../../stores/dateTimeStore.js'
import { useBackHandler } from '../../../../composables/backRegistry.js'

const emit = defineEmits(['back'])
const nav = inject('settingsNav', null)
const dtStore = useDateTimeStore()

/** C2 样例（均为 GMT+08:00），按采集包出现顺序 */
const CITIES = [
  { name: '吉隆坡', gmt: 'GMT+08:00' },
  { name: '马尼拉', gmt: 'GMT+08:00' },
  { name: '北京', gmt: 'GMT+08:00' },
  { name: '香港', gmt: 'GMT+08:00' },
  { name: '新加坡', gmt: 'GMT+08:00' },
  { name: '斯里巴加湾', gmt: 'GMT+08:00' },
]

function selectCity(city) {
  dtStore.setTimezone(`${city.gmt} ${city.name}标准时间`)
  back()
}

function back() {
  emit('back')
  return true
}
defineExpose({ back })

if (nav) {
  useBackHandler(() => {
    emit('back')
    return true
  })
}
</script>

<template>
  <SubPageShell title="选择时区" @back="back">
    <div class="settings-card tz-card">
      <ListCell
        v-for="(city, i) in CITIES"
        :key="city.name"
        :data-tz-row="city.name"
        :title="city.name"
        :value="city.gmt"
        :last="i === CITIES.length - 1"
        chevron
        @click="selectCity(city)"
      />
    </div>
  </SubPageShell>
</template>

<style scoped>
.tz-card {
  background: #FFFFFF;
  border-radius: 16px;
  overflow: hidden;
  margin: 0 16px 32px;
}
</style>
