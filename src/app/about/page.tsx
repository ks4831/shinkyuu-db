import type { Metadata } from 'next'
import Link from 'next/link'
import { EXAM_ROUNDS, QUESTIONS_PER_ROUND } from '@/lib/examQuestions'
import { roundToYear } from '@/lib/utils'
import { themes } from '@/lib/data'
import { ALL_QUESTIONS, standard2026QuizCount } from '@/lib/quiz'
import { pastExamCoverage } from '@/lib/pastExams'

export const metadata: Metadata = {
  title: 'About',
  description:
    '鍼灸国家試験（はり師・きゅう師）の対策サイト。第34回の実際の過去問演習、第29〜34回1,080問の出題分析、その傾向にもとづくオリジナル予想問題205問の3つで構成しています。',
}

const TOTAL_QUESTIONS = EXAM_ROUNDS.length * QUESTIONS_PER_ROUND
const ROUND_RANGE = `第${EXAM_ROUNDS[0]}回（${roundToYear(EXAM_ROUNDS[0])}年）〜第${EXAM_ROUNDS[EXAM_ROUNDS.length - 1]}回（${roundToYear(EXAM_ROUNDS[EXAM_ROUNDS.length - 1])}年）`
const QUIZ_TOTAL = ALL_QUESTIONS.length
const QUIZ_S2026 = standard2026QuizCount()
const EXAM_34_COLLECTED = pastExamCoverage().find((c) => c.round === 34)?.collected ?? 0

