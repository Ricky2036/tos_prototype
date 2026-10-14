<script setup>
import { ref } from 'vue'
import ListCell from '../../ui/ListCell.vue'
import ToggleSwitch from '../../ui/ToggleSwitch.vue'

const emit = defineEmits(['back', 'navigate'])

// 交互状态
const lowStorageManage = ref(false)
const cleanedOldFiles = ref(false)

// 已用存储与占比（支持模拟清理后的动态响应）
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
    showToast('当前存储环境极佳，暂无多余垃圾文件')
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
    <!-- 顶部导航栏 -->
    <div class="storage-nav-bar">
      <button class="nav-round-btn" aria-label="返回" data-nav-back @click="emit('back')">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M19 12H5M5 12L12 5M5 12L12 19" stroke="#1C1C1E" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <div class="nav-title">存储</div>
      <div class="nav-placeholder"></div>
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

        <!-- 存储分类分段进度条 -->
        <div class="storage-segmented-bar">
          <!-- 图片 (橙黄) -->
          <span class="seg-fill seg-image" style="width: 3.5%;"></span>
          <!-- 视频 (深橙) -->
          <span class="seg-fill seg-video" style="width: 25.5%;"></span>
          <!-- 应用 (亮蓝) -->
          <span class="seg-fill seg-apps" style="width: 35.5%;"></span>
          <!-- 系统数据 (浅灰) -->
          <span class="seg-fill seg-sys-data" style="width: 7.1%;"></span>
          <!-- 系统固件 (深灰) -->
          <span class="seg-fill seg-firmware" style="width: 11.1%;"></span>
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
              <path d="M12 11V15M10 13H14" stroke="#F97316" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <div class="recommend-info">
            <div class="recommend-title">老旧文件清理</div>
            <div class="recommend-subtitle">{{ oldFilesCount }} {{ oldFilesSize }}</div>
          </div>
          <div class="recommend-action">
            <span>{{ cleanedOldFiles ? '已清理' : '立即清理' }}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M9 18L15 12L9 6" stroke="#C7C7CC" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- 分类存储列表 -->
      <div class="settings-card">
        <!-- 图片 -->
        <ListCell title="图片" value="7.79 GB" chevron @click="handleCategoryTap('图片')">
          <template #icon>
            <span class="color-dot dot-yellow"></span>
          </template>
        </ListCell>

        <!-- 视频 -->
        <ListCell title="视频" value="65.89 GB" chevron @click="handleCategoryTap('视频')">
          <template #icon>
            <span class="color-dot dot-orange"></span>
          </template>
        </ListCell>

        <!-- 音频 -->
        <ListCell title="音频" value="0.92 GB" chevron @click="handleCategoryTap('音频')">
          <template #icon>
            <span class="color-dot dot-red"></span>
          </template>
        </ListCell>

        <!-- 文档 -->
        <ListCell title="文档" value="179 MB" chevron @click="handleCategoryTap('文档')">
          <template #icon>
            <span class="color-dot dot-purple"></span>
          </template>
        </ListCell>

        <!-- 安装包 -->
        <ListCell title="安装包" value="0 B" chevron @click="handleCategoryTap('安装包')">
          <template #icon>
            <span class="color-dot dot-indigo"></span>
          </template>
        </ListCell>

        <!-- 应用 -->
        <ListCell title="应用" value="91.41 GB" chevron @click="handleCategoryTap('应用')">
          <template #icon>
            <span class="color-dot dot-cyan"></span>
          </template>
        </ListCell>

        <!-- 其它 -->
        <ListCell title="其它" value="4.86 MB" chevron last @click="handleCategoryTap('其它')">
          <template #icon>
            <span class="color-dot dot-mint"></span>
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
            <span class="color-dot dot-light-gray"></span>
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
            <span class="color-dot dot-dark-gray"></span>
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

/* 导航栏 */
.storage-nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
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
  font-size: 17px;
  font-weight: 600;
  color: #1C1C1E;
  letter-spacing: -0.2px;
}

.nav-placeholder {
  width: 36px;
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
  padding: 22px 20px 22px 20px;
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
}

.percentage-num {
  font-size: 44px;
  font-weight: 700;
  line-height: 1;
  color: #1C1C1E;
  letter-spacing: -1px;
}

.percentage-unit {
  font-size: 20px;
  font-weight: 600;
  color: #1C1C1E;
  margin-left: 2px;
}

.clean-pill-btn {
  padding: 6px 18px;
  border-radius: 16px;
  border: 1px solid #007AFF;
  background: transparent;
  color: #007AFF;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.clean-pill-btn:active {
  background: rgba(0, 122, 255, 0.08);
  transform: scale(0.96);
}

.storage-capacity-text {
  font-size: 14px;
  color: #8E8E93;
  margin-bottom: 18px;
}

/* 分段彩条 */
.storage-segmented-bar {
  display: flex;
  height: 20px;
  border-radius: 10px;
  overflow: hidden;
  background: #E5E5EA;
}

.seg-fill {
  height: 100%;
}

.seg-image { background: #FACC15; }
.seg-video { background: #FB923C; }
.seg-apps { background: #60A5FA; }
.seg-sys-data { background: #CBD5E1; }
.seg-firmware { background: #94A3B8; }

/* 模块标题与操作 */
.section-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 4px 8px 4px;
}

.section-title {
  font-size: 13px;
  color: #8E8E93;
  font-weight: 500;
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

/* 推荐卡片 */
.recommend-item {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.recommend-item:active {
  background: rgba(0, 0, 0, 0.03);
}

.recommend-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 14px;
  flex-shrink: 0;
}

.bg-orange-rec {
  background: #F97316;
}

.recommend-info {
  flex: 1;
}

.recommend-title {
  font-size: 15px;
  font-weight: 600;
  color: #1C1C1E;
  margin-bottom: 2px;
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

/* 设置卡片容器 */
.settings-card {
  background: #FFFFFF;
  border-radius: 16px;
  margin-bottom: 14px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.03);
}

/* 分类圆点图标 */
.color-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-left: 2px;
  margin-right: 4px;
  display: inline-block;
}

.dot-yellow { background: #FACC15; }
.dot-orange { background: #FB923C; }
.dot-red { background: #EF4444; }
.dot-purple { background: #A855F7; }
.dot-indigo { background: #3B82F6; }
.dot-cyan { background: #0EA5E9; }
.dot-mint { background: #10B981; }
.dot-light-gray { background: #CBD5E1; }
.dot-dark-gray { background: #94A3B8; }

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
