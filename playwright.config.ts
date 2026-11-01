import { defineConfig } from '@playwright/test'

// 画面の動作テスト。先に `next build` で out/ を作り、本番と同じ静的出力を配信して確かめる。
// ブラウザはインストール済みの Chrome を使う（Playwright のブラウザはダウンロードしない）。
const PORT = Number(process.env.E2E_PORT ?? 3210)

export default defineConfig({
  testDir: './e2e',
  timeout: 180_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    channel: 'chrome',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'pc', use: { viewport: { width: 1280, height: 800 } } },
    { name: 'sp390', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } },
  ],
  webServer: {
    command: 'node e2e/static-server.mjs',
    url: `http://127.0.0.1:${PORT}/`,
    reuseExistingServer: false,
    timeout: 30_000,
  },
})
