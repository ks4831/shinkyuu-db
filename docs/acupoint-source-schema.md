# 経穴の出典管理（src/data/acupointSources.json）

経穴マスター（`src/data/acupoints.ts`、361穴）の項目ごとに、**どの資料で・どこまで確認できたか**を記録する。
マスター本体の型と画面表示は変えず、別ファイルで管理する。型と判定ロジックは `src/lib/acupointSources.ts`、検査は `npm run audit:data`。

作成：2026-10-09（JAPAN-SOURCE 05）。更新：2026-10-10（JAPAN-SOURCE 06：原文表記・履歴レコード・整合性検査を追加）。
照合の作業記録は repo の外（`shinkyuu-db-audit/2026-10-japan-source-05/`・`2026-10-japan-source-06/`）にある。

## 1. 根拠の優先順位

1. 日本の公式過去問・正答表（`official_exam`）
2. 該当回に適用される日本の国家試験出題基準（`exam_standard`）
3. 日本の標準教科書（`textbook`）
4. 日本の公的機関・専門職団体・学術資料（`jp_public`）
5. WHO などの国際資料（`international`）
6. 中国の国家標準・教科書（`cn_standard`）、古典（`classic`）

- **WHO_VERIFIED は JAPAN_VERIFIED ではない。** WHO の位置と一致していても、日本の資料で確認できるまでは日本基準で確認済みとしない。
- 第29〜34回の判断に、出題基準2026年版（第35回から適用）を遡って当てはめない。2026年版で確認した名称は「第35回以降の基準」として記録する。
- 中国の国家標準（GB/T）だけを根拠に、日本の取穴位置を変えない。

## 2. データ形式

```json
{
  "schemaVersion": 1,
  "sources": [ { "id": "WHO-2008", "title": "...", "sourceType": "international", "organization": "...", "url": "...", "edition": "...", "note": "..." } ],
  "records": [
    { "acupointId": "ki10", "fieldName": "location", "claim": "膝窩横紋上、半腱様筋腱の外縁",
      "currentValue": "膝窩横紋上、半腱様筋腱の外縁", "sourceId": "OFFICIAL-29-34", "sourcePage": "32-117",
      "verifiedAt": "2026-10-09", "verificationStatus": "JAPAN_VERIFIED", "coverage": "full",
      "notes": "問題文「膝窩横紋上で半腱様筋腱の外縁にあるのはどれか」→ 正答 陰谷" }
  ]
}
```

| 項目 | 内容 |
|---|---|
| `acupointId` | マスターの slug |
| `fieldName` | `name`・`reading`・`location`・`specialPoints`。位置と要穴属性は別々に記録する |
| `claim` | 確認した記述。`specialPoints` は分類1つ（ラベルと完全一致）ごとに1件 |
| `currentValue` | 確認した時点のマスターの値。マスターの値が変わると、そのレコードは総合判定に使われない（`audit:data` が WARN） |
| `sourceId` | `sources` の資料ID |
| `sourcePage` | 問題ID・PDFのページ番号など。**推測で書かない**（空は ERROR） |
| `sourceEdition` / `sourceURL` / `sourceTitle` / `sourceType` | `sources` 側に1回だけ書く（レコードは `sourceId` で参照） |
| `verifiedAt` | 確認日 |
| `verificationStatus` | 下の表 |
| `coverage` | `full`＝現在の記述全体、`partial`＝一部だけ、`related`＝現在の記述にない情報（裏づけには数えない） |
| `notes` | 何を確認したか。公式問題なら、問題文と正答のどこから言えるか |
| `sourceText`（任意） | 資料に書かれている表記を**原文のまま**残す。省略時は `claim` と同じ表記。`claim`（＝サイトの表示用の標準名）と資料の表記が違うときに使い、名称の `CONFLICT` では必須 |
| `supersededAt` / `supersededBy`（任意） | マスターの値を変えたために総合判定から外したレコード（**削除せず履歴として残す**）。変えた日付と、理由・後継レコード（台帳の ID など） |

### verificationStatus（レコード1件）

| 値 | 使える資料 | 意味 |
|---|---|---|
| `JAPAN_VERIFIED` | 日本の資料 | 資料が経穴名と記述を**直接**対応させている（例：問題文の部位 → 正答の経穴名） |
| `JAPAN_INFERRED` | 日本の資料 | 公式問題からの**推論**（要穴分類・骨度・選択肢の構成などの知識を介する）。JAPAN_VERIFIED には数えない |
| `WHO_VERIFIED` | 国際資料 | WHO の**主位置**と一致。代替位置（Remarks: Alternative location）との一致は WHO_VERIFIED にしない |
| `HISTORICAL_ONLY` | 古典 | 古典・歴史資料の記述としてだけ確認 |
| `CONFLICT` | どれでも | 資料と現在の記述が食い違う（表記の違いを含む） |

