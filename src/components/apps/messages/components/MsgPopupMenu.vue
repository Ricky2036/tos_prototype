<script setup>
/**
 * 白底大圆角弹出菜单（XOS 原生样式）：列表页 ⋮、对话页 ⋮、消息长按、
 * XMessage 服务页 ⋮ 全部复用。真机标定：圆角 20、无描边、投影 0 10 30 rgba(0,0,0,.12)，
 * 每项高 60.5、文字 16、左内边距 20，菜单宽度由内容撑开（列表 ⋮ 菜单 164）。
 */
const props = defineProps({
  items: { type: Array, default: () => [] }, // [{ id, label }]
  /** 菜单框的位置（画布坐标） */
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 },
  width: { type: Number, default: 164 },
  /** 入场方向：菜单按钮在右上角时从右上展开 */
  origin: { type: String, default: 'top right' }
})
const emit = defineEmits(['select', 'close'])
</script>

<template>
  <div class="msg-menu-scrim" data-msg-menu-scrim @click="emit('close')" @pointerdown.stop>
    <div
      class="msg-menu"
      :style="{ left: `${props.x}px`, top: `${props.y}px`, width: `${props.width}px`, transformOrigin: props.origin }"
      @click.stop
    >
      <button
        v-for="item in props.items"
        :key="item.id"
        class="menu-item"
        type="button"
        :data-msg-menu-item="item.id"
        @click="emit('select', item.id)"
      >
        {{ item.label }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.msg-menu-scrim {
  position: absolute;
  inset: 0;
  z-index: 40;
  background: rgba(0, 0, 0, 0.02);
}
.msg-menu {
  position: absolute;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 10px 34px rgba(0, 0, 0, 0.13), 0 2px 8px rgba(0, 0, 0, 0.05);
  padding: 12px 0;
  overflow: hidden;
  animation: msg-menu-in 0.16s cubic-bezier(0.32, 0.72, 0, 1);
}
@keyframes msg-menu-in {
  from { opacity: 0; transform: scale(0.92); }
  to { opacity: 1; transform: scale(1); }
}
.menu-item {
  display: block;
  width: 100%;
  padding: 0 20px;
  height: 52px;
  border: none;
  background: transparent;
  text-align: left;
  font-size: 16px;
  line-height: 52px;
  color: #000;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.menu-item:active { background: #f2f2f4; }
</style>
