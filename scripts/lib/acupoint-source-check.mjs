/* ──────────────────────────────────────────────────────────────
   経穴の出典管理（src/data/acupointSources.json）の整合性検査
   - npm run audit:data と npm run test:sources（わざと壊したデータで検出を確かめる）の共通ロジック
   - 定義: docs/acupoint-source-schema.md
   ────────────────────────────────────────────────────────────── */
import { containsTerm, masterTerms, officialText } from './acupoint-text.mjs'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const QID_RE = /\d{2}-\d{3}/g

/**
 * @param {object} p
 * @param {object} p.data       acupointSources.json の中身
 * @param {object} p.lib        src/lib/acupointSources.ts（定数と summarizeRecords）
 * @param {object[]} p.master   経穴マスター（ACUPOINTS）
 * @param {Map<string, object>} p.pastExams  問題ID → 過去問JSONの1問
 * @param {Map<string, Set<string>>} p.occurrences  問題ID → 出題データでその設問に紐づく slug
 * @param {string} p.today      YYYY-MM-DD（これより後の確認日は ERROR）
 * @returns {{ errors: string[], warns: string[], stats: { records: number, active: number, superseded: number, byStatus: Record<string, number>, summary: Record<string, Record<string, number>> } }}
 */
export function checkAcupointSources({ data: D, lib, master, pastExams, occurrences, today }) {
  const errors = []
  const warns = []
  const E = (m) => errors.push(m)
  const W = (m) => warns.push(m)

  if (D.schemaVersion !== 1) E(`acupointSources: schemaVersion ${D.schemaVersion} は未対応`)
  const docs = new Map()
  for (const s of D.sources) {
    if (docs.has(s.id)) E(`acupointSources: 資料ID重複 ${s.id}`)
    if (!lib.SOURCE_TYPES.includes(s.sourceType)) E(`acupointSources: 資料 ${s.id} の sourceType が不正: ${s.sourceType}`)
    docs.set(s.id, s)
  }
  const typeOf = new Map([...docs].map(([id, s]) => [id, s.sourceType]))
  const bySlug = new Map(master.map((a) => [a.slug, a]))
  const valueOf = (a, f, claim) => (f === 'specialPoints' ? ((a.specialPoints ?? []).includes(claim) ? claim : undefined) : a[f])

  let stale = 0
  const active = []
  const exactKeys = new Map()
  const nameKeys = new Map()
  D.records.forEach((r, i) => {
    const at = `acupointSources.records[${i}]（${r.acupointId} ${r.fieldName}）`
    const a = bySlug.get(r.acupointId)
    if (!a) { E(`${at}: 経穴マスターにない slug`); return }
    if (!lib.SOURCE_FIELDS.includes(r.fieldName)) E(`${at}: fieldName が不正`)
    if (!lib.RECORD_STATUSES.includes(r.verificationStatus)) E(`${at}: verificationStatus が不正: ${r.verificationStatus}`)
    if (!lib.COVERAGES.includes(r.coverage)) E(`${at}: coverage が不正: ${r.coverage}`)
    if (!DATE_RE.test(r.verifiedAt ?? '')) E(`${at}: verifiedAt の形式が不正`)
    else if (r.verifiedAt > today) E(`${at}: verifiedAt ${r.verifiedAt} が未来の日付`)
    if (!String(r.sourcePage ?? '').trim()) E(`${at}: sourcePage が空（問題IDやページを書く。推測で書かない）`)
    if (r.claim !== r.currentValue) E(`${at}: claim と currentValue が一致しない`)
    const doc = docs.get(r.sourceId)
    if (!doc) { E(`${at}: 未登録の資料 ${r.sourceId}`); return }
    // 日本の確認は日本の資料だけ、WHO の確認は国際資料だけ
    const jp = lib.JAPANESE_SOURCE_TYPES.includes(doc.sourceType)
    if (['JAPAN_VERIFIED', 'JAPAN_INFERRED'].includes(r.verificationStatus) && !jp) E(`${at}: ${r.verificationStatus} は日本の資料にだけ使える（${r.sourceId}）`)
    if (r.verificationStatus === 'WHO_VERIFIED' && doc.sourceType !== 'international') E(`${at}: WHO_VERIFIED は国際資料にだけ使える（${r.sourceId}）`)
    if (r.verificationStatus === 'HISTORICAL_ONLY' && doc.sourceType !== 'classic') E(`${at}: HISTORICAL_ONLY は古典にだけ使える（${r.sourceId}）`)

    // 原文表記（sourceText）：表記が違うものを確認済みにしない
    const text = r.sourceText ?? r.claim
    if ('sourceText' in r && !String(r.sourceText ?? '').trim()) E(`${at}: sourceText が空`)
    if (r.fieldName === 'name') {
      if (r.verificationStatus === 'CONFLICT' && (!r.sourceText || r.sourceText === r.claim)) E(`${at}: 名称の CONFLICT には資料の表記（sourceText）を書く`)
      if (['JAPAN_VERIFIED', 'WHO_VERIFIED'].includes(r.verificationStatus) && text !== r.claim) E(`${at}: 資料の表記「${text}」と名称「${r.claim}」が違うのに ${r.verificationStatus}`)
    }

    // 履歴として外したレコード
    const superseded = 'supersededAt' in r
    if (superseded) {
      if (!DATE_RE.test(r.supersededAt ?? '')) E(`${at}: supersededAt の形式が不正`)
      else if (r.supersededAt < r.verifiedAt) E(`${at}: supersededAt が verifiedAt より前`)
      if (!String(r.supersededBy ?? '').trim()) E(`${at}: supersededBy（外した理由・後継）が空`)
      if (valueOf(a, r.fieldName, r.claim) === r.currentValue) E(`${at}: マスターの現在値と同じ記述なのに superseded になっている`)
    } else if ('supersededBy' in r) E(`${at}: supersededBy だけがある（supersededAt がない）`)

    // 公式問題：問題IDが実在し、その設問が経穴に対応している
    if (doc.sourceType === 'official_exam') {
      const ids = String(r.sourcePage).match(QID_RE) ?? []
      if (!ids.length) E(`${at}: sourcePage に問題ID（例 30-115）がない`)
      for (const id of ids) {
        const q = pastExams.get(id)
        if (!q) { E(`${at}: sourcePage の問題 ${id} が過去問データにない`); continue }
        const body = officialText(q)
        if (r.fieldName === 'name') {
          // 名称は資料の表記そのものが公式本文にあること（推論で名称を確認済みにしない）
          if (!containsTerm(body, text)) E(`${at}: 問題 ${id} の問題文・選択肢に「${text}」がない`)
        } else if (['JAPAN_VERIFIED', 'CONFLICT'].includes(r.verificationStatus)) {
          // 直接の確認は、設問がその経穴を名指しするか、出題データでその設問に紐づいていること
          const named = masterTerms(a).some((t) => containsTerm(body, t))
          if (!named && !occurrences.get(id)?.has(a.slug)) E(`${at}: 問題 ${id} はこの経穴に対応していない（名称なし・出題データにもない）`)
        }
      }
    }
    // WHO：ページ表記のコードが経穴と一致する
    if (r.sourceId === 'WHO-2008') {
      const m = /（([A-Z]{2}\d+)）/.exec(r.sourcePage)
      if (!m || m[1] !== a.code) E(`${at}: WHO の sourcePage「${r.sourcePage}」が ${a.code} を指していない`)
    }

    if (superseded) return
    active.push(r)
    // 重複：同じ経穴・項目・記述・資料・ページは1件
    const k = [r.acupointId, r.fieldName, r.claim, r.sourceId, r.sourcePage].join('|')
    if (exactKeys.has(k)) E(`${at}: records[${exactKeys.get(k)}] と重複（経穴・項目・記述・資料・ページが同じ）`)
    else exactKeys.set(k, i)
    if (r.fieldName === 'name') {
      const nk = [r.acupointId, r.claim, r.sourceId].join('|')
      if (nameKeys.has(nk)) E(`${at}: 名称の判定が同じ資料で2件ある（records[${nameKeys.get(nk)}]）`)
      else nameKeys.set(nk, i)
      // 資料の別表記で検索できるか
      if (r.verificationStatus === 'CONFLICT' && r.sourceText && ![a.name, ...(a.aliases ?? [])].includes(r.sourceText))
        W(`${at}: 資料の表記「${r.sourceText}」がマスターの名称・別名にない（その表記で検索できない）`)
    }
    // 確認した時点から値が変わったレコード（総合判定では使われない）
    if (valueOf(a, r.fieldName, r.claim) !== r.currentValue) stale++
  })
  if (stale) W(`acupointSources: 確認後にマスターの値が変わったレコード ${stale} 件（再確認が必要）`)

  // 詳細情報（location）がある穴は、WHO との照合レコードを持つ
  const whoChecked = new Set(active.filter((r) => r.fieldName === 'location' && typeOf.get(r.sourceId) === 'international').map((r) => r.acupointId))
  const noWho = master.filter((a) => a.location && !whoChecked.has(a.slug)).map((a) => a.slug)
  if (noWho.length) W(`acupointSources: location の WHO 照合レコードがない穴 ${noWho.length}: ${noWho.join(', ')}`)

  // 総合判定：JAPAN_VERIFIED は日本の資料の直接確認（full）があるときだけ。WHO・推論だけでは昇格しない
  const summary = {}
  for (const a of master) {
    for (const field of lib.SOURCE_FIELDS) {
      const vals = field === 'specialPoints' ? (a.specialPoints?.length ? a.specialPoints : undefined) : a[field] === undefined ? undefined : [a[field]]
      for (const value of vals ?? [undefined]) {
        let status = 'NOT_APPLICABLE'
        if (value !== undefined) {
          const rs = active.filter((r) => r.acupointId === a.slug && r.fieldName === field && r.claim === value && r.currentValue === value)
          status = lib.summarizeRecords(rs, typeOf)
          const jpDirect = rs.some((r) => lib.JAPANESE_SOURCE_TYPES.includes(typeOf.get(r.sourceId)) && r.verificationStatus === 'JAPAN_VERIFIED' && r.coverage === 'full')
          if (status === 'JAPAN_VERIFIED' && !jpDirect) E(`acupointSources: ${a.slug} ${field}「${value}」が日本の直接確認なしに JAPAN_VERIFIED になった`)
        }
        summary[field] ??= {}
        summary[field][status] = (summary[field][status] ?? 0) + 1
      }
    }
  }
  const byStatus = {}
  for (const r of active) byStatus[r.verificationStatus] = (byStatus[r.verificationStatus] ?? 0) + 1
  return {
    errors,
    warns,
    stats: { records: D.records.length, active: active.length, superseded: D.records.length - active.length, byStatus, summary },
  }
}

/** 過去問JSON（src/data/pastExams/exam-*.json）と出題データから、検査用の索引を作る */
export function buildExamIndexes(pastExamLists, occurrenceData) {
  const pastExams = new Map(pastExamLists.flat().map((q) => [q.id, q]))
  const occurrences = new Map(occurrenceData.occurrences.map((o) => [o.questionId, new Set(o.acupoints.map((x) => x.slug).filter(Boolean))]))
  return { pastExams, occurrences }
}
