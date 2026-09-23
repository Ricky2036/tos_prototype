<script setup>
import { computed } from 'vue'
import { LUCIDE } from '../../assets/icons/lucide'

/**
 * Lucide 图标渲染器：内联 SVG（stroke=currentColor），尺寸/描边粗细可调。
 * <LIcon name="wifi" :size="20" :stroke-width="2" class="text-white" />
 */
const props = defineProps({
  name: { type: String, required: true },
  size: { type: [Number, String], default: 20 },
  strokeWidth: { type: [Number, String], default: 2 },
  filled: { type: Boolean, default: false }, // fill=currentColor（播放键等需要填充的场景）
  /**
   * 手绘图标（如 volume2）把颜色写死在路径上（fill="#258FFF"），只换 fill="white" 是不够的。
   * mono=true 会把所有 fill="#RRGGBB[AA]" 一并换成 currentColor ⇒ 图标真正跟随 `color`。
   * 默认 false：其它调用点（CC 竖滑块等）保持原样，不产生视觉回归。
   */
  mono: { type: Boolean, default: false }
})

let lIconUidSeq = 0
const instanceUid = ++lIconUidSeq

const html = computed(() => {
  let svg = LUCIDE[props.name] || ''
  if (!svg) return ''
  // 仅替换根 <svg> 标签的 width 和 height，避免误伤内部 <rect width="...">
  svg = svg.replace(/<svg\b[^>]*>/i, (match) => {
    let m = match
    if (/width="[^"]*"/.test(m)) m = m.replace(/width="[^"]*"/, `width="${props.size}"`)
    else m = m.replace('<svg', `<svg width="${props.size}"`)
    if (/height="[^"]*"/.test(m)) m = m.replace(/height="[^"]*"/, `height="${props.size}"`)
    else m = m.replace('<svg', `<svg height="${props.size}"`)
    if (/stroke-width="[^"]*"/.test(m)) m = m.replace(/stroke-width="[^"]*"/, `stroke-width="${props.strokeWidth}"`)
    return m
  })
  // 为内联 SVG 内部的 <mask id="..."> / <linearGradient id="..."> 追加实例唯一后缀，
  // 避免同一页面渲染多个相同图标（如控制中心网格与编辑抽屉）时发生 DOM ID 冲突导致掩膜失效空白
  if (svg.includes('id="')) {
    svg = svg
      .replace(/\bid="([^"]+)"/g, `id="$1-${instanceUid}"`)
      .replace(/url\(#([^)]+)\)/g, `url(#$1-${instanceUid})`)
  }
  if (props.filled) {
    svg = svg.replace(/fill="none"/, 'fill="currentColor"')
  }
  // 将硬编码的 fill="white" / stroke="white" 替换为 currentColor，使图标支持颜色染色
  svg = svg.replace(/fill="white"/g, 'fill="currentColor"').replace(/stroke="white"/g, 'stroke="currentColor"')
  if (props.mono) svg = svg.replace(/fill="#[0-9a-fA-F]{3,8}"/g, 'fill="currentColor"')
  return svg
})
</script>

<template>
  <span class="l-icon" v-html="html"></span>
</template>

<style scoped>
.l-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  line-height: 0;
}
.l-icon :deep(svg) {
  display: block;
  flex: none;
}
</style>
