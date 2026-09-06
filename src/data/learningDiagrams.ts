/* ──────────────────────────────────────────────────────────────
   学習用図解（クイズ回答後に表示）
   - すべて自作のオリジナルSVG（/public/learning-diagrams/）
   - 他サイト・教科書の画像は転載しない
   ────────────────────────────────────────────────────────────── */

export type LearningDiagram = {
  id: string
  file: string
  title: string
  /** SVGの内容を説明するテキスト（alt相当・アクセシビリティ用） */
  alt: string
  /** 図の下に表示する補足 */
  caption: string
}

export const LEARNING_DIAGRAMS: Record<string, LearningDiagram> = {
  'five-shu-points': {
    id: 'five-shu-points',
    file: '/learning-diagrams/five-shu-points.svg',
    title: '五兪穴と五行配当',
    alt: '井・滎・輸・経・合の五兪穴について、陰経は木火土金水、陽経は金水木火土の順に五行が配当されることを示した表。',
    caption: '陰経は「木」から、陽経は「金」から始まる。',
  },
  'eight-influential': {
    id: 'eight-influential',
    file: '/learning-diagrams/eight-influential.svg',
    title: '八会穴',
    alt: '臓会・章門、腑会・中脘、気会・膻中、血会・膈兪、筋会・陽陵泉、脈会・太淵、骨会・大杼、髄会・懸鍾（絶骨）の対応を示した表。',
    caption: '「臓腑気血・筋脈骨髄」の8つの会穴。',
  },
  'front-mu': {
    id: 'front-mu',
    file: '/learning-diagrams/front-mu.svg',
    title: '主な募穴（体幹前面）',
    alt: '体幹前面の模式図に、中府（肺）、膻中（心包）、期門（肝）、日月（胆）、中脘（胃）、章門（脾）、天枢（大腸）、石門（三焦）、関元（小腸）、中極（膀胱）、京門（腎）のおおよその位置を示した図。',
    caption: '募穴は胸腹部にあり、臓腑の急性期・実証に反応が出やすい。',
  },
  'back-shu': {
    id: 'back-shu',
    file: '/learning-diagrams/back-shu.svg',
    title: '背部兪穴と椎骨の高さ',
    alt: '脊柱の模式図に、肺兪（第3胸椎）、心兪（第5胸椎）、膈兪（第7胸椎＝肩甲骨下角）、肝兪（第9胸椎）、脾兪（第11胸椎）、胃兪（第12胸椎）、腎兪（第2腰椎＝命門）、大腸兪（第4腰椎＝ヤコビー線）の高さを示した図。',
    caption: '背部兪穴はすべて後正中線の外方1.5寸。高さの目安を体表指標と結びつける。',
  },
  'four-command': {
    id: 'four-command',
    file: '/learning-diagrams/four-command.svg',
    title: '四総穴',
    alt: '人体の模式図に、肚腹＝足三里、腰背＝委中、頭項＝列缺、面口＝合谷の対応を示した図。',
    caption: '「四総穴の歌」：肚腹三里、腰背委中、頭項列缺、面口合谷。',
  },
  'eight-confluent': {
    id: 'eight-confluent',
    file: '/learning-diagrams/eight-confluent.svg',
    title: '八脈交会穴の配穴',
    alt: '公孫（衝脈）と内関（陰維脈）、後渓（督脈）と申脈（陽蹻脈）、足臨泣（帯脈）と外関（陽維脈）、列缺（任脈）と照海（陰蹻脈）の4組の配穴を示した表。',
    caption: '上肢の穴と下肢の穴を1組にして用いる。',
  },
  'five-phases': {
    id: 'five-phases',
    file: '/learning-diagrams/five-phases.svg',
    title: '五行の相生・相克',
    alt: '木・火・土・金・水を五角形に配置し、外周の矢印で相生（木→火→土→金→水→木）、星形の矢印で相克（木→土→水→火→金→木）を示した図。',
    caption: '相生は隣へ、相克は一つ飛ばし。',
  },
  sp6: {
    id: 'sp6',
    file: '/learning-diagrams/sp6.svg',
    title: '三陰交の位置',
    alt: '下腿内側の模式図に、内果尖から上方3寸、脛骨内縁の後方に三陰交がある様子を示した図。',
    caption: '内果尖の上3寸・脛骨内縁のすぐ後ろ。脾・肝・腎の三陰経が交わる。',
  },
  st36: {
    id: 'st36',
    file: '/learning-diagrams/st36.svg',
    title: '足三里の位置',
    alt: '下腿前面の模式図に、犢鼻（膝蓋靱帯外方の陥凹）の下方3寸、脛骨前縁の外方1横指に足三里がある様子を示した図。',
    caption: '犢鼻の下3寸・脛骨稜の外1横指。合土穴かつ胃の下合穴。',
  },
  li4: {
    id: 'li4',
    file: '/learning-diagrams/li4.svg',
    title: '合谷の位置',
    alt: '手背の模式図に、第2中手骨中点の橈側に合谷がある様子を示した図。',
    caption: '第2中手骨の中点、母指側。大腸経の原穴・四総穴（面口）。',
  },
  'meridian-stomach': {
    id: 'meridian-stomach',
    file: '/learning-diagrams/meridian-stomach.svg',
    title: '足の陽明胃経の走行（模式）',
    alt: '顔面から始まり、頸・胸腹部（前正中線の外方）を下り、大腿前面・下腿前外側を通って足の第2趾外側（厲兌）に終わる胃経の走行を線で示した模式図。',
    caption: '陽明経は体の前面を走る。起始は承泣、終止は厲兌。',
  },
}

export function getDiagram(id?: string): LearningDiagram | null {
  if (!id) return null
  return LEARNING_DIAGRAMS[id] ?? null
}

export const ALL_DIAGRAMS = Object.values(LEARNING_DIAGRAMS)
