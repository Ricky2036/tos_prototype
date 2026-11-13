<script setup>
import SubPageShell from '../subpage/SubPageShell.vue'
import ListCell from '../../../ui/ListCell.vue'
import AccPending from './AccPending.vue'
import { ref } from 'vue'
import './acc.css'

/**
 * 无障碍（真机 com.android.settings SubSettings，AOSP 无障碍服务列表页）
 * 分组「已下载的应用」，每行 = 应用图标 + 名称 + 值「已关闭」+ chevron；
 * TalkBack / UU 远程键盘 / 哔哩哔哩 带「受限/朗读」说明，声音通知 / 实时转写带功能说明。
 * unknown：每行点开后是各服务自己的配置页（第三方无障碍服务，涉及权限），本轮不点不猜；
 *          声音通知 / 实时转写 的两行右侧控件形态在截图里被裁掉，未采。
 */
const emit = defineEmits(['back'])

const SERVICES = [
  { name: '自动点击器 PRO', value: '已关闭', color: '#F2C230', text: '自' },
  { name: 'App Center Auto Install (Recommend)', value: '已关闭', color: '#E8574A', text: 'P' },
  { name: 'Folax', value: '已关闭', color: '#8E8CF0', text: 'F' },
  { name: 'Hi Translate', value: '已关闭', color: '#4AA3E8', text: 'T' },
  { name: 'TalkBack', value: '已关闭', color: '#5B4FD6', text: '话', subtitle: '通过屏幕阅读器让系统大声朗读内容' },
  { name: 'UU远程键盘外设', value: '已关闭', color: '#4FC3E8', text: 'U', subtitle: '因系统安全设置受限' },
  { name: '哔哩哔哩', value: '已关闭', color: '#F06292', text: '哔', subtitle: '因系统安全设置受限' },
  { name: '声音通知', color: '#34A853', text: '音', subtitle: '接收关于重要声音的通知' },
  { name: '实时转写', color: '#2FA84F', text: '转', subtitle: '实时将语音转换为文字' },
  { name: '小红书', value: '已关闭', color: '#E8443A', text: '红' }
]

const pending = ref('')
</script>

<template>
  <AccPending
    v-if="pending"
    :title="pending"
    reason="该页是无障碍服务自身的配置页（第三方服务），涉及系统权限，本轮只做只读导航、不点开复刻。"
    @back="pending = ''"
  />
  <SubPageShell v-else title="无障碍" @back="emit('back')">
    <div class="acc-page">
      <div class="acc-group-title">已下载的应用</div>
      <div class="acc-card" data-testid="a11y-services">
        <ListCell
          v-for="(s, i) in SERVICES"
          :key="s.name"
          :title="s.name"
          :subtitle="s.subtitle || ''"
          :value="s.value || ''"
          chevron
          :last="i === SERVICES.length - 1"
          @click="pending = s.name"
        >
          <template #icon>
            <div class="acc-service-icon" :style="{ background: s.color }">{{ s.text }}</div>
          </template>
        </ListCell>
      </div>
    </div>
  </SubPageShell>
</template>

<style scoped>
.acc-service-icon {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 15px;
  font-weight: 500;
  flex: none;
  margin-right: 12px;
}
</style>
