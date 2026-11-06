<script setup>
import GlassNavBar from '../../ui/GlassNavBar.vue'
import { ref } from 'vue'
import { useDeviceStore } from '../../../stores/deviceStore'
import ListCell from '../../ui/ListCell.vue'
import xosBannerImg from '../../../assets/img/xos-banner.png'
import AboutDeviceNameModal from './about/AboutDeviceNameModal.vue'
import AboutMemFusion from './about/AboutMemFusion.vue'
import AboutPhoneStatus from './about/AboutPhoneStatus.vue'
import AboutAndroidVersion from './about/AboutAndroidVersion.vue'
import AboutElectronicWarranty from './about/AboutElectronicWarranty.vue'
import AboutLegalInfo from './about/AboutLegalInfo.vue'

const emit = defineEmits(['back', 'open-storage'])
const deviceStore = useDeviceStore()

// 三级页面状态: null | 'memFusion' | 'status' | 'androidVersion' | 'warranty' | 'legal'
const subPage = ref(null)
const isNameModalOpen = ref(false)

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

// 检查更新状态
const isCheckingUpdate = ref(false)
const updateStatusText = ref('')
function handleCheckUpdate() {
  if (isCheckingUpdate.value) return
  isCheckingUpdate.value = true
  setTimeout(() => {
    isCheckingUpdate.value = false
    updateStatusText.value = '已是最新版本'
    showToast('当前已是最新系统版本 XOS 17.0.0')
    setTimeout(() => {
      updateStatusText.value = ''
    }, 3000)
  }, 900)
}

// 开发者模式彩蛋（连续点击版本号 5 次）
const devClickCount = ref(0)
let devClickTimer = null
function handleBuildNumberClick() {
  devClickCount.value++
  if (devClickTimer) clearTimeout(devClickTimer)
  devClickTimer = setTimeout(() => {
    devClickCount.value = 0
  }, 2500)

  if (devClickCount.value >= 5) {
    showToast('您已处于开发者模式，无需进行此操作')
    devClickCount.value = 0
  } else if (devClickCount.value >= 2) {
    const remaining = 5 - devClickCount.value
    showToast(`只需点击 ${remaining} 次即可开启开发者选项`)
  }
}

function handleSaveDeviceName(newName) {
  deviceStore.setDeviceName(newName)
  isNameModalOpen.value = false
  showToast(`设备名称已更新为：${newName}`)
}

const isBack = ref(false)

function openSubPage(page) {
  isBack.value = false
  subPage.value = page
}

function closeSubPage() {
  isBack.value = true
  subPage.value = null
}

function back() {
  if (isNameModalOpen.value) {
    isNameModalOpen.value = false
    return true
  }
  if (subPage.value) {
    closeSubPage()
    return true
  }
  emit('back')
  return true
}

defineExpose({ back })
</script>

