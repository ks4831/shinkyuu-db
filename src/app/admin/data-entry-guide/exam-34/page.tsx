import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '第34回 データ入力ガイド（管理用）',
  robots: 'noindex,nofollow',
}

// 第34回の科目別想定問題番号範囲（仮）
// 2020年版出題基準 180問体制 — 実際の配分と異なる場合があります
const SUBJECT_RANGES = [
  { id: 'medical-overview',    name: '医療概論',             shortName: '医療概論',   from: 1,   to: 7,   count: 7  },
  { id: 'hygiene',             name: '衛生学・公衆衛生学',   shortName: '衛生',       from: 8,   to: 22,  count: 15 },
  { id: 'regulations',         name: '関係法規',             shortName: '法規',       from: 23,  to: 27,  count: 5  },
  { id: 'anatomy',             name: '解剖学',               shortName: '解剖',       from: 28,  to: 55,  count: 28 },
  { id: 'physiology',          name: '生理学',               shortName: '生理',       from: 56,  to: 75,  count: 20 },
  { id: 'pathology',           name: '病理学概論',           shortName: '病理',       from: 76,  to: 85,  count: 10 },
  { id: 'clinical-general',    name: '臨床医学総論',         shortName: '臨床総論',   from: 86,  to: 105, count: 20 },
  { id: 'clinical-specific',   name: '臨床医学各論',         shortName: '臨床各論',   from: 106, to: 125, count: 20 },
  { id: 'rehabilitation',      name: 'リハビリテーション医学', shortName: 'リハ',      from: 126, to: 130, count: 5  },
  { id: 'oriental-overview',   name: '東洋医学概論',         shortName: '東洋概論',   from: 131, to: 145, count: 15 },
  { id: 'meridians-acupoints', name: '経絡経穴概論',         shortName: '経絡経穴',   from: 146, to: 165, count: 20 },
  { id: 'acupuncture-theory',  name: 'はり理論',             shortName: 'はり',       from: 166, to: 172, count: 7  },
  { id: 'moxibustion-theory',  name: 'きゅう理論',           shortName: 'きゅう',     from: 173, to: 176, count: 4  },
  { id: 'oriental-clinical',   name: '東洋医学臨床論',       shortName: '東洋臨床',   from: 177, to: 180, count: 4  },
]

// 既存テーマIDのスラッグ参照表
const SLUG_EXAMPLES = [
  { ja: '原穴',      slug: 'gen-ketsu',         subject: '経絡経穴' },
  { ja: '郄穴',      slug: 'geki-ketsu',        subject: '経絡経穴' },
  { ja: '募穴',      slug: 'bo-ketsu',          subject: '経絡経穴' },
  { ja: '五兪穴',    slug: 'go-yu-ketsu',       subject: '経絡経穴' },
  { ja: '奇経八脈',  slug: 'kiki-hachi-myaku',  subject: '経絡経穴' },
  { ja: '十二経脈',  slug: 'juni-kei-myaku',    subject: '経絡経穴' },
  { ja: '経穴の主治', slug: 'kei-ketsu-shuchi',  subject: '経絡経穴' },
  { ja: '陰陽論',    slug: 'in-yo-ron',         subject: '東洋概論' },
  { ja: '五行論',    slug: 'go-gyo-ron',        subject: '東洋概論' },
  { ja: '気血津液',  slug: 'ki-ketsu-shin-eki', subject: '東洋概論' },
  { ja: '蔵象',      slug: 'zo-sho',            subject: '東洋概論' },
  { ja: '六淫',      slug: 'roku-in',           subject: '東洋概論' },
  { ja: '七情',      slug: 'shichi-jo',         subject: '東洋概論' },
  { ja: '健康日本21', slug: 'kenko-nihon-21',   subject: '衛生' },
  { ja: '感染症',    slug: 'kansen-sho',        subject: '衛生' },
  { ja: '生活習慣病', slug: 'seikatsu-shukan-byo', subject: '衛生' },
  { ja: '筋の起始停止', slug: 'kin-kishi-teishi', subject: '解剖' },
  { ja: '脳神経',    slug: 'no-shinkei',        subject: '解剖' },
  { ja: '関節の構造', slug: 'kansetsu-kozo',    subject: '解剖' },
  { ja: '自律神経',  slug: 'jiritsu-shinkei',   subject: '生理' },
  { ja: '関係法規',  slug: 'kanke-hokki',       subject: '法規' },
  { ja: '弁証論治',  slug: 'ben-sho-ron-chi',   subject: '東洋臨床' },
]

