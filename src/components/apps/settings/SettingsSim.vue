<script setup>
import { ref } from 'vue'
import ListCell from '../../ui/ListCell.vue'
import ToggleSwitch from '../../ui/ToggleSwitch.vue'
import SettingsSystemIcon from '../../ui/SettingsSystemIcon.vue'

const emit = defineEmits(['back'])

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

// 状态开关
const esimEnabled = ref(false)
const mobileData = ref(true)
const network5g = ref(true)

// 卡选择
const dataCard = ref('中国电信')
const callCard = ref('中国电信')

function toggleDataCard() {
  showToast('当前仅插入一张实体 SIM 卡（中国电信）')
}

function toggleCallCard() {
  showToast('当前仅插入一张实体 SIM 卡（中国电信）')
}

function back() {
  emit('back')
  return true
}

defineExpose({ back })
</script>

<template>
  <div class="settings-sim-page">
    <!-- 顶部导航栏 -->
    <div class="sim-nav-bar">
      <button class="nav-round-btn" aria-label="返回" data-nav-back @click="emit('back')">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M19 12H5M5 12L12 5M5 12L12 19" stroke="#1C1C1E" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <div class="nav-title">SIM 卡与网络设置</div>
    </div>

    <!-- 滚动区域 -->
    <div class="sim-scroll-body scrollable">
      <!-- 头部特性大卡片 -->
      <div class="sim-feature-card">
        <div class="sim-feature-icon-wrap">
          <SettingsSystemIcon name="sim" :size="32" />
        </div>
        <div class="sim-feature-title">SIM 卡与网络设置</div>
        <div class="sim-feature-desc">了解数据用量，设定数据限制，并管理运营商设置。</div>
      </div>

      <!-- 分组 1: SIM 卡 -->
      <div class="group-label">SIM 卡</div>
      <div class="settings-card">
        <ListCell
          title="中国电信"
          value="+86 181 3884 8993"
          chevron
          clickable
          @click="showToast('中国电信：5G 信号强，通话与数据就绪')"
        />
        <ListCell
          title="SIM 卡 2"
          value="无 SIM 卡"
          chevron
          last
          clickable
          @click="showToast('SIM 卡槽 2 未检测到 SIM 卡')"
        />
      </div>

      <!-- 分组 2: 启用 eSIM -->
      <div class="group-label">启用eSIM</div>
      <div class="settings-card">
        <ListCell
          title="启用eSIM"
          subtitle="开启 eSIM 后，实体 SIM 卡 2 将暂不可用。"
          last
        >
          <template #right>
            <ToggleSwitch v-model="esimEnabled" @change="showToast(esimEnabled ? '正在搜索可用 eSIM 配置文件' : '已停用 eSIM')" />
          </template>
        </ListCell>
      </div>

      <!-- 卡槽选择（上网卡与拨号卡） -->
      <div class="settings-card">
        <ListCell
          title="上网卡"
          clickable
          @click="toggleDataCard"
        >
          <template #right>
            <div class="selector-value-wrap">
              <span class="selector-value-text">{{ dataCard }}</span>
              <svg width="12" height="14" viewBox="0 0 12 14" fill="none">
                <path d="M3 5l3-3 3 3M3 9l3 3 3-3" stroke="#8E8E93" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </template>
        </ListCell>
        <ListCell
          title="拨号卡"
          last
          clickable
          @click="toggleCallCard"
        >
          <template #right>
            <div class="selector-value-wrap">
              <span class="selector-value-text">{{ callCard }}</span>
              <svg width="12" height="14" viewBox="0 0 12 14" fill="none">
                <path d="M3 5l3-3 3 3M3 9l3 3 3-3" stroke="#8E8E93" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </template>
        </ListCell>
      </div>

      <!-- 数据与 5G 常用开关 -->
      <div class="settings-card">
        <ListCell
          title="移动数据"
          subtitle="通过移动网络访问数据。"
        >
          <template #right>
            <ToggleSwitch v-model="mobileData" @change="showToast(mobileData ? '已开启移动网络数据' : '已关闭移动数据')" />
          </template>
        </ListCell>
        <ListCell
          title="5G 网络"
          subtitle="允许默认上网卡使用 5G 网络。"
          last
        >
          <template #right>
            <ToggleSwitch v-model="network5g" @change="showToast(network5g ? '已启用 5G 双模极速网络' : '已切换为 4G/3G 节能网络')" />
          </template>
        </ListCell>
      </div>

      <!-- 通讯辅助与网络管理 -->
      <div class="settings-card">
        <ListCell
          title="无网通讯"
          chevron
          clickable
          @click="showToast('无网通讯：支持短距离自组网与应急直连')"
        />
        <ListCell
          title="流量管理"
          chevron
          clickable
          @click="showToast('本月已使用 12.8 GB，剩余 37.2 GB')"
        />
        <ListCell
          title="网络优化"
          chevron
          clickable
          @click="showToast('双通道加速已开启，智能无感切网已就绪')"
        />
        <ListCell
          title="国际上网"
          subtitle="无需实体 SIM 卡，购买国际流量套餐即可境外上网。"
          chevron
          clickable
          @click="showToast('国际上网漫游商城')"
        />
        <ListCell
          title="更多设置"
          chevron
          last
          clickable
          @click="showToast('APN 与网络运营商手动选择')"
        />
      </div>

      <!-- 底部卡片：你可能想找 -->
      <div class="settings-card help-search-card">
        <div class="help-search-title">你可能想找</div>
        <div class="help-links-list">
          <div class="help-link-item" @click="showToast('跳转通话设置')">通话设置</div>
          <div class="help-link-item" @click="showToast('跳转短信设置')">短信设置</div>
        </div>
      </div>

      <div class="scroll-bottom-spacer"></div>
    </div>

    <!-- 浮层轻提示 (Toast) -->
    <Transition name="toast-fade">
      <div v-if="toastText" class="feedback-toast">
        {{ toastText }}
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.settings-sim-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #F4F5F7;
  position: relative;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang SC", "Segoe UI", Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
}

