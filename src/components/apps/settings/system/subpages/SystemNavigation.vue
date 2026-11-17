<script setup>
/**
 * 系统导航 · 真机 1:1 实测版（com.transsion.microintelligence / Infinix X6878 Android 17）
 * =================================================================================
 * 依据连接真机真实 XML 取证结构（/tmp/real_nav_dump.xml & /tmp/three_btn.xml）：
 *
 * 1. 顶部模式选择卡片（ll_img / ll_name / RadioButton）：
 *    - 左右并列两列（左「手势导航」，右「三键导航」），各含设备图框、标题、单选钮。
 *
 * 2. 手势导航模式下展开：
 *    - 卡片 1：学习手势（跳转演示，带 chevron）
 *    - 卡片 2：三行开关（隐藏手势导航条、圈定即搜 + 说明、语音助手 + 说明）
 *    - 外露标题：返回手势灵敏度
 *    - 卡片 3：低 - HorizontalSlider - 高
 *    - 外露底部说明：较高的敏感度可能会与沿屏幕边缘执行的任何应用手势存在冲突。
 *    - 卡片 4：侧边跟手动画 + 说明 + Switch 开关
 *
 * 3. 三键导航模式下展开：
 *    - 外露标题：按键布局
 *    - 卡片 1：两行单选（◁ ○ □ 与 □ ○ ◁）
 *    - 卡片 2：圈定即搜 + 说明 + Switch 开关
 */
import { computed, ref } from 'vue'
import SubPageShell from '../../subpage/SubPageShell.vue'
import ListCell from '../../../../ui/ListCell.vue'
import ToggleSwitch from '../../../../ui/ToggleSwitch.vue'
import SegmentedSlider from '../../../../ui/SegmentedSlider.vue'
import RadioButton from '../../../../ui/RadioButton.vue'
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
// 三段式灵敏度：0 (低) | 0.5 (中) | 1 (高)
const sensitivityRatio = ref(0.5)
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
      <!-- 1. 顶部大卡片：左右并列两列（真机 ViewGroup id=ll_img & ll_name） -->
      <div class="settings-card mode-select-card" data-test="mode-select-card">
        <div class="mode-columns">
          <!-- 左列：手势导航 -->
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
            <div class="mode-title">手势导航</div>
            <div class="radio-wrap">
              <RadioButton :checked="isGesture" />
            </div>
          </div>

          <!-- 右列：三键导航 -->
          <div
            class="mode-col"
            :class="{ active: !isGesture }"
            data-test="nav-mode-three-button"
            @click="selectMode('threeButton')"
          >
            <div class="preview-box">
              <div class="mock-phone keys-phone">
                <div class="mock-keys">
                  <svg class="key-svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4B4B4B" stroke-width="2.2" stroke-linejoin="round">
                    <polygon points="19 20 6 12 19 4 19 20"/>
                  </svg>
                  <svg class="key-svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4B4B4B" stroke-width="2.2">
                    <circle cx="12" cy="12" r="8"/>
                  </svg>
                  <svg class="key-svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4B4B4B" stroke-width="2.2">
                    <rect x="5" y="5" width="14" height="14" rx="2"/>
                  </svg>
                </div>
              </div>
            </div>
            <div class="mode-title">三键导航</div>
            <div class="radio-wrap">
              <RadioButton :checked="!isGesture" />
            </div>
          </div>
        </div>
      </div>

      <!-- 分支 A：手势导航展开（严格按真机顺序与卡片划分） -->
      <template v-if="isGesture">
        <!-- 卡片 1：学习手势 -->
        <div class="settings-card" data-test="card-gesture-guide">
          <ListCell
            title="学习手势"
            chevron
            last
            @click="showTip('手势教学演示')"
          />
        </div>

        <!-- 卡片 2：三行功能设置（隐藏手势导航条、圈定即搜、语音助手） -->
        <div class="settings-card" data-test="card-gesture-toggles">
          <ListCell
            data-test="row-hide-indicator"
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

        <!-- 外露标题：返回手势灵敏度 -->
        <div class="section-title">返回手势灵敏度</div>

        <!-- 卡片 3：灵敏度三段式分段滑块（参考真机字体设置页面 3 档规范） -->
        <div class="settings-card slider-card" data-test="card-sensitivity">
          <div class="slider-row">
            <span class="slider-label">低</span>
            <div class="slider-wrap">
              <SegmentedSlider
                v-model="sensitivityRatio"
                :steps="3"
              />
            </div>
            <span class="slider-label">高</span>
          </div>
        </div>

        <!-- 外露说明文案（真机在卡片外部） -->
        <div class="footer-note">
          较高的敏感度可能会与沿屏幕边缘执行的任何应用手势存在冲突。
        </div>

        <!-- 卡片 4：侧边跟手动画 -->
        <div class="settings-card" data-test="card-predictive-back">
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

      <!-- 分支 B：三键导航展开（严格按真机顺序与卡片划分） -->
      <template v-else>
        <!-- 外露标题：按键布局 -->
        <div class="section-title">按键布局</div>

        <!-- 卡片 1：按键位置布局单选卡片 -->
        <div class="settings-card layout-card" data-test="card-key-layout">
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

        <!-- 卡片 2：圈定即搜 -->
        <div class="settings-card" data-test="card-key-circle">
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

/* 顶部左右并列双列大卡片（真机 1:1） */
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
}

.preview-box {
  width: 100%;
  height: 184px;
  background: #F4F5F7;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.mock-phone {
  width: 108px;
  height: 160px;
  background: #FFFFFF;
  border-radius: 16px;
  position: relative;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.03);
}

.mock-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 3.5px;
  height: 30px;
  background: #3375F6;
  border-radius: 2px;
}
.mock-arrow-left { left: 4.5px; }
.mock-arrow-right { right: 4.5px; }

.mock-gesture-line {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 3.5px;
  background: #181818;
  border-radius: 2px;
}

.mock-keys {
  position: absolute;
  bottom: 12px;
  left: 0;
  right: 0;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: space-evenly;
}

.key-svg {
  display: block;
}

.mode-title {
  font-size: 16px;
  font-weight: 600;
  color: #111111;
  margin-bottom: 8px;
  text-align: center;
}

.radio-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 外露小标题（真机小字灰色） */
.section-title {
  font-size: 13px;
  font-weight: 500;
  color: #6B7280;
  padding: 8px 16px 2px;
}

/* 灵敏度滑动条卡片 */
.slider-card {
  padding: 16px 20px;
}

.slider-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.slider-wrap {
  flex: 1;
}

.slider-label {
  font-size: 15px;
  color: #111111;
  font-weight: 500;
}

/* 外露底部说明文案 */
.footer-note {
  font-size: 13px;
  color: #8E8E93;
  line-height: 1.5;
  padding: 0 16px 4px;
}

/* 按键布局行 */
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
  background: rgba(0, 0, 0, 0.78);
  color: #FFFFFF;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 13px;
  pointer-events: none;
  z-index: 999;
}
</style>
