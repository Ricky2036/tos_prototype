<script setup>
import { ref } from 'vue'
import PrivacyDemo from './PrivacyDemo.vue'
import LIcon from '../ui/LIcon.vue'
defineProps({mode:{type:String,default:'desktop'}})
const open = ref(false)
</script>
<template>
 <aside v-if="mode==='desktop'" class="privacy-console" aria-label="原型控制台"><PrivacyDemo /></aside>
 <template v-else>
  <button class="privacy-console-toggle" aria-label="打开控制台" @click="open=!open"><LIcon name="settings2" :size="21" /></button>
  <div v-if="open" class="privacy-console-backdrop" @click.self="open=false"><aside class="privacy-console" aria-label="原型控制台"><button class="privacy-console-close" aria-label="关闭控制台" @click="open=false"><LIcon name="x" :size="15" /></button><PrivacyDemo /></aside></div>
 </template>
</template>
<style scoped>
.privacy-console{position:relative;width:320px;flex:none;align-self:center;padding:24px;background:linear-gradient(145deg,#252c3e,#191b23);border:1px solid #ffffff24;border-radius:24px;box-shadow:0 24px 64px #0005;color:white}.privacy-console-toggle{position:fixed;right:14px;bottom:54px;z-index:200;width:42px;height:42px;border-radius:50%;border:1px solid #ffffff40;background:#252c3ed9;color:white;display:grid;place-items:center}.privacy-console-backdrop{position:fixed;inset:0;z-index:210;background:#0005;display:flex;align-items:center;justify-content:center;padding:20px}.privacy-console-backdrop .privacy-console{max-width:100%;padding-top:39px}.privacy-console-close{position:absolute;top:10px;right:10px;border:0;border-radius:50%;width:24px;height:24px;background:#ffffff15;color:white;display:grid;place-items:center}button{cursor:pointer}
</style>
