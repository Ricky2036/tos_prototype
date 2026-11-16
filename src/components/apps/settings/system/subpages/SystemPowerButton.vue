<script setup>
/**
 * 按住电源按钮 · 真机实测版（com.android.settings）
 * ================================================
 * 真实证据：.local-evidence/SET-SYS-01/device/real_power_btn.xml
 * 结构：
 *   - 分组标题：按住电源按钮即可访问
 *   - 选项 1：电源菜单（单选）
 *   - 选项 2：数字助理（单选）
 *   - 底部说明：电源菜单：长按电源键 3 秒。
 */
import SubPageShell from '../../subpage/SubPageShell.vue'
import ListCell from '../../../../ui/ListCell.vue'
import { useSystemSettingsStore } from '../../../../../stores/systemSettingsStore.js'

const emit = defineEmits(['back'])
const store = useSystemSettingsStore()

function selectOption(opt) {
  store.setLongPressPower(opt)
}
</script>

<template>
  <SubPageShell title="按住电源按钮" data-test="subpage-power" @back="emit('back')">
    <div class="power-container">
      <div class="section-title">按住电源按钮即可访问</div>
      <div class="settings-card">
        <ListCell
          data-test="power-opt-power-menu"
          title="电源菜单"
          @click="selectOption('powerMenu')"
        >
          <template #right>
            <div class="radio-circle" :class="{ checked: store.longPressPower === 'powerMenu' }">
              <div v-if="store.longPressPower === 'powerMenu'" class="radio-dot"></div>
            </div>
          </template>
        </ListCell>

        <ListCell
          data-test="power-opt-assistant"
          title="数字助理"
          last
          @click="selectOption('assistant')"
        >
          <template #right>
            <div class="radio-circle" :class="{ checked: store.longPressPower === 'assistant' }">
              <div v-if="store.longPressPower === 'assistant'" class="radio-dot"></div>
            </div>
          </template>
        </ListCell>
      </div>

      <div class="footer-note">
        电源菜单：<br />长按电源键 3 秒。
      </div>
    </div>
  </SubPageShell>
</template>

<style scoped>
.power-container {
  padding: 12px 0 32px;
}
.section-title {
  font-size: 13px;
  font-weight: 500;
  color: #6B7280;
  padding: 8px 16px 6px;
}
.footer-note {
  font-size: 13px;
  color: #8E8E93;
  line-height: 1.5;
  padding: 12px 16px;
}
.radio-circle {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid #D0D5DD;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}
.radio-circle.checked {
  border-color: #2F6BF6;
}
.radio-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #2F6BF6;
}
</style>
