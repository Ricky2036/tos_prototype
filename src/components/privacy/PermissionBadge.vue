<script setup>
import camera from '../../assets/privacy/camera.svg'
import microphone from '../../assets/privacy/microphone.svg'
import location from '../../assets/privacy/location.svg'
defineProps({ permission: String, size: { type: Number, default: 24 } })
const icons = { camera, microphone, location }
</script>
<template><img class="permission-badge" :src="icons[permission]" :width="size" :height="size" alt="" aria-hidden="true" draggable="false" /></template>
<style scoped>.permission-badge{display:block;flex:none;object-fit:contain}</style>
