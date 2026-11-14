<script setup>
import { ref } from 'vue'
import SubPageShell from '../../subpage/SubPageShell.vue'
import ListCell from '../../../../ui/ListCell.vue'
import ToggleSwitch from '../../../../ui/ToggleSwitch.vue'

const emit = defineEmits(['back'])

const currentLanguage = ref('简体中文 (中国)')
const languages = ref([
  '简体中文 (中国)',
  'English (United States)',
])

const spellCheck = ref(true)
const autoCapitalize = ref(true)
const currentKeyboard = ref('Facemoji 输入法')

function selectLanguage(lang) {
  currentLanguage.value = lang
}
</script>

<template>
  <SubPageShell title="语言与输入法" @back="emit('back')">
    <div class="lang-container">
      <div class="section-title">系统语言</div>
      <div class="settings-card">
        <ListCell
          v-for="(lang, i) in languages"
          :key="lang"
          :data-test="`lang-item-${i}`"
          :title="lang"
          :subtitle="lang === currentLanguage ? '默认语言' : ''"
          :last="i === languages.length - 1"
          @click="selectLanguage(lang)"
        >
          <template #right>
            <div v-if="lang === currentLanguage" class="check-mark">✓</div>
          </template>
        </ListCell>
      </div>

      <div class="action-btn-row">
        <button class="add-lang-btn" data-test="btn-add-lang">
          + 添加语言
        </button>
      </div>

      <div class="section-title">键盘与输入法</div>
      <div class="settings-card">
        <ListCell
          title="当前输入法"
          :subtitle="currentKeyboard"
          chevron
          @click="currentKeyboard = currentKeyboard === 'Facemoji 输入法' ? '系统智能输入法' : 'Facemoji 输入法'"
        />
        <ListCell
          title="管理输入法"
          subtitle="已启用 2 个键盘"
          chevron
          last
          @click="() => {}"
        />
      </div>

      <div class="section-title">输入偏好</div>
      <div class="settings-card">
        <ListCell
          title="拼写检查"
          subtitle="在键入时自动标出疑似拼写错误"
        >
          <template #right>
            <ToggleSwitch
              data-test="toggle-spell-check"
              :model-value="spellCheck"
              @update:model-value="spellCheck = $event"
            />
          </template>
        </ListCell>

        <ListCell
          title="首字母大写"
          subtitle="在句子开头自动转换为大写"
          last
        >
          <template #right>
            <ToggleSwitch
              data-test="toggle-auto-cap"
              :model-value="autoCapitalize"
              @update:model-value="autoCapitalize = $event"
            />
          </template>
        </ListCell>
      </div>
    </div>
  </SubPageShell>
</template>

<style scoped>
.lang-container {
  padding: 12px 16px 32px;
}

.section-title {
  font-size: 13px;
  font-weight: 500;
  color: #6B7280;
  padding: 14px 16px 6px;
}

.check-mark {
  color: #007AFF;
  font-weight: bold;
  font-size: 16px;
}

.action-btn-row {
  padding: 12px 16px 4px;
}

.add-lang-btn {
  width: 100%;
  padding: 12px;
  background: #FFFFFF;
  border: 1px dashed #CBD5E1;
  border-radius: 12px;
  color: #007AFF;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.add-lang-btn:hover {
  background: #F8FAFC;
  border-color: #007AFF;
}
</style>
