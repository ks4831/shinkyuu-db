import { getDiagram } from '@/data/learningDiagrams'

/** クイズ解説内の図解表示。SVGは<img>で読み込み、説明文をalt/captionで補う。 */
export default function DiagramView({ imageId }: { imageId?: string }) {
  const d = getDiagram(imageId)
  if (!d) return null
  return (
    <figure className="mt-3 rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="bg-gray-50 px-3 py-2 border-b border-gray-100">
        <figcaption className="text-xs font-semibold text-gray-600">図解：{d.title}</figcaption>
      </div>
      <div className="p-3">
        {/* 白背景のシンプルな自作SVG。装飾ではなく情報なのでalt必須。 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={d.file}
          alt={d.alt}
          className="w-full h-auto max-w-md mx-auto block"
          loading="lazy"
        />
        <p className="mt-2 text-xs text-gray-500 leading-relaxed">{d.caption}</p>
      </div>
    </figure>
  )
}
