<script setup>
const props = defineProps({ mode: { type: String, default: 'photo' } })
const emit = defineEmits(['update:mode'])
</script>

<template>
  <div class="back-camera" :class="`is-${mode}`" aria-label="背屏相机占位预览">
    <div class="camera-placeholder">
      <span class="camera-lens" aria-hidden="true"><i></i></span>
      <strong>此位置临时占位</strong>
    </div>
    <div class="camera-mode-switch" role="group" aria-label="相机模式">
      <button type="button" :aria-pressed="mode === 'photo'" :class="{ active: mode === 'photo' }" @click="emit('update:mode', 'photo')">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 7.5h3l1.4-2h7.2l1.4 2h3A1.5 1.5 0 0 1 21.5 9v9a1.5 1.5 0 0 1-1.5 1.5H4A1.5 1.5 0 0 1 2.5 18V9A1.5 1.5 0 0 1 4 7.5Z"/><circle cx="12" cy="13" r="3.5"/><path d="m18.1 3.1.6 1.5 1.5.6-1.5.6-.6 1.5-.6-1.5-1.5-.6 1.5-.6.6-1.5Z"/></svg>
        <span>AI CAM</span>
      </button>
      <button type="button" :aria-pressed="mode === 'video'" :class="{ active: mode === 'video' }" @click="emit('update:mode', 'video')">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="6" width="12" height="12" rx="2"/><path d="m15 10 5-3v10l-5-3v-4Z"/><circle cx="9" cy="12" r="2.5"/></svg>
        <span>视频</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.back-camera { position:absolute; inset:8px 8px 8px; display:flex; flex-direction:column; align-items:center; justify-content:space-between; padding:8px 7px 5px; border:1px solid rgba(206,222,250,.12); border-radius:12px; color:#f3f6fc; background:radial-gradient(ellipse at 50% 35%,rgba(112,151,212,.16),transparent 60%),rgba(5,10,18,.22); container-type:size; }
.camera-placeholder { display:flex; flex:1; flex-direction:column; align-items:center; justify-content:center; gap:6px; color:rgba(226,235,250,.75); }
.camera-placeholder strong { font-size:8cqh; font-weight:500; letter-spacing:.03em; }
.camera-lens { position:relative; display:grid; width:26cqh; max-width:18cqw; aspect-ratio:1; place-items:center; border:1px solid rgba(175,203,249,.23); border-radius:50%; background:radial-gradient(circle at 40% 35%,rgba(111,157,221,.22),rgba(21,34,55,.25) 67%); }
.camera-lens i { width:30%; aspect-ratio:1; border-radius:50%; background:rgba(184,211,255,.58); box-shadow:0 0 12px rgba(112,167,245,.48); }
.camera-mode-switch { display:flex; width:100%; justify-content:center; gap:clamp(8px,7cqw,18px); }
.camera-mode-switch button { display:inline-flex; flex:0 1 43%; min-width:0; min-height:21px; align-items:center; justify-content:center; gap:4px; border:1px solid rgba(193,211,241,.17); border-radius:7px; color:rgba(228,237,250,.72); background:rgba(6,11,19,.54); font:600 7cqh/1 var(--font-stack); cursor:pointer; transition:color .18s ease,border-color .18s ease,background .18s ease; }
.camera-mode-switch button svg { width:11px; height:11px; flex:none; stroke:currentColor; stroke-width:1.7; stroke-linecap:round; stroke-linejoin:round; }
.camera-mode-switch button.active { border-color:rgba(255,224,83,.52); color:#ffe456; background:rgba(255,220,64,.08); box-shadow:inset 0 .5px 0 rgba(255,255,255,.1),0 0 10px rgba(255,220,64,.08); }
</style>
