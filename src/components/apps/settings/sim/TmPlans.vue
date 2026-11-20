<script setup>
import GlassNavBar from '../../../ui/GlassNavBar.vue'
import { TM_PLAN } from './trafficData.js'
import './traffic.css'

/**
 * 全部套餐
 * 录屏没有进入这一页（蓝色卡片的「全部套餐 ›」只出现在主页面）。
 * 按真机同一套空态口径补：无套餐时给插画位 + 一句说明，不做成死条目。
 */
const emit = defineEmits(['back'])
</script>

<template>
  <div class="tm-page">
    <GlassNavBar overlay :title="TM_PLAN.allLabel" @back="emit('back')" />

    <div class="tm-body scrollable" data-testid="tm-plans">
      <div class="tm-empty">
        <div class="tm-empty-icon" aria-hidden="true">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
            <rect x="3.2" y="5.6" width="13.6" height="14.8" rx="3" fill="currentColor" opacity="0.22" />
            <rect x="7.4" y="3.4" width="13.6" height="14.8" rx="3" fill="currentColor" opacity="0.45" />
            <path d="M11.4 11.6h5.6M11.4 14.6h3.6" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round" />
          </svg>
        </div>
        <div data-testid="tm-plans-empty">{{ TM_PLAN.title }}</div>
        <div style="margin-top: 6px">{{ TM_PLAN.emptyDesc }}</div>
      </div>
    </div>
  </div>
</template>
