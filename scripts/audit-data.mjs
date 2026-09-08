#!/usr/bin/env node
/* ──────────────────────────────────────────────────────────────
   鍼灸DB データ品質監査スクリプト   `npm run audit:data`
   - src/data/raw/exam-*.csv（過去問の出題実績メモ）
   - src/lib/data.ts（themes / subjects）
   - src/data/quizQuestions.ts（オリジナルクイズ）
   - src/data/acupoints.ts / src/data/learningDiagrams.ts
   を機械的に検査し、ERROR / WARN を分けて報告する。
   終了コード：ERROR があれば 1、なければ 0。
   ────────────────────────────────────────────────────────────── */
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const ROOT = process.cwd()
const ROUNDS = [29, 30, 31, 32, 33, 34]
const QUESTIONS_PER_ROUND = 180

const errors = []
const warns = []
const info = {}
const E = (m) => errors.push(m)
const W = (m) => warns.push(m)

/* 正規14科目（id ↔ 正式名称） */
export const CANONICAL_SUBJECTS = [
  ['medical-overview', '医療概論'],
  ['hygiene', '衛生学・公衆衛生学'],
  ['regulations', '関係法規'],
  ['anatomy', '解剖学'],
  ['physiology', '生理学'],
  ['pathology', '病理学概論'],
  ['clinical-general', '臨床医学総論'],
  ['clinical-specific', '臨床医学各論'],
  ['rehabilitation', 'リハビリテーション医学'],
  ['oriental-overview', '東洋医学概論'],
  ['meridians-acupoints', '経絡経穴概論'],
  ['oriental-clinical', '東洋医学臨床論'],
  ['acupuncture-theory', 'はり理論'],
  ['moxibustion-theory', 'きゅう理論'],
]
const ID_SET = new Set(CANONICAL_SUBJECTS.map(([id]) => id))
const NAME2ID = new Map()
for (const [id, name] of CANONICAL_SUBJECTS) {
  NAME2ID.set(id, id)
  NAME2ID.set(name, id)
}
/* 既知の別名・旧称・表記揺れ → 正規id */
for (const [alias, id] of [
  ['病理学', 'pathology'],
  ['はり理論 ', 'acupuncture-theory'],
]) NAME2ID.set(alias, id)

function normalizeSubjectToId(raw) {
  if (raw == null) return null
  return NAME2ID.get(String(raw).trim()) ?? null
}

/* ── CSV パーサ（引用符対応） ─────────────────── */
function parseCSVLine(line) {
  const out = []
  let cur = ''
  let q = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (q) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++ }
      else if (c === '"') q = false
      else cur += c
    } else {
      if (c === '"') q = true
      else if (c === ',') { out.push(cur); cur = '' }
      else cur += c
    }
  }
  out.push(cur)
  return out
}

function loadCSV() {
  const rows = []
  const perRound = {}
  const EXPECTED_HEADER = 'id,examRound,year,questionNumber,session,subject,officialLarge,officialMedium,officialSmall,normalizedTheme,subTheme,importance,studyPoint,sourceUrl,sourceReliability,blueprintVersion,questionCountMode,memo,themeId'
  for (const r of ROUNDS) {
    const fp = path.join(ROOT, 'src/data/raw', `exam-${r}.csv`)
    if (!fs.existsSync(fp)) { E(`CSV欠落: exam-${r}.csv`); perRound[r] = 0; continue }
    const raw = fs.readFileSync(fp, 'utf-8').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    const lines = raw.split('\n')
    const header = lines[0].trim()
    if (header !== EXPECTED_HEADER) {
      const hCols = parseCSVLine(header).map((s) => s.trim())
      W(`exam-${r}.csv ヘッダーが基準と不一致 (列数 ${hCols.length})`)
    }
    const hCols = parseCSVLine(header).map((s) => s.trim())
    let emptyLines = 0
    let count = 0
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]
      // 末尾の改行1つ（＝最終要素の空文字）は正常なので無視
      if (!line.trim()) { if (i !== lines.length - 1) emptyLines++; continue }
      const vals = parseCSVLine(line)
      if (vals.length !== hCols.length) W(`exam-${r}.csv:${i + 1} 列数 ${vals.length} ≠ ヘッダー ${hCols.length}`)
      const o = { _round: r, _line: i + 1 }
      hCols.forEach((k, j) => { o[k] = (vals[j] ?? '').trim() })
      rows.push(o)
      count++
    }
    perRound[r] = count
    if (emptyLines) W(`exam-${r}.csv に空行 ${emptyLines} 行`)
  }
  return { rows, perRound }
}

