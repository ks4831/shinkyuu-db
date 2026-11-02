/* ──────────────────────────────────────────────────────────────
   オリジナル模擬試験②（58問：既存40問＋臨床医学18問）の画面テスト
   `npm run test:e2e`（next build のあと Playwright を pc / sp390 の2画面幅で実行）
   - HOME・一覧・開始画面の問題数と科目の内訳、臨床医学を追加した案内
   - 第1〜58問の表示（番号・4択・解説・根拠資料）と、全問正解で 58/58・科目別5区分
   - 第40問⇔第41問の移動と回答の保持
   - 第1〜40問だけ正解で 40/58（臨床医学の2区分が0点）
   - 40問版の過去の結果（旧キー v1）の表示・再挑戦・上書きしないこと／58問版の結果（v2）
   - 壊れた保存データでも開始画面が表示される
   - 横スクロールが出ない
   正答・解説・根拠資料は問題データ（src/data/originalMocks/original-mock-02.json）から読む。データは読むだけで変更しない。
   スクリーンショット：環境変数 E2E_SHOT_DIR を指定したときだけ、第41〜58問などを保存する（目視の確認用）。
   ────────────────────────────────────────────────────────────── */
import { test, expect, type Page } from '@playwright/test'
import { readFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'

type Q = { id: string; questionNumber: number; subject: string; choices: string[]; answerIndex: number; choiceNotes: string[]; point: string; sources: string[] }
const DATA = JSON.parse(readFileSync(path.join(process.cwd(), 'src', 'data', 'originalMocks', 'original-mock-02.json'), 'utf8')) as { questions: Q[] }
const QS = DATA.questions
const V1 = 'shinkyuu_original_mock_results_v1'
const V2 = 'shinkyuu_original_mock_results_v2'
const MOCK_ID = 'original-mock-02'
const SUBJECTS: [string, number][] = [
  ['経絡経穴概論', 20],
  ['はり理論', 10],
  ['きゅう理論', 10],
  ['臨床医学各論', 15],
  ['臨床医学総論', 3],
]
const LEGACY = { mockId: MOCK_ID, correct: 35, total: 40, wrongIds: ['om02-05', 'om02-12', 'om02-22', 'om02-30', 'om02-37'], completedAt: 1761800000000 }

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

/** 出題画面の表示（番号・進み具合・科目・4択） */
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

test('HOME・一覧・開始画面：58問と科目別5区分、臨床医学18問を追加した案内', async ({ page }) => {
  await page.goto('/')
  const card = page.locator('a[href="/original-mock"]').first()
  await expect(card).toContainText('58問')
  await expect(card).toContainText('模擬試験②：経絡経穴概論20・はり理論10・きゅう理論10・臨床医学各論15・臨床医学総論3')
  await expect(card).not.toContainText('40問')
  await card.scrollIntoViewIfNeeded()
  await shot(page, '01-home-card')
  await expectNoHorizontalScroll(page)

  await page.goto('/original-mock')
  const item = page.locator('a[href="/original-mock/02"]')
  await expect(item).toContainText('58問')
  await expect(item).toContainText('経絡経穴概論20・はり理論10・きゅう理論10・臨床医学各論15・臨床医学総論3')
  await expectNoHorizontalScroll(page)
  await tap(page, item)

  await expect(page).toHaveURL(/\/original-mock\/02\/?$/)
  await expect(page.getByText('全58問（経絡経穴概論20問・はり理論10問・きゅう理論10問・臨床医学各論15問・臨床医学総論3問）・四肢択一')).toBeVisible()
  await expect(page.getByText(/臨床医学18問（第41〜58問：臨床医学各論15問・臨床医学総論3問）を追加し、全58問になりました/)).toBeVisible()
  await expect(page.getByText(/有資格者による最終確認は未実施/)).toBeVisible()
  await expect(page.getByRole('button', { name: '解き始める' })).toBeVisible()
  await expect(page.getByText(/前回の結果|40問版/)).toHaveCount(1) // 案内文の「40問版」だけ（結果の行はない）
  await shot(page, '02-start', true)
  await expectNoHorizontalScroll(page)
})

test('第1〜58問：番号・4択・解説・根拠資料が出て、全問正解で 58/58・科目別5区分が満点', async ({ page }) => {
  await page.evaluate(([k, v]) => localStorage.setItem(k, v), [V1, JSON.stringify({ [MOCK_ID]: LEGACY })])
  const v1Before = await page.evaluate((k) => localStorage.getItem(k), V1)
  await startFull(page)
  await expect(prevBtn(page)).toBeDisabled()
  for (let i = 0; i < QS.length; i++) {
    const q = QS[i]
    await expectQuestion(page, q, i + 1, 58)
    await expect(page.getByText(q.subject, { exact: true }).first()).toBeVisible()
    await answer(page, q.answerIndex)
    await expectExplanation(page, q, q.answerIndex)
    if (i === 0 || i === 39 || i >= 40) {
      await expectNoHorizontalScroll(page)
      await shot(page, `q${String(q.questionNumber).padStart(2, '0')}-answered`, true)
    }
    if (i < QS.length - 1) await tap(page, nextBtn(page))
  }
  await expect(nextBtn(page)).toHaveCount(0)
  await tap(page, finishBtn(page))

  await expect(page.getByRole('heading', { name: '結果' })).toBeVisible()
  await expect(page.locator('p', { hasText: /^58 \/ 58問$/ })).toBeVisible()
  expect(await resultRows(page)).toEqual(SUBJECTS.map(([s, n]) => [s, `${n} / ${n}`]))
  await expect(page.getByRole('button', { name: '全58問をもう一度解く' })).toBeVisible()
  await expect(page.locator('details')).toHaveCount(58)
  // 結果画面の解説（第41・56・58問を開く）
  for (const n of [41, 56, 58]) {
    const q = QS[n - 1]
    const d = page.locator('details', { has: page.getByText(`第${n}問`, { exact: true }) })
    await d.locator('summary').click()
    await expect(d.getByText(q.choiceNotes[q.answerIndex], { exact: true })).toBeVisible()
    await expect(d.locator('div', { hasText: /^根拠資料：/ }).filter({ hasText: q.sources.join('／') }).last()).toBeVisible()
  }
  await shot(page, '10-result-full', true)
  await expectNoHorizontalScroll(page)

  // 保存：58問版は v2 に、40問版（v1）は一字一句そのまま
  const v2 = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!), V2)
  expect(v2[MOCK_ID]).toMatchObject({ mockId: MOCK_ID, correct: 58, total: 58, wrongIds: [] })
  expect(await page.evaluate((k) => localStorage.getItem(k), V1)).toBe(v1Before)

  // 開始画面に戻ると、58問版の結果（注記なし）と40問版の結果が別々に出る
  await page.goto('/original-mock/02')
  await expect(page.getByText('前回の結果：58 / 58問', { exact: true })).toBeVisible()
  await expect(page.getByText('40問版の結果（問題を追加する前）：35 / 40問', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: /40問版でまちがえた/ })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'もう一度、全問を解く' })).toBeVisible()
  await shot(page, '11-start-after-58', true)
})

