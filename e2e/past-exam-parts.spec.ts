/* ──────────────────────────────────────────────────────────────
   年度別過去問の午前・午後（Sprint 25）の画面テスト
   `npm run test:e2e`（next build のあと Playwright を pc / sp390 の2画面幅で実行）
   第29〜34回のそれぞれで：
   - 範囲の選択（午前 問1〜90・午後 問91〜180・全180問）と問題数・最初の問題番号
   - 途中保存と再読み込み後の再開位置、午前・午後・全問の記録が混ざらないこと
   - 途中で採点（未回答の数え方）→ 続きから解く
   - 最後まで解いた採点：正解・不正解・未回答・正答率、午前・午後別と全体（両方解いた場合）
   - 間違えた問題の一覧（問題番号・科目・問題文・自分の回答・正答・解説）
   - 間違えた問題だけの復習と、その回答・採点の確認。元の結果・保存データは上書きされない
   - 横スクロールが出ない
   正答・問題文・解説は問題データ（src/data/pastExams/exam-XX.json）から読む。データは読むだけで変更しない。
   ────────────────────────────────────────────────────────────── */
import { test, expect, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import path from 'node:path'

type Q = {
  id: string
  examRound: number
  questionNumber: number
  questionText: string
  explanation: string
  answerIndex?: number
  answerIndexes?: number[]
}
const DATA = new Map<number, Q[]>()
function exam(round: number): Q[] {
  if (!DATA.has(round)) {
    DATA.set(round, JSON.parse(readFileSync(path.join(process.cwd(), 'src', 'data', 'pastExams', `exam-${round}.json`), 'utf8')))
  }
  return DATA.get(round)!
}
const examQ = (round: number, num: number) => exam(round).find((x) => x.questionNumber === num)!
const accepted = (q: Q) => (q.answerIndexes && q.answerIndexes.length > 0 ? q.answerIndexes : [q.answerIndex!])
const wrongIndex = (q: Q) => [0, 1, 2, 3].find((i) => !accepted(q).includes(i))!
const CIRCLED = '①②③④'

const ROUNDS = [29, 30, 31, 32, 33, 34]
const PART_RANGE: Record<'am' | 'pm', [number, number]> = { am: [1, 90], pm: [91, 180] }

const nextBtn = (p: Page) => p.getByRole('button', { name: /^(次の問題 →|結果を見る)$/ })
const answerBtn = (p: Page) => p.getByRole('button', { name: '回答する', exact: true })
const choices = (p: Page) => p.locator('button[aria-pressed]')

async function current(p: Page): Promise<Q> {
  const text = await p.locator('span', { hasText: /第\d+回\s*問\d+/ }).first().innerText()
  const m = text.match(/第(\d+)回\s*問(\d+)/)!
  return examQ(Number(m[1]), Number(m[2]))
}

async function press(p: Page, loc: ReturnType<Page['locator']>) {
  // 画面の中央までスクロールしてから確かめる（下端に少しだけ見えている状態だと、固定の下部メニューに重なるため。
  // 利用者はスクロールして押すので、そのうえで覆われていないことを確認する）
  await loc.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }))
  const hit = await loc.evaluate((el) => {
    const r = el.getBoundingClientRect()
    const t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
    return !!t && (t === el || el.contains(t))
  })
  expect(hit, 'ボタンが他の要素に覆われていない').toBe(true)
  await loc.click()
}

async function answer(p: Page, how: 'right' | 'wrong') {
  const q = await current(p)
  const idx = how === 'right' ? accepted(q)[0] : wrongIndex(q)
  await press(p, choices(p).nth(idx))
  await press(p, answerBtn(p))
  return { q, idx }
}

async function expectNoHorizontalScroll(p: Page) {
  const over = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(over, '横スクロールが出ない').toBeLessThanOrEqual(0)
}

/** 結果画面の正解・不正解・未回答の数 */
async function counts(p: Page) {
  const t = await p.getByTestId('score-counts').innerText()
  const num = (label: string) => Number(new RegExp(`${label}\\s*(\\d+)\\s*問`).exec(t)![1])
  return { correct: num('(?<!不)正解'), wrong: num('不正解'), unanswered: num('未回答') }
}

