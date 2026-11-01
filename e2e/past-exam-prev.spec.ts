/* ──────────────────────────────────────────────────────────────
   過去問演習の「← 前の問題」（PastExamRunner の全モード）の画面テスト
   `npm run test:e2e`（next build のあと Playwright を pc / sp390 の2画面幅で実行）
   - 回答→次へ→前へで、選んだ回答・正誤・解説が残る／回答済みの範囲内で前後に移動できる
   - 未回答の問題を飛ばして先へ進めない／最初の問題では「前の問題」が押せない
   - 最後の問題からも戻れる／結果画面の採点と復習
   - 年度別・科目別の途中再開（選択肢の復元。選択肢を保存していない旧データも読める）
   - 複数正答の問題（第29回問11：公式正答「2又は3」）
   - ボタンが押せる位置にあり（ヘッダー・下部メニューに隠れない）、横スクロールが出ない
   正答は問題データ（src/data/pastExams/exam-XX.json）から読む。データは読むだけで変更しない。
   ────────────────────────────────────────────────────────────── */
import { test, expect, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import path from 'node:path'

type Q = { id: string; examRound: number; questionNumber: number; explanation: string; answerIndex?: number; answerIndexes?: number[] }
const DATA = new Map<number, Q[]>()
function examQ(round: number, num: number): Q {
  if (!DATA.has(round)) {
    DATA.set(round, JSON.parse(readFileSync(path.join(process.cwd(), 'src', 'data', 'pastExams', `exam-${round}.json`), 'utf8')))
  }
  const q = DATA.get(round)!.find((x) => x.questionNumber === num)
  if (!q) throw new Error(`no question ${round}-${num}`)
  return q
}
const accepted = (q: Q) => (q.answerIndexes && q.answerIndexes.length > 0 ? q.answerIndexes : [q.answerIndex!])
const wrongIndex = (q: Q) => [0, 1, 2, 3].find((i) => !accepted(q).includes(i))!

/* ── 画面操作のヘルパー ── */
const prevBtn = (p: Page) => p.getByRole('button', { name: '← 前の問題', exact: true })
const nextBtn = (p: Page) => p.getByRole('button', { name: /^(次の問題 →|結果を見る)$/ })
const answerBtn = (p: Page) => p.getByRole('button', { name: '回答する', exact: true })
const choices = (p: Page) => p.locator('button[aria-pressed]')
const verdict = (p: Page) => p.locator('p', { hasText: /^(正解|不正解)$/ })

/** いま表示している問題（「第34回　問12」） */
async function current(p: Page): Promise<Q> {
  const text = await p.locator('span', { hasText: /第\d+回\s*問\d+/ }).first().innerText()
  const m = text.match(/第(\d+)回\s*問(\d+)/)!
  return examQ(Number(m[1]), Number(m[2]))
}

/** 画面の中央に当たるか（他の要素に覆われていないか）を確かめてから、実際にクリックする */
async function press(p: Page, loc: ReturnType<Page['locator']>) {
  await loc.scrollIntoViewIfNeeded()
  const hit = await loc.evaluate((el) => {
    const r = el.getBoundingClientRect()
    const t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
    return !!t && (t === el || el.contains(t))
  })
  expect(hit, 'ボタンが他の要素に覆われていない').toBe(true)
  await loc.click()
}

/** 今の問題に回答する。how は 'right'（正答）・'wrong'（誤答）・選択肢の番号 */
async function answer(p: Page, how: 'right' | 'wrong' | number) {
  const q = await current(p)
  const idx = how === 'right' ? accepted(q)[0] : how === 'wrong' ? wrongIndex(q) : how
  await press(p, choices(p).nth(idx))
  await press(p, answerBtn(p))
  await expect(verdict(p)).toHaveText(accepted(q).includes(idx) ? '正解' : '不正解')
  return { q, idx }
}

/** 回答済みの問題として、選んだ回答・正誤・正答・解説が表示されているか */
async function expectAnswered(p: Page, q: Q, idx: number | null) {
  expect((await current(p)).id).toBe(q.id)
  await expect(answerBtn(p)).toHaveCount(0)
  const n = await choices(p).count()
  for (let i = 0; i < n; i++) {
    await expect(choices(p).nth(i)).toBeDisabled()
    await expect(choices(p).nth(i)).toHaveAttribute('aria-pressed', String(i === idx))
  }
  if (idx !== null) await expect(verdict(p)).toHaveText(accepted(q).includes(idx) ? '正解' : '不正解')
  await expect(p.getByText(/^正答：/)).toHaveText(`正答：${accepted(q).map((i) => '①②③④'[i]).join('・')}`)
  await expect(p.getByText(q.explanation.slice(0, 30), { exact: false }).first()).toBeVisible()
}

async function expectNoHorizontalScroll(p: Page) {
  const over = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(over, '横スクロールが出ない').toBeLessThanOrEqual(0)
}

test.beforeEach(async ({ page }) => {
  // 念のため外部の計測（GA4）には一切送らない
  await page.route(/google-analytics\.com|googletagmanager\.com/, (r) => r.abort())
  await page.goto('/')
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
})

test('年度別：回答→次へ→前へで回答・正誤・解説が残り、回答済みの範囲内だけ移動できる', async ({ page }) => {
  await page.goto('/past-exams/34')
  await press(page, page.getByRole('button', { name: '問1から解く' }))

  // 最初の問題では「前の問題」は押せない。未回答では「次の問題」も押せない（飛ばせない）
  await expect(prevBtn(page)).toBeDisabled()
  await expect(nextBtn(page)).toBeDisabled()
  await expect(page.getByText('回答すると次の問題へ進めます')).toBeVisible()
  await press(page, choices(page).nth(0))
  await expect(nextBtn(page)).toBeDisabled()

  const a1 = await answer(page, 'wrong')
  await expect(nextBtn(page)).toBeEnabled()
  await press(page, nextBtn(page))
  expect((await current(page)).questionNumber).toBe(2)
  await expect(page.getByText('2 / 180問')).toBeVisible()

  // 前へ：第1問の回答・正誤・解説がそのまま表示され、回答は変更できない
  await press(page, prevBtn(page))
  await expectAnswered(page, a1.q, a1.idx)
  await expect(prevBtn(page)).toBeDisabled()
  await expectNoHorizontalScroll(page)

  // 回答済みの範囲内で次へ → 第2問（未回答）で止まる
  await press(page, nextBtn(page))
  expect((await current(page)).questionNumber).toBe(2)
  await expect(nextBtn(page)).toBeDisabled()
  const a2 = await answer(page, 'right')
  await press(page, nextBtn(page))
  const a3 = await answer(page, 'wrong')
  await press(page, nextBtn(page))
  expect((await current(page)).questionNumber).toBe(4)

  // 2つ戻って、また進む
  await press(page, prevBtn(page))
  await expectAnswered(page, a3.q, a3.idx)
  await press(page, prevBtn(page))
  await expectAnswered(page, a2.q, a2.idx)
  await press(page, nextBtn(page))
  await expectAnswered(page, a3.q, a3.idx)
  await press(page, nextBtn(page))
  expect((await current(page)).questionNumber).toBe(4)
  await expect(nextBtn(page)).toBeDisabled()

  // 「次の問題」で切り替わっても、上部の「← 戻る」は押せる（2026-10-25 の不具合の再発防止）
  await press(page, page.getByRole('button', { name: '戻る', exact: true }))
})

test('年度別：途中再開で回答済みの問題の選択肢まで復元し、前へ戻れる', async ({ page }) => {
  await page.goto('/past-exams/34')
  await press(page, page.getByRole('button', { name: '問1から解く' }))
  const done = []
  for (const how of ['right', 'wrong', 2] as const) {
    done.push(await answer(page, how))
    await press(page, nextBtn(page))
  }
  await page.reload()
  await expect(page.getByText('3問回答済み・残り177問')).toBeVisible()
  await press(page, page.getByRole('button', { name: '続きから解く' }))
  expect((await current(page)).questionNumber).toBe(4)
  await expect(nextBtn(page)).toBeDisabled()
  for (const d of [...done].reverse()) {
    await press(page, prevBtn(page))
    await expectAnswered(page, d.q, d.idx)
  }
  await expect(prevBtn(page)).toBeDisabled()

  // 保存データ：既存の項目はそのまま、選んだ選択肢（selectedIndex）が追加されている
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('shinkyuu_pastexam_session_v1')!)['34'])
  expect(saved.completed).toBe(false)
  expect(saved.answers.map((a: { questionNumber: number }) => a.questionNumber)).toEqual([1, 2, 3])
  expect(saved.answers.map((a: { selectedIndex: number }) => a.selectedIndex)).toEqual(done.map((d) => d.idx))
  const history = await page.evaluate(() => JSON.parse(localStorage.getItem('shinkyuu_pastexam_history_v1')!))
  expect(Array.isArray(history) ? history.length : Object.keys(history).length).toBeGreaterThan(0)
})