/* ── 動的 import（.ts）─────────────────────────── */
async function importTS(rel) {
  // tsx ローダー経由で実行される前提（npm run audit:data）
  return import(pathToFileURL(path.join(ROOT, rel)).href)
}

/* ══════════════ 実行 ══════════════ */
const { rows, perRound } = loadCSV()
const total = rows.length
info.csvTotal = total
info.perRound = perRound

/* 1. 年度別問題数・欠番・重複 */
const roundReport = {}
for (const r of ROUNDS) {
  const rr = rows.filter((q) => q._round === r)
  const nums = rr.map((q) => Number(q.questionNumber))
  const seen = new Map()
  nums.forEach((n) => seen.set(n, (seen.get(n) ?? 0) + 1))
  const dup = [...seen.entries()].filter(([, c]) => c > 1).map(([n]) => n).sort((a, b) => a - b)
  const missing = []
  for (let i = 1; i <= QUESTIONS_PER_ROUND; i++) if (!seen.has(i)) missing.push(i)
  roundReport[r] = { count: rr.length, dup, missing }
  if (rr.length !== QUESTIONS_PER_ROUND) E(`第${r}回 問題数 ${rr.length} ≠ ${QUESTIONS_PER_ROUND}`)
  if (dup.length) E(`第${r}回 questionNumber 重複: ${dup.join(', ')}`)
  if (missing.length) E(`第${r}回 questionNumber 欠番: ${missing.join(', ')}`)
  // examRound/year 整合
  rr.forEach((q) => {
    if (Number(q.examRound) !== r) E(`${q.id} examRound 列 ${q.examRound} ≠ ファイル ${r}`)
  })
}
info.roundReport = roundReport
if (total !== ROUNDS.length * QUESTIONS_PER_ROUND) E(`CSV総数 ${total} ≠ ${ROUNDS.length}×${QUESTIONS_PER_ROUND}`)

/* id 重複 */
const idSeen = new Map()
rows.forEach((q) => idSeen.set(q.id, (idSeen.get(q.id) ?? 0) + 1))
const dupIds = [...idSeen.entries()].filter(([, c]) => c > 1).map(([id]) => id)
if (dupIds.length) E(`CSV id 重複: ${dupIds.join(', ')}`)

/* 2. 科目分類 */
const subjRaw = new Map()
const unresolved = []
const needsNormalize = []
for (const q of rows) {
  subjRaw.set(q.subject, (subjRaw.get(q.subject) ?? 0) + 1)
  const id = normalizeSubjectToId(q.subject)
  if (!id) unresolved.push({ id: q.id, subject: q.subject })
  else if (q.subject !== id) needsNormalize.push({ id: q.id, from: q.subject, to: id })
}
info.subjectRawValues = subjRaw.size
info.subjectUnresolved = unresolved.length
info.subjectNeedsNormalize = needsNormalize.length
if (unresolved.length) E(`正規14科目に紐づかない行 ${unresolved.length}: ${unresolved.slice(0, 8).map((x) => x.subject).join(' / ')}`)
if (needsNormalize.length) W(`科目名の表記揺れ（正規id化が必要）${needsNormalize.length} 行 / ${new Set(needsNormalize.map((x) => x.from)).size} 種`)

/* officialMedium の表記揺れ */
const omSet = new Map()
rows.forEach((q) => omSet.set(q.officialMedium, (omSet.get(q.officialMedium) ?? 0) + 1))
const omBad = [...omSet.keys()].filter((k) => !NAME2ID.has(k) || NAME2ID.get(k) !== normalizeSubjectToId(k))
// officialMedium が正式名称そのものでないもの
const omNonCanonical = [...omSet.keys()].filter((k) => {
  const id = normalizeSubjectToId(k)
  if (!id) return true
  const canon = CANONICAL_SUBJECTS.find(([i]) => i === id)?.[1]
  return k !== canon
})
info.officialMediumValues = omSet.size
if (omNonCanonical.length) W(`officialMedium が正式名称でない値 ${omNonCanonical.length} 種: ${omNonCanonical.join(' / ')}`)

/* 3. 科目別集計（正規id基準） */
const bySubject = {}
for (const [id] of CANONICAL_SUBJECTS) bySubject[id] = { total: 0, byRound: {} }
for (const q of rows) {
  const id = normalizeSubjectToId(q.subject)
  if (!id) continue
  bySubject[id].total++
  bySubject[id].byRound[q._round] = (bySubject[id].byRound[q._round] ?? 0) + 1
}
info.bySubject = bySubject

