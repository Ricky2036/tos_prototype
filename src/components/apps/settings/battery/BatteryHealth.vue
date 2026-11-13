<script setup>
import { ref, computed } from 'vue'
import SubPageShell from '../subpage/SubPageShell.vue'
import ListCell from '../../../ui/ListCell.vue'
import SheetModal from '../../../ui/SheetModal.vue'
import { useBatteryStore, CHARGE_PROTECTION_OPTIONS, CUSTOM_LIMIT_OPTIONS } from '../../../../stores/batteryStore'

/**
 * 电池健康（真机：设置 → 电池与省电 → 电池健康）
 * 证据：`.local-evidence/SET-BAT-01/10-battery-health.*`
 *
 * unknown：自定义充电上限的选择器形态、以及「如何延长电池使用寿命」的跳转目标
 * 真机未采到 → 这里用同一套单选/底部弹层组件实现，不新增系统设置语义。
 */
const emit = defineEmits(['back'])
const store = useBatteryStore()

const showLimitPicker = ref(false)
const showLifeTips = ref(false)

const customLimitLabel = computed(() => `${store.customChargeLimit}%`)

function chooseProtection(value) {
  store.patch({ chargeProtection: value })
}

function chooseLimit(value) {
  store.patch({ customChargeLimit: value })
  showLimitPicker.value = false
}

const LIFE_TIPS = [
  '避免长时间满电存放，日常保持 20%–80% 电量区间。',
  '使用原装或认证充电器，避免高温环境下充电。',
  '开启 AI 智能充电保护或自定义上限，减少满电停留时间。',
  '边充边玩高负载游戏会显著升温，建议旁路充电或先降温。'
]
</script>

<template>
  <SubPageShell title="电池健康" @back="emit('back')">
    <div class="settings-card">
      <ListCell title="最大电池容量" value="99%" last />
    </div>

    <div class="card-note">
      这是相对于新电池而言的电池容量。数值越高，续航越长。电池属于易消耗器件。
      <button type="button" class="link-btn" @click="showLifeTips = true">如何延长电池使用寿命</button>
    </div>

    <div class="section-header">充电保护</div>
    <div class="settings-card">
      <ListCell
        v-for="opt in CHARGE_PROTECTION_OPTIONS"
        :key="opt.value"
        :title="opt.title"
        :subtitle="opt.subtitle"
        clickable
        :last="opt.value === 'custom'"
        @click="chooseProtection(opt.value)"
      >
        <template #right>
          <span class="opt-radio" :class="{ checked: store.chargeProtection === opt.value }"></span>
        </template>
      </ListCell>
    </div>

    <div v-if="store.chargeProtection === 'custom'" class="settings-card">
      <ListCell title="充电上限" :value="customLimitLabel" chevron last @click="showLimitPicker = true" />
    </div>

    <SheetModal :visible="showLimitPicker" padding="20px 20px 16px" @close="showLimitPicker = false">
      <div class="sheet-title">充电上限</div>
      <div class="sheet-sub">建议设置为 80%–90%，延缓电池老化。</div>
      <button
        v-for="limit in CUSTOM_LIMIT_OPTIONS"
        :key="limit"
        type="button"
        class="limit-row"
        @click="chooseLimit(limit)"
      >
        <span>{{ limit }}%</span>
        <span class="opt-radio" :class="{ checked: store.customChargeLimit === limit }"></span>
      </button>
      <button type="button" class="sheet-cancel" @click="showLimitPicker = false">取消</button>
    </SheetModal>

    <SheetModal :visible="showLifeTips" padding="22px 20px 18px" @close="showLifeTips = false">
      <div class="sheet-title">如何延长电池使用寿命</div>
      <ul class="tips-list">
        <li v-for="tip in LIFE_TIPS" :key="tip">{{ tip }}</li>
      </ul>
      <button type="button" class="sheet-confirm" @click="showLifeTips = false">知道了</button>
    </SheetModal>
  </SubPageShell>
</template>

<style scoped>
.link-btn {
  border: none;
  background: none;
  padding: 0;
  color: #0A84FF;
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
}

.sheet-title { font-size: 17px; font-weight: 600; text-align: center; margin-bottom: 6px; }
.sheet-sub { font-size: 13px; color: #8E8E93; text-align: center; margin-bottom: 12px; }

.limit-row {
  width: 100%;
  height: 52px;
  border: none;
  background: transparent;
  border-top: 0.5px solid rgba(60, 60, 67, 0.16);
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 16px;
  font-family: inherit;
  color: #1C1C1E;
  cursor: pointer;
}

.sheet-cancel {
  width: 100%;
  height: 46px;
  border: none;
  border-radius: 23px;
  background: #F2F2F7;
  color: #1C1C1E;
  font-size: 16px;
  font-weight: 600;
  font-family: inherit;
  margin-top: 10px;
  cursor: pointer;
}

.tips-list { margin: 4px 0 16px; padding-left: 18px; }

.tips-list li { font-size: 13px; line-height: 20px; color: #8E8E93; }

.sheet-confirm {
  width: 100%;
  height: 48px;
  border: none;
  border-radius: 24px;
  background: #0A84FF;
  color: #FFFFFF;
  font-size: 16px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
}
</style>
