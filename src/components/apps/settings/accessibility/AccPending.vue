<script setup>
import SubPageShell from '../subpage/SubPageShell.vue'
import './acc.css'

/**
 * 取证缺口页（SET-ACC-01）
 *
 * 只用在**真机未采到内容**的深层入口上：宁可在页面上写清「这层还没采」，
 * 也不拿 toast / 空 handler 冒充完成，更不臆造真实页面里没有的控件。
 * 采集补齐后，把对应行改指向真页并把这里删掉。
 */
defineProps({
  title: { type: String, required: true },
  reason: { type: String, default: '' }
})
const emit = defineEmits(['back'])
</script>

<template>
  <SubPageShell :title="title" @back="emit('back')">
    <div class="acc-page">
      <div class="acc-card">
        <div class="acc-pending" data-testid="acc-pending">
          <h3>{{ title }}</h3>
          <p>这一层页面还没有真机采集证据，本轮不做实现。</p>
          <p v-if="reason">{{ reason }}</p>
          <p>采集补齐后按真机页面复刻；在此之前它不算「已完成」。</p>
        </div>
      </div>
    </div>
  </SubPageShell>
</template>
