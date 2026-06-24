import type { Theme, Importance, BlueprintVersion, QuestionCountMode, SourceReliability } from './types'
import { roundToYear } from './utils'

/**
 * 出題回数から重要度を自動計算
 * 第29〜34回（6回）を対象とした場合の基準:
 *   6/6回 → S（必須）
 *   5/6回 → A（重要）
 *   3〜4/6回 → B（標準）
 *   1〜2/6回 → C（参考）
 */
export function calcImportance(count: number): Importance {
  if (count >= 6) return 'S'
  if (count >= 5) return 'A'
  if (count >= 3) return 'B'
  return 'C'
}

/**
 * CSV 1行をフィールドの配列に分解（RFC 4180準拠）
 * - ダブルクォートで囲まれたフィールドを正しく処理
 * - フィールド内のダブルクォートは "" でエスケープ
 */
export function parseCSVLine(line: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      fields.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  fields.push(current)
  return fields
}

/**
 * 複数値フィールドを | で分割してトリム
 */
function splitMulti(val: string): string[] {
  return val
    .split('|')
    .map(s => s.trim())
    .filter(Boolean)
}

/**
 * CSV テキストを Theme[] に変換
 * - 1行目はヘッダー行として扱う
 * - 空行は無視
 * - examYears / count / latestRound / importance は自動計算
 */
export function parseThemesCSV(csvText: string): Theme[] {
  const lines = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n')
  if (lines.length < 2) return []

  const header = parseCSVLine(lines[0]).map(h => h.trim())

  const themes: Theme[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const values = parseCSVLine(line)
    const row: Record<string, string> = {}
    header.forEach((h, idx) => {
      row[h] = (values[idx] ?? '').trim()
    })

    const examRounds = splitMulti(row['examRounds']).map(Number).filter(n => !isNaN(n) && n > 0)
    const count = examRounds.length
    const latestRound = count > 0 ? Math.max(...examRounds) : 0

    themes.push({
      id: row['id'],
      name: row['name'],
      subject: row['subject'],
      examRounds,
      examYears: examRounds.map(roundToYear),
      count,
      latestRound,
      importance: calcImportance(count),
      officialLarge: row['officialLarge'] || undefined,
      officialMedium: row['officialMedium'] || undefined,
      officialSmall: row['officialSmall'] || undefined,
      normalizedTheme: row['normalizedTheme'] || undefined,
      aliases: splitMulti(row['aliases'] ?? ''),
      relatedThemes: splitMulti(row['relatedThemes'] ?? ''),
      studyPoint: row['studyPoint'] ?? '',
      blueprintVersion: (row['blueprintVersion'] as BlueprintVersion) || '2020',
      questionCountMode: (row['questionCountMode'] as QuestionCountMode) || '180',
      sourceReliability: (row['sourceReliability'] as SourceReliability) || 'indexed_official',
      sourceUrl: row['sourceUrl'] || undefined,
    })
  }

  return themes
}

/**
 * Theme[] を data.ts 形式の TypeScript コードとして出力
 * 管理画面から「生成されたコード」を確認・コピーするために使用
 */
export function themesToTypeScript(themes: Theme[]): string {
  const rows = themes.map(t => {
    const rounds = JSON.stringify(t.examRounds)
    const related = JSON.stringify(t.relatedThemes)
    const aliases = JSON.stringify(t.aliases ?? [])
    return `  t({
    id: '${t.id}',
    name: '${t.name}',
    subject: '${t.subject}',
    examRounds: ${rounds},
    importance: '${t.importance}',
    officialLarge: '${t.officialLarge ?? ''}',
    officialMedium: '${t.officialMedium ?? ''}',
    officialSmall: '${t.officialSmall ?? ''}',
    normalizedTheme: '${t.normalizedTheme ?? ''}',
    aliases: ${aliases},
    relatedThemes: ${related},
    studyPoint: '${t.studyPoint.replace(/'/g, "\\'")}',
    blueprintVersion: '${t.blueprintVersion}',
    questionCountMode: '${t.questionCountMode}',
    sourceReliability: '${t.sourceReliability}',
    sourceUrl: '${t.sourceUrl ?? ''}',
  }),`
  })
  return `export const themes: Theme[] = [\n${rows.join('\n')}\n]`
}
