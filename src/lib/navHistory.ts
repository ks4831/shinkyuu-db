/* ─────────────────────────────────────────────
   サイト内の閲覧履歴（「← 戻る」ボタン用）

   ・このタブでサイト内を移動した順に、URL（パス＋クエリ）を sessionStorage に積む。
     外部サイトや別タブの履歴は入らないので、戻る先は必ずサイト内のページになる。
   ・ブラウザの history.back() は使わない（外部サイトから来た場合に外へ戻ってしまうため）。
     戻る先を自前の履歴から決めて、サイト内リンクとして移動する。
   ・同じパスでクエリだけが変わった場合（タブ切替・検索語の反映など）は、
     別ページとして積まずに今の項目を置き換える。
   ・履歴が無い（直接開いた・外部から来た）ときは DB トップへ移動する。
   ───────────────────────────────────────────── */

export type NavEntry = { url: string; scrollY: number }

export const NAV_HISTORY_KEY = 'shinkyuu_nav_history_v1'
const PENDING_BACK_KEY = 'shinkyuu_nav_pending_back_v1'
const MAX_ENTRIES = 50
export const TOP_URL = '/'

/** サイト内の相対URL（/ で始まり、// や \ で始まらない）だけを受け付ける */
export function isInternalUrl(url: unknown): url is string {
  return typeof url === 'string' && url.startsWith('/') && !url.startsWith('//') && !url.startsWith('/\\')
}

function pathOf(url: string): string {
  const i = url.indexOf('?')
  return i === -1 ? url : url.slice(0, i)
}

function storage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.sessionStorage
  } catch {
    return null
  }
}

export function loadHistory(): NavEntry[] {
  try {
    const raw = storage()?.getItem(NAV_HISTORY_KEY)
    const list = raw ? JSON.parse(raw) : []
    if (!Array.isArray(list)) return []
    return list
      .filter((e) => e && isInternalUrl(e.url))
      .map((e) => ({ url: e.url as string, scrollY: Number.isFinite(e.scrollY) ? Math.max(0, e.scrollY) : 0 }))
      .slice(-MAX_ENTRIES)
  } catch {
    return []
  }
}

export function saveHistory(list: NavEntry[]): void {
  try {
    storage()?.setItem(NAV_HISTORY_KEY, JSON.stringify(list.slice(-MAX_ENTRIES)))
  } catch {
    /* 保存できない環境（プライベートモードの容量制限など）では履歴なし＝トップへ戻る */
  }
}

/**
 * ページ表示時の履歴の更新（純粋関数）。
 * - pendingBack：「← 戻る」ボタンで移動した先。履歴はボタン側で既に1つ戻してある
 * - viaPopState：ブラウザの戻る・進む操作で表示された
 */
export function applyVisit(list: NavEntry[], url: string, opts: { pendingBack?: string | null; viaPopState?: boolean } = {}): NavEntry[] {
  if (!isInternalUrl(url)) return list
  const top = list[list.length - 1]
  if (opts.pendingBack && opts.pendingBack === url && top?.url === url) return list
  if (top?.url === url) return list // 再読み込み・同じURLへの再表示
  if (opts.viaPopState) {
    const prev = list[list.length - 2]
    if (prev?.url === url) return list.slice(0, -1) // ブラウザの戻る
  }
  if (top && pathOf(top.url) === pathOf(url)) {
    // クエリだけの変化は置き換え（同じページの表示切替として扱う）
    return [...list.slice(0, -1), { url, scrollY: top.scrollY }]
  }
  return [...list, { url, scrollY: 0 }].slice(-MAX_ENTRIES)
}

/** 「← 戻る」の行き先（純粋関数）。履歴が無ければトップ */
export function backTarget(list: NavEntry[]): { url: string; scrollY: number; next: NavEntry[]; fallback: boolean } {
  const prev = list[list.length - 2]
  if (prev && isInternalUrl(prev.url)) return { url: prev.url, scrollY: prev.scrollY, next: list.slice(0, -1), fallback: false }
  return { url: TOP_URL, scrollY: 0, next: [], fallback: true }
}

export function updateTopScroll(list: NavEntry[], url: string, scrollY: number): NavEntry[] {
  const top = list[list.length - 1]
  if (!top || top.url !== url) return list
  return [...list.slice(0, -1), { url, scrollY: Math.max(0, Math.round(scrollY)) }]
}

export function setPendingBack(url: string | null): void {
  try {
    if (url) storage()?.setItem(PENDING_BACK_KEY, url)
    else storage()?.removeItem(PENDING_BACK_KEY)
  } catch {
    /* noop */
  }
}

export function getPendingBack(): string | null {
  try {
    const v = storage()?.getItem(PENDING_BACK_KEY) ?? null
    return isInternalUrl(v) ? v : null
  } catch {
    return null
  }
}
