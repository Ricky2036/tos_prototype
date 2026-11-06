<script setup>
import SubPageShell from '../subpage/SubPageShell.vue'
import ListCell from '../../../ui/ListCell.vue'
import { ref } from 'vue'
import SheetModal from '../../../ui/SheetModal.vue'
import { useDisplaySettingsStore } from '../../../../stores/displaySettingsStore'

const emit = defineEmits(['back'])
const display = useDisplaySettingsStore()

// 真机：选「高」会先弹功耗确认，确认后才真的切
const showHighConfirm = ref(false)

function choose(value) {
  if (value === 'high' && display.refreshRate !== 'high') {
    showHighConfirm.value = true
    return
  }
  display.setRefreshRate(value)
}

function confirmHigh() {
  display.setRefreshRate('high')
  showHighConfirm.value = false
}

const OPTIONS = [
  { value: 'auto', title: '智能切换', subtitle: '根据场景自动切换最佳的屏幕刷新率，平衡画面流畅性与续航。' },
  { value: 'standard', title: '标准', subtitle: '最高 60 Hz，续航更长。' },
  { value: 'high', title: '高', subtitle: '在部分应用内最高可达 144 Hz，画面更流畅，但耗电增加。' }
]
</script>

<template>
  <SubPageShell title="屏幕刷新率" @back="emit('back')">
    <div class="rate-previews">
      <div class="rate-col">
        <div class="rate-phone">
          <span class="rate-line w1"></span>
          <span class="rate-line w2"></span>
          <span class="rate-block"></span>
          <span class="rate-line w3"></span>
          <span class="rate-line w2"></span>
        </div>
        <div class="rate-label">标准</div>
      </div>
      <div class="rate-col">
        <div class="rate-phone">
          <span class="rate-line w1"></span>
          <span class="rate-line w2"></span>
          <span class="rate-block tall"></span>
          <span class="rate-line w3"></span>
          <span class="rate-line w2"></span>
        </div>
        <div class="rate-label">高</div>
      </div>
    </div>

    <div class="settings-card">
      <ListCell
        v-for="(opt, i) in OPTIONS"
        :key="opt.value"
        :title="opt.title"
        :subtitle="opt.subtitle"
        clickable
        @click="choose(opt.value)"
      >
        <template #right>
          <span class="opt-radio" :class="{ checked: display.refreshRate === opt.value }"></span>
        </template>
      </ListCell>
      <ListCell title="自定义应用刷新率" chevron clickable last />
    </div>

    <div class="card-note">
      1. 若应用内的显示帧率高于设置刷新率，则应用内的帧率设置不生效。<br />
      2. 屏幕刷新率会根据显示内容动态调整。<br />
      3. 游戏刷新率可通过游戏中左滑呼出 XBOOST AI 设置。
    </div>
    <!-- 切到「高」时的功耗确认（真机交互） -->
    <SheetModal
      :visible="showHighConfirm"
      padding="24px 20px 18px"
      @close="showHighConfirm = false"
    >
      <div class="confirm-title">切换为高刷新率</div>
      <div class="confirm-desc">高刷新率将增加耗电，推荐保持智能切换模式。</div>
      <div class="confirm-actions">
        <button type="button" class="confirm-btn ghost" @click="showHighConfirm = false">取消</button>
        <button type="button" class="confirm-btn primary" @click="confirmHigh">切换</button>
      </div>
    </SheetModal>
  </SubPageShell>
</template>

<style scoped>
.rate-previews {
  display: flex;
  justify-content: center;
  gap: 44px;
  padding: 10px 0 16px;
}

.rate-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.rate-phone {
  width: 92px;
  height: 202px;
  border-radius: 16px;
  border: 2px solid #C9C9CE;
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-sizing: border-box;
}

.rate-line {
  height: 7px;
  border-radius: 3.5px;
  background: #EFEFF2;
}

.rate-line.w1 { width: 100%; }
.rate-line.w2 { width: 78%; }
.rate-line.w3 { width: 88%; }

.rate-block {
  height: 26px;
  border-radius: 5px;
  background: #E4E4E8;
}

.rate-block.tall {
  height: 40px;
}

.confirm-title {
  text-align: center;
  font-size: 17px;
  font-weight: 700;
  color: #111;
  padding-bottom: 10px;
}

.confirm-desc {
  font-size: 14px;
  line-height: 21px;
  color: #3C3C43;
  text-align: center;
  padding-bottom: 20px;
}

.confirm-actions {
  display: flex;
  gap: 12px;
}

.confirm-btn {
  flex: 1;
  height: 46px;
  border: none;
  border-radius: 23px;
  font-size: 16px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
}

.confirm-btn.ghost {
  background: #EDEDF0;
  color: #111;
}

.confirm-btn.primary {
  background: #2F6BF5;
  color: #FFFFFF;
}

.rate-label {
  font-size: 13px;
  color: #3C3C43;
}
</style>
