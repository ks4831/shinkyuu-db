/* ──────────────────────────────────────────────────────────────
   オリジナル模擬試験②（80問：既存40問＋臨床医学18問＋臨床医学・リハビリテーション医学10問＋基礎6科目12問）の画面テスト
   `npm run test:e2e`（next build のあと Playwright を pc / sp390 の2画面幅で実行）
   - HOME・一覧・開始画面の問題数と科目の内訳、問題を追加した案内
   - 第1〜80問の表示（番号・4択・解説・根拠資料）と、全問正解で 80/80・科目別12区分
   - 第40問⇔第41問、第58問⇔第59問、第68問⇔第69問の移動と回答の保持、最終問題（第80問）
   - 第1〜40問だけ正解で 40/80（臨床医学・リハビリテーション医学・基礎6科目の9区分が0点）
   - 40問版（旧キー v1）・58問版（旧キー v2）・68問版（旧キー v3）の過去の結果の表示・再挑戦・上書きしないこと／80問版の結果（v4）
   - 壊れた保存データでも開始画面が表示される
   - 横スクロールが出ない
   正答・解説・根拠資料は問題データ（src/data/originalMocks/original-mock-02.json）から読む。データは読むだけで変更しない。
   スクリーンショット：環境変数 E2E_SHOT_DIR を指定したときだけ、第41〜80問などを保存する（目視の確認用）。
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
const MOCK_ID = 'original-mock-02'
const SUBJECTS: [string, number][] = [
  ['経絡経穴概論', 20],
  ['はり理論', 10],
  ['きゅう理論', 10],
  ['臨床医学各論', 22],
  ['臨床医学総論', 5],
  ['リハビリテーション医学', 1],
  ['医療概論', 2],
  ['衛生学・公衆衛生学', 2],
  ['関係法規', 2],
  ['解剖学', 2],
  ['生理学', 2],
  ['病理学概論', 2],
]
const BASIC6 = ['医療概論', '衛生学・公衆衛生学', '関係法規', '解剖学', '生理学', '病理学概論']
const LEGACY40 = { mockId: MOCK_ID, correct: 35, total: 40, wrongIds: ['om02-05', 'om02-12', 'om02-22', 'om02-30', 'om02-37'], completedAt: 1761800000000 }
const LEGACY58 = { mockId: MOCK_ID, correct: 50, total: 58, wrongIds: ['om02-41', 'om02-50'], completedAt: 1762100000000 }
const LEGACY68 = { mockId: MOCK_ID, correct: 65, total: 68, wrongIds: ['om02-07', 'om02-59', 'om02-64'], completedAt: 1762150000000 }

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

test('HOME・一覧・開始画面：80問と科目別12区分、問題を追加した案内', async ({ page }) => {
  expect(N).toBe(80)
  const breakdown = '経絡経穴概論20・はり理論10・きゅう理論10・臨床医学各論22・臨床医学総論5・リハビリテーション医学1・医療概論2・衛生学・公衆衛生学2・関係法規2・解剖学2・生理学2・病理学概論2'
  await page.goto('/')
  const card = page.locator('a[href="/original-mock"]').first()
  await expect(card).toContainText('80問')
  await expect(card).toContainText(`模擬試験②：${breakdown}`)
  await expect(card).not.toContainText('68問')
  await card.scrollIntoViewIfNeeded()
  await shot(page, '01-home-card')
  await expectNoHorizontalScroll(page)

  await page.goto('/original-mock')
  const item = page.locator('a[href="/original-mock/02"]')
  await expect(item).toContainText('80問')
  await expect(item).toContainText(breakdown)
  await expectNoHorizontalScroll(page)
  await tap(page, item)

  await expect(page).toHaveURL(/\/original-mock\/02\/?$/)
  await expect(
    page.getByText('全80問（経絡経穴概論20問・はり理論10問・きゅう理論10問・臨床医学各論22問・臨床医学総論5問・リハビリテーション医学1問・医療概論2問・衛生学・公衆衛生学2問・関係法規2問・解剖学2問・生理学2問・病理学概論2問）・四肢択一'),
  ).toBeVisible()
  await expect(page.getByText(/基礎6科目12問（第69〜80問：医療概論・衛生学・公衆衛生学・関係法規・解剖学・生理学・病理学概論 各2問）を追加し、全80問になりました/)).toBeVisible()
  await expect(page.getByText(/有資格者による最終確認は未実施/)).toBeVisible()
  await expect(page.getByRole('button', { name: '解き始める' })).toBeVisible()
  await expect(page.getByText(/^前回の結果|問版の結果（問題を追加する前）/)).toHaveCount(0)
  await shot(page, '02-start', true)
  await expectNoHorizontalScroll(page)
})

test('第1〜80問：番号・4択・解説・根拠資料が出て、全問正解で 80/80・科目別12区分が満点', async ({ page }) => {
  await setItems(page, [
    [V1, JSON.stringify({ [MOCK_ID]: LEGACY40 })],
    [V2, JSON.stringify({ [MOCK_ID]: LEGACY58 })],
    [V3, JSON.stringify({ [MOCK_ID]: LEGACY68 })],
  ])
  const v1Before = await getItem(page, V1)
  const v2Before = await getItem(page, V2)
  const v3Before = await getItem(page, V3)
  await startFull(page)
  await expect(prevBtn(page)).toBeDisabled()
  for (let i = 0; i < N; i++) {
    const q = QS[i]
    await expectQuestion(page, q, i + 1, N)
    await expect(page.getByText(q.subject, { exact: true }).first()).toBeVisible()
    await answer(page, q.answerIndex)
    await expectExplanation(page, q, q.answerIndex)
    if (i === 0 || i === 39 || i === 57 || i >= 67) {
      await expectNoHorizontalScroll(page)
      await shot(page, `q${String(q.questionNumber).padStart(2, '0')}-answered`, true)
    }
    if (i < N - 1) await tap(page, nextBtn(page))
  }
  await expect(page.getByText(/第80問$/).first()).toBeVisible()
  await expect(nextBtn(page)).toHaveCount(0)
  await tap(page, finishBtn(page))

  await expect(page.getByRole('heading', { name: '結果' })).toBeVisible()
  await expect(page.locator('p', { hasText: /^80 \/ 80問$/ })).toBeVisible()
  expect(await resultRows(page)).toEqual(SUBJECTS.map(([s, n]) => [s, `${n} / ${n}`]))
  await expect(page.getByRole('button', { name: '全80問をもう一度解く' })).toBeVisible()
  await expect(page.locator('details')).toHaveCount(80)
  for (const n of [41, 58, 59, 68, 69, 74, 80]) {
    const q = QS[n - 1]
    const d = page.locator('details', { has: page.getByText(`第${n}問`, { exact: true }) })
    await d.locator('summary').click()
    await expect(d.getByText(q.choiceNotes[q.answerIndex], { exact: true })).toBeVisible()
    await expect(d.locator('div', { hasText: /^根拠資料：/ }).filter({ hasText: q.sources.join('／') }).last()).toBeVisible()
  }
  await shot(page, '10-result-full', true)
  await expectNoHorizontalScroll(page)

  // 保存：80問版は v4 に、40問版（v1）・58問版（v2）・68問版（v3）は一字一句そのまま
  const v4 = JSON.parse((await getItem(page, V4))!)
  expect(v4[MOCK_ID]).toMatchObject({ mockId: MOCK_ID, correct: 80, total: 80, wrongIds: [] })
  expect(await getItem(page, V1)).toBe(v1Before)
  expect(await getItem(page, V2)).toBe(v2Before)
  expect(await getItem(page, V3)).toBe(v3Before)

  // 開始画面に戻ると、80問版の結果と、68問版・58問版・40問版の結果が別々に出る
  await page.goto('/original-mock/02')
  await expect(page.getByText('前回の結果：80 / 80問', { exact: true })).toBeVisible()
  await expect(page.getByText('68問版の結果（問題を追加する前）：65 / 68問', { exact: true })).toBeVisible()
  await expect(page.getByText('58問版の結果（問題を追加する前）：50 / 58問', { exact: true })).toBeVisible()
  await expect(page.getByText('40問版の結果（問題を追加する前）：35 / 40問', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: /問版でまちがえた/ })).toHaveCount(0)
  await shot(page, '11-start-after-80', true)
})

test('第40問⇔第41問・第58問⇔第59問・第68問⇔第69問：境目をまたいで移動でき、回答・正誤・解説が保持される', async ({ page }) => {
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

  // 最終問題（第80問）まで進み、未回答を残して採点 → 未回答の確認
  for (let i = 69; i < N; i++) await tap(page, nextBtn(page))
  await expectQuestion(page, QS[N - 1], N, N)
  await expect(nextBtn(page)).toHaveCount(0)
  await tap(page, finishBtn(page))
  await expect(page.getByText(/^未回答の問題が74問あります（第1・2・3・4・5・6・7・8問など）。$/)).toBeVisible()
  await tap(page, page.getByRole('button', { name: '未回答の問題へ' }))
  await expectQuestion(page, QS[0], 1, N)
})

test('第1〜40問だけ正解：40/80、臨床医学・リハビリテーション医学・基礎6科目の9区分は0点', async ({ page }) => {
  await startFull(page)
  for (let i = 0; i < N; i++) {
    const q = QS[i]
    await answer(page, i < 40 ? q.answerIndex : (q.answerIndex + 1) % 4)
    if (i < N - 1) await tap(page, nextBtn(page))
  }
  await tap(page, finishBtn(page))
  await expect(page.locator('p', { hasText: /^40 \/ 80問$/ })).toBeVisible()
  expect(await resultRows(page)).toEqual(
    SUBJECTS.map(([s, n]) => [s, s.startsWith('臨床医学') || s === 'リハビリテーション医学' || BASIC6.includes(s) ? `0 / ${n}` : `${n} / ${n}`]),
  )
  await expect(page.getByRole('button', { name: 'まちがえた40問を解き直す' })).toBeVisible()
  await shot(page, '12-result-40of80', true)

  // 解き直し：第41〜80問だけ、番号は元のまま、結果は保存しない
  const before = await getItem(page, V4)
  await tap(page, page.getByRole('button', { name: 'まちがえた40問を解き直す' }))
  await expect(page.getByText(/^解き直し\s+第41問$/)).toBeVisible()
  await expect(page.getByText(/^1 \/ 40問/)).toBeVisible()
  for (let i = 40; i < N; i++) {
    await answer(page, QS[i].answerIndex)
    if (i < N - 1) await tap(page, nextBtn(page))
  }
  await tap(page, finishBtn(page))
  await expect(page.locator('p', { hasText: /^40 \/ 40問$/ })).toBeVisible()
  expect(await getItem(page, V4)).toBe(before)
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
})

test('壊れた保存データでも開始画面が表示され、80問を解いて保存できる', async ({ page }) => {
  for (const [v1, v2, v3, v4] of [
    ['{oops', '{oops', '{oops', '{oops'],
    ['[1,2]', 'null', '"x"', '[]'],
    [
      JSON.stringify({ [MOCK_ID]: { correct: 3, total: '40', wrongIds: [] } }),
      JSON.stringify({ [MOCK_ID]: { correct: 99, total: 58, wrongIds: 'x' } }),
      JSON.stringify({ [MOCK_ID]: { correct: 1, total: 0, wrongIds: [] } }),
      JSON.stringify({ [MOCK_ID]: { correct: 2, total: 80 } }),
    ],
  ]) {
    await setItems(page, [
      [V1, v1],
      [V2, v2],
      [V3, v3],
      [V4, v4],
    ])
    await page.goto('/original-mock/02')
    await expect(page.getByText(/^全80問/)).toBeVisible()
    await expect(page.getByRole('button', { name: '解き始める' })).toBeVisible()
    await expect(page.getByText(/^前回の結果|問版の結果（問題を追加する前）/)).toHaveCount(0)
  }
  // 壊れた v4 のままでも採点・保存でき、旧キーの中身は消さない
  await setItems(page, [
    [V1, '{oops'],
    [V2, '{oops'],
    [V3, '{oops'],
    [V4, '{oops'],
  ])
  await startFull(page)
  for (let i = 0; i < N - 1; i++) await tap(page, nextBtn(page))
  await answer(page, QS[N - 1].answerIndex)
  await tap(page, finishBtn(page))
  await tap(page, page.getByRole('button', { name: 'このまま採点する' }))
  await expect(page.locator('p', { hasText: /^1 \/ 80問$/ })).toBeVisible()
  expect(JSON.parse((await getItem(page, V4))!)[MOCK_ID].total).toBe(80)
  expect(await getItem(page, V1)).toBe('{oops')
  expect(await getItem(page, V2)).toBe('{oops')
  expect(await getItem(page, V3)).toBe('{oops')
})