/* 3b. 令和2年版(2020年版)出題基準ブループリントとの整合
   ─ 第29〜34回は全180問・問題番号帯ごとに科目が固定されている。
   ─ 総合問題帯（午前 83-90 / 午後 151-160）はDBに専用バケットが無く内容で
     14科目へ割り当てるため、帯チェックから除外する。
   出典: 東洋療法研修試験財団 出題基準 ＋ reCare鍼灸院 第31〜34回 科目別解答
   （問33-38＝病理学概論 等を年度別に照合） */
const BLUEPRINT_RANGES = [
  [1, 4, 'medical-overview'],
  [5, 10, 'hygiene'],
  [11, 14, 'regulations'],
  [15, 23, 'anatomy'],
  [24, 32, 'physiology'],
  [33, 38, 'pathology'],
  [39, 48, 'clinical-general'],
  [49, 70, 'clinical-specific'],
  [71, 82, 'rehabilitation'],
  // 83-90 総合問題（午前）… 内容分類
  [91, 106, 'oriental-overview'],
  [107, 126, 'meridians-acupoints'],
  [127, 150, 'oriental-clinical'],
  // 151-160 総合問題（午後）… 実態は東洋医学臨床の症例。oriental-clinical を許容
  [161, 170, 'acupuncture-theory'],
  [171, 180, 'moxibustion-theory'],
]
const SOUGOU_RANGES = [[83, 90], [151, 160]]
function blueprintSubjectFor(qn) {
  for (const [lo, hi, id] of BLUEPRINT_RANGES) if (qn >= lo && qn <= hi) return id
  return null // 総合問題帯
}
const blueprintViolations = []
for (const q of rows) {
  const qn = Number(q.questionNumber)
  const id = normalizeSubjectToId(q.subject)
  const exp = blueprintSubjectFor(qn)
  const inSougou = SOUGOU_RANGES.some(([lo, hi]) => qn >= lo && qn <= hi)
  if (exp && id && id !== exp) blueprintViolations.push({ id: q.id, qn, got: id, exp })
  // 午後151-160はoriental-clinical以外なら候補として記録（内容次第で可）
  if (inSougou && qn >= 151 && id && id !== 'oriental-clinical') {
    blueprintViolations.push({ id: q.id, qn, got: id, exp: 'oriental-clinical(総合)' })
  }
}
info.blueprintViolations = blueprintViolations
if (blueprintViolations.length) {
  W(`出題基準ブループリントと不一致の科目分類 ${blueprintViolations.length} 行: ` +
    blueprintViolations.slice(0, 12).map((v) => `${v.id}(問${v.qn} ${v.got}→${v.exp})`).join(' / '))
}

/* 3c. 年度別科目分布の急変検出（前年比）
   前年から一定以上増減した科目を「異常候補」として WARN（ERROR ではない）。
   閾値: 絶対差 ≥ 6 かつ 相対比 ≥ 1.8倍（または前年0で当年 ≥ 6） */
const distroAnomalies = []
for (const [id, name] of CANONICAL_SUBJECTS) {
  const series = ROUNDS.map((r) => bySubject[id].byRound[r] ?? 0)
  for (let i = 1; i < series.length; i++) {
    const prev = series[i - 1]
    const cur = series[i]
    const absd = Math.abs(cur - prev)
    const ratio = prev === 0 ? Infinity : Math.max(cur, prev) / Math.min(cur, prev)
    if (absd >= 6 && (ratio >= 1.8 || prev === 0)) {
      distroAnomalies.push(`${name}: 第${ROUNDS[i - 1]}回 ${prev} → 第${ROUNDS[i]}回 ${cur}（差${cur - prev >= 0 ? '+' : ''}${cur - prev}）`)
    }
  }
}
info.distroAnomalies = distroAnomalies
if (distroAnomalies.length) {
  W(`年度別科目分布の急変 ${distroAnomalies.length} 件（異常候補・要内容確認）: ` + distroAnomalies.join(' ／ '))
}

/* normalizedTheme（CSV側） */
const csvThemeSet = new Map()
let emptyNT = 0
rows.forEach((q) => {
  if (!q.normalizedTheme) emptyNT++
  csvThemeSet.set(q.normalizedTheme || '(EMPTY)', (csvThemeSet.get(q.normalizedTheme || '(EMPTY)') ?? 0) + 1)
})
info.csvThemeCount = csvThemeSet.size - (csvThemeSet.has('(EMPTY)') ? 1 : 0)
info.csvThemeEmpty = emptyNT
if (emptyNT) E(`CSV normalizedTheme 空欄 ${emptyNT} 行`)

