#!/usr/bin/env node
/* ──────────────────────────────────────────────────────────────
   note 記事制作向けの共有データを書き出す
   `npm run export:note`  →  exports/note-content/v1/*.json
   - 仕様: docs/note-export-spec.md
   - DB を学習データの正本とし、note 側が経穴や正答を作り直さないようにするための読み取り専用の書き出し
   - DB のデータ（src/data）は読むだけで変えない
   - 日本の資料で確認できていない値（JAPAN_INFERRED・SOURCE_NEEDED・CONFLICT）は値ごと書き出さない
   - WHO_VERIFIED は「WHO 基準」と明記する条件つきで書き出す（日本の教科書確認済みとは扱わない）
   - 公式過去問の問題文・選択肢・解説は書き出さない（件数と問題IDだけ）
   - 同じ commit から何度実行しても同じ内容になる（日時は commit の日時を使う）
   ────────────────────────────────────────────────────────────── */
import { execSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
process.chdir(ROOT)

const { subjects, themes } = await import('../src/lib/data')
const { getThemeExamStats } = await import('../src/lib/themeStats')
const { pastExamCountsByTheme, pastExamCountsBySubject, pastExamPracticeTotal } = await import('../src/lib/pastExams')
const { ALL_QUESTIONS, themeIdsWithQuiz } = await import('../src/lib/quiz')
const { loadAllExamQuestions, EXAM_ROUNDS } = await import('../src/lib/examQuestions')
const { ACUPOINTS } = await import('../src/data/acupoints')
const { getAcupointStats } = await import('../src/lib/acupoints')
const src = await import('../src/lib/acupointSources')
const { NOTE_ARTICLES, NOTE_ACCOUNT_URL } = await import('../src/data/noteArticles')

export const SCHEMA_VERSION = 'v1'
const OUT = path.join(ROOT, 'exports', 'note-content', SCHEMA_VERSION)
const SITE = 'https://shinkyuu-db.vercel.app'

const git = (cmd: string) => execSync(`git ${cmd}`, { cwd: ROOT, encoding: 'utf8' }).trim()
const sourceCommit = git('rev-parse --short HEAD')
const updatedAt = git('log -1 --format=%cI')
// 学習データ（src/data）が commit と違うときは +dirty を付ける。note の記事台帳（noteArticles.ts）は学習データではないので除く
const dataDirty = git('status --porcelain -- src/data ":!src/data/noteArticles.ts"') !== ''
const sourceVersion = `shinkyuu-db@${sourceCommit}${dataDirty ? '+dirty' : ''}`

const subjectName = new Map(subjects.map((s) => [s.id, s.name]))
const rounds = [...EXAM_ROUNDS].sort((a, b) => a - b)
const roundLabel = `第${rounds[0]}〜${rounds[rounds.length - 1]}回`

/* ── 1. 出題統計 ─────────────────────────────────────────────── */
const examQuestions = loadAllExamQuestions()
const pastByTheme = pastExamCountsByTheme()
const pastBySubject = pastExamCountsBySubject()
const quizThemes = new Set(themeIdsWithQuiz())
const quizByTheme = new Map<string, number>()
for (const q of ALL_QUESTIONS) if (q.themeId) quizByTheme.set(q.themeId, (quizByTheme.get(q.themeId) ?? 0) + 1)

const COUNT_METHOD =
  `${roundLabel}の公式過去問${examQuestions.length}問を、当DBのテーマ分類（themeId・1問1テーマ）で数えた件数。テーマ分類は当DB独自（出題基準の項目を参考に作成）`

const subjectStats = subjects.map((s) => {
  const byRound: Record<number, number> = {}
  for (const r of rounds) byRound[r] = 0
  for (const q of examQuestions) if (q.subject === s.id) byRound[q.examRound]++
  const total = Object.values(byRound).reduce((a, b) => a + b, 0)
  return {
    stableId: `subject:${s.id}`,
    title: s.name,
    subject: s.id,
    total,
    byRound,
    practiceCount: pastBySubject[s.id] ?? 0,
    sourceVersion,
    verifiedStatus: 'COMPUTED_FROM_OFFICIAL_EXAMS',
    sourceType: 'official_exam',
    relatedDbUrl: `${SITE}/past-exams/subject/${s.id}`,
    updatedAt,
    publicationAllowed: true,
    warningNotes: [`母数：${roundLabel}の${examQuestions.length}問。科目は当DBの分類`],
  }
})

const topicStats = themes.map((t) => {
  const st = getThemeExamStats(t.id)
  const byRound: Record<number, number> = {}
  for (const r of rounds) byRound[r] = st.byRound[r] ?? 0
  const urls: Record<string, string> = { theme: `${SITE}/themes/${t.id}` }
  if ((pastByTheme[t.id] ?? 0) > 0) urls.pastExams = `${SITE}/past-exams/theme/${t.id}`
  if (quizThemes.has(t.id)) urls.quiz = `${SITE}/quiz/theme/${t.id}`
  const warningNotes = ['テーマ分類は当DB独自。出題数は「このテーマに分類した問題数」']
  if (st.count === 0) warningNotes.push(`${roundLabel}に出題実績なし（学習用テーマ）`)
  if (t.standard2026 && t.standard2026.status !== 'unchanged')
    warningNotes.push('2026年版出題基準の変更区分は公式の事実。第35回で出ることを示すものではない')
  return {
    stableId: `theme:${t.id}`,
    title: t.name,
    subject: t.subject,
    subjectName: subjectName.get(t.subject) ?? t.subject,
    examCount: st.count,
    examRounds: st.examRounds,
    byRound,
    recent3Count: st.recent3Count,
    pastExamPracticeCount: pastByTheme[t.id] ?? 0,
    originalQuizCount: quizByTheme.get(t.id) ?? 0,
    standard2026Status: t.standard2026?.status ?? null,
    sourceVersion,
    verifiedStatus: 'COMPUTED_FROM_OFFICIAL_EXAMS',
    sourceType: 'official_exam',
    relatedDbUrl: urls.pastExams ?? urls.theme,
    relatedDbUrls: urls,
    updatedAt,
    publicationAllowed: true,
    warningNotes,
  }
})

/* ── 2. 経穴（項目ごとの確認状況つき） ─────────────────────── */
type Publish = 'allowed' | 'label_required' | 'excluded'
const publishOf = (status: string): Publish =>
  status === 'JAPAN_VERIFIED' ? 'allowed' : status === 'WHO_VERIFIED' ? 'label_required' : 'excluded'
const statsBySlug = new Map(getAcupointStats().map((a) => [a.slug, a]))

// 位置の文言は標準的な書き方のため、公式過去問の問題文・選択肢と同じ言い回しになることがある。
// 22文字以上一致する問題IDを付けておき、note 側で文をそのまま使わないようにする（監査の基準と同じ22文字）
const PAST_TEXTS: { id: string; text: string }[] = fs
  .readdirSync(path.join(ROOT, 'src/data/pastExams'))
  .flatMap((f) => JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/pastExams', f), 'utf8')) as { id: string; questionText: string; choices: string[] }[])
  .flatMap((q) => [q.questionText, ...q.choices].map((t) => ({ id: q.id, text: t.replace(/\s/g, '') })))
export const OVERLAP_CHARS = 22
function pastExamOverlap(value: string | null): string[] {
  if (!value) return []
  const v = value.replace(/\s/g, '')
  const ids = new Set<string>()
  for (const { id, text } of PAST_TEXTS)
    for (let i = 0; i + OVERLAP_CHARS <= v.length; i++)
      if (text.includes(v.slice(i, i + OVERLAP_CHARS))) {
        ids.add(id)
        break
      }
  return [...ids].sort()
}

const acupoints = ACUPOINTS.map((a) => {
  const fields = src.getAcupointSourceStatus(a)
  const one = (field: string) => fields.find((f) => f.field === field)!
  const field = (f: { value?: string; status: string }) => {
    const publish = publishOf(f.status)
    return {
      // 書き出してよい値だけを入れる。excluded は値を出さない（DB の画面で確認する）
      value: publish === 'excluded' ? null : (f.value ?? null),
      status: f.status,
      publish,
    }
  }
  const name = field(one('name'))
  const location = { ...field(one('location')), pastExamTextOverlap: [] as string[] }
  location.pastExamTextOverlap = pastExamOverlap(location.value)
  const special = fields
    .filter((f) => f.field === 'specialPoints' && f.value)
    .map((f) => ({ label: publishOf(f.status) === 'excluded' ? null : f.value!, status: f.status, publish: publishOf(f.status) }))
  const st = statsBySlug.get(a.slug)!
  const warningNotes: string[] = []
  if (name.publish !== 'allowed') warningNotes.push('名称が日本の資料で確認できていない。記事では WHO コードで書くか、扱わない')
  if (location.publish === 'label_required') warningNotes.push('位置は WHO 基準でのみ確認。「WHO 基準では」と明記し、日本の教科書で確認済みと書かない')
  if (location.pastExamTextOverlap.length)
    warningNotes.push(`位置の文言が公式過去問（${location.pastExamTextOverlap.join('・')}）と22文字以上同じ。記事では言い換えるか表にする`)
  if (location.status === 'SOURCE_NEEDED' || location.status === 'CONFLICT') warningNotes.push('位置は根拠不足または資料と食い違い。記事に書かない')
  if (special.some((s) => s.publish === 'excluded')) warningNotes.push('一部の要穴分類は未確認（推論のみ等）。値を出していない')
  warningNotes.push('読みは出典未確認のため書き出していない')
  return {
    stableId: `acupoint:${a.slug}`,
    code: a.code,
    title: name.value,
    subject: 'meridians-acupoints',
    meridian: a.meridian,
    meridianName: a.meridianName,
    name,
    location,
    specialPoints: special,
    examRounds: st.examRounds,
    examQuestionCount: st.questionCount,
    examQuestionIds: st.questions.map((q) => q.questionId),
    sourceVersion,
    verifiedStatus: name.status,
    sourceType: 'acupoint_source_records',
    relatedDbUrl: `${SITE}/acupoints/${a.slug}`,
    updatedAt,
    publicationAllowed: name.publish === 'allowed',
    warningNotes,
  }
})

/* ── 3. 記事化の安全情報 ────────────────────────────────────── */
const conflictRecords = src.ACUPOINT_SOURCE_DATA.records
  .filter((r) => r.verificationStatus === 'CONFLICT' && !r.supersededAt)
  .map((r) => ({ acupointId: r.acupointId, fieldName: r.fieldName, sourceId: r.sourceId }))

const contentSafety = {
  stableId: 'content-safety',
  title: '記事化の安全ルールと除外リスト',
  sourceVersion,
  updatedAt,
  rules: [
    { id: 'R1', rule: '公式過去問の問題文・選択肢を記事・教材に転載しない。扱うときは「何が問われたか」を自分の言葉で要約し、問題IDで出典を示す（財団への確認範囲は Web 学習サイトでの演習まで）' },
    { id: 'R2', rule: 'JAPAN_VERIFIED だけを「日本の資料で確認済み」と書く。WHO_VERIFIED は「WHO 基準では」と明記する。JAPAN_INFERRED・SOURCE_NEEDED・CONFLICT は確定情報として書かない' },
    { id: 'R3', rule: '教科書の本文・図表を転載しない。権利が不明な画像・図表を使わない。図表はオリジナルで作る' },
    { id: 'R4', rule: '数値には対象（回）・母数・集計方法を添える。出題数は当DBのテーマ分類による' },
    { id: 'R5', rule: '過去の出題傾向から「次に出る」「合格できる」と書かない' },
    { id: 'R6', rule: '公式正答と DB の解説の確認状況を混同しない。下の questionCautions の問題は、公式正答以外を断定しない' },
    { id: 'R8', rule: '経穴の位置の文言は公式過去問と同じ言い回しのことがある（location.pastExamTextOverlap）。記事・教材では文をそのまま使わない' },
    { id: 'R7', rule: 'DB の memoryTip・examPoint・importance（手動評価）・読みは出典未確認のため書き出していない。記事で使わない' },
  ],
  statusDefinitions: {
    JAPAN_VERIFIED: '日本の資料（公式過去問・出題基準など）が記述全体を直接裏づける',
    WHO_VERIFIED: 'WHO 標準経穴部位（2008）の主位置で確認。日本の教科書では未確認',
    SOURCE_NEEDED: '根拠不足（一部だけ確認・公式問題からの推論 JAPAN_INFERRED のみ、を含む）',
    CONFLICT: '資料と現在の記述が食い違う',
    NOT_APPLICABLE: '値が未設定',
  },
  questionCautions: [
    { questionId: '30-162', reason: 'NEEDS_TEXTBOOK：解説の根拠に教科書の確認が必要' },
    { questionId: '31-096', reason: 'NEEDS_TEXTBOOK：解説の根拠に教科書の確認が必要' },
    { questionId: '31-062', reason: 'OFFICIAL_ANSWER_CONCERN：公式正答と選択肢の解釈に疑問が残る' },
    { questionId: '31-123', reason: 'OFFICIAL_ANSWER_CONCERN：公式正答と選択肢の解釈に疑問が残る' },
    { questionId: '32-125', reason: 'JAPAN_DIFF：解説の構成穴の名称を日本の教科書で直す予定' },
    { questionId: '32-115', reason: 'JAPAN_DIFF：解説に下極兪の位置を追記する予定（教科書確認待ち）' },
    { questionId: '31-126', reason: 'JAPAN_DIFF：解説の出典表記を日本の資料に差し替える予定' },
  ],
  acupointCautions: {
    pendingDecisions: [{ acupointId: 'bl1', reason: '名称の表記（晴明／睛明）が承認待ち。記事では BL1 と書くか扱わない' }],
    unnamedCount: acupoints.filter((a) => a.name.status === 'NOT_APPLICABLE').length,
    conflictRecords,
  },
  excludedFromExport: [
    '公式過去問の問題文・選択肢・正答・解説（件数と問題IDのみ書き出す）',
    'オリジナル予想問題の本文（DB の演習でのみ公開）',
    '経穴の読み、memoryTip、examPoint、importance（手動評価）',
    '確認状況が SOURCE_NEEDED・CONFLICT・NOT_APPLICABLE の値',
    '利用者の学習履歴・localStorage の内容（DB は note に何も送らない）',
  ],
}

/* ── 4. 記事候補（DB の実データで裏づけ） ──────────────────── */
const themeById = new Map(topicStats.map((t) => [t.stableId.slice(6), t]))
const sumThemes = (ids: string[]) => ids.reduce((n, id) => n + (themeById.get(id)?.examCount ?? 0), 0)
const CANDIDATES: { id: string; title: string; type: 'free' | 'paid'; themeIds: string[]; subject: string | null; existingNoteId?: string; note: string }[] = [
  { id: 'C01', title: '鍼灸国家試験の過去問は何年分必要か', type: 'free', themeIds: [], subject: null, existingNoteId: 'nb284e53363b1', note: '公開済み記事と同じ主題。新記事ではなく既存記事の更新・内部リンクで対応' },
  { id: 'C02', title: '経穴の覚え方と復習方法', type: 'free', themeIds: ['go-yu-ketsu', 'gen-ketsu', 'geki-ketsu', 'bo-ketsu'], subject: 'meridians-acupoints', existingNoteId: 'n1f60a0e5a4ec', note: '公開済み記事と主題が近い。「復習方法」に絞るか、既存記事の続編にする' },
  { id: 'C03', title: '五兪穴の整理と間違えやすいポイント', type: 'free', themeIds: ['go-yu-ketsu'], subject: 'meridians-acupoints', note: '経穴の値は acupoint-learning.json の publish=allowed のものだけを使う' },
  { id: 'C04', title: '原穴・郄穴・絡穴の違い', type: 'free', themeIds: ['gen-ketsu', 'geki-ketsu'], subject: 'meridians-acupoints', note: '絡穴の分類は未確認（excluded）の穴がある。個別の穴名は publish=allowed のものだけ' },
  { id: 'C05', title: '東洋医学概論の頻出テーマ', type: 'free', themeIds: [], subject: 'oriental-overview', note: 'topic-statistics.json の科目内上位テーマから構成' },
  { id: 'C06', title: 'はりきゅう理論の学習ポイント', type: 'free', themeIds: [], subject: 'acupuncture-theory', note: 'はり理論・きゅう理論の2科目。きゅう理論の上位テーマも併記' },
  { id: 'C07', title: '国家試験直前30日の勉強計画', type: 'paid', themeIds: [], subject: null, note: '有料教材候補（直前チェック）。科目別の出題数（subjectStats）で配分を示す' },
  { id: 'C08', title: '苦手分野を減らす復習法', type: 'free', themeIds: [], subject: null, note: 'DB の弱点復習（/quiz/weak）への導線記事' },
  { id: 'C09', title: '無料で使える鍼灸国試DBの活用方法', type: 'free', themeIds: [], subject: null, note: 'DB の機能紹介。既存記事と重複しない（DB の使い方を主題にした記事はまだない）' },
  { id: 'C10', title: '国家試験対策に使える学習チェックリスト', type: 'paid', themeIds: [], subject: null, note: '有料教材候補。DB の /study/checklist と内容を重複させない（印刷用・科目横断の版にする）' },
]
const topThemes = (subject: string, n = 5) =>
  topicStats
    .filter((t) => t.subject === subject)
    .sort((a, b) => b.examCount - a.examCount)
    .slice(0, n)
    .map((t) => ({ themeId: t.stableId.slice(6), title: t.title, examCount: t.examCount }))
const recommended = CANDIDATES.map((c) => {
  const subjectTotal = c.subject ? subjectStats.find((s) => s.subject === c.subject)?.total ?? 0 : null
  return {
    stableId: `candidate:${c.id}`,
    title: c.title,
    subject: c.subject,
    articleType: c.type,
    evidence: {
      themeExamCount: c.themeIds.length ? sumThemes(c.themeIds) : null,
      subjectExamCount: subjectTotal,
      topThemes: c.subject ? topThemes(c.subject) : [],
      basis: COUNT_METHOD,
    },
    overlapWithNote: c.existingNoteId ? { noteId: c.existingNoteId, status: 'overlap_existing' } : { noteId: null, status: 'no_published_overlap' },
    sourceVersion,
    verifiedStatus: 'EDITORIAL_CANDIDATE',
    sourceType: 'db_statistics',
    relatedDbUrl:
      c.themeIds[0] && themeById.get(c.themeIds[0])?.relatedDbUrl
        ? themeById.get(c.themeIds[0])!.relatedDbUrl
        : c.subject
          ? `${SITE}/past-exams/subject/${c.subject}`
          : `${SITE}/past-exams`,
    updatedAt,
    publicationAllowed: true,
    warningNotes: [c.note, '公開順は note 側で既存記事との重複を再確認してから決める'],
  }
})

/* ── 5. 相互リンク ─────────────────────────────────────────── */
const UTM = (campaign: string) => `utm_source=note&utm_medium=article&utm_campaign=${campaign}`
const dbPages = [
  { stableId: 'db:home', title: 'トップ', path: '/' },
  { stableId: 'db:past-exams', title: '過去問（年度別・科目別・テーマ別）', path: '/past-exams' },
  { stableId: 'db:quiz-weak', title: '弱点復習', path: '/quiz/weak' },
  { stableId: 'db:quiz-daily', title: '今日の10問', path: '/quiz/daily' },
  { stableId: 'db:acupoints', title: '経穴から学ぶ', path: '/acupoints' },
  { stableId: 'db:exam-35', title: '第35回対策（2026年版出題基準）', path: '/exam-35' },
  { stableId: 'db:study-checklist', title: '学習チェックリスト', path: '/study/checklist' },
  ...subjects.map((s) => ({ stableId: `db:past-exams-subject:${s.id}`, title: `${s.name}の過去問`, path: `/past-exams/subject/${s.id}` })),
]
const linkMap = {
  stableId: 'link-map',
  title: 'note と DB の相互リンク',
  sourceVersion,
  updatedAt,
  utm: {
    rule: 'note → DB のリンクには必ず UTM を付ける。utm_campaign は記事の stableId（例: free-01-kankeihoki）',
    template: `{url}?${UTM('{articleId}')}`,
    params: { utm_source: 'note', utm_medium: 'article', utm_campaign: '{articleId}' },
  },
  dbPages: dbPages.map((p) => ({ ...p, url: `${SITE}${p.path}` })),
  noteArticles: NOTE_ARTICLES.map((a) => ({
    stableId: `note:${a.id}`,
    title: a.title,
    url: a.url,
    topics: a.topics,
    dbPlacements: a.placements.map((p) => `${SITE}/${p}`),
    measurement: 'DB 側の GA4 イベント note_link_click（note_id, placement）',
  })),
  noteAccountUrl: NOTE_ACCOUNT_URL,
}

/* ── 6. 書き出しと manifest ─────────────────────────────────── */
const files: Record<string, unknown> = {
  'topic-statistics.json': { stableId: 'topic-statistics', sourceVersion, updatedAt, countMethod: COUNT_METHOD, subjects: subjectStats, themes: topicStats },
  'acupoint-learning.json': { stableId: 'acupoint-learning', sourceVersion, updatedAt, acupoints },
  'content-safety.json': contentSafety,
  'recommended-articles.json': { stableId: 'recommended-articles', sourceVersion, updatedAt, candidates: recommended },
  'link-map.json': linkMap,
}
fs.mkdirSync(OUT, { recursive: true })
const entries = Object.entries(files).map(([name, body]) => {
  const text = JSON.stringify(body, null, 1) + '\n'
  fs.writeFileSync(path.join(OUT, name), text)
  return { name, sha256: crypto.createHash('sha256').update(text).digest('hex'), bytes: Buffer.byteLength(text) }
})
const manifest = {
  schemaVersion: SCHEMA_VERSION,
  sourceVersion,
  sourceCommit,
  dataDirty,
  updatedAt,
  spec: 'docs/note-export-spec.md',
  counts: {
    pastExamQuestions: examQuestions.length,
    pastExamPractice: pastExamPracticeTotal(),
    originalQuiz: ALL_QUESTIONS.length,
    themes: topicStats.length,
    subjects: subjectStats.length,
    acupoints: acupoints.length,
    acupointsNamePublishable: acupoints.filter((a) => a.publicationAllowed).length,
    acupointsLocationAllowed: acupoints.filter((a) => a.location.publish === 'allowed').length,
    acupointsLocationLabelRequired: acupoints.filter((a) => a.location.publish === 'label_required').length,
    sourceRecords: src.ACUPOINT_SOURCE_DATA.records.length,
    noteArticles: NOTE_ARTICLES.length,
    candidates: recommended.length,
  },
  files: entries,
}
fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 1) + '\n')
console.log(`exports/note-content/${SCHEMA_VERSION}: ${entries.length + 1} files (${sourceVersion})`)
console.log(manifest.counts)
