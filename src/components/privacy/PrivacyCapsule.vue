<script setup>
import { usePrivacyStore, DEMO_APPS, PERMISSIONS } from '../../stores/privacyStore'
import camera from '../../assets/privacy/camera-capsule.svg'
import microphone from '../../assets/privacy/microphone-capsule.svg'
import location from '../../assets/privacy/location-capsule.svg'
import PermissionBadge from './PermissionBadge.vue'
import LIcon from '../ui/LIcon.vue'
const privacy = usePrivacyStore()
const backplates = {camera,microphone,location}
const backplateStyle = key => ({ borderImageSource: `url("${backplates[key]}")` })
</script>
<template>
  <div class="privacy-slot">
    <Transition name="capsule">
      <button v-if="privacy.summary" class="privacy-capsule" :class="{ recent: !privacy.summary.isActive }" @pointerdown.stop @click.stop="privacy.openDetail()" :aria-label="`${privacy.summary.apps.map(app=>DEMO_APPS[app].name).join('、')}${privacy.summary.isActive ? '正在使用' : '最近使用'}${privacy.summary.keys.map(k=>PERMISSIONS[k].label).join('、')}，查看详情`" data-testid="privacy-capsule">
        <span class="capsule-backplate" :style="backplateStyle(privacy.summary.primary)" aria-hidden="true" />
        <span class="capsule-icons"><PermissionBadge v-for="key in privacy.summary.keys" :key="key" :permission="key" :size="16" /></span>
        <span class="capsule-app">{{ privacy.summary.apps.map(app=>DEMO_APPS[app].name).join('、') }}</span>
        <LIcon name="chevronRight" :size="13" class="capsule-chevron" />
      </button>
    </Transition>
  </div>
</template>
<style scoped>
.privacy-slot{height:24px;display:flex;align-items:center;justify-content:center;margin:8px auto 13px;width:var(--cc-grid-w,290px);}
.privacy-capsule{position:relative;isolation:isolate;width:max-content;max-width:100%;box-sizing:border-box;height:24px;display:flex;align-items:center;gap:5px;border:0;border-radius:999px;padding:4px 5px 4px 4px;color:white;background:transparent;font:500 12px/1 var(--font-stack);cursor:pointer;}
.capsule-backplate{position:absolute;inset:0;box-sizing:border-box;border:12px solid transparent;border-image-slice:12 fill;border-image-width:12px;border-image-repeat:stretch;z-index:-1;pointer-events:none;transition:opacity .25s;}
.privacy-capsule.recent{color:#ffffffe0;}.recent .capsule-backplate{opacity:0;}
.capsule-icons{display:flex;gap:5px;flex:none}.capsule-app{flex:0 1 auto;text-align:left;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}.capsule-chevron{opacity:.55;flex:none}
.capsule-enter-active,.capsule-leave-active{transition:opacity .2s}.capsule-enter-from,.capsule-leave-to{opacity:0}
</style>
