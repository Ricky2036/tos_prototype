<script setup>
import { ref } from 'vue'
import { usePhoneStore } from '../../../../stores/phoneStore'
import ToggleSwitch from '../../../ui/ToggleSwitch.vue'

const phoneStore = usePhoneStore()
const emit = defineEmits(['back'])

const isAddingNew = ref(false)
const newReplyText = ref('')

function handleAddNew() {
  if (newReplyText.value.trim()) {
    phoneStore.addFlashCallReply(newReplyText.value.trim())
    newReplyText.value = ''
    isAddingNew.value = false
  }
}
</script>

<template>
  <div class="phone-settings-subpage">
    <div class="subpage-header">
      <button class="back-btn" @click="emit('back')">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#1C1C1E" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
      <div class="header-title">Flash Call</div>
    </div>

    <div class="subpage-body scrollable">
      <!-- 顶部插画卡片 -->
      <div class="flash-hero-card">
        <div class="mockup-frame">
          <div class="mockup-screen">
            <div class="pill-bar"></div>
            <div class="flash-call-pill">
              <span class="pill-text">FLASH CALL</span>
              <div class="finger-circle"></div>
            </div>
            <div class="pill-bar"></div>
            <div class="pill-bar"></div>
            <div class="pill-bar"></div>
            <div class="mockup-footer-pill"></div>
          </div>
        </div>
        <div class="hero-desc-text">
          滑动通话记录，即可使用；即时消息需满足以下条件才可发送成功：双方均支持即时消息、使用同一运营商 SIM 卡，且通话时为 4G/5G 网络。
        </div>
      </div>

      <!-- 主功能开关 -->
      <div class="settings-row item-switch">
        <div class="row-label">Flash Call</div>
        <ToggleSwitch v-model="phoneStore.settings.flashCallEnabled" />
      </div>

      <template v-if="phoneStore.settings.flashCallEnabled">
        <div class="settings-row item-switch with-sub">
          <div class="label-col">
            <div class="row-label">仅接收联系人消息</div>
            <div class="row-sub">仅接收通讯录联系人的 Flash Call 消息。</div>
          </div>
          <ToggleSwitch v-model="phoneStore.settings.flashCallOnlyContacts" />
        </div>

        <!-- 快捷回复模版列表 -->
        <div class="section-caption">快捷回复</div>
        <div class="replies-card">
          <div
            v-for="rep in phoneStore.settings.flashCallReplies"
            :key="rep.id"
            class="settings-row reply-item"
            @click="rep.enabled = !rep.enabled"
          >
            <div class="row-label">{{ rep.text }}</div>
            <div class="custom-checkbox" :class="{ checked: rep.enabled }">
              <svg v-if="rep.enabled" width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17L4 12" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </div>
          </div>

          <!-- 新增自定义回复输入态 -->
          <div v-if="isAddingNew" class="add-input-box">
            <input
              v-model="newReplyText"
              class="new-reply-input"
              placeholder="输入快捷回复内容"
              @keyup.enter="handleAddNew"
            />
            <div class="input-actions">
              <button class="btn-cancel" @click="isAddingNew = false">取消</button>
              <button class="btn-confirm" @click="handleAddNew">确定</button>
            </div>
          </div>

          <!-- 新增按钮 -->
          <button v-else class="add-reply-btn" @click="isAddingNew = true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00C853" stroke-width="2.2" stroke-linecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>新增自定义快捷回复</span>
          </button>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.phone-settings-subpage {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #FFFFFF;
  z-index: 60;
  display: flex;
  flex-direction: column;
}

.subpage-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  gap: 12px;
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.05);
}

.back-btn {
  background: none;
  border: none;
  padding: 6px;
  cursor: pointer;
  display: flex;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: #1C1C1E;
}

.subpage-body {
  flex: 1;
  padding: 16px 20px 40px;
}

/* 顶部插画卡片 */
.flash-hero-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 16px 16px;
  background: #F9FAFB;
  border-radius: 20px;
  margin-bottom: 24px;
}

.mockup-frame {
  width: 140px;
  height: 200px;
  border: 3px solid #D1D5DB;
  border-radius: 24px;
  padding: 14px 10px;
  background: #FFFFFF;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.04);
}

.mockup-screen {
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100%;
}

.pill-bar {
  height: 12px;
  background: #F3F4F6;
  border-radius: 6px;
}

.flash-call-pill {
  position: relative;
  height: 18px;
  background: #E0F2FE;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pill-text {
  font-size: 8px;
  font-weight: 800;
  color: #0284C7;
  letter-spacing: 1px;
}

.finger-circle {
  position: absolute;
  right: 18px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.25);
  border: 2px solid #FFFFFF;
}

.mockup-footer-pill {
  height: 14px;
  width: 60%;
  background: #E5E7EB;
  border-radius: 7px;
  margin-top: auto;
}

.hero-desc-text {
  font-size: 13px;
  color: #6B7280;
  text-align: center;
  line-height: 1.5;
  margin-top: 16px;
}

/* 开关行 */
.settings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  border-bottom: 0.5px solid rgba(0, 0, 0, 0.04);
}

.with-sub {
  align-items: flex-start;
}

.row-label {
  font-size: 16px;
  font-weight: 500;
  color: #1C1C1E;
}

.row-sub {
  font-size: 13px;
  color: #8E8E93;
  margin-top: 4px;
}

.section-caption {
  font-size: 13px;
  color: #8E8E93;
  margin: 24px 0 8px;
}

/* 快捷回复项 */
.reply-item {
  cursor: pointer;
}

.custom-checkbox {
  width: 20px;
  height: 20px;
  border-radius: 5px;
  border: 1.5px solid #D1D1D6;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.custom-checkbox.checked {
  background-color: #00C853;
  border-color: #00C853;
}

.add-reply-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  padding: 16px 0;
  font-size: 15px;
  font-weight: 500;
  color: #00C853;
  cursor: pointer;
}

.add-input-box {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 0;
}

.new-reply-input {
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid #E5E7EB;
  font-size: 14px;
  outline: none;
}
.new-reply-input:focus {
  border-color: #00C853;
}

.input-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn-cancel,
.btn-confirm {
  padding: 6px 14px;
  border-radius: 8px;
  border: none;
  font-size: 13px;
  cursor: pointer;
}

.btn-cancel {
  background: #F3F4F6;
  color: #6B7280;
}

.btn-confirm {
  background: #00C853;
  color: #FFFFFF;
}
</style>
