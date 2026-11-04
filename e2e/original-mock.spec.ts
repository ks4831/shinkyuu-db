/* ──────────────────────────────────────────────────────────────
   オリジナル模擬試験②（100問：既存40問＋臨床医学18問＋臨床医学・リハビリテーション医学10問＋基礎6科目12問＋基礎6科目20問）の画面テスト
   `npm run test:e2e`（next build のあと Playwright を pc / sp390 の2画面幅で実行）
   - HOME・一覧・開始画面の問題数と科目の内訳、問題を追加した案内
   - 第1〜100問の表示（番号・4択・解説・根拠資料）と、全問正解で 100/100・科目別12区分
   - 第40問⇔第41問、第58問⇔第59問、第68問⇔第69問、第80問⇔第81問の移動と回答の保持、最終問題（第100問）
   - 第1〜40問だけ正解で 40/100（臨床医学・リハビリテーション医学・基礎6科目の9区分が0点）
   - 40問版（旧キー v1）・58問版（v2）・68問版（v3）・80問版（v4）の過去の結果の表示・再挑戦・上書きしないこと／100問版の結果（v5）
   - 壊れた保存データでも開始画面が表示される
   - 採点後の復習：まちがえた問題だけの表示、問題文・自分の回答・正答・解説、元の問題番号へ戻る、科目別の正答率、全問不正解、再読み込み後の見直し
   - 横スクロールが出ない
   正答・解説・根拠資料は問題データ（src/data/originalMocks/original-mock-02.json）から読む。データは読むだけで変更しない。
   スクリーンショット：環境変数 E2E_SHOT_DIR を指定したときだけ、第41〜100問などを保存する（目視の確認用）。
   ────────────────────────────────────────────────────────────── */
