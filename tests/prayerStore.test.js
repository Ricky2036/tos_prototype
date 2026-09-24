import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { resolveCurrentIslandPrayer } from '../src/utils/prayerIsland.js'

test('closing a prayer island suppresses the same prayer fallback', () => {
  const fajr = { id: 'fajr', enabled: true }
  assert.equal(resolveCurrentIslandPrayer({
    masterEnabled: true,
    simulatedPrayerId: null,
    dismissedPrayerId: 'fajr',
    activePrayer: null,
    userMode: 'muslim',
    prayers: [fajr]
  }), null)
})

test('a different prayer can appear after the dismissed prayer', () => {
  const dhuhr = { id: 'dhuhr', enabled: true }
  assert.equal(resolveCurrentIslandPrayer({
    masterEnabled: true,
    simulatedPrayerId: 'dhuhr',
    dismissedPrayerId: 'fajr',
    activePrayer: null,
    userMode: 'normal',
    prayers: [dhuhr]
  }), dhuhr)
})

test('prayer and media dynamic island default to closed / inactive state', () => {
  const compPathPrayer = new URL('../src/stores/prayerStore.js', import.meta.url)
  const contentPrayer = fs.readFileSync(compPathPrayer, 'utf8')
  assert.match(contentPrayer, /simulatedPrayerId:\s*null/, 'Prayer simulatedPrayerId must default to null')

  const compPathControl = new URL('../src/stores/controlStore.js', import.meta.url)
  const contentControl = fs.readFileSync(compPathControl, 'utf8')
  assert.match(contentControl, /mediaPlaying:\s*false/, 'ControlStore mediaPlaying must default to false')
  assert.match(contentControl, /mediaActive:\s*false/, 'ControlStore mediaActive must default to false')
})

test('prayerStore includes jumuah preset (12:30 to 13:45) and localized names in zh, en, and bn', async () => {
  const { setActivePinia, createPinia } = await import('pinia')
  const { usePrayerStore } = await import('../src/stores/prayerStore.js')
  const { useI18nStore } = await import('../src/stores/i18nStore.js')

  setActivePinia(createPinia())
  const prayerStore = usePrayerStore()
  const i18nStore = useI18nStore()

  assert.equal(prayerStore.masterEnabled, false, 'Prayer Mode masterEnabled must default to false')

  const dhuhr = prayerStore.prayers.find((p) => p.id === 'dhuhr')
  assert.ok(dhuhr, 'dhuhr prayer preset must exist in prayerStore.prayers')
  assert.deepEqual(dhuhr.repeatDays, [1, 2, 3, 4, 6, 0], 'dhuhr must default to all days except Friday (5)')

  const jumuah = prayerStore.prayers.find((p) => p.id === 'jumuah')
  assert.ok(jumuah, 'jumuah prayer preset must exist in prayerStore.prayers')
  assert.equal(prayerStore.prayers[prayerStore.prayers.length - 1].id, 'jumuah', 'jumuah must be at the end of the prayer list')
  assert.equal(jumuah.startTime, '12:30')
  assert.equal(jumuah.endTime, '13:45')
  assert.deepEqual(jumuah.repeatDays, [5])

  i18nStore.setLocale('zh')
  assert.equal(i18nStore.prayerName('jumuah'), '主麻日礼拜')
  assert.equal(i18nStore.prayerFull('jumuah'), '主麻日礼拜')

  i18nStore.setLocale('en')
  assert.equal(i18nStore.prayerName('jumuah'), "Jumu'ah Prayer")
  assert.equal(i18nStore.prayerFull('jumuah'), "Jumu'ah Prayer")

  i18nStore.setLocale('bn')
  assert.equal(i18nStore.prayerName('jumuah'), 'জুমার নামাজ')
  assert.equal(i18nStore.prayerFull('jumuah'), 'জুমার নামাজ')
})

test('SettingsPrayer merges repeat into the time settings card, uses full-width repeat modal, AI Answer subpage, weekday marquee, and blocks openEdit when disabled', () => {
  const compPath = new URL('../src/components/apps/settings/SettingsPrayer.vue', import.meta.url)
  const content = fs.readFileSync(compPath, 'utf8')

  assert.ok(!content.includes('selectRepeatPreset'), 'Must remove old separate repeat preset card')
  assert.ok(content.includes('openRepeatModal'), 'Must open repeat bottom sheet modal from inline repeat row')
  assert.ok(content.includes('MONDAY_TO_SUNDAY = [1, 2, 3, 4, 5, 6, 0]'), 'Must order weekdays Monday to Sunday')
  assert.ok(content.includes('class="repeat-bottom-sheet"'), 'Must render dedicated full-width repeat bottom sheet modal')
  assert.ok(content.includes('repeat-checkbox'), 'Must render rounded-square checkboxes in repeat modal')
  assert.ok(content.includes('openAiAnswerSubpage'), 'Must navigate to AI Answer subpage via chevron click')
  assert.ok(content.includes('pic-repeat-marquee-track'), 'Must render marquee track when repeat days overflow')
  assert.ok(content.includes('if (!prayerStore.masterEnabled || !prayer.enabled) return false'), 'Must disable repeat marquee when prayer mode or slot is disabled')
  assert.ok(!content.includes('prayerRepeatMarquee 7.5s linear infinite'), 'Marquee must not loop infinitely')
  assert.ok(content.includes('1 forwards'), 'Marquee must scroll once and stop cleanly')
  assert.ok(content.includes('if (!prayerStore.masterEnabled || !prayer.enabled) return'), 'Must block entering time settings when Prayer Mode is off')
})