export default function AboutPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-10 space-y-10">

      <nav className="flex items-center gap-2 text-sm text-gray-400">
        <Link href="/" className="hover:text-green-600 transition-colors">トップ</Link>
        <span>›</span>
        <span className="text-gray-700">About</span>
      </nav>

      <section>
        <p className="text-xs text-green-600 font-semibold tracking-wide mb-2">このサイトについて</p>
        <h1 className="text-2xl font-bold text-gray-900">このサイトについて</h1>
      </section>

      <section className="space-y-6 text-sm text-gray-700 leading-relaxed">

        <div className="bg-green-50 border border-green-100 rounded-xl p-5">
          <p className="font-semibold text-green-800 mb-2">何のサイトですか？</p>
          <p>
            鍼灸国家試験（はり師・きゅう師）の対策サイトです。当サイトは非公式で、次の3つで構成されています。
          </p>
          <ul className="mt-2 space-y-1">
            <li>① <strong>過去問</strong> — 実際に国家試験で出題された問題（第34回・{EXAM_34_COLLECTED}問収録）</li>
            <li>② <strong>予想問題</strong> — 過去問の頻出傾向・重要テーマ・第35回新出題基準をもとにしたオリジナル問題（{QUIZ_TOTAL}問）</li>
            <li>③ <strong>出題分析</strong> — 第29〜34回・実際の過去問{TOTAL_QUESTIONS.toLocaleString()}問を{themes.length}テーマで分析</li>
          </ul>
          <p className="mt-2 rounded-lg bg-white/70 px-3 py-2 text-xs text-gray-600">
            ①の過去問と②の予想問題は別のものです。予想問題は過去問そのものではなく、傾向をもとに作成したオリジナル問題です。
          </p>
        </div>

        <div>
          <h2 className="font-bold text-gray-800 mb-3">📖 過去問を解く</h2>
          <ul className="space-y-2">
            <li className="flex gap-3 bg-white border border-gray-100 rounded-lg px-4 py-3">
              <span className="text-green-600 font-semibold flex-shrink-0">✓</span>
              <span><strong>実際の過去問</strong> — 第34回はり師・きゅう師国家試験の問題文・選択肢・正答を、財団の公式資料から直接収録（現在{EXAM_34_COLLECTED}問）</span>
            </li>
            <li className="flex gap-3 bg-white border border-gray-100 rounded-lg px-4 py-3">
              <span className="text-green-600 font-semibold flex-shrink-0">✓</span>
              <span>
                <strong>出典明記</strong> — 各問題に回・試験名・財団名を明記。詳細は
                <Link href="/sources" className="text-green-600 hover:underline mx-1">データソースページ</Link>
                をご覧ください。
              </span>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="font-bold text-gray-800 mb-3">📊 出題分析を見る</h2>
          <ul className="space-y-2">
            {[
              ['頻出テーマ', `${themes.length}テーマに分類し、出題数をS〜Cの重要度付きでランキング`],
              ['年度比較', `${ROUND_RANGE}の6年間の出題変化を可視化`],
              ['増減傾向', '直近で問数が増えている／減っているテーマを特定'],
              ['科目別割合', '14科目それぞれが全体の何%を占めるかを確認'],
            ].map(([title, desc]) => (
              <li key={title} className="flex gap-3 bg-white border border-gray-100 rounded-lg px-4 py-3">
                <span className="text-green-600 font-semibold flex-shrink-0">✓</span>
                <span><strong>{title}</strong> — {desc}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="font-bold text-gray-800 mb-3">📝 予想問題で演習する</h2>
          <ul className="space-y-2">
            {[
              ['予想問題', `${QUIZ_TOTAL}問。1問1画面で、解説・覚えるポイント・図解つき（実際の過去問ではありません）`],
              ['今日の10問', '毎日ちがう10問。連続学習日数（streak）を記録'],
              ['苦手復習', '間違えた問題・復習登録した問題だけをまとめて演習'],
              ['解き方いろいろ', '科目別・頻出・経穴・第35回 新基準など、目的別に10問ずつ'],
              ['学習の記録', 'のべ解答数・正答率・科目別の成績を確認（データは端末内にのみ保存）'],
            ].map(([title, desc]) => (
              <li key={title} className="flex gap-3 bg-white border border-gray-100 rounded-lg px-4 py-3">
                <span className="text-green-600 font-semibold flex-shrink-0">✓</span>
                <span><strong>{title}</strong> — {desc}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="font-bold text-gray-800 mb-3">第35回（2026年版 新出題基準）について</h2>
          <p>
            第35回（2027年2月）から2026年版出題基準が適用されます。
            「第29〜34回で実際によく出たテーマ」と「2026年版で新設・拡充されたテーマ」を
            <strong>別々の指標</strong>として表示し、新基準対応の予想問題{QUIZ_S2026}問も用意しています。
            詳しくは
            <Link href="/exam-35" className="text-green-600 hover:underline mx-1">第35回対策ページ</Link>
            をご覧ください。
          </p>
        </div>

        <div>
          <h2 className="font-bold text-gray-800 mb-3">このサイトに含まれないもの</h2>
          <ul className="space-y-2">
            {[
              '公式過去問の問題文・選択肢の全文転載',
              '試験の合否判定・出願手続き',
              '学習データのサーバー保存（記録は端末内のみ）',
            ].map(item => (
              <li key={item} className="flex gap-3 text-gray-500">
                <span className="text-gray-300">✕</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="font-bold text-gray-800 mb-3">データ概要</h2>
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            {[
              ['対象試験', 'はり師・きゅう師国家試験（共通）'],
              ['分析対象', `${ROUND_RANGE}（計${EXAM_ROUNDS.length}回・${TOTAL_QUESTIONS.toLocaleString()}問）`],
              ['分類テーマ数', `${themes.length}テーマ`],
              ['予想問題', `${QUIZ_TOTAL}問（うち第35回 新基準対応 ${QUIZ_S2026}問）`],
              ['出題基準', '2020年版（第35回からは2026年版）'],
              ['分類方法', '独自テーマキーによる分類（過去問の問題文・選択肢は非掲載）'],
            ].map(([label, value]) => (
              <div key={label} className="flex gap-4 px-4 py-3 border-b border-gray-50 last:border-0">
                <span className="text-xs text-gray-400 w-28 flex-shrink-0 pt-0.5">{label}</span>
                <span className="text-sm text-gray-700">{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="font-bold text-gray-800 mb-3">データソース</h2>
          <p>
            公益財団法人東洋療法研修試験財団が公表している「はり師きゅう師国家試験問題及び正答肢表」をもとに、
            出題テーマを独自分類・集計しています。詳細は
            <Link href="/sources" className="text-green-600 hover:underline mx-1">データソースページ</Link>
            をご覧ください。
          </p>
        </div>

        <div>
          <h2 className="font-bold text-gray-800 mb-3">免責事項</h2>
          <p>
            当サイトは非公式サイトです。分析内容・解説の正確性を保証するものではありません。
            詳細は
            <Link href="/disclaimer" className="text-green-600 hover:underline mx-1">免責事項ページ</Link>
            をご確認ください。
          </p>
        </div>

      </section>

      <div className="pt-4 border-t border-gray-100 flex items-center gap-4 text-sm">
        <Link href="/" className="text-green-600 hover:underline">← トップに戻る</Link>
        <Link href="/sources" className="text-green-600 hover:underline">データソース →</Link>
        <Link href="/disclaimer" className="text-green-600 hover:underline">免責事項 →</Link>
      </div>
    </main>
  )
}
