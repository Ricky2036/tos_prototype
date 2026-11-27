<template>
  <!--
    SIM 卡图标（全仓统一）：外框右上折角 + 2×2 芯片格。
    对话输入栏、新建短信、SIM 卡短信页、XMessage 页共用一个来源，
    避免各处各画一份导致形状/粗细不一致。
  -->
  <svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" :stroke="color" :stroke-width="strokeWidth" stroke-linejoin="round">
    <path d="M6.6 3.6h7.6l4.4 4.4v12.2c0 .9-.7 1.6-1.6 1.6H6.6c-.9 0-1.6-.7-1.6-1.6V5.2c0-.9.7-1.6 1.6-1.6z" />
    <rect x="8.5" y="9.7" width="3.2" height="3.2" rx="0.7" />
    <rect x="12.3" y="9.7" width="3.2" height="3.2" rx="0.7" />
    <rect x="8.5" y="13.5" width="3.2" height="3.2" rx="0.7" />
    <rect x="12.3" y="13.5" width="3.2" height="3.2" rx="0.7" />
  </svg>
</template>

<script setup>
defineProps({
  size: { type: [Number, String], default: 22 },
  color: { type: String, default: '#1E1E20' },
  strokeWidth: { type: [Number, String], default: 1.9 }
})
</script>
