<script setup>
import SubPageShell from '../subpage/SubPageShell.vue'

const emit = defineEmits(['back'])

// 真机这一页按应用列「自动 / 展示相机孔 / 隐藏相机孔」，首屏为默认「自动」
const APPS = [
  { name: 'AHA Prime', bg: '#F97316', letter: 'A' },
  { name: 'Antigravity', bg: '#6366F1', letter: 'A' },
  { name: 'ChatGPT', bg: '#111111', letter: 'C' },
  { name: 'DeepSeek', bg: '#4F6BED', letter: 'D' },
  { name: 'Epson Smart Panel', bg: '#F4F4F6', letter: 'E' },
  { name: 'FlClash', bg: '#2F6BF6', letter: 'F' }
]
</script>

<template>
  <SubPageShell title="应用全屏显示" @back="emit('back')">
    <div class="hole-previews">
      <div class="hole-col">
        <div class="hole-phone"><span class="hole-dot"></span></div>
        <div class="hole-label">展示相机孔</div>
      </div>
      <div class="hole-col">
        <div class="hole-phone"><span class="hole-bar"></span></div>
        <div class="hole-label">隐藏相机孔</div>
      </div>
    </div>

    <div class="card-note">
      应用显示修改为“展示相机孔”，可将应用背景强制延伸到相机孔全屏显示。
    </div>

    <div class="settings-card">
      <div
        v-for="(app, i) in APPS"
        :key="app.name"
        class="app-row"
        :class="{ last: i === APPS.length - 1 }"
      >
        <span class="app-icon" :style="{ background: app.bg }">{{ app.letter }}</span>
        <span class="app-main">
          <span class="app-name">{{ app.name }}</span>
          <span class="app-mode">自动</span>
        </span>
      </div>
    </div>
  </SubPageShell>
</template>

<style scoped>
.hole-previews {
  display: flex;
  justify-content: center;
  gap: 40px;
  padding: 12px 0 14px;
}

.hole-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.hole-phone {
  position: relative;
  width: 92px;
  height: 158px;
  border-radius: 14px;
  border: 2px solid #C9C9CE;
  display: flex;
  justify-content: center;
  box-sizing: border-box;
}

.hole-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #9A9AA0;
  margin-top: 9px;
}

.hole-bar {
  width: 100%;
  height: 12px;
  background: #9A9AA0;
  border-radius: 12px 12px 0 0;
}

.hole-label {
  font-size: 13px;
  color: #3C3C43;
}

.app-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
}

.app-row.last {
  padding-bottom: 14px;
}

.app-icon {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #FFFFFF;
  font-size: 15px;
  font-weight: 600;
  flex: none;
}

.app-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  border-bottom: 0.5px solid rgba(60, 60, 67, 0.12);
  padding-bottom: 10px;
  min-width: 0;
}

.app-row.last .app-main {
  border-bottom: none;
  padding-bottom: 0;
}

.app-name {
  font-size: 16px;
  color: #111;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.app-mode {
  font-size: 13px;
  color: #2F6BF6;
}
</style>
