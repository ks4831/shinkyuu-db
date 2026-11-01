// Playwright 用：本番と同じ静的出力（out/）を配信する小さなサーバー。
// Cloudflare Pages と同じく /past-exams/34 → out/past-exams/34.html、無ければ 404.html を返す。
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..', 'out')
const PORT = Number(process.env.E2E_PORT ?? 3210)
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml',
  '.webmanifest': 'application/manifest+json',
}

async function isFile(p) {
  try {
    return (await stat(p)).isFile()
  } catch {
    return false
  }
}

async function resolve(urlPath) {
  const clean = decodeURIComponent(urlPath.split('?')[0]).replace(/\/+$/, '') || '/index'
  const base = path.join(ROOT, path.normalize(clean))
  if (!base.startsWith(ROOT)) return null
  for (const p of [base, `${base}.html`, path.join(base, 'index.html')]) if (await isFile(p)) return p
  return null
}

createServer(async (req, res) => {
  const file = await resolve(req.url ?? '/')
  const target = file ?? path.join(ROOT, '404.html')
  try {
    const body = await readFile(target)
    res.writeHead(file ? 200 : 404, { 'content-type': TYPES[path.extname(target)] ?? 'application/octet-stream' })
    res.end(body)
  } catch {
    res.writeHead(404).end('not found')
  }
}).listen(PORT, '127.0.0.1', () => console.log(`static server on http://127.0.0.1:${PORT}`))
