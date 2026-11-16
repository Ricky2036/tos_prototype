<script setup>
/**
 * 系统导航 · 真机实测版（com.transsion.microintelligence）
 * ==========================================================
 * 真实证据：
 *   - .local-evidence/SET-SYS-01/device/real_sys_nav.xml
 *   - /tmp/nav_page.xml (手势导航)
 *   - /tmp/nav_page2.xml (灵敏度滑块与侧边跟手动画)
 *   - /tmp/three_btn.xml (三键导航与按键布局选择)
 *
 * 交互链路：
 *   1. 顶部左右并列大卡片：左「手势导航」，右「三键导航」。
 *   2. 选中「手势导航」时：
 *      - 选项：学习手势、隐藏手势导航条、圈定即搜、语音助手；
 *      - 返回手势灵敏度滑块（低-高）与冲突提示；
 *      - 侧边跟手动画开关。
 *   3. 选中「三键导航」时：
 *      - 按键布局单选切换（◁ ○ □ 与 □ ○ ◁）；
 *      - 圈定即搜开关。
 */
import { computed, ref } from 'vue'
import SubPageShell from '../../subpage/SubPageShell.vue'
import ListCell from '../../../../ui/ListCell.vue'
import ToggleSwitch from '../../../../ui/ToggleSwitch.vue'
import { useSystemStore } from '../../../../../stores/systemStore.js'
import { useSystemSettingsStore } from '../../../../../stores/systemSettingsStore.js'

const emit = defineEmits(['back'])
const systemStore = useSystemStore()
const settingsStore = useSystemSettingsStore()

const isGesture = computed(() => systemStore.navigationMode === 'gesture')

const circleToSearch = ref(true)
const voiceAssistant = ref(true)
const predictiveBack = ref(false)
const keyLayout = ref('standard') // 'standard' (◁ ○ □) | 'reversed' (□ ○ ◁)
const sensitivity = ref(50) // 0..100
const tipMsg = ref('')

function showTip(msg) {
  tipMsg.value = msg
  setTimeout(() => { tipMsg.value = '' }, 2000)
}

function selectMode(mode) {
  systemStore.setNavigationMode(mode)
}
</script>

<template>
  <SubPageShell title="系统导航" data-test="subpage-nav" @back="emit('back')">
    <div class="nav-container">
      <!-- 左右并列大卡片（真机 1:1） -->
      <div class="settings-card mode-select-card">
        <div class="mode-columns">
          <!-- 手势导航 -->
          <div
            class="mode-col"
            :class="{ active: isGesture }"
            data-test="nav-mode-gesture"
            @click="selectMode('gesture')"
          >
            <div class="preview-box">
              <div class="mock-phone">
                <div class="mock-arrow mock-arrow-left"></div>
                <div class="mock-arrow mock-arrow-right"></div>
                <div class="mock-gesture-line"></div>
              </div>
            </div>
            <div class="mode-name">手势导航</div>
            <div class="radio-wrap">
              <div class="native-radio" :class="{ checked: isGesture }">
                <div v-if="isGesture" class="radio-core"></div>
              </div>
            </div>
          </div>

          <!-- 三键导航 -->
          <div
            class="mode-col"
            :class="{ active: !isGesture }"
            data-test="nav-mode-three-button"
            @click="selectMode('threeButton')"
          >
            <div class="preview-box">
              <div class="mock-phone">
                <div class="mock-keys">
                  <span class="key-icon">◁</span>
                  <span class="key-icon">○</span>
                  <span class="key-icon">□</span>
                </div>
              </div>
            </div>
            <div class="mode-name">三键导航</div>
            <div class="radio-wrap">
              <div class="native-radio" :class="{ checked: !isGesture }">
                <div v-if="!isGesture" class="radio-core"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 分支 A：手势导航展开选项 -->
      <template v-if="isGesture">
        <div class="settings-card options-card">
          <ListCell
            title="学习手势"
            chevron
            @click="showTip('手势教学演示')"
          />
          <ListCell
            title="隐藏手势导航条"
          >
            <template #right>
              <ToggleSwitch
                :model-value="settingsStore.bottomBarHidden"
                @update:model-value="settingsStore.setBottomBarHidden"
              />
            </template>
          </ListCell>
          <ListCell
            title="圈定即搜"
            subtitle="轻触并按住“主屏幕”按钮或导航手柄，即可使用屏幕上的内容进行搜索。"
          >
            <template #right>
              <ToggleSwitch
                :model-value="circleToSearch"
                @update:model-value="circleToSearch = $event"
              />
            </template>
          </ListCell>
          <ListCell
            title="语音助手"
            subtitle="沿屏幕底部左边缘或右边缘上滑唤起语音助手。"
            last
          >
            <template #right>
              <ToggleSwitch
                :model-value="voiceAssistant"
                @update:model-value="voiceAssistant = $event"
              />
            </template>
          </ListCell>
        </div>

        <!-- 返回手势灵敏度滑杆 -->
        <div class="section-title">返回手势灵敏度</div>
        <div class="settings-card slider-card">
          <div class="slider-row">
            <span class="slider-label">低</span>
            <input
              v-model="sensitivity"
              type="range"
              min="0"
              max="100"
              class="range-slider"
            />
            <span class="slider-label">高</span>
          </div>
          <div class="slider-hint">
            较高的敏感度可能会与沿屏幕边缘执行的任何应用手势存在冲突。
          </div>
        </div>

        <!-- 侧边跟手动画 -->
        <div class="settings-card">
          <ListCell
            title="侧边跟手动画"
            subtitle="侧滑返回时支持跟手动画效果。"
            last
          >
            <template #right>
              <ToggleSwitch
                :model-value="predictiveBack"
                @update:model-value="predictiveBack = $event"
              />
            </template>
          </ListCell>
        </div>
      </template>

      <!-- 分支 B：三键导航展开选项 (按键布局) -->
      <template v-else>
        <div class="section-title">按键布局</div>
        <div class="settings-card">
          <ListCell
            title="◁  ○  □"
            subtitle="返回键在左侧"
            @click="keyLayout = 'standard'"
          >
            <template #right>
              <div class="native-radio" :class="{ checked: keyLayout === 'standard' }">
                <div v-if="keyLayout === 'standard'" class="radio-core"></div>
              </div>
            </template>
          </ListCell>
          <ListCell
            title="□  ○  ◁"
            subtitle="返回键在右侧"
            last
            @click="keyLayout = 'reversed'"
          >
            <template #right>
              <div class="native-radio" :class="{ checked: keyLayout === 'reversed' }">
                <div v-if="keyLayout === 'reversed'" class="radio-core"></div>
              </div>
            </template>
          </ListCell>
        </div>

        <div class="settings-card">
          <ListCell
            title="圈定即搜"
            subtitle="轻触并按住“主屏幕”按钮或导航手柄，即可使用屏幕上的内容进行搜索。"
            last
          >
            <template #right>
              <ToggleSwitch
                :model-value="circleToSearch"
                @update:model-value="circleToSearch = $event"
              />
            </template>
          </ListCell>
        </div>
      </template>

      <div v-if="tipMsg" class="toast-tip">
        {{ tipMsg }}
      </div>
    </div>
  </SubPageShell>
