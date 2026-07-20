// OGP 画像 描画コア（描画＋簿記）。
//
// CLI（render.mjs＝単発/部分, fail-fast）と一括再生成（regenerate.mjs＝robust）が共有する。
// 1 件の確定値を検証（prepareItem）し、テンプレートに流し込んで PNG 化しつつ、記録の書き込みと
// 図版の永続コピーという「簿記」を行う（renderPrepared）。マニフェストの更新方式（upsert / rebuild）は
// 呼び出し側が決めるので、ここでは触らない。

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs"
import { dirname, join, resolve, isAbsolute } from "node:path"
import { fileURLToPath } from "node:url"
import { Resvg } from "@resvg/resvg-js"
import { fillTemplate } from "./build-svg.mjs"
import { copyFigureIntoData, writeRecord } from "./record.mjs"
import { routeKey } from "../config.mjs"

const HERE = dirname(fileURLToPath(import.meta.url)) // ogimage/lib
const OGIMAGE_DIR = resolve(HERE, "..") // ogimage
const REPO_ROOT = resolve(OGIMAGE_DIR, "..") // リポジトリのルート

export const TEMPLATE_DIR = join(OGIMAGE_DIR, "template")
export const DEFAULT_FONTS_DIR = join(OGIMAGE_DIR, "fonts")
export const DEFAULT_DATA_DIR = join(OGIMAGE_DIR, "data")
export const DEFAULT_MANIFEST = join(REPO_ROOT, "app/src/lib/meta/og-manifest.json")
export const DEFAULT_OUT_DIR = join(REPO_ROOT, "app/static/ogp")

export const VARIATIONS = new Set(["default", "title-only", "nested", "nested-fig"])

/** 相対パスはリポジトリのルートではなく実行時 cwd 基準で解決する（ユーザーが渡すパス向け）。 */
export const resolveFromCwd = (p) => (isAbsolute(p) ? p : resolve(process.cwd(), p))

/**
 * 1 件の確定値を検証し、描画に必要な値へ整形する。不正なら例外を投げる（呼び出し側で握る）。
 * figure は絶対パス or cwd 基準の相対パスで受け取る（regenerate は data 基準の相対を絶対に解決してから渡す）。
 * @param {object} item
 * @returns {{ variation: string, key: string, out: string, title: string, titleLines: string[], crumbs: string[], figure: string | undefined }}
 */
export const prepareItem = (item) => {
  const variation = item.variation
  if (!VARIATIONS.has(variation)) {
    throw new Error(`variation が不正です: ${JSON.stringify(variation)}（default|title-only|nested|nested-fig）`)
  }

  const key = item.route != null ? routeKey(item.route) : ""

  // 出力先
  let out
  if (item.out) out = resolveFromCwd(item.out)
  else if (key) out = join(DEFAULT_OUT_DIR, `${key}.png`)
  else throw new Error(`out も route も無いため出力先を決められません（variation=${variation}）`)

  const title = item.title ?? (Array.isArray(item.titleLines) ? item.titleLines.join("") : "")
  const titleLines =
    Array.isArray(item.titleLines) && item.titleLines.length > 0
      ? item.titleLines
      : title
        ? [title]
        : []

  if (variation !== "default" && titleLines.length === 0) {
    throw new Error(`title / titleLines が必要です（variation=${variation}, route=${item.route ?? "?"}）`)
  }
  if (titleLines.length > 2) {
    throw new Error(`タイトルは最大 2 行です（${titleLines.length} 行が渡されました, route=${item.route ?? "?"}）`)
  }

  const needsCrumbs = variation === "nested" || variation === "nested-fig"
  const crumbs = Array.isArray(item.crumbs) ? item.crumbs : []
  if (needsCrumbs && crumbs.length === 0) {
    throw new Error(`crumbs が必要です（variation=${variation}, route=${item.route ?? "?"}）`)
  }

  let figure
  if (variation === "nested-fig") {
    if (!item.figure) throw new Error(`nested-fig には figure（図版パス）が必要です（route=${item.route ?? "?"}）`)
    figure = resolveFromCwd(item.figure)
    if (!existsSync(figure)) throw new Error(`図版ファイルが見つかりません: ${figure}`)
  }

  return { variation, key, out, title, titleLines, crumbs, figure }
}

/**
 * 整形済み 1 件を描画（PNG 出力）し、記録の書き込み・図版の永続コピーを行う。
 * マニフェストは触らない（呼び出し側で upsert / rebuild を決める）。
 * @param {ReturnType<typeof prepareItem>} prepared
 * @param {{ fontOptions: object, dataDir?: string, noRecord?: boolean }} ctx
 * @returns {{ key: string, title: string, variation: string, out: string }}
 */
export const renderPrepared = (prepared, ctx) => {
  const templatePath = join(TEMPLATE_DIR, `${prepared.variation}.svg`)
  const template = readFileSync(templatePath, "utf8")
  const svg = fillTemplate(template, prepared.variation, {
    titleLines: prepared.titleLines,
    crumbs: prepared.crumbs,
    figure: prepared.figure
  })

  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: 1200 },
    font: ctx.fontOptions,
    background: "#ffffff"
  })
  const png = resvg.render().asPng()

  mkdirSync(dirname(prepared.out), { recursive: true })
  writeFileSync(prepared.out, png)

  // 記録の書き込み（route があり default 以外。title-only も書く＝再生成のスイープから漏れないため）
  if (!ctx.noRecord && prepared.key && prepared.variation !== "default") {
    const dataDir = ctx.dataDir ?? DEFAULT_DATA_DIR
    const figureRel = prepared.figure ? copyFigureIntoData(dataDir, prepared.key, prepared.figure) : undefined
    const record = { route: prepared.key, title: prepared.title, titleLines: prepared.titleLines }
    if (prepared.crumbs.length > 0) record.crumbs = prepared.crumbs
    if (figureRel) record.figure = figureRel
    writeRecord(dataDir, prepared.key, record)
  }

  return { key: prepared.key, title: prepared.title, variation: prepared.variation, out: prepared.out }
}