/** 午前・午後別の表の1行（正解・不正解・未回答・正答率、または説明文） */
async function breakdownRow(p: Page, label: string) {
  const row = p.getByTestId('score-breakdown').locator('tr', { has: p.locator('th', { hasText: new RegExp(`^${label}$`) }) })
  return (await row.locator('td').allInnerTexts()).map((s) => s.trim())
}

const pct = (c: number, t: number) => `${Math.round((c / t) * 100)}%`
/** 保存データ用の回答（問題番号 num を正解／不正解にしたときの選択肢） */
function seedAnswer(round: number, num: number, right: boolean) {
  const q = examQ(round, num)
  return { questionId: q.id, questionNumber: num, correct: right, selectedIndex: right ? accepted(q)[0] : wrongIndex(q) }
}
/** 10問に1問を不正解にする（問題番号が10の倍数） */
const isRightBy10 = (num: number) => num % 10 !== 0

test.beforeEach(async ({ page }) => {
  await page.route(/google-analytics\.com|googletagmanager\.com/, (r) => r.abort())
  await page.goto('/')
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
})

for (const round of ROUNDS) {
  test(`第${round}回：範囲の選択・途中保存と再読み込み・途中採点・続きから`, async ({ page }) => {
    await page.goto(`/past-exams/${round}`)
    await expect(page.getByRole('heading', { name: `第${round}回 過去問` })).toBeVisible()
    await expect(page.getByText('収録 180問（午前 90問・午後 90問）')).toBeVisible()
    const am = page.getByRole('button', { name: /^午前の問題を解く/ })
    const pm = page.getByRole('button', { name: /^午後の問題を解く/ })
    const all = page.getByRole('button', { name: /^全180問を解く/ })
    await expect(am).toContainText('問1〜90・90問')
    await expect(pm).toContainText('問91〜180・90問')
    await expect(all).toContainText('問1〜180')
    await expectNoHorizontalScroll(page)

    // 午前：問1から。2問解いて再読み込み → 同じ範囲の開始画面で「続きから」→ 問3
    await press(page, am)
    await expect(page).toHaveURL(new RegExp(`/past-exams/${round}\\?part=am$`))
    await expect(page.getByRole('heading', { name: `第${round}回 午前 過去問` })).toBeVisible()
    await expect(page.getByText('問1〜90・90問')).toBeVisible()
    await press(page, page.getByRole('button', { name: '問1から解く' }))
    expect((await current(page)).questionNumber).toBe(1)
    await expect(page.getByText('1 / 90問')).toBeVisible()
    await expect(page.locator('span', { hasText: /午前\s*第\d+回\s*問1$/ }).first()).toBeVisible()
    await answer(page, 'right')
    await press(page, nextBtn(page))
    await answer(page, 'wrong')
    await press(page, nextBtn(page))
    await page.reload()
    await expect(page.getByText('2問回答済み・残り88問')).toBeVisible()
    await press(page, page.getByRole('button', { name: '続きから解く' }))
    expect((await current(page)).questionNumber).toBe(3)

    // 保存先：午前は別キー。全問の記録には書き込まない
    const savedAm = await page.evaluate((r) => JSON.parse(localStorage.getItem('shinkyuu_pastexam_part_session_v1')!)[`${r}-am`], round)
    expect(savedAm.part).toBe('am')
    expect(savedAm.answers.map((a: { questionNumber: number }) => a.questionNumber)).toEqual([1, 2])
    expect(await page.evaluate(() => localStorage.getItem('shinkyuu_pastexam_session_v1'))).toBeNull()

    // 選択画面へ戻ると、午前の進み具合が出る
    await page.reload()
    await press(page, page.getByRole('button', { name: '← 午前・午後の選択へ' }))
    await expect(page).toHaveURL(new RegExp(`/past-exams/${round}$`))
    await expect(am).toContainText('途中・2問回答済み（次は問3）')

    // 午後：問91から。1問だけ解いて途中で採点 → 未回答89問
    await press(page, pm)
    await press(page, page.getByRole('button', { name: '問91から解く' }))
    expect((await current(page)).questionNumber).toBe(91)
    await answer(page, 'right')
    await press(page, page.getByRole('button', { name: 'ここまでで採点する（未回答89問）' }))
    await expect(page.getByText('途中までの採点（1 / 90問 回答）')).toBeVisible()
    await expect(page.getByText(/^1\s*\/ 90問 正解$/)).toBeVisible()
    await expect(page.getByText('正答率 1%')).toBeVisible()
    expect(await counts(page)).toEqual({ correct: 1, wrong: 0, unanswered: 89 })
    expect(await breakdownRow(page, '午後')).toEqual(['1', '0', '89', '1%'])
    expect(await breakdownRow(page, '午前')).toEqual(['途中（2 / 90問）'])
    expect(await breakdownRow(page, '全体')).toEqual(['午前・午後とも全問解くと表示'])
    await expect(page.getByText('ここまでの回答に間違いはありません')).toBeVisible()
    await expectNoHorizontalScroll(page)
    // 途中採点では記録を消さない・完了にしない
    const savedPm = await page.evaluate((r) => JSON.parse(localStorage.getItem('shinkyuu_pastexam_part_session_v1')!)[`${r}-pm`], round)
    expect(savedPm.completed).toBe(false)
    expect(savedPm.answers.length).toBe(1)
    await press(page, page.getByRole('button', { name: '続きから解く（問92）' }))
    expect((await current(page)).questionNumber).toBe(92)
  })

  test(`第${round}回：午前・午後を最後まで採点・間違えた問題の一覧・復習（元の結果は上書きしない）・全体の成績`, async ({ page }) => {
    // 各範囲とも、最後の1問の手前まで回答済みの状態を用意する（10問に1問を不正解）
    const seed: Record<string, unknown> = {}
    for (const part of ['am', 'pm'] as const) {
      const [first, last] = PART_RANGE[part]
      const answers = []
      for (let n = first; n < last; n++) answers.push(seedAnswer(round, n, isRightBy10(n)))
      seed[`${round}-${part}`] = { examRound: round, part, answers, completed: false, updatedAt: 1 }
    }
    // 全問の記録（既存のキー）も置いておき、午前・午後の操作で変わらないことを確かめる
    const fullBefore = JSON.stringify({ [round]: { examRound: round, answers: [seedAnswer(round, 1, true)], completed: false, updatedAt: 1 } })
    await page.evaluate(
      ([s, f]) => {
        localStorage.setItem('shinkyuu_pastexam_part_session_v1', s)
        localStorage.setItem('shinkyuu_pastexam_session_v1', f)
      },
      [JSON.stringify(seed), fullBefore],
    )

    let amCorrect = 0
    for (const part of ['am', 'pm'] as const) {
      const [first, last] = PART_RANGE[part]
      const label = part === 'am' ? '午前' : '午後'
      await page.goto(`/past-exams/${round}?part=${part}`)
      await expect(page.getByText('89問回答済み・残り1問')).toBeVisible()
      await press(page, page.getByRole('button', { name: '続きから解く' }))
      expect((await current(page)).questionNumber).toBe(last)
      await answer(page, 'wrong') // 最後の問題（問90・問180）は不正解
      await expect(nextBtn(page)).toHaveText('結果を見る')
      await press(page, nextBtn(page))

      const wrongNums: number[] = []
      for (let n = first; n <= last; n++) if (n === last || !isRightBy10(n)) wrongNums.push(n)
      const correct = 90 - wrongNums.length
      if (part === 'am') amCorrect = correct
      await expect(page.getByRole('heading', { name: `第${round}回 ${label} 過去問` })).toBeVisible()
      await expect(page.getByText(new RegExp(`^${correct}\\s*/ 90問 正解$`))).toBeVisible()
      await expect(page.getByText(`正答率 ${pct(correct, 90)}`)).toBeVisible()
      expect(await counts(page)).toEqual({ correct, wrong: wrongNums.length, unanswered: 0 })
      expect(await breakdownRow(page, label)).toEqual([String(correct), String(wrongNums.length), '0', pct(correct, 90)])
      if (part === 'am') {
        expect(await breakdownRow(page, '午後')).toEqual(['途中（89 / 90問）'])
        expect(await breakdownRow(page, '全体')).toEqual(['午前・午後とも全問解くと表示'])
      } else {
        // 両方解いたので全体（午前＋午後）の成績が出る
        const total = amCorrect + correct
        expect(await breakdownRow(page, '午前')).toEqual([String(amCorrect), String(90 - amCorrect), '0', pct(amCorrect, 90)])
        expect(await breakdownRow(page, '全体')).toEqual([String(total), String(180 - total), '0', pct(total, 180)])
      }
      await expect(page.getByText(`間違えた問題　${wrongNums.length}問`)).toBeVisible()

      // 間違えた問題の一覧：問題番号・科目・問題文・自分の回答・正答・解説
      await press(page, page.getByText(`間違えた${wrongNums.length}問の問題と解説を見る`))
      const items = page.getByTestId('answer-list').locator(':scope > li')
      await expect(items).toHaveCount(wrongNums.length)
      for (const [i, n] of wrongNums.entries()) {
        const q = examQ(round, n)
        const li = items.nth(i)
        await expect(li).toHaveAttribute('data-qid', q.id)
        await expect(li).toContainText(`問${n}`)
        await expect(li.locator('span.rounded-full').first()).not.toBeEmpty() // 科目
        await expect(li).toContainText(q.questionText.slice(0, 20))
        await expect(li.locator('dd').nth(0)).toHaveText(CIRCLED[wrongIndex(q)])
        await expect(li.locator('dd').nth(1)).toHaveText(accepted(q).map((x) => CIRCLED[x]).join('・'))
        await expect(li).toContainText(q.explanation.slice(0, 30))
      }
      await expectNoHorizontalScroll(page)

      // 復習：最初の1問だけ不正解、残りは正解
      const savedBefore = await page.evaluate(() => localStorage.getItem('shinkyuu_pastexam_part_session_v1'))
      await press(page, page.getByRole('button', { name: `間違えた${wrongNums.length}問を復習` }))
      for (let i = 0; i < wrongNums.length; i++) {
        expect((await current(page)).questionNumber).toBe(wrongNums[i])
        await answer(page, i === 0 ? 'wrong' : 'right')
        await press(page, nextBtn(page))
      }
      await expect(page.getByText('苦手復習 完了')).toBeVisible()
      await expect(page.getByText(new RegExp(`^${wrongNums.length - 1}\\s*/ ${wrongNums.length}問 正解$`))).toBeVisible()
      await expect(page.getByText('まだ間違えた問題　1問')).toBeVisible()
      await press(page, page.getByText(`復習した${wrongNums.length}問の回答と解説を見る`))
      const reviewItems = page.getByTestId('answer-list').locator(':scope > li')
      await expect(reviewItems).toHaveCount(wrongNums.length)
      await expect(reviewItems.nth(0)).toContainText('不正解')
      await expect(reviewItems.nth(1)).toContainText('正解')
      // 復習は保存データを変えない
      expect(await page.evaluate(() => localStorage.getItem('shinkyuu_pastexam_part_session_v1'))).toBe(savedBefore)
      // 結果へ戻ると元の結果のまま
      await press(page, page.getByRole('button', { name: `第${round}回 ${label}の結果へ` }))
      await expect(page.getByText(new RegExp(`^${correct}\\s*/ 90問 正解$`))).toBeVisible()
      await expect(page.getByText(`間違えた問題　${wrongNums.length}問`)).toBeVisible()

      const saved = JSON.parse(savedBefore!)[`${round}-${part}`]
      expect(saved.completed).toBe(true)
      expect(saved.answers.length).toBe(90)
    }

    // 全問の記録は1文字も変わっていない
    expect(await page.evaluate(() => localStorage.getItem('shinkyuu_pastexam_session_v1'))).toBe(fullBefore)

    // 選択画面：両方完了で合計を表示。再読み込みしても同じ
    await page.goto(`/past-exams/${round}`)
    await expect(page.getByRole('button', { name: /^午前の問題を解く/ })).toContainText(`完了・${amCorrect} / 90問正解`)
    await expect(page.getByTestId('both-parts-score')).toBeVisible()
    await page.reload()
    await expect(page.getByTestId('both-parts-score')).toBeVisible()
  })

  test(`第${round}回：全180問の採点に午前・午後別の成績が出る`, async ({ page }) => {
    const answers = []
    for (let n = 1; n < 180; n++) answers.push(seedAnswer(round, n, n % 4 !== 0)) // 4問に1問を不正解
    await page.evaluate(
      (v) => localStorage.setItem('shinkyuu_pastexam_session_v1', v),
      JSON.stringify({ [round]: { examRound: round, answers, completed: false, updatedAt: 1 } }),
    )
    await page.goto(`/past-exams/${round}`)
    await expect(page.getByRole('button', { name: /^全180問を解く/ })).toContainText('途中・179問回答済み（次は問180）')
    await press(page, page.getByRole('button', { name: /^全180問を解く/ }))
    await press(page, page.getByRole('button', { name: '続きから解く' }))
    expect((await current(page)).questionNumber).toBe(180)
    await answer(page, 'right')
    await press(page, nextBtn(page))
    // 午前：問1〜90 のうち4の倍数（22問）が不正解、午後：問91〜179 のうち4の倍数（22問）が不正解・問180は正解
    const amWrong = 22
    const pmWrong = 22
    await expect(page.getByText(new RegExp(`^${180 - amWrong - pmWrong}\\s*/ 180問 正解$`))).toBeVisible()
    expect(await breakdownRow(page, '午前')).toEqual([String(90 - amWrong), String(amWrong), '0', pct(90 - amWrong, 90)])
    expect(await breakdownRow(page, '午後')).toEqual([String(90 - pmWrong), String(pmWrong), '0', pct(90 - pmWrong, 90)])
    expect(await breakdownRow(page, '全体')).toEqual([
      String(180 - amWrong - pmWrong),
      String(amWrong + pmWrong),
      '0',
      pct(180 - amWrong - pmWrong, 180),
    ])
    expect(await page.evaluate(() => localStorage.getItem('shinkyuu_pastexam_part_session_v1'))).toBeNull()
  })
}

