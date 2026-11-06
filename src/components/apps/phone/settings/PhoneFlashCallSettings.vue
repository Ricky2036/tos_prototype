<script setup>
import { ref } from 'vue'
import { usePhoneStore } from '../../../../stores/phoneStore'
import ToggleSwitch from '../../../ui/ToggleSwitch.vue'
import flashCallHeroImg from '../../../../assets/img/phone_settings/flash_call_hero.png'

const phoneStore = usePhoneStore()
const emit = defineEmits(['back'])

const isAddingNew = ref(false)
const newReplyText = ref('')

function openAddDialog() {
  newReplyText.value = ''
  isAddingNew.value = true
}

function handleAddNew() {
  if (newReplyText.value.trim()) {
    phoneStore.addFlashCallReply(newReplyText.value.trim())
    newReplyText.value = ''
    isAddingNew.value = false
  }
}

defineExpose({
  back() {
    if (isAddingNew.value) {
      isAddingNew.value = false
      return true
    }
    return false
  }
})
</script>

<template>
  <div class="phone-settings-subpage">
    <div class="subpage-header">
      <button class="back-btn" title="返回" @click="emit('back')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M15 19l-7-7 7-7" stroke="#1C1C1E" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
      <div class="header-title">Flash Call</div>
    </div>

    <div class="subpage-body scrollable">
      <!-- 顶部功能插画卡片（100% 对齐真机比例与卡片风格） -->
      <div class="flash-hero-card">
        <div class="hero-image-wrap">
          <img :src="flashCallHeroImg" class="hero-img" alt="Flash Call 插画" />
        </div>
        <div class="hero-desc-text">
          滑动通话记录，即可使用；<br />
          即时消息需满足以下条件才可发送成功：双方均支持即时消息、使用同一运营商 SIM 卡，且通话时为 4G/5G 网络。
        </div>
      </div>

      <!-- 第 1 组卡片：主开关与联系人筛选 -->
      <div class="settings-card">
        <div class="settings-row item-switch">
          <div class="row-label">Flash Call</div>
          <ToggleSwitch v-model="phoneStore.settings.flashCallEnabled" />
        </div>

        <div v-if="phoneStore.settings.flashCallEnabled" class="settings-row item-switch with-sub no-sep">
          <div class="label-col">
            <div class="row-label">仅接收联系人消息</div>
            <div class="row-sub">仅接收通讯录联系人的 Flash Call 消息。</div>
          </div>
          <ToggleSwitch v-model="phoneStore.settings.flashCallOnlyContacts" />
        </div>
      </div>

      <template v-if="phoneStore.settings.flashCallEnabled">
        <!-- 第 2 组卡片：快捷回复模版列表 -->
        <div class="section-caption">快捷回复</div>
        <div class="settings-card">
          <div
            v-for="(rep, idx) in phoneStore.settings.flashCallReplies"
            :key="rep.id"
            class="settings-row reply-item"
            :class="{ 'no-sep': idx === phoneStore.settings.flashCallReplies.length - 1 }"
            @click="rep.enabled = !rep.enabled"
          >
            <div class="row-label">{{ rep.text }}</div>
            <div class="custom-checkbox" :class="{ checked: rep.enabled }">
              <svg v-if="rep.enabled" width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17L4 12" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </div>
          </div>
        </div>

        <!-- 第 3 组卡片：自定义快捷回复 -->
        <div class="section-caption">自定义快捷回复</div>
        <div class="settings-card">
          <div class="settings-row add-item no-sep" @click="openAddDialog">
            <div class="add-left">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00C853" stroke-width="2.2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v8M8 12h8" stroke-linecap="round" />
              </svg>
              <span class="add-text">新增自定义快捷回复</span>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="2">
              <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>
      </template>
    </div>

    <!-- 新增快捷回复弹窗（100% 对齐真机 03_flash_call_add_custom_dialog.png） -->
    <Transition name="fade">
      <div v-if="isAddingNew" class="modal-overlay" @click.self="isAddingNew = false">
        <div class="alert-dialog-card">
          <div class="dialog-title">新增自定义快捷回复</div>
          <div class="dialog-body">
            <div class="input-container">
              <input
                v-model="newReplyText"
                maxlength="35"
                class="dialog-input"
                placeholder="最多输入35个字符"
                autofocus
                @keyup.enter="handleAddNew"
              />
              <div class="char-count">{{ newReplyText.length }}/35</div>
            </div>
          </div>
          <div class="dialog-actions">
            <button class="dialog-btn cancel" @click="isAddingNew = false">取消</button>
            <button class="dialog-btn confirm" :disabled="!newReplyText.trim()" @click="handleAddNew">完成</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.phone-settings-subpage {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #F0F1F3;
  z-index: 60;
  display: flex;
  flex-direction: column;
}

