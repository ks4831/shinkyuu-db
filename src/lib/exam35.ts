/**
 * 第35回 はり師・きゅう師国家試験の予定日（2月第4日曜日）。
 * 公式発表で確定日が判明したら更新する。カウントダウン表示にのみ使用し、
 * 学習ロジック・出題基準ロジックには一切関与しない。
 */
export const EXAM_35_DATE = '2027-02-28'

/**
 * 今日（Asia/Tokyo の暦日）から第35回試験日までの残り日数。
 * 試験日当日は 0、過ぎていれば null を返す（呼び出し側で非表示にする）。
 * サーバーでのビルド時固定を避けるため、原則クライアントのマウント後に呼ぶ。
 */
export function daysUntilExam35(now: Date = new Date()): number | null {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const todayStr = fmt.format(now) // YYYY-MM-DD
  const today = Date.parse(`${todayStr}T00:00:00Z`)
  const exam = Date.parse(`${EXAM_35_DATE}T00:00:00Z`)
  if (Number.isNaN(today) || Number.isNaN(exam)) return null
  const diff = Math.round((exam - today) / 86_400_000)
  return diff >= 0 ? diff : null
}