test('HOME：午前・午後の途中もHOMEの「続きから解く」に出て、正しい問題から再開できる', async ({ page }) => {
  const answers = []
  for (let n = 91; n <= 120; n++) answers.push(seedAnswer(34, n, true))
  await page.evaluate(
    (v) => localStorage.setItem('shinkyuu_pastexam_part_session_v1', v),
    JSON.stringify({ '34-pm': { examRound: 34, part: 'pm', answers, completed: false, updatedAt: Date.now() } }),
  )
  await page.goto('/')
  await expect(page.getByText('第34回 午後 過去問')).toBeVisible()
  await press(page, page.getByRole('link', { name: /問121から再開/ }))
  expect((await current(page)).questionNumber).toBe(121)
  await expect(page).toHaveURL(/\/past-exams\/34\?part=pm$/)
})

test('過去問一覧：午前・午後・全問の進み具合を別々に表示する', async ({ page }) => {
  await page.evaluate(() => {
    localStorage.setItem(
      'shinkyuu_pastexam_part_session_v1',
      JSON.stringify({ '33-am': { examRound: 33, part: 'am', answers: [{ questionId: '33-001', questionNumber: 1, correct: true }], completed: false, updatedAt: 1 } }),
    )
    localStorage.setItem(
      'shinkyuu_pastexam_session_v1',
      JSON.stringify({ '33': { examRound: 33, answers: [{ questionId: '33-001', questionNumber: 1, correct: true }, { questionId: '33-002', questionNumber: 2, correct: false }], completed: false, updatedAt: 1 } }),
    )
  })
  await page.goto('/past-exams')
  const card = page.locator('a[href="/past-exams/33"]')
  await expect(card).toContainText('午前：途中・1 / 90問（次は問2）')
  await expect(card).toContainText('全問：途中・2 / 180問（次は問3）')
  await expectNoHorizontalScroll(page)
})

