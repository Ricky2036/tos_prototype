<script setup>
import { computed, ref } from 'vue'
import { useI18nStore } from '../../../stores/i18nStore'
import { CONTACTS, msgText } from './msgData'
import MsgAvatar from './components/MsgAvatar.vue'

/**
 * 联系人选择（真机 SelectGContactPersonActivity）
 * 顶栏：× 圆钮 + 动态标题 + ✓ 圆钮；两个 Tab（联系人 / 群组，蓝色下划线）；
 * 列表按字母分组，右侧 A–Z 索引；底部"搜索联系人"胶囊。
 */
const i18n = useI18nStore()
const t = computed(() => msgText(i18n.locale))
const emit = defineEmits(['close', 'confirm'])

const tab = ref('contacts')
const query = ref('')
const picked = ref(new Set())

const groups = computed(() => {
  const q = query.value.trim().toLowerCase()
  const rows = CONTACTS.filter(c => !q || c.name.toLowerCase().includes(q) || c.line.includes(q))
  const map = new Map()
  for (const row of rows) {
    if (!map.has(row.section)) map.set(row.section, [])
    map.get(row.section).push(row)
  }
  return [...map.entries()].map(([letter, items]) => ({ letter, items }))
})

const title = computed(() => (picked.value.size
  ? t.value('pickCount', { n: picked.value.size })
  : t.value('pickContact')))

const alphabet = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'W', 'X', 'Y', 'Z', '#']

function toggle(id) {
  const next = new Set(picked.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  picked.value = next
}

function confirm() {
  const list = CONTACTS.filter(c => picked.value.has(c.id)).map(c => ({
    id: c.id,
    name: c.name,
    line: c.line
  }))
  emit('confirm', list)
}
</script>

<template>
  <div class="msg-picker-page" data-msg-page="picker">
    <div class="picker-top">
      <button class="round-btn" type="button" data-msg-picker-close @click="emit('close')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1E1E20" stroke-width="2.2" stroke-linecap="round">
          <path d="M5 5l14 14M19 5L5 19" />
        </svg>
      </button>
      <span class="picker-title">{{ title }}</span>
      <button class="round-btn" type="button" data-msg-picker-confirm @click="confirm">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1E1E20" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4.6 12.4l4.8 4.8L19.6 6.8" />
        </svg>
      </button>
    </div>

    <div class="tabs">
      <button class="tab" :class="{ on: tab === 'contacts' }" type="button" data-msg-tab="contacts" @click="tab = 'contacts'">
        {{ t('tabContacts') }}
      </button>
      <button class="tab" :class="{ on: tab === 'groups' }" type="button" data-msg-tab="groups" @click="tab = 'groups'">
        {{ t('tabGroups') }}
      </button>
    </div>

    <div class="picker-body">
      <div class="picker-list scrollable">
        <template v-if="tab === 'contacts'">
          <template v-for="group in groups" :key="group.letter">
            <div class="section">{{ group.letter }}</div>
            <div
              v-for="c in group.items"
              :key="c.id"
              class="contact-row"
              :data-msg-contact="c.id"
              @click="toggle(c.id)"
            >
              <MsgAvatar :name="c.name" :size="40" />
              <div class="contact-main">
                <div class="contact-name">{{ c.name }}</div>
                <div class="contact-line">{{ c.line }}</div>
              </div>
              <span class="check" :class="{ on: picked.has(c.id) }">
                <svg v-if="picked.has(c.id)" width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M5.5 12.4l4.2 4.2 8.8-9.6" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </span>
            </div>
          </template>
        </template>
        <div v-else class="empty-state">{{ t('tabGroups') }}</div>
      </div>
      <div v-if="tab === 'contacts'" class="index-bar">
        <span v-for="letter in alphabet" :key="letter">{{ letter }}</span>
      </div>
    </div>

    <div class="picker-search">
      <div class="search-pill">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8A8A8C" stroke-width="2" stroke-linecap="round">
          <circle cx="11" cy="11" r="7.2" />
          <path d="M16.4 16.4L21 21" />
        </svg>
        <input v-model="query" class="search-input" type="text" :placeholder="t('searchContacts')" data-msg-contact-search />
      </div>
    </div>
  </div>
</template>

<style scoped>
.msg-picker-page {
  position: relative;
  height: 100%;
  background: #f0f1f2;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.picker-top {
  flex: none;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: calc(var(--safe-top) + 6px) 16px 6px;
}
.round-btn {
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
.picker-title {
  flex: 1;
  font-size: 20px;
  font-weight: 600;
  color: #000;
  line-height: 24px;
}
.tabs {
  flex: none;
  display: flex;
  padding: 4px 0 0;
}
.tab {
  flex: 1;
  height: 44px;
  border: none;
  background: transparent;
  font-size: 17px;
  color: #1e1e20;
  position: relative;
  cursor: pointer;
}
.tab.on { color: #3375f6; font-weight: 500; }
.tab.on::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: 2px;
  width: 34px;
  height: 3px;
  border-radius: 2px;
  background: #3375f6;
  transform: translateX(-50%);
}
.picker-body {
  flex: 1;
  display: flex;
  min-height: 0;
}
.picker-list {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 8px;
}
.section {
  padding: 10px 22px 4px;
  font-size: 15px;
  line-height: 20px;
  color: #1e1e20;
}
.contact-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 8.5px 21.5px 8.5px 22px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.contact-row:active { background: #e9eaec; }
.contact-main { flex: 1; min-width: 0; }
.contact-name {
  font-size: 17px;
  line-height: 22px;
  font-weight: 500;
  color: #000;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.contact-line {
  font-size: 13px;
  line-height: 17px;
  color: #6f6f71;
  margin-top: 1px;
}
.check {
  flex: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1.5px solid #c9c9cb;
  background: #fff;
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.check.on { border-color: #3375f6; background: #3375f6; }
.index-bar {
  width: 22px;
  flex: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5px;
  padding-right: 2px;
}
.index-bar span {
  font-size: 10px;
  line-height: 11px;
  color: #8f8f91;
}
.empty-state {
  padding: 40px 0;
  text-align: center;
  color: #8f8f91;
  font-size: 14px;
}
.picker-search {
  flex: none;
  padding: 8px 22px calc(var(--safe-bottom) + 8px);
}
.search-pill {
  height: 40px;
  border-radius: 20px;
  background: #e7e8ea;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 14px;
}
.search-input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font-size: 15px;
  color: #000;
}
.search-input::placeholder { color: #8a8a8c; }
</style>