import { test, expect, type Page } from '@playwright/test'
import { readFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'

type Q = { id: string; questionNumber: number; subject: string; choices: string[]; answerIndex: number; choiceNotes: string[]; point: string; sources: string[] }
const DATA = JSON.parse(readFileSync(path.join(process.cwd(), 'src', 'data', 'originalMocks', 'original-mock-02.json'), 'utf8')) as { questions: Q[] }
const QS = DATA.questions
const N = QS.length
const V1 = 'shinkyuu_original_mock_results_v1'
const V2 = 'shinkyuu_original_mock_results_v2'
const V3 = 'shinkyuu_original_mock_results_v3'
const V4 = 'shinkyuu_original_mock_results_v4'
const V5 = 'shinkyuu_original_mock_results_v5'
const REVIEW = 'shinkyuu_original_mock_review_v1'
const MOCK_ID = 'original-mock-02'
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
const BASIC6 = ['医療概論', '衛生学・公衆衛生学', '関係法規', '解剖学', '生理学', '病理学概論']
const LEGACY40 = { mockId: MOCK_ID, correct: 35, total: 40, wrongIds: ['om02-05', 'om02-12', 'om02-22', 'om02-30', 'om02-37'], completedAt: 1761800000000 }
const LEGACY58 = { mockId: MOCK_ID, correct: 50, total: 58, wrongIds: ['om02-41', 'om02-50'], completedAt: 1762100000000 }
const LEGACY68 = { mockId: MOCK_ID, correct: 65, total: 68, wrongIds: ['om02-07', 'om02-59', 'om02-64'], completedAt: 1762150000000 }
const LEGACY80 = { mockId: MOCK_ID, correct: 77, total: 80, wrongIds: ['om02-62', 'om02-07', 'om02-75'], completedAt: 1762180000000 }

const SHOT_DIR = process.env.E2E_SHOT_DIR
async function shot(p: Page, name: string, fullPage = false) {
  if (!SHOT_DIR) return
  const dir = path.join(SHOT_DIR, test.info().project.name)
  mkdirSync(dir, { recursive: true })
  await p.screenshot({ path: path.join(dir, `${name}.png`), fullPage })
}

const choices = (p: Page) => p.locator('button[aria-pressed]')
const verdict = (p: Page) => p.locator('p', { hasText: /^(正解|不正解)$/ })
const answerBtn = (p: Page) => p.getByRole('button', { name: /^(回答する|この回答に変更する)$/ })
const nextBtn = (p: Page) => p.getByRole('button', { name: /^(次の問題へ →|あとで解く →)$/ })
const prevBtn = (p: Page) => p.getByRole('button', { name: '← 前の問題へ', exact: true })
const finishBtn = (p: Page) => p.getByRole('button', { name: '採点する', exact: true })

async function expectNoHorizontalScroll(p: Page) {
  const over = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(over, '横スクロールが出ない').toBeLessThanOrEqual(0)
}

/** ボタンが他の要素（下部メニューなど）に覆われずに押せることを確かめてから押す */
async function tap(p: Page, loc: ReturnType<Page['locator']>) {
  await loc.scrollIntoViewIfNeeded()
  await loc.evaluate((el) => el.scrollIntoView({ block: 'center' }))
  const covered = await loc.evaluate((el) => {
    const r = el.getBoundingClientRect()
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
    return !(hit && (hit === el || el.contains(hit)))
  })
  expect(covered, 'ボタンが他の要素に覆われていない').toBe(false)
  await loc.click()
}

/** 出題画面の表示（番号・進み具合・4択） */
async function expectQuestion(p: Page, q: Q, pos: number, total: number) {
  await expect(p.getByText(new RegExp(`第${q.questionNumber}問$`)).first()).toBeVisible()
  await expect(p.getByText(new RegExp(`^${pos} / ${total}問`))).toBeVisible()
  await expect(choices(p)).toHaveCount(4)
  for (let i = 0; i < 4; i++) await expect(choices(p).nth(i)).toContainText(q.choices[i])
}

/** 回答後の解説：正答・選択肢ごとの解説・学習のポイント・根拠資料 */
async function expectExplanation(p: Page, q: Q, selected: number) {
  await expect(verdict(p)).toHaveText(selected === q.answerIndex ? '正解' : '不正解')
  await expect(p.getByText(`正答：${'①②③④'[q.answerIndex]}`, { exact: true }).first()).toBeVisible()
  for (const n of q.choiceNotes) await expect(p.getByText(n, { exact: true }).first()).toBeVisible()
  await expect(p.locator('p', { hasText: '学習のポイント：' }).filter({ hasText: q.point }).first()).toBeVisible()
  await expect(p.locator('div', { hasText: /^根拠資料：/ }).filter({ hasText: q.sources.join('／') }).last()).toBeVisible()
}

async function answer(p: Page, i: number) {
  await tap(p, choices(p).nth(i))
  await tap(p, answerBtn(p))
}

async function startFull(p: Page) {
  await p.goto('/original-mock/02')
  await tap(p, p.getByRole('button', { name: /^(解き始める|もう一度、全問を解く)$/ }))
}

async function resultRows(p: Page) {
  return p.locator('table tr').evaluateAll((trs) => trs.map((tr) => [...tr.querySelectorAll('td')].map((td) => td.textContent!.trim())))
}

const getItem = (p: Page, k: string) => p.evaluate((key) => localStorage.getItem(key), k)
const setItems = (p: Page, items: [string, string][]) => p.evaluate((xs) => xs.forEach(([k, v]) => localStorage.setItem(k, v)), items)

const errors: string[] = []
test.beforeEach(async ({ page }) => {
  errors.length = 0
  page.on('pageerror', (e) => errors.push(String(e)))
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

test('HOME・一覧・開始画面：100問と科目別12区分、問題を追加した案内', async ({ page }) => {
  expect(N).toBe(100)
  const breakdown = '経絡経穴概論20・はり理論10・きゅう理論10・臨床医学各論22・臨床医学総論5・リハビリテーション医学1・医療概論4・衛生学・公衆衛生学5・関係法規4・解剖学7・生理学7・病理学概論5'
  await page.goto('/')
  const card = page.locator('a[href="/original-mock"]').first()
  await expect(card).toContainText('100問')
  await expect(card).toContainText(`模擬試験②：${breakdown}`)
  await expect(card).not.toContainText('80問')
  await card.scrollIntoViewIfNeeded()
  await shot(page, '01-home-card')
  await expectNoHorizontalScroll(page)

  await page.goto('/original-mock')
  const item = page.locator('a[href="/original-mock/02"]')
  await expect(item).toContainText('100問')
  await expect(item).toContainText(breakdown)
  await expectNoHorizontalScroll(page)
  await tap(page, item)

  await expect(page).toHaveURL(/\/original-mock\/02\/?$/)
  await expect(
    page.getByText('全100問（経絡経穴概論20問・はり理論10問・きゅう理論10問・臨床医学各論22問・臨床医学総論5問・リハビリテーション医学1問・医療概論4問・衛生学・公衆衛生学5問・関係法規4問・解剖学7問・生理学7問・病理学概論5問）・四肢択一'),
  ).toBeVisible()
  await expect(page.getByText(/基礎6科目20問（第81〜100問：医療概論2・衛生学・公衆衛生学3・関係法規2・解剖学5・生理学5・病理学概論3）を追加し、全100問になりました。追加前の40問・58問・68問・80問で解いた結果/)).toBeVisible()
  await expect(page.getByText(/有資格者による最終確認は未実施/)).toBeVisible()
  await expect(page.getByRole('button', { name: '解き始める' })).toBeVisible()
  await expect(page.getByText(/^前回の結果|問版の結果（問題を追加する前）/)).toHaveCount(0)
  await shot(page, '02-start', true)
  await expectNoHorizontalScroll(page)
})

test('第1〜100問：番号・4択・解説・根拠資料が出て、全問正解で 100/100・科目別12区分が満点', async ({ page }) => {
  await setItems(page, [
    [V1, JSON.stringify({ [MOCK_ID]: LEGACY40 })],
    [V2, JSON.stringify({ [MOCK_ID]: LEGACY58 })],
    [V3, JSON.stringify({ [MOCK_ID]: LEGACY68 })],
    [V4, JSON.stringify({ [MOCK_ID]: LEGACY80 })],
  ])
  const v1Before = await getItem(page, V1)
  const v2Before = await getItem(page, V2)
  const v3Before = await getItem(page, V3)
  const v4Before = await getItem(page, V4)
  await startFull(page)
  await expect(prevBtn(page)).toBeDisabled()
  for (let i = 0; i < N; i++) {
    const q = QS[i]
    await expectQuestion(page, q, i + 1, N)
    await expect(page.getByText(q.subject, { exact: true }).first()).toBeVisible()
    await answer(page, q.answerIndex)
    await expectExplanation(page, q, q.answerIndex)
    if (i === 0 || i === 39 || i === 57 || i === 67 || i >= 79) {
      await expectNoHorizontalScroll(page)
      await shot(page, `q${String(q.questionNumber).padStart(3, '0')}-answered`, true)
    }
    if (i < N - 1) await tap(page, nextBtn(page))
  }
  await expect(page.getByText(/第100問$/).first()).toBeVisible()
  await expect(nextBtn(page)).toHaveCount(0)
  await tap(page, finishBtn(page))

  await expect(page.getByRole('heading', { name: '結果', exact: true })).toBeVisible()
  await expect(page.locator('p', { hasText: /^100 \/ 100問$/ })).toBeVisible()
  expect(await resultRows(page)).toEqual(SUBJECTS.map(([s, n]) => [s, `${n} / ${n}`, '100%']))
  await expect(page.getByRole('button', { name: '全100問をもう一度解く' })).toBeVisible()
  await expect(page.locator('details')).toHaveCount(100)
  for (const n of [41, 58, 59, 62, 68, 69, 80, 81, 88, 93, 100]) {
    const q = QS[n - 1]
    const d = page.locator('details', { has: page.getByText(`第${n}問`, { exact: true }) })
    await d.locator('summary').click()
    await expect(d.getByText(q.choiceNotes[q.answerIndex], { exact: true })).toBeVisible()
    await expect(d.locator('div', { hasText: /^根拠資料：/ }).filter({ hasText: q.sources.join('／') }).last()).toBeVisible()
  }
  await shot(page, '10-result-full', true)
  await expectNoHorizontalScroll(page)

  // 保存：100問版は v5 に、40問版（v1）・58問版（v2）・68問版（v3）・80問版（v4）は一字一句そのまま
  const v5 = JSON.parse((await getItem(page, V5))!)
  expect(v5[MOCK_ID]).toMatchObject({ mockId: MOCK_ID, correct: 100, total: 100, wrongIds: [] })
  expect(await getItem(page, V1)).toBe(v1Before)
  expect(await getItem(page, V2)).toBe(v2Before)
  expect(await getItem(page, V3)).toBe(v3Before)
  expect(await getItem(page, V4)).toBe(v4Before)

  // 開始画面に戻ると、100問版の結果と、80問版・68問版・58問版・40問版の結果が別々に出る
  await page.goto('/original-mock/02')
  await expect(page.getByText('前回の結果：100 / 100問', { exact: true })).toBeVisible()
  await expect(page.getByText('80問版の結果（問題を追加する前）：77 / 80問', { exact: true })).toBeVisible()
  await expect(page.getByText('68問版の結果（問題を追加する前）：65 / 68問', { exact: true })).toBeVisible()
  await expect(page.getByText('58問版の結果（問題を追加する前）：50 / 58問', { exact: true })).toBeVisible()
  await expect(page.getByText('40問版の結果（問題を追加する前）：35 / 40問', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: /問版でまちがえた/ })).toHaveCount(0)
  await shot(page, '11-start-after-100', true)
})

test('第40問⇔第41問・第58問⇔第59問・第68問⇔第69問・第80問⇔第81問：境目をまたいで移動でき、回答・正誤・解説が保持される', async ({ page }) => {
  await startFull(page)
  for (let i = 0; i < 39; i++) await tap(page, nextBtn(page)) // 「あとで解く」で第40問へ
  const q40 = QS[39]
  const q41 = QS[40]
  const wrong41 = (q41.answerIndex + 1) % 4
  await expectQuestion(page, q40, 40, N)
  await answer(page, q40.answerIndex)
  await tap(page, nextBtn(page))
  await expectQuestion(page, q41, 41, N)
  await answer(page, wrong41)
  await expectExplanation(page, q41, wrong41)
  await tap(page, prevBtn(page))
  await expectQuestion(page, q40, 40, N)
  await expect(choices(page).nth(q40.answerIndex)).toHaveAttribute('aria-pressed', 'true')
  await expectExplanation(page, q40, q40.answerIndex)
  await tap(page, nextBtn(page))
  await expectQuestion(page, q41, 41, N)
  await expect(choices(page).nth(wrong41)).toHaveAttribute('aria-pressed', 'true')

  // 第58問⇔第59問
  for (let i = 40; i < 57; i++) await tap(page, nextBtn(page)) // 第41問 → 第58問
  const q58 = QS[57]
  const q59 = QS[58]
  const wrong59 = (q59.answerIndex + 1) % 4
  await expectQuestion(page, q58, 58, N)
  await answer(page, q58.answerIndex)
  await tap(page, nextBtn(page))
  await expectQuestion(page, q59, 59, N)
  await expect(page.getByText(q59.subject, { exact: true }).first()).toBeVisible()
  await answer(page, wrong59)
  await expectExplanation(page, q59, wrong59)
  await tap(page, prevBtn(page))
  await expectQuestion(page, q58, 58, N)
  await expect(choices(page).nth(q58.answerIndex)).toHaveAttribute('aria-pressed', 'true')
  await expectExplanation(page, q58, q58.answerIndex)
  await tap(page, nextBtn(page))
  await expectQuestion(page, q59, 59, N)
  await expect(choices(page).nth(wrong59)).toHaveAttribute('aria-pressed', 'true')
  await expectExplanation(page, q59, wrong59)
  await expect(page.getByText('（回答済み 4）', { exact: false })).toBeVisible()

  // 第68問⇔第69問（臨床医学・リハビリテーション医学 → 基礎6科目の境目）
  for (let i = 58; i < 67; i++) await tap(page, nextBtn(page)) // 第59問 → 第68問
  const q68 = QS[67]
  const q69 = QS[68]
  const wrong69 = (q69.answerIndex + 1) % 4
  await expectQuestion(page, q68, 68, N)
  await answer(page, q68.answerIndex)
  await tap(page, nextBtn(page))
  await expectQuestion(page, q69, 69, N)
  await expect(page.getByText(q69.subject, { exact: true }).first()).toBeVisible()
  await answer(page, wrong69)
  await expectExplanation(page, q69, wrong69)
  await tap(page, prevBtn(page))
  await expectQuestion(page, q68, 68, N)
  await expect(choices(page).nth(q68.answerIndex)).toHaveAttribute('aria-pressed', 'true')
  await expectExplanation(page, q68, q68.answerIndex)
  await tap(page, nextBtn(page))
  await expectQuestion(page, q69, 69, N)
  await expect(choices(page).nth(wrong69)).toHaveAttribute('aria-pressed', 'true')
  await expectExplanation(page, q69, wrong69)
  await expect(page.getByText('（回答済み 6）', { exact: false })).toBeVisible()
  await shot(page, '05-q69-kept', true)

  // 第80問⇔第81問（80問版と追加20問の境目）
  for (let i = 68; i < 79; i++) await tap(page, nextBtn(page)) // 第69問 → 第80問
  const q80 = QS[79]
  const q81 = QS[80]
  const wrong81 = (q81.answerIndex + 1) % 4
  await expectQuestion(page, q80, 80, N)
  await answer(page, q80.answerIndex)
  await tap(page, nextBtn(page))
  await expectQuestion(page, q81, 81, N)
  await expect(page.getByText(q81.subject, { exact: true }).first()).toBeVisible()
  await answer(page, wrong81)
  await expectExplanation(page, q81, wrong81)
  await tap(page, prevBtn(page))
  await expectQuestion(page, q80, 80, N)
  await expect(choices(page).nth(q80.answerIndex)).toHaveAttribute('aria-pressed', 'true')
  await expectExplanation(page, q80, q80.answerIndex)
  await tap(page, nextBtn(page))
  await expectQuestion(page, q81, 81, N)
  await expect(choices(page).nth(wrong81)).toHaveAttribute('aria-pressed', 'true')
  await expectExplanation(page, q81, wrong81)
  await expect(page.getByText('（回答済み 8）', { exact: false })).toBeVisible()
  await shot(page, '06-q81-kept', true)

  // 最終問題（第100問）まで進み、未回答を残して採点 → 未回答の確認
  for (let i = 81; i < N; i++) await tap(page, nextBtn(page))
  await expectQuestion(page, QS[N - 1], N, N)
  await expect(nextBtn(page)).toHaveCount(0)
  await tap(page, finishBtn(page))
  await expect(page.getByText(/^未回答の問題が92問あります（第1・2・3・4・5・6・7・8問など）。$/)).toBeVisible()
  await tap(page, page.getByRole('button', { name: '未回答の問題へ' }))
  await expectQuestion(page, QS[0], 1, N)
})

test('第1〜40問だけ正解：40/100、臨床医学・リハビリテーション医学・基礎6科目の9区分は0点', async ({ page }) => {
  await startFull(page)
  for (let i = 0; i < N; i++) {
    const q = QS[i]
    await answer(page, i < 40 ? q.answerIndex : (q.answerIndex + 1) % 4)
    if (i < N - 1) await tap(page, nextBtn(page))
  }
  await tap(page, finishBtn(page))
  await expect(page.locator('p', { hasText: /^40 \/ 100問$/ })).toBeVisible()
  expect(await resultRows(page)).toEqual(
    SUBJECTS.map(([s, n]) => (s.startsWith('臨床医学') || s === 'リハビリテーション医学' || BASIC6.includes(s) ? [s, `0 / ${n}`, '0%'] : [s, `${n} / ${n}`, '100%'])),
  )
  await expect(page.getByRole('button', { name: 'まちがえた60問を解き直す' })).toBeVisible()
  await shot(page, '12-result-40of100', true)

  // 解き直し：第41〜100問だけ、番号は元のまま、結果は保存しない
  const before = await getItem(page, V5)
  await tap(page, page.getByRole('button', { name: 'まちがえた60問を解き直す' }))
  await expect(page.getByText(/^解き直し\s+第41問$/)).toBeVisible()
  await expect(page.getByText(/^1 \/ 60問/)).toBeVisible()
  for (let i = 40; i < N; i++) {
    await answer(page, QS[i].answerIndex)
    if (i < N - 1) await tap(page, nextBtn(page))
  }
  await tap(page, finishBtn(page))
  await expect(page.locator('p', { hasText: /^60 \/ 60問$/ })).toBeVisible()
  expect(await getItem(page, V5)).toBe(before)
})

test('40問版（v1）の過去の結果：「40問版」と明示し、再挑戦でき、上書きしない', async ({ page }) => {
  const raw = JSON.stringify({ [MOCK_ID]: LEGACY40 })
  await setItems(page, [[V1, raw]])
  await page.goto('/original-mock/02')
  await expect(page.getByText('40問版の結果（問題を追加する前）：35 / 40問', { exact: true })).toBeVisible()
  await expect(page.getByText(/^前回の結果/)).toHaveCount(0)
  await expect(page.getByRole('button', { name: '解き始める' })).toBeVisible()
  const retry = page.getByRole('button', { name: '40問版でまちがえた5問だけ解く' })
  await expect(retry).toBeVisible()
  await shot(page, '20-start-legacy40', true)
  await expectNoHorizontalScroll(page)

  await tap(page, retry)
  const nums = [5, 12, 22, 30, 37]
  for (let i = 0; i < nums.length; i++) {
    const q = QS[nums[i] - 1]
    await expect(page.getByText(new RegExp(`^解き直し\\s+第${nums[i]}問$`))).toBeVisible()
    await expectQuestion(page, q, i + 1, 5)
    await answer(page, q.answerIndex)
    if (i < nums.length - 1) await tap(page, nextBtn(page))
  }
  await tap(page, finishBtn(page))
  await expect(page.locator('p', { hasText: /^5 \/ 5問$/ })).toBeVisible()
  expect(await getItem(page, V1)).toBe(raw)
  expect(await getItem(page, V2)).toBeNull()
  expect(await getItem(page, V3)).toBeNull()
  expect(await getItem(page, V4)).toBeNull()
  expect(await getItem(page, V5)).toBeNull()
})

test('58問版（v2）と40問版（v1）の過去の結果：両方を明示し、新しい58問版から再挑戦でき、上書きしない', async ({ page }) => {
  const raw1 = JSON.stringify({ [MOCK_ID]: LEGACY40 })
  const raw2 = JSON.stringify({ [MOCK_ID]: LEGACY58 })
  await setItems(page, [
    [V1, raw1],
    [V2, raw2],
  ])
  await page.goto('/original-mock/02')
  await expect(page.getByText('58問版の結果（問題を追加する前）：50 / 58問', { exact: true })).toBeVisible()
  await expect(page.getByText('40問版の結果（問題を追加する前）：35 / 40問', { exact: true })).toBeVisible()
  const retry = page.getByRole('button', { name: '58問版でまちがえた2問だけ解く' })
  await expect(retry).toBeVisible()
  await expect(page.getByRole('button', { name: /40問版でまちがえた/ })).toHaveCount(0)
  await shot(page, '21-start-legacy58-40', true)
  await expectNoHorizontalScroll(page)

  await tap(page, retry)
  for (const [i, n] of [41, 50].entries()) {
    const q = QS[n - 1]
    await expect(page.getByText(new RegExp(`^解き直し\\s+第${n}問$`))).toBeVisible()
    await expectQuestion(page, q, i + 1, 2)
    await answer(page, q.answerIndex)
    if (i === 0) await tap(page, nextBtn(page))
  }
  await tap(page, finishBtn(page))
  await expect(page.locator('p', { hasText: /^2 \/ 2問$/ })).toBeVisible()
  expect(await getItem(page, V1)).toBe(raw1)
  expect(await getItem(page, V2)).toBe(raw2)
  expect(await getItem(page, V3)).toBeNull()
  expect(await getItem(page, V4)).toBeNull()
  expect(await getItem(page, V5)).toBeNull()
})

test('68問版（v3）・58問版（v2）・40問版（v1）の過去の結果：3つとも明示し、新しい68問版から再挑戦でき、上書きしない', async ({ page }) => {
  const raw1 = JSON.stringify({ [MOCK_ID]: LEGACY40 })
  const raw2 = JSON.stringify({ [MOCK_ID]: LEGACY58 })
  const raw3 = JSON.stringify({ [MOCK_ID]: LEGACY68 })
  await setItems(page, [
    [V1, raw1],
    [V2, raw2],
    [V3, raw3],
  ])
  await page.goto('/original-mock/02')
  await expect(page.getByText('68問版の結果（問題を追加する前）：65 / 68問', { exact: true })).toBeVisible()
  await expect(page.getByText('58問版の結果（問題を追加する前）：50 / 58問', { exact: true })).toBeVisible()
  await expect(page.getByText('40問版の結果（問題を追加する前）：35 / 40問', { exact: true })).toBeVisible()
  await expect(page.getByText(/^前回の結果/)).toHaveCount(0)
  const retry = page.getByRole('button', { name: '68問版でまちがえた3問だけ解く' })
  await expect(retry).toBeVisible()
  await expect(page.getByRole('button', { name: /(58|40)問版でまちがえた/ })).toHaveCount(0)
  await shot(page, '22-start-legacy68-58-40', true)
  await expectNoHorizontalScroll(page)

  await tap(page, retry)
  // 出題は問題番号順（第7・59・64問）
  for (const [i, n] of [7, 59, 64].entries()) {
    const q = QS[n - 1]
    await expect(page.getByText(new RegExp(`^解き直し\\s+第${n}問$`))).toBeVisible()
    await expectQuestion(page, q, i + 1, 3)
    await answer(page, q.answerIndex)
    if (i < 2) await tap(page, nextBtn(page))
  }
  await tap(page, finishBtn(page))
  await expect(page.locator('p', { hasText: /^3 \/ 3問$/ })).toBeVisible()
  expect(await getItem(page, V1)).toBe(raw1)
  expect(await getItem(page, V2)).toBe(raw2)
  expect(await getItem(page, V3)).toBe(raw3)
  expect(await getItem(page, V4)).toBeNull()
  expect(await getItem(page, V5)).toBeNull()
})

test('80問版（v4）・68問版（v3）・58問版（v2）・40問版（v1）の過去の結果：4つとも明示し、新しい80問版から再挑戦でき、上書きしない', async ({ page }) => {
  const raws: [string, string][] = [
    [V1, JSON.stringify({ [MOCK_ID]: LEGACY40 })],
    [V2, JSON.stringify({ [MOCK_ID]: LEGACY58 })],
    [V3, JSON.stringify({ [MOCK_ID]: LEGACY68 })],
    [V4, JSON.stringify({ [MOCK_ID]: LEGACY80 })],
  ]
  await setItems(page, raws)
  await page.goto('/original-mock/02')
  await expect(page.getByText('80問版の結果（問題を追加する前）：77 / 80問', { exact: true })).toBeVisible()
  await expect(page.getByText('68問版の結果（問題を追加する前）：65 / 68問', { exact: true })).toBeVisible()
  await expect(page.getByText('58問版の結果（問題を追加する前）：50 / 58問', { exact: true })).toBeVisible()
  await expect(page.getByText('40問版の結果（問題を追加する前）：35 / 40問', { exact: true })).toBeVisible()
  await expect(page.getByText(/^前回の結果/)).toHaveCount(0)
  const retry = page.getByRole('button', { name: '80問版でまちがえた3問だけ解く' })
  await expect(retry).toBeVisible()
  await expect(page.getByRole('button', { name: /(68|58|40)問版でまちがえた/ })).toHaveCount(0)
  await shot(page, '23-start-legacy80-68-58-40', true)
  await expectNoHorizontalScroll(page)

  await tap(page, retry)
  // 出題は問題番号順（第7・62・75問）。第62問は注記を追加した学習のポイントが出る
  for (const [i, n] of [7, 62, 75].entries()) {
    const q = QS[n - 1]
    await expect(page.getByText(new RegExp(`^解き直し\\s+第${n}問$`))).toBeVisible()
    await expectQuestion(page, q, i + 1, 3)
    await answer(page, q.answerIndex)
    await expectExplanation(page, q, q.answerIndex)
    if (i < 2) await tap(page, nextBtn(page))
  }
  await tap(page, finishBtn(page))
  await expect(page.locator('p', { hasText: /^3 \/ 3問$/ })).toBeVisible()
  for (const [k, v] of raws) expect(await getItem(page, k)).toBe(v)
  expect(await getItem(page, V5)).toBeNull()
})

test('壊れた保存データでも開始画面が表示され、100問を解いて保存できる', async ({ page }) => {
  for (const [v1, v2, v3, v4, v5] of [
    ['{oops', '{oops', '{oops', '{oops', '{oops'],
    ['[1,2]', 'null', '"x"', '[]', '7'],
    [
      JSON.stringify({ [MOCK_ID]: { correct: 3, total: '40', wrongIds: [] } }),
      JSON.stringify({ [MOCK_ID]: { correct: 99, total: 58, wrongIds: 'x' } }),
      JSON.stringify({ [MOCK_ID]: { correct: 1, total: 0, wrongIds: [] } }),
      JSON.stringify({ [MOCK_ID]: { correct: 2, total: 80 } }),
      JSON.stringify({ [MOCK_ID]: { correct: 101, total: 100, wrongIds: [] } }),
    ],
  ]) {
    await setItems(page, [
      [V1, v1],
      [V2, v2],
      [V3, v3],
      [V4, v4],
      [V5, v5],
    ])
    await page.goto('/original-mock/02')
    await expect(page.getByText(/^全100問/)).toBeVisible()
    await expect(page.getByRole('button', { name: '解き始める' })).toBeVisible()
    await expect(page.getByText(/^前回の結果|問版の結果（問題を追加する前）/)).toHaveCount(0)
  }
  // 壊れた v5 のままでも採点・保存でき、旧キーの中身は消さない
  await setItems(page, [
    [V1, '{oops'],
    [V2, '{oops'],
    [V3, '{oops'],
    [V4, '{oops'],
    [V5, '{oops'],
  ])
  await startFull(page)
  for (let i = 0; i < N - 1; i++) await tap(page, nextBtn(page))
  await answer(page, QS[N - 1].answerIndex)
  await tap(page, finishBtn(page))
  await tap(page, page.getByRole('button', { name: 'このまま採点する' }))
  await expect(page.locator('p', { hasText: /^1 \/ 100問$/ })).toBeVisible()
  expect(JSON.parse((await getItem(page, V5))!)[MOCK_ID].total).toBe(100)
  expect(await getItem(page, V4)).toBe('{oops')
  expect(await getItem(page, V1)).toBe('{oops')
  expect(await getItem(page, V2)).toBe('{oops')
  expect(await getItem(page, V3)).toBe('{oops')
})

/** 第1〜100問を解く。pick が null の問題は回答せずに進み、未回答があれば確認のうえ採点する */
async function solveAll(p: Page, pick: (q: Q, i: number) => number | null) {
  await startFull(p)
  let skipped = false
  for (let i = 0; i < N; i++) {
    const c = pick(QS[i], i)
    if (c === null) skipped = true
    else await answer(p, c)
    if (i < N - 1) await tap(p, nextBtn(p))
  }
  await tap(p, finishBtn(p))
  if (skipped) await tap(p, p.getByRole('button', { name: 'このまま採点する' }))
  await expect(p.getByRole('heading', { name: '結果', exact: true })).toBeVisible()
}

const card = (p: Page, n: number) => p.locator('details', { has: p.getByText(`第${n}問`, { exact: true }) })

/** 復習カードの中身：問題文・4択・自分の回答・正答・解説・根拠資料 */
async function expectReviewCard(p: Page, q: Q, selected: number | null, noAnswer = '未回答') {
  const d = card(p, q.questionNumber)
  await expect(d.getByText(q.choices[q.answerIndex]).first()).toBeVisible()
  await expect(d.locator('li', { hasText: '（正答）' })).toContainText(q.choices[q.answerIndex])
  if (selected === null) await expect(d.getByText(`あなたの回答：${noAnswer}`, { exact: true })).toBeVisible()
  else await expect(d.locator('li', { hasText: '（あなたの回答）' })).toContainText(q.choices[selected])
  await expect(d.getByText(`正答：${'①②③④'[q.answerIndex]}`, { exact: true })).toBeVisible()
  await expect(d.getByText(q.choiceNotes[q.answerIndex], { exact: true })).toBeVisible()
  await expect(d.locator('div', { hasText: /^根拠資料：/ }).filter({ hasText: q.sources.join('／') }).last()).toBeVisible()
}

test('採点後の復習：まちがえた問題だけ表示し、回答と解説を確かめ、元の問題へ戻って結果に帰れる。再読み込み後も見直せる', async ({ page }) => {
  test.setTimeout(360_000)
  await setItems(page, [
    [V1, JSON.stringify({ [MOCK_ID]: LEGACY40 })],
    [V2, JSON.stringify({ [MOCK_ID]: LEGACY58 })],
    [V3, JSON.stringify({ [MOCK_ID]: LEGACY68 })],
    [V4, JSON.stringify({ [MOCK_ID]: LEGACY80 })],
  ])
  const legacyBefore = await Promise.all([V1, V2, V3, V4].map((k) => getItem(page, k)))
  // 第3問・第62問はまちがえ、第90問は未回答、ほかは正解
  const WRONG = new Set([3, 62])
  const pickOf = (q: Q) => (q.answerIndex + 1) % 4
  await solveAll(page, (q) => (q.questionNumber === 90 ? null : WRONG.has(q.questionNumber) ? pickOf(q) : q.answerIndex))
  await expect(page.locator('p', { hasText: /^97 \/ 100問$/ })).toBeVisible()

  // 科目別の正答率
  const rows = await resultRows(page)
  expect(rows.find((r) => r[0] === '経絡経穴概論')).toEqual(['経絡経穴概論', '19 / 20', '95%'])
  expect(rows.find((r) => r[0] === '臨床医学各論')).toEqual(['臨床医学各論', '21 / 22', '95%'])
  expect(rows.find((r) => r[0] === '解剖学')).toEqual(['解剖学', '6 / 7', '86%'])
  expect(rows.find((r) => r[0] === 'はり理論')).toEqual(['はり理論', '10 / 10', '100%'])

  // まちがえた問題だけが最初から表示される（案内ボタンで一覧へ移動できる）
  await expect(page.locator('details')).toHaveCount(3)
  await tap(page, page.getByRole('button', { name: 'まちがえた・未回答の3問の解説を見る' }))
  await expect(page.getByRole('heading', { name: '正答と解説' })).toBeInViewport()
  await shot(page, '20-review-list')
  for (const n of [3, 62, 90]) await tap(page, card(page, n).locator('summary'))
  await expectReviewCard(page, QS[2], pickOf(QS[2]))
  await expectReviewCard(page, QS[61], pickOf(QS[61]))
  await expectReviewCard(page, QS[89], null)
  await expectNoHorizontalScroll(page)
  await shot(page, '21-review-open', true)

  // 全問に切り替えと、まちがえた問題に戻す
  await tap(page, page.getByRole('tab', { name: '全問（100）' }))
  await expect(page.locator('details')).toHaveCount(100)
  await tap(page, page.getByRole('tab', { name: 'まちがえた問題（3）' }))
  await expect(page.locator('details')).toHaveCount(3)

  // 元の問題番号へ戻る：回答は変更できず、前後に移動でき、結果に戻るとその問題の解説が開いている
  const v5Before = await getItem(page, V5)
  await tap(page, card(page, 62).getByRole('button', { name: '第62問へ戻る' }))
  await expect(page.getByText(/^見直し\s+第62問$/)).toBeVisible()
  await expect(verdict(page)).toHaveText('不正解')
  await expect(choices(page).nth(pickOf(QS[61]))).toHaveAttribute('aria-pressed', 'true')
  for (let i = 0; i < 4; i++) await expect(choices(page).nth(i)).toBeDisabled()
  await expect(page.getByRole('button', { name: '回答を変更する' })).toHaveCount(0)
  await expect(finishBtn(page)).toHaveCount(0)
  await expectNoHorizontalScroll(page)
  await shot(page, '22-review-question')
  await tap(page, prevBtn(page))
  await expect(page.getByText(/^見直し\s+第61問$/)).toBeVisible()
  await expect(verdict(page)).toHaveText('正解')
  await tap(page, page.getByRole('button', { name: '結果に戻る', exact: true }))
  await expect(page.locator('details')).toHaveCount(100) // 正解の問題を見ていたので全問の表示で戻る
  await expect(card(page, 61)).toHaveAttribute('open', '')
  await expect(card(page, 61).locator('summary')).toBeInViewport()
  // 未回答の問題も開ける
  await tap(page, page.getByRole('tab', { name: 'まちがえた問題（3）' }))
  await tap(page, card(page, 90).locator('summary'))
  await tap(page, card(page, 90).getByRole('button', { name: '第90問へ戻る' }))
  await expect(verdict(page)).toHaveCount(0)
  await expect(page.locator('p', { hasText: /^未回答$/ })).toBeVisible()
  await tap(page, page.getByRole('button', { name: '結果に戻る', exact: true }))
  await expect(page.locator('details')).toHaveCount(3)
  await expect(card(page, 90)).toBeInViewport()
  expect(await getItem(page, V5), '見直しでは成績を保存し直さない').toBe(v5Before)

  // 再読み込み：開始画面から同じ内容を見直せる。成績は変わらない
  await page.reload()
  await expect(page.getByText('前回の結果：97 / 100問', { exact: true })).toBeVisible()
  await tap(page, page.getByRole('button', { name: '前回の結果と解説を見る' }))
  await expect(page.locator('p', { hasText: /^97 \/ 100問$/ })).toBeVisible()
  expect(await resultRows(page)).toEqual(rows)
  await expect(page.locator('details')).toHaveCount(3)
  for (const n of [3, 62, 90]) await tap(page, card(page, n).locator('summary'))
  await expectReviewCard(page, QS[2], pickOf(QS[2]))
  await expectReviewCard(page, QS[89], null)
  await tap(page, card(page, 3).getByRole('button', { name: '第3問へ戻る' }))
  await expect(verdict(page)).toHaveText('不正解')
  await tap(page, page.getByRole('button', { name: '結果に戻る', exact: true }))
  expect(await getItem(page, V5)).toBe(v5Before)
  expect(await Promise.all([V1, V2, V3, V4].map((k) => getItem(page, k)))).toEqual(legacyBefore)

  // 解き直しは成績も見直しの記録も変えない
  const reviewBefore = await getItem(page, REVIEW)
  await tap(page, page.getByRole('button', { name: 'まちがえた・未回答の3問を解き直す' }))
  await expect(page.getByText(/^解き直し\s+第3問$/)).toBeVisible()
  for (let i = 0; i < 3; i++) {
    await answer(page, QS[[2, 61, 89][i]].answerIndex)
    if (i < 2) await tap(page, nextBtn(page))
  }
  await tap(page, finishBtn(page))
  await expect(page.locator('p', { hasText: /^3 \/ 3問$/ })).toBeVisible()
  await expect(page.locator('details')).toHaveCount(3)
  expect(await getItem(page, V5)).toBe(v5Before)
  expect(await getItem(page, REVIEW)).toBe(reviewBefore)
})

test('全問不正解：0/100、全科目0%、100問すべてが復習の対象になる', async ({ page }) => {
  await solveAll(page, (q) => (q.answerIndex + 1) % 4)
  await expect(page.locator('p', { hasText: /^0 \/ 100問$/ })).toBeVisible()
  expect(await resultRows(page)).toEqual(SUBJECTS.map(([s, n]) => [s, `0 / ${n}`, '0%']))
  await expect(page.getByRole('button', { name: 'まちがえた100問の解説を見る' })).toBeVisible()
  await expect(page.locator('details')).toHaveCount(100)
  const v5 = JSON.parse((await getItem(page, V5))!)[MOCK_ID]
  expect(v5).toMatchObject({ correct: 0, total: 100 })
  expect(v5.wrongIds).toEqual(QS.map((q) => q.id))
  await tap(page, card(page, 100).locator('summary'))
  await expectReviewCard(page, QS[99], (QS[99].answerIndex + 1) % 4)
  await expectNoHorizontalScroll(page)
  await shot(page, '23-all-wrong')
})

test('見直しの記録が無い以前の100問版の結果（v5）も、まちがえた問題と解説を見られる。解答途中の再読み込みでは成績が変わらない', async ({ page }) => {
  const OLD = { mockId: MOCK_ID, correct: 98, total: 100, wrongIds: ['om02-07', 'om02-75'], completedAt: 1762200000000 }
  await setItems(page, [[V5, JSON.stringify({ [MOCK_ID]: OLD })]])
  const before = await getItem(page, V5)
  await page.goto('/original-mock/02')
  await tap(page, page.getByRole('button', { name: '前回の結果と解説を見る' }))
  await expect(page.locator('p', { hasText: /^98 \/ 100問$/ })).toBeVisible()
  await expect(page.locator('details')).toHaveCount(2)
  await tap(page, card(page, 7).locator('summary'))
  await expectReviewCard(page, QS[6], null, '回答の記録なし')
  await tap(page, card(page, 7).getByRole('button', { name: '第7問へ戻る' }))
  await expect(page.locator('p', { hasText: /^回答の記録なし$/ })).toBeVisible()
  await tap(page, page.getByRole('button', { name: '結果に戻る', exact: true }))
  await expect(page.getByRole('button', { name: 'まちがえた2問を解き直す' })).toBeVisible()
  expect(await getItem(page, V5)).toBe(before)
  expect(await getItem(page, REVIEW)).toBeNull()

  // 別の回の見直し記録は使わない
  await setItems(page, [[REVIEW, JSON.stringify({ [MOCK_ID]: { completedAt: 1, selected: { 'om02-07': 2 } } })]])
  await page.goto('/original-mock/02')
  await tap(page, page.getByRole('button', { name: '前回の結果と解説を見る' }))
  await tap(page, card(page, 7).locator('summary'))
  await expectReviewCard(page, QS[6], null, '回答の記録なし')

  // 壊れた見直し記録でも開ける
  await setItems(page, [[REVIEW, '{oops']])
  await page.goto('/original-mock/02')
  await tap(page, page.getByRole('button', { name: '前回の結果と解説を見る' }))
  await expect(page.locator('details')).toHaveCount(2)

  // 解答の途中で再読み込み：開始画面に戻り、前回の成績はそのまま
  await page.goto('/original-mock/02')
  await startFull(page)
  await answer(page, QS[0].answerIndex)
  await page.reload()
  await expect(page.getByText('前回の結果：98 / 100問', { exact: true })).toBeVisible()
  expect(await getItem(page, V5)).toBe(before)
})
