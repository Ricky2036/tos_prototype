<script setup>
/**
 * 常驻地选择 · 真机实测版（com.transsion.deskclock）
 * ===========================================
 * 真机证据：.local-evidence/SET-SYS-01/device/real_residence_tap.xml
 * 真机为独立全屏页面，非底部弹层：
 * 首行为「常驻地预测（深圳市）」，下方为 A-Z 城市列表。
 */
import { ref, computed } from 'vue'
import SubPageShell from '../subpage/SubPageShell.vue'
import ListCell from '../../../ui/ListCell.vue'
import { useDateTimeStore } from '../../../../stores/dateTimeStore.js'

const emit = defineEmits(['back'])
const store = useDateTimeStore()

const searchQuery = ref('')

const CITIES = [
  { name: '阿比让', country: '科特迪瓦', gmt: 'GMT +0:00' },
  { name: '阿布扎比', country: '阿拉伯联合酋长国', gmt: 'GMT +4:00' },
  { name: '阿德莱德', country: '澳大利亚', gmt: 'GMT +10:30' },
  { name: '阿尔伯克基', country: '美国', gmt: 'GMT -7:00' },
  { name: '阿尔及尔', country: '阿尔及利亚', gmt: 'GMT +1:00' },
  { name: '阿克拉', country: '加纳', gmt: 'GMT +0:00' },
  { name: '阿克套', country: '哈萨克斯坦', gmt: 'GMT +5:00' },
  { name: '阿拉木图', country: '哈萨克斯坦', gmt: 'GMT +5:00' },
  { name: '阿鲁巴', country: '阿鲁巴', gmt: 'GMT -4:00' },
]

const filteredCities = computed(() => {
  if (!searchQuery.value.trim()) return CITIES
  const q = searchQuery.value.trim().toLowerCase()
  return CITIES.filter(c => c.name.toLowerCase().includes(q) || c.country.toLowerCase().includes(q))
})

function selectCity(name) {
  store.setResidence(name)
  emit('back')
}
</script>

<template>
  <SubPageShell title="常驻地" @back="emit('back')">
    <div class="residence-container">
      <!-- 搜索栏 -->
      <div class="search-box">
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          class="search-input"
          placeholder="搜索常驻地"
        />
      </div>

      <!-- 预测常驻地 -->
      <div class="section-title">预测常驻地</div>
      <div class="settings-card">
        <ListCell
          title="常驻地预测（深圳市）"
          subtitle="将首次定位位置作为默认常驻地。"
          last
          @click="selectCity('常驻地预测（深圳市）')"
        >
          <template #right>
            <span v-if="store.residence === '常驻地预测（深圳市）'" class="check-mark">✓</span>
          </template>
        </ListCell>
      </div>

      <!-- 城市列表（A组） -->
      <div class="section-title">A</div>
      <div class="settings-card">
        <ListCell
          v-for="(city, i) in filteredCities"
          :key="city.name"
          :title="city.name"
          :subtitle="`${city.country}, ${city.gmt}`"
          :last="i === filteredCities.length - 1"
          @click="selectCity(city.name)"
        >
          <template #right>
            <span v-if="store.residence === city.name" class="check-mark">✓</span>
          </template>
        </ListCell>
      </div>
    </div>
  </SubPageShell>
</template>

<style scoped>
.residence-container {
  padding: 12px 0 32px;
}
.search-box {
  display: flex;
  align-items: center;
  background: #E5E7EB;
  border-radius: 20px;
  padding: 8px 14px;
  margin-bottom: 16px;
  gap: 8px;
}
.search-icon {
  width: 16px;
  height: 16px;
  color: #6B7280;
  flex-shrink: 0;
}
.search-input {
  border: none;
  background: transparent;
  outline: none;
  font-size: 14px;
  color: #111827;
  width: 100%;
}
.search-input::placeholder {
  color: #9CA3AF;
}
.section-title {
  font-size: 13px;
  font-weight: 500;
  color: #6B7280;
  padding: 8px 16px;
}
.check-mark {
  color: #2F6BF6;
  font-weight: bold;
}
</style>
