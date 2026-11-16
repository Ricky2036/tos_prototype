<script setup>
/**
 * 系统导航 · 真机实测版（com.transsion.microintelligence / Android 17）
 * ==========================================================
 * 依据真实手机截图与 XML 取证：
 *   1. 顶部大卡片竖向并列两项（非左右卡片）：
 *      - 上项「手势导航」：带手机外框（左右蓝色手势指示条 + 底部手势横条）+ 单选框 + 说明文案；
 *      - 下项「三键导航」：带手机外框（底部 ◁ ○ □ 虚拟按键）+ 单选框 + 说明文案。
 *   2. 「手势设置」卡片组（手势导航下）：
 *      - 「返回手势震动提示」（默认开）
 *      - 「隐藏手势底部指示条」（默认关）
 *   3. 「返回手势灵敏度」分组：
 *      - 标准水平滑块控件 HorizontalSlider（低 - 高）
 *      - 说明文案：「较高的敏感度可能会与沿屏幕边缘执行的任何应用手势存在冲突。」
 *   4. 切换为「三键导航」时展示按键布局选择。
 */
import { computed, ref } from 'vue'
import SubPageShell from '../../subpage/SubPageShell.vue'
import ListCell from '../../../../ui/ListCell.vue'
import ToggleSwitch from '../../../../ui/ToggleSwitch.vue'
import HorizontalSlider from '../../../../ui/HorizontalSlider.vue'
import RadioButton from '../../../../ui/RadioButton.vue'
import { useSystemStore } from '../../../../../stores/systemStore.js'
import { useSystemSettingsStore } from '../../../../../stores/systemSettingsStore.js'

const emit = defineEmits(['back'])
const systemStore = useSystemStore()
const settingsStore = useSystemSettingsStore()

const isGesture = computed(() => systemStore.navigationMode === 'gesture')

const gestureHaptic = ref(true)
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
      <!-- 模式选择卡片（真机 1:1 纵向布局） -->
      <div class="settings-card mode-select-card">
        <!-- 1. 手势导航 -->
        <div
          class="mode-section"
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
          <div class="mode-info-row">
            <RadioButton :checked="isGesture" />
            <div class="mode-text-col">
              <div class="mode-title">手势导航</div>
              <div class="mode-desc">
                从屏幕底部边缘向上滑动返回主屏幕，从左或右边缘向内滑动返回上一级。
              </div>
            </div>
          </div>
        </div>

        <div class="mode-divider"></div>

        <!-- 2. 三键导航 -->
        <div
          class="mode-section"
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
          <div class="mode-info-row">
            <RadioButton :checked="!isGesture" />
            <div class="mode-text-col">
              <div class="mode-title">三键导航</div>
              <div class="mode-desc">
                使用屏幕底部的虚拟按键进行返回、返回主屏幕和打开多任务。
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 分支 A：手势导航展开选项 -->
      <template v-if="isGesture">
        <div class="section-title">手势设置</div>
        <div class="settings-card">
          <ListCell
            title="返回手势震动提示"
            subtitle="从边缘向内滑动触发返回时提供触感反馈"
          >
            <template #right>
              <ToggleSwitch
                :model-value="gestureHaptic"
                @update:model-value="gestureHaptic = $event"
              />
            </template>
          </ListCell>
          <ListCell
            title="隐藏手势底部指示条"
            subtitle="隐藏屏幕底部的手势横条以获取完整全屏视野"
            last
          >
            <template #right>
              <ToggleSwitch
                :model-value="settingsStore.bottomBarHidden"
                @update:model-value="settingsStore.setBottomBarHidden"
              />
            </template>
          </ListCell>
        </div>

        <!-- 返回手势灵敏度滑块控件 -->
        <div class="section-title">返回手势灵敏度</div>
        <div class="settings-card slider-card">
          <div class="slider-row">
            <span class="slider-label">低</span>
            <HorizontalSlider
              v-model="sensitivity"
              :min="0"
              :max="100"
              data-test="gesture-sensitivity-slider"
            />
            <span class="slider-label">高</span>
          </div>
          <div class="slider-hint">
            较高的敏感度可能会与沿屏幕边缘执行的任何应用手势存在冲突。
          </div>
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
              <RadioButton :checked="keyLayout === 'standard'" />
            </template>
          </ListCell>
          <ListCell
            title="□  ○  ◁"
            subtitle="返回键在右侧"
            last
            @click="keyLayout = 'reversed'"
          >
            <template #right>
              <RadioButton :checked="keyLayout === 'reversed'" />
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
.mode-section {
  display: flex;
  flex-direction: column;
  cursor: pointer;
  border-radius: 12px;
  transition: all 0.15s ease;
}
.preview-box {
  width: 100%;
  height: 130px;
  background: #F4F6F8;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.mock-phone {
  width: 120px;
  height: 84px;
  background: #FFFFFF;
  border-radius: 10px;
  border: 1.5px solid #D1D5DB;
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}
.mock-arrow {
  position: absolute;
  top: 36%;
  width: 3.5px;
  height: 20px;
  background: #60A5FA;
  border-radius: 2px;
}
.mock-arrow-left { left: 4px; }
.mock-arrow-right { right: 4px; }
.mock-gesture-line {
  width: 38px;
  height: 3px;
  background: #111827;
  border-radius: 2px;
  margin-bottom: 7px;
}
.mock-keys {
  display: flex;
  gap: 16px;
  margin-bottom: 6px;
  font-size: 11px;
  color: #6B7280;
}
.key-icon {
  display: inline-block;
  line-height: 1;
}
.mode-info-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 4px 6px;
}
.mode-text-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.mode-title {
  font-size: 16px;
  font-weight: 700;
  color: #111827;
  line-height: 20px;
}
.mode-desc {
  font-size: 13px;
  color: #6B7280;
  line-height: 1.45;
}
.mode-divider {
  height: 1px;
  background: #E5E7EB;
  margin: 16px 0;
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
  gap: 14px;
}
.slider-label {
  font-size: 14px;
  font-weight: 500;
  color: #4B5563;
  flex-shrink: 0;
}
.slider-hint {
  font-size: 13px;
  color: #6B7280;
  line-height: 1.45;
  margin-top: 12px;
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