test('年度別：選択肢を保存していない旧データでも再開でき、前へ戻ると正誤と解説を表示する', async ({ page }) => {
  const q1 = examQ(34, 1)
  const q2 = examQ(34, 2)
  await page.evaluate(
    ([a, b]) => {
      localStorage.setItem(
        'shinkyuu_pastexam_session_v1',
        JSON.stringify({
          '34': {
            examRound: 34,
            answers: [
              { questionId: a, questionNumber: 1, correct: true },
              { questionId: b, questionNumber: 2, correct: false },
            ],
            completed: false,
            updatedAt: 1,
          },
        }),
      )
    },
    [q1.id, q2.id],
  )
  await page.goto('/past-exams/34')
  await expect(page.getByText('2問回答済み・残り178問')).toBeVisible()
  await press(page, page.getByRole('button', { name: '続きから解く' }))
  expect((await current(page)).questionNumber).toBe(3)
  await press(page, prevBtn(page))
  await expectAnswered(page, q2, null)
  await expect(verdict(page)).toHaveText('不正解')
  await expect(page.getByText('選んだ選択肢はこの端末に記録されていません')).toBeVisible()
  await press(page, prevBtn(page))
  await expectAnswered(page, q1, null)
  await expect(verdict(page)).toHaveText('正解')
})

