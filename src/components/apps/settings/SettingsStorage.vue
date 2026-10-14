<script setup>
import { ref } from 'vue'
import ListCell from '../../ui/ListCell.vue'
import ToggleSwitch from '../../ui/ToggleSwitch.vue'

const emit = defineEmits(['back', 'navigate'])

// 交互状态
const lowStorageManage = ref(false)
const cleanedOldFiles = ref(false)

// 已用存储与占比（对齐真机 213 GB / 256 GB = 83.19%）
const usedGB = ref(213)
const totalGB = ref(256)
const oldFilesSize = ref('72.73 GB')
const oldFilesCount = ref('9625个')

// 提示反馈
const toastText = ref('')
let toastTimer = null
function showToast(msg) {
  toastText.value = msg
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastText.value = ''
  }, 2200)
}

function handleCleanUp() {
  if (cleanedOldFiles.value) {
    showToast('当前存储环境良好，暂无多余垃圾文件')
    return
  }
  showToast('正在深度清理缓存与冗余安装包...')
  setTimeout(() => {
    usedGB.value = 198
    cleanedOldFiles.value = true
    showToast('清理完成，已释放 15.00 GB 空间！')
  }, 900)
}

function handleCleanOldFiles() {
  if (cleanedOldFiles.value) {
    showToast('老旧文件已全部完成分类整理')
    return
  }
  showToast('正在归档老旧文件...')
  setTimeout(() => {
    cleanedOldFiles.value = true
    usedGB.value = 186
    oldFilesSize.value = '0 B'
    oldFilesCount.value = '0个'
    showToast('老旧文件清理完毕，已释放 27.00 GB 空间！')
  }, 900)
}

function handleCategoryTap(name) {
  showToast(`已进入${name}存储详情`)
}

function back() {
  emit('back')
  return true
}

defineExpose({ back })
</script>