test('表示：範囲の選択・結果・間違えた問題の一覧のスクリーンショット', async ({ page }, info) => {
  const answers = []
  for (let n = 1; n < 90; n++) answers.push(seedAnswer(34, n, isRightBy10(n)))
  await page.evaluate(
    (v) => localStorage.setItem('shinkyuu_pastexam_part_session_v1', v),
    JSON.stringify({ '34-am': { examRound: 34, part: 'am', answers, completed: false, updatedAt: 1 } }),
  )
  await page.goto('/past-exams/34')
  await page.screenshot({ path: `test-results/sprint25-${info.project.name}-1-select.png`, fullPage: true })
  await press(page, page.getByRole('button', { name: /^午前の問題を解く/ }))
  await press(page, page.getByRole('button', { name: '続きから解く' }))
  await answer(page, 'right')
  await press(page, nextBtn(page))
  await page.screenshot({ path: `test-results/sprint25-${info.project.name}-2-result.png`, fullPage: true })
  await press(page, page.getByText(/問の問題と解説を見る$/))
  await page.screenshot({ path: `test-results/sprint25-${info.project.name}-3-list.png`, fullPage: true })
  await expectNoHorizontalScroll(page)
})

/* ── Sprint 26：午前・午後の合算の検証 ──
   - 午後を先に完了 → 午前を完了でも、全体（180問）の成績が正しい
   - 午前は途中採点だけ → 午後を完了：途中採点は完了扱いにせず、全体には合算しない
     （その後に午前を最後まで解くと合算される）
   - 復習から結果へ戻っても全体の行は元のまま。再読み込み後の「前回の結果を見る」でも同じ
   - 合算した側をやり直す（もう一度90問解く）と、合計は出なくなる */
