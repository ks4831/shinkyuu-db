export type RoadmapStep = {
  themeId?: string
  name: string
  note?: string
}

export type Confusion = {
  title: string
  desc: string
}

export type Prediction = {
  name: string
  reason: string
  likelihood: 'high' | 'medium' | 'low'
}

export type SubjectGuide = {
  subjectId: string
  overview: string
  studyHours: string
  roadmap: RoadmapStep[]
  commonConfusions: Confusion[]
  nextExamPredictions: Prediction[]
}

export const subjectGuides: SubjectGuide[] = [
  {
    subjectId: 'meridians-acupoints',
    overview: '経絡経穴概論は鍼灸国家試験の中で最も出題比率が高い科目の一つ。十二経脈の流注・表裏関係と、原穴・郄穴・募穴・五兪穴など特定穴の規則が核心。経穴の主治は6年連続出題で絶対に捨てられない。',
    studyHours: '60〜80時間',
    roadmap: [
      { themeId: 'juni-kei-myaku', name: '十二経脈', note: '流注の順序は最初に完全暗記' },
      { themeId: 'kei-myaku-ryuchu', name: '経脈の流注', note: '各経脈の走行と起始・終止を整理' },
      { themeId: 'kiki-hachi-myaku', name: '奇経八脈', note: '別称（陽の海・陰の海・血の海）を覚える' },
      { themeId: 'go-yu-ketsu', name: '五兪穴', note: '陰陽で五行配当が逆になる規則を確実に' },
      { themeId: 'gen-ketsu', name: '原穴', note: '陰経の原穴＝輸穴の規則と12穴の穴名' },
      { themeId: 'geki-ketsu', name: '郄穴', note: '十六郄穴（十二経＋奇経4穴）を表で整理' },
      { themeId: 'bo-ketsu', name: '募穴', note: '12募穴の穴名と帰属経脈の例外に注意' },
      { themeId: 'kei-ketsu-shuchi', name: '経穴の主治', note: '百会・足三里・三陰交・合谷を最優先' },
    ],
    commonConfusions: [
      {
        title: '陰経と陽経の五行配当が逆になる',
        desc: '陰経は「木（井）→火（榮）→土（輸）→金（経）→水（合）」、陽経は「金（井）→水（榮）→木（輸）→火（経）→土（合）」。逆に覚えると全問落とす。',
      },
      {
        title: '原穴と五兪穴の関係（陰経 vs 陽経）',
        desc: '陰経の原穴＝五兪穴の輸穴（同一穴）。陽経の原穴は輸穴とは別の穴。大腸経の原穴は合谷（輸穴の三間とは別）。',
      },
      {
        title: '募穴の帰属経脈と穴名を混同する',
        desc: '胃の募穴・中脘は任脈穴（胃経ではない）。肝の募穴は期門（章門は脾の募穴）。帰属経脈が直感と異なるものが出題される。',
      },
      {
        title: '督脈・任脈のみが独自の経穴を持つ',
        desc: '奇経八脈のうち、独自の経穴（経絡上に経穴を持つ）のは督脈と任脈だけ。他の6脈は十二経脈の穴位を流用する。',
      },
    ],
    nextExamPredictions: [
      { name: '経穴の主治（百会・足三里・三陰交・合谷）', reason: '6年連続出題、特定穴の主治パターンが深掘りされる傾向', likelihood: 'high' },
      { name: '五兪穴の応用（症状別選穴）', reason: '近年は陰陽の配当だけでなく難経の症状別適応が増加傾向', likelihood: 'high' },
      { name: '奇経八脈の走行・機能', reason: '第32回で未出で直近2回連続出題、パターンが継続する可能性が高い', likelihood: 'high' },
      { name: '募穴と背兪穴の組み合わせ（俞募配穴）', reason: '直近では俞穴との対比問題が増えている', likelihood: 'medium' },
    ],
  },
  {
    subjectId: 'oriental-overview',
    overview: '東洋医学概論は陰陽論・五行論・気血津液・蔵象など基礎理論を学ぶ科目。五行論と蔵象は毎年複数問出題される。弁証論治や経絡経穴の理解の土台になるため、最初に取り組むべき科目。',
    studyHours: '40〜60時間',
    roadmap: [
      { themeId: 'in-yo-ron', name: '陰陽論', note: '対立・互根・消長・転化の4関係から始める' },
      { themeId: 'go-gyo-ron', name: '五行論', note: '五臓×五色・五味・五季の対応表を丸暗記' },
      { themeId: 'ki-ketsu-shin-eki', name: '気血津液', note: '気の4種と営気・衛気の走行の違いを確認' },
      { themeId: 'zo-sho', name: '蔵象', note: '五臓の「主る」機能を一臓ずつ固める' },
      { themeId: 'roku-in', name: '六淫（外因）', note: '六邪の性質と侵す臓腑を対応付けて覚える' },
      { themeId: 'shichi-jo', name: '七情（内因）', note: '七情と五臓の対応（怒→肝・思→脾等）' },
      { themeId: 'toyo-rekishi', name: '東洋医学の歴史', note: '主要医学書と医家のセットを最後に確認' },
    ],
    commonConfusions: [
      {
        title: '相乗と相侮の方向性',
        desc: '相乗は相克と同方向の「過剰な克」。相侮（侮り）は相克の逆方向。「乗（じょう）は跨がる→強い方向へ」「侮（ぶ）は侮る→逆らう」で覚える。',
      },
      {
        title: '脾の季節は長夏（土用）',
        desc: '脾の五季配当は「夏」ではなく「長夏（土用）」。五行・土行に対応する季節は梅雨から夏の終わりにかけての長夏。',
      },
      {
        title: '七情と五臓の対応（悲と憂）',
        desc: '悲（ひ）は肺に属する。憂（ゆう）も肺に属する。喜は心、怒は肝、思は脾、恐は腎、驚は腎（または心）に属する。',
      },
      {
        title: '営気は脈中、衛気は脈外を行く',
        desc: '営気は脈管の中（脈中）を流れ栄養を届ける。衛気は脈管の外（脈外）を流れ体表を防御する。逆にしないこと。',
      },
    ],
    nextExamPredictions: [
      { name: '五行論（相生・相克・対応表）', reason: '6年連続出題で最も安定した出題テーマ', likelihood: 'high' },
      { name: '蔵象（五臓の機能と表裏関係）', reason: '腎の蔵精・主水・納気など機能問題が近年増加', likelihood: 'high' },
      { name: '七情と五臓への影響', reason: '第34回で出題、第33回でも出題の継続傾向', likelihood: 'medium' },
      { name: '六淫の性質と侵す部位', reason: '未出年度が増えると復活する可能性がある', likelihood: 'medium' },
    ],
  },
  {
    subjectId: 'hygiene',
    overview: '衛生学・公衆衛生学は健康政策・感染症・生活習慣病の3本柱。健康日本21と生活習慣病は6年連続出題。数値（腹囲・診断基準・届出期限）の正確な暗記が得点を左右する。',
    studyHours: '30〜40時間',
    roadmap: [
      { themeId: 'seikatsu-shukan-byo', name: '生活習慣病', note: 'メタボ診断基準の数値から始める' },
      { themeId: 'kenko-nihon-21', name: '健康日本21', note: '各次の期間と第三次の目標を整理' },
      { themeId: 'kansen-sho', name: '感染症', note: '1〜5類の分類と届出期限の表を作る' },
    ],
    commonConfusions: [
      {
        title: 'メタボの腹囲基準（男女で逆）',
        desc: '男性85cm以上、女性90cm以上（女性の方が大きい）。直感と逆なので注意。診断には腹囲が必須で、さらに血圧・血糖・脂質から2項目以上。',
      },
      {
        title: '健康日本21の各次の期間',
        desc: '第一次（2000-2012）・第二次（2013-2023）・第三次（2024-2035年）。第三次は2023年ではなく2024年開始。第二次の最終年が出題されやすい。',
      },
      {
        title: '感染症の分類（結核は2類）',
        desc: '結核は2類感染症（「直ちに届出」の1類ではない）。新型コロナは2023年5月から5類に変更。性感染症（梅毒・淋菌）は5類定点把握。',
      },
    ],
    nextExamPredictions: [
      { name: '健康日本21（第三次の内容）', reason: '6年連続出題、第三次の新目標が深掘りされる可能性', likelihood: 'high' },
      { name: '生活習慣病（メタボ診断基準の数値）', reason: '6年連続出題、数値問題は継続して出題される', likelihood: 'high' },
      { name: '感染症法の最新改正内容', reason: 'COVID-19の5類移行後の法的位置づけが問われやすい', likelihood: 'medium' },
    ],
  },
  {
    subjectId: 'anatomy',
    overview: '解剖学は筋の起始停止が6年連続出題の最重要テーマ。脳神経12対の機能分類と関節の構造も頻出。経穴の位置と解剖学的知識を連動して学ぶと相乗効果がある。',
    studyHours: '50〜70時間',
    roadmap: [
      { themeId: 'kansetsu-kozo', name: '関節の構造', note: '関節の種類（蝶番・球・車軸等）から始める' },
      { themeId: 'kin-kishi-teishi', name: '筋の起始停止', note: '上肢→下肢→体幹の順に整理する' },
      { themeId: 'no-shinkei', name: '脳神経', note: '番号・名称・機能種別をセットで覚える' },
    ],
    commonConfusions: [
      {
        title: '起始と停止を逆に覚える',
        desc: '起始は近位（体に近い方）、停止は遠位（末端に近い方）が基本。三角筋は肩甲棘・肩峰・鎖骨外側が起始、三角筋粗面が停止。',
      },
      {
        title: '大腿四頭筋の起始（直筋のみ異なる）',
        desc: '大腿四頭筋のうち大腿直筋のみ腸骨（前下腸骨棘・寛骨臼上縁）に起始する。他の3頭（外側広筋・内側広筋・中間広筋）は大腿骨に起始。',
      },
      {
        title: '脳神経の機能種別（感覚・運動・混合）',
        desc: '感覚性のみ：Ⅰ嗅・Ⅱ視・Ⅷ内耳（「嗅視聴は感覚のみ」）。混合性：Ⅴ三叉・Ⅶ顔面・Ⅸ舌咽・Ⅹ迷走。副交感を含む4本：Ⅲ・Ⅶ・Ⅸ・Ⅹ（3790）。',
      },
    ],
    nextExamPredictions: [
      { name: '筋の起始停止（上肢・下肢の主要筋）', reason: '6年連続出題、起始と停止の詳細が深掘りされる', likelihood: 'high' },
      { name: '脳神経の機能分類と副交感神経', reason: '第33回で未出だったため復活の可能性', likelihood: 'high' },
      { name: '関節の種類と靭帯', reason: '直近では膝関節・肩関節の詳細が問われやすい', likelihood: 'medium' },
    ],
  },
  {
    subjectId: 'physiology',
    overview: '生理学は自律神経の臓器作用が最頻出。交感神経と副交感神経を対比表で完全に覚えることが合格への最短ルート。循環機能の刺激伝導系も狙われやすい。',
    studyHours: '25〜35時間',
    roadmap: [
      { themeId: 'jiritsu-shinkei', name: '自律神経', note: '交感・副交感の臓器作用を対比表で覚える' },
      { themeId: 'junkan-kino', name: '循環機能', note: '刺激伝導系の順序と体・肺循環の流れ' },
    ],
    commonConfusions: [
      {
        title: '膀胱の自律神経支配（排尿と蓄尿で逆）',
        desc: '排尿時は副交感神経優位（排尿筋収縮・内括約筋弛緩）。蓄尿時は交感神経優位（排尿筋弛緩・内括約筋収縮）。「副交感＝排尿」と覚える。',
      },
      {
        title: '血管収縮は交感神経だが骨格筋血管は例外',
        desc: '交感神経は一般に血管を収縮させる（α1受容体）が、骨格筋の血管はβ2受容体があり交感神経で拡張する。試験では「収縮が原則、骨格筋は例外」として問われる。',
      },
    ],
    nextExamPredictions: [
      { name: '自律神経（各臓器への作用比較）', reason: '5年連続出題、臓器ごとの詳細な作用が問われ続ける', likelihood: 'high' },
      { name: '循環機能（刺激伝導系）', reason: 'アドレナリン受容体の詳細が近年増加傾向', likelihood: 'medium' },
    ],
  },
  {
    subjectId: 'regulations',
    overview: '関係法規はあはき法を中心に法的規定を学ぶ科目。免許申請先・施術所届出の期限と届出先・広告できる事項の暗記が得点の核心。法改正のチェックも毎年必須。',
    studyHours: '15〜20時間',
    roadmap: [
      { themeId: 'kanke-hokki', name: 'あはき法（全般）', note: '業務独占→免許→施術所→広告の順で体系化' },
    ],
    commonConfusions: [
      {
        title: '免許申請先と施術所届出先の違い',
        desc: '免許の申請先は「厚生労働大臣」（都道府県知事ではない）。施術所の開設届出先は「都道府県知事（保健所経由）」。この逆は最も出題される誤答パターン。',
      },
      {
        title: '施術所届出の期限は10日以内',
        desc: '施術所を開設したときは開設後「10日以内」に届け出る。7日でも14日でもない。「10日」という数字が問われやすい。',
      },
    ],
    nextExamPredictions: [
      { name: '施術所の届出・管理規定', reason: '6年連続出題、開設届出の詳細規定が問われる', likelihood: 'high' },
      { name: '広告できる事項（限定列挙）', reason: 'SNS広告などの新しい形式との関係が問われやすい', likelihood: 'medium' },
    ],
  },
  {
    subjectId: 'acupuncture-theory',
    overview: 'はり理論はリスク管理と刺激量の2本柱。気胸・折鍼・感染などの副作用と対応は臨床問題の頻出テーマ。刺激量の構成要素（太さ・深度・時間）と補瀉の原則も重要。',
    studyHours: '20〜25時間',
    roadmap: [
      { themeId: 'hari-risk-kanri', name: '鍼のリスク管理', note: '気胸・折鍼・感染の原因・予防・対応を整理' },
      { themeId: 'hari-shigeki-ryo', name: '鍼の刺激量', note: '構成要素と補瀉の種類（迎随・呼吸・開闔）' },
    ],
    commonConfusions: [
      {
        title: '気胸は遅発性がある',
        desc: '鍼による気胸は即座に症状が出ないことがある（遅発性気胸）。施術後数時間後に呼吸困難が発症することも。呼吸困難が生じたら即座に医療機関へ。',
      },
      {
        title: '内出血の原因は主に静脈・毛細血管',
        desc: '刺鍼による内出血は動脈損傷よりも静脈・毛細血管損傷が多い。動脈を傷つけた場合は大量出血となり別の対応が必要。',
      },
    ],
    nextExamPredictions: [
      { name: '鍼のリスク管理（副作用と対応）', reason: '5年連続出題、気胸・感染の詳細が深掘りされる', likelihood: 'high' },
      { name: '補瀉法の種類と原則', reason: '刺激量より深い補瀉の概念が近年問われやすい', likelihood: 'medium' },
    ],
  },
  {
    subjectId: 'moxibustion-theory',
    overview: 'きゅう理論は施灸法の種類・禁灸部位・熱傷の処置が中心。はり理論と並行して学ぶと効率的。無瘢痕灸・有瘢痕灸の特徴と施灸量の調節も頻出。',
    studyHours: '10〜15時間',
    roadmap: [
      { themeId: 'kyu-fukusayo', name: '灸の副作用', note: '熱傷の深度（Ⅰ〜Ⅲ度）と処置・禁灸部位を整理' },
    ],
    commonConfusions: [
      {
        title: '熱傷の深度と処置の対応',
        desc: 'Ⅰ度：発赤（冷却のみ）、Ⅱ度：水疱（清潔に保ち医療機関へ）、Ⅲ度：壊死（壊死部は除去、植皮が必要なこともある）。深度が上がるほど重篤。',
      },
    ],
    nextExamPredictions: [
      { name: '灸の副作用と禁灸部位', reason: '不出年度に復活する傾向があり、第35回は注意が必要', likelihood: 'medium' },
      { name: '施灸法の種類（無瘢痕・有瘢痕）', reason: '灸の種類と適応の比較問題が増加傾向', likelihood: 'medium' },
    ],
  },
  {
    subjectId: 'oriental-clinical',
    overview: '東洋医学臨床論は弁証論治（八綱弁証）が核心。虚実・表裏・寒熱の鑑別は毎年出題。経絡病証は十二経脈の知識と連動する。臨床問題の土台となる重要科目。',
    studyHours: '30〜40時間',
    roadmap: [
      { themeId: 'ben-sho-ron-chi', name: '弁証論治', note: '八綱弁証の各証の症候から始める' },
      { themeId: 'kei-myaku-byo-sho', name: '経絡病証', note: '是動病・所生病の概念と主要経脈の病証' },
    ],
    commonConfusions: [
      {
        title: '虚証と実証の症候を逆にする',
        desc: '虚証は「正気の不足」（舌淡・脈細弱・倦怠感）、実証は「邪気の亢盛」（舌紅・脈弦数・充実した痛み）。「虚＝足りない、実＝過剰」で覚える。',
      },
      {
        title: '是動病と所生病の発生機序',
        desc: '是動病は経脈の変動による症状（経脈自体の問題）。所生病は臓腑の機能異常による症状（臓腑が「所生」する病）。「是動＝経脈が動じる」で区別。',
      },
    ],
    nextExamPredictions: [
      { name: '弁証論治（八綱弁証の鑑別）', reason: '6年連続出題、治則（汗法・下法・清法等）への展開も増加', likelihood: 'high' },
      { name: '経絡病証（是動病・所生病）', reason: '第34回で未出だったため第35回で出題の可能性が高い', likelihood: 'high' },
    ],
  },
  {
    subjectId: 'clinical-general',
    overview: '臨床医学総論からは免疫学が主な収録テーマ。自然免疫と獲得免疫の担当細胞の違いとアレルギーⅠ型（IgE・即時型）が頻出。感染症と連動して学ぶと効率的。',
    studyHours: '10〜15時間',
    roadmap: [
      { themeId: 'menekigaku', name: '免疫学', note: 'アレルギー4型の分類と代表疾患から始める' },
    ],
    commonConfusions: [
      {
        title: 'アレルギーⅠ型とⅣ型の違い',
        desc: 'Ⅰ型（即時型）はIgE抗体が関与、肥満細胞・好塩基球からヒスタミン放出（花粉症・アナフィラキシー）。Ⅳ型（遅延型）はT細胞性免疫、接触性皮膚炎・ツベルクリン反応。',
      },
    ],
    nextExamPredictions: [
      { name: '免疫学（アレルギー分類と自己免疫）', reason: '近年SLEなど自己免疫疾患の詳細が問われやすい', likelihood: 'medium' },
    ],
  },
]

export function getSubjectGuide(subjectId: string): SubjectGuide | undefined {
  return subjectGuides.find(g => g.subjectId === subjectId)
}
