<script setup>
import SubPageShell from '../subpage/SubPageShell.vue'
import { POWER_SAVER_INTRO, POWER_SAVER_INTRO_NOTE } from './batteryData'

/**
 * 省电模式介绍（真机：省电管理 → 说明里的「了解详情」）
 * 证据：`.local-evidence/SET-BAT-01/33-saver-details.*`
 */
const emit = defineEmits(['back'])
</script>

<template>
  <SubPageShell title="省电模式介绍" @back="emit('back')">
    <div class="intro-lead">省电模式将进行以下优化：</div>

    <div v-for="group in POWER_SAVER_INTRO" :key="group.title" class="intro-group">
      <div class="intro-group-title">{{ group.title }}</div>
      <ul class="intro-list">
        <li v-for="item in group.items" :key="item">{{ item }}</li>
      </ul>
    </div>

    <div class="intro-note">{{ POWER_SAVER_INTRO_NOTE }}</div>
  </SubPageShell>
</template>

<style scoped>
.intro-lead { font-size: 15px; color: #1C1C1E; padding: 4px 4px 10px; }

.intro-group { padding: 0 4px 14px; }

.intro-group-title { font-size: 15px; color: #8E8E93; margin-bottom: 4px; }

.intro-list { margin: 0; padding-left: 18px; }

.intro-list li { font-size: 15px; color: #1C1C1E; line-height: 23px; }

.intro-note { font-size: 12px; line-height: 18px; color: #8E8E93; padding: 2px 4px 8px; }
</style>