/** 問題番号 n の正誤の決め方（午前・午後で違う割合にして、取り違えを見つけやすくする） */
const rightAm = (n: number) => n % 3 !== 0 // 午前：問1〜89 のうち29問不正解
const rightPm = (n: number) => n % 5 !== 0 // 午後：問91〜179 のうち17問不正解
const amCorrectOf = (lastRight: boolean) => [...Array(89)].filter((_, i) => rightAm(i + 1)).length + (lastRight ? 1 : 0)
const pmCorrectOf = (lastRight: boolean) => [...Array(89)].filter((_, i) => rightPm(i + 91)).length + (lastRight ? 1 : 0)

function partSeed(round: number, part: 'am' | 'pm', count: number, completed = false) {
  const [first] = PART_RANGE[part]
  const answers = []
  for (let n = first; n < first + count; n++) answers.push(seedAnswer(round, n, part === 'am' ? rightAm(n) : rightPm(n)))
  return { examRound: round, part, answers, completed, updatedAt: 1 }
}

/** 範囲の最後の1問（問90／問180）を正解で解いて結果画面へ */
async function finishLast(page: Page, round: number, part: 'am' | 'pm') {
  await page.goto(`/past-exams/${round}?part=${part}`)
  await expect(page.getByText('89問回答済み・残り1問')).toBeVisible()
  await press(page, page.getByRole('button', { name: '続きから解く' }))
  expect((await current(page)).questionNumber).toBe(PART_RANGE[part][1])
  await answer(page, 'right')
  await press(page, nextBtn(page))
}

