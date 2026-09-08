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
    overview: '臨床医学総論は診断学・治療学・生体防御の総論。バイタルサインとフィジカルアセスメント、臨床検査・腫瘍マーカー、一次救命処置、免疫が柱で、いずれも臨床医学各論や鍼灸臨床の土台になる。数値の正常範囲と検査の意味を押さえる。',
    studyHours: '15〜20時間',
    roadmap: [
      { themeId: 'cg-vital-physical', name: 'バイタルサインとフィジカルアセスメント', note: '成人の正常値、心音聴診部位、視触打聴診の基本から始める' },
      { themeId: 'cg-kensa-shindan', name: '臨床検査・画像診断・腫瘍マーカー', note: '臓器別マーカー、被曝の有無、心電図のST変化' },
      { themeId: 'cg-kyukyu-bls', name: '救急医療・一次救命処置・ショック', note: '胸骨圧迫の速さと深さ、ショックの分類' },
      { themeId: 'menekigaku', name: '免疫学', note: 'アレルギー4型の分類と代表疾患' },
      { themeId: 'cg-chiryo-gaku', name: '治療学の基礎', note: '原因療法・対症療法・緩和ケアの考え方を最後に確認' },
    ],
    commonConfusions: [
      {
        title: 'アレルギーⅠ型とⅣ型の違い',
        desc: 'Ⅰ型（即時型）はIgE抗体が関与、肥満細胞・好塩基球からヒスタミン放出（花粉症・アナフィラキシー）。Ⅳ型（遅延型）はT細胞性免疫、接触性皮膚炎・ツベルクリン反応。',
      },
      {
        title: '胸骨圧迫の速さと深さ',
        desc: '速さは100〜120回/分、深さは約5cm（6cmを超えない）、圧迫30：換気2。AEDは一般市民・施術者も使用できる。',
      },
      {
        title: '被曝のある検査・ない検査',
        desc: '被曝なし＝MRI・超音波。被曝あり＝単純X線・CT・PET・シンチグラフィ（RIを使用）。',
      },
    ],
    nextExamPredictions: [
      { name: '免疫学（アレルギー分類と自己免疫）', reason: '近年SLEなど自己免疫疾患の詳細が問われやすい', likelihood: 'medium' },
      { name: 'バイタルサインとフィジカルアセスメント', reason: '心音聴診部位・声音振盪など診察手技が継続して出題', likelihood: 'medium' },
      { name: '臨床検査・腫瘍マーカー', reason: '臓器別マーカーの対応と被曝の有無は毎年形を変えて出題', likelihood: 'medium' },
    ],
  },
  {
    subjectId: 'medical-overview',
    overview: '医療概論は医療保障制度・医の倫理・チーム医療の3本柱。第29〜34回で毎年、医療保険／国民医療費と医師患者関係が問われている。数値や制度名の正確な暗記よりも、制度の趣旨と関係の型（IC・パターナリズム）を理解することが得点につながる。',
    studyHours: '15〜20時間',
    roadmap: [
      { themeId: 'mo-iryo-hoken-seido', name: '医療保険制度と国民医療費', note: '被用者保険と国保の対象者、国民医療費に含まれない費用から始める' },
      { themeId: 'mo-kaigo-hoken', name: '介護保険制度と社会保障', note: '保険者は市町村。第1号・第2号被保険者の年齢区分を固める' },
      { themeId: 'mo-iryo-teikyo', name: '医療提供体制（医療法・医療計画）', note: '5疾病5事業と病院の機能分化' },
      { themeId: 'mo-informed-consent', name: 'インフォームド・コンセントと患者中心の医療', note: 'ICとパターナリズムの対立関係を理解' },
      { themeId: 'mo-i-no-rinri', name: '医の倫理・生命倫理', note: '主要宣言の対応（ヘルシンキ・ジュネーブ・リスボン）を最後に暗記' },
      { themeId: 'mo-team-iryo', name: 'チーム医療', note: '「対等な連携・情報共有」が望ましい姿という原則で解ける' },
    ],
    commonConfusions: [
      {
        title: '国民医療費に「含まれない」もの',
        desc: '正常分娩費・健康診断費・予防接種費・差額ベッド代は含まれない。帝王切開など保険診療となる医療行為は含まれる。「予防」目的の費用は原則含まれないと覚える。',
      },
      {
        title: '介護保険の保険者は市町村',
        desc: '保険者は市町村・特別区であり、国・都道府県ではない。第1号被保険者は65歳以上、第2号被保険者は40〜64歳の医療保険加入者。',
      },
      {
        title: 'インフォームド・コンセントとパターナリズム',
        desc: 'ICは患者の自己決定権の尊重に基づく。パターナリズム（父権主義）は医療者が患者に代わって決定する態度で、ICと対立する概念。混同しない。',
      },
      {
        title: '主要宣言の対応',
        desc: 'ヘルシンキ宣言＝医学研究の倫理、ジュネーブ宣言＝医師の職業倫理（現代版ヒポクラテスの誓い）、リスボン宣言＝患者の権利、アルマ・アタ宣言＝プライマリヘルスケア。',
      },
    ],
    nextExamPredictions: [
      { name: '医療保険制度・国民医療費', reason: '6年連続出題で最も安定したテーマ。数値と含まれる／含まれない費用の判別が問われる', likelihood: 'high' },
      { name: 'インフォームド・コンセントと医師患者関係', reason: '4回出題。パターナリズム・セカンドオピニオン・患者役割との対比が続く見込み', likelihood: 'high' },
      { name: '介護保険制度', reason: '保険者・被保険者・ケアマネジメントの基本は繰り返し出題', likelihood: 'medium' },
      { name: '医の倫理（国際宣言）', reason: '第33・34回で連続出題、宣言名と内容の対応が狙われる', likelihood: 'medium' },
    ],
  },
  {
    subjectId: 'pathology',
    overview: '病理学概論は疾患の成り立ちを学ぶ総論科目。循環障害（梗塞・塞栓・浮腫）は6年でほぼ毎回、炎症・腫瘍がそれに次ぐ。個々の疾患名よりも「型で分類して覚える」ことが得点の鍵で、臨床医学各論の土台にもなる。',
    studyHours: '20〜25時間',
    roadmap: [
      { themeId: 'pa-junkan-shogai', name: '循環障害', note: '貧血性梗塞と出血性梗塞、塞栓の種類、浮腫の4機序から始める' },
      { themeId: 'pa-ensho', name: '炎症', note: '急性（好中球）・慢性（リンパ球等）・肉芽腫性炎（結核・サルコイド・ハンセン）' },
      { themeId: 'pa-saibo-shogai', name: '細胞傷害・変性・壊死', note: '壊死の型と好発臓器、アポトーシスとの違い' },
      { themeId: 'pa-shuyo', name: '腫瘍', note: '良性・悪性の区別、前癌病変、TNM分類、がんとウイルス' },
      { themeId: 'pa-kansen-meneki', name: '感染症・免疫・アレルギー', note: '感染症法の分類、一次応答IgM・二次応答IgG、Ⅳ型アレルギー' },
      { themeId: 'pa-iden', name: '遺伝性疾患と遺伝の基礎', note: '遺伝形式ごとの代表疾患を整理' },
      { themeId: 'pa-taisha-ijo', name: '代謝異常・物質沈着', note: '沈着物と疾患の対応（尿酸→痛風など）' },
      { themeId: 'pa-shippei-keika', name: '疾病の経過・転帰と疾患の性差', note: '前駆期の不定愁訴、4Fなどを最後に確認' },
    ],
    commonConfusions: [
      {
        title: '貧血性梗塞と出血性梗塞',
        desc: '貧血性（白色）梗塞は終動脈性の臓器＝心臓・腎臓・脾臓。出血性（赤色）梗塞は二重血行・側副血行が豊富な臓器＝肺・腸。',
      },
      {
        title: '壊死の型と好発臓器',
        desc: '凝固壊死＝心筋梗塞、融解壊死＝脳、乾酪壊死＝結核、脂肪壊死＝急性膵炎。アポトーシスはプログラム細胞死で炎症を伴わない。',
      },
      {
        title: '肉芽腫性炎の代表疾患',
        desc: '類上皮細胞・ラングハンス巨細胞からなる肉芽腫をつくるのは結核・サルコイドーシス・ハンセン病。化膿性炎（好中球主体）とは異なる。',
      },
      {
        title: '一次免疫応答と二次免疫応答',
        desc: '初感染で最初に血中で上昇するのはIgM（一次応答）。再感染で速く大量に産生されるのはIgG（二次応答）。IgAは粘膜、IgEはアレルギー。',
      },
    ],
    nextExamPredictions: [
      { name: '循環障害（梗塞・塞栓・浮腫・DIC）', reason: '6年でほぼ毎回出題される最重要テーマ。浮腫の4機序と塞栓の種類が繰り返される', likelihood: 'high' },
      { name: '炎症の組織学的分類', reason: '線維素性炎・化膿性炎・肉芽腫性炎の代表疾患の対応が定番', likelihood: 'high' },
      { name: '腫瘍（前癌病変・TNM・発癌ウイルス）', reason: '4回出題。前癌病変とがんの対応、ウイルスとがんの対応が狙われる', likelihood: 'high' },
      { name: '壊死・変性の型', reason: '第34回で出題、好発臓器との対応が問われやすい', likelihood: 'medium' },
    ],
  },
  {
    subjectId: 'clinical-specific',
    overview: '臨床医学各論は国家試験で最も出題数が多い科目群（6年で約175問、午前の総合問題を含めると更に増える）。神経疾患・運動器疾患・血液疾患・感染症が主力で、症例形式の出題が多い。鍼灸臨床で出会う疾患が中心なので、症状から疾患を絞る「鑑別の型」を身につけることが最重要。',
    studyHours: '80〜100時間',
    roadmap: [
      { themeId: 'cs-shinkeikin', name: '神経筋疾患・末梢神経障害', note: 'ALS・ギラン・バレー・筋ジストロフィー・絞扼性神経障害から始める' },
      { themeId: 'cs-nokekkan', name: '脳血管疾患・高次脳機能障害・めまい', note: '被殻出血・失語・半側空間無視・末梢性/中枢性めまいの鑑別' },
      { themeId: 'cs-ninchisho', name: '認知症', note: '初発症状で4型を鑑別する' },
      { themeId: 'cs-hentai-kansetsu', name: '変形性関節症・関節リウマチ・骨代謝疾患', note: 'OAのX線4徴、RAの変形、骨粗鬆症の三大骨折部位' },
      { themeId: 'cs-sekitsui', name: '脊椎疾患・神経根障害と徒手検査', note: 'ヘルニアと狭窄症の鑑別、L5・S1・C6の神経学的所見' },
      { themeId: 'cs-ketsueki', name: '血液疾患', note: '貧血の分類（MCV）、白血病、ITP・血友病' },
      { themeId: 'cs-kansen', name: '感染症', note: 'ウイルス性肝炎・結核・食中毒の原因別特徴' },
      { themeId: 'cs-shokaki', name: '消化器疾患', note: '黄疸の分類、肝硬変の合併症、急性膵炎' },
      { themeId: 'cs-junkanki', name: '循環器疾患', note: '狭心症と心筋梗塞、左心不全と右心不全' },
      { themeId: 'cs-kokyuki', name: '呼吸器疾患', note: 'COPD・喘息・気胸、閉塞性と拘束性の換気障害' },
      { themeId: 'cs-naibunpi', name: '内分泌・代謝疾患', note: '糖尿病の合併症、甲状腺機能の亢進と低下' },
      { themeId: 'cs-seishin', name: '精神疾患', note: 'パニック障害・統合失調症・うつ病・発達障害' },
    ],
    commonConfusions: [
      {
        title: 'ALSで「保たれる」もの',
        desc: 'ALSは上位・下位運動ニューロンが障害される一方、感覚・眼球運動・膀胱直腸機能・褥瘡は末期まで保たれることが多い。筋萎縮と腱反射亢進が共存する点も特徴。',
      },
      {
        title: '末梢神経麻痺の手の変形',
        desc: '下垂手＝橈骨神経麻痺、猿手（母指対立不能）＝正中神経麻痺、鷲手＝尺骨神経麻痺。混同しやすい頻出ポイント。',
      },
      {
        title: '認知症の初発症状で鑑別',
        desc: '近時記憶障害→アルツハイマー型、幻視・認知の変動→レビー小体型、人格変化・脱抑制→前頭側頭型、段階的悪化・まだら認知症→血管性。',
      },
      {
        title: 'L5とS1の神経根障害',
        desc: 'L5障害＝足背の知覚障害・足関節背屈筋力低下。S1障害＝足底の知覚障害・アキレス腱反射消失・底屈筋力低下。アキレス腱反射消失はS1。',
      },
      {
        title: '狭心症と心筋梗塞',
        desc: '狭心症は労作時・数分・ニトログリセリン有効・ST低下。心筋梗塞は安静時・30分以上持続・ニトロ無効・ST上昇・心筋逸脱酵素（トロポニン・CK-MB）上昇。',
      },
    ],
    nextExamPredictions: [
      { name: '神経筋疾患・末梢神経障害', reason: '6年連続出題。ALS・ギラン・バレー・絞扼性神経障害の症例問題が続く', likelihood: 'high' },
      { name: '変形性関節症・関節リウマチ', reason: '6年連続出題。X線所見と特徴的変形の対応が繰り返される', likelihood: 'high' },
      { name: '脊椎疾患・神経根障害と徒手検査', reason: '症例形式で神経学的所見から高位診断させる問題が定番', likelihood: 'high' },
      { name: '血液疾患（貧血の分類）', reason: '6年連続出題。赤血球指数から貧血を分類する問題が続く見込み', likelihood: 'high' },
      { name: '認知症の鑑別', reason: '初発症状・画像所見からの4型鑑別が繰り返し出題', likelihood: 'medium' },
    ],
  },
  {
    subjectId: 'rehabilitation',
    overview: 'リハビリテーション医学は障害の概念（ICF）と主要疾患のリハが柱。脳卒中・脊髄損傷・脳性麻痺と、廃用症候群・フレイル・多職種連携が頻出。数値の暗記より「評価スケールの意味」と「損傷高位ごとの残存機能」を押さえることが得点につながる。',
    studyHours: '25〜35時間',
    roadmap: [
      { themeId: 'rh-soron', name: 'リハビリテーション総論（ICF・評価法）', note: 'ICFの構成、FIM、MMTの段階から始める' },
      { themeId: 'rh-team', name: 'リハビリテーションチームと多職種連携・歩行分析', note: 'PT・OT・STの役割分担、異常歩行の名称と原因' },
      { themeId: 'rh-nosocchu', name: '脳卒中のリハビリテーション', note: 'ブルンストロームステージ、短下肢装具、利き手交換' },
      { themeId: 'rh-sekizui', name: '脊髄損傷のリハビリテーション', note: '損傷高位別ADL、自律神経過反射（T6以上）' },
      { themeId: 'rh-noseimahi', name: '脳性麻痺のリハビリテーション', note: '病型分類（痙直型が最多）、はさみ脚歩行' },
      { themeId: 'rh-engo-shogai', name: '摂食嚥下障害・言語障害・高次脳機能障害', note: '嚥下5期、失語症のタイプ、半側空間無視への対応' },
      { themeId: 'rh-gishi-sogu', name: '義肢・装具・切断のリハビリテーション', note: '断端包帯の目的、PTB義足、神経麻痺と装具の対応' },
      { themeId: 'rh-haiyo-frailty', name: '廃用症候群・フレイル・サルコペニア', note: 'J-CHS基準5項目を最後に暗記' },
    ],
    commonConfusions: [
      {
        title: 'MMTの3と2',
        desc: 'MMT3＝重力に抗して全可動域動かせる。MMT2＝重力を除いた肢位でのみ全可動域動かせる。「重力に抗せるか」が3と2の境目。',
      },
      {
        title: '自律神経過反射の損傷高位',
        desc: 'T6以上の脊髄損傷で発生する。膀胱充満・便秘・褥瘡などの刺激で急激な血圧上昇・頭痛・発汗。対応は座位にして誘因を除去。腰髄損傷では起こらない。',
      },
      {
        title: 'ブルンストロームステージの進行',
        desc: 'Ⅰ＝弛緩・随意運動なし、Ⅱ＝連合反応・共同運動が出現、Ⅲ＝共同運動が随意的に最大、Ⅳ＝共同運動から分離した運動が出始める、Ⅴ・Ⅵで分離が進む。',
      },
      {
        title: '断端包帯（弾性包帯）の目的',
        desc: '主目的は浮腫の予防と断端の成形（義足のソケット装着準備）。疼痛軽減・筋力強化・感染予防が主目的ではない。',
      },
    ],
    nextExamPredictions: [
      { name: '脊髄損傷のリハビリテーション', reason: '6年連続出題。損傷高位別の残存機能と自律神経過反射が繰り返される', likelihood: 'high' },
      { name: 'リハビリテーション総論（ICF・評価法）', reason: 'ICFの構成要素、FIM・MMTの評価の意味が毎年形を変えて出題', likelihood: 'high' },
      { name: '脳性麻痺の病型分類', reason: '5回出題。痙直型が最多である点と、はさみ脚歩行が狙われる', likelihood: 'medium' },
      { name: 'フレイル・サルコペニア', reason: '第33・34回で連続出題、J-CHS基準の5項目が問われる', likelihood: 'medium' },
    ],
  },
]

export function getSubjectGuide(subjectId: string): SubjectGuide | undefined {
  return subjectGuides.find(g => g.subjectId === subjectId)
}