test('第40問⇔第41問：境目をまたいで移動でき、回答・正誤・解説が保持される', async ({ page }) => {
  await startFull(page)
  for (let i = 0; i < 39; i++) await tap(page, nextBtn(page)) // 「あとで解く」で第40問へ
  const q40 = QS[39]
  const q41 = QS[40]
  const wrong41 = (q41.answerIndex + 1) % 4
  await expectQuestion(page, q40, 40, 58)
  await answer(page, q40.answerIndex)
  await tap(page, nextBtn(page))
  await expectQuestion(page, q41, 41, 58)
  await expect(page.getByText('臨床医学各論', { exact: true }).first()).toBeVisible()
  await answer(page, wrong41)
  await expectExplanation(page, q41, wrong41)

  await tap(page, prevBtn(page))
  await expectQuestion(page, q40, 40, 58)
  await expect(choices(page).nth(q40.answerIndex)).toHaveAttribute('aria-pressed', 'true')
  await expectExplanation(page, q40, q40.answerIndex)

  await tap(page, nextBtn(page))
  await expectQuestion(page, q41, 41, 58)
  await expect(choices(page).nth(wrong41)).toHaveAttribute('aria-pressed', 'true')
  await expectExplanation(page, q41, wrong41)
  await expect(page.getByText('（回答済み 2）', { exact: false })).toBeVisible()

  // 未回答を残して第58問から採点 → 未回答の確認
  for (let i = 41; i < 58; i++) await tap(page, nextBtn(page))
  await expectQuestion(page, QS[57], 58, 58)
  await tap(page, finishBtn(page))
  await expect(page.getByText(/^未回答の問題が56問あります（第1・2・3・4・5・6・7・8問など）。$/)).toBeVisible()
  await tap(page, page.getByRole('button', { name: '未回答の問題へ' }))
  await expectQuestion(page, QS[0], 1, 58)
})

