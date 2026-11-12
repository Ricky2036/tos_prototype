import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  SHARED_ALLOW, globToRegExp, matchGlob, classify, normalizeClaims,
} from '../scripts/lib/claim-rules.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

test('glob：* 不跨目录，** 跨目录', () => {
  assert.equal(matchGlob('src/a.js', 'src/*.js'), true)
  assert.equal(matchGlob('src/x/a.js', 'src/*.js'), false)
  assert.equal(matchGlob('src/x/a.js', 'src/**'), true)
  assert.equal(matchGlob('src/x/a.js', 'src/**/*.js'), true)
})

test('glob：结尾斜杠等价于 /**', () => {
  assert.equal(matchGlob('src/x/a.js', 'src/'), true)
})

test('glob：特殊字符被转义，不会当正则用', () => {
  assert.equal(matchGlob('src/a+b.js', 'src/a+b.js'), true)
  assert.equal(matchGlob('src/aab.js', 'src/a+b.js'), false)
  assert.ok(globToRegExp('src/(a).js') instanceof RegExp)
})

const CLAIMS = [
  { cluster: 'C2', owner: 'workbuddy', files: ['src/comp/settings/**', 'tests/display*.test.js'] },
  { cluster: 'C0-a', owner: 'integrator', files: ['src/App.vue'] },
]

test('classify：命中单一簇 → claimed', () => {
  const r = classify(['src/comp/settings/a.vue'], CLAIMS)
  assert.equal(r.ok, true)
  assert.equal(r.rows[0].cluster, 'C2')
  assert.equal(r.rows[0].owner, 'workbuddy')
})

test('classify：未认领的文件被点名', () => {
  const r = classify(['src/nowhere.js'], CLAIMS)
  assert.equal(r.ok, false)
  assert.deepEqual(r.unclaimed, ['src/nowhere.js'])
})

test('classify：同时命中两个簇 → 冲突，不允许"都算你的"', () => {
  const two = [
    { cluster: 'A', owner: 'x', files: ['src/**'] },
    { cluster: 'B', owner: 'y', files: ['src/App.vue'] },
  ]
  const r = classify(['src/App.vue'], two)
  assert.equal(r.ok, false)
  assert.deepEqual(r.conflicts, ['src/App.vue'])
  assert.match(r.rows[0].cluster, /A \+ B/)
})

test('classify：协作产物人人可写，不参与判定', () => {
  const r = classify(['.tasks/x.md', '.claims/C2.json', 'docs/a.md'], CLAIMS)
  assert.equal(r.ok, true)
  assert.equal(r.allowed.length, 3)
  assert.ok(SHARED_ALLOW.length >= 3)
})

test('classify：[handoff] 白名单放行', () => {
  const r = classify(['src/comp/settings/a.vue'], CLAIMS, { allow: ['src/comp/settings/**'] })
  assert.equal(r.ok, true)
  assert.equal(r.allowed[0].why, 'handoff')
  assert.equal(r.rows.length, 0)
})

test('normalizeClaims：缺字段直接报错，不静默放过', () => {
  assert.throws(() => normalizeClaims([['a.json', { owner: 'x', files: ['a'] }]]), /缺少 cluster/)
  assert.throws(() => normalizeClaims([['a.json', { cluster: 'A', files: ['a'] }]]), /缺少 owner/)
  assert.throws(() => normalizeClaims([['a.json', { cluster: 'A', owner: 'x', files: [] }]]), /非空数组/)
})

test('normalizeClaims：同簇两处登记 → 报错（否则认领会含糊）', () => {
  assert.throws(
    () => normalizeClaims([
      ['a.json', { cluster: 'A', owner: 'x', files: ['a'] }],
      ['b.json', { cluster: 'A', owner: 'y', files: ['b'] }],
    ]),
    /重复登记/,
  )
})

test('仓库里的 .claims 全部合法且互不重叠', () => {
  const dir = path.join(ROOT, '.claims')
  const entries = fs.readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => [f, JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))])
  const claims = normalizeClaims(entries)
  assert.ok(claims.length >= 3)

  // 关键文件只能有一个归属：随机挑几个已知文件验证
  const samples = [
    ['src/App.vue', 'C0-a'],
    ['src/components/apps/settings/SettingsApp.vue', 'C2'],
    ['scripts/gate-merge.mjs', 'C0-infra'],
  ]
  for (const [file, want] of samples) {
    const hits = claims.filter((c) => c.files.some((g) => matchGlob(file, g)))
    assert.equal(hits.length, 1, `${file} 命中 ${hits.length} 个簇`)
    assert.equal(hits[0].cluster, want)
  }
})
