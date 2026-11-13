<script setup>
/**
 * 选择时区 · 城市列表（SET-WB-01 第二条链路）
 * ===========================================
 * 证据：spec/captures/SET-DSH-01-A-B.md 包 C2。
 * 真机：自动设置时区=关 时点「选择时区」进入 SubSettings 城市列表（44 节点），
 * 每行 = 城市名 + GMT 偏移两列；采集时「未选中任何城市（只是观看后返回）」。
 *
 * 因此本页只实现「进入 → 浏览 → 一次返回」，**不实现选中写回**：
 * 选中后的高亮、写回与 toast 都未采到，不猜。城市清单只列采集包里给出的 6 个样例。
 */
import { inject } from 'vue'
import SubPageShell from '../subpage/SubPageShell.vue'
import ListCell from '../../../ui/ListCell.vue'
import { useBackHandler } from '../../../../composables/backRegistry.js'

const emit = defineEmits(['back'])
const nav = inject('settingsNav', null)

/** C2 样例（均为 GMT+08:00），按采集包出现顺序 */
const CITIES = [
  { name: '吉隆坡', gmt: 'GMT+08:00' },
  { name: '马尼拉', gmt: 'GMT+08:00' },
  { name: '北京', gmt: 'GMT+08:00' },
  { name: '香港', gmt: 'GMT+08:00' },
  { name: '新加坡', gmt: 'GMT+08:00' },
  { name: '斯里巴加湾', gmt: 'GMT+08:00' },
]

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
      />
    </div>
  </SubPageShell>
</template>

<style scoped>
.tz-card {
  background: #FFFFFF;
  border-radius: 16px;
  overflow: hidden;
  margin: 0 16px;
}
</style>
