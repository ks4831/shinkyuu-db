/* ──────────────────────────────────────────────────────────────
   オリジナル模擬試験②の科目別モードと解答途中の保存の画面テスト（pc / sp390）
   - 開始画面の2モード、科目選択の12カード、問題の絞り込みと順序、科目内の番号
   - 全問正解・全問不正解、解説、まちがえた問題の解き直し、再挑戦、科目選択へ戻る、再読み込み後の見直し
   - 科目の切り替え、全問と科目別の成績の分離、過去の成績 v1〜v5 の保持
   - 全問・科目別の途中保存と再開、壊れた途中データ
   全100問の通し受験は e2e/original-mock.spec.ts で確かめる。問題データは読むだけで変更しない。
   スクリーンショット：環境変数 E2E_SHOT_DIR を指定したときだけ保存する。
   ────────────────────────────────────────────────────────────── */
import { test, expect, type Page, type Locator } from '@playwright/test'
import { readFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'

type Q = { id: string; questionNumber: number; subject: string; questionText: string; choices: string[]; answerIndex: number; choiceNotes: string[]; point: string; sources: string[] }
const QS = (JSON.parse(readFileSync(path.join(process.cwd(), 'src', 'data', 'originalMocks', 'original-mock-02.json'), 'utf8')) as { questions: Q[] }).questions
const MOCK_ID = 'original-mock-02'
const LEGACY = ['v1', 'v2', 'v3', 'v4', 'v5'].map((v) => `shinkyuu_original_mock_results_${v}`)
const V5 = LEGACY[4]
const REVIEW = 'shinkyuu_original_mock_review_v1'
const SUBJECT_KEY = 'shinkyuu_original_mock_subject_results_v1'
const PROGRESS = 'shinkyuu_original_mock_progress_v1'
const SUBJECTS: [string, number][] = [
  ['経絡経穴概論', 20],
  ['はり理論', 10],
  ['きゅう理論', 10],
  ['臨床医学各論', 22],
  ['臨床医学総論', 5],
  ['リハビリテーション医学', 1],
  ['医療概論', 4],
  ['衛生学・公衆衛生学', 5],
  ['関係法規', 4],
  ['解剖学', 7],
  ['生理学', 7],
  ['病理学概論', 5],
]
const of = (subject: string) => QS.filter((q) => q.subject === subject)
const wrongOf = (q: Q) => (q.answerIndex + 1) % 4

const SHOT_DIR = process.env.E2E_SHOT_DIR
async function shot(p: Page, name: string, fullPage = false) {
  if (!SHOT_DIR) return
  const dir = path.join(SHOT_DIR, test.info().project.name)
  mkdirSync(dir, { recursive: true })
  await p.screenshot({ path: path.join(dir, `subject-${name}.png`), fullPage })
}

const choices = (p: Page) => p.locator('button[aria-pressed]')
const answerBtn = (p: Page) => p.getByRole('button', { name: /^(回答する|この回答に変更する)$/ })
const nextBtn = (p: Page) => p.getByRole('button', { name: /^(次の問題へ →|あとで解く →)$/ })
const finishBtn = (p: Page) => p.getByRole('button', { name: '採点する', exact: true })
const btn = (p: Page | Locator, name: string | RegExp) => p.getByRole('button', typeof name === 'string' ? { name, exact: true } : { name })
const subjectCard = (p: Page, s: string) => p.getByRole('listitem', { name: s, exact: true })
const reviewCard = (p: Page, n: number) => p.locator('details', { has: p.getByText(`第${n}問`, { exact: true }) })
const score = (p: Page, a: number, b: number) => p.locator('p', { hasText: new RegExp(`^${a} / ${b}問$`) })

/** 他の要素に覆われずに押せることを確かめてから押す */
async function tap(p: Page, loc: Locator) {
  await loc.evaluate((el) => el.scrollIntoView({ block: 'center' }))
  const covered = await loc.evaluate((el) => {
    const r = el.getBoundingClientRect()
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
    return !(hit && (hit === el || el.contains(hit)))
  })
  expect(covered, 'ボタンが他の要素に覆われていない').toBe(false)
  await loc.click()
}
async function noHScroll(p: Page) {
  expect(await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth), '横スクロールが出ない').toBeLessThanOrEqual(0)
}
async function answer(p: Page, i: number) {
  await tap(p, choices(p).nth(i))
  await tap(p, answerBtn(p))
}
async function openSubjects(p: Page) {
  await p.goto('/original-mock/02')
  await tap(p, btn(p, '科目を選ぶ'))
  await expect(p.getByRole('heading', { name: '科目を選ぶ', exact: true })).toBeVisible()
}
async function startSubject(p: Page, s: string) {
  await openSubjects(p)
  await tap(p, btn(subjectCard(p, s), 'この科目を解く'))
}
/** 今の問題が q で、科目内の第 pos 問として表示されていること */
async function expectAt(p: Page, q: Q, pos: number, total: number) {
  await expect(p.getByText(new RegExp(`^第${pos}問$`)).first()).toBeVisible()
  await expect(p.getByText(new RegExp(`^${pos} / ${total}問`))).toBeVisible()
  await expect(p.locator('h2', { hasText: q.questionText.slice(0, 20) })).toBeVisible()
  await expect(p.getByText(q.subject, { exact: true }).first()).toBeVisible()
  for (let i = 0; i < 4; i++) await expect(choices(p).nth(i)).toContainText(q.choices[i])
}
async function solveSubject(p: Page, s: string, pick: (q: Q, i: number) => number | null) {
  const list = of(s)
  await startSubject(p, s)
  let skipped = false
  for (let i = 0; i < list.length; i++) {
    await expectAt(p, list[i], i + 1, list.length)
    const c = pick(list[i], i)
    if (c === null) skipped = true
    else await answer(p, c)
    if (i < list.length - 1) await tap(p, nextBtn(p))
  }
  await tap(p, finishBtn(p))
  if (skipped) await tap(p, btn(p, 'このまま採点する'))
  await expect(p.getByRole('heading', { name: '結果', exact: true })).toBeVisible()
}

