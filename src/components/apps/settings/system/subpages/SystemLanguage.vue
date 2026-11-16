<script setup>
/**
 * 语言与输入法 · 真机实测版（com.android.settings）
 * ====================================================
 * 真实证据：.local-evidence/SET-SYS-01/device/real_sys_lang.xml
 * 4 组卡片：
 *   1. 语言与地区、应用语言
 *   2. 键盘：当前键盘、键盘应用、安全键盘
 *   3. 工具：拼写检查工具、个人字典、语音
 *   4. 地区偏好设置：温度
 */
import { ref } from 'vue'
import SubPageShell from '../../subpage/SubPageShell.vue'
import ListCell from '../../../../ui/ListCell.vue'
import ToggleSwitch from '../../../../ui/ToggleSwitch.vue'

const emit = defineEmits(['back'])

const secureKeyboard = ref(true)
const currentKeyboard = ref('Facemoji 输入法')
const tipMsg = ref('')

function showTip(msg) {
  tipMsg.value = msg
  setTimeout(() => { tipMsg.value = '' }, 2000)
}
</script>

<template>
  <SubPageShell title="语言与输入法" @back="emit('back')">
    <div class="lang-container">
      <!-- 组 1：语言 -->
      <div class="settings-card">
        <ListCell
          title="语言与地区"
          subtitle="简体中文（中国）"
          chevron
          @click="showTip('语言与地区')"
        />
        <ListCell
          title="应用语言"
          subtitle="所有应用默认"
          last
          chevron
          @click="showTip('应用语言')"
        />
      </div>

      <!-- 组 2：键盘 -->
      <div class="section-title">键盘</div>
      <div class="settings-card">
        <ListCell
          title="当前键盘"
          :subtitle="currentKeyboard"
          chevron
          @click="currentKeyboard = currentKeyboard === 'Facemoji 输入法' ? '智能输入法' : 'Facemoji 输入法'"
        />
        <ListCell
          title="键盘应用"
          subtitle="已启用 2 个键盘"
          chevron
          @click="showTip('键盘应用')"
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
          subtitle="系统拼写检查"
          chevron
          @click="showTip('拼写检查工具')"
        />
        <ListCell
          title="个人字典"
          chevron
          @click="showTip('个人字典')"
        />
        <ListCell
          title="语音"
          subtitle="文字转语音输出"
          last
          chevron
          @click="showTip('语音输出设置')"
        />
      </div>

      <!-- 组 4：地区偏好设置 -->
      <div class="section-title">地区偏好设置</div>
      <div class="settings-card">
        <ListCell
          title="温度"
          subtitle="摄氏度 (°C)"
          last
          chevron
          @click="showTip('温度单位已设为摄氏度')"
        />
      </div>

      <div v-if="tipMsg" class="toast-tip">{{ tipMsg }}</div>
    </div>
  </SubPageShell>
</template>

<style scoped>
.lang-container {
  padding: 12px 0 32px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.section-title {
  font-size: 13px;
  font-weight: 500;
  color: #6B7280;
  padding: 8px 16px 2px;
}
.toast-tip {
  position: fixed;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(17, 24, 39, 0.88);
  color: #FFFFFF;
  padding: 10px 20px;
  border-radius: 20px;
  font-size: 13px;
  z-index: 1000;
}
</style>