const scoreRow = (c: number, t: number) => [String(c), String(t - c), '0', pct(c, t)]

for (const round of ROUNDS) {
  test(`第${round}回：午後を先に完了 → 午前を完了すると、全体180問の成績が正しく出る`, async ({ page }) => {
    await page.evaluate(
      (v) => localStorage.setItem('shinkyuu_pastexam_part_session_v1', v),
      JSON.stringify({ [`${round}-pm`]: partSeed(round, 'pm', 89), [`${round}-am`]: partSeed(round, 'am', 89) }),
    )
    const am = amCorrectOf(true)
    const pm = pmCorrectOf(true)
    await finishLast(page, round, 'pm')
    expect(await breakdownRow(page, '午後')).toEqual(scoreRow(pm, 90))
    expect(await breakdownRow(page, '午前')).toEqual(['途中（89 / 90問）'])
    expect(await breakdownRow(page, '全体')).toEqual(['午前・午後とも全問解くと表示'])

    await finishLast(page, round, 'am')
    expect(await counts(page)).toEqual({ correct: am, wrong: 90 - am, unanswered: 0 })
    expect(await breakdownRow(page, '午前')).toEqual(scoreRow(am, 90))
    expect(await breakdownRow(page, '午後')).toEqual(scoreRow(pm, 90))
    expect(await breakdownRow(page, '全体')).toEqual(scoreRow(am + pm, 180))

    await page.goto(`/past-exams/${round}`)
    await expect(page.getByTestId('both-parts-score')).toHaveText(
      `午前＋午後の合計　${am + pm} / 180問正解（正答率 ${pct(am + pm, 180)}）`,
    )
  })

  test(`第${round}回：午前は途中採点だけ → 午後を完了しても全体には合算しない（午前を完了すると合算）`, async ({ page }) => {
    await page.evaluate(
      (v) => localStorage.setItem('shinkyuu_pastexam_part_session_v1', v),
      JSON.stringify({ [`${round}-am`]: partSeed(round, 'am', 40), [`${round}-pm`]: partSeed(round, 'pm', 89) }),
    )
    // 午前：1問解いて途中採点（41問回答・未回答49問）
    await page.goto(`/past-exams/${round}?part=am`)
    await press(page, page.getByRole('button', { name: '続きから解く' }))
    expect((await current(page)).questionNumber).toBe(41)
    await answer(page, 'right')
    await press(page, page.getByRole('button', { name: 'ここまでで採点する（未回答49問）' }))
    await expect(page.getByText('途中までの採点（41 / 90問 回答）')).toBeVisible()
    expect((await counts(page)).unanswered).toBe(49)
    const amSaved = await page.evaluate((r) => JSON.parse(localStorage.getItem('shinkyuu_pastexam_part_session_v1')!)[`${r}-am`], round)
    expect(amSaved.completed).toBe(false)
    expect(amSaved.answers.length).toBe(41)

    // 午後を完了：午前は「途中」のまま、全体は出さない
    const pm = pmCorrectOf(true)
    await finishLast(page, round, 'pm')
    expect(await breakdownRow(page, '午後')).toEqual(scoreRow(pm, 90))
    expect(await breakdownRow(page, '午前')).toEqual(['途中（41 / 90問）'])
    expect(await breakdownRow(page, '全体')).toEqual(['午前・午後とも全問解くと表示'])
    await page.goto(`/past-exams/${round}`)
    await expect(page.getByRole('button', { name: /^午前の問題を解く/ })).toContainText('途中・41問回答済み（次は問42）')
    await expect(page.getByTestId('both-parts-score')).toHaveCount(0)

    // 午前の残りを保存データで用意し、最後の1問を解くと合算される
    await page.evaluate(
      ([r, v]) => {
        const all = JSON.parse(localStorage.getItem('shinkyuu_pastexam_part_session_v1')!)
        all[`${r}-am`] = JSON.parse(v as string)
        localStorage.setItem('shinkyuu_pastexam_part_session_v1', JSON.stringify(all))
      },
      [round, JSON.stringify(partSeed(round, 'am', 89))],
    )
    await finishLast(page, round, 'am')
    const am = amCorrectOf(true)
    expect(await breakdownRow(page, '全体')).toEqual(scoreRow(am + pm, 180))
  })
}