const getItem = (p: Page, k: string) => p.evaluate((key) => localStorage.getItem(key), k)
const setItems = (p: Page, items: [string, string][]) => p.evaluate((xs) => xs.forEach(([k, v]) => localStorage.setItem(k, v)), items)

const errors: string[] = []
test.beforeEach(async ({ page }) => {
  errors.length = 0
  page.on('pageerror', (e) => errors.push(String(e)))
  // テストで遮断した計測タグの読み込み失敗以外のコンソールエラーも不合格にする。
  // 例外：Windows のローカルビルドは先読みファイルを別の階層に出力するので、ローカル配信の __next.*.txt の404だけ除く（本番では除かない）
  page.on('console', (m) => {
    const url = m.location().url
    const blocked = /google-analytics\.com|googletagmanager\.com/.test(url)
    const localPrefetch = /^http:\/\/127\.0\.0\.1:\d+\/.*__next\.[^/]*\.txt/.test(url)
    if (m.type() === 'error' && !blocked && !localPrefetch) errors.push(`console: ${m.text()} ${url}`)
  })
  await page.route(/google-analytics\.com|googletagmanager\.com/, (r) => r.abort())
  await page.goto('/')
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
})
test.afterEach(() => {
  expect(errors, '画面のスクリプトエラーがない').toEqual([])
})

test('開始画面に2つのモード、科目選択に12枚のカード（科目名・問題数・この科目を解く）', async ({ page }) => {
  await page.goto('/original-mock/02')
  await expect(page.getByRole('heading', { name: '① 全100問に挑戦' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '② 科目別に挑戦' })).toBeVisible()
  await expect(btn(page, '解き始める')).toBeVisible()
  await expect(page.getByText('解答途中の内容は、この端末・ブラウザに自動保存されます。別の端末への引き継ぎはできません。', { exact: false })).toBeVisible()
  await shot(page, '01-start', true)
  await noHScroll(page)
  await tap(page, btn(page, '科目を選ぶ'))
  await expect(page.getByRole('listitem').filter({ has: page.getByRole('button', { name: 'この科目を解く' }) })).toHaveCount(12)
  for (const [s, n] of SUBJECTS) {
    const c = subjectCard(page, s)
    await expect(c.getByRole('heading', { name: s, exact: true })).toBeVisible()
    await expect(c.getByText(`${n}問`, { exact: true })).toBeVisible()
    await expect(btn(c, 'この科目を解く')).toBeVisible()
  }
  await shot(page, '02-subjects', true)
  await noHScroll(page)
  await tap(page, btn(page, '開始画面に戻る'))
  await expect(page.getByRole('heading', { name: '② 科目別に挑戦' })).toBeVisible()
})

