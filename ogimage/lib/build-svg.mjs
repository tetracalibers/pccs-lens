// テンプレート SVG のプレースホルダ（<!--TITLE--> / <!--CRUMBS--> / <!--TAGLINE--> / <!--FIGURE--> と
// {{BG}} などの配色トークン）を、確定値から組み立てた要素・値で置換する。
// バリエーションごとの座標・サイズは LAYOUT に、配色は THEMES に集約する。

import { readFileSync } from "node:fs"
import { extname } from "node:path"
import { escapeXml, layoutLines, round } from "./text.mjs"

// タイトル・crumb・タグラインに使う日本語/等幅フォント。テンプレート内の静的テキスト（ロゴ）は
// テンプレート側で font-family を持たせている。
const FONT_JA = "Zen Kaku Gothic New"
const FONT_MONO = "Reddit Mono"

/**
 * サイト共通のタグライン。default（既定画像）と、`config.mjs` で `tagline: true` の
 * ルートで同じ一文を敷くので、ここに一元化する。
 * アプリ側の `SITE_DESCRIPTION`（app/src/lib/meta/og-resolve.js）と同じ文にそろえること。
 */
export const SITE_TAGLINE = "見て・触って学ぶ 色と視覚表現"

/**
 * テーマ（配色）の定義。テンプレート側の静的要素はプレースホルダ（{{BG}} / {{LOGO_FILL}} /
 * {{BLOB_ALPHA}}）経由で、ここで組み立てるテキストは fill 直指定で参照する。
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
  // default はタグラインだけ（ロゴ・ドットはテンプレートに静的に置いてある）。
  default: {
    tagline: { x: 600, baseline: 378, fontSize: 34, letterSpacing: 1.3 }
  },
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
    },
    // config.mjs で `tagline: true` のルートだけタイトルの下にタグラインを敷く。
    // 文字色・文字サイズは default と同じ（THEMES.tagline / fontSize 34）。
    // 1 行ぶん背が伸びるので、タイトルを上げ（titleBaseline）フッターを下げ（footerDy）、
    // タグライン無しのときと同じ視覚中心を保つ。gap はタイトル最終行のベースラインからの距離。
    tagline: { x: 600, fontSize: 34, letterSpacing: 1.3, titleBaseline: 256, gap: 70, footerDy: 22 }
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
 * サイト共通のタグライン要素を組み立てる。default も title-only も同じ文字色・文字サイズで、
 * ベースラインだけ呼び出し側が決める。
 * @param {{ x: number, fontSize: number, letterSpacing: number }} cfg
 * @param {number} baseline
 * @param {Palette} palette
 */
const buildTagline = (cfg, baseline, palette) =>
  `<text font-family="${FONT_JA}" x="${cfg.x}" y="${round(baseline)}" text-anchor="middle"` +
  ` font-size="${cfg.fontSize}" font-weight="500" letter-spacing="${cfg.letterSpacing}"` +
  ` fill="${palette.tagline}">${escapeXml(SITE_TAGLINE)}</text>`

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
 * @param {{ titleLines?: string[], crumbs?: string[], figure?: string, tagline?: boolean }} content
 *   `tagline` はサイト共通のタグラインを敷くか（ルートの属性。config.mjs が決める）。
 * @param {"light"|"dark"} [theme] 配色（省略時 light）
 */
export const fillTemplate = (template, variation, content, theme = "light") => {
  const palette = resolvePalette(theme)
  const blobAlpha = resolveBlobAlpha(palette, variation)

  // 配色トークンは全バリエーション共通（default も通す）。
  let svg = (blobAlpha > 0 ? template : removeBlobGroup(template))
    .replaceAll("{{BG}}", palette.background)
    .replaceAll("{{LOGO_FILL}}", palette.logo)
    .replaceAll("{{BLOB_ALPHA}}", String(blobAlpha))

  if (variation === "default") {
    // 既定画像はサイト名の下に常にタグラインを敷く（ルートの属性ではなくレイアウトそのもの）。
    const cfg = LAYOUT.default.tagline
    return svg.replace("<!--TAGLINE-->", buildTagline(cfg, cfg.baseline, palette))
  }

  const layout = LAYOUT[variation]
  const lines = content.titleLines ?? []

  // タグラインを敷くルートは、1 行ぶんの高さを確保するためタイトルのベースラインを上げる。
  const taglineCfg = content.tagline ? (layout.tagline ?? null) : null
  const titleCfg = taglineCfg
    ? { ...layout.title, baseline: taglineCfg.titleBaseline }
    : layout.title

  if (svg.includes("<!--TITLE-->")) {
    svg = svg.replace("<!--TITLE-->", buildTitle(lines, titleCfg, palette))
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

  // タイトル最終行のベースライン。タイトルは中央揃えのままなので、複数行時は 1 行時の baseline より
  // (baselines[last] - baseline) だけ下がる。タグライン・フッターはこの下がり幅に追随させる。
  const { baselines } = layoutLines(lines, titleCfg)
  const lastBaseline = baselines.length > 0 ? baselines[baselines.length - 1] : titleCfg.baseline
  const multilineDy = lastBaseline - titleCfg.baseline

  if (svg.includes("<!--TAGLINE-->")) {
    svg = svg.replace(
      "<!--TAGLINE-->",
      taglineCfg ? buildTagline(taglineCfg, lastBaseline + taglineCfg.gap, palette) : ""
    )
  }

  // title-only: フッター（ドット＋ロゴ）を、タイトルの複数行ぶん＋タグライン 1 行ぶん下げる。
  // 文字下端↔ドット・ドット↔ロゴの間隔が 1 行・タグライン無しのときと一致し、縦バランスも保てる。
  if (svg.includes("{{FOOTER_DY}}")) {
    const dy = round(multilineDy + (taglineCfg?.footerDy ?? 0))
    svg = svg.replaceAll("{{FOOTER_DY}}", String(dy))
  }

  return svg
}