test('第1〜40問だけ正解：40/58、臨床医学の2区分は0点', async ({ page }) => {
  await startFull(page)
  for (let i = 0; i < QS.length; i++) {
    const q = QS[i]
    await answer(page, i < 40 ? q.answerIndex : (q.answerIndex + 1) % 4)
    if (i < QS.length - 1) await tap(page, nextBtn(page))
  }
  await tap(page, finishBtn(page))
  await expect(page.locator('p', { hasText: /^40 \/ 58問$/ })).toBeVisible()
  expect(await resultRows(page)).toEqual(SUBJECTS.map(([s, n]) => [s, s.startsWith('臨床医学') ? `0 / ${n}` : `${n} / ${n}`]))
  await expect(page.getByRole('button', { name: 'まちがえた18問を解き直す' })).toBeVisible()
  await shot(page, '12-result-40of58', true)

  // 解き直し：第41〜58問だけ、番号は元のまま、結果は保存しない
  const before = await page.evaluate((k) => localStorage.getItem(k), V2)
  await tap(page, page.getByRole('button', { name: 'まちがえた18問を解き直す' }))
  await expect(page.getByText(/^解き直し\s+第41問$/)).toBeVisible()
  await expect(page.getByText(/^1 \/ 18問/)).toBeVisible()
  for (let i = 40; i < 58; i++) {
    await answer(page, QS[i].answerIndex)
    if (i < 57) await tap(page, nextBtn(page))
  }
  await tap(page, finishBtn(page))
  await expect(page.locator('p', { hasText: /^18 \/ 18問$/ })).toBeVisible()
  expect(await page.evaluate((k) => localStorage.getItem(k), V2)).toBe(before)
})

test('40問版の過去の結果（旧キー v1）：「40問版」と明示し、再挑戦でき、上書きしない', async ({ page }) => {
  const raw = JSON.stringify({ [MOCK_ID]: LEGACY })
  await page.evaluate(([k, v]) => localStorage.setItem(k, v), [V1, raw])
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
  // 再挑戦は保存しない：v1 はそのまま、v2 は作られない
  expect(await page.evaluate((k) => localStorage.getItem(k), V1)).toBe(raw)
  expect(await page.evaluate((k) => localStorage.getItem(k), V2)).toBeNull()
})

test('壊れた保存データでも開始画面が表示され、58問を解いて保存できる', async ({ page }) => {
  for (const [v1, v2] of [
    ['{oops', '{oops'],
    ['[1,2]', 'null'],
    [JSON.stringify({ [MOCK_ID]: { correct: 3, total: '40', wrongIds: [] } }), JSON.stringify({ [MOCK_ID]: { correct: 99, total: 58, wrongIds: 'x' } })],
  ]) {
    await page.evaluate(([a, b, k1, k2]) => {
      localStorage.setItem(k1, a)
      localStorage.setItem(k2, b)
    }, [v1, v2, V1, V2])
    await page.goto('/original-mock/02')
    await expect(page.getByText(/^全58問/)).toBeVisible()
    await expect(page.getByRole('button', { name: '解き始める' })).toBeVisible()
    await expect(page.getByText(/^前回の結果|^40問版の結果/)).toHaveCount(0)
  }
  // 壊れた v2 のままでも採点・保存でき、旧キーの中身は消さない
  await page.evaluate(([k1, k2]) => {
    localStorage.setItem(k1, '{oops')
    localStorage.setItem(k2, '{oops')
  }, [V1, V2])
  await startFull(page)
  for (let i = 0; i < 57; i++) await tap(page, nextBtn(page))
  await answer(page, QS[57].answerIndex)
  await tap(page, finishBtn(page))
  await tap(page, page.getByRole('button', { name: 'このまま採点する' }))
  await expect(page.locator('p', { hasText: /^1 \/ 58問$/ })).toBeVisible()
  expect(await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!)['original-mock-02'].total, V2)).toBe(58)
  expect(await page.evaluate((k) => localStorage.getItem(k), V1)).toBe('{oops')
})
