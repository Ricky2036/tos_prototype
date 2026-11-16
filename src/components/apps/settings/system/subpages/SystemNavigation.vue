<script setup>
/**
 * 系统导航 · 真机实测版（com.transsion.microintelligence）
 * ==========================================================
 * 真实证据：.local-evidence/SET-SYS-01/device/real_sys_nav.xml
 * 布局：
 * 顶部为左右并列的大卡片：左「手势导航」，右「三键导航」，下方各带 RadioButton；
 * 下方为选项卡片：
 *   - 学习手势
 *   - 隐藏手势导航条
 *   - 圈定即搜
 *   - 语音助手
 *   - 返回手势灵敏度
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

      <!-- 选项列表（对齐真机 microintelligence 菜单项） -->
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
        >
          <template #right>
            <ToggleSwitch
              :model-value="voiceAssistant"
              @update:model-value="voiceAssistant = $event"
            />
          </template>
        </ListCell>
        <ListCell
          title="返回手势灵敏度"
          last
          chevron
          @click="showTip('返回手势灵敏度已设为标准')"
        />
      </div>
    </div>
  </SubPageShell>
</template>

<style scoped>
.nav-container {
  padding: 12px 0 32px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.mode-select-card {
  padding: 16px 14px 20px;
}
.mode-columns {
  display: flex;
  gap: 12px;
}
.mode-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  padding: 8px 4px;
}
.preview-box {
  width: 100%;
  aspect-ratio: 16/10;
  background: #F2F4F7;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  border: 1.5px solid transparent;
  transition: all 0.2s ease;
}
.mode-col.active .preview-box {
  border-color: #2F6BF6;
  background: #EFF4FE;
}
.mock-phone {
  width: 72px;
  height: 48px;
  background: #FFFFFF;
  border-radius: 6px;
  border: 1px solid #D0D5DD;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
.mock-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 14px;
  background: #2F6BF6;
  border-radius: 2px;
}
.mock-arrow-left { left: 4px; }
.mock-arrow-right { right: 4px; }
.mock-gesture-line {
  position: absolute;
  bottom: 5px;
  width: 24px;
  height: 3px;
  background: #111111;
  border-radius: 2px;
}
.mock-keys {
  position: absolute;
  bottom: 4px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-around;
  padding: 0 8px;
}
.key-icon {
  font-size: 8px;
  color: #667085;
}
.mode-name {
  font-size: 15px;
  font-weight: 600;
  color: #111111;
  margin-bottom: 10px;
}
.radio-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
}
.native-radio {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid #D0D5DD;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}
.native-radio.checked {
  border-color: #2F6BF6;
}
.radio-core {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #2F6BF6;
}
</style>
