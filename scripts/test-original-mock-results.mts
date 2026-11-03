/**
 * オリジナル模擬試験の結果の保存（localStorage）の検査。ブラウザの localStorage を模したもので確かめる。
 * - 前の版のキー v1（40問）・v2（58問）・v3（68問）・v4（80問）を読める・書き込まない・削除しない
 * - 新しい結果は v5 にだけ保存し、40問版・58問版・68問版・80問版の結果を上書きしない
 * - 保存データが壊れていても例外を出さず「結果なし」として扱う
 * 実行：npm run test:original-mock-results
 */
import {
  ORIGINAL_MOCK_LEGACY_RESULT_KEYS,
  ORIGINAL_MOCK_RESULT_KEY,
  getLegacyOriginalMockResults,
  getOriginalMockResult,
  saveOriginalMockResult,
} from '../src/lib/originalMock'

let fail = 0
function check(label: string, cond: boolean, detail = '') {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${detail ? '  (' + detail + ')' : ''}`)
  if (!cond) fail++
}

const store = new Map<string, string>()
;(globalThis as unknown as { window: unknown }).window = {
  localStorage: {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
  },
}
const ID = 'original-mock-02'
const V1 = 'shinkyuu_original_mock_results_v1'
const V2 = 'shinkyuu_original_mock_results_v2'
const V3 = 'shinkyuu_original_mock_results_v3'
const V4 = 'shinkyuu_original_mock_results_v4'
const V5 = 'shinkyuu_original_mock_results_v5'

check('保存キー：現在 v5、前の版 v4・v3・v2・v1（新しい順）', ORIGINAL_MOCK_RESULT_KEY === V5 && JSON.stringify(ORIGINAL_MOCK_LEGACY_RESULT_KEYS) === JSON.stringify([V4, V3, V2, V1]))

// 1. 40問（v1）・58問（v2）・68問（v3）・80問（v4）のときに保存された結果（本番の形そのまま）
const v1Raw = JSON.stringify({ [ID]: { mockId: ID, correct: 35, total: 40, wrongIds: ['om02-05', 'om02-22', 'om02-37', 'om02-12', 'om02-30'], completedAt: 1761800000000 } })
const v2Raw = JSON.stringify({ [ID]: { mockId: ID, correct: 50, total: 58, wrongIds: ['om02-41', 'om02-50'], completedAt: 1762100000000 } })
const v3Raw = JSON.stringify({ [ID]: { mockId: ID, correct: 60, total: 68, wrongIds: ['om02-59', 'om02-64'], completedAt: 1762150000000 } })
const v4Raw = JSON.stringify({ [ID]: { mockId: ID, correct: 70, total: 80, wrongIds: ['om02-62', 'om02-69'], completedAt: 1762180000000 } })
store.set(V1, v1Raw)
store.set(V2, v2Raw)
store.set(V3, v3Raw)
store.set(V4, v4Raw)
let legacy = getLegacyOriginalMockResults(ID)
check('前の版の結果を新しい順に読める（80問版 70/80 → 68問版 60/68 → 58問版 50/58 → 40問版 35/40）', legacy.map((r) => `${r.correct}/${r.total}`).join(',') === '70/80,60/68,50/58,35/40')
check('v5 が空なら現在の版の結果は「なし」', getOriginalMockResult(ID) === null)
store.delete(V4)
store.delete(V3)
store.delete(V2)
legacy = getLegacyOriginalMockResults(ID)
check('80問版・68問版・58問版が無くても40問版だけを読める', legacy.length === 1 && legacy[0].total === 40)
store.set(V2, v2Raw)
store.set(V3, v3Raw)
store.set(V4, v4Raw)

// 2. 100問の結果を保存しても v1〜v4 は変わらない
const legacySame = () => store.get(V1) === v1Raw && store.get(V2) === v2Raw && store.get(V3) === v3Raw && store.get(V4) === v4Raw
saveOriginalMockResult({ mockId: ID, correct: 88, total: 100, wrongIds: ['om02-81'], completedAt: 1762200000000 })
check('100問の結果は v5 に保存される', getOriginalMockResult(ID)?.total === 100 && getOriginalMockResult(ID)?.correct === 88)
check('v1・v2・v3・v4 の中身は一字一句そのまま（上書き・削除しない）', legacySame())
check('保存後も80問版・68問版・58問版・40問版の結果を読める', getLegacyOriginalMockResults(ID).map((r) => r.total).join(',') === '80,68,58,40')
saveOriginalMockResult({ mockId: ID, correct: 95, total: 100, wrongIds: [], completedAt: 1762300000000 })
check('100問を解き直すと v5 の直近の結果だけが更新される', getOriginalMockResult(ID)?.correct === 95 && legacySame())
check('他の模擬試験の結果は消えない', (() => {
  saveOriginalMockResult({ mockId: 'other', correct: 1, total: 2, wrongIds: ['x'], completedAt: 1 })
  return getOriginalMockResult(ID)?.correct === 95 && getOriginalMockResult('other')?.total === 2
})())

// 3. 壊れた保存データ
const broken: [string, string][] = [
  ['JSON でない', '{oops'],
  ['配列', '[1,2]'],
  ['null', 'null'],
  ['total が文字列', JSON.stringify({ [ID]: { correct: 3, total: '40', wrongIds: [] } })],
  ['wrongIds が無い', JSON.stringify({ [ID]: { correct: 3, total: 40 } })],
  ['wrongIds に数値', JSON.stringify({ [ID]: { correct: 3, total: 40, wrongIds: [1] } })],
  ['correct が total より大きい', JSON.stringify({ [ID]: { correct: 41, total: 40, wrongIds: [] } })],
  ['total が0', JSON.stringify({ [ID]: { correct: 0, total: 0, wrongIds: [] } })],
  ['結果が文字列', JSON.stringify({ [ID]: 'x' })],
]
for (const [label, raw] of broken) {
  for (const key of [V1, V2, V3, V4, V5]) {
    store.clear()
    store.set(key, raw)
    let ok = false
    try {
      ok = getOriginalMockResult(ID) === null && getLegacyOriginalMockResults(ID).length === 0
    } catch {
      ok = false
    }
    check(`壊れた保存データ（${label}・${key.slice(-2)}）でも例外なく「なし」`, ok)
  }
}
// 片方だけ壊れていても、もう片方は読める
store.clear()
store.set(V2, '{oops')
store.set(V1, v1Raw)
check('v2 が壊れていても v1 の40問版は読める', getLegacyOriginalMockResults(ID).map((r) => r.total).join(',') === '40')
store.set(V3, '{oops')
check('v3 が壊れていても v1 の40問版は読める', getLegacyOriginalMockResults(ID).map((r) => r.total).join(',') === '40')
store.set(V4, '{oops')
check('v4 が壊れていても v1 の40問版は読める', getLegacyOriginalMockResults(ID).map((r) => r.total).join(',') === '40')
// 壊れた v5 に保存しても例外にならず、正しい形で書き直される
store.set(V5, '{oops')
saveOriginalMockResult({ mockId: ID, correct: 10, total: 100, wrongIds: [], completedAt: 1 })
check('壊れた v5 にも保存でき、読み直せる（v4 の壊れたデータは書き換えない）', getOriginalMockResult(ID)?.correct === 10 && store.get(V1) === v1Raw && store.get(V4) === '{oops')

// 4. localStorage が使えない環境
;(globalThis as unknown as { window: unknown }).window = {
  localStorage: {
    getItem: () => {
      throw new Error('blocked')
    },
    setItem: () => {
      throw new Error('blocked')
    },
  },
}
let threw = false
try {
  getOriginalMockResult(ID)
  getLegacyOriginalMockResults(ID)
  saveOriginalMockResult({ mockId: ID, correct: 1, total: 100, wrongIds: [], completedAt: 1 })
} catch {
  threw = true
}
check('localStorage が使えなくても例外を出さない', !threw)

console.log(fail ? `\n${fail} 件失敗` : '\nすべて成功')
process.exit(fail ? 1 : 0)
