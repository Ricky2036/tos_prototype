import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

test('SettingsCloudBackup.vue matches specification from 云备份原型.html', () => {
  const filePath = path.resolve('src/components/apps/settings/SettingsCloudBackup.vue')
  assert.ok(fs.existsSync(filePath), 'SettingsCloudBackup.vue must exist')
  const content = fs.readFileSync(filePath, 'utf-8')

  // 1. 核心页面栈与导航
  assert.ok(content.includes('pageStack'), 'Must maintain page stack')
  assert.ok(content.includes('currentPage'), 'Must compute current page')
  assert.ok(content.includes('选择备份数据'), 'Must contain 选择备份数据 page')
  assert.ok(content.includes('备份中'), 'Must contain 备份中 page')
  assert.ok(content.includes('备份完成'), 'Must contain 备份完成 page')
  assert.ok(content.includes('自动备份'), 'Must contain 自动备份 page')

  // 2. 7 类备份数据
  assert.ok(content.includes('设置'), 'Must include 设置 data')
  assert.ok(content.includes('系统数据'), 'Must include 系统数据 data')
  assert.ok(content.includes('桌面设置'), 'Must include 桌面设置 data')
  assert.ok(content.includes('通讯录'), 'Must include 通讯录 data')
  assert.ok(content.includes('短信'), 'Must include 短信 data')
  assert.ok(content.includes('应用列表'), 'Must include 应用列表 data')
  assert.ok(content.includes('图库'), 'Must include 图库 data')

  // 3. 状态与手势
  assert.ok(content.includes('onSwipePointerDown'), 'Must support swipe left gesture on backup rows')
  assert.ok(content.includes('cb-del'), 'Must contain delete button on swipe')
  assert.ok(content.includes('cb-ring'), 'Must have circular progress ring in progress page')
  assert.ok(content.includes('立即备份'), 'Must have 立即备份 primary action button')

  // 4. 弹窗与抽屉
  assert.ok(content.includes('activeModal'), 'Must support active modal/sheet management')
  assert.ok(content.includes('云空间权益已到期'), 'Must handle expired scenario sheet')
  assert.ok(content.includes('云空间不足'), 'Must handle no space scenario sheet')
  assert.ok(content.includes('替换当前云备份？'), 'Must handle overwrite confirmation sheet')
  assert.ok(content.includes('删除该'), 'Must handle delete backup confirmation sheet')
})

test('SettingsCloudHome.vue matches reference specification from Infinix Cloud.mp4', () => {
  const filePath = path.resolve('src/components/apps/settings/SettingsCloudHome.vue')
  assert.ok(fs.existsSync(filePath), 'SettingsCloudHome.vue must exist')
  const content = fs.readFileSync(filePath, 'utf-8')

  // 1. 用户信息与空间
  assert.ok(content.includes('Ricky'), 'Must display Ricky user title')
  assert.ok(content.includes('会员服务'), 'Must display 会员服务')
  assert.ok(content.includes('23.37 MB'), 'Must display 23.37 MB used space')
  assert.ok(content.includes('40 GB'), 'Must display 40 GB total space')

  // 2. 云盘大卡片
  assert.ok(content.includes('云盘'), 'Must display 云盘 card')
  assert.ok(content.includes('节省存储空间。'), 'Must display 节省存储空间 subtitle')

  // 3. 服务网格与展开折叠
  assert.ok(content.includes('服务'), 'Must have 服务 section header')
  assert.ok(content.includes('谷歌相册'), 'Must include 谷歌相册')
  assert.ok(content.includes('共享相册'), 'Must include 共享相册')
  assert.ok(content.includes('盗抢保护'), 'Must include 盗抢保护')
  assert.ok(content.includes('Folax'), 'Must include Folax')
  assert.ok(content.includes('Wi-Fi 钥匙'), 'Must include Wi-Fi 钥匙')
  assert.ok(content.includes('备份'), 'Must include 备份')
  assert.ok(content.includes('2 TB'), 'Must display 2 TB badge on 备份 card')
  assert.ok(content.includes('免费保留 30 天。'), 'Must display 免费保留 30 天 subtitle')
  assert.ok(content.includes('Visha播放器'), 'Must include Visha播放器')
  assert.ok(content.includes('isServicesExpanded'), 'Must support expand/collapse services state')

  // 4. 使用云的应用列表
  assert.ok(content.includes('使用云的应用'), 'Must have 使用云的应用 section header')
  assert.ok(content.includes('联系人'), 'Must include 联系人')
  assert.ok(content.includes('短信'), 'Must include 短信')
  assert.ok(content.includes('记事本'), 'Must include 记事本')
  assert.ok(content.includes('录音机'), 'Must include 录音机')
  assert.ok(content.includes('日历'), 'Must include 日历')
  assert.ok(content.includes('WLAN'), 'Must include WLAN')
  assert.ok(content.includes('toggleAllApps'), 'Must support 一键开启 batch toggle')

  // 5. 底部外链
  assert.ok(content.includes('infinix-cloud.palm.tech'), 'Must include official cloud web management link')
})

test('SettingsAccount.vue and SettingsApp.vue integrate Cloud and Backup entries properly', () => {
  const accountContent = fs.readFileSync(path.resolve('src/components/apps/settings/SettingsAccount.vue'), 'utf-8')
  assert.ok(accountContent.includes("emit('open-cloud')"), 'Must emit open-cloud on Infinix Cloud card click')
  assert.ok(accountContent.includes("emit('open-backup')"), 'Must emit open-backup on 云备份 row click')
  assert.ok(accountContent.includes('云备份'), 'Must render 云备份 title in account page')

  const appContent = fs.readFileSync(path.resolve('src/components/apps/settings/SettingsApp.vue'), 'utf-8')
  assert.ok(appContent.includes("import SettingsCloudHome from './SettingsCloudHome.vue'"), 'Must import SettingsCloudHome')
  assert.ok(appContent.includes("import SettingsCloudBackup from './SettingsCloudBackup.vue'"), 'Must import SettingsCloudBackup')
  assert.ok(appContent.includes("cloudHome: '云服务'"), 'Must register cloudHome view title')
  assert.ok(appContent.includes("cloudBackup: '云备份'"), 'Must register cloudBackup view title')
  assert.ok(appContent.includes("view === 'cloudHome'"), 'Must render cloudHome view')
  assert.ok(appContent.includes("view === 'cloudBackup'"), 'Must render cloudBackup view')
})
