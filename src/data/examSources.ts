const BASE = 'https://ahaki.or.jp'
export const ARCHIVE_PAGE_URL = `${BASE}/exam/archives/`

export type ExamSource = {
  round: number
  year: number
  amPdfUrl: string
  pmPdfUrl: string
  answerHtmlUrl: string
  archivePageUrl: string
  reliability: 'indexed_official'
}

export const EXAM_SOURCES: ExamSource[] = [34, 33, 32, 31, 30, 29].map(round => ({
  round,
  year: round + 1992,
  amPdfUrl:       `${BASE}/wordpress/wp-content/uploads/mondai_${round}_harikyu_am.pdf`,
  pmPdfUrl:       `${BASE}/wordpress/wp-content/uploads/mondai_${round}_harikyu_pm.pdf`,
  answerHtmlUrl:  `${BASE}/examination/data/seito_${round}_hk.html`,
  archivePageUrl: ARCHIVE_PAGE_URL,
  reliability:    'indexed_official' as const,
}))

export function getExamSource(round: number): ExamSource | undefined {
  return EXAM_SOURCES.find(s => s.round === round)
}

export function getLocalPaths(round: number) {
  return {
    dir:    `docs/exams/${round}`,
    amPdf:  `docs/exams/${round}/mondai_${round}_harikyu_am.pdf`,
    pmPdf:  `docs/exams/${round}/mondai_${round}_harikyu_pm.pdf`,
    answer: `docs/exams/${round}/seito_${round}_hk.html`,
  }
}
