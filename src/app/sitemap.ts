import type { MetadataRoute } from 'next'
import { subjects, themes } from '@/lib/data'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://shinkyuu-db.vercel.app'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL,                                         lastModified: now, changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${SITE_URL}/analysis/exam-34`,                   lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${SITE_URL}/analysis/exam-33`,                   lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${SITE_URL}/analysis/exam-32`,                   lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${SITE_URL}/analysis/compare/recent-3-years`,    lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${SITE_URL}/analysis/compare/33-vs-34`,          lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/subjects`,                           lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/themes`,                             lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/about`,                              lastModified: now, changeFrequency: 'yearly',  priority: 0.4 },
    { url: `${SITE_URL}/sources`,                            lastModified: now, changeFrequency: 'yearly',  priority: 0.4 },
    { url: `${SITE_URL}/disclaimer`,                         lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
  ]

  const subjectRoutes: MetadataRoute.Sitemap = subjects.map(s => ({
    url: `${SITE_URL}/subjects/${s.id}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  const themeRoutes: MetadataRoute.Sitemap = themes.map(t => ({
    url: `${SITE_URL}/themes/${t.id}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }))

  return [...staticRoutes, ...subjectRoutes, ...themeRoutes]
}