.subpage-header {
  display: flex;
  align-items: center;
  padding-top: calc(var(--safe-top, 54px) + 8px);
  padding-bottom: 12px;
  padding-left: 16px;
  padding-right: 16px;
  background: #F0F1F3;
}

.back-btn {
  width: 38px;
  height: 38px;
  min-width: 38px;
  min-height: 38px;
  border-radius: 50%;
  background: #FFFFFF;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  transition: background-color 0.15s ease, transform 0.1s ease;
}

.back-btn:active {
  background-color: #E8E9EB;
  transform: scale(0.96);
}

.header-title {
  font-size: 20px;
  font-weight: 700;
  color: #1C1C1E;
  margin-left: 12px;
}

.subpage-body {
  flex: 1;
  padding: 12px 16px 40px;
}

/* 顶部引导卡片 */
.flash-hero-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 16px 18px;
  background: #FFFFFF;
  border-radius: 20px;
  border: 1px solid rgba(0, 0, 0, 0.04);
  margin-bottom: 16px;
}

.hero-image-wrap {
  width: 100%;
  max-width: 290px;
  aspect-ratio: 1.1 / 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 14px;
}

.hero-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.hero-desc-text {
  font-size: 13px;
  color: #8E8E93;
  text-align: center;
  line-height: 1.5;
  margin-top: 14px;
}

/* 规范白卡 */
.settings-card {
  background: #FFFFFF;
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.04);
  margin-bottom: 14px;
}

.section-caption {
  font-size: 13px;
  font-weight: 500;
  color: #8E8E93;
  margin: 16px 8px 8px;
}

.settings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 16px;
  min-height: 52px;
  border-bottom: 0.5px solid #F0F1F3;
  box-sizing: border-box;
}

.settings-row.no-sep {
  border-bottom: none;
}

.row-label {
  font-size: 16px;
  font-weight: 500;
  color: #1C1C1E;
}

.with-sub {
  align-items: flex-start;
}

.label-col {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-width: 240px;
}

.row-sub {
  font-size: 13px;
  color: #8E8E93;
  line-height: 1.4;
}

.reply-item,
.add-item {
  cursor: pointer;
}

.reply-item:active,
.add-item:active {
  background-color: #F8F9FA;
}

.add-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.add-text {
  font-size: 16px;
  font-weight: 500;
  color: #1C1C1E;
}

/* 复选框样式（对齐真机绿色圆角方框） */
.custom-checkbox {
  width: 20px;
  height: 20px;
  border-radius: 6px;
  border: 1.8px solid #C7C7CC;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.custom-checkbox.checked {
  background: #00C853;
  border-color: #00C853;
}

/* 弹窗遮罩与对话框 */
.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
}

.alert-dialog-card {
  width: calc(100% - 48px);
  max-width: 320px;
  background: #FFFFFF;
  border-radius: 20px;
  padding: 24px 20px 18px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
}

.dialog-title {
  font-size: 18px;
  font-weight: 700;
  color: #1C1C1E;
  text-align: center;
  margin-bottom: 18px;
}

.input-container {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 20px;
}

.dialog-input {
  width: 100%;
  height: 44px;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  padding: 0 14px;
  font-size: 15px;
  color: #1C1C1E;
  outline: none;
  box-sizing: border-box;
}

.dialog-input:focus {
  border-color: #00C853;
}

.char-count {
  font-size: 12px;
  color: #8E8E93;
  text-align: right;
  padding-right: 4px;
}

.dialog-actions {
  display: flex;
  gap: 12px;
}

.dialog-btn {
  flex: 1;
  height: 44px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  border: none;
  cursor: pointer;
}

.dialog-btn.cancel {
  background: #F2F3F5;
  color: #555555;
}

.dialog-btn.confirm {
  background: #00C853;
  color: #FFFFFF;
}

.dialog-btn.confirm:disabled {
  background: #E0E2E5;
  color: #A0A4A8;
}
</style>
