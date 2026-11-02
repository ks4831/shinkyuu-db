/**
 * オリジナル模擬試験の結果の保存（localStorage）の検査。ブラウザの localStorage を模したもので確かめる。
 * - 旧キー v1（40問のときの結果）を読める・書き込まない・削除しない
 * - 新しい結果は v2 にだけ保存し、v1 の40問版の結果を上書きしない
 * - 保存データが壊れていても例外を出さず「結果なし」として扱う
 * 実行：npm run test:original-mock-results
 */
import {
  ORIGINAL_MOCK_LEGACY_RESULT_KEY,
  ORIGINAL_MOCK_RESULT_KEY,
  getLegacyOriginalMockResult,
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

check('保存キー：旧 v1・新 v2 で別', ORIGINAL_MOCK_LEGACY_RESULT_KEY === 'shinkyuu_original_mock_results_v1' && ORIGINAL_MOCK_RESULT_KEY === 'shinkyuu_original_mock_results_v2')

// 1. 40問のときに保存された結果（本番 2026-10-27〜 の形そのまま）
const legacyRaw = JSON.stringify({ [ID]: { mockId: ID, correct: 35, total: 40, wrongIds: ['om02-05', 'om02-22', 'om02-37', 'om02-12', 'om02-30'], completedAt: 1761800000000 } })
store.set(ORIGINAL_MOCK_LEGACY_RESULT_KEY, legacyRaw)
const legacy = getLegacyOriginalMockResult(ID)
check('旧 v1 の40問版の結果を読める（35/40・まちがい5問）', legacy?.correct === 35 && legacy.total === 40 && legacy.wrongIds.length === 5)
check('v2 が空なら58問版の結果は「なし」', getOriginalMockResult(ID) === null)

// 2. 58問の結果を保存しても v1 は変わらない
saveOriginalMockResult({ mockId: ID, correct: 50, total: 58, wrongIds: ['om02-41'], completedAt: 1762100000000 })
check('58問の結果は v2 に保存される', getOriginalMockResult(ID)?.total === 58 && getOriginalMockResult(ID)?.correct === 50)
check('v1 の中身は一字一句そのまま（上書き・削除しない）', store.get(ORIGINAL_MOCK_LEGACY_RESULT_KEY) === legacyRaw)
check('保存後も40問版の結果を読める', getLegacyOriginalMockResult(ID)?.correct === 35)
saveOriginalMockResult({ mockId: ID, correct: 52, total: 58, wrongIds: [], completedAt: 1762200000000 })
check('58問を解き直すと v2 の直近の結果だけが更新される', getOriginalMockResult(ID)?.correct === 52 && store.get(ORIGINAL_MOCK_LEGACY_RESULT_KEY) === legacyRaw)
check('他の模擬試験の結果は消えない', (() => {
  saveOriginalMockResult({ mockId: 'other', correct: 1, total: 2, wrongIds: ['x'], completedAt: 1 })
  return getOriginalMockResult(ID)?.correct === 52 && getOriginalMockResult('other')?.total === 2
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
  for (const key of [ORIGINAL_MOCK_LEGACY_RESULT_KEY, ORIGINAL_MOCK_RESULT_KEY]) {
    store.set(key, raw)
    let ok = false
    try {
      ok = (key === ORIGINAL_MOCK_RESULT_KEY ? getOriginalMockResult(ID) : getLegacyOriginalMockResult(ID)) === null
    } catch {
      ok = false
    }
    check(`壊れた保存データ（${label}・${key.endsWith('v1') ? 'v1' : 'v2'}）でも例外なく「なし」`, ok)
  }
}
// 壊れた v2 に保存しても例外にならず、正しい形で書き直される
store.set(ORIGINAL_MOCK_RESULT_KEY, '{oops')
saveOriginalMockResult({ mockId: ID, correct: 10, total: 58, wrongIds: [], completedAt: 1 })
check('壊れた v2 にも保存でき、読み直せる', getOriginalMockResult(ID)?.correct === 10)

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
  getLegacyOriginalMockResult(ID)
  saveOriginalMockResult({ mockId: ID, correct: 1, total: 58, wrongIds: [], completedAt: 1 })
} catch {
  threw = true
}
check('localStorage が使えなくても例外を出さない', !threw)

console.log(fail ? `\n${fail} 件失敗` : '\nすべて成功')
process.exit(fail ? 1 : 0)
