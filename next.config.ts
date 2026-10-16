import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

// Cloudflare Pages などの静的ホスティング向けに、全ページを out/ へ静的出力する。
// 管理ページ（src/app/admin の *.dev.tsx）は next dev でだけ有効にし、
// 本番ビルドの出力には含めない。
export default function nextConfig(phase: string): NextConfig {
  const dev = phase === PHASE_DEVELOPMENT_SERVER;
  return {
    output: "export",
    pageExtensions: dev ? ["dev.tsx", "tsx", "ts", "jsx", "js"] : ["tsx", "ts", "jsx", "js"],
  };
}