test('科目別：複数正答の問題（第29回問11）と途中再開・前へ', async ({ page }) => {
  await page.goto('/past-exams/subject/regulations')
  await press(page, page.getByRole('button', { name: '演習を始める' }))
  const first = await current(page)
  expect(first.id).toBe('29-011')
  expect(accepted(first)).toEqual([1, 2])
  // ②でも③でも正解。ここでは③を選ぶ
  const a1 = await answer(page, 2)
  await expect(verdict(page)).toHaveText('正解')
  await expect(page.getByText('正答：②・③')).toBeVisible()
  await press(page, nextBtn(page))
  const a2 = await answer(page, 'wrong')
  await press(page, nextBtn(page))
  await press(page, prevBtn(page))
  await expectAnswered(page, a2.q, a2.idx)
  await press(page, prevBtn(page))
  await expectAnswered(page, a1.q, 2)

  await page.reload()
  await expect(page.getByText('2問回答済み・残り22問')).toBeVisible()
  await press(page, page.getByRole('button', { name: '続きから解く' }))
  await expect(page.getByText('3 / 24問')).toBeVisible()
  await press(page, prevBtn(page))
  await press(page, prevBtn(page))
  await expectAnswered(page, a1.q, 2)
  await expect(verdict(page)).toHaveText('正解')

  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('shinkyuu_pastexam_subject_session_v1')!).regulations)
  expect(saved.answers).toEqual([
    { questionId: a1.q.id, correct: true, selectedIndex: 2 },
    { questionId: a2.q.id, correct: false, selectedIndex: a2.idx },
  ])
})

test('科目別：選択肢を保存していない旧データでも再開でき、前へ戻ると正誤と解説を表示する', async ({ page }) => {
  await page.goto('/past-exams/subject/regulations')
  await press(page, page.getByRole('button', { name: '演習を始める' }))
  const a1 = await answer(page, 'right')
  await press(page, nextBtn(page))
  const a2 = await answer(page, 'wrong')
  await press(page, nextBtn(page))
  // 保存データから selectedIndex を外し、この機能より前の形に戻す
  await page.evaluate(() => {
    const key = 'shinkyuu_pastexam_subject_session_v1'
    const map = JSON.parse(localStorage.getItem(key)!)
    map.regulations.answers = map.regulations.answers.map((a: { questionId: string; correct: boolean }) => ({
      questionId: a.questionId,
      correct: a.correct,
    }))
    localStorage.setItem(key, JSON.stringify(map))
  })
  await page.reload()
  await expect(page.getByText('2問回答済み・残り22問')).toBeVisible()
  await press(page, page.getByRole('button', { name: '続きから解く' }))
  await expect(page.getByText('3 / 24問')).toBeVisible()
  await expect(nextBtn(page)).toBeDisabled()
  await press(page, prevBtn(page))
  await expectAnswered(page, a2.q, null)
  await expect(verdict(page)).toHaveText('不正解')
  await expect(page.getByText('選んだ選択肢はこの端末に記録されていません')).toBeVisible()
  await press(page, prevBtn(page))
  await expectAnswered(page, a1.q, null)
  await expect(verdict(page)).toHaveText('正解')
  await expect(prevBtn(page)).toBeDisabled()
  // 再開後に新しく回答した問題は selectedIndex 付きで保存される（旧データの2問はそのまま）
  await press(page, nextBtn(page))
  await press(page, nextBtn(page))
  const a3 = await answer(page, 'right')
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('shinkyuu_pastexam_subject_session_v1')!).regulations)
  expect(saved.answers).toEqual([
    { questionId: a1.q.id, correct: true },
    { questionId: a2.q.id, correct: false },
    { questionId: a3.q.id, correct: true, selectedIndex: a3.idx },
  ])
})

