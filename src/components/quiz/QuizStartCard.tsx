import Link from 'next/link'

export default function QuizStartCard({
  href,
  emoji,
  title,
  desc,
  accent,
}: {
  href: string
  emoji: string
  title: string
  desc: string
  accent: string
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-4 rounded-2xl border-2 bg-white px-4 py-4 transition-colors ${accent}`}
    >
      <span className="text-2xl" aria-hidden="true">{emoji}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-bold text-gray-900">{title}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-gray-500">{desc}</span>
      </span>
      <span className="text-gray-300" aria-hidden="true">›</span>
    </Link>
  )
}
