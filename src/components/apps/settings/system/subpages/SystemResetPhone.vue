<script setup>
/**
 * 重置手机 · 真机实测版（com.android.settings）
 * ============================================
 * 真实证据：.local-evidence/SET-SYS-01/device/real_reset.xml
 * 真机仅 2 行：
 *   1. 重置无线设置（重置 WLAN、移动数据网络和蓝牙设置。）
 *   2. 彻底清除全部数据
 */
import { ref } from 'vue'
import SubPageShell from '../../subpage/SubPageShell.vue'
import ListCell from '../../../../ui/ListCell.vue'

const emit = defineEmits(['back'])

const activeModal = ref(null) // 'network' | 'factory'
const resetToast = ref('')

function openModal(type) {
  activeModal.value = type
}

function confirmReset() {
  if (activeModal.value === 'network') {
    resetToast.value = '网络设置已还原'
  } else if (activeModal.value === 'factory') {
    resetToast.value = '出厂设置模拟重置完成'
  }
  activeModal.value = null
  setTimeout(() => {
    resetToast.value = ''
  }, 2500)
}
</script>

<template>
  <SubPageShell title="重置手机" data-test="subpage-reset" @back="emit('back')">
    <div class="reset-container">
      <div class="section-title">重置选项</div>
      <div class="settings-card">
        <ListCell
          data-test="reset-network"
          title="重置无线设置"
          subtitle="重置 WLAN、移动数据网络和蓝牙设置。"
          chevron
          @click="openModal('network')"
        />
        <ListCell
          data-test="reset-factory"
          title="彻底清除全部数据"
          subtitle="恢复出厂设置并清除所有本地数据"
          last
          chevron
          @click="openModal('factory')"
        />
      </div>

      <!-- 确认模态弹窗 -->
      <div v-if="activeModal" class="confirm-modal-overlay" @click.self="activeModal = null">
        <div class="confirm-modal-card">
          <div class="modal-title">
            {{ activeModal === 'network' ? '还原无线网络设置？' : '确认恢复出厂设置？' }}
          </div>
          <div class="modal-message">
            {{
              activeModal === 'network'
                ? '此操作将重置所有 Wi-Fi、移动数据及蓝牙设置，已保存的密码可能需要重新输入。'
                : '此操作将格式化并清除手机上的全部个人数据与已安装应用，请确保已提前完成备份。'
            }}
          </div>
          <div class="modal-actions">
            <button class="modal-btn-cancel" @click="activeModal = null">取消</button>
            <button
              class="modal-btn-confirm"
              :class="{ danger: activeModal === 'factory' }"
              @click="confirmReset"
            >
              {{ activeModal === 'factory' ? '重置并清除' : '还原' }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="resetToast" class="toast-tip">
        {{ resetToast }}
      </div>
    </div>
  </SubPageShell>
</template>

<style scoped>
.reset-container {
  padding: 12px 0 32px;
}

.section-title {
  font-size: 13px;
  font-weight: 500;
  color: #6B7280;
  padding: 8px 16px 2px;
}

.confirm-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 1000;
}

.confirm-modal-card {
  width: 100%;
  max-width: 320px;
  background: #FFFFFF;
  border-radius: 18px;
  padding: 20px 20px 16px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.modal-title {
  font-size: 17px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 10px;
}

.modal-message {
  font-size: 13px;
  color: #6B7280;
  line-height: 1.5;
  margin-bottom: 20px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.modal-btn-cancel {
  background: #F1F5F9;
  color: #475569;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.modal-btn-confirm {
  background: #007AFF;
  color: #FFFFFF;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.modal-btn-confirm.danger {
  background: #EF4444;
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