test('テーマ別：最後の問題から戻る→結果の採点→間違えた問題の復習でも前へ戻れる', async ({ page }) => {
  await page.goto('/past-exams/theme/rg-menkyo')
  await press(page, page.getByRole('button', { name: '演習を始める' }))
  const pattern = ['right', 'wrong', 'right', 'wrong', 'right'] as const
  const done = []
  for (let i = 0; i < pattern.length; i++) {
    done.push(await answer(page, pattern[i]))
    if (i < pattern.length - 1) await press(page, nextBtn(page))
  }
  // 最後の問題：「結果を見る」と「前の問題」
  await expect(nextBtn(page)).toHaveText('結果を見る')
  await press(page, prevBtn(page))
  await expectAnswered(page, done[3].q, done[3].idx)
  await expect(nextBtn(page)).toHaveText('次の問題 →')
  await press(page, nextBtn(page))
  await expectAnswered(page, done[4].q, done[4].idx)
  await press(page, nextBtn(page))

  // 採点：正解3・不正解2（前後に移動しても変わらない）
  await expect(page.getByText(/^3\s*\/ 5問 正解$/)).toBeVisible()
  await expect(page.getByText('間違えた問題　2問')).toBeVisible()

  // 間違えた2問の復習：最初は前へ戻れない、回答→次へ→前へで保持
  await press(page, page.getByRole('button', { name: '間違えた2問を復習' }))
  await expect(page.getByText(/苦手復習/).first()).toBeVisible()
  await expect(prevBtn(page)).toBeDisabled()
  const r1 = await answer(page, 'right')
  await press(page, nextBtn(page))
  await press(page, prevBtn(page))
  await expectAnswered(page, r1.q, r1.idx)
  await press(page, nextBtn(page))
  await answer(page, 'right')
  await press(page, nextBtn(page))
  await expect(page.getByText('苦手復習 完了')).toBeVisible()
  await expect(page.getByText(/^2\s*\/ 2問 正解$/)).toBeVisible()
})

test('年度別：全180問を解いて採点し、完了の記録が残る（前後に移動しても採点は変わらない）', async ({ page }, info) => {
  test.skip(info.project.name !== 'pc', '時間がかかるため PC 幅だけで実行')
  await page.goto('/past-exams/33')
  await press(page, page.getByRole('button', { name: '問1から解く' }))
  let expected = 0
  for (let i = 1; i <= 180; i++) {
    const q = await current(page)
    const right = i % 3 !== 0
    const idx = right ? accepted(q)[0] : wrongIndex(q)
    if (right) expected++
    await choices(page).nth(idx).click()
    await answerBtn(page).click()
    if (i === 90) {
      // 途中で3問戻ってから進み直す
      for (let k = 0; k < 3; k++) await prevBtn(page).click()
      for (let k = 0; k < 3; k++) await nextBtn(page).click()
      expect((await current(page)).questionNumber).toBe(90)
    }
    if (i < 180) await nextBtn(page).click()
  }
  await expect(nextBtn(page)).toHaveText('結果を見る')
  await press(page, nextBtn(page))
  await expect(page.getByText(new RegExp(`^${expected}\\s*/ 180問 正解$`))).toBeVisible()
  await expect(page.getByText(`間違えた問題　${180 - expected}問`)).toBeVisible()
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('shinkyuu_pastexam_session_v1')!)['33'])
  expect(saved.completed).toBe(true)
  expect(saved.answers.length).toBe(180)
  expect(saved.answers.filter((a: { correct: boolean }) => a.correct).length).toBe(expected)
  await page.reload()
  await expect(page.getByText(`前回 ${expected} / 180問正解`)).toBeVisible()
})

test('表示：前後のボタンが画面内に並び、スクリーンショットを残す', async ({ page }, info) => {
  await page.goto('/past-exams/34')
  await press(page, page.getByRole('button', { name: '問1から解く' }))
  await answer(page, 'right')
  await press(page, nextBtn(page))
  await answer(page, 'wrong')
  const pb = await prevBtn(page).boundingBox()
  const nb = await nextBtn(page).boundingBox()
  const vw = page.viewportSize()!.width
  expect(pb && nb).toBeTruthy()
  expect(Math.abs(pb!.y - nb!.y)).toBeLessThan(2) // 横に並ぶ
  expect(pb!.x).toBeGreaterThanOrEqual(0)
  expect(nb!.x + nb!.width).toBeLessThanOrEqual(vw)
  expect(pb!.height).toBeGreaterThanOrEqual(44) // 押しやすい高さ
  await expectNoHorizontalScroll(page)
  await prevBtn(page).scrollIntoViewIfNeeded()
  await page.screenshot({ path: `test-results/screens/past-exam-prev-${info.project.name}.png` })
  await press(page, prevBtn(page))
  await page.screenshot({ path: `test-results/screens/past-exam-prev-back-${info.project.name}.png`, fullPage: true })
})