<template>
  <div class="about-phone-page">
    <Transition :name="isBack ? 'slide-back' : 'slide'" mode="out-in">
      <!-- ================= 三级页面：MemFusion 融合内存 ================= -->
      <AboutMemFusion
        v-if="subPage === 'memFusion'"
        key="memFusion"
        @back="closeSubPage"
      />

      <!-- ================= 三级页面：手机信息 ================= -->
      <AboutPhoneStatus
        v-else-if="subPage === 'status'"
        key="status"
        @back="closeSubPage"
      />

      <!-- ================= 三级页面：Android 版本 ================= -->
      <AboutAndroidVersion
        v-else-if="subPage === 'androidVersion'"
        key="androidVersion"
        @back="closeSubPage"
      />

      <!-- ================= 三级页面：电子保修卡 ================= -->
      <AboutElectronicWarranty
        v-else-if="subPage === 'warranty'"
        key="warranty"
        @back="closeSubPage"
      />

      <!-- ================= 三级页面：法律信息 ================= -->
      <AboutLegalInfo
        v-else-if="subPage === 'legal'"
        key="legal"
        @back="closeSubPage"
      />

      <!-- ================= 二级首页：我的手机 ================= -->
      <div v-else key="aboutMain" class="about-main-container">
        <!-- 顶部导航栏：圆形微灰底返回键 + 左对齐标题 -->
        <GlassNavBar title="我的手机" @back="emit('back')" />

        <!-- 滚动区域 -->
        <div class="about-scroll-body scrollable">
          <!-- ================= 卡片 1: XOS 17 品牌横幅卡 ================= -->
          <div class="xos-banner-card">
            <div class="xos-banner-bg-wrap">
              <img class="xos-banner-img" :src="xosBannerImg" alt="XOS 17.0.0" />
            </div>
            <div class="xos-banner-controls">
              <div class="xos-version-label">17.0.0</div>
              <button
                class="xos-check-btn"
                :class="{ active: isCheckingUpdate }"
                :disabled="isCheckingUpdate"
                @click="handleCheckUpdate"
              >
                <span v-if="!isCheckingUpdate" class="btn-text">
                  {{ updateStatusText || '检查更新' }}
                </span>
                <span v-else class="checking-state">
                  <svg class="checking-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="#0077FF" stroke-width="2.8" stroke-dasharray="32" stroke-linecap="round"/>
                  </svg>
                  <span>正在检查更新...</span>
                </span>
              </button>
            </div>
          </div>

          <!-- ================= 卡片 2: 设备基础与存储 ================= -->
          <div class="settings-card">
            <!-- 设备名称 -->
            <ListCell
              title="设备名称"
              :value="deviceStore.deviceName || 'Infinix NOTE 60 Pro'"
              chevron
              clickable
              @click="isNameModalOpen = true"
            />

            <!-- 存储空间 -->
            <ListCell
              title="存储空间"
              value="217 GB / 256 GB"
              chevron
              clickable
              @click="emit('open-storage')"
            />

            <!-- 存储压缩 -->
            <ListCell
              value="60 GB"
              last
              clickable
              @click="showToast('系统已自动无损压缩 60 GB 应用与冗余文件')"
            >
              <template #title>
                <div class="cell-title-with-info">
                  <span>存储压缩</span>
                  <svg class="info-badge-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="#8E8E93" stroke-width="2"/>
                    <line x1="12" y1="16" x2="12" y2="12" stroke="#8E8E93" stroke-width="2" stroke-linecap="round"/>
                    <circle cx="12" cy="8" r="1" fill="#8E8E93"/>
                  </svg>
                </div>
              </template>
            </ListCell>
          </div>

          <!-- ================= 卡片 3: 核心硬件规格 ================= -->
          <div class="settings-card">
            <!-- 型号 -->
            <ListCell
              title="型号"
              :value="deviceStore.model || 'Infinix X6878'"
              clickable
              @click="showToast(`设备型号：${deviceStore.model}`)"
            />

            <!-- CPU -->
            <ListCell
              title="CPU"
              :value="deviceStore.cpu || 'Snapdragon 7s Gen 4'"
              clickable
              @click="showToast('处理器：高通骁龙 7s Gen 4 移动平台')"
            />

            <!-- 内存（三级入口：MemFusion 融合内存） -->
            <ListCell
              title="内存"
              :value="deviceStore.totalRamText || '12.00 GB+6.00 GB'"
              chevron
              clickable
              @click="openSubPage('memFusion')"
            />

            <!-- 后置摄像头 -->
            <ListCell
              title="后置摄像头"
              :value="deviceStore.rearCamera || '50M OIS+8M'"
              clickable
              @click="showToast('后置：5000 万像素光学防抖主摄 + 800 万像素超广角')"
            />

            <!-- 前置摄像头 -->
            <ListCell
              title="前置摄像头"
              :value="deviceStore.frontCamera || '13M'"
              clickable
              @click="showToast('前置：1300 万高清自拍摄像头')"
            />

            <!-- 电池 -->
            <ListCell
              title="电池"
              :value="deviceStore.batteryCapacity || '6000mAh'"
              clickable
              @click="showToast('电池容量：6000mAh 大容量长寿电池')"
            />

            <!-- 屏幕 -->
            <ListCell
              title="屏幕"
              :value="deviceStore.screenResolution || '1208x2644'"
              clickable
              @click="showToast('屏幕分辨率：1208 × 2644 超视网膜旗舰屏')"
            />

            <!-- 性能引擎 -->
            <ListCell
              title="性能引擎"
              :value="deviceStore.performanceEngine || 'XGlide 引擎'"
              last
              clickable
              @click="showToast('XGlide 智能图形与系统调度引擎处于最佳状态')"
            />
          </div>

          <!-- ================= 卡片 4: 系统版本与序列号 ================= -->
          <div class="settings-card">
            <!-- Android 版本（三级入口） -->
            <ListCell
              title="Android 版本"
              :value="deviceStore.androidVersion"
              chevron
              clickable
              @click="openSubPage('androidVersion')"
            />

            <!-- 版本号（点击 5 次触发开发者彩蛋） -->
            <ListCell
              title="版本号"
              :value="deviceStore.buildNumber || '17.0.0.038SP01(OP003PF001AZ)FANS'"
              clickable
              @click="handleBuildNumberClick"
            />

            <!-- 硬件版本 -->
            <ListCell
              title="硬件版本"
              :value="deviceStore.hardwareVersion || 'V1.0'"
            />

            <!-- 序列号 -->
            <ListCell
              title="序列号"
              :value="deviceStore.serialNumber || '159467059A001123'"
              last
              clickable
              @click="showToast(`序列号：${deviceStore.serialNumber}`)"
            />
          </div>

          <!-- ================= 卡片 5: 认证与法律信息 ================= -->
          <div class="settings-card">
            <!-- 手机信息（三级入口：状态与 IMEI） -->
            <ListCell
              title="手机信息"
              chevron
              clickable
              @click="openSubPage('status')"
            />
            <!-- 电子保卡（三级入口） -->
            <ListCell
              title="电子保卡"
              chevron
              clickable
              @click="openSubPage('warranty')"
            />
            <!-- 法律信息（三级入口） -->
            <ListCell
              title="法律信息"
              chevron
              clickable
              @click="openSubPage('legal')"
            />
            <ListCell
              title="用户体验改进计划"
              chevron
              last
              clickable
              @click="showToast('已加入用户体验改进计划')"
            />
          </div>

          <!-- 底部安全留白 -->
          <div class="scroll-bottom-spacer"></div>
        </div>
      </div>
    </Transition>

    <!-- 设备名称修改弹窗 -->
    <AboutDeviceNameModal
      v-if="isNameModalOpen"
      :model-value="deviceStore.deviceName"
      @save="handleSaveDeviceName"
      @close="isNameModalOpen = false"
    />

    <!-- 浮层轻提示 (Toast) -->
    <Transition name="toast-fade">
      <div v-if="toastText" class="feedback-toast">
        {{ toastText }}
      </div>
    </Transition>
  </div>
