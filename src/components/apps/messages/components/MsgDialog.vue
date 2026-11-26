<script setup>
/**
 * 大圆角对话框（XOS 风格）：数据库自动更新偏好、信息详情共用。
 * 真机标定：卡片宽 328（左右各 16）、圆角 28、标题 18 粗居中、
 * 底部胶囊按钮宽 279 / 高 44 / 圆角 22。
 */
const props = defineProps({
  title: { type: String, default: '' },
  action: { type: String, default: '' },
  /** primary = 蓝底白字（信息详情"知道了"）；ghost = 浅灰底黑字（"取消"） */
  actionTone: { type: String, default: 'primary' },
  showAction: { type: Boolean, default: true }
})
const emit = defineEmits(['action', 'close'])
</script>

<template>
  <div class="msg-dialog-scrim" data-msg-dialog @click="emit('close')">
    <div class="msg-dialog" @click.stop>
      <div class="dlg-title">{{ props.title }}</div>
      <div class="dlg-body"><slot /></div>
      <button
        v-if="props.showAction"
        class="dlg-action"
        :class="props.actionTone === 'ghost' ? 'ghost' : 'primary'"
        type="button"
        data-msg-dialog-action
        @click="emit('action')"
      >
        {{ props.action }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.msg-dialog-scrim {
  position: absolute;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.16);
  animation: fade-in 0.16s ease;
}
.msg-dialog {
  width: 328px;
  background: #fff;
  border-radius: 28px;
  padding: 22px 16px 16px;
  box-sizing: border-box;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.18);
  animation: pop-in 0.2s cubic-bezier(0.32, 0.72, 0, 1);
}
.dlg-title {
  font-size: 18px;
  font-weight: 700;
  color: #000;
  text-align: center;
  line-height: 24px;
  margin-bottom: 18px;
  padding: 0 12px;
}
.dlg-body { padding: 0 8px; }
.dlg-action {
  display: block;
  width: 279px;
  height: 44px;
  margin: 18px auto 0;
  border: none;
  border-radius: 22px;
  font-size: 17px;
  font-weight: 500;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.14s cubic-bezier(0.32, 0.72, 0, 1), filter 0.16s ease;
}
.dlg-action:active { transform: scale(0.97); filter: brightness(0.96); }
.dlg-action.primary { background: #3375f6; color: #fff; }
.dlg-action.ghost { background: #efeff1; color: #1e1e20; }
@keyframes fade-in { from { opacity: 0 } to { opacity: 1 } }
@keyframes pop-in {
  from { opacity: 0; transform: scale(0.94); }
  to { opacity: 1; transform: scale(1); }
}
</style>
