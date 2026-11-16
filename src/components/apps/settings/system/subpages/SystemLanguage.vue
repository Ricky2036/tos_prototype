<script setup>
/**
 * 语言与输入法 · 真机实测版（com.android.settings）
 * ====================================================
 * 真实证据：
 *   - .local-evidence/SET-SYS-01/device/traversal/03_language_input.xml (主页)
 *   - /tmp/ime_dialog.xml (选择输入法弹层)
 *   - /tmp/local_picker.xml (语言与地区二级页)
 *
 * 交互链路：
 *   1. 主页 4 组卡片（语言、键盘、工具、地区偏好设置）。
 *   2. 点击「语言与地区」进入真实二级页，查看首选语言、添加语言入口、地区与区域格式示例。
 *   3. 点击「当前键盘」弹出系统级单选对话框「选择输入法」，可切换已安装输入法并写回。
 */
import { ref } from 'vue'
import SubPageShell from '../../subpage/SubPageShell.vue'
import ListCell from '../../../../ui/ListCell.vue'
import ToggleSwitch from '../../../../ui/ToggleSwitch.vue'
import RadioButton from '../../../../ui/RadioButton.vue'

const emit = defineEmits(['back'])

const secureKeyboard = ref(true)
const currentKeyboard = ref('搜狗输入法')
const tipMsg = ref('')

const showImePicker = ref(false)
const showLocalPicker = ref(false)

const IME_OPTIONS = [
  'Emoji Keyboard',
  '中文 (中国) Gboard',
  'Alphabet Gboard',
  '简体中文 Gboard',
  '搜狗输入法',
]

function showTip(msg) {
  tipMsg.value = msg
  setTimeout(() => { tipMsg.value = '' }, 2000)
}

function selectIme(ime) {
  currentKeyboard.value = ime
  showImePicker.value = false
}

function onBack() {
  if (showLocalPicker.value) {
    showLocalPicker.value = false
    return
  }
  emit('back')
}
</script>