</template>

<style scoped>
@import '../../../styles/layer-transitions.css';

.about-phone-page {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  background: #F4F5F7;
  position: relative;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang SC", "Segoe UI", Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
}

.about-main-container {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* 顶部导航栏 */
.about-nav-bar {
  position: sticky;
  top: 0;
  width: 100%;
  height: calc(var(--safe-top, 0px) + 52px);
  padding: var(--safe-top, 0px) 16px 0 16px;
  display: flex;
  align-items: center;
  background: #F4F5F7;
  z-index: 10;
  box-sizing: border-box;
}

.nav-round-btn {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: none;
  background: #EAECEF;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex: none;
  transition: background 0.15s ease, transform 0.1s ease;
}

.nav-round-btn:active {
  background: #DFE2E6;
  transform: scale(0.96);
}

.nav-title {
  font-size: 20px;
  font-weight: 600;
  color: #111111;
  letter-spacing: -0.3px;
  margin-left: 14px;
}

/* 滚动区域 */
.about-scroll-body {
  flex: 1;
  padding: 12px 16px 32px 16px;
  overflow-y: auto;
  overflow-x: hidden;
  box-sizing: border-box;
  -webkit-overflow-scrolling: touch;
}

/* ================= 卡片 1: XOS 17 品牌横幅卡 ================= */
.xos-banner-card {
  position: relative;
  width: 100%;
  border-radius: 20px;
  overflow: hidden;
  margin-bottom: 14px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  background: #FFFFFF;
}

.xos-banner-bg-wrap {
  width: 100%;
  line-height: 0;
}

.xos-banner-img {
  width: 100%;
  height: auto;
  display: block;
}

.xos-banner-controls {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 22px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.xos-version-label {
  font-size: 14.5px;
  color: #6E737B;
  font-weight: 450;
  letter-spacing: 0.2px;
}

.xos-check-btn {
  height: 38px;
  padding: 0 28px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1.5px solid #0077FF;
  color: #0077FF;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  transition: all 0.15s ease;
}

.xos-check-btn:active {
  background: rgba(0, 119, 255, 0.1);
  transform: scale(0.97);
}

.xos-check-btn.active {
  background: rgba(255, 255, 255, 0.95);
  border-color: #0077FF;
}

.checking-state {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #0077FF;
  font-size: 14px;
}

.checking-spinner {
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* ================= 通用卡片样式 ================= */
.settings-card {
background: #FFFFFF;
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 14px;
}

.cell-title-with-info {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.info-badge-icon {
  flex: none;
  opacity: 0.85;
}

.scroll-bottom-spacer {
  height: 48px;
}

.about-phone-page :deep(.lc-title-col) {
  flex: none;
}

.about-phone-page :deep(.lc-right) {
  min-width: 0;
  flex: 1;
  justify-content: flex-end;
}

.about-phone-page :deep(.lc-value) {
  font-size: 13.5px;
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 浮动轻提示 */
.feedback-toast {
  position: absolute;
  bottom: 50px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(30, 30, 32, 0.92);
  color: #FFFFFF;
  padding: 10px 20px;
  border-radius: 22px;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  z-index: 100;
  white-space: nowrap;
  pointer-events: none;
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
