/* ──────────────────────────────────────────────────────────────
   予想問題の「← 前の問題」（QuizRunner の全8モード）の画面テスト
   `npm run test:e2e`（next build のあと Playwright を pc / sp390 の2画面幅で実行）
   - ランダム・頻出・経穴・新基準・科目別・テーマ別・今日の10問・苦手復習
   - 回答→次へ→前へで、選んだ回答・正誤・正答・解説が残る／回答済みの範囲内で前後に移動できる
   - 未回答の問題を飛ばして先へ進めない／回答済みの問題は回答し直せない
   - 最初の問題では「前の問題」が押せない／最後の問題からも戻れる／結果画面の採点
   - 今日の10問の途中再開（選択肢の復元。選択肢を保存していない旧データも読める）と完了の記録
   - ボタンが押せる位置にあり（ヘッダー・下部メニューに隠れない）、横スクロールが出ない
   選択肢は表示のたびにシャッフルされるので、正答の位置は表示された選択肢の文章から求める。
   問題データ（src/data/quizQuestions.ts）は読むだけで変更しない。
   ────────────────────────────────────────────────────────────── */
import { test, expect, type Page } from '@playwright/test'
import { QUIZ_QUESTIONS } from '../src/data/quizQuestions'

type Q = (typeof QUIZ_QUESTIONS)[number]
const BY_TEXT = new Map<string, Q>()
for (const q of QUIZ_QUESTIONS) BY_TEXT.set(q.question.trim(), q)

/* ── 対象の科目・テーマ（問題データから選ぶ） ── */
function countBy(key: (q: Q) => string | undefined) {
  const m = new Map<string, number>()
  for (const q of QUIZ_QUESTIONS) {
    const k = key(q)
    if (k) m.set(k, (m.get(k) ?? 0) + 1)
  }
  return m
}
/** 10問以上ある科目 */
const SUBJECT = [...countBy((q) => q.subject)].find(([, n]) => n >= 10)![0]
/** 5〜9問のテーマ（最後の問題まで解き切る。共通の流れは4問目まで使う） */
const [THEME, THEME_COUNT] = [...countBy((q) => q.themeId)].find(([, n]) => n >= 5 && n < 10)!

/* ── 画面操作のヘルパー ── */
const prevBtn = (p: Page) => p.getByRole('button', { name: '← 前の問題', exact: true })
const nextBtn = (p: Page) => p.getByRole('button', { name: /^(次の問題 →|結果を見る)$/ })
const answerBtn = (p: Page) => p.getByRole('button', { name: '回答する', exact: true })
const choices = (p: Page) => p.locator('button[aria-pressed]')
const verdict = (p: Page) => p.locator('p', { hasText: /^(正解！|惜しい！)$/ })

/** いま表示している問題と、表示順の選択肢の文章 */
async function current(p: Page): Promise<{ q: Q; shown: string[]; right: number }> {
  const text = (await p.locator('h1').last().innerText()).trim()
  const q = BY_TEXT.get(text)
  if (!q) throw new Error(`unknown question: ${text}`)
  const shown = await choices(p).locator('span:last-child').allInnerTexts()
  const right = shown.indexOf(q.choices[q.correctAnswer])
  expect(right, '正答の選択肢が表示されている').toBeGreaterThanOrEqual(0)
  return { q, shown, right }
}

/**
 * 画面の中央までスクロールし、ボタンの中央に当たるか（他の要素に覆われていないか）を確かめてから実際にクリックする。
 * scrollIntoViewIfNeeded は下部メニューの裏に半分入った位置で止まることがあるため、利用者と同じく見える位置まで動かす
 */
async function press(p: Page, loc: ReturnType<Page['locator']>) {
  await loc.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }))
  const hit = await loc.evaluate((el) => {
    const r = el.getBoundingClientRect()
    const t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
    return !!t && (t === el || el.contains(t))
  })
  expect(hit, 'ボタンが他の要素に覆われていない').toBe(true)
  await loc.click()
}

type Done = { q: Q; text: string; correct: boolean }

/** 今の問題に回答する。how は 'right'（正答）・'wrong'（誤答） */
async function answer(p: Page, how: 'right' | 'wrong'): Promise<Done> {
  const { q, shown, right } = await current(p)
  const idx = how === 'right' ? right : shown.findIndex((_, i) => i !== right)
  await press(p, choices(p).nth(idx))
  await press(p, answerBtn(p))
  await expect(verdict(p)).toHaveText(how === 'right' ? '正解！' : '惜しい！')
  return { q, text: shown[idx], correct: how === 'right' }
}

