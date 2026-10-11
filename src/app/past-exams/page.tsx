import type { Metadata } from 'next'
import Link from 'next/link'
import { subjects, themes } from '@/lib/data'
import {
  pastExamCoverage,
  pastExamCountsBySubject,
  pastExamCountsByTheme,
  pastExamPracticeRangeLabel,
  pastExamPracticeTotal,
} from '@/lib/pastExams'
import PastExamsTabs from '@/components/pastExams/PastExamsTabs'
import PastExamThemePicker, { type PastExamThemeGroup } from '@/components/pastExams/PastExamThemePicker'
import NoteArticleLinks from '@/components/NoteArticleLinks'

const RANGE_LABEL = pastExamPracticeRangeLabel()
const PRACTICE_TOTAL = pastExamPracticeTotal()

export const metadata: Metadata = {
  title: '過去問｜実際の国家試験問題を解く',
  description: `はり師・きゅう師国家試験の過去問（${RANGE_LABEL}・${PRACTICE_TOTAL}問）を、公式資料にもとづいて出題形式のまま解ける過去問演習。年度別・科目別・テーマ別に演習できます。`,
}

function TabLead({ children }: { children: React.ReactNode }) {
  return <p className="mb-3 text-xs leading-relaxed text-gray-500">{children}</p>
}

export default function PastExamsPage() {
  const coverage = pastExamCoverage()
  const subjectCounts = pastExamCountsBySubject()
  // 件数は実過去問データ（収録済みの回の問題）からの集計。Theme Masterの count/examRounds/latestRound は使わない
  const themeCounts = pastExamCountsByTheme()

  const themeGroups: PastExamThemeGroup[] = subjects.map((s) => ({
    subjectId: s.id,
    subjectName: s.name,
    subjectShortName: s.shortName,
    themes: themes
      .filter((t) => t.subject === s.id)
      .map((t) => ({
        id: t.id,
        name: t.name,
        subjectId: t.subject,
        keywords: [...(t.aliases ?? []), t.officialLarge, t.officialMedium, t.officialSmall].filter(
          (k): k is string => Boolean(k),
        ),
        count: themeCounts[t.id] ?? 0,
      }))
      // 過去問のあるテーマを先に（同順位はTheme Masterの並び順を維持）
      .sort((a, b) => Number(b.count > 0) - Number(a.count > 0)),
  }))

  const roundPanel = (
    <>
      <TabLead>第34回など、1回分の国家試験を本番形式でまとめて解けます。</TabLead>
      <div className="space-y-2.5">
        {coverage.map((r) =>
          r.available ? (
            <Link
              key={r.round}
              href={`/past-exams/${r.round}`}
              className="flex items-center justify-between gap-3 rounded-2xl border border-green-300 bg-white p-4 hover:bg-green-50"
            >
              <span>
                <span className="block text-sm font-bold text-gray-900">第{r.round}回</span>
                <span className="mt-0.5 block text-xs text-gray-500">
                  {r.year}年・{r.playable} / {r.totalPerRound}問
                </span>
              </span>
              <span className="flex-shrink-0 text-gray-300" aria-hidden="true">›</span>
            </Link>
          ) : (
            <div
              key={r.round}
              className="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-4"
            >
              <span className="text-sm font-bold text-gray-400">第{r.round}回</span>
              <span className="text-xs text-gray-400">準備中</span>
            </div>
          ),
        )}
      </div>
    </>
  )

  const subjectPanel = (
    <>
      <TabLead>解剖学・生理学など、科目ごとに{RANGE_LABEL}の過去問をまとめて演習できます。</TabLead>
      <div className="space-y-2">
        {subjects.map((s) => {
          const count = subjectCounts[s.id] ?? 0
          return count > 0 ? (
            <Link
              key={s.id}
              href={`/past-exams/subject/${s.id}`}
              className="flex items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3.5 hover:border-green-300 hover:bg-green-50"
            >
              <span className="min-w-0">
                <span className="block text-sm font-bold text-gray-900">{s.name}</span>
                <span className="mt-0.5 block text-xs text-gray-500">{RANGE_LABEL}</span>
              </span>
              <span className="flex flex-shrink-0 items-center gap-2 text-sm font-bold text-green-700">
                {count}問
                <span className="font-normal text-gray-300" aria-hidden="true">›</span>
              </span>
            </Link>
          ) : (
            <div
              key={s.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3.5"
            >
              <span className="text-sm font-bold text-gray-400">{s.name}</span>
              <span className="text-xs text-gray-400">収録問題なし</span>
            </div>
          )
        })}
      </div>
    </>
  )

  const themePanel = (
    <>
      <TabLead>原穴・五兪穴・自律神経など、細かいテーマごとに過去問を解けます。</TabLead>
      <PastExamThemePicker groups={themeGroups} />
    </>
  )

  return (
    <main className="mx-auto max-w-md px-4 pb-24 pt-6">
      <nav className="mb-3 text-xs text-gray-400">
        <Link href="/" className="hover:text-green-600">ホーム</Link>
        <span className="mx-1">/</span>
        <span className="text-gray-600">過去問</span>
      </nav>

      <h1 className="text-xl font-bold text-gray-900">過去問</h1>
      <p className="mt-1 text-xs text-gray-500">
        実際の国家試験問題を解く
        {PRACTICE_TOTAL > 0 && <span className="ml-1.5 text-gray-400">（{RANGE_LABEL}・{PRACTICE_TOTAL}問収録）</span>}
      </p>

      <PastExamsTabs panels={{ round: roundPanel, subject: subjectPanel, theme: themePanel }} />

      <NoteArticleLinks placement="past-exams" />
    </main>
  )
}