const CSV_HEADER = 'id,examRound,year,questionNumber,session,subject,officialLarge,officialMedium,officialSmall,normalizedTheme,subTheme,importance,studyPoint,sourceUrl,sourceReliability,blueprintVersion,questionCountMode,memo'

const CSV_SAMPLE_ROWS = [
  'exam34-Q001,34,2026,1,共通,medical-overview,医療概論,医療の倫理,インフォームドコンセント,informed-consent,,A,インフォームドコンセントの定義と要件を押さえる,https://ahaki.or.jp/exam/archives/,indexed_official,2020,180,',
  'exam34-Q028,34,2026,28,共通,anatomy,筋系,全身の骨格筋,各筋の起始・停止・作用・支配神経,kin-kishi-teishi,,S,主要な筋の起始停止と作用を解剖図で確認,https://ahaki.or.jp/exam/archives/,indexed_official,2020,180,',
  'exam34-Q146,34,2026,146,共通,meridians-acupoints,経穴,特定穴,原穴,gen-ketsu,,S,各経脈の原穴12穴を完全暗記する,https://ahaki.or.jp/exam/archives/,indexed_official,2020,180,',
  'exam34-Q165,34,2026,165,共通,meridians-acupoints,経絡,正経十二経脈,十二経脈の概要と表裏関係,juni-kei-myaku,,S,流注順序と陰陽表裏の対応を確認する,https://ahaki.or.jp/exam/archives/,indexed_official,2020,180,',
]

