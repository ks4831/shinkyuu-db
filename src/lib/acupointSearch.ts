/* ──────────────────────────────────────────────────────────────
   経穴検索（/acupoints の検索欄）
   - 正規名・別名（旧字体・異体字を含む）・読み・WHOコード・経脈名で探す
   - 1穴は1件だけ返す（別名が複数一致しても重複しない）。リンク先は slug のまま
   ────────────────────────────────────────────────────────────── */

export type AcupointSearchRow = {
  slug: string
  code: string
  name?: string
  reading?: string
  meridianName: string
  aliases: string[]
}

export function searchAcupoints<T extends AcupointSearchRow>(points: T[], q: string, limit = 20): T[] {
  const query = q.trim()
  if (!query) return []
  return points
    .filter(
      (p) =>
        (p.name?.includes(query) ?? false) ||
        p.aliases.some((x) => x.includes(query)) ||
        (p.reading?.includes(query) ?? false) ||
        p.code.toLowerCase().includes(query.toLowerCase()) ||
        p.meridianName.includes(query),
    )
    .slice(0, limit)
}
