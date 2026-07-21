// 図版 PNG の「背景に繋がった白」を透過（ノックアウト）するヘルパ。
//
// nested-fig で白背景の図版をそのまま埋め込むと、装飾背景の上に白い「箱」として浮く。
// 埋め込み前に ImageMagick 7（`magick`）の flood-fill で外周から繋がった白だけを透過し、
// 装飾背景に馴染ませる。内部で囲まれた白（白抜き文字・白い塗り）は flood が届かず残る（意図通り）。
// 透過後は -trim で外周の（透明になった）余白を切り詰め、図版をスロットいっぱいに使う。
//
// 生成時のローカル処理専用。得た透過 PNG が data/assets へ永続コピーされるので、regenerate は
// 保存済み透過アセットをそのまま使い magick を再実行しない（CI・regenerate は magick 非依存）。

import { execFileSync } from "node:child_process"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

// ImageMagick の -fuzz に渡せる書式（絶対値 or パーセント。例: "5%", "10", "12.5%"）。
// コマンド文字列には展開しない（execFile で引数配列渡し）が、想定外の値を描画前に弾く。
const FUZZ_PATTERN = /^\d+(\.\d+)?%?$/

/**
 * magickFuzz の値が想定書式か検証する。
 * @param {unknown} value
 * @returns {boolean}
 */
export const isValidMagickFuzz = (value) =>
  typeof value === "string" && FUZZ_PATTERN.test(value.trim())

/**
 * 背景に繋がった白を flood-fill で透過した PNG を一時ディレクトリに作り、
 * そのパスと後片付け関数を返す（呼び出し側が描画後に cleanup() する）。
 *
 * ImageMagick は execFile で引数配列渡し（shell を介さない）。未導入・非 0 終了は明確なエラーで停止する。
 * @param {string} srcAbsPath 入力 PNG（絶対パス）
 * @param {string} magickFuzz -fuzz に渡す値（例: "5%"）
 * @returns {{ path: string, cleanup: () => void }}
 */
export const knockoutWhiteBackground = (srcAbsPath, magickFuzz) => {
  if (!isValidMagickFuzz(magickFuzz)) {
    throw new Error(`magickFuzz の値が不正です: ${JSON.stringify(magickFuzz)}（例: "5%"）`)
  }

  const dir = mkdtempSync(join(tmpdir(), "ogimage-knockout-"))
  const outPath = join(dir, "figure.png")

  // 外周に白 1px を足して -floodfill +0+0 の種を必ず白にし（角まで描かれた図版でも背景から flood できる）、
  // 背景に繋がった白のみ透過してから、足した枠を除去する。最後に -trim +repage で
  // 透明になった外周余白を切り詰める（+repage で仮想キャンバスのオフセットを消す）。
  const args = [
    srcAbsPath,
    "-bordercolor",
    "white",
    "-border",
    "1x1",
    "-alpha",
    "set",
    "-channel",
    "RGBA",
    "-fuzz",
    magickFuzz,
    "-fill",
    "none",
    "-floodfill",
    "+0+0",
    "white",
    "-shave",
    "1x1",
    "-trim",
    "+repage",
    outPath
  ]

  try {
    execFileSync("magick", args, { stdio: ["ignore", "ignore", "pipe"] })
  } catch (err) {
    rmSync(dir, { recursive: true, force: true })
    if (err && err.code === "ENOENT") {
      throw new Error(
        "knockoutWhite（白背景の透過）には ImageMagick 7 の `magick` コマンドが必要ですが、見つかりませんでした。" +
          "`brew install imagemagick` などで導入してから再実行してください。"
      )
    }
    const stderr = err && err.stderr ? String(err.stderr).trim() : ""
    throw new Error(`ImageMagick での白背景の透過に失敗しました${stderr ? `: ${stderr}` : ""}`)
  }

  return {
    path: outPath,
    cleanup: () => rmSync(dir, { recursive: true, force: true })
  }
}
