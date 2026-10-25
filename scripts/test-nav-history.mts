/**
 * 「← 戻る」ボタンのサイト内履歴（src/lib/navHistory.ts）の純粋関数テスト。
 * 実行：npm run test:nav
 */
import { applyVisit, backTarget, isInternalUrl, updateTopScroll, type NavEntry } from '../src/lib/navHistory'

let fail = 0
function check(label: string, cond: boolean, detail = '') {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${detail ? '  (' + detail + ')' : ''}`)
  if (!cond) fail++
}
const urls = (l: NavEntry[]) => l.map((e) => e.url).join(' > ')
const visit = (l: NavEntry[], ...us: string[]) => us.reduce((acc, u) => applyVisit(acc, u), l)

// 1. トップ → 一覧 → 詳細 → 戻る
let h = visit([], '/', '/themes/library', '/themes/gen-ketsu')
let t = backTarget(h)
check('トップ→一覧→詳細：戻る先は一覧', t.url === '/themes/library' && !t.fallback, t.url)
h = applyVisit(t.next, t.url, { pendingBack: t.url })
check('戻った後の履歴は トップ > 一覧', urls(h) === '/ > /themes/library', urls(h))
t = backTarget(h)
check('もう一度戻る：トップ', t.url === '/' && !t.fallback, t.url)
h = applyVisit(t.next, t.url, { pendingBack: t.url })
t = backTarget(h)
check('トップでさらに戻る：履歴なし＝トップ（外へは出ない）', t.url === '/' && t.fallback, t.url)

// 2. 検索結果 → 詳細 → 戻る（クエリの変化は置き換え）
h = visit([], '/themes', '/themes?q=%E8%82%A9', '/themes?q=%E8%82%A9&imp=S', '/themes/kata-kori')
check('検索語の変更は同じページとして置き換え', urls(h) === '/themes?q=%E8%82%A9&imp=S > /themes/kata-kori', urls(h))
t = backTarget(h)
check('詳細から戻る先は検索条件つきの検索ページ', t.url === '/themes?q=%E8%82%A9&imp=S', t.url)

// 3. 詳細ページを直接開いた場合
h = visit([], '/acupoints/st36')
t = backTarget(h)
check('直接開いた詳細：トップへ', t.url === '/' && t.fallback)
t = backTarget([])
check('履歴が空：トップへ', t.url === '/' && t.fallback)

// 4. 再読み込み・同じURLは積まない
h = visit([], '/quiz', '/quiz', '/quiz')
check('同じURLの再表示は1件', h.length === 1)

// 5. ブラウザの戻る（popstate）で表示されたら1つ戻す。進むは積む
h = visit([], '/', '/subjects', '/subjects/anatomy')
h = applyVisit(h, '/subjects', { viaPopState: true })
check('ブラウザの戻るで履歴も1つ戻る', urls(h) === '/ > /subjects', urls(h))
h = applyVisit(h, '/subjects/anatomy', { viaPopState: true })
check('ブラウザの進むは積む', urls(h) === '/ > /subjects > /subjects/anatomy', urls(h))

// 6. 外部URLは受け付けない
for (const bad of ['https://example.com/', '//evil.example/', '/\\evil', 'javascript:alert(1)', '']) {
  check(`外部・不正URLは記録しない：${JSON.stringify(bad)}`, !isInternalUrl(bad) && applyVisit([], bad).length === 0)
}
const tampered = [{ url: '/', scrollY: 0 }, { url: 'https://example.com', scrollY: 0 }, { url: '/x', scrollY: 0 }] as NavEntry[]
t = backTarget(tampered)
check('履歴に外部URLが混ざっても戻る先にしない', t.url === '/' && t.fallback, t.url)

// 7. 戻る操作を繰り返した場合（深い履歴を順に戻る）
h = visit([], '/', '/past-exams', '/past-exams?tab=subject', '/past-exams/subject/anatomy', '/themes/gen-ketsu')
const seen: string[] = []
for (let i = 0; i < 6; i++) {
  t = backTarget(h)
  seen.push(t.url)
  h = t.fallback ? applyVisit([], t.url) : applyVisit(t.next, t.url, { pendingBack: t.url })
}
check('繰り返し戻る：科目演習 → 過去問一覧 → トップ → トップ…', seen.join(' , ') === '/past-exams/subject/anatomy , /past-exams?tab=subject , / , / , / , /', seen.join(' , '))

// 8. スクロール位置
h = visit([], '/', '/themes')
h = updateTopScroll(h, '/themes', 1234.4)
h = applyVisit(h, '/themes/gen-ketsu')
t = backTarget(h)
check('戻る先のスクロール位置を保持', t.scrollY === 1234, String(t.scrollY))
check('別URLのスクロールでは更新しない', updateTopScroll(h, '/other', 99) === h)

// 9. 上限50件
h = visit([], ...Array.from({ length: 70 }, (_, i) => `/themes/t${i}`))
check('履歴は最大50件', h.length === 50 && h[49].url === '/themes/t69')

console.log(fail === 0 ? '\nALL PASS' : `\n${fail} FAILURE(S)`)
process.exit(fail === 0 ? 0 : 1)
