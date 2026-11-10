<script setup>
import { ref, onBeforeUnmount } from 'vue'
import LIcon from '../../../ui/LIcon.vue'
import { DH_OVERFLOW_ITEMS } from './dhData.js'

/**
 * 数字健康页面右上角的 ⋮ 菜单（真机 dh_80_overflow：五条，白卡右上角弹出）。
 * 真机：发送反馈 / 管理数据 / 隐私权政策 / 服务条款 / 开源许可 —— 五条都是**真页面**，
 * 所以这里只 emit key，由调用方推 `info:<key>` 页（`DhInfoPage.vue`）。
 */
const emit = defineEmits(['pick'])
const open = ref(false)
const ITEMS = DH_OVERFLOW_ITEMS

function toggle(e) {
  e?.stopPropagation()
  open.value = !open.value
  if (open.value) document.addEventListener('click', close, { once: true })
}
function close() {
  open.value = false
  document.removeEventListener('click', close)
}
function pick(key) {
  open.value = false
  document.removeEventListener('click', close)
  emit('pick', key)
}
onBeforeUnmount(() => document.removeEventListener('click', close))
</script>

<template>
  <div class="dh-overflow-anchor">
    <button type="button" class="dh-overflow-btn" data-dh-overflow aria-label="更多" @click="toggle">
      <LIcon name="moreVertical" :size="18" :stroke-width="2.2" />
    </button>
    <Transition name="dh-menu">
      <div v-if="open" class="dh-overflow-menu" data-dh-overflow-menu>
        <button
          v-for="item in ITEMS"
          :key="item.key"
          type="button"
          class="dh-overflow-item"
          :data-dh-overflow-item="item.key"
          @click.stop="pick(item.key)"
        >{{ item.label }}</button>
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
  color: #1F1F1F;
}
.dh-overflow-btn:active { background: rgba(0, 0, 0, 0.06); }

/* 真机：贴着 ⋮ 下方、右对齐，宽约 150，白卡 8 圆角 + 阴影，条目无图标无分隔线 */
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
  padding: 13px 16px;
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
