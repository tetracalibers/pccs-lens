// テンプレート SVG のプレースホルダ（<!--TITLE--> / <!--CRUMBS--> / <!--FIGURE--> と
// {{BG}} などの配色トークン）を、確定値から組み立てた要素・値で置換する。
// バリエーションごとの座標・サイズは LAYOUT に、配色は THEMES に集約する。

import { readFileSync } from "node:fs"
import { extname } from "node:path"
import { escapeXml, layoutLines, round } from "./text.mjs"

// タイトル・crumb に使う日本語/等幅フォント。テンプレート内の静的テキスト（ロゴ・タグライン）は
// テンプレート側で font-family を持たせている。
const FONT_JA = "Zen Kaku Gothic New"
const FONT_MONO = "Reddit Mono"

/**
 * テーマ（配色）の定義。テンプレート側の静的要素はプレースホルダ（{{BG}} / {{LOGO_FILL}} /
 * {{TAGLINE_FILL}} / {{BLOB_ALPHA}}）経由で、ここで組み立てるテキストは fill 直指定で参照する。
 * どのルートがどのテーマかは config.mjs の OG_RULES（`theme`）が決める。
 *
 * `blobAlphaByVariation` はバリエーション別の上書き（0 なら装飾そのものを描かない）。
 *
 * @typedef {{ background: string, title: string, crumbLabel: string, crumbSep: string, logo: string, tagline: string, blobAlpha: number, blobAlphaByVariation?: Record<string, number> }} Palette
 * @type {Record<"light" | "dark", Palette>}
 */
export const THEMES = {
  light: {
    background: "#ffffff",
    title: "#1a1a1a",
    crumbLabel: "#55556a",
    crumbSep: "#b8b8c8",
    logo: "#1a1a1a",
    tagline: "#55556a",
    blobAlpha: 1
  },
  dark: {
    // 地色は Three.js デモの背景（app/src/lib/demo/threejs/_shared/constants.ts の
    // DEMO_BACKGROUND）と同値。デモのスクリーンショットを図版にしても継ぎ目が出ない。
    background: "#26282d",
    // 文字色はアプリのダーク時トークン（--color-heading--dark）に合わせる。
    title: "#eeeef8",
    crumbLabel: "#dadadf",
    crumbSep: "#75758c",
    logo: "#eeeef8",
    tagline: "#a3a3b8",
    // 装飾のぼかし円は暗地だと発光して見えるため、白地より控えめにする。
    blobAlpha: 0.6,
    // nested-fig だけは 0（＝描かない）。図版は地色と同じ暗地でぼかし円が乗らないので、
    // 周囲だけが光ると図版の矩形の輪郭が浮いてしまう。装飾を消して地色一様にする。
    blobAlphaByVariation: { "nested-fig": 0 }
  }
}

/**
 * テーマ名からパレットを引く（未知・未指定は light）。
 * @param {string | undefined} theme
 * @returns {Palette}
 */
export const resolvePalette = (theme) =>
  theme != null && Object.hasOwn(THEMES, theme) ? THEMES[theme] : THEMES.light

/**
 * バリエーションを加味したぼかし円の不透明度を返す。
 * @param {Palette} palette
 * @param {string} variation
 * @returns {number}
 */
const resolveBlobAlpha = (palette, variation) =>
  palette.blobAlphaByVariation?.[variation] ?? palette.blobAlpha

const BLOB_GROUP_OPEN = '<g filter="url(#blur)"'
const BLOB_GROUP_CLOSE = "</g>"

/**
 * 装飾のぼかし円のグループを丸ごと取り除く。
 * テンプレートの当該グループは `<circle>` だけを含み入れ子の `<g>` を持たないので、
 * 開始タグ以降の最初の `</g>` が終端になる。
 * @param {string} svg
 * @returns {string}
 */
const removeBlobGroup = (svg) => {
  const start = svg.indexOf(BLOB_GROUP_OPEN)
  if (start === -1) return svg
  const end = svg.indexOf(BLOB_GROUP_CLOSE, start)
  if (end === -1) return svg
  return svg.slice(0, start) + svg.slice(end + BLOB_GROUP_CLOSE.length)
}

/**
 * バリエーションごとのレイアウト定義。値はテンプレート SVG の座標に対応する。
 * title.baseline は「1 行時のベースライン y」。複数行時はここを中心に再センタリングする。
 */
export const LAYOUT = {
  "title-only": {
    title: {
      x: 600,
      baseline: 278,
      anchor: "middle",
      fontSize: 90,
      maxWidth: 1040,
      lineHeightRatio: 1.22,
      letterSpacing: -1.1,
      minFontSize: 52
    }
  },
  nested: {
    crumbs: { x: 96, y: 112, fontSize: 32, gap: 14 },
    title: {
      x: 96,
      baseline: 335,
      anchor: "start",
      fontSize: 90,
      maxWidth: 1008,
      lineHeightRatio: 1.22,
      letterSpacing: -1.1,
      minFontSize: 52
    }
  },
  "nested-fig": {
    crumbs: { x: 88, y: 106, fontSize: 28, gap: 14 },
    title: {
      x: 88,
      baseline: 300,
      anchor: "start",
      fontSize: 82,
      maxWidth: 656,
      lineHeightRatio: 1.22,
      letterSpacing: -0.8,
      minFontSize: 40
    },
    // 下辺をロゴ「Color Prism」のベースライン（テンプレートの y=572）に揃える。
    // height を保ったまま y = 572 - height としてボックス下辺を 572 に合わせ、
    // buildFigure 側で xMidYMax（下寄せ）にして実画像の下辺＝ボックス下辺にする。
    figure: { x: 772, y: 232, width: 340, height: 340 }
  }
}

