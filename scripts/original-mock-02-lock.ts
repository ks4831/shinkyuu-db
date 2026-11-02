/**
 * オリジナル模擬試験②の承認済みの問題データの基準値（取り込みとテストで共用）。
 * 値は JSON.stringify(問題の配列) の SHA-256。1文字でも変わると一致しない。
 * - 既存40問：2026-10-27 公開の40問（main f9495d6〜ace09f7 の original-mock-02.json の questions）
 * - 追加18問：bank_clinical_release_candidate.py（SHA-256 80c89f1c…e494）の to_app() の出力（2026-11-02 公開、main 3c39f91）
 * - 追加10問：bank_clinical_68.py（SHA-256 d7183b62…9971）の to_app() の出力（第59〜68問）
 * - 公開済み58問：第1〜58問をまとめた値（68問化の前後で変わらないことの確認用）
 * この値を書き換えるのは、問題の変更が承認されたときだけ。
 */
export const FIRST40_QUESTIONS_SHA256 = 'f3fd339f066f92000195c4f2f57cb424c192ee7c2a4acc69ebfcf38d8da6b2a9'
export const ADDITIONS18_QUESTIONS_SHA256 = 'b210c28c82aeec19b1f0009b711eed9f60ca6af546dd30e1c43d549399d2ed05'
export const ADDITIONS10_QUESTIONS_SHA256 = '5ba301fa2fc870d861425e557b5960b6d3fce3f15ac6fba166be2d406534f160'
export const FIRST58_QUESTIONS_SHA256 = '7629fb1f9e48f8586bdd35fff8b59741aa9874ce02006f20b4693a4ac3c794d7'
export const QUESTION_KEYS = ['id', 'workId', 'questionNumber', 'subject', 'field', 'questionText', 'choices', 'answerIndex', 'choiceNotes', 'point', 'sources']
