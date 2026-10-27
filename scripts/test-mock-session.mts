/**
 * 模擬試験の解答セッション（src/lib/mockSession.ts）の検査。
 * オリジナル模擬試験②と総合模擬試験①で共通に使う「前の問題へ戻る」・回答の保持と変更・未回答の確認。
 * 実行：npm run test:mock-session
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  answeredCount,
  canGoNext,
  canGoPrev,
  confirmAnswer,
  createMockSession,
  goNext,
  goPrev,
  goTo,
  isLocked,
  selectChoice,
  shownChoice,
  startEditing,
  unansweredIndexes,
  type MockSession,
} from '../src/lib/mockSession'
import { isOriginalMockCorrect, type OriginalMockData } from '../src/lib/originalMock'

let fail = 0
function check(label: string, cond: boolean, detail = '') {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${detail ? '  (' + detail + ')' : ''}`)
  if (!cond) fail++
}

const answer = (s: MockSession, c: number) => confirmAnswer(selectChoice(s, c))

// 1. 第1問では戻れない・第2問へ進んで第1問へ戻れる
let s = createMockSession(['a', 'b', 'c'])
check('第1問では「前の問題へ」が使えない', !canGoPrev(s) && goPrev(s) === s)
s = answer(s, 2)
s = goNext(s)
check('第2問では「前の問題へ」が使える', s.index === 1 && canGoPrev(s))
s = goPrev(s)
check('第1問へ戻れる', s.index === 0)

// 2. 回答の保持
check('戻ったとき前の回答が保持・表示される', s.answers[0] === 2 && shownChoice(s, 0) === 2 && isLocked(s, 0))

// 3. 回答の変更（確定するまでは元の回答が有効）
s = startEditing(s)
s = selectChoice(s, 1)
check('変更中は元の回答のまま', s.answers[0] === 2 && shownChoice(s, 0) === 1 && !isLocked(s, 0))
s = confirmAnswer(s)
check('確定すると最新の回答に置き換わる', s.answers[0] === 1 && isLocked(s, 0))
s = startEditing(s)
s = selectChoice(s, 3)
s = goNext(s)
check('確定せずに移動すると変更は取り消され、元の回答が残る', s.answers[0] === 1 && s.editing[0] === false && shownChoice(s, 0) === 1)

// 4. 移動しても順序と回答が壊れない
s = goTo(s, 2)
s = answer(s, 0)
s = goTo(s, 0)
s = goTo(s, 2)
check('問題の順序は変わらない', JSON.stringify(s.order) === JSON.stringify(['a', 'b', 'c']))
check('各問の回答が保持される', JSON.stringify(s.answers) === JSON.stringify([1, null, 0]))
check('範囲外へは移動しない', goTo(s, 3) === s && goTo(s, -1) === s && !canGoNext(s))

// 5. 未回答の検出（採点前の確認に使う）
check('未回答の問題を返す', JSON.stringify(unansweredIndexes(s)) === JSON.stringify([1]) && answeredCount(s) === 2)
check('回答済みでない問題は変更開始できない', startEditing(goTo(s, 1)).editing[1] === false)
check('選択せずに確定しても何も起きない', confirmAnswer(goTo(s, 1)).answers[1] === null)

// 6. 模擬試験②の40問：回答を変更した最新の回答で採点する
const data = JSON.parse(readFileSync(join(import.meta.dirname, '..', 'src/data/originalMocks/original-mock-02.json'), 'utf8')) as OriginalMockData
const qs = data.questions
let m = createMockSession(qs.map((q) => q.id))
for (let i = 0; i < qs.length; i++) {
  m = answer(m, (qs[i].answerIndex + 1) % 4) // いったん全問まちがえる
  if (canGoNext(m)) m = goNext(m)
}
for (let i = qs.length - 1; i >= 0; i--) {
  if (i % 2 === 0) m = confirmAnswer(selectChoice(startEditing(m), qs[i].answerIndex)) // 偶数番目を正答に変更
  if (canGoPrev(m)) m = goPrev(m)
}
const score = qs.filter((q, i) => m.answers[i] !== null && isOriginalMockCorrect(q, m.answers[i]!)).length
check('40問：後から変更した回答が採点に反映される（20/40）', score === 20 && unansweredIndexes(m).length === 0, String(score))
check('40問：移動後も順序が出題順のまま', JSON.stringify(m.order) === JSON.stringify(qs.map((q) => q.id)))

// 7. 解き直し（問題の一部だけのセッション）でも同じ操作ができる
let r = createMockSession(['om02-05', 'om02-22', 'om02-37'])
r = answer(r, 0)
r = goNext(r)
r = goPrev(r)
check('解き直しでも戻れて回答が保持される', r.index === 0 && r.answers[0] === 0 && canGoNext(r) && !canGoPrev(r))

console.log(fail ? `\n${fail} 件失敗` : '\nすべて成功')
process.exit(fail ? 1 : 0)
