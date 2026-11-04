import test from 'node:test'
import assert from 'node:assert/strict'
import { useSubPageNav } from '../src/composables/useSubPageNav.js'

test('useSubPageNav manages subpage navigation stack and transition direction correctly', () => {
  const nav = useSubPageNav('main')

  // 初始状态
  assert.equal(nav.activeSubView.value, 'main')
  assert.equal(nav.isBack.value, false)
  assert.deepEqual(nav.stack.value, ['main'])

  // 1. 前进推入二级/三级页面
  nav.openSubView('detail')
  assert.equal(nav.activeSubView.value, 'detail')
  assert.equal(nav.isBack.value, false)
  assert.deepEqual(nav.stack.value, ['main', 'detail'])

  // 重复进入同名页面被忽略
  nav.openSubView('detail')
  assert.equal(nav.stack.value.length, 2)

  // 进入更深层级页面
  nav.openSubView('advanced')
  assert.equal(nav.activeSubView.value, 'advanced')
  assert.equal(nav.isBack.value, false)
  assert.deepEqual(nav.stack.value, ['main', 'detail', 'advanced'])

  // 2. 逐层返回
  const handled1 = nav.closeSubView()
  assert.equal(handled1, true)
  assert.equal(nav.activeSubView.value, 'detail')
  assert.equal(nav.isBack.value, true)
  assert.deepEqual(nav.stack.value, ['main', 'detail'])

  const handled2 = nav.closeSubView()
  assert.equal(handled2, true)
  assert.equal(nav.activeSubView.value, 'main')
  assert.equal(nav.isBack.value, true)
  assert.deepEqual(nav.stack.value, ['main'])

  // 在根视图无法继续消费返回
  const handled3 = nav.closeSubView()
  assert.equal(handled3, false)
  assert.equal(nav.activeSubView.value, 'main')

  // 3. 兼容属性赋值 activeSubView.value = 'x'
  nav.activeSubView.value = 'config'
  assert.equal(nav.activeSubView.value, 'config')
  assert.equal(nav.isBack.value, false)
  assert.deepEqual(nav.stack.value, ['main', 'config'])

  nav.activeSubView.value = 'main'
  assert.equal(nav.activeSubView.value, 'main')
  assert.equal(nav.isBack.value, true)
  assert.deepEqual(nav.stack.value, ['main'])

  // 4. 重置回根视图
  nav.openSubView('page1')
  nav.openSubView('page2')
  nav.resetToMain()
  assert.equal(nav.activeSubView.value, 'main')
  assert.equal(nav.isBack.value, true)
  assert.deepEqual(nav.stack.value, ['main'])
})
