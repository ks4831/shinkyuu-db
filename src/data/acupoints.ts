/* ──────────────────────────────────────────────────────────────
   経穴マスタ（国家試験・特定穴中心の抜粋 約100穴）
   - WHO/教科書『経絡経穴概論』に基づく一般的事実のみを収録
   - 位置は要点のみ。詳細な取穴は各自教科書で確認すること
   - 出題状況は src/lib/acupoints.ts が過去問CSVの本文を走査して付与する
   ────────────────────────────────────────────────────────────── */

export type MeridianId =
  | 'LU' | 'LI' | 'ST' | 'SP' | 'HT' | 'SI'
  | 'BL' | 'KI' | 'PC' | 'TE' | 'GB' | 'LR'
  | 'CV' | 'GV'

export type Acupoint = {
  slug: string
  code: string
  name: string
  reading: string
  meridian: MeridianId
  meridianName: string
  region: string
  /** 位置の要点（教科書の簡略表現） */
  location: string
  /** 特定穴分類（複数可） */
  specialPoints: string[]
  /** 別名・異体字・旧表記（出題判定の表記揺れ対策に使用） */
  aliases?: string[]
  importance: 'S' | 'A' | 'B' | 'C'
  /** 覚え方の一言 */
  memoryTip: string
  /** 何を問われやすいか */
  examPoint: string
}

export const MERIDIANS: { id: MeridianId; name: string; short: string; type: '正経' | '奇経' }[] = [
  { id: 'LU', name: '手の太陰肺経', short: '肺', type: '正経' },
  { id: 'LI', name: '手の陽明大腸経', short: '大腸', type: '正経' },
  { id: 'ST', name: '足の陽明胃経', short: '胃', type: '正経' },
  { id: 'SP', name: '足の太陰脾経', short: '脾', type: '正経' },
  { id: 'HT', name: '手の少陰心経', short: '心', type: '正経' },
  { id: 'SI', name: '手の太陽小腸経', short: '小腸', type: '正経' },
  { id: 'BL', name: '足の太陽膀胱経', short: '膀胱', type: '正経' },
  { id: 'KI', name: '足の少陰腎経', short: '腎', type: '正経' },
  { id: 'PC', name: '手の厥陰心包経', short: '心包', type: '正経' },
  { id: 'TE', name: '手の少陽三焦経', short: '三焦', type: '正経' },
  { id: 'GB', name: '足の少陽胆経', short: '胆', type: '正経' },
  { id: 'LR', name: '足の厥陰肝経', short: '肝', type: '正経' },
  { id: 'CV', name: '任脈', short: '任', type: '奇経' },
  { id: 'GV', name: '督脈', short: '督', type: '奇経' },
]

const A = (a: Acupoint): Acupoint => a

