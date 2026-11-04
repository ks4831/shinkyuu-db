/**
 * オリジナル模擬試験②の承認済みの問題データの基準値（取り込みとテストで共用）。
 * 値は JSON.stringify(問題の配列) の SHA-256。1文字でも変わると一致しない。
 * - 既存40問：2026-10-27 公開の40問（main f9495d6〜ace09f7 の original-mock-02.json の questions）
 * - 追加18問：bank_clinical_release_candidate.py（SHA-256 80c89f1c…e494）の to_app() の出力（2026-11-02 公開、main 3c39f91）
 * - 追加10問：bank_clinical_68.py の to_app() の出力（第59〜68問）。2026-11-02 公開時は bank d7183b62…9971・問題 5ba301fa…f160。
 *   2026-11-03 om02-64（加齢黄斑変性）の解説・ポイント・出典だけを修正（日本では滲出型＝新生血管型が大部分・色覚は進行期に障害されうる：日本眼科学会）。問題文・選択肢・正答は不変。
 *   2026-11-03（100問化と同時）om02-62（サルコペニア）の「学習のポイント」と根拠資料だけを修正：AWGS2025（2025年11月公表、身体機能を診断基準から除外）と、
 *   日本肥満学会の「今後はAWGS2025を使用」の案内を注記。問題文・選択肢・正答・選択肢の解説は不変。修正前の追加10問は 57cf9e3d…7710。
 * - 追加12問：bank_basic_80.py の to_app() の出力（第69〜80問。基礎6科目×2問、2026-11-03 作成）
 * - 追加20問：bank_basic_100.py の to_app() の出力（第81〜100問。基礎6科目、2026-11-03 作成）
 * - 公開済み58問：第1〜58問をまとめた値（68問化の前後で変わらないことの確認用）
 * - 公開済み68問：第1〜68問をまとめた値（om02-62 の注記追加後の値。注記前＝main 49c6d6b の値は be2ed3b8…83d5）
 * - 公開済み80問：第1〜80問をまとめた値（100問化の前後で変わらないことの確認用。om02-62 の注記追加後の値。注記前＝main 49c6d6b の値は 19a42025…0a0a）
 * - 公開済み100問：第1〜100問をまとめた値（2026-11-04 最終品質検査の時点。試験前の固定の確認用）
 * この値を書き換えるのは、問題の変更が承認されたときだけ。
 */
export const FIRST40_QUESTIONS_SHA256 = 'f3fd339f066f92000195c4f2f57cb424c192ee7c2a4acc69ebfcf38d8da6b2a9'
export const ADDITIONS18_QUESTIONS_SHA256 = 'b210c28c82aeec19b1f0009b711eed9f60ca6af546dd30e1c43d549399d2ed05'
export const ADDITIONS10_QUESTIONS_SHA256 = 'dcc5d56148851b7a0a8be4144a6d871a7734e57d8bae1ab195c946d1db3dad0d'
export const ADDITIONS12_QUESTIONS_SHA256 = 'bb025efb8c0aea6186df837a0c9fcfb89719daf7331bf126f30151924df2e3fb'
export const ADDITIONS20_QUESTIONS_SHA256 = 'cad4f902ada6188cd6189c4a611225c0f63ccfe11ce55977cf489dd8ae9b5c05'
export const FIRST68_QUESTIONS_SHA256 = '9d208633459e4d80450ea26eb29d8bf585443c400aecab5b1f86fa9862688189'
export const FIRST80_QUESTIONS_SHA256 = '5f847ce8b33d2c6b1b1e10a7f722be0ef416b2902c23174abc212799ac391df0'
export const FIRST58_QUESTIONS_SHA256 = '7629fb1f9e48f8586bdd35fff8b59741aa9874ce02006f20b4693a4ac3c794d7'
export const ALL100_QUESTIONS_SHA256 = '69fd14814a429d43920d461233487ea0b3ac1f8541a853923fc48b4ff45a7bb1'
export const QUESTION_KEYS = ['id', 'workId', 'questionNumber', 'subject', 'field', 'questionText', 'choices', 'answerIndex', 'choiceNotes', 'point', 'sources']