test('12科目すべて：その科目の問題だけが元の順序で出て、全問正解で満点になる', async ({ page }) => {
  test.setTimeout(420_000)
  for (const [s, n] of SUBJECTS) {
    await solveSubject(page, s, (q) => q.answerIndex)
    await expect(score(page, n, n)).toBeVisible()
    await expect(page.getByText('正答率 100%', { exact: true })).toBeVisible()
    await expect(page.locator('table')).toHaveCount(0)
    await expect(page.locator('details')).toHaveCount(n)
    await expect(page.getByText(`オリジナル模擬試験②・${s}`, { exact: false }).first()).toBeVisible()
  }
  const saved = JSON.parse((await getItem(page, SUBJECT_KEY))!)[MOCK_ID]
  for (const [s, n] of SUBJECTS) expect(saved[s]).toMatchObject({ correct: n, total: n, wrongIds: [] })
  expect(await getItem(page, V5), '全問の成績に保存しない').toBeNull()
  expect(await getItem(page, REVIEW)).toBeNull()
  expect(JSON.parse((await getItem(page, PROGRESS))!), '採点後に途中データが残らない').toEqual({})
})

test('全問不正解：解説・元の問題番号・解き直し・再挑戦・科目選択へ戻る・再読み込み後の見直し', async ({ page }) => {
  test.setTimeout(300_000)
  const s = 'はり理論'
  const list = of(s)
  await solveSubject(page, s, wrongOf)
  await expect(score(page, 0, 10)).toBeVisible()
  await expect(page.getByText('正答率 0%', { exact: true })).toBeVisible()
  await expect(page.locator('details')).toHaveCount(10)
  await shot(page, '03-result-wrong', true)
  await noHScroll(page)

  // 復習：科目内の番号と元の番号、自分の回答・正答・解説・根拠資料
  const q3 = list[2]
  const c3 = reviewCard(page, 3)
  await expect(c3.getByText(`元の第${q3.questionNumber}問`, { exact: true })).toBeVisible()
  await tap(page, c3.locator('summary'))
  await expect(c3.locator('li', { hasText: '（正答）' })).toContainText(q3.choices[q3.answerIndex])
  await expect(c3.locator('li', { hasText: '（あなたの回答）' })).toContainText(q3.choices[wrongOf(q3)])
  await expect(c3.getByText(q3.choiceNotes[q3.answerIndex], { exact: true })).toBeVisible()
  await expect(c3.locator('div', { hasText: /^根拠資料：/ }).filter({ hasText: q3.sources.join('／') }).last()).toBeVisible()
  await shot(page, '04-review-open', true)
  await noHScroll(page)

  // 問題の画面での見直し：回答は変更できず、元の番号が見える
  await tap(page, btn(c3, '第3問へ戻る'))
  await expect(page.getByText(new RegExp(`^見直し\\s+第3問（元の第${q3.questionNumber}問）$`))).toBeVisible()
  for (let i = 0; i < 4; i++) await expect(choices(page).nth(i)).toBeDisabled()
  await expect(btn(page, '科目選択に戻る')).toHaveCount(0)
  await tap(page, btn(page, '結果に戻る'))

  // まちがえた問題の解き直し：保存はしない、科目内の番号のまま
  const savedBefore = await getItem(page, SUBJECT_KEY)
  await tap(page, btn(page, 'まちがえた10問を解き直す'))
  await expect(page.getByText(new RegExp(`^解き直し\\s+第1問（元の第${list[0].questionNumber}問）$`))).toBeVisible()
  for (let i = 0; i < 10; i++) {
    await answer(page, i < 8 ? list[i].answerIndex : wrongOf(list[i]))
    if (i < 9) await tap(page, nextBtn(page))
  }
  await tap(page, finishBtn(page))
  await expect(score(page, 8, 10)).toBeVisible()
  expect(await getItem(page, SUBJECT_KEY), '解き直しは結果を変えない').toBe(savedBefore)
  // 解き直しの解き直しでも、番号は科目内のまま
  await tap(page, btn(page, 'まちがえた2問を解き直す'))
  await expect(page.getByText(new RegExp(`^解き直し\\s+第9問（元の第${list[8].questionNumber}問）$`))).toBeVisible()
  await expect(page.getByText(/^1 \/ 2問/)).toBeVisible()
  await answer(page, list[8].answerIndex)
  await tap(page, nextBtn(page))
  await answer(page, list[9].answerIndex)
  await tap(page, finishBtn(page))
  await expect(score(page, 2, 2)).toBeVisible()

  // 同じ科目に再挑戦
  await tap(page, btn(page, 'はり理論に再挑戦する'))
  await expectAt(page, list[0], 1, 10)
  for (let i = 0; i < 10; i++) {
    await answer(page, i === 4 ? wrongOf(list[i]) : list[i].answerIndex)
    if (i < 9) await tap(page, nextBtn(page))
  }
  await tap(page, finishBtn(page))
  await expect(score(page, 9, 10)).toBeVisible()
  await expect(page.getByText('正答率 90%', { exact: true })).toBeVisible()

  // 科目選択へ戻ると結果が出て、再読み込み後も解説を見直せる
  await tap(page, btn(page, '科目選択に戻る'))
  await expect(subjectCard(page, s).getByText('9 / 10問（90%）')).toBeVisible()
  await shot(page, '05-subjects-after', true)
  await page.reload()
  await tap(page, btn(page, '科目を選ぶ'))
  await tap(page, btn(subjectCard(page, s), '前回の結果と解説を見る'))
  await expect(score(page, 9, 10)).toBeVisible()
  await expect(page.locator('details')).toHaveCount(1)
  const c5 = reviewCard(page, 5)
  await tap(page, c5.locator('summary'))
  await expect(c5.locator('li', { hasText: '（あなたの回答）' })).toContainText(list[4].choices[wrongOf(list[4])])
})