/** 回答済みの問題として、選んだ回答・正誤・正答・解説が表示され、回答し直せないか。text=null は選択肢の記録なし */
async function expectAnswered(p: Page, d: { q: Q; text: string | null; correct: boolean }) {
  const { q, shown } = await current(p)
  expect(q.id).toBe(d.q.id)
  await expect(answerBtn(p)).toHaveCount(0)
  for (let i = 0; i < shown.length; i++) {
    await expect(choices(p).nth(i)).toBeDisabled()
    await expect(choices(p).nth(i)).toHaveAttribute('aria-pressed', String(shown[i] === d.text))
  }
  await expect(verdict(p)).toHaveText(d.correct ? '正解！' : '惜しい！')
  await expect(p.locator('dd').first()).toContainText(q.choices[q.correctAnswer])
  await expect(p.getByText(q.explanation.slice(0, 30), { exact: false }).first()).toBeVisible()
  await expect(p.getByText('選んだ選択肢はこの端末に記録されていません')).toHaveCount(d.text === null ? 1 : 0)
}

async function expectNoHorizontalScroll(p: Page) {
  const over = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(over, '横スクロールが出ない').toBeLessThanOrEqual(0)
}

/**
 * 共通の流れ：1問目は「前」が押せない・未回答では「次」が押せない → 3問回答して前へ戻り、
 * 回答が残り回答し直せない → 回答済みの範囲内で次へ進み、最初の未回答で止まる
 */
async function basicFlow(p: Page) {
  await expect(prevBtn(p)).toBeDisabled()
  await expect(nextBtn(p)).toBeDisabled()
  await expect(p.getByText('回答すると次の問題へ進めます')).toBeVisible()
  // 選んだだけ（未回答）でも進めない
  await press(p, choices(p).first())
  await expect(nextBtn(p)).toBeDisabled()

  const done: Done[] = []
  done.push(await answer(p, 'right'))
  await press(p, nextBtn(p))
  done.push(await answer(p, 'wrong'))
  await press(p, nextBtn(p))
  done.push(await answer(p, 'right'))
  await press(p, nextBtn(p))
  const fourth = (await current(p)).q
  // 4問目で選択だけしてから戻る（回答前の選択は残る）
  await press(p, choices(p).nth(1))
  const draftText = (await current(p)).shown[1]

  for (const d of [...done].reverse()) {
    await press(p, prevBtn(p))
    await expectAnswered(p, d)
  }
  await expect(prevBtn(p)).toBeDisabled()
  await expectNoHorizontalScroll(p)

  for (const d of done.slice(1)) {
    await press(p, nextBtn(p))
    await expectAnswered(p, d)
  }
  await press(p, nextBtn(p))
  expect((await current(p)).q.id).toBe(fourth.id)
  await expect(answerBtn(p)).toBeVisible()
  await expect(choices(p).filter({ hasText: draftText })).toHaveAttribute('aria-pressed', 'true')
  await expect(nextBtn(p)).toBeDisabled()
  return done
}

