<script setup>
import { ref, computed } from 'vue'
import { usePhoneStore } from '../../../stores/phoneStore'

const emit = defineEmits(['close'])
const phoneStore = usePhoneStore()

const duplicateGroups = ref([
  {
    name: '陈晓敏',
    entries: [
      { id: 'c4', name: '陈晓敏', number: '136 8888 2233', tag: '单位' },
      { id: 'm1', name: '陈晓敏', number: '138 0000 8822', tag: '手机' }
    ]
  }
])

const isMerged = ref(false)

function handleMergeAll() {
  phoneStore.mergeDuplicates()
  isMerged.value = true
  setTimeout(() => {
    emit('close')
  }, 1000)
}
</script>

<template>
  <div class="merge-modal-overlay" @click.self="emit('close')">
    <div class="merge-dialog-card">
      <div class="dialog-header">
        <div class="header-icon-wrap">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00C853" stroke-width="2.2" stroke-linecap="round">
            <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
          </svg>
        </div>
        <div class="dialog-title">合并重复联系人</div>
        <div class="dialog-desc">系统检测到 1 组具有相同姓名的联系人，合并后将保留全部电话号码。</div>
      </div>

      <div class="duplicate-preview-card">
        <div v-for="grp in duplicateGroups" :key="grp.name" class="duplicate-group">
          <div class="group-name">{{ grp.name }}</div>
          <div v-for="e in grp.entries" :key="e.id" class="entry-sub-row">
            <span class="entry-tag">{{ e.tag }}</span>
            <span class="entry-num">{{ e.number }}</span>
          </div>
        </div>
      </div>

      <div class="dialog-actions">
        <button class="dialog-btn cancel-btn" @click="emit('close')">取消</button>
        <button class="dialog-btn confirm-btn" :disabled="isMerged" @click="handleMergeAll">
          {{ isMerged ? '已合并' : '一键合并' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.merge-modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 95;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  box-sizing: border-box;
}

.merge-dialog-card {
  width: 100%;
  max-width: 330px;
  background: #FFFFFF;
  border-radius: 24px;
  padding: 24px 20px 20px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.16);
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.dialog-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 18px;
}

.header-icon-wrap {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  background: #E8F8EE;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.dialog-title {
  font-size: 18px;
  font-weight: 700;
  color: #1C1C1E;
  margin-bottom: 6px;
}

.dialog-desc {
  font-size: 13px;
  color: #8E8E93;
  line-height: 1.5;
}

.duplicate-preview-card {
  background: #F8F9FA;
  border-radius: 14px;
  padding: 12px 14px;
  margin-bottom: 20px;
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.group-name {
  font-size: 15px;
  font-weight: 600;
  color: #1C1C1E;
  margin-bottom: 6px;
}

.entry-sub-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #6B7280;
  margin-top: 4px;
}

.entry-tag {
  background: #E5E7EB;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 11px;
}

.entry-num {
  font-size: 13px;
  font-weight: 500;
  color: #1C1C1E;
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
  transition: all 0.15s ease;
}

.cancel-btn {
  background: #F2F3F5;
  color: #555555;
}

.cancel-btn:active {
  background: #E8E9EB;
}

.confirm-btn {
  background: #00C853;
  color: #FFFFFF;
}

.confirm-btn:active {
  background: #00B348;
}

.confirm-btn:disabled {
  background: #A7F3D0;
}
</style>
