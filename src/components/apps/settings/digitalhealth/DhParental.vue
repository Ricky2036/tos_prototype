<script setup>
import { computed, ref } from 'vue'
import DhShell from './DhShell.vue'
import DhDialog from './DhDialog.vue'
import LIcon from '../../../ui/LIcon.vue'
import { useDigitalHealthStore } from '../../../../stores/digitalHealthStore.js'

/**
 * 家长控制（真机 dh_66_parental，SupervisionDashboardActivity）。
 *
 * 真机结构（导航栏**没有** ⋮，与数字健康其它子页不同）：
 *   ① 灰标「控制此手机」：每日限额 / 应用使用时限 / 休息时间（每条带副文案 + chevron）
 *   ② 无标题卡：应用商店过滤条件 / 网络内容过滤器
 *   ③ 单行卡：设置家长控制 PIN 码
 *   ④ 灰标「可用的应用和服务」：Google Family Link（带长副文案 + chevron）
 *   ⑤ 页脚：家长必须为未满同意年龄的儿童管理 Google 账号。
 *
 * ⚠️ 这些行在真机上都要连 Google Family Link 才能设置；本原型里除 PIN 码外统一回 toast。
 */
const emit = defineEmits(['back', 'toast'])
const dh = useDigitalHealthStore()

const LIMITED = [
  { key: 'daily', title: '每日限额', sub: '限制总屏幕使用时间' },
  { key: 'appLimit', title: '应用使用时限', sub: '屏蔽应用和设置使用时限' },
  { key: 'bedtime', title: '休息时间', sub: '限制夜间的使用时间' }
]

const FILTERS = [
  { key: 'store', title: '应用商店过滤条件', sub: '按内容分级过滤应用' },
  { key: 'web', title: '网络内容过滤器', sub: '网站和搜索结果过滤器' }
]

const pinSet = computed(() => Boolean(dh.state.parental.pin))
const dialogOpen = ref(false)
const pinInput = ref('')

function openPin() {
  pinInput.value = ''
  dialogOpen.value = true
}
function confirmPin() {
  if (dh.setParentalPin(pinInput.value)) {
    dialogOpen.value = false
    emit('toast', `家长控制 PIN 码已设为 ${dh.state.parental.pin}`)
  } else {
    emit('toast', '请输入 4 位数字 PIN 码')
  }
}
function notLinked() {
  emit('toast', '此功能需要通过 Google Family Link 完成设置')
}
</script>

<template>
  <DhShell title="家长控制" @back="emit('back')">
    <div class="dh-cap">控制此手机</div>
    <section class="dh-card" data-dh-parental-control>
      <template v-for="(r, i) in LIMITED" :key="r.key">
        <button type="button" class="dh-row" :data-dh-parental-row="r.key" @click="notLinked">
          <span class="dh-row-main">
            <span class="dh-row-title">{{ r.title }}</span>
            <span class="dh-row-sub">{{ r.sub }}</span>
          </span>
          <LIcon class="dh-chev" name="chevronRight" :size="16" />
        </button>
        <div v-if="i < LIMITED.length - 1" class="dh-divider"></div>
      </template>
    </section>

    <section class="dh-card" data-dh-parental-filter>
      <template v-for="(r, i) in FILTERS" :key="r.key">
        <button type="button" class="dh-row" :data-dh-parental-row="r.key" @click="notLinked">
          <span class="dh-row-main">
            <span class="dh-row-title">{{ r.title }}</span>
            <span class="dh-row-sub">{{ r.sub }}</span>
          </span>
          <LIcon class="dh-chev" name="chevronRight" :size="16" />
        </button>
        <div v-if="i < FILTERS.length - 1" class="dh-divider"></div>
      </template>
    </section>

    <section class="dh-card">
      <button type="button" class="dh-row" data-dh-parental-pin @click="openPin">
        <span class="dh-row-main">
          <span class="dh-row-title">{{ pinSet ? '更改家长控制 PIN 码' : '设置家长控制 PIN 码' }}</span>
          <span v-if="pinSet" class="dh-row-sub" data-dh-pin-value>已设置：{{ dh.state.parental.pin }}</span>
        </span>
        <LIcon class="dh-chev" name="chevronRight" :size="16" />
      </button>
    </section>

    <div class="dh-cap">可用的应用和服务</div>
    <section class="dh-card" data-dh-parental-family>
      <button type="button" class="dh-row" data-dh-parental-row="familyLink" @click="notLinked">
        <span class="dh-row-main">
          <span class="dh-row-title">Google Family Link</span>
          <span class="dh-row-sub">家长可以使用自己的手机管理这些设置、查看设备位置信息，以及执行其他操作</span>
        </span>
        <LIcon class="dh-chev" name="chevronRight" :size="16" />
      </button>
    </section>

    <p class="dh-footer">家长必须为未满同意年龄的儿童管理 Google 账号。</p>

    <DhDialog
      :visible="dialogOpen"
      title="设置家长控制 PIN 码"
      note="请输入 4 位数字。忘记 PIN 码时，只能在恢复出厂设置后重新设置。"
      confirm-text="保存"
      @close="dialogOpen = false"
      @confirm="confirmPin"
    >
      <input
        v-model="pinInput"
        class="dh-pin-input"
        data-dh-pin-input
        type="tel"
        inputmode="numeric"
        maxlength="4"
        placeholder="••••"
        @input="pinInput = pinInput.replace(/\D/g, '').slice(0, 4)"
      />
    </DhDialog>
  </DhShell>
</template>

<style scoped>
.dh-cap {
  font-size: 13px;
  color: #5F6368;
  padding: 14px 6px 8px;
}

.dh-chev { flex: none; }

.dh-footer {
  margin: 0;
  padding: 6px 8px 0;
  font-size: 12.5px;
  line-height: 18px;
  color: #5F6368;
  text-align: center;
}

.dh-pin-input {
  width: 100%;
  height: 46px;
  margin-top: 8px;
  border: 1px solid #DADCE0;
  border-radius: 12px;
  background: #FFFFFF;
  font-size: 20px;
  letter-spacing: 8px;
  text-align: center;
  font-family: inherit;
  color: #1F1F1F;
  outline: none;
  box-sizing: border-box;
}

.dh-pin-input:focus { border-color: #1A73E8; }
</style>
