import type { Standard2026Status } from '@/lib/types'

/* 2026年版（令和8年版）出題基準による変更を示すバッジ。
   ─ 表示するのは公式資料で確認できる事実（new / expanded / reorganized）のみ。
   ─ 「第35回で出る」等の予測・煽り表現は使わない。 */

const LABEL: Record<Standard2026Status, string | null> = {
  new: '2026年版で新設',
  expanded: '2026年版で拡充',
  reorganized: '2026年版で再編',
  unchanged: null,
}

const STYLE: Record<Standard2026Status, string> = {
  new: 'bg-violet-50 text-violet-700 border-violet-200',
  expanded: 'bg-sky-50 text-sky-700 border-sky-200',
  reorganized: 'bg-teal-50 text-teal-700 border-teal-200',
  unchanged: 'bg-gray-50 text-gray-500 border-gray-200',
}

const ICON: Record<Standard2026Status, string> = {
  new: '🆕',
  expanded: '↑',
  reorganized: '⇄',
  unchanged: '',
}

export default function Standard2026Badge({
  status,
  className = '',
}: {
  status: Standard2026Status
  className?: string
}) {
  const label = LABEL[status]
  if (!label) return null
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-bold ${STYLE[status]} ${className}`}
    >
      <span aria-hidden>{ICON[status]}</span>
      {label}
    </span>
  )
}