export const ACUPOINTS: Acupoint[] = [
  /* ── 手の太陰肺経 ─────────────────────────── */
  A({ slug: 'lu1', code: 'LU1', name: '中府', reading: 'ちゅうふ', meridian: 'LU', meridianName: '手の太陰肺経', region: '前胸部', location: '前胸部・第1肋間、鎖骨下窩の外方、前正中線の外方6寸', specialPoints: ['肺経の募穴'], importance: 'A', memoryTip: '肺の募穴は自経（肺経）上にある', examPoint: '募穴（肺）であること・前胸部で第1肋間という位置' }),
  A({ slug: 'lu5', code: 'LU5', name: '尺沢', reading: 'しゃくたく', meridian: 'LU', meridianName: '手の太陰肺経', region: '肘', location: '肘窩横紋上、上腕二頭筋腱の外方', specialPoints: ['五兪穴：合（水）'], importance: 'A', memoryTip: '肘窩＝合水穴。肺の実を瀉す', examPoint: '合水穴・上腕二頭筋腱の外側という取穴' }),
  A({ slug: 'lu6', code: 'LU6', name: '孔最', reading: 'こうさい', meridian: 'LU', meridianName: '手の太陰肺経', region: '前腕', location: '前腕前外側、尺沢と太淵を結ぶ線上、手関節横紋の上方7寸', specialPoints: ['郄穴'], importance: 'B', memoryTip: '孔＝穴、最＝あな最も＝郄穴。急性の咳・喀血', examPoint: '肺経の郄穴であること' }),
  A({ slug: 'lu7', code: 'LU7', name: '列缺', reading: 'れっけつ', meridian: 'LU', meridianName: '手の太陰肺経', region: '前腕', location: '前腕橈側、長母指外転筋腱と短母指伸筋腱の間、手関節横紋の上方1.5寸', specialPoints: ['絡穴', '八脈交会穴（任脈）', '四総穴（頭項）'], importance: 'S', memoryTip: '「頭項は列缺に尋ねよ」。絡穴かつ任脈に通じる', examPoint: '絡穴・八脈交会穴（任脈）・四総穴（頭項）の三役' }),
  A({ slug: 'lu9', code: 'LU9', name: '太淵', reading: 'たいえん', meridian: 'LU', meridianName: '手の太陰肺経', region: '手関節', location: '手関節前外側、橈骨茎状突起と舟状骨の間、長母指外転筋腱の尺側陥凹部', specialPoints: ['原穴', '五兪穴：兪（土）', '八会穴（脈会）'], importance: 'S', memoryTip: '陰経は原穴＝輸穴。脈会なので脈拍を診る部位', examPoint: '原穴・輸土穴・八会穴（脈会）が一致すること' }),
  A({ slug: 'lu10', code: 'LU10', name: '魚際', reading: 'ぎょさい', meridian: 'LU', meridianName: '手の太陰肺経', region: '手掌', location: '第1中手骨中点の橈側、赤白肉際', specialPoints: ['五兪穴：滎（火）'], importance: 'B', memoryTip: '手掌の母指球＝魚のはら。滎火穴で熱をとる', examPoint: '滎火穴・赤白肉際の取穴' }),
  A({ slug: 'lu11', code: 'LU11', name: '少商', reading: 'しょうしょう', meridian: 'LU', meridianName: '手の太陰肺経', region: '母指', location: '母指、末節骨橈側、爪甲角の近位外方1分（爪甲角から水平・垂直の交点）', specialPoints: ['五兪穴：井（木）'], importance: 'A', memoryTip: '井穴は爪の際。咽喉腫痛に点刺瀉血', examPoint: '井木穴・咽喉痛への刺絡' }),

  /* ── 手の陽明大腸経 ───────────────────────── */
  A({ slug: 'li1', code: 'LI1', name: '商陽', reading: 'しょうよう', meridian: 'LI', meridianName: '手の陽明大腸経', region: '示指', location: '示指、末節骨橈側、爪甲角の近位外方1分', specialPoints: ['五兪穴：井（金）'], importance: 'B', memoryTip: '陽経の井は金。示指の橈側', examPoint: '井金穴であること（陽経の井＝金）' }),
  A({ slug: 'li3', code: 'LI3', name: '三間', reading: 'さんかん', meridian: 'LI', meridianName: '手の陽明大腸経', region: '手背', location: '第2中手指節関節橈側の近位陥凹部', specialPoints: ['五兪穴：兪（木）'], importance: 'C', memoryTip: '陽経の輸は木', examPoint: '輸木穴' }),
  A({ slug: 'li4', code: 'LI4', name: '合谷', reading: 'ごうこく', meridian: 'LI', meridianName: '手の陽明大腸経', region: '手背', location: '第2中手骨中点の橈側', specialPoints: ['原穴', '四総穴（面口）'], importance: 'S', memoryTip: '「面口は合谷に収む」。妊婦には禁忌とされる', examPoint: '原穴・四総穴（顔面・口）・妊婦への配慮' }),
  A({ slug: 'li5', code: 'LI5', name: '陽渓', reading: 'ようけい', meridian: 'LI', meridianName: '手の陽明大腸経', region: '手関節', location: '手関節後外側、橈骨茎状突起の遠位、タバコ窩（解剖学的嗅ぎタバコ入れ）の陥凹部', specialPoints: ['五兪穴：経（火）'], importance: 'B', memoryTip: 'タバコ窩＝陽渓。経火穴', examPoint: '経火穴・タバコ窩という位置' }),
  A({ slug: 'li6', code: 'LI6', name: '偏歴', reading: 'へんれき', meridian: 'LI', meridianName: '手の陽明大腸経', region: '前腕', location: '陽渓と曲池を結ぶ線上、手関節背側横紋の上方3寸', specialPoints: ['絡穴'], importance: 'B', memoryTip: '大腸経の絡穴。肺経（太陰）へ絡む', examPoint: '絡穴であること' }),
  A({ slug: 'li7', code: 'LI7', name: '温溜', reading: 'おんる', meridian: 'LI', meridianName: '手の陽明大腸経', region: '前腕', location: '陽渓と曲池を結ぶ線上、手関節背側横紋の上方5寸', specialPoints: ['郄穴'], importance: 'B', memoryTip: '大腸経の郄穴。急性腸炎・歯痛', examPoint: '郄穴であること' }),
  A({ slug: 'li10', code: 'LI10', name: '手三里', reading: 'てさんり', meridian: 'LI', meridianName: '手の陽明大腸経', region: '前腕', location: '陽渓と曲池を結ぶ線上、肘窩横紋の下方2寸', specialPoints: [], importance: 'B', memoryTip: '足三里の手版。上肢痛・テニス肘', examPoint: '曲池の下2寸という位置' }),
  A({ slug: 'li11', code: 'LI11', name: '曲池', reading: 'きょくち', meridian: 'LI', meridianName: '手の陽明大腸経', region: '肘', location: '肘を屈曲したときにできる肘窩横紋の外端、上腕骨外側上顆との中点', specialPoints: ['五兪穴：合（土）'], importance: 'S', memoryTip: '肘を曲げてできる池。合土穴、皮膚疾患・高血圧', examPoint: '合土穴・肘窩横紋外端という取穴' }),
  A({ slug: 'li15', code: 'LI15', name: '肩髃', reading: 'けんぐう', meridian: 'LI', meridianName: '手の陽明大腸経', region: '肩', location: '肩峰外縁の前端と上腕骨大結節の間、上腕を外転したときにできる前方の陥凹部', specialPoints: [], importance: 'B', memoryTip: '肩関節周囲炎（五十肩）の代表穴', examPoint: '肩の外転で現れる前方の陥凹' }),
  A({ slug: 'li20', code: 'LI20', name: '迎香', reading: 'げいこう', meridian: 'LI', meridianName: '手の陽明大腸経', region: '顔面部', location: '鼻唇溝中、鼻翼外縁の中点と同じ高さ', specialPoints: [], importance: 'B', memoryTip: '香を迎える＝鼻。鼻閉・鼻炎。大腸経の最終穴', examPoint: '大腸経の起始・終止（終止穴）・鼻唇溝という位置' }),

  /* ── 足の陽明胃経 ─────────────────────────── */
  A({ slug: 'st2', code: 'ST2', name: '四白', reading: 'しはく', meridian: 'ST', meridianName: '足の陽明胃経', region: '顔面部', location: '眼窩下孔部', specialPoints: [], importance: 'C', memoryTip: '眼窩下孔＝四白。眼疾・顔面神経麻痺', examPoint: '眼窩下孔という位置' }),
  A({ slug: 'st4', code: 'ST4', name: '地倉', reading: 'ちそう', meridian: 'ST', meridianName: '足の陽明胃経', region: '顔面部', location: '口角の外方4分', specialPoints: [], importance: 'C', memoryTip: '口角＝地倉。顔面神経麻痺で頬車と組む', examPoint: '口角外方という位置' }),
  A({ slug: 'st6', code: 'ST6', name: '頬車', reading: 'きょうしゃ', meridian: 'ST', meridianName: '足の陽明胃経', region: '顔面部', location: '下顎角の前上方1横指、咬筋の膨隆部', specialPoints: [], importance: 'C', memoryTip: '咬筋の隆起。歯痛・顎関節症', examPoint: '咬筋膨隆部という位置' }),
  A({ slug: 'st8', code: 'ST8', name: '頭維', reading: 'ずい', meridian: 'ST', meridianName: '足の陽明胃経', region: '頭部', location: '額角髪際の直上5分、前正中線の外方4.5寸', specialPoints: [], importance: 'C', memoryTip: '額の角＝頭維。前頭部の頭痛', examPoint: '額角髪際という位置・胃経が頭部に及ぶこと' }),
  A({ slug: 'st25', code: 'ST25', name: '天枢', reading: 'てんすう', meridian: 'ST', meridianName: '足の陽明胃経', region: '上腹部', location: '臍中央の外方2寸', specialPoints: ['大腸経の募穴'], importance: 'S', memoryTip: '大腸の募穴は胃経上（臍の外2寸）。便秘・下痢の要穴', examPoint: '募穴（大腸）であること・臍外方2寸' }),
  A({ slug: 'st34', code: 'ST34', name: '梁丘', reading: 'りょうきゅう', meridian: 'ST', meridianName: '足の陽明胃経', region: '大腿', location: '外側広筋と大腿直筋腱外縁の間、膝蓋骨底外端の上方2寸', specialPoints: ['郄穴'], importance: 'A', memoryTip: '胃経の郄穴。急性胃痛・膝痛', examPoint: '郄穴であること・膝蓋骨上外方2寸' }),
  A({ slug: 'st36', code: 'ST36', name: '足三里', reading: 'あしさんり', meridian: 'ST', meridianName: '足の陽明胃経', region: '下腿', location: '犢鼻（膝蓋靱帯外方の陥凹）の下方3寸、脛骨前縁の外方1横指', specialPoints: ['五兪穴：合（土）', '胃の下合穴', '四総穴（肚腹）'], importance: 'S', memoryTip: '「肚腹は三里に留む」。合土穴＝下合穴。全身の強壮穴', examPoint: '合土穴・下合穴・四総穴（腹部）の三役／犢鼻下3寸の取穴' }),
  A({ slug: 'st37', code: 'ST37', name: '上巨虚', reading: 'じょうこきょ', meridian: 'ST', meridianName: '足の陽明胃経', region: '下腿', location: '足三里の下方3寸、犢鼻の下方6寸', specialPoints: ['大腸の下合穴'], importance: 'A', memoryTip: '大腸の下合穴は胃経上。下痢・虫垂炎', examPoint: '大腸の下合穴であること（足三里の下3寸）' }),
  A({ slug: 'st38', code: 'ST38', name: '条口', reading: 'じょうこう', meridian: 'ST', meridianName: '足の陽明胃経', region: '下腿', location: '犢鼻の下方8寸、脛骨前縁の外方1横指', specialPoints: [], importance: 'B', memoryTip: '肩関節周囲炎に遠隔で用いる（条口透承山）', examPoint: '五十肩への遠隔取穴・犢鼻下8寸' }),
  A({ slug: 'st39', code: 'ST39', name: '下巨虚', reading: 'げこきょ', meridian: 'ST', meridianName: '足の陽明胃経', region: '下腿', location: '上巨虚の下方3寸、犢鼻の下方9寸', specialPoints: ['小腸の下合穴'], importance: 'A', memoryTip: '小腸の下合穴は胃経上。下腹部痛', examPoint: '小腸の下合穴であること' }),
  A({ slug: 'st40', code: 'ST40', name: '豊隆', reading: 'ほうりゅう', meridian: 'ST', meridianName: '足の陽明胃経', region: '下腿', location: '前脛骨筋の外縁、外果尖の上方8寸', specialPoints: ['絡穴'], importance: 'S', memoryTip: '胃経の絡穴。「痰は豊隆」＝去痰の要穴', examPoint: '絡穴であること・去痰作用・外果上8寸' }),
  A({ slug: 'st41', code: 'ST41', name: '解渓', reading: 'かいけい', meridian: 'ST', meridianName: '足の陽明胃経', region: '足関節', location: '足関節前面中央の陥凹部、長母趾伸筋腱と長趾伸筋腱の間', specialPoints: ['五兪穴：経（火）'], importance: 'B', memoryTip: '足関節前面の靴ひも部。経火穴', examPoint: '経火穴・足関節前面中央' }),
  A({ slug: 'st42', code: 'ST42', name: '衝陽', reading: 'しょうよう', meridian: 'ST', meridianName: '足の陽明胃経', region: '足背', location: '第2中足骨底部と中間楔状骨の間、足背動脈拍動部', specialPoints: ['原穴'], importance: 'A', memoryTip: '足背動脈の拍動＝胃経の原穴（衝陽脈）', examPoint: '原穴であること・足背動脈拍動部' }),
  A({ slug: 'st44', code: 'ST44', name: '内庭', reading: 'ないてい', meridian: 'ST', meridianName: '足の陽明胃経', region: '足背', location: '第2・第3足趾間、みずかきの後縁、赤白肉際', specialPoints: ['五兪穴：滎（水）'], importance: 'B', memoryTip: '陽経の滎は水。歯痛・胃熱をとる', examPoint: '滎水穴（陽経の滎＝水）' }),
  A({ slug: 'st45', code: 'ST45', name: '厲兌', reading: 'れいだ', meridian: 'ST', meridianName: '足の陽明胃経', region: '足の第2趾', location: '第2趾、末節骨外側、爪甲角の近位外方1分', specialPoints: ['五兪穴：井（金）'], aliases: ['厲兑', '歴兌'], importance: 'C', memoryTip: '胃経の最終穴＝井金穴。悪夢・多夢に', examPoint: '井金穴・胃経の終止穴' }),

  /* ── 足の太陰脾経 ─────────────────────────── */
  A({ slug: 'sp1', code: 'SP1', name: '隠白', reading: 'いんぱく', meridian: 'SP', meridianName: '足の太陰脾経', region: '足の第1趾', location: '足の第1趾、末節骨内側、爪甲角の近位内方1分', specialPoints: ['五兪穴：井（木）'], importance: 'B', memoryTip: '脾経の起始＝井木穴。崩漏（不正出血）に灸', examPoint: '井木穴・不正性器出血への施灸' }),
  A({ slug: 'sp3', code: 'SP3', name: '太白', reading: 'たいはく', meridian: 'SP', meridianName: '足の太陰脾経', region: '足内側', location: '第1中足指節関節の近位陥凹部、赤白肉際', specialPoints: ['原穴', '五兪穴：兪（土）'], importance: 'A', memoryTip: '脾経の原穴＝輸土穴（陰経は原＝輸）。脾は土', examPoint: '原穴・輸土穴の一致' }),
  A({ slug: 'sp4', code: 'SP4', name: '公孫', reading: 'こうそん', meridian: 'SP', meridianName: '足の太陰脾経', region: '足内側', location: '第1中足骨底の前下方、赤白肉際', specialPoints: ['絡穴', '八脈交会穴（衝脈）'], importance: 'S', memoryTip: '絡穴かつ衝脈に通じる。内関と組んで胃心胸の病', examPoint: '絡穴・八脈交会穴（衝脈）／内関との配穴' }),
  A({ slug: 'sp5', code: 'SP5', name: '商丘', reading: 'しょうきゅう', meridian: 'SP', meridianName: '足の太陰脾経', region: '足関節', location: '内果の前下方、舟状骨粗面と内果尖の中点の陥凹部', specialPoints: ['五兪穴：経（金）'], importance: 'C', memoryTip: '内果前下方＝経金穴', examPoint: '経金穴・内果前下方' }),
  A({ slug: 'sp6', code: 'SP6', name: '三陰交', reading: 'さんいんこう', meridian: 'SP', meridianName: '足の太陰脾経', region: '下腿', location: '脛骨内縁の後方、内果尖の上方3寸', specialPoints: ['足の三陰経の交会穴'], importance: 'S', memoryTip: '脾・肝・腎の三陰が交わる。妊婦は禁鍼（滑胎のおそれ）', examPoint: '三陰経の交会穴・妊婦への禁忌・内果上3寸' }),
  A({ slug: 'sp8', code: 'SP8', name: '地機', reading: 'ちき', meridian: 'SP', meridianName: '足の太陰脾経', region: '下腿', location: '脛骨内縁の後方、陰陵泉の下方3寸', specialPoints: ['郄穴'], importance: 'A', memoryTip: '脾経の郄穴。急性の腹痛・月経痛', examPoint: '郄穴であること（陰陵泉の下3寸）' }),
  A({ slug: 'sp9', code: 'SP9', name: '陰陵泉', reading: 'いんりょうせん', meridian: 'SP', meridianName: '足の太陰脾経', region: '下腿', location: '脛骨内側顆下縁と脛骨内縁が接する陥凹部', specialPoints: ['五兪穴：合（水）'], importance: 'A', memoryTip: '脛骨内側顆の下＝合水穴。利水（むくみ・下痢）', examPoint: '合水穴・利水作用・脛骨内側顆下縁' }),
  A({ slug: 'sp10', code: 'SP10', name: '血海', reading: 'けっかい', meridian: 'SP', meridianName: '足の太陰脾経', region: '大腿', location: '内側広筋の隆起部、膝蓋骨底内端の上方2寸', specialPoints: [], importance: 'A', memoryTip: '血の海＝月経不順・皮膚掻痒。膝蓋骨内上方2寸', examPoint: '膝蓋骨内上方2寸／血証への使用' }),
  A({ slug: 'sp15', code: 'SP15', name: '大横', reading: 'だいおう', meridian: 'SP', meridianName: '足の太陰脾経', region: '上腹部', location: '臍中央の外方4寸', specialPoints: [], importance: 'C', memoryTip: '臍の外4寸（天枢は外2寸）。便秘', examPoint: '臍外方4寸という位置（天枢との区別）' }),
  A({ slug: 'sp21', code: 'SP21', name: '大包', reading: 'だいほう', meridian: 'SP', meridianName: '足の太陰脾経', region: '側胸部', location: '第6肋間、中腋窩線上', specialPoints: ['脾の大絡'], importance: 'B', memoryTip: '脾の大絡（全身の絡を統べる）。中腋窩線・第6肋間', examPoint: '脾の大絡であること' }),

  /* ── 手の少陰心経 ─────────────────────────── */
  A({ slug: 'ht3', code: 'HT3', name: '少海', reading: 'しょうかい', meridian: 'HT', meridianName: '手の少陰心経', region: '肘', location: '肘を屈曲したとき、上腕骨内側上顆の前縁と肘窩横紋内端の中点', specialPoints: ['五兪穴：合（水）'], importance: 'B', memoryTip: '内側上顆の前＝心経の合水穴', examPoint: '合水穴・上腕骨内側上顆前縁' }),
  A({ slug: 'ht4', code: 'HT4', name: '霊道', reading: 'れいどう', meridian: 'HT', meridianName: '手の少陰心経', region: '前腕', location: '尺側手根屈筋腱の橈側縁、手関節掌側横紋の上方1.5寸', specialPoints: ['五兪穴：経（金）'], importance: 'C', memoryTip: '経金穴。手関節横紋の上1.5寸', examPoint: '経金穴・手関節上1.5寸' }),
  A({ slug: 'ht5', code: 'HT5', name: '通里', reading: 'つうり', meridian: 'HT', meridianName: '手の少陰心経', region: '前腕', location: '尺側手根屈筋腱の橈側縁、手関節掌側横紋の上方1寸', specialPoints: ['絡穴'], importance: 'B', memoryTip: '心経の絡穴。小腸経へ絡む。失語・不整脈', examPoint: '絡穴であること（手関節上1寸）' }),
  A({ slug: 'ht6', code: 'HT6', name: '陰郄', reading: 'いんげき', meridian: 'HT', meridianName: '手の少陰心経', region: '前腕', location: '尺側手根屈筋腱の橈側縁、手関節掌側横紋の上方5分', specialPoints: ['郄穴'], importance: 'B', memoryTip: '名前に「郄」。心経の郄穴。盗汗（寝汗）・動悸', examPoint: '郄穴であること・寝汗への使用' }),
  A({ slug: 'ht7', code: 'HT7', name: '神門', reading: 'しんもん', meridian: 'HT', meridianName: '手の少陰心経', region: '手関節', location: '手関節掌側横紋上、尺側手根屈筋腱の橈側縁、豆状骨上縁の橈側の陥凹部', specialPoints: ['原穴', '五兪穴：兪（土）'], importance: 'S', memoryTip: '心の門＝原穴＝輸土穴。不眠・不安の代表穴', examPoint: '原穴・輸土穴の一致／精神症状への使用' }),
  A({ slug: 'ht8', code: 'HT8', name: '少府', reading: 'しょうふ', meridian: 'HT', meridianName: '手の少陰心経', region: '手掌', location: '第4・第5中手骨の間、握ったとき小指頭が当たる所', specialPoints: ['五兪穴：滎（火）'], importance: 'C', memoryTip: '手掌で握って小指が当たる＝滎火穴（心は火）', examPoint: '滎火穴（陰経の滎＝火、心の本経なので火火）' }),
  A({ slug: 'ht9', code: 'HT9', name: '少衝', reading: 'しょうしょう', meridian: 'HT', meridianName: '手の少陰心経', region: '小指', location: '小指、末節骨橈側、爪甲角の近位外方1分', specialPoints: ['五兪穴：井（木）'], importance: 'B', memoryTip: '小指橈側＝心経の井木穴。意識障害に点刺', examPoint: '井木穴・小指橈側／救急での刺絡' }),

  /* ── 手の太陽小腸経 ───────────────────────── */
  A({ slug: 'si1', code: 'SI1', name: '少沢', reading: 'しょうたく', meridian: 'SI', meridianName: '手の太陽小腸経', region: '小指', location: '小指、末節骨尺側、爪甲角の近位内方1分', specialPoints: ['五兪穴：井（金）'], importance: 'B', memoryTip: '小指尺側＝井金穴。乳汁分泌不足に灸', examPoint: '井金穴・小指尺側／乳汁分泌への施灸' }),
  A({ slug: 'si3', code: 'SI3', name: '後渓', reading: 'こうけい', meridian: 'SI', meridianName: '手の太陽小腸経', region: '手', location: '第5中手指節関節尺側の近位陥凹部、赤白肉際、軽く握って手掌横紋の尺側端', specialPoints: ['五兪穴：兪（木）', '八脈交会穴（督脈）'], aliases: ['後谿'], importance: 'S', memoryTip: '握ってできる横紋の端。輸木穴かつ督脈に通じる。項背部痛', examPoint: '輸木穴・八脈交会穴（督脈）／申脈との配穴' }),
  A({ slug: 'si4', code: 'SI4', name: '腕骨', reading: 'わんこつ', meridian: 'SI', meridianName: '手の太陽小腸経', region: '手', location: '第5中手骨底部と三角骨の間の陥凹部、赤白肉際', specialPoints: ['原穴'], importance: 'B', memoryTip: '手根部の骨の際＝小腸経の原穴', examPoint: '原穴であること' }),
  A({ slug: 'si5', code: 'SI5', name: '陽谷', reading: 'ようこく', meridian: 'SI', meridianName: '手の太陽小腸経', region: '手関節', location: '三角骨と尺骨茎状突起の間の陥凹部', specialPoints: ['五兪穴：経（火）'], importance: 'C', memoryTip: '尺骨茎状突起の際＝経火穴', examPoint: '経火穴' }),
  A({ slug: 'si6', code: 'SI6', name: '養老', reading: 'ようろう', meridian: 'SI', meridianName: '手の太陽小腸経', region: '前腕', location: '尺骨頭橈側の陥凹部、手関節背側横紋の上方1寸', specialPoints: ['郄穴'], importance: 'B', memoryTip: '老いを養う＝目のかすみ・肩背痛。小腸経の郄穴', examPoint: '郄穴であること・尺骨頭の取穴' }),
  A({ slug: 'si7', code: 'SI7', name: '支正', reading: 'しせい', meridian: 'SI', meridianName: '手の太陽小腸経', region: '前腕', location: '尺骨内縁と尺側手根屈筋の間、手関節背側横紋の上方5寸', specialPoints: ['絡穴'], importance: 'B', memoryTip: '小腸経の絡穴。心経へ絡む', examPoint: '絡穴であること' }),
  A({ slug: 'si8', code: 'SI8', name: '小海', reading: 'しょうかい', meridian: 'SI', meridianName: '手の太陽小腸経', region: '肘', location: '肘頭と上腕骨内側上顆の間の陥凹部（尺骨神経溝）', specialPoints: ['五兪穴：合（土）'], importance: 'B', memoryTip: '肘の「ファニーボーン」＝合土穴。心経の少海と混同注意', examPoint: '合土穴・尺骨神経溝／心経「少海」との区別' }),
  A({ slug: 'si11', code: 'SI11', name: '天宗', reading: 'てんそう', meridian: 'SI', meridianName: '手の太陽小腸経', region: '肩甲部', location: '肩甲棘の中点と肩甲骨下角を結ぶ線上、肩甲棘から1/3の陥凹部', specialPoints: [], importance: 'B', memoryTip: '肩甲骨中央の圧痛点。肩こり・五十肩', examPoint: '肩甲骨上での位置（棘下窩）' }),
  A({ slug: 'si19', code: 'SI19', name: '聴宮', reading: 'ちょうきゅう', meridian: 'SI', meridianName: '手の太陽小腸経', region: '顔面部', location: '耳珠中央の前縁と下顎骨関節突起の間、口を開けたときの陥凹部', specialPoints: [], importance: 'B', memoryTip: '耳の前・開口で陥凹。耳鳴・難聴（耳門・聴会と並ぶ）', examPoint: '耳疾患の三穴（耳門・聴宮・聴会）の位置関係' }),

  /* ── 足の太陽膀胱経 ───────────────────────── */
  A({ slug: 'bl2', code: 'BL2', name: '攢竹', reading: 'さんちく', meridian: 'BL', meridianName: '足の太陽膀胱経', region: '頭部', location: '眉毛内端の陥凹部、前頭切痕部', specialPoints: [], aliases: ['攅竹'], importance: 'C', memoryTip: '眉頭。眼疾・前頭部痛', examPoint: '眉毛内端という位置' }),
  A({ slug: 'bl10', code: 'BL10', name: '天柱', reading: 'てんちゅう', meridian: 'BL', meridianName: '足の太陽膀胱経', region: '項部', location: '僧帽筋外縁の陥凹部、後髪際の上方5分', specialPoints: [], importance: 'B', memoryTip: '僧帽筋外縁・後髪際上5分。後頭部痛・頸肩こり', examPoint: '僧帽筋外縁／風池（胆経）との位置の区別' }),
  A({ slug: 'bl11', code: 'BL11', name: '大杼', reading: 'だいじょ', meridian: 'BL', meridianName: '足の太陽膀胱経', region: '上背部', location: '第1胸椎棘突起下縁と同じ高さ、後正中線の外方1.5寸', specialPoints: ['八会穴（骨会）'], importance: 'A', memoryTip: '骨会。骨疾患・頸椎症。第1胸椎の高さ', examPoint: '八会穴（骨会）であること' }),
  A({ slug: 'bl13', code: 'BL13', name: '肺兪', reading: 'はいゆ', meridian: 'BL', meridianName: '足の太陽膀胱経', region: '上背部', location: '第3胸椎棘突起下縁と同じ高さ、後正中線の外方1.5寸', specialPoints: ['肺の背部兪穴'], importance: 'A', memoryTip: '第3胸椎＝肺兪。咳・喘息。募穴の中府と俞募配穴', examPoint: '背部兪穴（肺）・第3胸椎の高さ' }),
  A({ slug: 'bl15', code: 'BL15', name: '心兪', reading: 'しんゆ', meridian: 'BL', meridianName: '足の太陽膀胱経', region: '上背部', location: '第5胸椎棘突起下縁と同じ高さ、後正中線の外方1.5寸', specialPoints: ['心の背部兪穴'], importance: 'A', memoryTip: '第5胸椎＝心兪。動悸・不眠', examPoint: '背部兪穴（心）・第5胸椎の高さ' }),
  A({ slug: 'bl17', code: 'BL17', name: '膈兪', reading: 'かくゆ', meridian: 'BL', meridianName: '足の太陽膀胱経', region: '背部', location: '第7胸椎棘突起下縁と同じ高さ、後正中線の外方1.5寸', specialPoints: ['八会穴（血会）'], importance: 'A', memoryTip: '第7胸椎（肩甲骨下角の高さ）＝血会。貧血・出血', examPoint: '八会穴（血会）・第7胸椎＝肩甲骨下角の高さ' }),
  A({ slug: 'bl18', code: 'BL18', name: '肝兪', reading: 'かんゆ', meridian: 'BL', meridianName: '足の太陽膀胱経', region: '背部', location: '第9胸椎棘突起下縁と同じ高さ、後正中線の外方1.5寸', specialPoints: ['肝の背部兪穴'], importance: 'A', memoryTip: '第9胸椎＝肝兪。眼疾・脇痛。募穴の期門と配穴', examPoint: '背部兪穴（肝）・第9胸椎の高さ' }),
  A({ slug: 'bl20', code: 'BL20', name: '脾兪', reading: 'ひゆ', meridian: 'BL', meridianName: '足の太陽膀胱経', region: '背部', location: '第11胸椎棘突起下縁と同じ高さ、後正中線の外方1.5寸', specialPoints: ['脾の背部兪穴'], importance: 'A', memoryTip: '第11胸椎＝脾兪。消化不良・慢性下痢。募穴は章門', examPoint: '背部兪穴（脾）・第11胸椎の高さ' }),
  A({ slug: 'bl21', code: 'BL21', name: '胃兪', reading: 'いゆ', meridian: 'BL', meridianName: '足の太陽膀胱経', region: '背部', location: '第12胸椎棘突起下縁と同じ高さ、後正中線の外方1.5寸', specialPoints: ['胃の背部兪穴'], importance: 'A', memoryTip: '第12胸椎＝胃兪。胃痛。募穴は中脘', examPoint: '背部兪穴（胃）・第12胸椎の高さ' }),
  A({ slug: 'bl23', code: 'BL23', name: '腎兪', reading: 'じんゆ', meridian: 'BL', meridianName: '足の太陽膀胱経', region: '腰部', location: '第2腰椎棘突起下縁と同じ高さ、後正中線の外方1.5寸', specialPoints: ['腎の背部兪穴'], importance: 'S', memoryTip: '第2腰椎（ヤコビー線のやや上）＝腎兪。腰痛・耳鳴・遺尿', examPoint: '背部兪穴（腎）・第2腰椎＝命門と同じ高さ' }),
  A({ slug: 'bl25', code: 'BL25', name: '大腸兪', reading: 'だいちょうゆ', meridian: 'BL', meridianName: '足の太陽膀胱経', region: '腰部', location: '第4腰椎棘突起下縁と同じ高さ、後正中線の外方1.5寸', specialPoints: ['大腸の背部兪穴'], importance: 'A', memoryTip: '第4腰椎（ヤコビー線の高さ）＝大腸兪。腰痛・便秘', examPoint: '背部兪穴（大腸）・第4腰椎＝ヤコビー線' }),
  A({ slug: 'bl28', code: 'BL28', name: '膀胱兪', reading: 'ぼうこうゆ', meridian: 'BL', meridianName: '足の太陽膀胱経', region: '仙骨部', location: '第2後仙骨孔と同じ高さ、正中仙骨稜の外方1.5寸', specialPoints: ['膀胱の背部兪穴'], importance: 'A', memoryTip: '第2仙骨孔＝膀胱兪。頻尿・排尿障害。募穴は中極', examPoint: '背部兪穴（膀胱）・第2後仙骨孔の高さ' }),
  A({ slug: 'bl40', code: 'BL40', name: '委中', reading: 'いちゅう', meridian: 'BL', meridianName: '足の太陽膀胱経', region: '膝', location: '膝窩横紋の中点', specialPoints: ['五兪穴：合（土）', '膀胱の下合穴', '四総穴（腰背）'], importance: 'S', memoryTip: '「腰背は委中に求む」。膝窩の中央。合土穴＝下合穴', examPoint: '合土穴・下合穴・四総穴（腰背）の三役／膝窩横紋中点' }),
  A({ slug: 'bl57', code: 'BL57', name: '承山', reading: 'しょうざん', meridian: 'BL', meridianName: '足の太陽膀胱経', region: '下腿', location: '腓腹筋筋腹とアキレス腱の移行部、つま先立ちで腓腹筋に「人」の字ができる頂点', specialPoints: [], importance: 'B', memoryTip: '腓腹筋の「人」の字の下＝承山。こむら返り・痔', examPoint: '腓腹筋とアキレス腱の移行部／痔疾への使用' }),
  A({ slug: 'bl58', code: 'BL58', name: '飛揚', reading: 'ひよう', meridian: 'BL', meridianName: '足の太陽膀胱経', region: '下腿', location: '腓腹筋外側頭下縁とアキレス腱の間、崑崙の上方7寸', specialPoints: ['絡穴'], aliases: ['飛陽'], importance: 'B', memoryTip: '膀胱経の絡穴。腎経へ絡む', examPoint: '絡穴であること' }),
  A({ slug: 'bl60', code: 'BL60', name: '崑崙', reading: 'こんろん', meridian: 'BL', meridianName: '足の太陽膀胱経', region: '足関節', location: '外果尖とアキレス腱の間の陥凹部', specialPoints: ['五兪穴：経（火）'], aliases: ['昆侖', '昆崙'], importance: 'A', memoryTip: '外果とアキレス腱の間＝経火穴。頭痛・項強・腰痛', examPoint: '経火穴・外果後方／太渓（腎経・内果後方）と対' }),
  A({ slug: 'bl62', code: 'BL62', name: '申脈', reading: 'しんみゃく', meridian: 'BL', meridianName: '足の太陽膀胱経', region: '足外側', location: '外果尖の直下、外果下縁と踵骨の間の陥凹部', specialPoints: ['八脈交会穴（陽蹻脈）'], importance: 'A', memoryTip: '外果の直下。陽蹻脈に通じる。後渓と組む', examPoint: '八脈交会穴（陽蹻脈）／後渓（督脈）との配穴' }),
  A({ slug: 'bl63', code: 'BL63', name: '金門', reading: 'きんもん', meridian: 'BL', meridianName: '足の太陽膀胱経', region: '足外側', location: '第5中足骨粗面の後方、立方骨下方の陥凹部', specialPoints: ['郄穴'], importance: 'C', memoryTip: '膀胱経の郄穴。急性腰痛・小児のひきつけ', examPoint: '郄穴であること' }),
  A({ slug: 'bl64', code: 'BL64', name: '京骨', reading: 'けいこつ', meridian: 'BL', meridianName: '足の太陽膀胱経', region: '足外側', location: '第5中足骨粗面の遠位、赤白肉際', specialPoints: ['原穴'], importance: 'B', memoryTip: '第5中足骨粗面の前＝膀胱経の原穴（陽経は原≠輸）', examPoint: '原穴であること（陽経なので輸木穴の束骨とは別）' }),
  A({ slug: 'bl65', code: 'BL65', name: '束骨', reading: 'そっこつ', meridian: 'BL', meridianName: '足の太陽膀胱経', region: '足外側', location: '第5中足指節関節の近位、赤白肉際', specialPoints: ['五兪穴：兪（木）'], importance: 'C', memoryTip: '陽経の輸は木', examPoint: '輸木穴' }),
  A({ slug: 'bl67', code: 'BL67', name: '至陰', reading: 'しいん', meridian: 'BL', meridianName: '足の太陽膀胱経', region: '足の第5趾', location: '足の第5趾、末節骨外側、爪甲角の近位外方1分', specialPoints: ['五兪穴：井（金）'], importance: 'A', memoryTip: '膀胱経の最終穴＝井金穴。逆子（骨盤位）の灸で有名', examPoint: '井金穴・胎位異常（逆子）への施灸' }),

  /* ── 足の少陰腎経 ─────────────────────────── */
  A({ slug: 'ki1', code: 'KI1', name: '湧泉', reading: 'ゆうせん', meridian: 'KI', meridianName: '足の少陰腎経', region: '足底', location: '足底、足趾を屈曲したときにできる足底の最陥凹部、およそ足底前1/3', specialPoints: ['五兪穴：井（木）'], importance: 'A', memoryTip: '足底＝腎経の起始＝井木穴。のぼせ・不眠・小児の熱', examPoint: '井木穴・足底という起始部（唯一足底にある正穴）' }),
  A({ slug: 'ki2', code: 'KI2', name: '然谷', reading: 'ねんこく', meridian: 'KI', meridianName: '足の少陰腎経', region: '足内側', location: '舟状骨粗面の下方、赤白肉際', specialPoints: ['五兪穴：滎（火）'], importance: 'C', memoryTip: '舟状骨粗面の下＝滎火穴', examPoint: '滎火穴・舟状骨粗面の下' }),
  A({ slug: 'ki3', code: 'KI3', name: '太渓', reading: 'たいけい', meridian: 'KI', meridianName: '足の少陰腎経', region: '足関節', location: '内果尖とアキレス腱の間の陥凹部', specialPoints: ['原穴', '五兪穴：兪（土）'], importance: 'S', memoryTip: '内果とアキレス腱の間＝原穴＝輸土穴。腎虚の代表穴。崑崙と対', examPoint: '原穴・輸土穴の一致／崑崙（外果側）との位置対比' }),
  A({ slug: 'ki4', code: 'KI4', name: '大鍾', reading: 'だいしょう', meridian: 'KI', meridianName: '足の少陰腎経', region: '足関節', location: '内果後下方、踵骨上方、アキレス腱付着部内側前方の陥凹部', specialPoints: ['絡穴'], aliases: ['大鐘'], importance: 'B', memoryTip: '腎経の絡穴。膀胱経へ絡む', examPoint: '絡穴であること' }),
  A({ slug: 'ki5', code: 'KI5', name: '水泉', reading: 'すいせん', meridian: 'KI', meridianName: '足の少陰腎経', region: '足関節', location: '太渓の下方1寸、踵骨隆起前方の陥凹部', specialPoints: ['郄穴'], importance: 'B', memoryTip: '腎経の郄穴。月経痛・排尿困難', examPoint: '郄穴であること' }),
  A({ slug: 'ki6', code: 'KI6', name: '照海', reading: 'しょうかい', meridian: 'KI', meridianName: '足の少陰腎経', region: '足内側', location: '内果尖の下方1寸、内果下方の陥凹部', specialPoints: ['八脈交会穴（陰蹻脈）'], importance: 'A', memoryTip: '内果の下＝陰蹻脈に通じる。咽喉の乾き・不眠。列缺と組む', examPoint: '八脈交会穴（陰蹻脈）／列缺（任脈）との配穴' }),
  A({ slug: 'ki7', code: 'KI7', name: '復溜', reading: 'ふくりゅう', meridian: 'KI', meridianName: '足の少陰腎経', region: '下腿', location: 'アキレス腱の前縁、内果尖の上方2寸', specialPoints: ['五兪穴：経（金）'], importance: 'B', memoryTip: '太渓の上2寸＝経金穴。発汗異常（合谷と組む）', examPoint: '経金穴・内果上2寸／発汗調節' }),
  A({ slug: 'ki10', code: 'KI10', name: '陰谷', reading: 'いんこく', meridian: 'KI', meridianName: '足の少陰腎経', region: '膝', location: '膝窩横紋上、半腱様筋腱と半膜様筋腱の間', specialPoints: ['五兪穴：合（水）'], importance: 'C', memoryTip: '膝窩内側の腱の間＝合水穴（腎は水、本経なので水水）', examPoint: '合水穴・膝窩内側' }),

  /* ── 手の厥陰心包経 ───────────────────────── */
  A({ slug: 'pc3', code: 'PC3', name: '曲沢', reading: 'きょくたく', meridian: 'PC', meridianName: '手の厥陰心包経', region: '肘', location: '肘窩横紋上、上腕二頭筋腱の内方の陥凹部', specialPoints: ['五兪穴：合（水）'], importance: 'B', memoryTip: '上腕二頭筋腱の内側＝合水穴。暑気あたり・嘔吐に刺絡', examPoint: '合水穴・上腕二頭筋腱の内側／尺沢（外側）と対' }),
  A({ slug: 'pc4', code: 'PC4', name: '郄門', reading: 'げきもん', meridian: 'PC', meridianName: '手の厥陰心包経', region: '前腕', location: '長掌筋腱と橈側手根屈筋腱の間、手関節掌側横紋の上方5寸', specialPoints: ['郄穴'], importance: 'B', memoryTip: '名前に「郄」。心包経の郄穴。狭心症様の胸痛・動悸', examPoint: '郄穴であること・手関節上5寸' }),
  A({ slug: 'pc5', code: 'PC5', name: '間使', reading: 'かんし', meridian: 'PC', meridianName: '手の厥陰心包経', region: '前腕', location: '長掌筋腱と橈側手根屈筋腱の間、手関節掌側横紋の上方3寸', specialPoints: ['五兪穴：経（金）'], importance: 'C', memoryTip: '内関の上1寸＝経金穴', examPoint: '経金穴・手関節上3寸' }),
  A({ slug: 'pc6', code: 'PC6', name: '内関', reading: 'ないかん', meridian: 'PC', meridianName: '手の厥陰心包経', region: '前腕', location: '長掌筋腱と橈側手根屈筋腱の間、手関節掌側横紋の上方2寸', specialPoints: ['絡穴', '八脈交会穴（陰維脈）'], importance: 'S', memoryTip: '手関節上2寸・2本の腱の間。絡穴かつ陰維脈。悪心・嘔吐・動悸の代表穴', examPoint: '絡穴・八脈交会穴（陰維脈）／公孫との配穴・制吐作用' }),
  A({ slug: 'pc7', code: 'PC7', name: '大陵', reading: 'だいりょう', meridian: 'PC', meridianName: '手の厥陰心包経', region: '手関節', location: '手関節掌側横紋上、長掌筋腱と橈側手根屈筋腱の間', specialPoints: ['原穴', '五兪穴：兪（土）'], importance: 'A', memoryTip: '手関節横紋の中央＝原穴＝輸土穴。手根管症候群・精神不安', examPoint: '原穴・輸土穴の一致／神門（尺側）との位置区別' }),
  A({ slug: 'pc8', code: 'PC8', name: '労宮', reading: 'ろうきゅう', meridian: 'PC', meridianName: '手の厥陰心包経', region: '手掌', location: '手掌、第2・第3中手骨間、中手指節関節の近位陥凹部、握ったとき中指頭が当たる所', specialPoints: ['五兪穴：滎（火）'], importance: 'B', memoryTip: '握って中指が当たる＝滎火穴。手掌多汗・口内炎', examPoint: '滎火穴・握って中指の当たる位置' }),
  A({ slug: 'pc9', code: 'PC9', name: '中衝', reading: 'ちゅうしょう', meridian: 'PC', meridianName: '手の厥陰心包経', region: '中指', location: '中指、中指先端中央（末節骨尖端の中央）', specialPoints: ['五兪穴：井（木）'], importance: 'B', memoryTip: '中指の先＝心包経の井木穴。意識障害・熱中症に点刺', examPoint: '井木穴・中指尖端／救急での刺絡' }),

  /* ── 手の少陽三焦経 ───────────────────────── */
  A({ slug: 'te3', code: 'TE3', name: '中渚', reading: 'ちゅうしょ', meridian: 'TE', meridianName: '手の少陽三焦経', region: '手背', location: '第4・第5中手骨間、第4中手指節関節近位の陥凹部', specialPoints: ['五兪穴：兪（木）'], importance: 'C', memoryTip: '陽経の輸は木。難聴・耳鳴・偏頭痛', examPoint: '輸木穴' }),
  A({ slug: 'te4', code: 'TE4', name: '陽池', reading: 'ようち', meridian: 'TE', meridianName: '手の少陽三焦経', region: '手関節', location: '手関節後面、総指伸筋腱の尺側の陥凹部、手関節背側横紋上', specialPoints: ['原穴'], importance: 'B', memoryTip: '手関節背側・総指伸筋腱の尺側＝三焦経の原穴', examPoint: '原穴であること・手関節背側の取穴' }),
  A({ slug: 'te5', code: 'TE5', name: '外関', reading: 'がいかん', meridian: 'TE', meridianName: '手の少陽三焦経', region: '前腕', location: '前腕後面、橈骨と尺骨の骨間、手関節背側横紋の上方2寸', specialPoints: ['絡穴', '八脈交会穴（陽維脈）'], importance: 'S', memoryTip: '内関の裏側（背側）2寸。絡穴かつ陽維脈。かぜ・片頭痛・上肢痛', examPoint: '絡穴・八脈交会穴（陽維脈）／内関の反対側という位置' }),
  A({ slug: 'te6', code: 'TE6', name: '支溝', reading: 'しこう', meridian: 'TE', meridianName: '手の少陽三焦経', region: '前腕', location: '前腕後面、橈骨と尺骨の骨間、手関節背側横紋の上方3寸', specialPoints: ['五兪穴：経（火）'], importance: 'B', memoryTip: '外関の上1寸＝経火穴。便秘・脇痛', examPoint: '経火穴・便秘への使用' }),
  A({ slug: 'te7', code: 'TE7', name: '会宗', reading: 'えそう', meridian: 'TE', meridianName: '手の少陽三焦経', region: '前腕', location: '尺骨橈側縁、手関節背側横紋の上方3寸（支溝の尺側）', specialPoints: ['郄穴'], importance: 'C', memoryTip: '三焦経の郄穴。支溝の隣', examPoint: '郄穴であること' }),
  A({ slug: 'te10', code: 'TE10', name: '天井', reading: 'てんせい', meridian: 'TE', meridianName: '手の少陽三焦経', region: '肘', location: '肘頭の上方1寸の陥凹部', specialPoints: ['五兪穴：合（土）'], importance: 'C', memoryTip: '肘頭の上1寸＝合土穴', examPoint: '合土穴・肘頭上方' }),
  A({ slug: 'te17', code: 'TE17', name: '翳風', reading: 'えいふう', meridian: 'TE', meridianName: '手の少陽三焦経', region: '前頸部', location: '乳様突起下端前方、耳垂後方の陥凹部', specialPoints: [], importance: 'B', memoryTip: '耳たぶの後ろの陥凹。顔面神経麻痺・耳疾患・耳下腺炎', examPoint: '耳垂後方・乳様突起前という位置／顔面神経麻痺への使用' }),
  A({ slug: 'te23', code: 'TE23', name: '糸竹空', reading: 'しちくくう', meridian: 'TE', meridianName: '手の少陽三焦経', region: '頭部', location: '眉毛外端の陥凹部', specialPoints: [], aliases: ['絲竹空'], importance: 'C', memoryTip: '眉尻＝三焦経の終止穴。頭痛・眼疾', examPoint: '三焦経の終止穴・眉毛外端' }),

  /* ── 足の少陽胆経 ─────────────────────────── */
  A({ slug: 'gb2', code: 'GB2', name: '聴会', reading: 'ちょうえ', meridian: 'GB', meridianName: '足の少陽胆経', region: '顔面部', location: '珠間切痕と下顎骨関節突起の間、口を開けたときの陥凹部（聴宮の下）', specialPoints: [], importance: 'C', memoryTip: '耳前・聴宮の下。耳鳴・難聴', examPoint: '耳疾患三穴のうち最も下' }),
  A({ slug: 'gb14', code: 'GB14', name: '陽白', reading: 'ようはく', meridian: 'GB', meridianName: '足の少陽胆経', region: '頭部', location: '眉毛中央の上方1寸、瞳孔の直上', specialPoints: [], importance: 'C', memoryTip: '眉の上1寸。前頭部痛・顔面神経麻痺（額のしわ寄せ不能）', examPoint: '瞳孔直上・眉上1寸／顔面神経麻痺への使用' }),
  A({ slug: 'gb20', code: 'GB20', name: '風池', reading: 'ふうち', meridian: 'GB', meridianName: '足の少陽胆経', region: '前頸部', location: '後頭骨の下方、胸鎖乳突筋と僧帽筋起始部の間の陥凹部', specialPoints: [], importance: 'S', memoryTip: '「風」がたまる「池」＝かぜ・頭痛・眩暈・眼精疲労。天柱よりやや外上方', examPoint: '胸鎖乳突筋と僧帽筋の間／天柱（膀胱経）との位置区別・風邪への使用' }),
  A({ slug: 'gb21', code: 'GB21', name: '肩井', reading: 'けんせい', meridian: 'GB', meridianName: '足の少陽胆経', region: '後頸部', location: '第7頸椎棘突起と肩峰外縁を結ぶ線の中点', specialPoints: [], importance: 'A', memoryTip: '肩の「井戸」＝肩こりの代表穴。深刺で気胸のリスク・妊婦は慎重', examPoint: '第7頸椎棘突起と肩峰の中点／気胸のリスク・妊婦への配慮' }),
  A({ slug: 'gb24', code: 'GB24', name: '日月', reading: 'じつげつ', meridian: 'GB', meridianName: '足の少陽胆経', region: '前胸部', location: '第7肋間、前正中線の外方4寸（期門の1肋間下）', specialPoints: ['胆経の募穴'], importance: 'A', memoryTip: '胆の募穴は自経（胆経）上。期門（肝の募穴）の1肋間下', examPoint: '募穴（胆）であること・期門との位置関係' }),
  A({ slug: 'gb25', code: 'GB25', name: '京門', reading: 'けいもん', meridian: 'GB', meridianName: '足の少陽胆経', region: '側腹部', location: '第12肋骨端下縁', specialPoints: ['腎の募穴'], importance: 'A', memoryTip: '腎の募穴は胆経上（第12肋骨先端）。腎の募が背側寄りにあるのが特徴', examPoint: '募穴（腎）であること・第12肋骨端という位置' }),
  A({ slug: 'gb30', code: 'GB30', name: '環跳', reading: 'かんちょう', meridian: 'GB', meridianName: '足の少陽胆経', region: '殿部', location: '大転子頂点と仙骨裂孔を結ぶ線上、大転子頂点から1/3の陥凹部', specialPoints: [], importance: 'A', memoryTip: '殿部の深部。坐骨神経痛・下肢痛の代表穴', examPoint: '大転子と仙骨裂孔の外1/3／坐骨神経痛への使用' }),
  A({ slug: 'gb31', code: 'GB31', name: '風市', reading: 'ふうし', meridian: 'GB', meridianName: '足の少陽胆経', region: '大腿', location: '大腿外側の中央、直立して手を下ろしたとき中指先端が当たる所', specialPoints: [], importance: 'B', memoryTip: '気をつけの姿勢で中指が当たる＝風市。下肢の痺れ・掻痒', examPoint: '中指到達点という取穴法' }),
  A({ slug: 'gb34', code: 'GB34', name: '陽陵泉', reading: 'ようりょうせん', meridian: 'GB', meridianName: '足の少陽胆経', region: '下腿', location: '腓骨頭前下方の陥凹部', specialPoints: ['五兪穴：合（土）', '胆の下合穴', '八会穴（筋会）'], importance: 'S', memoryTip: '腓骨頭の前下＝合土穴＝下合穴＝筋会。筋・腱の疾患、下肢痛', examPoint: '合土穴・下合穴・八会穴（筋会）の三役／腓骨頭前下方' }),
  A({ slug: 'gb36', code: 'GB36', name: '外丘', reading: 'がいきゅう', meridian: 'GB', meridianName: '足の少陽胆経', region: '下腿', location: '腓骨の前方、外果尖の上方7寸', specialPoints: ['郄穴'], importance: 'C', memoryTip: '胆経の郄穴。光明のやや上・後ろ', examPoint: '郄穴であること' }),
  A({ slug: 'gb37', code: 'GB37', name: '光明', reading: 'こうめい', meridian: 'GB', meridianName: '足の少陽胆経', region: '下腿', location: '腓骨の前方、外果尖の上方5寸', specialPoints: ['絡穴'], importance: 'A', memoryTip: '「光明」＝目の症状。胆経の絡穴、肝経へ絡む', examPoint: '絡穴であること・眼疾患への使用（名前と主治が一致）' }),
  A({ slug: 'gb39', code: 'GB39', name: '懸鍾', reading: 'けんしょう', meridian: 'GB', meridianName: '足の少陽胆経', region: '下腿', location: '腓骨の前方、外果尖の上方3寸', specialPoints: ['八会穴（髄会）'], aliases: ['絶骨', '懸鐘'], importance: 'A', memoryTip: '別名「絶骨」。髄会。外果上3寸。頸項強ばり・下肢痿弱', examPoint: '八会穴（髄会）・別名「絶骨」・外果上3寸' }),
  A({ slug: 'gb40', code: 'GB40', name: '丘墟', reading: 'きゅうきょ', meridian: 'GB', meridianName: '足の少陽胆経', region: '足関節', location: '外果の前下方、長趾伸筋腱の外側の陥凹部', specialPoints: ['原穴'], aliases: ['丘虚'], importance: 'A', memoryTip: '外果の前下＝胆経の原穴', examPoint: '原穴であること・外果前下方' }),
  A({ slug: 'gb41', code: 'GB41', name: '足臨泣', reading: 'あしりんきゅう', meridian: 'GB', meridianName: '足の少陽胆経', region: '足背', location: '第4・第5中足骨底接合部の遠位、第5趾の長趾伸筋腱の外側の陥凹部', specialPoints: ['五兪穴：兪（木）', '八脈交会穴（帯脈）'], importance: 'A', memoryTip: '輸木穴かつ帯脈に通じる。外関と組む。偏頭痛・めまい', examPoint: '輸木穴・八脈交会穴（帯脈）／外関との配穴' }),
  A({ slug: 'gb43', code: 'GB43', name: '侠渓', reading: 'きょうけい', meridian: 'GB', meridianName: '足の少陽胆経', region: '足背', location: '第4・第5足趾間、みずかきの後縁、赤白肉際', specialPoints: ['五兪穴：滎（水）'], importance: 'C', memoryTip: '陽経の滎は水。趾間の位置', examPoint: '滎水穴' }),
  A({ slug: 'gb44', code: 'GB44', name: '足竅陰', reading: 'あしきょういん', meridian: 'GB', meridianName: '足の少陽胆経', region: '足の第4趾', location: '第4趾、末節骨外側、爪甲角の近位外方1分', specialPoints: ['五兪穴：井（金）'], importance: 'C', memoryTip: '胆経の最終穴＝井金穴', examPoint: '井金穴・胆経の終止穴' }),

  /* ── 足の厥陰肝経 ─────────────────────────── */
  A({ slug: 'lr1', code: 'LR1', name: '大敦', reading: 'だいとん', meridian: 'LR', meridianName: '足の厥陰肝経', region: '足の第1趾', location: '足の第1趾、末節骨外側、爪甲角の近位外方1分', specialPoints: ['五兪穴：井（木）'], importance: 'B', memoryTip: '肝経の起始＝井木穴（肝は木、本経なので木木）。疝痛・遺尿', examPoint: '井木穴・肝経の起始／陰経の井＝木' }),
  A({ slug: 'lr2', code: 'LR2', name: '行間', reading: 'こうかん', meridian: 'LR', meridianName: '足の厥陰肝経', region: '足背', location: '第1・第2足趾間、みずかきの後縁、赤白肉際', specialPoints: ['五兪穴：滎（火）'], importance: 'B', memoryTip: '第1・2趾間＝滎火穴。肝火・目の充血・頭痛を瀉す', examPoint: '滎火穴・肝陽上亢（怒り・頭痛）への使用' }),
  A({ slug: 'lr3', code: 'LR3', name: '太衝', reading: 'たいしょう', meridian: 'LR', meridianName: '足の厥陰肝経', region: '足背', location: '第1・第2中足骨間、中足骨底接合部遠位の陥凹部、足背動脈拍動部', specialPoints: ['原穴', '五兪穴：兪（土）'], importance: 'S', memoryTip: '足背の拍動部＝原穴＝輸土穴。合谷と合わせて「四関穴」。ストレス・頭痛・月経不順', examPoint: '原穴・輸土穴の一致／合谷との「四関穴」／足背動脈拍動部' }),
  A({ slug: 'lr4', code: 'LR4', name: '中封', reading: 'ちゅうほう', meridian: 'LR', meridianName: '足の厥陰肝経', region: '足関節', location: '前脛骨筋腱内側の陥凹部、内果尖の前方', specialPoints: ['五兪穴：経（金）'], importance: 'C', memoryTip: '内果の前＝経金穴', examPoint: '経金穴・内果前方' }),
  A({ slug: 'lr5', code: 'LR5', name: '蠡溝', reading: 'れいこう', meridian: 'LR', meridianName: '足の厥陰肝経', region: '下腿', location: '脛骨内側面の中央、内果尖の上方5寸', specialPoints: ['絡穴'], importance: 'B', memoryTip: '肝経の絡穴。胆経へ絡む。陰部掻痒・月経異常', examPoint: '絡穴であること・脛骨内側面上という位置（三陰交は脛骨後縁）' }),
  A({ slug: 'lr6', code: 'LR6', name: '中都', reading: 'ちゅうと', meridian: 'LR', meridianName: '足の厥陰肝経', region: '下腿', location: '脛骨内側面の中央、内果尖の上方7寸', specialPoints: ['郄穴'], importance: 'C', memoryTip: '肝経の郄穴。蠡溝の上2寸。急性の下腹部痛・崩漏', examPoint: '郄穴であること' }),
  A({ slug: 'lr8', code: 'LR8', name: '曲泉', reading: 'きょくせん', meridian: 'LR', meridianName: '足の厥陰肝経', region: '膝', location: '膝内側、膝を屈曲したときにできる膝窩横紋内端、半腱・半膜様筋腱内側の陥凹部', specialPoints: ['五兪穴：合（水）'], importance: 'C', memoryTip: '膝窩横紋の内端＝合水穴', examPoint: '合水穴・膝窩内端' }),
  A({ slug: 'lr13', code: 'LR13', name: '章門', reading: 'しょうもん', meridian: 'LR', meridianName: '足の厥陰肝経', region: '側腹部', location: '第11肋骨端下縁', specialPoints: ['脾の募穴', '八会穴（臓会）'], importance: 'A', memoryTip: '第11肋骨端。脾の募穴かつ臓会。募穴が他経（肝経）にある例', examPoint: '募穴（脾）・八会穴（臓会）／募穴が肝経上にあること' }),
  A({ slug: 'lr14', code: 'LR14', name: '期門', reading: 'きもん', meridian: 'LR', meridianName: '足の厥陰肝経', region: '前胸部', location: '第6肋間、前正中線の外方4寸（乳頭中央の下方2肋間）', specialPoints: ['肝の募穴'], importance: 'A', memoryTip: '肝の募穴は自経（肝経）上。第6肋間。肝兪と俞募配穴', examPoint: '募穴（肝）・第6肋間／肝兪との配穴／肝経の終止穴' }),

  /* ── 任脈 ─────────────────────────────────── */
  A({ slug: 'cv3', code: 'CV3', name: '中極', reading: 'ちゅうきょく', meridian: 'CV', meridianName: '任脈', region: '下腹部', location: '前正中線上、臍中央の下方4寸', specialPoints: ['膀胱の募穴'], importance: 'A', memoryTip: '臍下4寸＝膀胱の募穴。頻尿・尿閉・月経不順', examPoint: '募穴（膀胱）・臍下4寸' }),
  A({ slug: 'cv4', code: 'CV4', name: '関元', reading: 'かんげん', meridian: 'CV', meridianName: '任脈', region: '下腹部', location: '前正中線上、臍中央の下方3寸', specialPoints: ['小腸の募穴'], importance: 'S', memoryTip: '臍下3寸＝小腸の募穴。元気を関する。冷え・虚労・強壮の灸', examPoint: '募穴（小腸）・臍下3寸／保健灸（強壮）の代表穴' }),
  A({ slug: 'cv5', code: 'CV5', name: '石門', reading: 'せきもん', meridian: 'CV', meridianName: '任脈', region: '下腹部', location: '前正中線上、臍中央の下方2寸', specialPoints: ['三焦の募穴'], importance: 'A', memoryTip: '臍下2寸＝三焦の募穴。古典的には妊娠を避ける穴とされる', examPoint: '募穴（三焦）・臍下2寸' }),
  A({ slug: 'cv6', code: 'CV6', name: '気海', reading: 'きかい', meridian: 'CV', meridianName: '任脈', region: '下腹部', location: '前正中線上、臍中央の下方1.5寸', specialPoints: [], importance: 'A', memoryTip: '臍下1.5寸＝「気の海」。倦怠・虚弱・下焦の虚に灸', examPoint: '臍下1.5寸という位置／強壮の灸' }),
  A({ slug: 'cv8', code: 'CV8', name: '神闕', reading: 'しんけつ', meridian: 'CV', meridianName: '任脈', region: '上腹部', location: '臍の中央', specialPoints: [], importance: 'B', memoryTip: '臍そのもの。禁鍼、隔物灸（塩・生姜）で用いる。下痢・脱陽', examPoint: '臍中央＝禁鍼穴・隔物灸の適応' }),
  A({ slug: 'cv12', code: 'CV12', name: '中脘', reading: 'ちゅうかん', meridian: 'CV', meridianName: '任脈', region: '上腹部', location: '前正中線上、臍中央の上方4寸（胸骨体下端と臍の中点）', specialPoints: ['胃の募穴', '八会穴（腑会）'], importance: 'S', memoryTip: '臍上4寸＝胃の募穴＝腑会。胃腸疾患全般の要穴', examPoint: '募穴（胃）・八会穴（腑会）／臍上4寸' }),
  A({ slug: 'cv17', code: 'CV17', name: '膻中', reading: 'だんちゅう', meridian: 'CV', meridianName: '任脈', region: '前胸部', location: '前正中線上、第4肋間と同じ高さ（両乳頭を結ぶ線の中点）', specialPoints: ['心包の募穴', '八会穴（気会）'], importance: 'S', memoryTip: '両乳頭の中点＝心包の募穴＝気会。胸苦しさ・呼吸器・気の病', examPoint: '募穴（心包）・八会穴（気会）／第4肋間の高さ' }),
  A({ slug: 'cv22', code: 'CV22', name: '天突', reading: 'てんとつ', meridian: 'CV', meridianName: '任脈', region: '前頸部', location: '前正中線上、頸窩（胸骨頸切痕上方）の中央', specialPoints: [], importance: 'B', memoryTip: '胸骨上窩＝天突。咳・喘息・咽喉の異物感。刺鍼方向に注意', examPoint: '胸骨上窩という位置／刺鍼の危険（気管・大血管）' }),
  A({ slug: 'cv23', code: 'CV23', name: '廉泉', reading: 'れんせん', meridian: 'CV', meridianName: '任脈', region: '前頸部', location: '前正中線上、喉頭隆起上方、舌骨上方の陥凹部', specialPoints: [], importance: 'C', memoryTip: '舌骨の上。嚥下障害・構音障害・失語', examPoint: '舌骨上方という位置／嚥下障害への使用' }),
  A({ slug: 'cv24', code: 'CV24', name: '承漿', reading: 'しょうしょう', meridian: 'CV', meridianName: '任脈', region: '顔面部', location: 'オトガイ唇溝の中央の陥凹部', specialPoints: [], importance: 'C', memoryTip: '下唇の下のくぼみ＝任脈の終止穴。顔面神経麻痺・流涎', examPoint: '任脈の終止穴・オトガイ唇溝中央' }),

  /* ── 督脈 ─────────────────────────────────── */
  A({ slug: 'gv1', code: 'GV1', name: '長強', reading: 'ちょうきょう', meridian: 'GV', meridianName: '督脈', region: '会陰部', location: '尾骨下端と肛門の中央', specialPoints: ['絡穴（督脈）'], importance: 'B', memoryTip: '尾骨の下＝督脈の絡穴。痔・脱肛・便血', examPoint: '督脈の絡穴・尾骨下端／痔疾への使用' }),
  A({ slug: 'gv3', code: 'GV3', name: '腰陽関', reading: 'こしようかん', meridian: 'GV', meridianName: '督脈', region: '腰部', location: '後正中線上、第4腰椎棘突起下方の陥凹部（ヤコビー線の高さ）', specialPoints: [], importance: 'B', memoryTip: 'ヤコビー線＝第4腰椎棘突起下。腰痛・下肢の冷え', examPoint: '第4腰椎棘突起下＝ヤコビー線の高さ' }),
  A({ slug: 'gv4', code: 'GV4', name: '命門', reading: 'めいもん', meridian: 'GV', meridianName: '督脈', region: '腰部', location: '後正中線上、第2腰椎棘突起下方の陥凹部', specialPoints: [], importance: 'A', memoryTip: '第2腰椎棘突起下＝腎兪と同じ高さ。「命の門」＝腎陽虚・腰痛・冷え', examPoint: '第2腰椎棘突起下／腎兪と同じ高さ' }),
  A({ slug: 'gv9', code: 'GV9', name: '至陽', reading: 'しよう', meridian: 'GV', meridianName: '督脈', region: '背部', location: '後正中線上、第7胸椎棘突起下方の陥凹部（肩甲骨下角の高さ）', specialPoints: [], importance: 'B', memoryTip: '肩甲骨下角の高さ＝第7胸椎＝膈兪と同じ高さ。黄疸・胸背痛', examPoint: '第7胸椎棘突起下＝肩甲骨下角の高さ' }),
  A({ slug: 'gv14', code: 'GV14', name: '大椎', reading: 'だいつい', meridian: 'GV', meridianName: '督脈', region: '後頸部', location: '後正中線上、第7頸椎棘突起下方の陥凹部', specialPoints: [], importance: 'S', memoryTip: '首を前屈して最も突出する棘突起の下＝第7頸椎。発熱・かぜ・「諸陽の会」', examPoint: '第7頸椎棘突起下／発熱・感冒への使用／手足三陽経と督脈の交会' }),
  A({ slug: 'gv16', code: 'GV16', name: '風府', reading: 'ふうふ', meridian: 'GV', meridianName: '督脈', region: '後頸部', location: '後正中線上、外後頭隆起の直下、左右の僧帽筋間の陥凹部', specialPoints: [], importance: 'B', memoryTip: '「風」が集まる「府」。項強・頭痛・失語。深刺は延髄損傷の危険', examPoint: '外後頭隆起直下／深刺の危険（延髄）' }),
  A({ slug: 'gv20', code: 'GV20', name: '百会', reading: 'ひゃくえ', meridian: 'GV', meridianName: '督脈', region: '頭部', location: '頭頂部、前正中線上、両耳尖を結ぶ線との交点、前髪際の後方5寸', specialPoints: [], importance: 'S', memoryTip: '「百脈の会」＝頭頂。頭痛・眩暈・脱肛・うつ。灸で昇提', examPoint: '両耳尖を結ぶ線と正中線の交点／脱肛・内臓下垂への昇提の灸' }),
  A({ slug: 'gv24', code: 'GV24', name: '神庭', reading: 'しんてい', meridian: 'GV', meridianName: '督脈', region: '頭部', location: '前正中線上、前髪際の後方5分', specialPoints: [], importance: 'C', memoryTip: '前髪際の中央から5分。前頭部痛・不眠・鼻疾患', examPoint: '前髪際後方5分という位置' }),
  A({ slug: 'gv26', code: 'GV26', name: '水溝', reading: 'すいこう', meridian: 'GV', meridianName: '督脈', region: '顔面部', location: '人中溝の中点よりやや上方（上から1/3）', specialPoints: [], importance: 'A', memoryTip: '別名「人中」。人中溝の上1/3。ショック・失神・意識障害の救急穴', examPoint: '別名「人中」・人中溝上1/3／救急（意識障害）への使用' }),
]

export function getAcupointBySlug(slug: string): Acupoint | undefined {
  return ACUPOINTS.find((a) => a.slug === slug)
}