<template>
  <div class="settings-storage-page">
    <!-- 顶部导航栏：左对齐大标题 -->
    <div class="storage-nav-bar">
      <button class="nav-round-btn" aria-label="返回" data-nav-back @click="emit('back')">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M19 12H5M5 12L12 5M5 12L12 19" stroke="#1C1C1E" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <div class="nav-title">存储</div>
    </div>

    <!-- 滚动区域 -->
    <div class="storage-scroll-body scrollable">
      <!-- 顶部存储看板卡片 -->
      <div class="storage-hero-card">
        <div class="storage-header-row">
          <div class="storage-percentage-wrap">
            <span class="percentage-num">{{ ((usedGB / totalGB) * 100).toFixed(2) }}</span>
            <span class="percentage-unit">%</span>
          </div>
          <button class="clean-pill-btn" @click="handleCleanUp">清理</button>
        </div>
        <div class="storage-capacity-text">已用 {{ usedGB }} GB/{{ totalGB }} GB</div>

        <!-- 存储分类多色分段进度条（对齐真机实测色块） -->
        <div class="storage-segmented-bar">
          <!-- 图片 (明黄) -->
          <span class="seg-fill seg-image" style="width: 3.2%;"></span>
          <!-- 视频 (鲜橙) -->
          <span class="seg-fill seg-video" style="width: 25.7%;"></span>
          <!-- 应用 (湖蓝) -->
          <span class="seg-fill seg-apps" style="width: 35.7%;"></span>
          <!-- 系统数据 (浅灰) -->
          <span class="seg-fill seg-sys-data" style="width: 7.1%;"></span>
          <!-- 系统固件 (深灰) -->
          <span class="seg-fill seg-firmware" style="width: 11.5%;"></span>
        </div>
      </div>

      <!-- 推荐模块 -->
      <div class="section-header-row">
        <span class="section-title">推荐</span>
        <button class="section-action-btn" @click="showToast('查看更多推荐清理项')">更多 &gt;</button>
      </div>
      <div class="settings-card">
        <div class="recommend-item" @click="handleCleanOldFiles">
          <div class="recommend-icon bg-orange-rec">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M4 4H10L12 6H20C21.1 6 22 6.9 22 8V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" fill="#FFFFFF"/>
              <!-- 循环/刷新箭头 -->
              <path d="M14 11C13.5 10.4 12.8 10 12 10C10.3 10 9 11.3 9 13C9 14.7 10.3 16 12 16C13.3 16 14.4 15.2 14.8 14" stroke="#F97316" stroke-width="1.8" stroke-linecap="round"/>
              <path d="M14 10V12H12" stroke="#F97316" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="recommend-info">
            <div class="recommend-title">老旧文件清理</div>
            <div class="recommend-subtitle">{{ oldFilesCount }} {{ oldFilesSize }}</div>
          </div>
          <div class="recommend-action">
            <span>{{ cleanedOldFiles ? '已清理' : '立即清理' }}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M9 18L15 12L9 6" stroke="#8E8E93" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- 分类存储列表（真机纯色指示圆点） -->
      <div class="settings-card">
        <!-- 图片 -->
        <ListCell title="图片" value="7.79 GB" chevron @click="handleCategoryTap('图片')">
          <template #icon>
            <div class="color-dot-wrap">
              <span class="color-dot dot-yellow"></span>
            </div>
          </template>
        </ListCell>

        <!-- 视频 -->
        <ListCell title="视频" value="65.89 GB" chevron @click="handleCategoryTap('视频')">
          <template #icon>
            <div class="color-dot-wrap">
              <span class="color-dot dot-orange"></span>
            </div>
          </template>
        </ListCell>

        <!-- 音频 -->
        <ListCell title="音频" value="0.92 GB" chevron @click="handleCategoryTap('音频')">
          <template #icon>
            <div class="color-dot-wrap">
              <span class="color-dot dot-red"></span>
            </div>
          </template>
        </ListCell>

        <!-- 文档 -->
        <ListCell title="文档" value="179 MB" chevron @click="handleCategoryTap('文档')">
          <template #icon>
            <div class="color-dot-wrap">
              <span class="color-dot dot-purple"></span>
            </div>
          </template>
        </ListCell>

        <!-- 安装包 -->
        <ListCell title="安装包" value="0 B" chevron @click="handleCategoryTap('安装包')">
          <template #icon>
            <div class="color-dot-wrap">
              <span class="color-dot dot-indigo"></span>
            </div>
          </template>
        </ListCell>

        <!-- 应用 -->
        <ListCell title="应用" value="91.41 GB" chevron @click="handleCategoryTap('应用')">
          <template #icon>
            <div class="color-dot-wrap">
              <span class="color-dot dot-cyan"></span>
            </div>
          </template>
        </ListCell>

        <!-- 其它 -->
        <ListCell title="其它" value="4.86 MB" chevron last @click="handleCategoryTap('其它')">
          <template #icon>
            <div class="color-dot-wrap">
              <span class="color-dot dot-mint"></span>
            </div>
          </template>
        </ListCell>
      </div>

      <!-- 系统存储分类 -->
      <div class="section-header-row">
        <span class="section-title">系统</span>
      </div>
      <div class="settings-card">
        <!-- 系统数据 -->
        <ListCell
          title="系统数据"
          subtitle="系统数据包括内存融合、缓存、日志等。"
          value="18.16 GB"
          @click="handleCategoryTap('系统数据')"
        >
          <template #icon>
            <div class="color-dot-wrap top-align">
              <span class="color-dot dot-light-gray"></span>
            </div>
          </template>
        </ListCell>

        <!-- 系统固件 -->
        <ListCell
          title="系统固件"
          value="28.43 GB"
          last
          @click="handleCategoryTap('系统固件')"
        >
          <template #icon>
            <div class="color-dot-wrap">
              <span class="color-dot dot-dark-gray"></span>
            </div>
          </template>
        </ListCell>
      </div>

      <!-- 低存储管理独立卡片 -->
      <div class="settings-card">
        <ListCell
          title="低存储管理"
          subtitle="当存储较低时，部分应用会被限制启动，已经在后台的应用不受影响。"
          last
        >
          <template #right>
            <ToggleSwitch v-model="lowStorageManage" />
          </template>
        </ListCell>
      </div>

      <div class="bottom-spacer"></div>
    </div>

    <!-- 浮动提示 Toast -->
    <transition name="toast-fade">
      <div v-if="toastText" class="settings-toast">{{ toastText }}</div>
    </transition>
  </div>
</template>