/**
 * タイトル要素（複数行対応）を組み立てる。
 * @param {string[]} lines
 * @param {typeof LAYOUT["nested"]["title"]} cfg
 * @param {Palette} palette
 */
const buildTitle = (lines, cfg, palette) => {
  const { fontSize, letterSpacing, baselines } = layoutLines(lines, cfg)
  const tspans = lines
    .map((line, i) => `<tspan x="${cfg.x}" y="${round(baselines[i])}">${escapeXml(line)}</tspan>`)
    .join("")
  return (
    `<text font-family="${FONT_JA}" font-weight="700" fill="${palette.title}"` +
    ` text-anchor="${cfg.anchor}" font-size="${round(fontSize)}"` +
    ` letter-spacing="${round(letterSpacing)}">${tspans}</text>`
  )
}

/**
 * パンくず（可変個）要素を組み立てる。crumb 間に「›」セパレータを挟む。
 * @param {string[]} crumbs
 * @param {typeof LAYOUT["nested"]["crumbs"]} cfg
 * @param {Palette} palette
 */
const buildCrumbs = (crumbs, cfg, palette) => {
  const parts = []
  crumbs.forEach((crumb, i) => {
    if (i > 0) {
      parts.push(`<tspan fill="${palette.crumbSep}" dx="${cfg.gap}">›</tspan>`)
      parts.push(`<tspan fill="${palette.crumbLabel}" dx="${cfg.gap}">${escapeXml(crumb)}</tspan>`)
    } else {
      parts.push(`<tspan fill="${palette.crumbLabel}">${escapeXml(crumb)}</tspan>`)
    }
  })
  return (
    `<text font-family="${FONT_MONO}" font-weight="500" font-size="${cfg.fontSize}"` +
    ` x="${cfg.x}" y="${cfg.y}">${parts.join("")}</text>`
  )
}

/**
 * 図版（手渡し画像）を data URI 化した <image> 要素を組み立てる。
 * @param {string} figurePath
 * @param {typeof LAYOUT["nested-fig"]["figure"]} cfg
 */
const buildFigure = (figurePath, cfg) => {
  const ext = extname(figurePath).toLowerCase()
  const mime =
    ext === ".svg"
      ? "image/svg+xml"
      : ext === ".jpg" || ext === ".jpeg"
        ? "image/jpeg"
        : ext === ".webp"
          ? "image/webp"
          : "image/png"
  const base64 = readFileSync(figurePath).toString("base64")
  const href = `data:${mime};base64,${base64}`
  return (
    `<image x="${cfg.x}" y="${cfg.y}" width="${cfg.width}" height="${cfg.height}"` +
    ` href="${href}" preserveAspectRatio="xMidYMax meet"></image>`
  )
}

/**
 * 確定値からテンプレートを埋めて完成 SVG 文字列を返す。
 * @param {string} template テンプレート SVG の中身
 * @param {"default"|"title-only"|"nested"|"nested-fig"} variation
 * @param {{ titleLines?: string[], crumbs?: string[], figure?: string }} content
 * @param {"light"|"dark"} [theme] 配色（省略時 light）
 */
export const fillTemplate = (template, variation, content, theme = "light") => {
  const palette = resolvePalette(theme)
  const blobAlpha = resolveBlobAlpha(palette, variation)

  // 配色トークンは全バリエーション共通（default も通す）。
  let svg = (blobAlpha > 0 ? template : removeBlobGroup(template))
    .replaceAll("{{BG}}", palette.background)
    .replaceAll("{{LOGO_FILL}}", palette.logo)
    .replaceAll("{{TAGLINE_FILL}}", palette.tagline)
    .replaceAll("{{BLOB_ALPHA}}", String(blobAlpha))

  if (variation === "default") return svg

  const layout = LAYOUT[variation]

  if (svg.includes("<!--TITLE-->")) {
    const lines = content.titleLines ?? []
    svg = svg.replace("<!--TITLE-->", buildTitle(lines, layout.title, palette))
  }

  if (svg.includes("<!--CRUMBS-->")) {
    const crumbs = content.crumbs ?? []
    svg = svg.replace("<!--CRUMBS-->", buildCrumbs(crumbs, layout.crumbs, palette))
  }

  if (svg.includes("<!--FIGURE-->")) {
    svg = svg.replace(
      "<!--FIGURE-->",
      content.figure ? buildFigure(content.figure, layout.figure) : ""
    )
  }

  // title-only: タイトルが複数行のとき、フッター（ドット＋ロゴ）を最終行の下がり幅ぶん平行移動する。
  // タイトルは中央揃えのままなので、最終行は baseline より (baselines[last]-baseline) だけ下がる。
  // その同量ぶんフッターも下げると、文字下端↔ドットの間隔が 1 行時と一致し、全体の縦バランスも保てる。
  if (svg.includes("{{FOOTER_DY}}")) {
    const lines = content.titleLines ?? []
    const { baselines } = layoutLines(lines, layout.title)
    const dy =
      baselines.length > 0 ? round(baselines[baselines.length - 1] - layout.title.baseline) : 0
    svg = svg.replaceAll("{{FOOTER_DY}}", String(dy))
  }

  return svg
}
