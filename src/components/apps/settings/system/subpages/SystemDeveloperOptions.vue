<script setup>
/**
 * 开发者选项 · 真机实测版（com.android.settings）
 * =================================================
 * 真实证据：.local-evidence/SET-SYS-01/device/real_developer_options.xml
 * 项：
 *   - 使用“开发者选项”（总开关）
 *   - 内存（内存分析功能已停用。）
 *   - 错误报告
 *   - 桌面备份密码
 *   - 不锁定屏幕（充电时屏幕不会休眠。）
 *   - OEM 解锁
 *   - 正在运行的服务
 *   - WebView 实现
 *   - 自动系统更新
 *   - USB 调试
 */
import { ref } from 'vue'
import SubPageShell from '../../subpage/SubPageShell.vue'
import ListCell from '../../../../ui/ListCell.vue'
import ToggleSwitch from '../../../../ui/ToggleSwitch.vue'
import { useSystemSettingsStore } from '../../../../../stores/systemSettingsStore.js'

const emit = defineEmits(['back'])
const store = useSystemSettingsStore()

const keepAwake = ref(false)
const oemUnlock = ref(false)
const autoUpdate = ref(true)
const tipMsg = ref('')

function showTip(msg) {
  tipMsg.value = msg
  setTimeout(() => { tipMsg.value = '' }, 2000)
}
</script>

<template>
  <SubPageShell title="开发者选项" data-test="subpage-dev" @back="emit('back')">
    <div class="dev-container">
      <!-- 总开关卡片 -->
      <div class="settings-card master-card">
        <ListCell
          title='使用“开发者选项”'
          :subtitle="store.developerOptionsEnabled ? '开启中' : '已停用'"
          last
        >
          <template #right>
            <ToggleSwitch
              data-test="toggle-dev-master"
              :model-value="store.developerOptionsEnabled"
              @update:model-value="store.setDeveloperOptionsEnabled"
            />
          </template>
        </ListCell>
      </div>

      <template v-if="store.developerOptionsEnabled">
        <!-- 调试与系统选项卡片 -->
        <div class="section-title">系统与调试</div>
        <div class="settings-card">
          <ListCell
            title="内存"
            subtitle="内存分析功能已停用。"
            chevron
            @click="showTip('内存分析')"
          />
          <ListCell
            title="错误报告"
            chevron
            @click="showTip('生成错误报告')"
          />
          <ListCell
            title="桌面备份密码"
            subtitle="桌面完整备份当前未设置密码保护。"
            chevron
            @click="showTip('设置桌面备份密码')"
          />
          <ListCell
            title="不锁定屏幕"
            subtitle="充电时屏幕不会休眠。"
          >
            <template #right>
              <ToggleSwitch
                :model-value="keepAwake"
                @update:model-value="keepAwake = $event"
              />
            </template>
          </ListCell>
          <ListCell
            title="OEM 解锁"
            subtitle="允许通过本机账号验证解锁 bootloader。"
          >
            <template #right>
              <ToggleSwitch
                :model-value="oemUnlock"
                @update:model-value="oemUnlock = $event"
              />
            </template>
          </ListCell>
          <ListCell
            title="正在运行的服务"
            subtitle="查看和控制当前正在运行的服务。"
            chevron
            @click="showTip('查看运行中的服务')"
          />
          <ListCell
            title="WebView 实现"
            subtitle="Android System WebView"
            chevron
            @click="showTip('WebView 配置')"
          />
          <ListCell
            title="自动系统更新"
            subtitle="重启设备时应用更新。"
          >
            <template #right>
              <ToggleSwitch
                :model-value="autoUpdate"
                @update:model-value="autoUpdate = $event"
              />
            </template>
          </ListCell>
          <ListCell
            title="USB 调试"
            subtitle="连接 USB 时启用调试模式"
            last
          >
            <template #right>
              <ToggleSwitch
                data-test="toggle-usb-debug"
                :model-value="store.usbDebugging"
                @update:model-value="store.setUsbDebugging"
              />
            </template>
          </ListCell>
        </div>
      </template>

      <div v-if="tipMsg" class="toast-tip">{{ tipMsg }}</div>
    </div>
  </SubPageShell>
</template>

<style scoped>
.dev-container {
  padding: 12px 0 32px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.section-title {
  font-size: 13px;
  font-weight: 500;
  color: #6B7280;
  padding: 8px 16px 2px;
}
.toast-tip {
  position: fixed;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(17, 24, 39, 0.88);
  color: #FFFFFF;
  padding: 10px 20px;
  border-radius: 20px;
  font-size: 13px;
  z-index: 1000;
}
</style>
