/**
 * オリジナル模擬試験の結果の保存（localStorage）の検査。ブラウザの localStorage を模したもので確かめる。
 * - 前の版のキー v1（40問）・v2（58問）を読める・書き込まない・削除しない
 * - 新しい結果は v3 にだけ保存し、40問版・58問版の結果を上書きしない
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

check('保存キー：現在 v3、前の版 v2・v1（新しい順）', ORIGINAL_MOCK_RESULT_KEY === V3 && JSON.stringify(ORIGINAL_MOCK_LEGACY_RESULT_KEYS) === JSON.stringify([V2, V1]))

// 1. 40問のとき（v1）と58問のとき（v2）に保存された結果（本番の形そのまま）
const v1Raw = JSON.stringify({ [ID]: { mockId: ID, correct: 35, total: 40, wrongIds: ['om02-05', 'om02-22', 'om02-37', 'om02-12', 'om02-30'], completedAt: 1761800000000 } })
const v2Raw = JSON.stringify({ [ID]: { mockId: ID, correct: 50, total: 58, wrongIds: ['om02-41', 'om02-50'], completedAt: 1762100000000 } })
store.set(V1, v1Raw)
store.set(V2, v2Raw)
let legacy = getLegacyOriginalMockResults(ID)
check('前の版の結果を新しい順に読める（58問版 50/58 → 40問版 35/40）', legacy.length === 2 && legacy[0].total === 58 && legacy[0].correct === 50 && legacy[1].total === 40 && legacy[1].correct === 35)
check('v3 が空なら現在の版の結果は「なし」', getOriginalMockResult(ID) === null)
store.delete(V2)
legacy = getLegacyOriginalMockResults(ID)
check('58問版が無くても40問版だけを読める', legacy.length === 1 && legacy[0].total === 40)
store.set(V2, v2Raw)

// 2. 68問の結果を保存しても v1・v2 は変わらない
saveOriginalMockResult({ mockId: ID, correct: 60, total: 68, wrongIds: ['om02-59'], completedAt: 1762200000000 })
check('68問の結果は v3 に保存される', getOriginalMockResult(ID)?.total === 68 && getOriginalMockResult(ID)?.correct === 60)
check('v1・v2 の中身は一字一句そのまま（上書き・削除しない）', store.get(V1) === v1Raw && store.get(V2) === v2Raw)
check('保存後も58問版・40問版の結果を読める', getLegacyOriginalMockResults(ID).map((r) => r.total).join(',') === '58,40')
saveOriginalMockResult({ mockId: ID, correct: 62, total: 68, wrongIds: [], completedAt: 1762300000000 })
check('68問を解き直すと v3 の直近の結果だけが更新される', getOriginalMockResult(ID)?.correct === 62 && store.get(V1) === v1Raw && store.get(V2) === v2Raw)
check('他の模擬試験の結果は消えない', (() => {
  saveOriginalMockResult({ mockId: 'other', correct: 1, total: 2, wrongIds: ['x'], completedAt: 1 })
  return getOriginalMockResult(ID)?.correct === 62 && getOriginalMockResult('other')?.total === 2
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
  for (const key of [V1, V2, V3]) {
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
// 壊れた v3 に保存しても例外にならず、正しい形で書き直される
store.set(V3, '{oops')
saveOriginalMockResult({ mockId: ID, correct: 10, total: 68, wrongIds: [], completedAt: 1 })
check('壊れた v3 にも保存でき、読み直せる', getOriginalMockResult(ID)?.correct === 10 && store.get(V1) === v1Raw)

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
  saveOriginalMockResult({ mockId: ID, correct: 1, total: 68, wrongIds: [], completedAt: 1 })
} catch {
  threw = true
}
check('localStorage が使えなくても例外を出さない', !threw)

console.log(fail ? `\n${fail} 件失敗` : '\nすべて成功')
process.exit(fail ? 1 : 0)
