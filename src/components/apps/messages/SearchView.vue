<script setup>
import { computed, nextTick, ref } from 'vue'
import { useI18nStore } from '../../../stores/i18nStore'
import { msgText, SEARCH_SENDERS } from './msgData'
import MsgAvatar from './components/MsgAvatar.vue'
import LIcon from '../../ui/LIcon.vue'

/**
 * 搜索页（真机 SearchActivity）
 *
 * 与常见设计相反：搜索框在页面底部（返回圆钮 + 胶囊），上半屏是
 * "发件人"（横向滚动的号码列表，命中片段染蓝）与 "类别"（图片 / 视频两个方块）。
 * 输入后类别区收起，只剩过滤后的发件人；未采集到结果列表样式，故不臆造结果列表。
 */
const i18n = useI18nStore()
const t = computed(() => msgText(i18n.locale))
const emit = defineEmits(['back'])

const query = ref('')
const inputEl = ref(null)

const senders = computed(() => {
  const q = query.value.trim()
  if (!q) return SEARCH_SENDERS
  return SEARCH_SENDERS.filter(s => s.includes(q))
})

function partsOf(number) {
  const q = query.value.trim()
  if (!q) return [{ text: number, hit: false }]
  const idx = number.indexOf(q)
  if (idx < 0) return [{ text: number, hit: false }]
  return [
    { text: number.slice(0, idx), hit: false },
    { text: q, hit: true },
    { text: number.slice(idx + q.length), hit: false }
  ].filter(p => p.text)
}

function focus() {
  nextTick(() => inputEl.value?.focus())
}

function clear() {
  query.value = ''
  focus()
}

defineExpose({ focus })
</script>

<template>
  <div class="msg-search-page" data-msg-page="search" @click="focus">
    <div class="search-scroll scrollable">
      <div class="section-label">{{ t('searchSender') }}</div>
      <div class="sender-strip">
        <div v-for="s in senders" :key="s" class="sender" :data-msg-sender="s">
          <MsgAvatar :name="s" icon="person" :size="34" />
          <div class="sender-number">
            <span v-for="(p, i) in partsOf(s)" :key="i" :class="{ hit: p.hit }">{{ p.text }}</span>
          </div>
        </div>
      </div>

      <template v-if="!query.trim()">
        <div class="section-label cat">{{ t('searchCategory') }}</div>
        <div class="cat-row">
          <button class="cat-tile" type="button" data-msg-cat="image">
            <LIcon name="image" :size="20" :stroke-width="1.7" />
            <span>{{ t('categoryImage') }}</span>
          </button>
          <button class="cat-tile" type="button" data-msg-cat="video">
            <LIcon name="videoCamera" :size="20" :stroke-width="1.7" />
            <span>{{ t('categoryVideo') }}</span>
          </button>
        </div>
      </template>
      <div v-else-if="!senders.length" class="empty-hint">{{ t('emptySearch') }}</div>
    </div>

    <div class="search-bar">
      <button class="back-btn" type="button" data-msg-back @click.stop="emit('back')">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M20 12H4.6M4.6 12l7.4-7.4M4.6 12l7.4 7.4" stroke="#1E1E20" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
      <div class="field">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8A8A8C" stroke-width="2" stroke-linecap="round">
          <circle cx="11" cy="11" r="7.2" />
          <path d="M16.4 16.4L21 21" />
        </svg>
        <input
          ref="inputEl"
          v-model="query"
          class="field-input"
          type="text"
          :placeholder="t('searchMessages')"
          data-msg-search-input
          @click.stop
        />
        <button v-if="query" class="clear" type="button" data-msg-search-clear @click.stop="clear">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" fill="#D3D4D6" />
            <path d="M8.6 8.6l6.8 6.8M15.4 8.6l-6.8 6.8" stroke="#fff" stroke-width="1.9" stroke-linecap="round" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.msg-search-page {
  position: relative;
  height: 100%;
  background: #f0f1f2;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.search-scroll {
  flex: 1;
  overflow-y: auto;
  padding-top: calc(var(--safe-top) + 22px);
}
.section-label {
  padding: 0 26px;
  font-size: 15px;
  line-height: 20px;
  color: #8f8f91;
}
.section-label.cat { margin-top: 46px; }
.sender-strip {
  display: flex;
  gap: 20px;
  padding: 16px 26px 4px;
  overflow-x: auto;
  overflow-y: hidden;
}
.sender {
  flex: none;
  width: 66px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.sender-number {
  font-size: 11.5px;
  line-height: 15px;
  color: #1e1e20;
  text-align: center;
  word-break: break-all;
}
.sender-number .hit { color: #3375f6; }
.cat-row {
  display: flex;
  gap: 13px;
  padding: 12px 26px 0;
}
.cat-tile {
  width: 75px;
  height: 75px;
  border: none;
  border-radius: 16px;
  background: #e7e8ea;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  font-size: 11.5px;
  line-height: 14px;
  color: #1e1e20;
  cursor: pointer;
}
.cat-tile:active { background: #dfe0e2; }
.empty-hint {
  margin-top: 40px;
  text-align: center;
  font-size: 14px;
  color: #8f8f91;
}
.search-bar {
  flex: none;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px calc(var(--safe-bottom) + 8px);
  box-sizing: border-box;
}
.back-btn {
  width: 44px;
  height: 44px;
  flex: none;
  border: none;
  border-radius: 50%;
  background: #fdfdfd;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05), 0 4px 10px rgba(0, 0, 0, 0.045);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.field {
  flex: 1;
  height: 44px;
  border-radius: 22px;
  background: #fdfdfd;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 14px;
  box-sizing: border-box;
}
.field-input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font-size: 16px;
  color: #000;
}
.field-input::placeholder { color: #9a9a9c; }
.clear {
  width: 22px;
  height: 22px;
  border: none;
  background: transparent;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
</style>
