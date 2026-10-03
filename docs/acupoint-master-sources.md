# 経穴マスタの出典と収録方針（src/data/acupoints.ts）

## 1. 標準経穴（kind: 'standard'）の定義

- 標準経穴＝WHO標準経穴 **361穴**（十四経脈の経穴）。奇穴は含まない（奇穴は別管理・Phase D 予定）。
- 基準資料：*WHO Standard Acupuncture Point Locations in the Western Pacific Region*（WHO WPRO, 2008／2009改訂版, ISBN 978 92 9061 248 7）。
  本文に「the locations of 361 acupuncture points」とある。
- 経脈ごとの穴数（同資料から機械的に抽出し、各経脈で1から連番であることを確認）：
  LU11・LI20・ST45・SP21・HT9・SI19・BL67・KI27・PC9・TE23・GB44・LR14・GV28・CV24 ＝ 361。
  督脈は GV1〜28 で、印堂は督脈に含まれない。
  この表は `scripts/audit-data.mjs` の `WHO_POINT_COUNTS` に持ち、コードの範囲を監査している。

## 2. 項目ごとの正本

| 項目 | 正本 | 備考 |
|---|---|---|
| `code`（WHOコード） | WHO 2008 | `slug = code.toLowerCase()`。既存の slug・URL は変更しない |
| `meridian` / `meridianName` | WHO 2008（コード接頭辞） | `meridianName` は `MERIDIANS` から決まる |
| `name`（日本語の正規名） | 日本語資料（下記） | WHO原本の漢字（繁体字・簡体字）は正本にしない。PDFの文字抽出で欠字も確認されている（例：ST17・BL38） |
| `reading` | 日本語資料 | **AIの記憶や推測では埋めない**。確認できない穴は未設定 |
| `aliases` | 公式問題文の表記差・WHOの繁体字・旧字体 | 検索と出題照合用。正規名を検索の都合で変えない |
| `location` | 未定（Phase C） | 書籍やWHOの位置記述を大量転載しない。事実情報をもとに独自の表現で書き、出典を記録する |
| `specialPoints` | 未定（Phase C） | 語彙の正規化を含めて Phase C で見直す。未設定は「特定穴ではない」という意味ではない |
| `importance` | 手動評価（根拠は未文書化） | 初回作成時（commit 150b9f7）に手で付けた値。新規追加の穴には付けない |
| `examPoint` / `memoryTip` | 手動作成 | 実際の出題データと食い違う例がある（陽陵泉）。新規追加の穴には付けない（AIで作文しない） |

- 必須項目は `slug, code, name, kind, meridian, meridianName` だけ。それ以外は任意で、未確認なら**未設定**にする
  （空文字で「入力済み」に見せない。`audit:data` が検査する）。
- UIは任意項目がない場合、その欄やバッジを表示しない。

## 3. 収録状況

| 時点 | 標準経穴 | 内容 |
|---|---|---|
| 初版（2026-09-07, 150b9f7） | 146 | 手動で選定（選定基準の記録なし）。全項目入力済み |
| Phase A（2026-10-03） | 195 | 第29〜34回で出題（direct/required）されていた標準経穴49穴を追加 |
| Phase B（予定） | 361 | 残り166穴（誤答肢にだけ登場した77穴＋過去問に登場しない89穴） |
| Phase C（予定） | — | location・specialPoints・examPoint の精査、読みの補完 |
| Phase D（予定） | — | 奇穴（出題済み7穴：十七椎・子宮・八風・鶴頂・痞根・胆嚢点・患門）を別ファイルで管理 |

### Phase A で追加した49穴の出典の状態

| 項目 | 状態 |
|---|---|
| `code` / `meridian` | WHO 2008 で確認（49/49） |
| `name` | 第29〜34回の公式問題本文に同じ表記があることを確認（49/49） |
| `reading` | **信頼できる日本語資料で確認できなかったため未登録（0/49）** |
| `location` / `specialPoints` / `importance` / `memoryTip` / `examPoint` / `region` | 未登録（根拠のある資料で段階的に追加する） |

対象の49穴：
LI17 天鼎・LI19 禾髎・ST3 巨髎・ST7 下関・ST13 気戸・ST21 梁門・ST31 髀関・ST32 伏兎・ST43 陥谷・
SP7 漏谷・SP12 衝門・SP16 腹哀・SP18 天渓・SI12 秉風・SI13 曲垣・SI16 天窓・SI18 顴髎・
BL9 玉枕・BL26 関元兪・BL33 中髎・BL41 附分・BL45 譩譆・BL47 魂門・BL51 肓門・BL52 志室・BL53 胞肓・BL66 足通谷・
KI8 交信・KI19 陰都・KI20 腹通谷・KI27 兪府・PC2 天泉・TE1 関衝・TE2 液門・TE12 消濼・TE16 天牖・TE18 瘈脈・
GB9 天衝・GB23 輒筋・GB35 陽交・GB38 陽輔・LR9 陰包・GV10 霊台・GV12 身柱・GV13 陶道・GV15 瘂門・GV22 顖会・CV14 巨闕・CV18 玉堂

- 読みは、日本語資料（例：『経穴インパクト』、WHO標準経穴部位の日本語公式版、教科書『経絡経穴概論』）を入手したら
  **49穴をまとめて照合してから登録する**。AIの記憶だけで補完しない。
- 記入用の表（code・name・reading・source・page）は repo の外で管理している（phaseA-readings-template.csv）。

## 4. 出題データとの関係

- `src/data/acupointOccurrences.json` は、マスタ収録穴を `slug` で、マスタ外の穴を `name` で参照する。
- Phase A では、49穴への参照110件を監査済みの対応表（name → WHOコード → slug）で `slug` 参照に置き換えた。
  questionId・role・evidence は1件も変わっていない（移行前後の749件を照合済み）。49名は `outsideMaster` から削除した。
- マスタ収録穴を `name` で参照したり、`outsideMaster` にマスタ収録穴が残ったりすると `audit:data` が ERROR を出す。