<template>
  <!-- 主页面：语言与输入法 -->
  <SubPageShell
    v-if="!showLocalPicker"
    title="语言与输入法"
    data-test="subpage-lang"
    @back="onBack"
  >
    <div class="lang-container">
      <!-- 组 1：语言 -->
      <div class="settings-card">
        <ListCell
          data-test="row-lang-local"
          title="语言与地区"
          subtitle="简体中文"
          chevron
          @click="showLocalPicker = true"
        />
        <ListCell
          title="应用语言"
          subtitle="设置各应用的语言。"
          last
          chevron
          @click="showTip('设置各应用的语言')"
        />
      </div>

      <!-- 组 2：键盘 -->
      <div class="section-title">键盘</div>
      <div class="settings-card">
        <ListCell
          data-test="row-current-ime"
          title="当前键盘"
          :subtitle="currentKeyboard"
          chevron
          @click="showImePicker = true"
        />
        <ListCell
          title="键盘应用"
          subtitle="Emoji Keyboard、Google 语音输入、Gboard、搜狗输入法..."
          chevron
          @click="showTip('键盘应用管理')"
        />
        <ListCell
          title="安全键盘"
          subtitle="输入密码时切换到安全键盘"
          last
        >
          <template #right>
            <ToggleSwitch
              :model-value="secureKeyboard"
              @update:model-value="secureKeyboard = $event"
            />
          </template>
        </ListCell>
      </div>

      <!-- 组 3：工具 -->
      <div class="section-title">工具</div>
      <div class="settings-card">
        <ListCell
          title="拼写检查工具"
          subtitle="Gboard 拼写检查工具"
          chevron
          @click="showTip('拼写检查工具')"
        />
        <ListCell
          title="个人字典"
          subtitle="添加要在“拼写检查工具”等应用中使用的字词。"
          chevron
          @click="showTip('个人字典')"
        />
        <ListCell
          title="语音"
          subtitle="控制语音识别和输出。"
          last
          chevron
          @click="showTip('语音识别和输出')"
        />
      </div>

      <!-- 组 4：地区偏好设置 -->
      <div class="section-title">地区偏好设置</div>
      <div class="settings-card">
        <ListCell
          title="温度"
          subtitle="摄氏度 (°C)"
          chevron
          @click="showTip('温度单位设置')"
        />
        <ListCell
          title="首周开始日"
          subtitle="星期日"
          last
          chevron
          @click="showTip('首周开始日设置')"
        />
      </div>

      <!-- 输入法切换对话框 (对齐真机 ime_dialog) -->
      <div v-if="showImePicker" class="modal-overlay" @click.self="showImePicker = false">
        <div class="modal-card" data-test="ime-modal-card">
          <div class="modal-title">选择输入法</div>
          <div class="ime-options-list">
            <div
              v-for="ime in IME_OPTIONS"
              :key="ime"
              class="ime-option-row"
              :class="{ active: currentKeyboard === ime }"
              @click="selectIme(ime)"
            >
              <span class="ime-name">{{ ime }}</span>
              <RadioButton :checked="currentKeyboard === ime" />
            </div>
          </div>
          <div class="modal-actions">
            <button class="btn-cancel" @click="showImePicker = false">取消</button>
            <button class="btn-confirm" @click="showImePicker = false">设置</button>
          </div>
        </div>
      </div>

      <div v-if="tipMsg" class="toast-tip">
        {{ tipMsg }}
      </div>
    </div>
  </SubPageShell>

  <!-- 二级页面：语言与地区 (对齐真机 local_picker.xml) -->
  <SubPageShell
    v-else
    title="语言与地区"
    data-test="subpage-local-picker"
    @back="showLocalPicker = false"
  >
    <div class="local-picker-container">
      <div class="section-title">首选语言</div>
      <div class="settings-card">
        <ListCell title="1. 简体中文" />
        <ListCell title="2. English (US)" subtitle="英语（美国）" />
        <ListCell title="添加语言" last>
          <template #icon>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0066FF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </template>
        </ListCell>
      </div>

      <div class="section-title">地区</div>
      <div class="settings-card">
        <ListCell title="地区" subtitle="中国" last />
      </div>

      <div class="section-title">区域格式示例</div>
      <div class="settings-card format-sample-card">
        <div class="format-sample-line">00:34</div>
        <div class="format-sample-line">2026年1月21日星期三</div>
        <div class="format-sample-line">¥12,345.6</div>
        <div class="format-sample-line">34.56%</div>
      </div>
    </div>
  </SubPageShell>
</template>

<style scoped>
.lang-container,
.local-picker-container {
  padding: 12px 0 32px;
}
.section-title {
  font-size: 13px;
  font-weight: 500;
  color: #6B7280;
  padding: 12px 16px 4px;
}
.format-sample-card {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.format-sample-line {
  font-size: 15px;
  color: #374151;
  font-variant-numeric: tabular-nums;
}

/* 弹层样式 */
.modal-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
}
.modal-card {
  width: 100%;
  max-width: 420px;
  background: #FFFFFF;
  border-radius: 20px 20px 0 0;
  padding: 20px 20px 24px;
  box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.12);
  animation: slideUp 0.22s cubic-bezier(0.2, 0.9, 0.3, 1);
}
@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  text-align: center;
  margin-bottom: 16px;
}
.ime-options-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.ime-option-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 12px;
  border-radius: 10px;
  cursor: pointer;
}
.ime-option-row:active {
  background: #F3F4F6;
}
.ime-name {
  font-size: 16px;
  color: #1F2937;
}
.native-radio {
  width: 20px;
  height: 20px;
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
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #0066FF;
}
.modal-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}
.btn-cancel,
.btn-confirm {
  flex: 1;
  height: 44px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  border: none;
}
.btn-cancel {
  background: #F3F4F6;
  color: #4B5563;
}
.btn-cancel:active {
  background: #E5E7EB;
}
.btn-confirm {
  background: #0066FF;
  color: #FFFFFF;
}
.btn-confirm:active {
  background: #0052CC;
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
