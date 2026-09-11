import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { PAST_EXAM_ALL_ROUNDS, loadPastExamQuestions } from '@/lib/pastExams'
import PastExamRunner from '@/components/pastExams/PastExamRunner'

export function generateStaticParams() {
  return PAST_EXAM_ALL_ROUNDS.map((round) => ({ round: String(round) }))
}

function parseRound(roundParam: string): number | null {
  const round = Number(roundParam)
  if (!Number.isInteger(round) || !PAST_EXAM_ALL_ROUNDS.includes(round)) return null
  return round
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ round: string }>
}): Promise<Metadata> {
  const { round: roundParam } = await params
  const round = parseRound(roundParam)
  if (round === null) return {}
  return {
    title: `第${round}回 過去問｜はり師・きゅう師国家試験`,
    description: `第${round}回 はり師・きゅう師国家試験の過去問を、公式資料にもとづいて出題形式のまま解ける過去問演習。`,
  }
}

export default async function PastExamRoundPage({
  params,
}: {
  params: Promise<{ round: string }>
}) {
  const { round: roundParam } = await params
  const round = parseRound(roundParam)
  if (round === null) notFound()

  const questions = loadPastExamQuestions(round)
  return (
    <main>
      <div className="mx-auto max-w-md px-4 pt-6">
        <nav className="text-xs text-gray-400">
          <Link href="/" className="hover:text-green-600">ホーム</Link>
          <span className="mx-1">/</span>
          <Link href="/past-exams" className="hover:text-green-600">過去問</Link>
          <span className="mx-1">/</span>
          <span className="text-gray-600">第{round}回</span>
        </nav>
      </div>
      <PastExamRunner round={round} questions={questions} />
    </main>
  )
}
