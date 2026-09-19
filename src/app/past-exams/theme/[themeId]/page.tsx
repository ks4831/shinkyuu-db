import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getTheme } from '@/lib/data'
import { loadPastExamQuestionsByTheme, themeIdsWithPastExamPractice } from '@/lib/pastExams'
import PastExamRunner from '@/components/pastExams/PastExamRunner'

export function generateStaticParams() {
  return themeIdsWithPastExamPractice().map((themeId) => ({ themeId }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ themeId: string }>
}): Promise<Metadata> {
  const { themeId } = await params
  const theme = getTheme(themeId)
  if (!theme) return {}
  return {
    title: `${theme.name}の過去問｜鍼灸国家試験 頻出分析DB`,
    description: `${theme.name}に関連する第31〜34回の鍼灸国家試験過去問をまとめて演習できます。`,
  }
}

export default async function PastExamThemePage({
  params,
}: {
  params: Promise<{ themeId: string }>
}) {
  const { themeId } = await params
  // Theme Masterに存在しないthemeIdは404（/themes/[themeId], /quiz/theme/[themeId] と同じ方針）
  const theme = getTheme(themeId)
  if (!theme) notFound()

  const questions = loadPastExamQuestionsByTheme(themeId)

  return (
    <main>
      <div className="mx-auto max-w-md px-4 pt-6">
        <nav className="text-xs text-gray-400">
          <Link href="/" className="hover:text-green-600">ホーム</Link>
          <span className="mx-1">/</span>
          <Link href={`/themes/${themeId}`} className="hover:text-green-600">{theme.name}</Link>
          <span className="mx-1">/</span>
          <span className="text-gray-600">テーマ別過去問</span>
        </nav>
      </div>

      {questions.length === 0 ? (
        // 実在するテーマだが第31〜34回に演習可能な過去問がまだ無いケース（404にはしない）。
        // 第29・30回のみ出題実績があるテーマでも「出題されたことがない」とは言わない。
        <div className="mx-auto max-w-md px-4 py-16 text-center">
          <p className="text-gray-600">
            「{theme.name}」の収録済み過去問はまだありません。
            <br />
            現在、過去問演習は第31〜34回を収録しています。
          </p>
          <Link
            href={`/themes/${themeId}`}
            className="mt-4 inline-block rounded-full bg-green-600 px-5 py-2.5 text-sm font-bold text-white"
          >
            テーマ詳細へ戻る
          </Link>
        </div>
      ) : (
        <PastExamRunner mode="theme" themeId={theme.id} themeName={theme.name} questions={questions} />
      )}
    </main>
  )
}
