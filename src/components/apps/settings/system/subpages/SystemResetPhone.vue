<script setup>
/**
 * 重置手机 · 真机实测版（com.android.settings）
 * ============================================
 * 真实证据：
 *   - .local-evidence/SET-SYS-01/device/real_reset.xml
 *   - /tmp/reset_net.xml (重置无线设置底层弹层)
 *   - /tmp/clear_data.xml (彻底清除全部数据二级页)
 *
 * 交互链路：
 *   1. 主页 2 项：
 *      - 「重置无线设置」（副标题：重置 WLAN、移动数据网络和蓝牙设置。）
 *      - 「彻底清除全部数据」
 *   2. 点击「重置无线设置」调起底层对话框：
 *      标题「重置无线设置吗」，内容「重置 WLAN、移动数据网络和蓝牙设置。」，按钮「取消」与「重置」。
 *   3. 点击「彻底清除全部数据」进入二级页面：
 *      展示数据抹除清单、已登录账号列表、以及底部大号红色按钮「清除所有数据」。
 */
import { ref } from 'vue'
import SubPageShell from '../../subpage/SubPageShell.vue'
import ListCell from '../../../../ui/ListCell.vue'

const emit = defineEmits(['back'])

const showResetNetModal = ref(false)
const showClearDataPage = ref(false)
const resetToast = ref('')

function openNetModal() {
  showResetNetModal.value = true
}

function confirmNetReset() {
  showResetNetModal.value = false
  resetToast.value = '网络设置已重置'
  setTimeout(() => { resetToast.value = '' }, 2500)
}

function openClearPage() {
  showClearDataPage.value = true
}

function confirmFullClear() {
  showClearDataPage.value = false
  resetToast.value = '出厂设置已完成模拟重置'
  setTimeout(() => { resetToast.value = '' }, 2500)
}

function onBack() {
  if (showClearDataPage.value) {
    showClearDataPage.value = false
    return
  }
  emit('back')
}
</script>

<template>
  <!-- 主页面：重置选项 -->
  <SubPageShell
    v-if="!showClearDataPage"
    title="重置手机"
    data-test="subpage-reset"
    @back="onBack"
  >
    <div class="reset-container">
      <div class="settings-card">
        <ListCell
          data-test="reset-network"
          title="重置无线设置"
          subtitle="重置 WLAN、移动数据网络和蓝牙设置。"
          chevron
          @click="openNetModal"
        />
        <ListCell
          data-test="reset-factory"
          title="彻底清除全部数据"
          last
          chevron
          @click="openClearPage"
        />
      </div>

      <!-- 重置无线设置底层对话框 (对齐真机 reset_net.xml) -->
      <div v-if="showResetNetModal" class="confirm-modal-overlay" @click.self="showResetNetModal = false">
        <div class="confirm-modal-card">
          <div class="modal-title">重置无线设置吗</div>
          <div class="modal-message">重置 WLAN、移动数据网络和蓝牙设置。</div>
          <div class="modal-actions">
            <button class="modal-btn-cancel" @click="showResetNetModal = false">取消</button>
            <button class="modal-btn-confirm" @click="confirmNetReset">重置</button>
          </div>
        </div>
      </div>

      <div v-if="resetToast" class="toast-tip">
        {{ resetToast }}
      </div>
    </div>
  </SubPageShell>

  <!-- 二级页面：彻底清除全部数据 (对齐真机 clear_data.xml) -->
  <SubPageShell
    v-else
    title="彻底清除全部数据"
    data-test="subpage-clear-data"
    @back="showClearDataPage = false"
  >
    <div class="clear-data-container">
      <div class="warning-block">
        <p class="warning-title">此操作将清除手机内部存储空间中的所有数据，包括：</p>
        <ul class="warning-list">
          <li>Google 账号</li>
          <li>系统和应用的数据和设置</li>
          <li>已下载的应用</li>
          <li>音乐</li>
          <li>照片</li>
          <li>其他的用户数据</li>
        </ul>
      </div>

      <div class="section-title">您目前已登录以下账号：</div>
      <div class="settings-card accounts-card">
        <ListCell title="Ricky" subtitle="本地账号" />
        <ListCell title="Meet" subtitle="会议账号" />
        <ListCell title="爱_智慧" subtitle="云端账号" last />
      </div>

      <div class="clear-action-wrap">
        <button class="btn-clear-all" data-test="btn-clear-all" @click="confirmFullClear">
          清除所有数据
        </button>
      </div>
    </div>
  </SubPageShell>
</template>

<style scoped>
.reset-container {
  padding: 16px 0 32px;
}
.clear-data-container {
  padding: 16px 0 40px;
  display: flex;
  flex-direction: column;
}
.warning-block {
  padding: 8px 16px 16px;
  font-size: 14px;
  line-height: 1.6;
  color: #4B5563;
}
.warning-title {
  margin: 0 0 8px;
  color: #111827;
  font-weight: 500;
}
.warning-list {
  margin: 0;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.section-title {
  font-size: 13px;
  font-weight: 500;
  color: #6B7280;
  padding: 12px 16px 6px;
}
.accounts-card {
  margin-bottom: 24px;
}
.clear-action-wrap {
  padding: 16px;
  margin-top: auto;
}
.btn-clear-all {
  width: 100%;
  height: 48px;
  border-radius: 14px;
  background: #DC2626;
  color: #FFFFFF;
  font-size: 16px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: background 0.15s ease;
}
.btn-clear-all:active {
  background: #B91C1C;
}

/* 确认模态弹窗 */
.confirm-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
}
.confirm-modal-card {
  width: 100%;
  max-width: 420px;
  background: #FFFFFF;
  border-radius: 20px 20px 0 0;
  padding: 24px 20px 20px;
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
}
.modal-message {
  font-size: 14px;
  color: #6B7280;
  line-height: 1.5;
  margin: 12px 0 24px;
  text-align: center;
}
.modal-actions {
  display: flex;
  gap: 12px;
}
.modal-btn-cancel,
.modal-btn-confirm {
  flex: 1;
  height: 44px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  border: none;
}
.modal-btn-cancel {
  background: #F3F4F6;
  color: #4B5563;
}
.modal-btn-cancel:active {
  background: #E5E7EB;
}
.modal-btn-confirm {
  background: #0066FF;
  color: #FFFFFF;
}
.modal-btn-confirm:active {
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
