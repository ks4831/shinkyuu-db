'use client'

/* ──────────────────────────────────────────────────────────────
   学習記録の書き出し・読み込み（端末内だけで完結）

   サイトのURL（オリジン）が変わると、ブラウザの仕組み上 localStorage は引き継がれない。
   そのため、旧URLで JSON ファイルに書き出し、新URLで読み込めるようにする。

   - データはサーバーにも外部サービスにも送らない（ファイルの保存・選択はブラウザだけで行う）
   - 対象は下の LEARNING_KEYS だけ。計測用のキー（analytics）は含めない
   - 既存のキー名・保存形式はそのまま使う（変換しない）
   - 読み込むファイルは、形式・バージョン・キー・値の形をすべて検査し、
     1か所でも合わなければファイル全体を読み込まない
   - 読み込み方は2つ
       fill    … この端末で空の項目だけ書き込む（既存の記録は上書きしない・混ぜない）
       replace … ファイルにある項目で置き換える（呼び出し側で、先に今の記録を書き出す）
     どちらも記録を混ぜ合わせないので、同じ解答が二重に数えられることはない
   - 記録の中身は console などのログに出さない
   ────────────────────────────────────────────────────────────── */

export const TRANSFER_FORMAT = 'shinkyuu-db-learning-data'
export const TRANSFER_VERSION = 1
/** 読み込むファイルの上限（localStorage の容量より十分小さい） */
export const MAX_FILE_BYTES = 4 * 1024 * 1024

const MAX_ITEMS = 20000
const MAX_STR = 200

type Validator = (v: unknown) => boolean

const isObj = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v)
const isStr = (v: unknown) => typeof v === 'string' && v.length <= MAX_STR
const isNum = (v: unknown) => typeof v === 'number' && Number.isFinite(v)
const isBool = (v: unknown) => typeof v === 'boolean'
const arrayOf = (item: Validator): Validator => (v) =>
  Array.isArray(v) && v.length <= MAX_ITEMS && v.every(item)
const shape = (fields: Record<string, Validator>): Validator => (v) =>
  isObj(v) && Object.entries(fields).every(([k, f]) => f(v[k]))

const strList = arrayOf(isStr)

const pastExamSession = shape({
  examRound: isNum,
  answers: arrayOf(shape({ questionId: isStr, questionNumber: isNum, correct: isBool })),
  completed: isBool,
  updatedAt: isNum,
})

/** 書き出し・読み込みの対象。キー名と、値の形の検査 */
export const LEARNING_KEYS: { key: string; label: string; validate: Validator }[] = [
  {
    key: 'shinkyuu_quiz_history_v1',
    label: '予想問題・経穴クイズの解答履歴',
    validate: shape({
      attempts: arrayOf(shape({ qid: isStr, subject: isStr, correct: isBool, at: isNum })),
      studyDays: strList,
    }),
  },
  {
    key: 'shinkyuu_quiz_weak_v1',
    label: '間違えた問題',
    validate: arrayOf(shape({ qid: isStr, subject: isStr, streak: isNum, addedAt: isNum })),
  },
  { key: 'shinkyuu_quiz_review_v1', label: '復習リスト', validate: strList },
  {
    key: 'shinkyuu_daily_quiz_v1',
    label: '今日の10問（進行中）',
    validate: shape({
      date: isStr,
      questionIds: strList,
      answers: arrayOf((a) => a === null || isBool(a)),
      currentIndex: isNum,
      completed: isBool,
    }),
  },
  {
    key: 'shinkyuu_daily_streak_v1',
    label: '今日の10問の連続日数',
    validate: shape({ currentStreak: isNum, longestStreak: isNum, lastCompletedDate: isStr }),
  },
  {
    key: 'shinkyuu_daily_history_v1',
    label: '今日の10問の記録',
    validate: arrayOf(shape({ date: isStr, correct: isNum, total: isNum, completed: isBool })),
  },
  {
    key: 'shinkyuu_pastexam_history_v1',
    label: '過去問の解答履歴',
    validate: arrayOf(shape({ questionId: isStr, examRound: isNum, correct: isBool, answeredAt: isNum })),
  },
  {
    key: 'shinkyuu_pastexam_session_v1',
    label: '過去問の続き（回ごと）',
    validate: (v) =>
      isObj(v) &&
      Object.keys(v).length <= 100 &&
      Object.entries(v).every(([round, s]) => pastExamSession(s) && String((s as { examRound: number }).examRound) === round),
  },
  { key: 'shinkyuu_checked', label: '理解済みのテーマ', validate: strList },
  { key: 'shinkyuu_favorites', label: 'お気に入りのテーマ', validate: strList },
  { key: 'shinkyuu_weakness', label: '苦手なテーマ', validate: strList },
]

const KEY_SET = new Set(LEARNING_KEYS.map((k) => k.key))

export type TransferFile = {
  format: typeof TRANSFER_FORMAT
  version: typeof TRANSFER_VERSION
  exportedAt: string
  data: Record<string, unknown>
}

function storage(): Storage | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

