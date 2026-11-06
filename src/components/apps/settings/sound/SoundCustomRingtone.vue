<script setup>
import { computed, ref } from 'vue'
import SubPageShell from '../subpage/SubPageShell.vue'
import ListCell from '../../../ui/ListCell.vue'
import { useSoundSettingsStore } from '../../../../stores/soundSettingsStore'

/**
 * 自定义铃声（来电铃声 / 通知铃声 → 自定义铃声）
 *
 * 真机形态：顶部分段控件「音乐 / 录音」，下面是本地音频文件单选列表，底部浮着一个搜索框。
 * 选中的文件会成为对应通道的铃声。
 */
const props = defineProps({
  title: { type: String, default: '自定义铃声' },
  which: { type: String, default: 'sim' }   // 'sim' | 'notif'
})
const emit = defineEmits(['back'])
const sound = useSoundSettingsStore()

const tab = ref('音乐')
const keyword = ref('')

// 与真机截图一致的本地文件（音乐 / 录音两套）
const MUSIC_FILES = [
  '20240928_121644', '20241008_183827', '2年级英语Module_1_2024-2025第一学期_',
  'Transsioner-20241119190137', '五彩彝裳', '又活了一天-陈伊曼', '又活了一天伴奏-陈伊曼',
  '小牛电动-2309141334', '微信-洋洋-20241217152912', '微信-洋洋-20250911182903',
  '指示方向录音_2', '自定义录音_20250103'
]
const RECORD_FILES = [
  '录音_20241105_093012', '录音_20241118_204455', '会议记录_20241202',
  '采访_陈工_20250112', '备忘_20250120_070815'
]

const files = computed(() => {
  const list = tab.value === '音乐' ? MUSIC_FILES : RECORD_FILES
  const kw = keyword.value.trim()
  return kw ? list.filter(f => f.includes(kw)) : list
})

function current() {
  return props.which === 'sim' ? sound.customRingtoneSim : sound.customRingtoneNotif
}

function pick(name) {
  sound.setCustomRingtone(props.which, name)
}
</script>

<template>
  <SubPageShell :title="title" @back="emit('back')">
    <div class="seg">
      <button
        type="button"
        class="seg-btn"
        :class="{ on: tab === '音乐' }"
        @click="tab = '音乐'"
      >音乐</button>
      <button
        type="button"
        class="seg-btn"
        :class="{ on: tab === '录音' }"
        @click="tab = '录音'"
      >录音</button>
    </div>

    <div class="settings-card">
      <ListCell
        v-for="(f, i) in files"
        :key="f"
        :title="f"
        :last="i === files.length - 1"
        clickable
        @click="pick(f)"
      >
        <template #right>
          <span class="opt-radio" :class="{ checked: current() === f }"></span>
        </template>
      </ListCell>
    </div>

    <div class="search-wrap">
      <div class="search-pill">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" stroke-width="2" stroke-linecap="round">
          <circle cx="11" cy="11" r="7" />
          <path d="M16.5 16.5 21 21" />
        </svg>
        <input v-model="keyword" class="search-input" type="text" placeholder="搜索" />
      </div>
    </div>
  </SubPageShell>
</template>

<style scoped>
.seg {
  display: flex;
  gap: 4px;
  background: #E9E9ED;
  border-radius: 10px;
  padding: 3px;
  margin-bottom: 12px;
}

.seg-btn {
  flex: 1;
  height: 34px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #3C3C43;
  font-size: 15px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
}

.seg-btn.on {
  background: #FFFFFF;
  color: #111;
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

/* 底部悬浮搜索框（真机就是浮在列表上方） */
.search-wrap {
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: 18px;
  z-index: 4;
}

.search-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 44px;
  padding: 0 14px;
  border-radius: 22px;
  background: #FFFFFF;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font: inherit;
  font-size: 16px;
  color: #111;
}

.search-input::placeholder {
  color: #8E8E93;
}
</style>
