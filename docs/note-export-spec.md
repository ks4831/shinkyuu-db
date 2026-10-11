# note 向け共有データ（exports/note-content/v1）

note「治療家の道｜かず」の記事制作で使う、DB の読み取り専用の書き出しです。DB を学習データの正本とし、note 側で経穴の情報や正答を作り直さないようにします。

- 作成：`npm run export:note`（`scripts/export-note-content.mts`）
- 検査：`npm run test:export`（`scripts/test-note-export.mts`）
- 学習データ（`src/data`）を変えたら、書き出しを作り直して同じ commit に含めます。古いままだと `test:export` が失敗します。

## ファイル

| ファイル | 中身 |
|---|---|
| manifest.json | 版（schemaVersion）、元データの commit（sourceVersion）、件数、各ファイルの sha256 |
| topic-statistics.json | 科目14・テーマ142の出題数（第29〜34回・回別）、演習できる過去問数、予想問題数、DB の関連 URL |
| acupoint-learning.json | 経穴361穴。名称・位置・要穴分類ごとの確認状況、出題回、出題した問題ID |
| content-safety.json | 記事化のルール（R1〜R8）、確認状況の定義、注意が必要な問題・経穴、書き出していない情報 |
| recommended-articles.json | 記事候補10件と、裏づけになる出題数・既存の note 記事との重なり |
| link-map.json | DB の主なページ、note の公開済み記事、UTM の付け方 |

## 共通項目
stableId・title・subject・sourceVersion・verifiedStatus・sourceType・relatedDbUrl・updatedAt・publicationAllowed・warningNotes。

- `updatedAt` は、書き出し時刻ではなく commit の日時です（同じ commit から同じファイルができるようにするため）。
- `sourceVersion` は `shinkyuu-db@<commit>` です。学習データが commit と違うときは `+dirty` が付きます（`test:export` で失敗します）。

## 経穴の項目の扱い（publish）
| status | publish | 値 | 記事での書き方 |
|---|---|---|---|
| JAPAN_VERIFIED | allowed | あり | 日本の資料で確認済みとして書ける |
| WHO_VERIFIED | label_required | あり | 「WHO 基準では」と明記する。日本の教科書で確認済みと書かない |
| SOURCE_NEEDED・CONFLICT・NOT_APPLICABLE | excluded | null | 書かない（JAPAN_INFERRED だけの分類もここに入る） |

- `publicationAllowed` は、名称が JAPAN_VERIFIED のときだけ true です。
- 位置の文言が公式過去問と22文字以上同じ場合は、`location.pastExamTextOverlap` に問題IDが入ります。記事では文をそのまま使いません。
- 読み・memoryTip・examPoint・importance（手動評価）は、出典が未確認なので書き出していません。

## 書き出さないもの
公式過去問の問題文・選択肢・正答・解説、予想問題の本文、利用者の学習履歴・localStorage の内容。DB から note へは何も送りません。

## 版の上げ方
項目の意味を変えるとき、または削除するときは `v2` を作り、`v1` は残します。項目の追加だけなら `v1` のままにします。
