import { importanceColors, importanceLabel } from '@/lib/utils'
import type { Importance } from '@/lib/types'

export default function ImportanceBadge({
  importance,
  showLabel = true,
}: {
  importance: Importance
  showLabel?: boolean
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border ${importanceColors[importance]}`}
    >
      {importance}
      {showLabel && (
        <span className="font-normal">{importanceLabel(importance)}</span>
      )}
    </span>
  )
}
