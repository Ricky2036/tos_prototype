<script setup>
/**
 * 系统导航 · 真机 1:1 实测对齐版（Infinix X6878 / Android 17）
 * ==========================================================
 * 依据用户真机实测截图（media_1794797101415_3e31d7d9, media_1794816404770_fd179a4b, media_1794829964810_8ed9e15e）：
 *   1. 顶部大卡片（上下双项）：
 *      - 上项：手势导航预览图 + 单选框 (●) + 标题 + 说明文案
 *      - 分割线
 *      - 下项：三键导航预览图 + 单选框 (○) + 标题 + 说明文案
 *   2. 手势设置（分组标题）：
 *      - 返回手势震动提示（绿色开关，开启状态）+ 说明文案
 *      - 隐藏手势底部指示条（开关，关闭状态）+ 说明文案
 *   3. 返回手势灵敏度（分组标题）：
 *      - 白色大圆角卡片内部：低 - 标准水平滑块（HorizontalSlider） - 高
 *      - 底部说明文案：「较高的敏感度可能会与沿屏幕边缘执行的任何应用手势存在冲突。」
 *   4. 三键导航状态下：
 *      - 按键布局单选切换（◁ ○ □ 与 □ ○ ◁）
 *      - 圈定即搜开关
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

const gestureVibration = ref(true)
const circleToSearch = ref(true)
const voiceAssistant = ref(true)
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
      <!-- 顶部单一大卡片：上下排列手势与三键（严格对齐真机截图） -->
      <div class="settings-card mode-select-card" data-test="mode-select-card">
        <!-- 选项 1：手势导航 -->
        <div
          class="mode-item"
          :class="{ selected: isGesture }"
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
          <div class="mode-header">
            <div class="radio-wrap">
              <RadioButton :checked="isGesture" />
            </div>
            <div class="mode-title">手势导航</div>
          </div>
          <div class="mode-desc">
            从屏幕底部边缘向上滑动返回主屏幕，从左或右边缘向内滑动返回上一级。
          </div>
        </div>

        <div class="mode-divider"></div>

        <!-- 选项 2：三键导航 -->
        <div
          class="mode-item"
          :class="{ selected: !isGesture }"
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
          <div class="mode-header">
            <div class="radio-wrap">
              <RadioButton :checked="!isGesture" />
            </div>
            <div class="mode-title">三键导航</div>
          </div>
          <div class="mode-desc">
            使用屏幕底部的虚拟按键进行返回、返回主屏幕和打开多任务。
          </div>
        </div>
      </div>

      <!-- 分支 A：手势导航展开选项 -->
      <template v-if="isGesture">
        <!-- 分组标题：手势设置 -->
        <div class="section-title">手势设置</div>
        <div class="settings-card gesture-settings-card">
          <ListCell
            data-test="row-gesture-vibration"
            title="返回手势震动提示"
            subtitle="从边缘向内滑动触发返回时提供触感反馈"
          >
            <template #right>
              <ToggleSwitch
                color="green"
                :model-value="gestureVibration"
                @update:model-value="gestureVibration = $event"
              />
            </template>
          </ListCell>
          <ListCell
            data-test="row-hide-indicator"
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

        <!-- 分组标题：返回手势灵敏度 -->
        <div class="section-title">返回手势灵敏度</div>
        <div class="settings-card sensitivity-card" data-test="sensitivity-card">
          <div class="slider-row">
            <span class="slider-label">低</span>
            <div class="slider-wrap">
              <HorizontalSlider
                v-model="sensitivity"
                :min="0"
                :max="100"
                :step="1"
              />
            </div>
            <span class="slider-label">高</span>
          </div>
          <div class="slider-footer-desc">
            较高的敏感度可能会与沿屏幕边缘执行的任何应用手势存在冲突。
          </div>
        </div>

        <!-- 额外手势增强服务卡片 -->
        <div class="section-title">其他手势功能</div>
        <div class="settings-card">
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
          >
            <template #right>
              <ToggleSwitch
                :model-value="voiceAssistant"
                @update:model-value="voiceAssistant = $event"
              />
            </template>
          </ListCell>
          <ListCell
            title="学习手势"
            chevron
            last
            @click="showTip('手势教学演示')"
          />
        </div>
      </template>

      <!-- 分支 B：三键导航展开选项 -->
      <template v-else>
        <div class="section-title">按键布局</div>
        <div class="settings-card layout-card" data-test="layout-card">
          <div
            class="layout-row"
            :class="{ active: keyLayout === 'standard' }"
            data-test="layout-standard"
            @click="keyLayout = 'standard'"
          >
            <div class="layout-icons">
              <span class="k-sym">◁</span>
              <span class="k-sym">○</span>
              <span class="k-sym">□</span>
            </div>
            <RadioButton :checked="keyLayout === 'standard'" />
          </div>
          <div
            class="layout-row"
            :class="{ active: keyLayout === 'reversed' }"
            data-test="layout-reversed"
            @click="keyLayout = 'reversed'"
          >
            <div class="layout-icons">
              <span class="k-sym">□</span>
              <span class="k-sym">○</span>
              <span class="k-sym">◁</span>
            </div>
            <RadioButton :checked="keyLayout === 'reversed'" />
          </div>
        </div>

        <div class="section-title">其他功能</div>
        <div class="settings-card">
          <ListCell
            title="圈定即搜"
            subtitle="长按主屏幕按钮（○）即可使用屏幕上的内容进行搜索。"
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
  padding: 12px 0 36px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.settings-card {
  background: #FFFFFF;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: none;
}

/* 顶部模式单一大卡片 */
.mode-select-card {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.mode-item {
  display: flex;
  flex-direction: column;
  cursor: pointer;
}

.mode-divider {
  height: 1px;
  background: #F0F0F2;
  margin: 4px 0;
}

.preview-box {
  width: 100%;
  height: 120px;
  background: #F4F5F7;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 14px;
}

.mock-phone {
  width: 130px;
  height: 80px;
  background: #FFFFFF;
  border-radius: 8px;
  position: relative;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.mock-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 18px;
  background: #4A90E2;
  border-radius: 2px;
}
.mock-arrow-left { left: 4px; }
.mock-arrow-right { right: 4px; }

.mock-gesture-line {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  width: 38px;
  height: 3px;
  background: #111111;
  border-radius: 2px;
}

.mock-keys {
  display: flex;
  align-items: center;
  justify-content: space-around;
  width: 100%;
  height: 100%;
  padding-top: 36px;
}

.key-icon {
  font-size: 13px;
  color: #666666;
  font-weight: 600;
}

.mode-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.radio-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
}

.mode-title {
  font-size: 16px;
  font-weight: 600;
  color: #111111;
}

.mode-desc {
  font-size: 13px;
  color: #6B7280;
  line-height: 1.45;
  padding-left: 30px;
}

/* 分组标题 */
.section-title {
  font-size: 13px;
  font-weight: 500;
  color: #6B7280;
  padding: 4px 4px 0;
}

/* 灵敏度滑块卡片 */
.sensitivity-card {
  padding: 16px 20px 14px;
}

.slider-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
}

.slider-wrap {
  flex: 1;
}

.slider-label {
  font-size: 15px;
  color: #111111;
  font-weight: 500;
}

.slider-footer-desc {
  font-size: 13px;
  color: #6B7280;
  line-height: 1.45;
}

/* 按键布局 */
.layout-card {
  padding: 4px 0;
}

.layout-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  cursor: pointer;
  border-bottom: 1px solid #F0F0F2;
}
.layout-row:last-child {
  border-bottom: none;
}

.layout-icons {
  display: flex;
  gap: 24px;
}

.k-sym {
  font-size: 16px;
  color: #333333;
}

.toast-tip {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.75);
  color: #FFFFFF;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 13px;
  pointer-events: none;
  z-index: 999;
}
</style>