export default function DataEntryGuideExam34Page() {
  const totalCount = SUBJECT_RANGES.reduce((s, r) => s + r.count, 0)

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 space-y-10">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-400 flex-wrap">
          <Link href="/" className="hover:text-green-600">トップ</Link>
          <span>›</span>
          <Link href="/admin/data-status" className="hover:text-green-600">データ入力進捗</Link>
          <span>›</span>
          <span className="text-gray-700">第34回 入力ガイド</span>
        </div>

        <div className="mt-4 flex items-start gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              第34回 データ入力ガイド
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              2026年実施 / 2020年版出題基準 / 180問 / 最新実施回
            </p>
          </div>
          <span className="bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full mt-1">
            入力開始推奨
          </span>
        </div>
      </div>

      {/* なぜ第34回から？ */}
      <section className="bg-green-50 border border-green-100 rounded-2xl p-5 space-y-2">
        <h2 className="font-bold text-green-800 text-lg">第34回から始める理由</h2>
        <ul className="text-sm text-green-800 space-y-1.5">
          <li>✓ 最新実施回のため、受験生にとって最も参考になるデータ</li>
          <li>✓ 2026年版出題基準（第35回以降）との比較ベースになる</li>
          <li>✓ 180問すべてをテーマ分類することで、科目ごとの頻出傾向が見える</li>
          <li>✓ 入力後は <code className="bg-green-100 px-1 rounded">/admin/data-status</code> で進捗確認できる</li>
        </ul>
      </section>

      {/* 入力手順 */}
      <section className="bg-white rounded-2xl border p-5 space-y-4">
        <h2 className="font-bold text-gray-800 text-lg">入力手順</h2>
        <ol className="space-y-4">
          {[
            {
              title: '公式PDFを用意する',
              desc: '東洋療法研修試験財団（ahaki.or.jp）の第34回試験問題・正答表PDFを手元に置く。本文の転載は不要 — 問題番号と科目分類のみ確認する。',
            },
            {
              title: 'exam-34.csv を開く',
              desc: 'src/data/raw/exam-34.csv をVSCode / Excel / Google Sheetsで開く。下記のCSVフォーマット例を参考に1問1行で入力する。',
            },
            {
              title: '180問すべてのテーマを分類する',
              desc: '各問の「科目ID・officialLarge/Medium/Small・normalizedTheme」を入力する。問題文・選択肢は入力しない。studyPoint はそのテーマで問われやすい内容を自分の言葉で簡潔に書く。',
            },
            {
              title: 'ビルドして確認する',
              desc: 'ターミナルで npm run build を実行。/admin/data-status で180問入力済みになっていればOK。',
            },
          ].map(({ title, desc }, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-green-600 text-white text-sm font-bold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <div>
                <p className="font-semibold text-gray-800">{title}</p>
                <p className="text-sm text-gray-500 mt-1 leading-relaxed">{desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* 入力ルール */}
      <section className="rounded-2xl border border-red-100 bg-red-50 p-5 space-y-3">
        <h2 className="font-bold text-red-800 text-lg">入力ルール（必読）</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            ['問題文は入力しない', '著作権保護のため、問題の文章は一切書かない'],
            ['選択肢は入力しない', '正解番号・各選択肢の内容も記載しない'],
            ['studyPoint は自作で書く', '「何を覚えるか」を受験生向けに一文で書く（公式文の転載不可）'],
            ['normalizedTheme は英数スラッグ', '半角英数字とハイフンのみ（例: gen-ketsu）'],
            ['同じテーマは必ず同じスラッグ', '表記ゆれを防ぐため、既存スラッグ一覧を確認してから入力する'],
            ['重要度は入力不要', 'importanceは集計時に自動計算されるため、空欄でよい'],
          ].map(([title, desc], i) => (
            <div key={i} className="bg-white rounded-xl p-3 border border-red-100">
              <p className="text-sm font-semibold text-red-700">❌ {title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CSVフォーマット例 */}
      <section className="bg-white rounded-2xl border p-5 space-y-3">
        <h2 className="font-bold text-gray-800 text-lg">CSVフォーマット例</h2>
        <p className="text-xs text-gray-400">
          ファイル: <code className="bg-gray-100 px-1.5 py-0.5 rounded">src/data/raw/exam-34.csv</code>
        </p>
        <div className="overflow-x-auto">
          <pre className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-xs text-gray-600 font-mono leading-relaxed whitespace-pre">
{CSV_HEADER}
{CSV_SAMPLE_ROWS.join('\n')}
{`...（180行まで続く）`}</pre>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
          {[
            ['id', 'exam34-Q{番号3桁}'],
            ['examRound', '34（固定）'],
            ['year', '2026（固定）'],
            ['session', '共通 / はり師 / きゅう師'],
            ['sourceUrl', 'https://ahaki.or.jp/exam/archives/ (固定)'],
            ['sourceReliability', 'indexed_official（固定）'],
          ].map(([field, hint]) => (
            <div key={field} className="bg-gray-50 rounded-lg px-2.5 py-2 border border-gray-100">
              <p className="font-mono text-green-700">{field}</p>
              <p className="text-gray-400 mt-0.5">{hint}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 科目別想定問題番号範囲 */}
      <section className="bg-white rounded-2xl border p-5 space-y-3">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <h2 className="font-bold text-gray-800 text-lg">科目別 想定問題番号範囲</h2>
          <span className="text-xs bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-full border border-yellow-200">
            仮配分（実際と異なる場合あり）
          </span>
        </div>
        <p className="text-xs text-gray-400">
          実際の第34回の科目順序・配分が確認できたら修正してください。
          合計 {totalCount}問 / 目標180問。
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500 text-xs">
                <th className="py-2 pr-3 font-medium">科目</th>
                <th className="py-2 pr-3 font-medium">科目ID</th>
                <th className="py-2 pr-3 font-medium text-center">問題番号</th>
                <th className="py-2 font-medium text-right">想定問数</th>
              </tr>
            </thead>
            <tbody>
              {SUBJECT_RANGES.map((sr, i) => (
                <tr key={sr.id} className={`border-b border-gray-50 last:border-0 ${i % 2 === 0 ? '' : 'bg-gray-50/40'}`}>
                  <td className="py-2.5 pr-3 font-medium text-gray-800 text-sm">{sr.shortName}</td>
                  <td className="py-2.5 pr-3 font-mono text-xs text-green-700">{sr.id}</td>
                  <td className="py-2.5 pr-3 text-center">
                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                      問{sr.from}〜{sr.to}
                    </span>
                  </td>
                  <td className="py-2.5 text-right font-semibold text-gray-700">{sr.count}問</td>
                </tr>
              ))}
              <tr className="border-t-2 border-gray-200">
                <td colSpan={3} className="py-2.5 pr-3 font-bold text-gray-700 text-sm">合計</td>
                <td className="py-2.5 text-right font-bold text-green-700">{totalCount}問</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* normalizedTheme スラッグ参照表 */}
      <section className="bg-white rounded-2xl border p-5 space-y-3">
        <h2 className="font-bold text-gray-800 text-lg">normalizedTheme スラッグ参照表</h2>
        <p className="text-xs text-gray-500">
          既存テーマのスラッグ一覧。同じテーマには必ず同じスラッグを使う。
          新テーマの場合はローマ字読みをハイフン区切りで作成する。
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
                <th className="py-2 pr-4 font-medium">テーマ（日本語）</th>
                <th className="py-2 pr-4 font-medium">normalizedTheme（slug）</th>
                <th className="py-2 font-medium">科目</th>
              </tr>
            </thead>
            <tbody>
              {SLUG_EXAMPLES.map(ex => (
                <tr key={ex.slug} className="border-b border-gray-50 last:border-0">
                  <td className="py-2 pr-4 text-gray-700">{ex.ja}</td>
                  <td className="py-2 pr-4 font-mono text-green-700">{ex.slug}</td>
                  <td className="py-2 text-gray-400">{ex.subject}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-xs text-gray-500 space-y-1">
          <p className="font-semibold text-gray-600">新しいスラッグの命名ルール</p>
          <p>• ローマ字読みをハイフン区切りにする（例: 刺激量 → shigeki-ryo）</p>
          <p>• 英単語は使わない（日本語の読み優先）</p>
          <p>• 長すぎる場合は省略してOK（例: 弁証論治 → ben-sho-ron-chi）</p>
          <p>• 半角英数字とハイフンのみ使用（スペース・全角文字NG）</p>
        </div>
      </section>

      {/* studyPoint の書き方 */}
      <section className="bg-white rounded-2xl border p-5 space-y-3">
        <h2 className="font-bold text-gray-800 text-lg">studyPoint の書き方</h2>
        <div className="space-y-2">
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 text-red-500 text-lg">✗</span>
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex-1">
              <p className="text-xs text-red-600 font-semibold mb-1">NG例（問題文に近い表現）</p>
              <p className="text-xs text-gray-500">「足三里の主治として正しいのはどれか」の答えを覚える</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 text-green-500 text-lg">✓</span>
            <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 flex-1">
              <p className="text-xs text-green-700 font-semibold mb-1">OK例（自作の受験生向けガイド）</p>
              <p className="text-xs text-gray-600">百会・足三里・三陰交・合谷・太衝など主要穴の主治を優先暗記。</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="flex-shrink-0 text-green-500 text-lg">✓</span>
            <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 flex-1">
              <p className="text-xs text-green-700 font-semibold mb-1">OK例（複数問が同じテーマの場合）</p>
              <p className="text-xs text-gray-600">健康日本21（第三次）の数値目標（BMI・歩数・飲酒量等）を整理する。</p>
            </div>
          </div>
        </div>
      </section>

      {/* 入力チェック項目 */}
      <section className="bg-white rounded-2xl border p-5 space-y-4">
        <h2 className="font-bold text-gray-800 text-lg">自動チェック項目</h2>
        <p className="text-sm text-gray-500">
          入力後に <Link href="/admin/data-status" className="text-green-600 underline">/admin/data-status</Link>{' '}
          で以下の9項目が自動検証されます。すべて ✓ になるまで修正してください。
        </p>
        <div className="space-y-2">
          {[
            {
              item: '入力数 180問',
              rule: 'exam-34.csv のデータ行が180行あること',
              fix: '未入力の問題を追加する',
            },
            {
              item: '問題番号の欠番なし',
              rule: 'questionNumber が 1〜180 を連続して網羅していること',
              fix: '欠番になっている問題番号の行を追加する',
            },
            {
              item: '問題番号の重複なし',
              rule: 'questionNumber が 1〜180 で一意であること',
              fix: '同じ番号が2行以上ある場合は削除する',
            },
            {
              item: '科目ID が有効値',
              rule: 'subject が 14科目IDのいずれかであること（上記「科目別想定問題番号範囲」参照）',
              fix: '科目IDの typo を修正する。スペースや全角文字が混じっていないか確認する',
            },
            {
              item: 'テーマ未入力なし（normalizedTheme）',
              rule: 'normalizedTheme が空欄でないこと',
              fix: '上記「スラッグ参照表」を参考に半角英数スラッグを入力する',
            },
            {
              item: '学習ポイント未入力なし（studyPoint）',
              rule: 'studyPoint が空欄でないこと',
              fix: '受験生向けの一文を自作で入力する（問題文の転載不可）',
            },
            {
              item: '出題基準バージョン = 2020',
              rule: 'blueprintVersion が "2020" であること',
              fix: '誤って 2026 を入力した行を 2020 に修正する',
            },
            {
              item: '問題数体制 = 180',
              rule: 'questionCountMode が "180" であること',
              fix: '誤って 160 を入力した行を 180 に修正する（第34回は180問体制）',
            },
            {
              item: 'ソース信頼度が有効値',
              rule: 'sourceReliability が indexed_official / direct_official / official_answer_only / third_party_reference のいずれかであること',
              fix: '公式アーカイブ掲載なら indexed_official（推奨）',
            },
          ].map(({ item, rule, fix }, i) => (
            <div
              key={i}
              className="border border-gray-100 rounded-xl p-3.5 space-y-1.5"
            >
              <div className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-100 text-gray-500 text-xs font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <p className="font-semibold text-gray-800 text-sm">{item}</p>
              </div>
              <p className="text-xs text-gray-500 pl-7">{rule}</p>
              <p className="text-xs text-green-600 pl-7">修正方法: {fix}</p>
            </div>
          ))}
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
          チェックは <code className="bg-blue-100 px-1 rounded">npm run build</code> 実行時に反映されます。
          ビルド後に <Link href="/admin/data-status" className="underline">/admin/data-status</Link> を開いて結果を確認してください。
        </div>
      </section>

      {/* Next step */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/admin/data-status"
          className="flex-1 bg-green-600 text-white text-center px-5 py-3 rounded-xl font-semibold text-sm hover:bg-green-700 transition-colors"
        >
          入力後は進捗確認 →
        </Link>
        <Link
          href="/admin/import-guide"
          className="flex-1 bg-white text-gray-600 border text-center px-5 py-3 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors"
        >
          テーマCSV入力ガイド
        </Link>
      </div>
    </main>
  )
}
