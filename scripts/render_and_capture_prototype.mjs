import { createRuntime } from '../tests/helpers/vueRuntime.mjs'
import fs from 'fs'
import path from 'path'

const OUT_DIR = '.local-evidence/prototype_verification'
fs.mkdirSync(OUT_DIR, { recursive: true })

async function main() {
  console.log('Mounting components and capturing screenshots...')
  const rt = await createRuntime()

  // 1. 系统设置首页
  const sysId = await rt.mount('/src/components/apps/settings/system/SettingsSystem.vue')
  // Screenshot the host
  const page = rt.page
  await page.screenshot({ path: path.join(OUT_DIR, '00_prototype_system_root.png') })
  console.log('Saved 00_prototype_system_root.png')

  // 2. 点击系统导航
  await rt.click(sysId, '[data-system-row="systemNavigation"]', 300)
  await page.screenshot({ path: path.join(OUT_DIR, '01_prototype_nav_gesture.png') })
  console.log('Saved 01_prototype_nav_gesture.png')

  // 切换到三键导航
  await rt.click(sysId, '[data-test="nav-mode-three-button"]', 300)
  await page.screenshot({ path: path.join(OUT_DIR, '01_prototype_nav_three_btn.png') })
  console.log('Saved 01_prototype_nav_three_btn.png')

  // 卸载系统主页
  await rt.unmount(sysId)

  // 3. 日期与时间
  const dtId = await rt.mount('/src/components/apps/settings/dateTime/SettingsDateTime.vue')
  await page.screenshot({ path: path.join(OUT_DIR, '02_prototype_datetime_root.png') })
  console.log('Saved 02_prototype_datetime_root.png')

  // 点击常驻地弹窗
  await rt.click(dtId, '[data-dt-row="residence"]', 300)
  await page.screenshot({ path: path.join(OUT_DIR, '02_prototype_datetime_residence_modal.png') })
  console.log('Saved 02_prototype_datetime_residence_modal.png')

  // 点击遮罩或关闭按钮关闭常驻地弹窗
  await rt.click(dtId, '.picker-close-btn', 300)

  // 点击双时钟显示位置弹窗
  await rt.click(dtId, '[data-dt-row="dualClockPosition"]', 300)
  await page.screenshot({ path: path.join(OUT_DIR, '02_prototype_datetime_dual_clock_modal.png') })
  console.log('Saved 02_prototype_datetime_dual_clock_modal.png')

  // 关闭
  await rt.click(dtId, '.picker-close-btn', 300)

  // 关闭自动时间，唤起日期选择器
  await rt.click(dtId, '[data-dt-row="autoTime"] .toggle-switch', 300)
  await rt.click(dtId, '[data-dt-row="date"]', 300)
  await page.screenshot({ path: path.join(OUT_DIR, '02_prototype_datetime_date_picker.png') })
  console.log('Saved 02_prototype_datetime_date_picker.png')

  // 点击取消按钮关闭日期选择器，唤起时间选择器
  await rt.click(dtId, '.dps-cancel', 300)
  await rt.click(dtId, '[data-dt-row="time"]', 300)
  await page.screenshot({ path: path.join(OUT_DIR, '02_prototype_datetime_time_picker.png') })
  console.log('Saved 02_prototype_datetime_time_picker.png')
  await rt.unmount(dtId)

  // 4. 定时开关机与重启
  const spId = await rt.mount('/src/components/apps/settings/system/subpages/SystemSchedulePower.vue')
  await page.screenshot({ path: path.join(OUT_DIR, '03_prototype_schedule_power_root.png') })
  console.log('Saved 03_prototype_schedule_power_root.png')

  // 点击定时开机进入二级编辑页
  await rt.click(spId, '[data-test="schedule-card-on"]', 300)
  await page.screenshot({ path: path.join(OUT_DIR, '03_prototype_schedule_power_edit.png') })
  console.log('Saved 03_prototype_schedule_power_edit.png')
  await rt.unmount(spId)

  // 5. 语言与输入法
  const langId = await rt.mount('/src/components/apps/settings/system/subpages/SystemLanguage.vue')
  await page.screenshot({ path: path.join(OUT_DIR, '04_prototype_language_root.png') })
  console.log('Saved 04_prototype_language_root.png')
  await rt.unmount(langId)

  await rt.close()
  console.log('All prototype screenshots captured successfully!')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
