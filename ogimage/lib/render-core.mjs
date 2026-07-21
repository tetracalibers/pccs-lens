// OGP 画像 描画コア（描画＋簿記）。
//
// CLI（render.mjs＝単発/部分, fail-fast）と一括再生成（regenerate.mjs＝robust）が共有する。
// 1 件の確定値を検証（prepareItem）し、テンプレートに流し込んで PNG 化しつつ、記録の書き込みと
// 図版の永続コピーという「簿記」を行う（renderPrepared）。マニフェストの更新方式（upsert / rebuild）は
// 呼び出し側が決めるので、ここでは触らない。

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs"
import { dirname, join, resolve, isAbsolute, extname } from "node:path"
import { fileURLToPath } from "node:url"
import { Resvg } from "@resvg/resvg-js"
import { fillTemplate } from "./build-svg.mjs"
import { isValidMagickFuzz, knockoutWhiteAll, knockoutWhiteBackground } from "./knockout.mjs"
import { copyFigureIntoData, writeRecord } from "./record.mjs"
import { routeKey } from "../config.mjs"

// knockoutWhite の magickFuzz 省略時の既定値（モード別）。all は画像全体の near-white に一律で
// 効くため、淡色を巻き込みにくいよう background より控えめにする。明示指定があればそれが優先。
/** background モード（背景連結のみ透過）の既定 fuzz。 */
export const DEFAULT_MAGICK_FUZZ_BACKGROUND = "5%"
/** all モード（全白を一律透過）の既定 fuzz。 */
export const DEFAULT_MAGICK_FUZZ_ALL = "2%"

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
 * @returns {{ variation: string, key: string, out: string, title: string, titleLines: string[], crumbs: string[], figure: string | undefined, knockoutWhite: boolean, knockoutMode: "background" | "all", magickFuzz: string }}
 */
export const prepareItem = (item) => {
  const variation = item.variation
  if (!VARIATIONS.has(variation)) {
    throw new Error(
      `variation が不正です: ${JSON.stringify(variation)}（default|title-only|nested|nested-fig）`
    )
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
    throw new Error(
      `title / titleLines が必要です（variation=${variation}, route=${item.route ?? "?"}）`
    )
  }
  if (titleLines.length > 2) {
    throw new Error(
      `タイトルは最大 2 行です（${titleLines.length} 行が渡されました, route=${item.route ?? "?"}）`
    )
  }

  const needsCrumbs = variation === "nested" || variation === "nested-fig"
  const crumbs = Array.isArray(item.crumbs) ? item.crumbs : []
  if (needsCrumbs && crumbs.length === 0) {
    throw new Error(`crumbs が必要です（variation=${variation}, route=${item.route ?? "?"}）`)
  }

  let figure
  if (variation === "nested-fig") {
    if (!item.figure)
      throw new Error(`nested-fig には figure（図版パス）が必要です（route=${item.route ?? "?"}）`)
    figure = resolveFromCwd(item.figure)
    if (!existsSync(figure)) throw new Error(`図版ファイルが見つかりません: ${figure}`)
  }

  // 白背景ノックアウト（透過）: nested-fig の PNG 図版のみ有効。ここで描画前に fail-fast 検証する。
  const knockoutWhite = item.knockoutWhite === true

  // knockoutMode は knockoutWhite: true のときだけ意味を持つ。省略時は "background"（背景連結のみ透過）。
  let knockoutMode = "background"
  if (item.knockoutMode != null) {
    if (!knockoutWhite) {
      throw new Error(
        `knockoutMode は knockoutWhite: true のときだけ指定できます（route=${item.route ?? "?"}）`
      )
    }
    if (item.knockoutMode !== "background" && item.knockoutMode !== "all") {
      throw new Error(
        `knockoutMode の値が不正です: ${JSON.stringify(item.knockoutMode)}（background|all, route=${item.route ?? "?"}）`
      )
    }
    knockoutMode = item.knockoutMode
  }

  // magickFuzz の省略時既定はモード別。明示指定があればそれを優先する。
  let magickFuzz = knockoutMode === "all" ? DEFAULT_MAGICK_FUZZ_ALL : DEFAULT_MAGICK_FUZZ_BACKGROUND
  if (knockoutWhite) {
    if (!figure) {
      throw new Error(
        `knockoutWhite は nested-fig の図版がある場合のみ指定できます（variation=${variation}, route=${item.route ?? "?"}）`
      )
    }
    if (extname(figure).toLowerCase() !== ".png") {
      throw new Error(
        `knockoutWhite は PNG 図版のみ対応です（figure=${figure}, route=${item.route ?? "?"}）`
      )
    }
    if (item.magickFuzz != null) {
      if (!isValidMagickFuzz(item.magickFuzz)) {
        throw new Error(
          `magickFuzz の値が不正です: ${JSON.stringify(item.magickFuzz)}（例: "5%", route=${item.route ?? "?"}）`
        )
      }
      magickFuzz = item.magickFuzz
    }
  }

  return {
    variation,
    key,
    out,
    title,
    titleLines,
    crumbs,
    figure,
    knockoutWhite,
    knockoutMode,
    magickFuzz
  }
}

/**
 * 整形済み 1 件を描画（PNG 出力）し、記録の書き込み・図版の永続コピーを行う。
 * マニフェストは触らない（呼び出し側で upsert / rebuild を決める）。
 * @param {ReturnType<typeof prepareItem>} prepared
 * @param {{ fontOptions: object, dataDir?: string, noRecord?: boolean }} ctx
 * @returns {{ key: string, title: string, variation: string, out: string }}
 */
export const renderPrepared = (prepared, ctx) => {
  // knockoutWhite: 手渡し PNG の背景白を透過してから、埋め込み＆永続コピーの両方に渡す。
  // 得た透過 PNG は一時ファイルなので、描画・記録が済んだら（例外時も）必ず削除する。
  let figure = prepared.figure
  let cleanupFigure = null
  if (prepared.knockoutWhite && figure) {
    const knocked =
      prepared.knockoutMode === "all"
        ? knockoutWhiteAll(figure, prepared.magickFuzz)
        : knockoutWhiteBackground(figure, prepared.magickFuzz)
    figure = knocked.path
    cleanupFigure = knocked.cleanup
  }

  try {
    const templatePath = join(TEMPLATE_DIR, `${prepared.variation}.svg`)
    const template = readFileSync(templatePath, "utf8")
    const svg = fillTemplate(template, prepared.variation, {
      titleLines: prepared.titleLines,
      crumbs: prepared.crumbs,
      figure
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
      const figureRel = figure ? copyFigureIntoData(dataDir, prepared.key, figure) : undefined
      const record = { route: prepared.key, title: prepared.title, titleLines: prepared.titleLines }
      if (prepared.crumbs.length > 0) record.crumbs = prepared.crumbs
      if (figureRel) record.figure = figureRel
      writeRecord(dataDir, prepared.key, record)
    }

    return {
      key: prepared.key,
      title: prepared.title,
      variation: prepared.variation,
      out: prepared.out
    }
  } finally {
    if (cleanupFigure) cleanupFigure()
  }
}
