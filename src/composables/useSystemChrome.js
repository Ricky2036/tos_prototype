import { onMounted, onBeforeUnmount, watch, isRef } from 'vue'
import { useSystemStore } from '../stores/systemStore'

/**
 * 允许组件/页面动态声明其所需的状态栏与底部导航栏反色/主题风格 (Light/Dark chrome)。
 * @param {'light' | 'dark' | null | import('vue').Ref<'light' | 'dark' | null>} style
 *   - 'light': 浅色文字/白色图标/白色导航条（适用于深色、黑色背景页面）
 *   - 'dark': 深色文字/黑色图标/深色导航条（适用于浅色、白色背景页面）
 *   - null: 恢复系统/应用默认规则
 */
export function useSystemChrome(style = 'light') {
  const system = useSystemStore()

  function apply(val) {
    system.setChromeStyle(val)
  }

  onMounted(() => {
    apply(isRef(style) ? style.value : style)
  })

  if (isRef(style)) {
    watch(style, (val) => {
      apply(val)
    })
  }

  onBeforeUnmount(() => {
    system.setChromeStyle(null)
  })

  return {
    setChromeStyle: (val) => apply(val)
  }
}
