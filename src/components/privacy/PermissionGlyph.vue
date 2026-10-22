<script setup>
import camera from '../../assets/privacy/camera.svg?raw'
import microphone from '../../assets/privacy/microphone.svg?raw'
import location from '../../assets/privacy/location.svg?raw'
defineProps({ permission: String, size: { type: Number, default: 16 } })
// Retain the supplied white vector paths; the status indicator owns one shared background.
const glyphs = Object.fromEntries(Object.entries({camera, microphone, location}).map(([key,svg]) => [key, svg.replace(/<rect\b[^>]*\/>/, '')]))
</script>
<template><span class="permission-glyph" :style="{width:size+'px',height:size+'px'}" aria-hidden="true" v-html="glyphs[permission]"></span></template>
<style scoped>.permission-glyph{display:block;flex:none;line-height:0}.permission-glyph :deep(svg){display:block;width:100%;height:100%}</style>
