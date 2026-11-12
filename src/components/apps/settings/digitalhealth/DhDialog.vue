<script setup>
/**
 * 数字健康里的 Material 居中对话框（真机 dh_76：设置应用定时器）。
 *
 * 真机：白卡居中、圆角 24、左右留边 ~28、标题 20 粗体、说明 14 灰、底部右对齐蓝色文字按钮。
 * ⚠️ 这是「居中对话框」，不是底部弹层，所以不走 `ui/SheetModal.vue`（那是贴底的）。
 *    DOM 里必须 `position: absolute`（应用内浮层禁 fixed）。
 */
defineProps({
  visible: { type: Boolean, default: false },
  title: { type: String, default: '' },
  note: { type: String, default: '' },
  confirmText: { type: String, default: '确定' },
  cancelText: { type: String, default: '取消' },
  confirmDisabled: { type: Boolean, default: false }
})
const emit = defineEmits(['close', 'confirm'])
</script>

<template>
  <Transition name="dh-dialog" appear>
    <div v-if="visible" class="dh-dialog-mask" @click.self="emit('close')">
      <div class="dh-dialog" role="dialog">
        <div v-if="title" class="dh-dialog-title">{{ title }}</div>
        <div v-if="note" class="dh-dialog-note">{{ note }}</div>
        <div class="dh-dialog-body"><slot></slot></div>
        <div class="dh-dialog-actions">
          <button type="button" class="dh-dialog-btn" data-dh-dialog-cancel @click="emit('close')">{{ cancelText }}</button>
          <button
            type="button"
            class="dh-dialog-btn is-primary"
            data-dh-dialog-confirm
            :disabled="confirmDisabled"
            @click="emit('confirm')"
          >{{ confirmText }}</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.dh-dialog-mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.32);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 22px;
  box-sizing: border-box;
  z-index: 40;
}

.dh-dialog {
  width: 100%;
  background: #FFFFFF;
  border-radius: 24px;
  padding: 22px 20px 12px;
  box-sizing: border-box;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.22);
}

.dh-dialog-title {
  font-size: 18px;
  font-weight: 600;
  color: #1F1F1F;
  letter-spacing: -0.2px;
}

.dh-dialog-note {
  margin-top: 10px;
  font-size: 13.5px;
  line-height: 19px;
  color: #5F6368;
}

.dh-dialog-body { margin-top: 6px; }

.dh-dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 10px;
}

.dh-dialog-btn {
  border: none;
  background: transparent;
  color: #1A73E8;
  font-size: 15px;
  font-weight: 600;
  padding: 10px 14px;
  border-radius: 12px;
  cursor: pointer;
  font-family: inherit;
}

.dh-dialog-btn:active { background: rgba(26, 115, 232, 0.1); }
.dh-dialog-btn:disabled { color: #B9BDC4; cursor: default; }

.dh-dialog-enter-active,
.dh-dialog-leave-active { transition: opacity 0.16s ease; }
.dh-dialog-enter-active .dh-dialog,
.dh-dialog-leave-active .dh-dialog { transition: transform 0.18s cubic-bezier(0.2, 0.9, 0.3, 1); }
.dh-dialog-enter-from,
.dh-dialog-leave-to { opacity: 0; }
.dh-dialog-enter-from .dh-dialog,
.dh-dialog-leave-to .dh-dialog { transform: scale(0.92); }
</style>