test('1問だけの科目と未回答：リハビリテーション医学の不正解、関係法規の未回答は不正解として数える', async ({ page }) => {
  await solveSubject(page, 'リハビリテーション医学', wrongOf)
  await expect(score(page, 0, 1)).toBeVisible()
  await expect(btn(page, 'まちがえた1問を解き直す')).toBeVisible()

  const list = of('関係法規')
  await startSubject(page, '関係法規')
  await answer(page, list[0].answerIndex)
  for (let i = 1; i < list.length; i++) await tap(page, nextBtn(page))
  await tap(page, finishBtn(page))
  await expect(page.getByText(/^未回答の問題が3問あります（第2・3・4問）。$/)).toBeVisible()
  await tap(page, btn(page, 'このまま採点する'))
  await expect(score(page, 1, 4)).toBeVisible()
  await expect(page.getByText('正答率 25%', { exact: true })).toBeVisible()
  await expect(page.locator('details')).toHaveCount(3)
  await page.reload()
  await tap(page, btn(page, '科目を選ぶ'))
  await tap(page, btn(subjectCard(page, '関係法規'), '前回の結果と解説を見る'))
  await tap(page, reviewCard(page, 2).locator('summary'))
  await expect(reviewCard(page, 2).getByText('あなたの回答：未回答', { exact: true })).toBeVisible()
})

test('科目の切り替え：別の科目の回答が混ざらず、それぞれ続きから再開できる', async ({ page }) => {
  const hari = of('はり理論')
  const kyu = of('きゅう理論')
  await startSubject(page, 'はり理論')
  await answer(page, hari[0].answerIndex)
  await tap(page, nextBtn(page))
  await answer(page, wrongOf(hari[1]))
  await tap(page, nextBtn(page))
  await expect(page.getByText('途中の回答は自動で保存されます。')).toBeVisible()
  await shot(page, '06-question-subject', true)
  await noHScroll(page)
  await tap(page, btn(page, '科目選択に戻る'))

  await expect(btn(subjectCard(page, 'はり理論'), '続きから解く（回答済み 2 / 10問）')).toBeVisible()
  await expect(btn(subjectCard(page, 'きゅう理論'), 'この科目を解く')).toBeVisible()
  await shot(page, '07-subjects-progress', true)
  await tap(page, btn(subjectCard(page, 'きゅう理論'), 'この科目を解く'))
  await expectAt(page, kyu[0], 1, 10)
  await expect(page.getByText('（回答済み 0）', { exact: false })).toBeVisible()
  await answer(page, wrongOf(kyu[0]))

  await page.reload()
  await expect(page.getByText('途中の科目が2つあります。', { exact: false })).toBeVisible()
  await tap(page, btn(page, '科目を選ぶ'))
  await tap(page, btn(subjectCard(page, 'はり理論'), '続きから解く（回答済み 2 / 10問）'))
  await expectAt(page, hari[2], 3, 10)
  await tap(page, page.getByRole('button', { name: '← 前の問題へ', exact: true }))
  await expect(choices(page).nth(wrongOf(hari[1]))).toHaveAttribute('aria-pressed', 'true')
  await tap(page, btn(page, '科目選択に戻る'))
  await tap(page, btn(subjectCard(page, 'きゅう理論'), '続きから解く（回答済み 1 / 10問）'))
  await expectAt(page, kyu[0], 1, 10)
  await expect(choices(page).nth(wrongOf(kyu[0]))).toHaveAttribute('aria-pressed', 'true')
  await noHScroll(page)
})

