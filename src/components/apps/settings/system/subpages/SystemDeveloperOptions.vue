<script setup>
import { ref } from 'vue'
import SubPageShell from '../../subpage/SubPageShell.vue'
import ListCell from '../../../../ui/ListCell.vue'
import ToggleSwitch from '../../../../ui/ToggleSwitch.vue'
import { useSystemSettingsStore } from '../../../../../stores/systemSettingsStore.js'

const emit = defineEmits(['back'])
const store = useSystemSettingsStore()

const activeAnimPicker = ref(null) // 'window' | 'transition' | 'animator'
const ANIM_OPTIONS = ['关闭动画', '0.5x', '1.0x', '1.5x', '2.0x']

function openAnimPicker(type) {
  activeAnimPicker.value = type
}

function selectAnimScale(val) {
  if (activeAnimPicker.value === 'window') {
    store.setWindowAnimationScale(val)
  } else if (activeAnimPicker.value === 'transition') {
    store.setTransitionAnimationScale(val)
  } else if (activeAnimPicker.value === 'animator') {
    store.setAnimatorDurationScale(val)
  }
  activeAnimPicker.value = null
}
</script>

<template>
  <SubPageShell title="开发者选项" data-test="subpage-dev" @back="emit('back')">
    <div class="dev-container">
      <!-- 总开关卡片 -->
      <div class="settings-card master-card">
        <ListCell
          title="使用开发者选项"
          :subtitle="store.developerOptionsEnabled ? '开启中' : '已停用'"
          last
        >
          <template #right>
            <ToggleSwitch
              data-test="toggle-dev-master"
              :model-value="store.developerOptionsEnabled"
              @update:model-value="store.setDeveloperOptionsEnabled"
            />
          </template>
        </ListCell>
      </div>

      <template v-if="store.developerOptionsEnabled">
        <div class="section-title">调试</div>
        <div class="settings-card">
          <ListCell
            title="USB 调试"
            subtitle="连接 USB 时开启调试模式"
          >
            <template #right>
              <ToggleSwitch
                data-test="toggle-usb-dbg"
                :model-value="store.usbDebugging"
                @update:model-value="store.setUsbDebugging"
              />
            </template>
          </ListCell>

          <ListCell
            title="不锁定屏幕"
            subtitle="充电时屏幕不会休眠"
            last
          >
            <template #right>
              <ToggleSwitch
                data-test="toggle-keep-awake"
                :model-value="store.keepAwake"
                @update:model-value="store.setKeepAwake"
              />
            </template>
          </ListCell>
        </div>

        <div class="section-title">输入</div>
        <div class="settings-card">
          <ListCell
            title="显示点按操作反馈"
            subtitle="为点按操作提供视觉反馈圆点"
          >
            <template #right>
              <ToggleSwitch
                data-test="toggle-show-taps"
                :model-value="store.showTaps"
                @update:model-value="store.setShowTaps"
              />
            </template>
          </ListCell>

          <ListCell
            title="指针位置"
            subtitle="在屏幕顶部叠加层显示当前轻触数据"
            last
          >
            <template #right>
              <ToggleSwitch
                data-test="toggle-pointer-loc"
                :model-value="store.pointerLocation"
                @update:model-value="store.setPointerLocation"
              />
            </template>
          </ListCell>
        </div>

        <div class="section-title">绘图与动画</div>
        <div class="settings-card">
          <ListCell
            title="窗口动画缩放"
            :subtitle="store.windowAnimationScale"
            chevron
            @click="openAnimPicker('window')"
          />
          <ListCell
            title="过渡动画缩放"
            :subtitle="store.transitionAnimationScale"
            chevron
            @click="openAnimPicker('transition')"
          />
          <ListCell
            title="动画程序时长缩放"
            :subtitle="store.animatorDurationScale"
            chevron
            last
            @click="openAnimPicker('animator')"
          />
        </div>
      </template>

      <!-- 动画缩放选择单选弹层 -->
      <div v-if="activeAnimPicker" class="picker-modal-overlay" @click.self="activeAnimPicker = null">
        <div class="picker-modal-card">
          <div class="picker-modal-title">选择动画缩放倍率</div>
          <div class="picker-list">
            <div
              v-for="opt in ANIM_OPTIONS"
              :key="opt"
              class="picker-item"
              @click="selectAnimScale(opt)"
            >
              <span class="picker-item-text">{{ opt }}</span>
              <span
                v-if="
                  (activeAnimPicker === 'window' && store.windowAnimationScale === opt) ||
                  (activeAnimPicker === 'transition' && store.transitionAnimationScale === opt) ||
                  (activeAnimPicker === 'animator' && store.animatorDurationScale === opt)
                "
                class="picker-item-check"
              >
                ✓
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </SubPageShell>
</template>

<style scoped>
.dev-container {
  padding: 12px 0 32px;
}

.master-card {
  margin-bottom: 8px;
}

.section-title {
  font-size: 13px;
  font-weight: 500;
  color: #6B7280;
  padding: 14px 16px 6px;
}

.picker-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 1000;
}

.picker-modal-card {
  width: 100%;
  max-width: 300px;
  background: #FFFFFF;
  border-radius: 18px;
  padding: 18px 20px;
}

.picker-modal-title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 12px;
}

.picker-list {
  display: flex;
  flex-direction: column;
}

.picker-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #F1F5F9;
  cursor: pointer;
}

.picker-item:last-child {
  border-bottom: none;
}

.picker-item-text {
  font-size: 14px;
  color: #334155;
}

.picker-item-check {
  color: #007AFF;
  font-weight: bold;
}
</style>