### 総合判定（項目ごと）

`getAcupointSourceStatus()`（`src/lib/acupointSources.ts`）が、次の順に決める。

1. 日本の資料に CONFLICT がある → `CONFLICT`
2. 日本の資料に JAPAN_VERIFIED（full）がある → `JAPAN_VERIFIED`
3. WHO に CONFLICT がある → `CONFLICT`
4. WHO_VERIFIED（full）がある → `WHO_VERIFIED`
5. HISTORICAL_ONLY がある → `HISTORICAL_ONLY`
6. それ以外 → `SOURCE_NEEDED`（一部だけの確認・推論だけ・レコードなし）
7. 値が未設定 → `NOT_APPLICABLE`

`SOURCE_NEEDED` を空欄や確認済みに自動変換しない。`specialPoints` が空配列の穴も `NOT_APPLICABLE` だが、
「特定穴ではない」という意味ではない（未入力）。

### 表示用の標準名と資料の表記

- マスターの `name` はサイトの表示用の標準名（日本の公式問題・出題基準の表記）。旧字体・異体字・旧表記は `aliases` に入れ、検索に使う（`src/lib/acupointSearch.ts`）。
- 資料の表記が標準名と違う場合は、そのレコードの `sourceText` に原文の表記を残し、`CONFLICT` とする（例：出題基準2026 の「攅竹」と標準名「攢竹」）。
- 標準名を変えたとき（例：2026-10-10 に 列缺 → 列欠）は、旧名のレコードを消さずに `supersededAt`・`supersededBy` を付け、新しい名前のレコードを追加する。

## 3. 現在の資料

| ID | 資料 | 種別 |
|---|---|---|
| `OFFICIAL-29-34` | 第29〜34回 公式問題・公式正答 | official_exam |
| `KIJUN-2026` | 国家試験出題基準 2026年版（あん摩マッサージ指圧師 経穴180穴・奇穴4穴一覧。印刷頁63＝PDF 69頁。はり師・きゅう師の部には経穴名の一覧がない） | exam_standard |
| `WHO-2008` | WHO Standard Acupuncture Point Locations in the Western Pacific Region | international |
| `TEXTBOOK-KEIRAKU-2` | 新版 経絡経穴概論 第2版 | textbook（**未閲覧。レコードなし**） |

## 4. 検査（`npm run audit:data`・`npm run test:sources`）

検査の本体は `scripts/lib/acupoint-source-check.mjs`。`test:sources` は、わざと壊したデータを渡して検出されることを確かめる。

| 区分 | 内容 |
|---|---|
| ERROR | 存在しない slug・資料／不正な判定値・coverage／確認日の形式・未来の日付／sourcePage が空／claim と currentValue の不一致 |
| ERROR | 日本の判定を日本以外の資料に付けた／WHO_VERIFIED を国際資料以外に付けた／HISTORICAL_ONLY を古典以外に付けた |
| ERROR | 公式問題：sourcePage に問題IDがない・過去問データにない問題ID／名称のレコードで、その問題の問題文・選択肢に資料の表記がない／位置・要穴の直接確認（JAPAN_VERIFIED・CONFLICT）で、問題が経穴を名指しせず出題データにも紐づかない（JAPAN_INFERRED は間接の根拠なので対象外） |
| ERROR | WHO の sourcePage のコード（例「PDF p.38（LU7）」）が経穴と違う |
| ERROR | 名称の CONFLICT に sourceText がない／資料の表記が違うのに JAPAN_VERIFIED・WHO_VERIFIED |
| ERROR | 有効なレコードの重複（経穴・項目・記述・資料・ページが同じ）／同じ資料で名称の判定が2件 |
| ERROR | 履歴レコード：supersededAt の形式・supersededBy が空・マスターの現在値と同じ記述を履歴にした |
| ERROR | 総合判定が日本の直接確認（full）なしに JAPAN_VERIFIED になった |
| WARN | 確認後にマスターの値が変わった（総合判定から外れる）／location に WHO 照合がない／名称の CONFLICT の資料表記がマスターの名称・別名にない（その表記で検索できない） |

## 5. 運用

- マスターの値を変えたら、その項目のレコードを確認し直す。旧値のレコードは消さずに `supersededAt`・`supersededBy` を付け、新しい値のレコードを追加する（何もしないと WARN が出て、総合判定から外れる）。
- 教科書を入手したら `textbook` のレコードを追加する。ページ番号は実物で確認したものだけを書く。
- 詳細情報（location）がある穴に WHO 照合レコードがないと WARN が出る。
- 画面には今のところ表示していない（表示する場合は WHO_VERIFIED と JAPAN_VERIFIED を区別して見せる）。
