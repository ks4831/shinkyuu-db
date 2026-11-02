/**
 * オリジナル模擬試験②の承認済みの問題データの基準値（取り込みとテストで共用）。
 * 値は JSON.stringify(問題の配列) の SHA-256。1文字でも変わると一致しない。
 * - 既存40問：2026-10-27 公開の40問（main f9495d6〜ace09f7 の original-mock-02.json の questions）
 * - 追加18問：bank_clinical_release_candidate.py（SHA-256 80c89f1c…e494）の to_app() の出力
 * この値を書き換えるのは、問題の変更が承認されたときだけ。
 */
export const FIRST40_QUESTIONS_SHA256 = 'f3fd339f066f92000195c4f2f57cb424c192ee7c2a4acc69ebfcf38d8da6b2a9'
export const ADDITIONS18_QUESTIONS_SHA256 = 'b210c28c82aeec19b1f0009b711eed9f60ca6af546dd30e1c43d549399d2ed05'
export const QUESTION_KEYS = ['id', 'workId', 'questionNumber', 'subject', 'field', 'questionText', 'choices', 'answerIndex', 'choiceNotes', 'point', 'sources']
