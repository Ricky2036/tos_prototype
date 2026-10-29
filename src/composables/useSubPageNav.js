import { ref, computed } from 'vue'

/**
 * 移动端多层级导航与切换状态管理器
 *
 * 规范化管理子页面路由栈与进退方向标识（isBack），
 * 与 `layer-transitions.css` 配合提供标准的前进（Push）与滑回（Pop）层级切换动效。
 *
 * @param {string} initialView 初始根视图标识，默认为 'main'
 */
export function useSubPageNav(initialView = 'main') {
  const stack = ref([initialView])
  const isBack = ref(false)

  const activeSubView = computed({
    get: () => stack.value[stack.value.length - 1] || initialView,
    set: (v) => {
      if (v === initialView) {
        if (stack.value.length > 1) {
          isBack.value = true
          stack.value.pop()
        } else {
          stack.value = [initialView]
        }
      } else {
        isBack.value = false
        if (stack.value[stack.value.length - 1] !== v) {
          stack.value.push(v)
        }
      }
    }
  })

  /**
   * 进入深层级菜单（前进动效）
   * @param {string} targetView 目标子页面标识
   */
  function openSubView(targetView) {
    if (activeSubView.value === targetView) return
    isBack.value = false
    stack.value.push(targetView)
  }

  /**
   * 退出当前层级返回上一级（后退动效）
   * @returns {boolean} 是否成功消费了返回栈
   */
  function closeSubView() {
    if (stack.value.length > 1) {
      isBack.value = true
      stack.value.pop()
      return true
    }
    return false
  }

  /**
   * 重置回根视图
   */
  function resetToMain() {
    isBack.value = true
    stack.value = [initialView]
  }

  return {
    stack,
    activeSubView,
    isBack,
    openSubView,
    closeSubView,
    resetToMain
  }
}
