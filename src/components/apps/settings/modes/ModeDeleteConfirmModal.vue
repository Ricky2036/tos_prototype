<script setup>
const props = defineProps({
  modeName: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['close', 'confirm'])
</script>

<template>
  <div class="confirm-overlay" @click.self="emit('close')">
    <div class="confirm-dialog">
      <div class="dialog-body">
        <p class="dialog-message">是否删除{{ modeName }}？</p>
      </div>
      <div class="dialog-actions">
        <button class="dialog-btn btn-cancel" @click="emit('close')">
          取消
        </button>
        <button class="dialog-btn btn-delete" @click="emit('confirm')">
          删除
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.confirm-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 120;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  user-select: none;
}

.confirm-dialog {
  width: 100%;
  max-width: 320px;
  background: #FFFFFF;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.16);
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.dialog-body {
  padding: 28px 24px 20px;
  text-align: center;
}

.dialog-message {
  font-size: 17px;
  font-weight: 600;
  color: #18181B;
  margin: 0;
  line-height: 1.45;
}

.dialog-actions {
  display: flex;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

.dialog-btn {
  flex: 1;
  padding: 16px 12px;
  border: none;
  background: transparent;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease;
}

.dialog-btn:active {
  background: rgba(0, 0, 0, 0.04);
}

.btn-cancel {
  color: #71717A;
  border-right: 1px solid rgba(0, 0, 0, 0.08);
}

.btn-delete {
  color: #EF4444;
}
</style>
