<script setup>
import { useId } from 'vue'
const gradientId = `resize-handle-${useId()}`
</script>

<template>
<svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M14.9434 4.60134C14.9434 2.06009 16.9708 0 19.4717 0C21.9726 0 24 2.06009 24 4.60134C24 15.5287 15.2822 24.3871 4.5283 24.3871C2.02739 24.3871 0 22.327 0 19.7858C0 17.2445 2.02739 15.1844 4.5283 15.1844C10.2804 15.1844 14.9434 10.4462 14.9434 4.60134Z"
          fill="rgba(255, 255, 255, 0.22)"
          :stroke="`url(#${gradientId})`"
          stroke-width="1.2"
        />
        <defs>
          <linearGradient :id="gradientId" x1="0" y1="0" x2="24" y2="25" gradientUnits="userSpaceOnUse">
            <stop stop-color="white" stop-opacity="0.95"/>
            <stop offset="0.5" stop-color="white" stop-opacity="0.3"/>
            <stop offset="1" stop-color="white" stop-opacity="0.8"/>
          </linearGradient>
        </defs>
      </svg>
</template>

<style scoped>
svg { display: block; pointer-events: none; }
</style>