test('第34回：合算後の復習・再読み込み・やり直しでも全体の成績を取り違えない', async ({ page }) => {
  await page.evaluate(
    (v) => localStorage.setItem('shinkyuu_pastexam_part_session_v1', v),
    JSON.stringify({ '34-am': partSeed(34, 'am', 90, true), '34-pm': partSeed(34, 'pm', 89) }),
  )
  const am = amCorrectOf(rightAm(90))
  const pm = pmCorrectOf(true)
  await finishLast(page, 34, 'pm')
  expect(await breakdownRow(page, '全体')).toEqual(scoreRow(am + pm, 180))
  const savedBefore = await page.evaluate(() => localStorage.getItem('shinkyuu_pastexam_part_session_v1'))

  // 復習（全部正解）→ 結果へ戻る：午後・全体とも元のまま、保存データも変わらない
  const wrong = 90 - pm
  await press(page, page.getByRole('button', { name: `間違えた${wrong}問を復習` }))
  for (let i = 0; i < wrong; i++) {
    await answer(page, 'right')
    await press(page, nextBtn(page))
  }
  await expect(page.getByText(new RegExp(`^${wrong}\\s*/ ${wrong}問 正解$`))).toBeVisible()
  await press(page, page.getByRole('button', { name: '第34回 午後の結果へ' }))
  expect(await breakdownRow(page, '午後')).toEqual(scoreRow(pm, 90))
  expect(await breakdownRow(page, '全体')).toEqual(scoreRow(am + pm, 180))
  expect(await page.evaluate(() => localStorage.getItem('shinkyuu_pastexam_part_session_v1'))).toBe(savedBefore)

  // 再読み込み → 午後の「前回の結果を見る」でも同じ
  await page.reload()
  await press(page, page.getByRole('button', { name: '前回の結果を見る' }))
  expect(await breakdownRow(page, '午後')).toEqual(scoreRow(pm, 90))
  expect(await breakdownRow(page, '全体')).toEqual(scoreRow(am + pm, 180))

  // 午前をやり直すと午前の記録は消え、合計は出なくなる（午後の記録は残る）
  await page.goto('/past-exams/34?part=am')
  await press(page, page.getByRole('button', { name: '前回の結果を見る' }))
  expect(await breakdownRow(page, '全体')).toEqual(scoreRow(am + pm, 180))
  await press(page, page.getByRole('button', { name: 'もう一度90問解く' }))
  await expect(page.getByRole('button', { name: '問1から解く' })).toBeVisible() // やり直しは午前の開始画面へ戻る（従来どおり）
  await page.goto('/past-exams/34')
  await expect(page.getByTestId('both-parts-score')).toHaveCount(0)
  await expect(page.getByRole('button', { name: /^午後の問題を解く/ })).toContainText(`完了・${pm} / 90問正解`)
})