/* studyPoint 空欄 */
const emptySP = rows.filter((q) => !q.studyPoint).map((q) => q.id)
info.studyPointEmpty = emptySP.length
if (emptySP.length) W(`studyPoint 空欄 ${emptySP.length} 行`)

/* sourceReliability / blueprintVersion 検証 */
const VALID_SR = new Set(['indexed_official', 'direct_official', 'official_answer_only', 'third_party_reference'])
rows.forEach((q) => {
  if (!VALID_SR.has(q.sourceReliability)) W(`${q.id} sourceReliability 不正: ${q.sourceReliability}`)
  if (q.blueprintVersion !== '2020') W(`${q.id} blueprintVersion ${q.blueprintVersion}（第29〜34回は2020想定）`)
  if (q.questionCountMode !== '180') W(`${q.id} questionCountMode ${q.questionCountMode}（180想定）`)
})

/* ── data.ts / quiz / acupoints ── */
try {
  const data = await importTS('src/lib/data.ts')
  const { themes, subjects } = data
  info.themeCount = themes.length
  info.subjectDefCount = subjects.length

  /* ── 統一テーマ Taxonomy（themeId）の監査 ── */
  const themeById = new Map(themes.map((t) => [t.id, t]))
  const themeIdSet = new Set(themes.map((t) => t.id))

  // broken parentThemeId
  const brokenParent = themes.filter((t) => t.parentThemeId && !themeIdSet.has(t.parentThemeId))
  if (brokenParent.length) E(`theme parentThemeId 参照切れ ${brokenParent.length}: ${brokenParent.map((t) => `${t.id}→${t.parentThemeId}`).join(', ')}`)

  // exam question themeId
  const examNoTheme = rows.filter((q) => !q.themeId)
  const examBadTheme = rows.filter((q) => q.themeId && !themeIdSet.has(q.themeId))
  // 総合問題帯（午前83-90 / 午後151-160）は科目横断の症例のため、テーマ科目≠設問科目を許容
  const inSougouBand = (qn) => (qn >= 83 && qn <= 90) || (qn >= 151 && qn <= 160)
  const examThemeSubjMismatch = rows.filter((q) => {
    if (!q.themeId) return false
    if (inSougouBand(Number(q.questionNumber))) return false
    const t = themeById.get(q.themeId)
    return t && normalizeSubjectToId(q.subject) && t.subject !== normalizeSubjectToId(q.subject)
  })
  info.examThemeIdMissing = examNoTheme.length
  info.examThemeIdConnected = rows.length - examNoTheme.length
  // themeId 集計の総数は必ず 1,080（分析ランキングの合計が総問題数と一致すること）
  const themeIdSum = rows.filter((q) => q.themeId && themeIdSet.has(q.themeId)).length
  if (themeIdSum !== ROUNDS.length * QUESTIONS_PER_ROUND) {
    E(`themeId 集計総数 ${themeIdSum} ≠ ${ROUNDS.length * QUESTIONS_PER_ROUND}（分析の合計が総問題数と不一致）`)
  }
  if (examBadTheme.length) E(`exam question の themeId が themes[] に存在しない ${examBadTheme.length}: ${examBadTheme.slice(0, 8).map((q) => `${q.id}(${q.themeId})`).join(', ')}`)
  if (examThemeSubjMismatch.length) E(`exam question の themeId 科目とテーマ科目が不一致 ${examThemeSubjMismatch.length}: ${examThemeSubjMismatch.slice(0, 8).map((q) => `${q.id}(${q.subject}≠${themeById.get(q.themeId).subject})`).join(', ')}`)
  if (examNoTheme.length) W(`exam question に themeId 未設定 ${examNoTheme.length} 行（要確認）: ${examNoTheme.slice(0, 10).map((q) => q.id).join(', ')}`)

  // subjects.id が正規14と一致
  const defIds = new Set(subjects.map((s) => s.id))
  for (const [id] of CANONICAL_SUBJECTS) if (!defIds.has(id)) E(`data.ts subjects に ${id} が無い`)
  for (const s of subjects) if (!ID_SET.has(s.id)) E(`data.ts subjects に未知のid: ${s.id}`)

  // theme id 重複
  const tIdSeen = new Map()
  themes.forEach((t) => tIdSeen.set(t.id, (tIdSeen.get(t.id) ?? 0) + 1))
  const dupT = [...tIdSeen.entries()].filter(([, c]) => c > 1).map(([id]) => id)
  if (dupT.length) E(`theme id 重複: ${dupT.join(', ')}`)

  // relatedThemes の参照切れ
  const tIds = new Set(themes.map((t) => t.id))
  const broken = new Set()
  themes.forEach((t) => (t.relatedThemes || []).forEach((r) => { if (!tIds.has(r)) broken.add(r) }))
  info.themeBrokenRefs = [...broken]
  if (broken.size) W(`theme relatedThemes 参照切れ ${broken.size}: ${[...broken].join(', ')}`)

  // theme.subject が正規14
  themes.forEach((t) => { if (!ID_SET.has(t.subject)) E(`theme ${t.id} の subject 不正: ${t.subject}`) })

  // theme.examRounds が当該科目の実出題年度に含まれるか（架空年度チェック）
  const fakeYearThemes = []
  const zeroSupport = []
  for (const t of themes) {
    const subjRounds = new Set(Object.keys(bySubject[t.subject]?.byRound ?? {}).map(Number))
    const fake = (t.examRounds || []).filter((yr) => !subjRounds.has(yr))
    if (fake.length) fakeYearThemes.push({ id: t.id, subject: t.subject, fake })
    if (!subjRounds.size) zeroSupport.push(t.id)
  }
  info.themeFakeYears = fakeYearThemes
  info.themeZeroSupport = zeroSupport
  if (fakeYearThemes.length) E(`theme が科目の非出題年度を主張 ${fakeYearThemes.length}: ${fakeYearThemes.slice(0, 5).map((x) => `${x.id}[${x.fake}]`).join(', ')}`)

  // per-subject theme count
  const tBySub = {}
  themes.forEach((t) => (tBySub[t.subject] = (tBySub[t.subject] ?? 0) + 1))
  info.themesBySubject = tBySub
  for (const [id] of CANONICAL_SUBJECTS) if (!tBySub[id]) E(`科目 ${id} にテーマ0件`)

  // importance 値チェック
  themes.forEach((t) => { if (!['S', 'A', 'B', 'C'].includes(t.importance)) E(`theme ${t.id} importance 不正: ${t.importance}`) })

  // ── quiz ──
  const quizMod = await importTS('src/lib/quiz.ts')
  const Q = quizMod.ALL_QUESTIONS
  info.quizCount = Q.length
  const qIdSeen = new Map()
  Q.forEach((q) => qIdSeen.set(q.id, (qIdSeen.get(q.id) ?? 0) + 1))
  const dupQ = [...qIdSeen.entries()].filter(([, c]) => c > 1).map(([id]) => id)
  if (dupQ.length) E(`quiz id 重複: ${dupQ.join(', ')}`)

  const quizProblems = []
  Q.forEach((q) => {
    if (!ID_SET.has(q.subject)) quizProblems.push(`${q.id}: subject 不正 ${q.subject}`)
    if (!Array.isArray(q.choices) || q.choices.length !== 4) quizProblems.push(`${q.id}: choices が4つでない`)
    if (typeof q.correctAnswer !== 'number' || q.correctAnswer < 0 || q.correctAnswer > 3) quizProblems.push(`${q.id}: correctAnswer 範囲外`)
    if (new Set(q.choices).size !== q.choices.length) quizProblems.push(`${q.id}: choices に重複`)
    for (const f of ['question', 'explanation', 'memoryPoint', 'commonMistake', 'theme']) {
      if (!q[f] || !String(q[f]).trim()) quizProblems.push(`${q.id}: ${f} 空`)
    }
    if (!['easy', 'normal', 'hard'].includes(q.difficulty)) quizProblems.push(`${q.id}: difficulty 不正 ${q.difficulty}`)
    if (!['S', 'A', 'B', 'C'].includes(q.importance)) quizProblems.push(`${q.id}: importance 不正 ${q.importance}`)
    if (!Array.isArray(q.tags) || q.tags.length === 0) quizProblems.push(`${q.id}: tags 空`)
    // 過度な断定（問題文・解説・memoryPoint・commonMistake）
    const strong = /(?:必ず(?!しも)[^。]{0,10}(?:である|する|なる|起こる)|絶対に|例外なく|100%(?:で|の)?(?:正しい|該当))/
    for (const f of ['question', 'explanation', 'memoryPoint', 'commonMistake']) {
      if (strong.test(q[f] || '')) quizProblems.push(`${q.id}: ${f} に過度な断定表現`)
    }
    // 正解の選択肢が空
    if (!q.choices[q.correctAnswer]) quizProblems.push(`${q.id}: 正解選択肢が空`)
  })
  info.quizProblems = quizProblems
  quizProblems.forEach((m) => W(`quiz: ${m}`))

  // quiz の科目別数（公開分は10問以上）
  const quizBySub = {}
  Q.forEach((q) => (quizBySub[q.subject] = (quizBySub[q.subject] ?? 0) + 1))
  info.quizBySubject = quizBySub
  Object.entries(quizBySub).forEach(([s, c]) => { if (c > 0 && c < 10) W(`quiz 科目 ${s} が ${c} 問（公開は10問以上が原則）`) })
  // 14科目すべてにクイズがあるか（Ver.7.3：全科目演習可能を目標）
  const noQuizSubjects = CANONICAL_SUBJECTS.filter(([id]) => !(quizBySub[id] > 0)).map(([, name]) => name)
  info.quizSubjectCoverage = `${14 - noQuizSubjects.length}/14`
  if (noQuizSubjects.length) E(`クイズが1問も無い科目 ${noQuizSubjects.length}: ${noQuizSubjects.join('・')}`)

  /* ── quiz の themeId 監査（Ver.7.2.2：文字列比較 quiz.theme→themeId 参照に変更） ── */
  const quizNoTheme = Q.filter((q) => !q.themeId)
  const quizBadTheme = Q.filter((q) => q.themeId && !themeIdSet.has(q.themeId))
  const quizThemeSubjMismatch = Q.filter((q) => {
    if (!q.themeId) return false
    const t = themeById.get(q.themeId)
    return t && t.subject !== q.subject
  })
  info.quizThemeIdMissing = quizNoTheme.length
  info.quizThemeIdConnected = Q.length - quizNoTheme.length
  if (quizNoTheme.length) E(`quiz に themeId 未設定 ${quizNoTheme.length}: ${quizNoTheme.slice(0, 10).map((q) => q.id).join(', ')}`)
  if (quizBadTheme.length) E(`quiz の themeId が themes[] に存在しない ${quizBadTheme.length}: ${quizBadTheme.map((q) => `${q.id}(${q.themeId})`).join(', ')}`)
  if (quizThemeSubjMismatch.length) E(`quiz の themeId 科目とテーマ科目が不一致 ${quizThemeSubjMismatch.length}: ${quizThemeSubjMismatch.map((q) => `${q.id}(${q.subject}≠${themeById.get(q.themeId).subject})`).join(', ')}`)

  /* ── orphan theme：過去問0問 かつ クイズ0問（学習用テーマは許容だが可視化） ── */
  const examByTheme = {}
  for (const q of rows) if (q.themeId) examByTheme[q.themeId] = (examByTheme[q.themeId] ?? 0) + 1
  const quizByTheme = {}
  for (const q of Q) if (q.themeId) quizByTheme[q.themeId] = (quizByTheme[q.themeId] ?? 0) + 1
  const studyOnly = themes.filter((t) => !examByTheme[t.id]).map((t) => t.id)
  // 意図的な学習用テーマ（国試に出ない or 上位テーマの補助）。orphan でも WARN にしない
  const INTENTIONAL_STUDY_THEMES = new Set(['kei-ketsu-shuchi', 'toyo-rekishi', 'menekigaku', 'cg-innai-kansen'])
  const orphan = themes
    .filter((t) => !examByTheme[t.id] && !quizByTheme[t.id])
    .filter((t) => !t.parentThemeId && !INTENTIONAL_STUDY_THEMES.has(t.id))
    .map((t) => t.id)
  info.themeStudyOnly = studyOnly
  info.themeOrphan = orphan
  info.themeConnected = themes.length - studyOnly.length
  if (orphan.length) W(`過去問もクイズも紐づかない未分類テーマ ${orphan.length}: ${orphan.join(', ')}`)

  /* ── Ver.7.4: 「今日の10問」選定ロジックの監査 ── */
  try {
    const { selectDailyQuestionIds, DAILY_COUNT } = await importTS('src/lib/dailySelect.ts')
    const themeExamCount = {}
    for (const q of rows) if (q.themeId) themeExamCount[q.themeId] = (themeExamCount[q.themeId] ?? 0) + 1
    const qById = new Map(Q.map((q) => [q.id, q]))
    const dailyProblems = []
    const seeds = ['2026-02-20', '2026-02-21', '2026-06-15', '2027-01-01', '2027-01-02']
    const perSeed = {}
    for (const seed of seeds) {
      const a = selectDailyQuestionIds({ all: Q, themeExamCount, seed })
      const b = selectDailyQuestionIds({ all: Q, themeExamCount, seed }) // 同一入力 → 決定的
      perSeed[seed] = a
      if (a.length !== DAILY_COUNT) dailyProblems.push(`${seed}: 問題数 ${a.length} ≠ ${DAILY_COUNT}`)
      if (new Set(a).size !== a.length) dailyProblems.push(`${seed}: 重複あり`)
      if (a.join(',') !== b.join(',')) dailyProblems.push(`${seed}: 非決定的（同一入力で結果が異なる）`)
      const bad = a.filter((id) => !qById.has(id))
      if (bad.length) dailyProblems.push(`${seed}: 未知の quiz id ${bad.join(',')}`)
      const badTheme = a.map((id) => qById.get(id)).filter((q) => q && q.themeId && !themeIdSet.has(q.themeId))
      if (badTheme.length) dailyProblems.push(`${seed}: 不正 themeId`)
      const subs = new Set(a.map((id) => qById.get(id)?.subject))
      if (subs.size < 5) dailyProblems.push(`${seed}: 科目数 ${subs.size} < 5`)
      const tc = {}
      for (const id of a) { const t = qById.get(id)?.themeId ?? '?'; tc[t] = (tc[t] ?? 0) + 1 }
      const over = Object.entries(tc).filter(([, c]) => c > 2)
      if (over.length) dailyProblems.push(`${seed}: 1テーマ3問以上 ${over.map(([t, c]) => `${t}×${c}`).join(',')}`)
    }
    // 隣接する日は別セット（完全一致でない）
    if (perSeed['2026-02-20'].join(',') === perSeed['2026-02-21'].join(','))
      dailyProblems.push('連続する日で10問が完全に同一')
    info.dailySeeds = seeds.length
    info.dailyProblems = dailyProblems
    dailyProblems.forEach((m) => E(`今日の10問: ${m}`))
  } catch (e) {
    E(`今日の10問の監査に失敗: ${e.message}`)
  }

  // ── diagrams ──
  const diag = await importTS('src/data/learningDiagrams.ts')
  const diagIds = new Set(Object.keys(diag.LEARNING_DIAGRAMS))
  const missImg = [...new Set(Q.filter((q) => q.imageId).map((q) => q.imageId))].filter((i) => !diagIds.has(i))
  if (missImg.length) E(`quiz imageId が未登録: ${missImg.join(', ')}`)
  // SVG ファイル存在
  for (const d of Object.values(diag.LEARNING_DIAGRAMS)) {
    const fp = path.join(ROOT, 'public', d.file)
    if (!fs.existsSync(fp)) E(`図解ファイル欠落: ${d.file}`)
  }
  info.diagramCount = diagIds.size

  // ── acupoints ──
  const acu = await importTS('src/data/acupoints.ts')
  const A = acu.ACUPOINTS
  info.acupointCount = A.length
  const slugSeen = new Map()
  A.forEach((a) => slugSeen.set(a.slug, (slugSeen.get(a.slug) ?? 0) + 1))
  const dupSlug = [...slugSeen.entries()].filter(([, c]) => c > 1).map(([s]) => s)
  if (dupSlug.length) E(`acupoint slug 重複: ${dupSlug.join(', ')}`)
  const codeSeen = new Map()
  A.forEach((a) => codeSeen.set(a.code, (codeSeen.get(a.code) ?? 0) + 1))
  const dupCode = [...codeSeen.entries()].filter(([, c]) => c > 1).map(([s]) => s)
  if (dupCode.length) W(`acupoint code 重複: ${dupCode.join(', ')}`)
  // 必須フィールド
  A.forEach((a) => {
    for (const f of ['name', 'reading', 'code', 'meridian', 'location', 'examPoint', 'memoryTip']) {
      if (!a[f] || !String(a[f]).trim()) E(`acupoint ${a.slug} の ${f} が空`)
    }
  })
  info.acupointAliasCount = A.reduce((n, a) => n + (Array.isArray(a.aliases) ? a.aliases.length : 0), 0)

  // quiz.relatedAcupoints 参照
  const slugSet = new Set(A.map((a) => a.slug))
  const badAcuRef = [...new Set(Q.flatMap((q) => q.relatedAcupoints || []))].filter((s) => !slugSet.has(s))
  if (badAcuRef.length) E(`quiz relatedAcupoints 参照切れ: ${badAcuRef.join(', ')}`)

  // 未出題経穴（現ロジック）
  try {
    const acuLib = await importTS('src/lib/acupoints.ts')
    const unasked = acuLib.getUnaskedAcupoints ? acuLib.getUnaskedAcupoints() : []
    info.unaskedCount = unasked.length
  } catch (e) { W(`未出題経穴の集計に失敗: ${e.message}`) }
} catch (e) {
  E(`data/quiz/acupoints の読み込みに失敗: ${e.stack || e.message}`)
}

