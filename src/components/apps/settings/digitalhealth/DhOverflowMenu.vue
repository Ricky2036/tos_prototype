<script setup>
import { ref, onBeforeUnmount } from 'vue'

/**
 * 数字健康页面右上角的 ⋮ 菜单（真机 dh_80：五条，白卡右上角弹出）。
 * 真机：发送反馈 / 管理数据 / 隐私权政策 / 服务条款 / 开源许可。
 * 这五条都是外部网页或系统页，本原型里统一回一条 toast，不做假页面。
 */
const emit = defineEmits(['pick'])
const open = ref(false)
const ITEMS = ['发送反馈', '管理数据', '隐私权政策', '服务条款', '开源许可']

function toggle(e) {
  e?.stopPropagation()
  open.value = !open.value
  if (open.value) document.addEventListener('click', close, { once: true })
}
function close() {
  open.value = false
  document.removeEventListener('click', close)
}
function pick(label) {
  open.value = false
  document.removeEventListener('click', close)
  emit('pick', label)
}
onBeforeUnmount(() => document.removeEventListener('click', close))
</script>

<template>
  <div class="dh-overflow-anchor">
    <button type="button" class="dh-overflow-btn" data-dh-overflow aria-label="更多" @click="toggle">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="#1F1F1F">
        <circle cx="12" cy="5" r="2" />
        <circle cx="12" cy="12" r="2" />
        <circle cx="12" cy="19" r="2" />
      </svg>
    </button>
    <Transition name="dh-menu">
      <div v-if="open" class="dh-overflow-menu" data-dh-overflow-menu>
        <button
          v-for="item in ITEMS"
          :key="item"
          type="button"
          class="dh-overflow-item"
          @click.stop="pick(item)"
        >{{ item }}</button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.dh-overflow-anchor { position: relative; }

.dh-overflow-btn {
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 50%;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.dh-overflow-btn:active { background: rgba(0, 0, 0, 0.06); }

/* 真机：贴着 ⋮ 下方、右对齐，宽约 150，白卡 8 圆角 + 阴影 */
.dh-overflow-menu {
  position: absolute;
  top: 38px;
  right: 0;
  min-width: 150px;
  background: #FFFFFF;
  border-radius: 10px;
  padding: 6px 0;
  box-shadow: 0 6px 22px rgba(0, 0, 0, 0.18);
  z-index: 30;
}

.dh-overflow-item {
  display: block;
  width: 100%;
  border: none;
  background: transparent;
  text-align: left;
  padding: 11px 16px;
  font-size: 14px;
  color: #1F1F1F;
  font-family: inherit;
  cursor: pointer;
  white-space: nowrap;
}
.dh-overflow-item:active { background: rgba(0, 0, 0, 0.06); }

.dh-menu-enter-active,
.dh-menu-leave-active { transition: opacity 0.12s ease, transform 0.12s ease; }
.dh-menu-enter-from,
.dh-menu-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
