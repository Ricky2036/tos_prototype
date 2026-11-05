<script setup>
import { ref } from 'vue'
import SubPageShell from '../subpage/SubPageShell.vue'
import ListCell from '../../../ui/ListCell.vue'
import ToggleSwitch from '../../../ui/ToggleSwitch.vue'
import { useNotificationSettingsStore } from '../../../../stores/notificationSettingsStore'

/**
 * 控制中心（通知与状态栏 → 控制中心）
 *
 * 真机（Infinix X6878 / XOS 17）：
 *   头图轮播（3 屏，自动切换）→ 锁屏呼出控制中心 [开] → 还原控制中心（点开是确认弹窗）
 * 弹窗文案：「是否将控制中心还原为出厂默认布局？」取消 / 还原。
 */
const emit = defineEmits(['back'])
const notifSettings = useNotificationSettingsStore()

const SLIDES = [
  { caption: '拖拽排布，定义专属排序。', variant: 'arrange' },
  { caption: '长按进入编辑，添加或移除控制项。', variant: 'edit' },
  { caption: '快捷添加，扩展更多控制能力。', variant: 'add' }
]
const slide = ref(0)

const showResetDialog = ref(false)
const resetDone = ref(false)

function confirmReset() {
  showResetDialog.value = false
  resetDone.value = true
  notifSettings.resetControlCenterLayout()
}
</script>

<template>
  <SubPageShell title="控制中心" @back="emit('back')">
    <!-- 头图轮播 -->
    <div class="cc-hero">
      <div class="cc-phone">
        <span class="cc-dot"></span>
        <div class="cc-row">
          <span class="cc-cell sm"></span>
          <span class="cc-cell lg"></span>
        </div>
        <div class="cc-row">
          <span class="cc-cell tall"></span>
          <span class="cc-cell tall"></span>
        </div>
        <div class="cc-grid">
          <i v-for="n in 12" :key="n" class="cc-knob" :class="{ dark: slide === 2 && n > 5 }"></i>
        </div>
      </div>
      <div class="cc-caption">{{ SLIDES[slide].caption }}</div>
      <div class="cc-dots">
        <i v-for="(s, i) in SLIDES" :key="i" :class="{ on: i === slide }" @click="slide = i"></i>
      </div>
    </div>

    <div class="settings-card">
      <ListCell title="锁屏呼出控制中心">
        <template #right>
          <ToggleSwitch
            :model-value="notifSettings.ccLockScreen"
            color="blue"
            @update:model-value="v => notifSettings.setBool('ccLockScreen', v)"
          />
        </template>
      </ListCell>
      <ListCell
        title="还原控制中心"
        subtitle="将控制中心还原为出厂默认布局。"
        chevron
        clickable
        last
        @click="showResetDialog = true"
      />
    </div>

    <div class="card-note">控制中心的排布可在下拉后长按编辑。</div>

    <!-- 还原确认弹窗 -->
    <Transition name="toast-fade">
      <div v-if="showResetDialog" class="cc-mask" @click.self="showResetDialog = false">
        <div class="cc-dialog">
          <div class="cc-dialog-title">是否将控制中心还原为出厂默认布局？</div>
          <div class="cc-dialog-actions">
            <button type="button" class="cc-btn ghost" @click="showResetDialog = false">取消</button>
            <button type="button" class="cc-btn primary" @click="confirmReset">还原</button>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="toast-fade">
      <div v-if="resetDone" class="cc-toast">已还原为出厂默认布局</div>
    </Transition>
  </SubPageShell>
</template>

<style scoped>
.cc-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6px 0 20px;
}

.cc-phone {
  width: 132px;
  height: 190px;
  border-radius: 18px;
  border: 2px solid #C9C9CE;
  padding: 10px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cc-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #1C1C1E;
  align-self: center;
}

.cc-row {
  display: flex;
  gap: 8px;
}

.cc-cell {
  display: block;
  border-radius: 8px;
  background: #E9E9EC;
}

.cc-cell.sm { flex: 1; height: 16px; }
.cc-cell.lg { flex: 2; height: 16px; }
.cc-cell.tall { flex: 1; height: 34px; }

.cc-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-top: 2px;
}

.cc-knob {
  display: block;
  width: 100%;
  aspect-ratio: 1;
  border-radius: 50%;
  background: #E9E9EC;
  transition: background 0.25s ease;
}

.cc-knob.dark {
  background: #5B5B60;
}

.cc-caption {
  margin-top: 14px;
  font-size: 13px;
  line-height: 19px;
  color: #8E8E93;
  text-align: center;
  padding: 0 28px;
}

.cc-dots {
  display: flex;
  gap: 6px;
  margin-top: 10px;
}

.cc-dots i {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #D1D1D6;
  cursor: pointer;
}

.cc-dots i.on {
  background: #6E6E73;
}

/* 确认弹窗 */
.cc-mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.28);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 40px;
  z-index: 30;
}

.cc-dialog {
  width: calc(100% - 32px);
  background: #FFFFFF;
  border-radius: 22px;
  padding: 24px 20px 18px;
  box-sizing: border-box;
}

.cc-dialog-title {
  font-size: 16px;
  line-height: 23px;
  color: #111;
  text-align: center;
  padding-bottom: 20px;
}

.cc-dialog-actions {
  display: flex;
  gap: 12px;
}

.cc-btn {
  flex: 1;
  height: 46px;
  border: none;
  border-radius: 23px;
  font-size: 16px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
}

.cc-btn.ghost {
  background: #EDEDF0;
  color: #111;
}

.cc-btn.primary {
  background: #2F6BF6;
  color: #FFFFFF;
}

.cc-toast {
  position: absolute;
  left: 50%;
  bottom: 96px;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.78);
  color: #FFFFFF;
  font-size: 13px;
  padding: 9px 16px;
  border-radius: 18px;
  z-index: 40;
}
</style>