/* ── Ver.7.2.3: ユーザー向け分析UIが旧 normalizedTheme を使っていないか ── */
{
  const UI_GLOBS = [
    'src/app/analysis',
    'src/app/page.tsx',
    'src/components/analysis',
  ]
  const offenders = []
  const scan = (p) => {
    const st = fs.statSync(p)
    if (st.isDirectory()) { for (const f of fs.readdirSync(p)) scan(path.join(p, f)); return }
    if (!/\.(tsx?|jsx?)$/.test(p)) return
    const src = fs.readFileSync(p, 'utf-8')
    if (/\bnormalizedTheme\b/.test(src) || /\baggregateByTheme\b(?!Id)/.test(src) || /THEME_LABELS/.test(src)) {
      offenders.push(path.relative(ROOT, p))
    }
  }
  for (const g of UI_GLOBS) { const abs = path.join(ROOT, g); if (fs.existsSync(abs)) scan(abs) }
  info.analysisLegacyUsage = offenders
  if (offenders.length) {
    E(`ユーザー向け分析UIが旧 normalizedTheme/aggregateByTheme/THEME_LABELS を使用 ${offenders.length}: ${offenders.join(', ')}`)
  }
}

/* ══════════════ 出力 ══════════════ */
const j = process.argv.includes('--json')
if (j) {
  console.log(JSON.stringify({ info, errors, warns }, null, 2))
} else {
  console.log('\n=== 鍼灸DB データ監査 ===\n')
  console.log(`CSV総問題数: ${info.csvTotal}`)
  console.log(`年度別: ${ROUNDS.map((r) => `第${r}回=${perRound[r]}`).join('  ')}`)
  console.log(`科目定義: ${info.subjectDefCount} / テーマ: ${info.themeCount} / クイズ: ${info.quizCount} / 経穴: ${info.acupointCount}（alias ${info.acupointAliasCount}）/ 図解: ${info.diagramCount}`)
  console.log(`CSV科目値の種類: ${info.subjectRawValues}（正規id化が必要 ${info.subjectNeedsNormalize} 行 / 未解決 ${info.subjectUnresolved} 行）`)
  console.log(`CSV normalizedTheme: ${info.csvThemeCount} 種（空欄 ${info.csvThemeEmpty}）`)
  console.log(`統一テーマ Master: ${info.themeCount} 件（過去問接続 ${info.themeConnected} / 学習用 ${info.themeStudyOnly?.length ?? 0} / orphan ${info.themeOrphan?.length ?? 0}）`)
  console.log(`themeId 接続: 過去問 ${info.examThemeIdConnected}/${info.csvTotal}（未設定 ${info.examThemeIdMissing}）  クイズ ${info.quizThemeIdConnected}/${info.quizCount}`)
  console.log('\n--- 科目別 6年問題数（正規id基準） ---')
  for (const [id, name] of CANONICAL_SUBJECTS) {
    const b = info.bySubject[id]
    const t = info.themesBySubject?.[id] ?? 0
    const q = info.quizBySubject?.[id] ?? 0
    console.log(`  ${name.padEnd(12, '　')} 問=${String(b.total).padStart(3)}  テーマ=${String(t).padStart(2)}  クイズ=${String(q).padStart(2)}  年度別[${ROUNDS.map((r) => b.byRound[r] ?? 0).join('/')}]`)
  }
  console.log(`\nERROR: ${errors.length}`)
  errors.forEach((m) => console.log(`  ✗ ${m}`))
  console.log(`\nWARN: ${warns.length}`)
  warns.slice(0, 60).forEach((m) => console.log(`  ! ${m}`))
  if (warns.length > 60) console.log(`  … 他 ${warns.length - 60} 件`)
}

process.exit(errors.length ? 1 : 0)
