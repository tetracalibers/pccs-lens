// テンプレート SVG のプレースホルダ（<!--TITLE--> / <!--CRUMBS--> / <!--FIGURE-->）を、
// 確定値から組み立てた要素で置換する。バリエーションごとの座標・サイズは LAYOUT に集約する。

import { readFileSync } from "node:fs"
import { extname } from "node:path"
import { escapeXml, layoutLines, round } from "./text.mjs"

// タイトル・crumb に使う日本語/等幅フォント。テンプレート内の静的テキスト（ロゴ・タグライン）は
// テンプレート側で font-family を持たせている。
const FONT_JA = "Zen Kaku Gothic New"
const FONT_MONO = "Reddit Mono"

const TITLE_FILL = "#1a1a1a"
const CRUMB_LABEL_FILL = "#55556a"
const CRUMB_SEP_FILL = "#b8b8c8"

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
      fontSize: 112,
      maxWidth: 1040,
      lineHeightRatio: 1.12,
      letterSpacing: -1.1,
      minFontSize: 52
    }
  },
  nested: {
    crumbs: { x: 96, y: 112, fontSize: 32, gap: 14 },
    title: {
      x: 96,
      baseline: 360,
      anchor: "start",
      fontSize: 112,
      maxWidth: 1008,
      lineHeightRatio: 1.1,
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
      lineHeightRatio: 1.12,
      letterSpacing: -0.8,
      minFontSize: 40
    },
    figure: { x: 772, y: 190, width: 340, height: 340 }
  }
}

/**
 * タイトル要素（複数行対応）を組み立てる。
 * @param {string[]} lines
 * @param {typeof LAYOUT["nested"]["title"]} cfg
 */
const buildTitle = (lines, cfg) => {
  const { fontSize, letterSpacing, baselines } = layoutLines(lines, cfg)
  const tspans = lines
    .map(
      (line, i) =>
        `<tspan x="${cfg.x}" y="${round(baselines[i])}">${escapeXml(line)}</tspan>`
    )
    .join("")
  return (
    `<text font-family="${FONT_JA}" font-weight="700" fill="${TITLE_FILL}"` +
    ` text-anchor="${cfg.anchor}" font-size="${round(fontSize)}"` +
    ` letter-spacing="${round(letterSpacing)}">${tspans}</text>`
  )
}

/**
 * パンくず（可変個）要素を組み立てる。crumb 間に「›」セパレータを挟む。
 * @param {string[]} crumbs
 * @param {typeof LAYOUT["nested"]["crumbs"]} cfg
 */
const buildCrumbs = (crumbs, cfg) => {
  const parts = []
  crumbs.forEach((crumb, i) => {
    if (i > 0) {
      parts.push(`<tspan fill="${CRUMB_SEP_FILL}" dx="${cfg.gap}">›</tspan>`)
      parts.push(`<tspan fill="${CRUMB_LABEL_FILL}" dx="${cfg.gap}">${escapeXml(crumb)}</tspan>`)
    } else {
      parts.push(`<tspan fill="${CRUMB_LABEL_FILL}">${escapeXml(crumb)}</tspan>`)
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
    ` href="${href}" preserveAspectRatio="xMidYMid meet"></image>`
  )
}

/**
 * 確定値からテンプレートを埋めて完成 SVG 文字列を返す。
 * @param {string} template テンプレート SVG の中身
 * @param {"default"|"title-only"|"nested"|"nested-fig"} variation
 * @param {{ titleLines?: string[], crumbs?: string[], figure?: string }} content
 */
export const fillTemplate = (template, variation, content) => {
  if (variation === "default") return template

  const layout = LAYOUT[variation]
  let svg = template

  if (svg.includes("<!--TITLE-->")) {
    const lines = content.titleLines ?? []
    svg = svg.replace("<!--TITLE-->", buildTitle(lines, layout.title))
  }

  if (svg.includes("<!--CRUMBS-->")) {
    const crumbs = content.crumbs ?? []
    svg = svg.replace("<!--CRUMBS-->", buildCrumbs(crumbs, layout.crumbs))
  }

  if (svg.includes("<!--FIGURE-->")) {
    svg = svg.replace("<!--FIGURE-->", content.figure ? buildFigure(content.figure, layout.figure) : "")
  }

  return svg
}