/* ── Sprint 26：選択肢を押したとき「回答する」が下部メニューに隠れない ──
   ボタンを中央へスクロールする press() は使わず、利用者と同じく「見えている選択肢を押しただけ」の状態で確かめる。
   対象は、修正前に390px幅で「回答する」が下部メニューの裏に来ていた問題（第30回 問160・第29回 問86・第33回 問84）、
   一部が重なっていた問題（第32回 問127）、最も長い問題（第31回 問156） */
for (const [round, num] of [[30, 160], [29, 86], [33, 84], [32, 127], [31, 156]] as const) {
  test(`第${round}回 問${num}：選択肢を押すと「回答する」が下部メニューの上に見える`, async ({ page }) => {
    const part = num <= 90 ? 'am' : 'pm'
    const first = PART_RANGE[part][0]
    const answers = []
    for (let n = first; n < num; n++) answers.push(seedAnswer(round, n, true))
    await page.evaluate(
      (v) => localStorage.setItem('shinkyuu_pastexam_part_session_v1', v),
      JSON.stringify({ [`${round}-${part}`]: { examRound: round, part, answers, completed: false, updatedAt: 1 } }),
    )
    await page.goto(`/past-exams/${round}?part=${part}`)
    await press(page, page.getByRole('button', { name: '続きから解く' }))
    expect((await current(page)).questionNumber).toBe(num)
    await page.evaluate(() => window.scrollTo(0, 0))
    await choices(page).nth(3).click() // Playwright は「見える位置まで」だけスクロールして押す
    const r = await answerBtn(page).evaluate((el) => {
      const b = el.getBoundingClientRect()
      const nav = document.querySelector('nav[aria-label="下部ナビゲーション"]')!.getBoundingClientRect()
      const navTop = nav.height > 0 ? nav.top : window.innerHeight // PC では下部メニューを表示しない
      const hit = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2)
      return { top: b.top, bottom: b.bottom, navTop, hit: hit === el }
    })
    expect(r.top, '画面の上にはみ出さない').toBeGreaterThanOrEqual(0)
    expect(r.bottom, '下部メニューより上に全体が出ている').toBeLessThanOrEqual(r.navTop)
    expect(r.hit, '中央を押すと「回答する」に当たる').toBe(true)
    await answerBtn(page).click()
    await expect(page.getByText(/^(正解|不正解)$/).first()).toBeVisible()
  })
}
