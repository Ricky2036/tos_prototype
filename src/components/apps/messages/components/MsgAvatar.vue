<script setup>
import { computed } from 'vue'

/**
 * 会话头像：真机为淡蓝紫竖向渐变圆（上 #AEBCDB → 下 #8F9BC5），
 * 内部是白色首字、白色人形图标或通知铃铛；未读数贴在右上角（红 #E7433B，白字，胶囊）。
 */
const props = defineProps({
  name: { type: String, default: '' },
  icon: { type: String, default: '' }, // '' | person | bell
  size: { type: Number, default: 40 },
  unread: { type: [Number, String], default: 0 }
})

const initial = computed(() => (props.name || '?').trim().slice(0, 1))
const badgeText = computed(() => {
  const n = Number(props.unread)
  if (!Number.isFinite(n) || n <= 0) return ''
  return n >= 99 ? '99+' : String(n)
})
const fontSize = computed(() => `${Math.round(props.size * 0.5)}px`)
</script>

<template>
  <span class="msg-avatar" :style="{ width: `${props.size}px`, height: `${props.size}px` }">
    <svg v-if="props.icon === 'person'" :width="props.size * 0.62" :height="props.size * 0.62" viewBox="0 0 24 24" fill="#fff">
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.6 20.2c.5-3.9 3.6-6.2 7.4-6.2s6.9 2.3 7.4 6.2c0 .5-.3.8-.8.8H5.4c-.5 0-.8-.3-.8-.8z" />
    </svg>
    <svg v-else-if="props.icon === 'bell'" :width="props.size * 0.58" :height="props.size * 0.58" viewBox="0 0 24 24" fill="#fff">
      <path d="M12 3.2c-3.3 0-5.6 2.4-5.6 5.6v2.9c0 .9-.4 1.7-1.1 2.3l-.6.5c-.6.5-.3 1.5.5 1.5h13.6c.8 0 1.1-1 .5-1.5l-.6-.5c-.7-.6-1.1-1.4-1.1-2.3V8.8c0-3.2-2.3-5.6-5.6-5.6z" />
      <path d="M9.6 18.1h4.8c-.2 1.5-1.2 2.4-2.4 2.4s-2.2-.9-2.4-2.4z" />
    </svg>
    <span v-else class="msg-avatar-initial" :style="{ fontSize }">{{ initial }}</span>
    <span v-if="badgeText" class="msg-avatar-badge" data-msg-badge>{{ badgeText }}</span>
  </span>
</template>

<style scoped>
.msg-avatar {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  border-radius: 50%;
  background: linear-gradient(180deg, #aebcdb 0%, #8f9bc5 100%);
  overflow: visible;
  color: #fff;
  user-select: none;
}
.msg-avatar-initial {
  font-weight: 500;
  line-height: 1;
  letter-spacing: 0;
  transform: translateY(-0.5px);
}
.msg-avatar-badge {
  position: absolute;
  top: -2px;
  right: -6px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 8px;
  background: #e7433b;
  color: #fff;
  font-size: 10px;
  font-weight: 600;
  line-height: 16px;
  text-align: center;
  box-sizing: border-box;
  letter-spacing: -0.2px;
}
</style>