/** 残りの問題をすべて正解し、最後の問題から1問戻って進み直してから結果を見る */
async function finishAll(p: Page, total: number, done: Done[]) {
  while (done.length < total) {
    done.push(await answer(p, 'right'))
    if (done.length < total) await press(p, nextBtn(p))
  }
  await expect(nextBtn(p)).toHaveText('結果を見る')
  await press(p, prevBtn(p))
  await expectAnswered(p, done[total - 2])
  await expect(nextBtn(p)).toHaveText('次の問題 →')
  await press(p, nextBtn(p))
  await expectAnswered(p, done[total - 1])
  await press(p, nextBtn(p))
  return done.filter((d) => d.correct).length
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

for (const [name, url, total] of [
  ['ランダム', '/quiz/random', 10],
  ['頻出', '/quiz/frequent', 10],
  ['経穴', '/quiz/acupoints', 10],
  ['新基準', '/quiz/standard-2026', 10],
  ['科目別', `/quiz/subjects/${SUBJECT}`, 10],
  ['テーマ別', `/quiz/theme/${THEME}`, THEME_COUNT],
] as const) {
  test(`${name}：前後移動・回答保持・飛ばし防止・最後から戻る・採点`, async ({ page }) => {
    await page.goto(url)
    await expect(page.getByText(`第 1 / ${total} 問`)).toBeVisible()
    const done = await basicFlow(page)
    const score = await finishAll(page, total, done)
    await expect(page.getByText('おつかれさまでした')).toBeVisible()
    await expect(page.locator('p', { hasText: `${score} / ${total}問` })).toBeVisible()
    // 学習記録：回答した問題が1回ずつ記録される（前後に移動しても二重に数えない）
    const hist = await page.evaluate(() => JSON.parse(localStorage.getItem('shinkyuu_quiz_history_v1')!))
    expect(hist.attempts.map((a: { qid: string }) => a.qid)).toEqual(done.map((d) => d.q.id))
    // 間違えた問題（1問）は苦手復習の対象に入る
    const weak = await page.evaluate(() => JSON.parse(localStorage.getItem('shinkyuu_quiz_weak_v1')!))
    expect(weak.map((w: { qid: string }) => w.qid)).toEqual([done[1].q.id])
  })
}

test('苦手復習：前後移動・回答保持・最後から戻る・採点', async ({ page }) => {
  const ids = QUIZ_QUESTIONS.slice(0, 4).map((q) => ({ qid: q.id, subject: q.subject, streak: 0, addedAt: 1 }))
  await page.evaluate((w) => localStorage.setItem('shinkyuu_quiz_weak_v1', JSON.stringify(w)), ids)
  await page.goto('/quiz/weak')
  await expect(page.getByText('第 1 / 4 問')).toBeVisible()
  const done = await basicFlow(page)
  const score = await finishAll(page, 4, done)
  await expect(page.locator('p', { hasText: `${score} / 4問` })).toBeVisible()
})

test('今日の10問：途中再開で選択肢まで復元し、前へ戻れる。完了の記録が残る', async ({ page }) => {
  await page.goto('/quiz/daily')
  const done = await basicFlow(page)
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('shinkyuu_daily_quiz_v1')!))
  expect(saved.currentIndex).toBe(3)
  expect(saved.answers.slice(0, 4)).toEqual([true, false, true, null])
  // 選んだ選択肢は元の番号（シャッフル前）で保存する
  expect(saved.choices.slice(0, 3)).toEqual(done.map((d) => d.q.choices.indexOf(d.text)))

  // 再読み込み＝選択肢の並びが変わっても、選んだ選択肢を復元する
  await page.reload()
  await expect(page.getByText('第 4 / 10 問')).toBeVisible()
  await expect(nextBtn(page)).toBeDisabled()
  for (const d of [...done].reverse()) {
    await press(page, prevBtn(page))
    await expectAnswered(page, d)
  }
  await expect(prevBtn(page)).toBeDisabled()
  for (let i = 0; i < 3; i++) await press(page, nextBtn(page))

  const score = await finishAll(page, 10, done)
  await expect(page.getByText('今日の学習 完了！')).toBeVisible()
  await expect(page.locator('p', { hasText: `${score} / 10問` })).toBeVisible()
  await expect(page.getByText('連続学習 1日')).toBeVisible()
  const after = await page.evaluate(() => ({
    state: JSON.parse(localStorage.getItem('shinkyuu_daily_quiz_v1')!),
    history: JSON.parse(localStorage.getItem('shinkyuu_daily_history_v1')!),
  }))
  expect(after.state.completed).toBe(true)
  expect(after.history[0]).toMatchObject({ correct: score, total: 10, completed: true })
})

test('今日の10問：選択肢を保存していない旧データでも再開でき、前へ戻ると正誤と解説を表示する', async ({ page }) => {
  await page.goto('/quiz/daily')
  const a1 = await answer(page, 'right')
  await press(page, nextBtn(page))
  const a2 = await answer(page, 'wrong')
  // 保存データから choices を外し、この機能より前の形に戻す
  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('shinkyuu_daily_quiz_v1')!)
    delete s.choices
    localStorage.setItem('shinkyuu_daily_quiz_v1', JSON.stringify(s))
  })
  await page.reload()
  await expect(page.getByText('第 3 / 10 問')).toBeVisible()
  await press(page, prevBtn(page))
  await expectAnswered(page, { ...a2, text: null })
  await press(page, prevBtn(page))
  await expectAnswered(page, { ...a1, text: null })
  await expect(prevBtn(page)).toBeDisabled()
  // 再開後に回答した問題は choices 付きで保存し、旧データの2問は記録なしのまま
  await press(page, nextBtn(page))
  await press(page, nextBtn(page))
  const a3 = await answer(page, 'right')
  const s = await page.evaluate(() => JSON.parse(localStorage.getItem('shinkyuu_daily_quiz_v1')!))
  expect(s.answers.slice(0, 4)).toEqual([true, false, true, null])
  expect(s.choices.slice(0, 4)).toEqual([null, null, a3.q.choices.indexOf(a3.text), null])
})

test('表示：前後のボタンが画面内に並び、スクリーンショットを残す', async ({ page }, info) => {
  await page.goto('/quiz/random')
  await answer(page, 'wrong')
  await press(page, nextBtn(page))
  await answer(page, 'right')
  await press(page, prevBtn(page))
  const prev = await prevBtn(page).boundingBox()
  const next = await nextBtn(page).boundingBox()
  expect(prev && next && Math.abs(prev.y - next.y) < 2, '前後のボタンが横に並ぶ').toBe(true)
  expect(prev!.height).toBeGreaterThanOrEqual(44)
  await expectNoHorizontalScroll(page)
  await prevBtn(page).scrollIntoViewIfNeeded()
  await page.screenshot({ path: `test-results/screens/quiz-prev-${info.project.name}.png` })
  // 上部の「← 戻る」も押せる位置にある
  await page.evaluate(() => window.scrollTo(0, 0))
  await expect(page.getByRole('button', { name: '戻る' }).or(page.getByRole('link', { name: '戻る' })).first()).toBeVisible()
})
