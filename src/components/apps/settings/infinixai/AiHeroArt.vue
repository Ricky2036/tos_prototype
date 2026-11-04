<script setup>
/**
 * Infinix AI 三级页的头图插画。
 * 真机上是逐页不同的矢量插画（统一语言：细灰描边的手机轮廓 + 一个特征元素）。
 * 这里按同一套语言参数化绘制，保证一组页面视觉一致。
 */
defineProps({
  variant: { type: String, default: 'voice' }
})
</script>

<template>
  <div class="ai-hero-art">
    <svg viewBox="0 0 150 300" width="112" height="224" fill="none" aria-hidden="true">
      <!-- 手机外框 -->
      <rect
        x="1.5" y="1.5" width="147" height="297" rx="26"
        stroke="#B9B9BE" stroke-width="2.5"
      />

      <!-- Fola 语音：待唤醒气泡 -->
      <g v-if="variant === 'voice'">
        <circle cx="104" cy="126" r="20" fill="#DFF3E4" opacity="0.55" />
        <rect x="14" y="140" width="72" height="26" rx="13" fill="#EAF0FB" />
        <text x="30" y="158" font-size="12" fill="#7C9BD1" font-family="-apple-system, sans-serif">Hi, Folax</text>
        <rect x="20" y="258" width="110" height="16" rx="8" stroke="#C9C9CE" stroke-width="1.6" />
        <circle cx="112" cy="266" r="2" fill="#B9B9BE" />
        <circle cx="120" cy="266" r="2" fill="#B9B9BE" />
        <circle cx="20" cy="266" r="2.5" fill="#8FC7FF" />
      </g>

      <!-- Fola 识屏：双指长按 -->
      <g v-else-if="variant === 'screen'">
        <rect x="28" y="60" width="94" height="14" rx="4" fill="#E6E6E9" />
        <rect x="28" y="84" width="46" height="10" rx="4" fill="#EFEFF2" />
        <rect x="28" y="120" width="94" height="60" rx="6" fill="#E9E9EC" />
        <rect x="40" y="150" width="30" height="10" rx="5" fill="#D6D6DB" />
        <rect x="28" y="196" width="94" height="10" rx="4" fill="#EFEFF2" />
        <rect x="28" y="216" width="70" height="10" rx="4" fill="#EFEFF2" />
        <rect x="52" y="132" width="15" height="46" rx="7.5" fill="#FFFFFF" stroke="#D9D9DE" stroke-width="1.5" transform="rotate(-8 59 155)" />
        <rect x="76" y="118" width="15" height="46" rx="7.5" fill="#FFFFFF" stroke="#D9D9DE" stroke-width="1.5" transform="rotate(-8 83 141)" />
      </g>

      <!-- 智慧建议：应用四宫格 -->
      <g v-else-if="variant === 'suggest'">
        <rect x="24" y="70" width="102" height="86" rx="8" fill="#F3F3F5" stroke="#E4E4E8" stroke-width="1.5" />
        <rect x="84" y="58" width="52" height="56" rx="12" fill="#FFFFFF" stroke="#E9E9EC" stroke-width="1.5" />
        <rect x="92" y="66" width="16" height="16" rx="5" fill="#2F6BF6" />
        <rect x="114" y="66" width="16" height="16" rx="5" fill="#2F6BF6" />
        <rect x="92" y="88" width="16" height="16" rx="5" fill="#34C759" />
        <rect x="114" y="88" width="16" height="16" rx="5" fill="#FF9F0A" />
        <g fill="#EFEFF2">
          <rect x="34" y="160" width="18" height="18" rx="5" />
          <rect x="58" y="160" width="18" height="18" rx="5" />
          <rect x="82" y="160" width="18" height="18" rx="5" />
          <rect x="106" y="160" width="18" height="18" rx="5" />
          <rect x="34" y="186" width="18" height="18" rx="5" />
          <rect x="58" y="186" width="18" height="18" rx="5" />
          <rect x="82" y="186" width="18" height="18" rx="5" />
          <rect x="106" y="186" width="18" height="18" rx="5" />
        </g>
      </g>

      <!-- 圈定即搜：手机内的搜索栏 -->
      <g v-else-if="variant === 'circle'">
        <rect x="14" y="60" width="122" height="120" rx="8" fill="#EDEDF0" />
        <rect x="14" y="60" width="122" height="34" rx="8" fill="#FFFFFF" />
        <text x="52" y="82" font-size="11" fill="#8E8E93" font-family="-apple-system, sans-serif">Google</text>
        <rect x="24" y="104" width="86" height="12" rx="6" fill="#FFFFFF" />
        <circle cx="34" cy="110" r="3" fill="#C7C7CC" />
        <circle cx="42" cy="110" r="3" fill="#C7C7CC" />
        <ellipse cx="70" cy="180" rx="60" ry="26" fill="#EDEDF0" opacity="0.9" />
      </g>

      <!-- AI 通话助手：拨号盘 -->
      <g v-else-if="variant === 'call'">
        <rect x="26" y="52" width="98" height="14" rx="7" fill="#EDEDF0" />
        <rect x="26" y="74" width="98" height="14" rx="7" fill="#EDEDF0" />
        <g fill="#EDEDF0">
          <circle cx="46" cy="130" r="14" />
          <circle cx="75" cy="130" r="14" />
          <circle cx="104" cy="130" r="14" />
          <circle cx="46" cy="168" r="14" />
          <circle cx="75" cy="168" r="14" />
          <circle cx="104" cy="168" r="14" />
        </g>
        <circle cx="46" cy="206" r="14" fill="#FF5A5A" />
        <circle cx="75" cy="206" r="14" fill="#EDEDF0" />
        <circle cx="104" cy="206" r="14" fill="#EDEDF0" />
      </g>

      <!-- AI 字幕：语言选择列表 -->
      <g v-else-if="variant === 'subtitle'">
        <rect x="14" y="52" width="122" height="30" rx="6" fill="#F7F7F9" />
        <text x="26" y="72" font-size="10" fill="#8E8E93" font-family="-apple-system, sans-serif">Choose language</text>
        <rect x="100" y="62" width="24" height="12" rx="6" fill="#2F6BF6" />
        <circle cx="120" cy="68" r="4.5" fill="#FFFFFF" />
        <text x="22" y="102" font-size="10" fill="#3C3C43" font-family="-apple-system, sans-serif">Offline mode</text>
        <rect x="22" y="112" width="80" height="6" rx="3" fill="#EFEFF2" />
        <rect x="22" y="124" width="64" height="6" rx="3" fill="#EFEFF2" />
        <text x="22" y="150" font-size="10" fill="#3C3C43" font-family="-apple-system, sans-serif">All languages</text>
        <g fill="#EFEFF2">
          <rect x="22" y="162" width="96" height="8" rx="4" />
          <rect x="22" y="178" width="96" height="8" rx="4" />
          <rect x="22" y="194" width="96" height="8" rx="4" />
          <rect x="22" y="210" width="72" height="8" rx="4" />
        </g>
      </g>

      <!-- 录音摘要：录音列表底栏 -->
      <g v-else-if="variant === 'record'">
        <rect x="22" y="56" width="56" height="12" rx="6" fill="#EDEDF0" />
        <rect x="22" y="76" width="30" height="8" rx="4" fill="#F3F3F5" />
        <g fill="#D8D8DD">
          <circle cx="34" cy="246" r="4" />
          <circle cx="54" cy="246" r="4" />
          <circle cx="74" cy="246" r="4" />
          <circle cx="94" cy="246" r="4" />
        </g>
      </g>

      <!-- AI 录音：AI 键悬浮点 -->
      <g v-else-if="variant === 'aikey'">
        <circle cx="18" cy="146" r="14" fill="#FFFFFF" stroke="#D9D9DE" stroke-width="1.5" />
        <circle cx="18" cy="146" r="5" fill="#E9E9EC" />
      </g>

      <!-- 翻译助手：手指点按输入框 -->
      <g v-else-if="variant === 'translate'">
        <rect x="24" y="62" width="86" height="12" rx="6" fill="#E9E9EC" />
        <rect x="24" y="84" width="60" height="10" rx="5" fill="#EFEFF2" />
        <rect x="24" y="140" width="100" height="44" rx="6" fill="#EDEDF0" />
        <rect x="24" y="200" width="100" height="10" rx="5" fill="#EFEFF2" />
        <rect x="58" y="152" width="15" height="48" rx="7.5" fill="#FFFFFF" stroke="#D9D9DE" stroke-width="1.5" transform="rotate(-8 65 176)" />
        <rect x="82" y="138" width="15" height="48" rx="7.5" fill="#FFFFFF" stroke="#D9D9DE" stroke-width="1.5" transform="rotate(-8 89 162)" />
      </g>

      <!-- 社交助手：视频通话界面 -->
      <g v-else-if="variant === 'social'">
        <rect x="12" y="46" width="126" height="200" rx="12" fill="#DCDCE1" />
        <rect x="24" y="60" width="102" height="172" rx="8" fill="#C9C9D0" />
        <rect x="70" y="118" width="44" height="64" rx="10" fill="#EDEDF0" />
        <g fill="#FFFFFF">
          <circle cx="92" cy="230" r="9" />
          <circle cx="112" cy="230" r="9" />
          <circle cx="52" cy="230" r="9" />
        </g>
        <circle cx="72" cy="230" r="9" fill="#FF5A5A" />
      </g>

      <!-- AI 写作助手：文本 + 写作工具条 -->
      <g v-else-if="variant === 'write'">
        <rect x="22" y="58" width="70" height="12" rx="6" fill="#EDEDF0" />
        <rect x="22" y="80" width="40" height="10" rx="5" fill="#EFEFF2" />
        <rect x="22" y="104" width="106" height="40" rx="6" fill="#EFEFF2" />
        <g fill="#E3E3E8">
          <rect x="22" y="168" width="106" height="8" rx="4" />
          <rect x="22" y="184" width="106" height="8" rx="4" />
          <rect x="22" y="200" width="70" height="8" rx="4" />
        </g>
        <rect x="22" y="222" width="106" height="34" rx="8" fill="#FFFFFF" stroke="#E4E4E8" stroke-width="1.5" />
        <text x="32" y="242" font-size="9" fill="#A6A6AB" font-family="-apple-system, sans-serif">Enter your requirements</text>
      </g>

      <!-- AI 随心主题：照片九宫格 -->
      <g v-else-if="variant === 'theme'">
        <rect x="24" y="52" width="102" height="26" rx="6" fill="#F3F3F5" />
        <g>
          <rect x="24" y="88" width="32" height="32" rx="3" fill="#D9C7B4" />
          <rect x="59" y="88" width="32" height="32" rx="3" fill="#C7D8C0" />
          <rect x="94" y="88" width="32" height="32" rx="3" fill="#BFD3E6" />
          <rect x="24" y="123" width="32" height="32" rx="3" fill="#E6D3C0" />
          <rect x="59" y="123" width="32" height="32" rx="3" fill="#C9DCC4" />
          <rect x="94" y="123" width="32" height="32" rx="3" fill="#C2D6E8" />
          <rect x="24" y="158" width="32" height="32" rx="3" fill="#E8D8C6" />
          <rect x="59" y="158" width="32" height="32" rx="3" fill="#CBDEC6" />
          <rect x="94" y="158" width="32" height="32" rx="3" fill="#C5D8EA" />
        </g>
      </g>

      <!-- 智慧笔记：草图 -->
      <g v-else-if="variant === 'note'">
        <path
          d="M36 150c6-14 10-22 18-22s10 10 16 12 12-6 18-2 4 12-2 16-10 2-14 12-4 20-10 20-8-12-14-16-10-2-12-12 0-8 0-8z"
          stroke="#9C9CA1" stroke-width="1.5" fill="none"
        />
        <g fill="#EDEDF0">
          <circle cx="34" cy="256" r="5" />
          <circle cx="52" cy="256" r="5" />
          <rect x="66" y="246" width="10" height="20" rx="3" />
          <rect x="80" y="246" width="10" height="20" rx="3" />
        </g>
      </g>

      <!-- 文档助手：文档卡片 -->
      <g v-else-if="variant === 'doc'">
        <rect x="18" y="46" width="20" height="200" rx="10" fill="#F3F3F5" />
        <rect x="112" y="46" width="20" height="200" rx="10" fill="#F3F3F5" />
        <rect x="34" y="70" width="82" height="150" rx="10" fill="#FFFFFF" stroke="#E9E9EC" stroke-width="1.5" />
        <rect x="42" y="82" width="66" height="16" rx="8" fill="#F3F3F5" />
        <rect x="46" y="108" width="24" height="24" rx="5" fill="#EDEDF0" />
        <rect x="76" y="108" width="24" height="24" rx="5" fill="#EDEDF0" />
        <g fill="#F0F0F3">
          <rect x="44" y="148" width="62" height="7" rx="3.5" />
          <rect x="44" y="162" width="62" height="7" rx="3.5" />
          <rect x="44" y="176" width="44" height="7" rx="3.5" />
        </g>
      </g>
    </svg>
  </div>
</template>

<style scoped>
.ai-hero-art {
  display: flex;
  justify-content: center;
  padding: 12px 0 4px;
}

.ai-hero-art svg {
  display: block;
}
</style>