</template>

<style scoped>
.nav-container {
  padding: 16px 0 32px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.mode-select-card {
  padding: 16px;
}
.mode-columns {
  display: flex;
  gap: 16px;
}
.mode-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  padding: 12px 8px;
  border-radius: 14px;
  background: #F3F4F6;
  border: 1.5px solid transparent;
  transition: all 0.2s ease;
}
.mode-col.active {
  border-color: #0066FF;
  background: #EFF6FF;
}
.preview-box {
  width: 100%;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.mock-phone {
  width: 72px;
  height: 108px;
  background: #FFFFFF;
  border-radius: 10px;
  border: 2px solid #D1D5DB;
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}
.mock-arrow {
  position: absolute;
  top: 40%;
  width: 3px;
  height: 18px;
  background: #0066FF;
  border-radius: 2px;
}
.mock-arrow-left { left: 4px; }
.mock-arrow-right { right: 4px; }
.mock-gesture-line {
  width: 28px;
  height: 3px;
  background: #111827;
  border-radius: 2px;
  margin-bottom: 6px;
}
.mock-keys {
  display: flex;
  gap: 6px;
  margin-bottom: 6px;
  font-size: 11px;
  color: #4B5563;
}
.mode-name {
  font-size: 14px;
  font-weight: 600;
  color: #1F2937;
  margin-top: 8px;
}
.radio-wrap {
  margin-top: 8px;
}
.native-radio {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid #D1D5DB;
  display: flex;
  align-items: center;
  justify-content: center;
}
.native-radio.checked {
  border-color: #0066FF;
}
.radio-core {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #0066FF;
}
.section-title {
  font-size: 13px;
  font-weight: 500;
  color: #6B7280;
  padding: 8px 16px 2px;
}
.slider-card {
  padding: 16px;
}
.slider-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.slider-label {
  font-size: 13px;
  color: #6B7280;
}
.range-slider {
  flex: 1;
  accent-color: #0066FF;
}
.slider-hint {
  font-size: 12px;
  color: #9CA3AF;
  line-height: 1.5;
  margin-top: 10px;
}
.toast-tip {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.78);
  color: #FFFFFF;
  padding: 10px 20px;
  border-radius: 20px;
  font-size: 14px;
  z-index: 1100;
  pointer-events: none;
  animation: fadeIn 0.2s ease;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translate(-50%, 8px); }
  to { opacity: 1; transform: translate(-50%, 0); }
}
</style>