test('成績の分離：科目別は v1〜v5・見直しの記録を変えず、全問の採点は科目別の結果を変えない', async ({ page }) => {
  test.setTimeout(360_000)
  const seeded: [string, string][] = [
    ...LEGACY.map((k, i): [string, string] => [
      k,
      JSON.stringify({ [MOCK_ID]: { mockId: MOCK_ID, correct: 30 + i, total: [40, 58, 68, 80, 100][i], wrongIds: ['om02-07'], completedAt: 1762000000000 + i } }),
    ]),
    [REVIEW, JSON.stringify({ [MOCK_ID]: { completedAt: 1762000000004, selected: { 'om02-07': 1 } } })],
  ]
  await setItems(page, seeded)
  await solveSubject(page, '解剖学', (q, i) => (i === 0 ? wrongOf(q) : q.answerIndex))
  await expect(score(page, 6, 7)).toBeVisible()
  for (const [k, v] of seeded) expect(await getItem(page, k), k).toBe(v)

  await page.goto('/original-mock/02')
  await expect(page.getByText('前回の結果：34 / 100問', { exact: true })).toBeVisible()
  await expect(page.getByText('80問版の結果（問題を追加する前）：33 / 80問', { exact: true })).toBeVisible()
  await expect(page.getByText('40問版の結果（問題を追加する前）：30 / 40問', { exact: true })).toBeVisible()

  // 全100問を解く：v5 だけが変わり、科目別の結果と v1〜v4 は変わらない
  const subjectBefore = await getItem(page, SUBJECT_KEY)
  await tap(page, btn(page, 'もう一度、全問を解く'))
  for (let i = 0; i < QS.length - 1; i++) await tap(page, nextBtn(page))
  await answer(page, QS[99].answerIndex)
  await tap(page, finishBtn(page))
  await tap(page, btn(page, 'このまま採点する'))
  await expect(score(page, 1, 100)).toBeVisible()
  expect(await getItem(page, SUBJECT_KEY)).toBe(subjectBefore)
  for (const [k, v] of seeded.slice(0, 4)) expect(await getItem(page, k), k).toBe(v)
  expect(JSON.parse((await getItem(page, V5))!)[MOCK_ID]).toMatchObject({ correct: 1, total: 100 })
})