<style scoped>
.settings-storage-page {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: var(--bg-subtle, #F2F2F7);
  color: #1C1C1E;
  overflow: hidden;
  user-select: none;
}

/* 导航栏：左对齐大标题 */
.storage-nav-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  height: calc(var(--safe-top, 0px) + 52px);
  padding: var(--safe-top, 0px) 16px 0 16px;
  background: #F2F2F7;
  flex-shrink: 0;
  z-index: 10;
}

.nav-round-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.05);
  border: none;
  outline: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s ease;
}

.nav-round-btn:active {
  background: rgba(0, 0, 0, 0.1);
}

.nav-title {
  font-size: 20px;
  font-weight: 600;
  color: #1C1C1E;
  letter-spacing: -0.3px;
}

/* 滚动区域 */
.storage-scroll-body {
  flex: 1;
  padding: 8px 16px 32px 16px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* 顶部存储看板 */
.storage-hero-card {
  background: #FFFFFF;
  border-radius: 20px;
  padding: 20px 20px 22px 20px;
  margin-bottom: 16px;
  border: 1px solid rgba(0, 0, 0, 0.03);
}

.storage-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.storage-percentage-wrap {
  display: flex;
  align-items: baseline;
  line-height: 1;
}

.percentage-num {
  font-size: 46px;
  font-weight: 700;
  color: #1C1C1E;
  letter-spacing: -1.2px;
}

.percentage-unit {
  font-size: 22px;
  font-weight: 600;
  color: #1C1C1E;
  margin-left: 2px;
}

/* 清理胶囊按钮：对齐真机浅色边框式样 */
.clean-pill-btn {
  padding: 6px 20px;
  border-radius: 999px;
  border: 1.5px solid #007AFF;
  background: transparent;
  color: #007AFF;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.clean-pill-btn:active {
  background: rgba(0, 122, 255, 0.1);
}

.storage-capacity-text {
  font-size: 14px;
  color: #8E8E93;
  margin-top: 4px;
  margin-bottom: 16px;
}

/* 多色分段存储条 */
.storage-segmented-bar {
  display: flex;
  height: 28px;
  border-radius: 14px;
  overflow: hidden;
  background: #F2F2F7;
  gap: 1.5px;
}

.seg-fill {
  height: 100%;
  display: inline-block;
}

.seg-image { background: #FBBF24; }
.seg-video { background: #F97316; }
.seg-apps { background: #38BDF8; }
.seg-sys-data { background: #D1D5DB; }
.seg-firmware { background: #6B7280; }

/* 分组标题与操作链接 */
.section-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 4px;
  margin-bottom: 8px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #1C1C1E;
}

.section-action-btn {
  background: none;
  border: none;
  padding: 0;
  font-size: 13px;
  font-weight: 500;
  color: #007AFF;
  cursor: pointer;
}

/* 设置卡片容器 */
.settings-card {
  background: #FFFFFF;
  border-radius: 16px;
  margin-bottom: 16px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.03);
}

/* 推荐卡片项 */
.recommend-item {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.recommend-item:active {
  background: #F9F9FB;
}

.recommend-icon {
  width: 40px;
  height: 40px;
  border-radius: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  flex-shrink: 0;
}

.bg-orange-rec {
  background: #F97316;
}

.recommend-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.recommend-title {
  font-size: 15px;
  font-weight: 600;
  color: #1C1C1E;
  margin-bottom: 3px;
}

.recommend-subtitle {
  font-size: 12px;
  color: #8E8E93;
}

.recommend-action {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #8E8E93;
}

/* 分类圆点指示器 */
.color-dot-wrap {
  width: 20px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex: none;
  margin-right: 14px;
}

.color-dot-wrap.top-align {
  align-self: flex-start;
  margin-top: 18px;
}

.color-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: block;
}

.dot-yellow { background: #FBBF24; }
.dot-orange { background: #F97316; }
.dot-red { background: #EF4444; }
.dot-purple { background: #A855F7; }
.dot-indigo { background: #3B82F6; }
.dot-cyan { background: #0EA5E9; }
.dot-mint { background: #10B981; }
.dot-light-gray { background: #D1D5DB; }
.dot-dark-gray { background: #6B7280; }

.bottom-spacer {
  height: 24px;
}

/* Toast */
.settings-toast {
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(28, 28, 30, 0.88);
  color: #FFFFFF;
  padding: 8px 18px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  pointer-events: none;
  z-index: 100;
  white-space: nowrap;
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, 8px);
}
</style>
