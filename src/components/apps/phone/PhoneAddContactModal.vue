<script setup>
import { ref, watch } from 'vue'
import { usePhoneStore } from '../../../stores/phoneStore'

const props = defineProps({
  editContact: {
    type: Object,
    default: null
  },
  initialData: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'saved'])
const phoneStore = usePhoneStore()

const name = ref('')
const number = ref('')
const tag = ref('手机')
const company = ref('')
const toastText = ref('')
let toastTimer = null

const tagOptions = ['手机', '单位', '住宅', '家人', '常用']

watch(
  () => [props.editContact, props.initialData],
  () => {
    if (props.editContact) {
      name.value = props.editContact.name || ''
      number.value = props.editContact.number || ''
      tag.value = props.editContact.tag || '手机'
      company.value = props.editContact.company || ''
    } else if (props.initialData) {
      name.value = props.initialData.name || ''
      number.value = props.initialData.number || ''
      tag.value = props.initialData.tag || '手机'
      company.value = props.initialData.company || ''
    } else {
      name.value = ''
      number.value = ''
      tag.value = '手机'
      company.value = ''
    }
  },
  { immediate: true }
)

function showToast(msg) {
  toastText.value = msg
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastText.value = ''
  }, 1800)
}

function handleSave() {
  if (!name.value.trim() && !number.value.trim()) {
    showToast('请输入姓名或电话号码')
    return
  }

  if (props.editContact) {
    phoneStore.updateContact(props.editContact.id, {
      name: name.value.trim() || number.value.trim(),
      number: number.value.trim(),
      tag: tag.value,
      company: company.value.trim()
    })
    emit('saved', { id: props.editContact.id, name: name.value })
  } else {
    const created = phoneStore.addContact({
      name: name.value.trim(),
      number: number.value.trim(),
      tag: tag.value,
      company: company.value.trim()
    })
    emit('saved', created)
  }
  emit('close')
}
</script>

<template>
  <div class="add-contact-overlay" @click.self="emit('close')">
    <div class="add-contact-sheet">
      <!-- 顶栏：取消与保存 -->
      <div class="sheet-header">
        <button class="header-btn cancel-btn" @click="emit('close')">取消</button>
        <div class="sheet-title">{{ editContact ? '编辑联系人' : '新建联系人' }}</div>
        <button
          class="header-btn save-btn"
          :disabled="!name.trim() && !number.trim()"
          @click="handleSave"
        >
          保存
        </button>
      </div>

      <!-- 表单内容 -->
      <div class="form-scrollable">
        <div class="avatar-pick-section">
          <div class="avatar-placeholder">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="#FFFFFF">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </div>
          <span class="avatar-tip">{{ name.trim() ? name.trim().slice(0, 1) : '添加头像' }}</span>
        </div>

        <div class="input-card">
          <div class="input-row">
            <span class="row-label">姓名</span>
            <input
              v-model="name"
              class="form-input"
              type="text"
              placeholder="请输入姓名"
              autofocus
            />
          </div>

          <div class="input-row">
            <span class="row-label">电话</span>
            <input
              v-model="number"
              class="form-input"
              type="tel"
              placeholder="请输入电话号码"
            />
          </div>

          <div class="input-row">
            <span class="row-label">公司</span>
            <input
              v-model="company"
              class="form-input"
              type="text"
              placeholder="请输入单位或公司名称"
            />
          </div>
        </div>

        <!-- 标签选择器 -->
        <div class="tags-section">
          <div class="tags-caption">标签分类</div>
          <div class="tags-pill-wrap">
            <button
              v-for="t in tagOptions"
              :key="t"
              class="tag-pill-btn"
              :class="{ active: tag === t }"
              @click="tag = t"
            >
              {{ t }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 提示框 -->
    <Transition name="fade">
      <div v-if="toastText" class="toast-tip">
        {{ toastText }}
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.add-contact-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 90;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.add-contact-sheet {
  width: 100%;
  max-height: 88vh;
  background: #F8F9FA;
  border-top-left-radius: 28px;
  border-top-right-radius: 28px;
  padding: 16px 20px calc(var(--safe-bottom, 20px) + 20px);
  box-shadow: 0 -8px 28px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-sizing: border-box;
}

.sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 44px;
  margin-bottom: 12px;
}

.sheet-title {
  font-size: 17px;
  font-weight: 700;
  color: #1C1C1E;
}

.header-btn {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  padding: 6px 4px;
}

.cancel-btn {
  color: #8E8E93;
}

.save-btn {
  color: #00C853;
  font-weight: 600;
}

.save-btn:disabled {
  color: #C7C7CC;
  cursor: not-allowed;
}

.form-scrollable {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 20px;
}

.avatar-pick-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 10px 0 20px;
}

.avatar-placeholder {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: linear-gradient(135deg, #34D399 0%, #00C853 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 14px rgba(0, 200, 83, 0.25);
  margin-bottom: 8px;
}

.avatar-tip {
  font-size: 13px;
  color: #8E8E93;
}

.input-card {
  background: #FFFFFF;
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.04);
  margin-bottom: 18px;
}

.input-row {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 0.5px solid #F0F1F3;
}

.input-row:last-child {
  border-bottom: none;
}

.row-label {
  width: 54px;
  font-size: 15px;
  font-weight: 500;
  color: #6B7280;
  flex-shrink: 0;
}

.form-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 16px;
  color: #1C1C1E;
  background: transparent;
}

.tags-section {
  margin-top: 10px;
}

.tags-caption {
  font-size: 13px;
  font-weight: 500;
  color: #8E8E93;
  margin-bottom: 10px;
  padding-left: 4px;
}

.tags-pill-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.tag-pill-btn {
  padding: 7px 16px;
  border-radius: 999px;
  background: #FFFFFF;
  border: 1px solid rgba(0, 0, 0, 0.06);
  font-size: 13px;
  font-weight: 500;
  color: #6B7280;
  cursor: pointer;
  transition: all 0.15s ease;
}

.tag-pill-btn.active {
  background: #00C853;
  color: #FFFFFF;
  border-color: #00C853;
  box-shadow: 0 2px 8px rgba(0, 200, 83, 0.25);
}

.toast-tip {
  position: absolute;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: #FFFFFF;
  font-size: 14px;
  padding: 9px 18px;
  border-radius: 20px;
  z-index: 100;
  pointer-events: none;
  white-space: nowrap;
}
</style>
