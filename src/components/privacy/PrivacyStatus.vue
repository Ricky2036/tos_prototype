<script setup>
import { computed } from 'vue'
import { usePrivacyStore, PERMISSIONS } from '../../stores/privacyStore'
import { useSystemStore } from '../../stores/systemStore'
import PermissionGlyph from './PermissionGlyph.vue'
const privacy = usePrivacyStore()
const system = useSystemStore()
const primary = computed(() => privacy.statusPrimary)
const label = computed(() => privacy.statusKeys.map(k => PERMISSIONS[k].label).join('、') + '正在使用')
const plateStyle = computed(() => ({
  '--privacy-color': privacy.color(primary.value),
  '--expanded-width': `${privacy.statusKeys.length === 1 ? 16 : privacy.statusKeys.length * 16 + (privacy.statusKeys.length - 1) * 4 + 8}px`,
  '--expanded-height': privacy.statusKeys.length === 1 ? '16px' : '20px'
}))
</script>
<template>
  <Transition name="privacy-indicator">
    <span role="img" v-if="primary && system.screenOn && !system.anyOverlayOpen() && privacy.page !== 'detail'" class="privacy-indicator" :class="{expanded: privacy.statusExpanded}" :style="plateStyle" :aria-label="label" data-testid="privacy-status">
      <span class="privacy-symbols"><PermissionGlyph v-for="key in privacy.statusKeys" :key="key" :permission="key" :size="16" /></span>
    </span>
  </Transition>
</template>
<style scoped>
.privacy-indicator{position:absolute;right:12px;top:22.5px;transform:translateY(-50%);z-index:110;pointer-events:none;display:flex;align-items:center;justify-content:center;width:7px;height:7px;padding:0;border:0;border-radius:999px;background:var(--privacy-color);isolation:isolate;transition:width 400ms cubic-bezier(.22,.8,.25,1),height 400ms cubic-bezier(.22,.8,.25,1),right 400ms cubic-bezier(.22,.8,.25,1),background-color 180ms ease;}
.privacy-indicator.expanded{width:var(--expanded-width);height:var(--expanded-height);right:24px;}
.privacy-symbols{display:flex;flex:none;gap:4px;opacity:0;transform:translateX(7px) scale(.35);pointer-events:none;transition:opacity 160ms ease,transform 320ms cubic-bezier(.22,.8,.25,1);}
.expanded .privacy-symbols{opacity:1;transform:translateX(0) scale(1);transition:opacity 180ms ease 60ms,transform 320ms cubic-bezier(.22,.8,.25,1);}
.privacy-indicator-enter-active,.privacy-indicator-leave-active{transition:opacity 160ms ease}.privacy-indicator-enter-from,.privacy-indicator-leave-to{opacity:0}
@media(prefers-reduced-motion:reduce){*{transition:none!important}}
</style>