/* 顶部导航栏 */
.sim-nav-bar {
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
.sim-scroll-body {
  flex: 1;
  padding: 12px 16px 32px 16px;
  overflow-y: auto;
  overflow-x: hidden;
  box-sizing: border-box;
  -webkit-overflow-scrolling: touch;
}

/* 头部特性大卡片 */
.sim-feature-card {
  background: #FFFFFF;
  border-radius: 20px;
  padding: 26px 20px 22px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
}

.sim-feature-icon-wrap {
  width: 60px;
  height: 60px;
  border-radius: 18px;
  background: #34C759;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 14px;
  box-shadow: 0 4px 12px rgba(52, 199, 89, 0.25);
}

.sim-feature-title {
  font-size: 18px;
  font-weight: 600;
  color: #111111;
  margin-bottom: 8px;
}

.sim-feature-desc {
  font-size: 13.5px;
  color: #8E8E93;
  line-height: 1.45;
  max-width: 290px;
}

/* 分组标题 */
.group-label {
  font-size: 13.5px;
  font-weight: 450;
  color: #8E8E93;
  margin-left: 12px;
  margin-bottom: 8px;
}

/* 通用卡片 */
.settings-card {
  background: #FFFFFF;
  border-radius: 20px;
  margin-bottom: 14px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
}

.selector-value-wrap {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.selector-value-text {
  font-size: 14.5px;
  color: #8E8E93;
}

/* 底部你可能想找卡片 */
.help-search-card {
  padding: 16px 20px 18px 20px;
}

.help-search-title {
  font-size: 13.5px;
  color: #8E8E93;
  margin-bottom: 12px;
}

.help-links-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.help-link-item {
  font-size: 15px;
  color: #0077FF;
  font-weight: 450;
  cursor: pointer;
}

.help-link-item:active {
  opacity: 0.7;
}

.scroll-bottom-spacer {
  height: 48px;
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