test('全100問の途中保存：選択のたびに保存し、再読み込み後に続きから再開でき、採点で途中データが消える', async ({ page }) => {
  test.setTimeout(300_000)
  const v5 = JSON.stringify({ [MOCK_ID]: { mockId: MOCK_ID, correct: 98, total: 100, wrongIds: ['om02-07', 'om02-75'], completedAt: 1762200000000 } })
  await setItems(page, [[V5, v5]])
  await page.goto('/original-mock/02')
  await tap(page, btn(page, 'もう一度、全問を解く'))
  await answer(page, QS[0].answerIndex)
  await tap(page, nextBtn(page))
  await answer(page, wrongOf(QS[1]))
  await tap(page, nextBtn(page))
  // 第3問：選んだだけ（未確定）でも保存される
  await tap(page, choices(page).nth(2))
  await page.reload()
  await expect(page.getByText('前回の結果：98 / 100問', { exact: true })).toBeVisible()
  expect(await getItem(page, V5), '途中保存は成績を変えない').toBe(v5)
  const resume = btn(page, '続きから解く（回答済み 2 / 100問）')
  await expect(resume).toBeVisible()
  await expect(btn(page, 'はじめから解く')).toBeVisible()
  await expect(btn(page, 'もう一度、全問を解く')).toHaveCount(0)
  await shot(page, '08-start-resume', true)
  await noHScroll(page)
  await tap(page, resume)
  await expect(page.getByText(/^第3問$/).first()).toBeVisible()
  await expect(choices(page).nth(2)).toHaveAttribute('aria-pressed', 'true')
  await expect(answerBtn(page)).toBeEnabled()
  await tap(page, page.getByRole('button', { name: '← 前の問題へ', exact: true }))
  await expect(choices(page).nth(wrongOf(QS[1]))).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('p', { hasText: /^不正解$/ })).toBeVisible()

  // 「はじめから解く」を押しただけなら途中データは残り、回答すると置き換わる
  await page.reload()
  await tap(page, btn(page, 'はじめから解く'))
  await expect(page.getByText(/^第1問$/).first()).toBeVisible()
  await expect(page.getByText('（回答済み 0）', { exact: false })).toBeVisible()
  await page.reload()
  await expect(btn(page, '続きから解く（回答済み 2 / 100問）')).toBeVisible()
  await tap(page, btn(page, 'はじめから解く'))
  await answer(page, QS[0].answerIndex)
  await page.reload()
  await tap(page, btn(page, '続きから解く（回答済み 1 / 100問）'))

  // 解き直しは途中データを書き換えない
  await page.reload()
  const progressBefore = await getItem(page, PROGRESS)
  await tap(page, btn(page, '前回まちがえた2問だけ解く'))
  await answer(page, QS[6].answerIndex)
  expect(await getItem(page, PROGRESS)).toBe(progressBefore)

  // 採点すると途中データは消え、成績だけが更新される
  await page.goto('/original-mock/02')
  await tap(page, btn(page, '続きから解く（回答済み 1 / 100問）'))
  for (let i = 0; i < QS.length - 1; i++) await tap(page, nextBtn(page))
  await tap(page, finishBtn(page))
  await tap(page, btn(page, 'このまま採点する'))
  await expect(score(page, 1, 100)).toBeVisible()
  expect(JSON.parse((await getItem(page, PROGRESS))!)).toEqual({})
  await page.reload()
  await expect(btn(page, 'もう一度、全問を解く')).toBeVisible()
  await expect(btn(page, /^続きから解く/)).toHaveCount(0)
})

test('壊れた・合わない途中データと科目の結果：画面は落ちず、最初から解ける', async ({ page }) => {
  const ids = QS.map((q) => q.id)
  const session = { order: ids, index: 0, answers: ids.map(() => null), drafts: ids.map(() => null), editing: ids.map(() => false) }
  const hari = of('はり理論')
  const slot = (patch: object, fingerprint: unknown = 'old') => JSON.stringify({ [`${MOCK_ID}/full`]: { fingerprint, session: { ...session, ...patch } }, [`${MOCK_ID}/subject/はり理論`]: { fingerprint, session: 1 } })
  for (const raw of ['{oops', '[]', 'null', '7', slot({}), slot({ index: 999 }), slot({ answers: [1] })]) {
    await setItems(page, [
      [PROGRESS, raw],
      [SUBJECT_KEY, raw === 'null' ? JSON.stringify({ [MOCK_ID]: { はり理論: { correct: 99, total: 1 } } }) : raw],
    ])
    await page.goto('/original-mock/02')
    await expect(btn(page, '解き始める')).toBeVisible()
    await expect(btn(page, /^続きから解く/)).toHaveCount(0)
    await tap(page, btn(page, '科目を選ぶ'))
    await expect(btn(subjectCard(page, 'はり理論'), 'この科目を解く')).toBeVisible()
    await expect(subjectCard(page, 'はり理論').getByText(/^前回：/)).toHaveCount(0)
  }
  // 壊れたままでも解いて保存できる
  await setItems(page, [
    [PROGRESS, '{oops'],
    [SUBJECT_KEY, '{oops'],
  ])
  await startSubject(page, 'はり理論')
  await answer(page, hari[0].answerIndex)
  await page.reload()
  await tap(page, btn(page, '科目を選ぶ'))
  await expect(btn(subjectCard(page, 'はり理論'), '続きから解く（回答済み 1 / 10問）')).toBeVisible()
})
