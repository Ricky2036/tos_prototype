import { computed, ref } from 'vue'
import { GROUP3_ENTRY_MAP, getGroup3Page } from './pages.js'

/**
 * 第三组卡片二级页的三级/四级页导航栈。
 *
 * 四个二级页（密码与安全 / 权限与隐私 / 应用管理 / 位置信息）共用这一份，
 * 保证：① 入口 key 只能来自 `GROUP3_ENTRY_MAP`；② 侧滑返回先逐层消费子页；
 * ③ 前进/后退分别走 `layer-slide` / `layer-slide-back`（全仓统一转场）。
 */
export function useGroup3Nav(section) {
  const stack = ref([])
  const isBack = ref(false)
  const current = computed(() => stack.value[stack.value.length - 1] || null)
  const transitionName = computed(() => (isBack.value ? 'layer-slide-back' : 'layer-slide'))

  /** 从二级页的行进入（entryKey 是接线表里的语义键） */
  function open(entryKey) {
    const key = GROUP3_ENTRY_MAP[section]?.[entryKey] || (getGroup3Page(entryKey) ? entryKey : null)
    if (!key) return false
    isBack.value = false
    stack.value.push({ key, title: '' })
    return true
  }

  /** 从三级页内部再进一层（四级页），key 直接是配置表里的页面键 */
  function openKey(key, title = '') {
    if (!getGroup3Page(key)) return false
    isBack.value = false
    stack.value.push({ key, title })
    return true
  }

  function close() {
    if (!stack.value.length) return
    isBack.value = true
    stack.value.pop()
  }

  /** 返回 true = 已被子页消费，二级页不要再 emit('back') */
  function consumeBack() {
    if (!stack.value.length) return false
    close()
    return true
  }

  function onNavigate(payload) {
    if (typeof payload === 'string') return openKey(payload)
    return openKey(payload?.key, payload?.title || '')
  }

  return { stack, current, isBack, transitionName, open, openKey, close, consumeBack, onNavigate }
}