/** この端末の値（壊れている・空なら undefined） */
function readValue(key: string): unknown {
  const s = storage()
  if (!s) return undefined
  try {
    const raw = s.getItem(key)
    if (raw === null || raw === '') return undefined
    return JSON.parse(raw)
  } catch {
    return undefined
  }
}

/** 項目ごとの件数（画面表示用。中身は出さない） */
export function countItems(key: string, v: unknown): number {
  if (v === undefined || v === null) return 0
  if (Array.isArray(v)) return v.length
  if (!isObj(v)) return 1
  if (key === 'shinkyuu_quiz_history_v1') {
    const h = v as { attempts?: unknown; studyDays?: unknown }
    const a = Array.isArray(h.attempts) ? h.attempts.length : 0
    // 解答がなく学習日だけある場合も「記録あり」とみなす
    return a > 0 ? a : Array.isArray(h.studyDays) && h.studyDays.length > 0 ? 1 : 0
  }
  return Object.keys(v).length > 0 ? (key === 'shinkyuu_pastexam_session_v1' ? Object.keys(v).length : 1) : 0
}

/** 記録として中身があるか（空配列・空オブジェクトは「なし」とみなす） */
function hasContent(key: string, v: unknown): boolean {
  return countItems(key, v) > 0
}

/** この端末の学習記録を書き出し用のオブジェクトにする（正しい形の項目だけ） */
export function buildExport(now = new Date()): TransferFile {
  const data: Record<string, unknown> = {}
  for (const { key, validate } of LEARNING_KEYS) {
    const v = readValue(key)
    if (hasContent(key, v) && validate(v)) data[key] = v
  }
  return { format: TRANSFER_FORMAT, version: TRANSFER_VERSION, exportedAt: now.toISOString(), data }
}

export function exportFileName(now = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `shinkyuu-db-learning-${now.getFullYear()}${p(now.getMonth() + 1)}${p(now.getDate())}.json`
}

export type ParseResult =
  | { ok: true; file: TransferFile }
  | { ok: false; error: string }

/** 読み込むファイルの検査。1か所でも合わなければ全体を拒否する */
export function parseImport(text: string): ParseResult {
  if (new Blob([text]).size > MAX_FILE_BYTES) return { ok: false, error: 'ファイルが大きすぎます（4MBまで）。' }
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return { ok: false, error: 'JSON として読み取れませんでした。書き出したファイルをそのまま選んでください。' }
  }
  if (!isObj(parsed) || parsed.format !== TRANSFER_FORMAT) {
    return { ok: false, error: '鍼灸国試DBの学習記録ファイルではありません。' }
  }
  if (parsed.version !== TRANSFER_VERSION) {
    return { ok: false, error: '対応していないバージョンのファイルです。' }
  }
  if (typeof parsed.exportedAt !== 'string' || !isObj(parsed.data)) {
    return { ok: false, error: 'ファイルの形が正しくありません。' }
  }
  const data = parsed.data
  const keys = Object.keys(data)
  if (keys.length === 0) return { ok: false, error: '学習記録が入っていません。' }
  for (const k of keys) {
    if (!KEY_SET.has(k)) return { ok: false, error: '想定していない項目が含まれています。' }
  }
  for (const { key, label, validate } of LEARNING_KEYS) {
    if (key in data && !validate(data[key])) {
      return { ok: false, error: `「${label}」の形が正しくありません。ファイルを編集していないか確認してください。` }
    }
  }
  return {
    ok: true,
    file: { format: TRANSFER_FORMAT, version: TRANSFER_VERSION, exportedAt: parsed.exportedAt, data },
  }
}

export type ImportMode = 'fill' | 'replace'

export type PlanRow = {
  key: string
  label: string
  /** ファイル側の件数 */
  incoming: number
  /** この端末の件数 */
  current: number
  /** この読み込み方で書き込むか */
  write: boolean
}

/** 読み込んだときに何が起きるかの一覧（書き込みはしない） */
export function planImport(file: TransferFile, mode: ImportMode): PlanRow[] {
  return LEARNING_KEYS.filter(({ key }) => key in file.data).map(({ key, label }) => {
    const current = countItems(key, readValue(key))
    return {
      key,
      label,
      incoming: countItems(key, file.data[key]),
      current,
      write: mode === 'replace' || current === 0,
    }
  })
}

/** 読み込みを実行する。書き込んだ項目のキーを返す */
export function applyImport(file: TransferFile, mode: ImportMode): { written: string[]; failed: string[] } {
  const s = storage()
  const written: string[] = []
  const failed: string[] = []
  if (!s) return { written, failed: Object.keys(file.data) }
  for (const row of planImport(file, mode)) {
    if (!row.write) continue
    try {
      s.setItem(row.key, JSON.stringify(file.data[row.key]))
      written.push(row.key)
    } catch {
      failed.push(row.key)
    }
  }
  try {
    // 同じタブで開いている学習記録の表示を更新する（quizStorage と同じ通知）
    window.dispatchEvent(new Event('shinkyuu-quiz-change'))
  } catch {
    /* 無視 */
  }
  return { written, failed }
}

/** この端末に学習記録があるか */
export function hasAnyLearningData(): boolean {
  return LEARNING_KEYS.some(({ key }) => hasContent(key, readValue(key)))
}
