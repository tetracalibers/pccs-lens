import { readFile, writeFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"
import chroma from "chroma-js"

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = resolve(__dirname, "../src/lib/data")
const PCCS_V24_PATH = resolve(DATA_DIR, "pccs_v24.json")
const PCCS_EVEN12_PATH = resolve(DATA_DIR, "pccs_even12.json")
const OUTPUT_PATH = resolve(DATA_DIR, "munsell_hue.json")

// マンセル表色系の10色相族（順序は色相環における時計回り）
const FAMILIES = ["R", "YR", "Y", "GY", "G", "BG", "B", "PB", "P", "RP"]

// idx 0..99 → "1R", "2R", ..., "10R", "1YR", ..., "10RP"
function munsellHueLabel(idx) {
  const num = (idx % 10) + 1
  const fam = FAMILIES[Math.floor(idx / 10)]
  return `${num}${fam}`
}

// "4R" / "10RP" などのマンセル色相記号を idx(0..99) へ変換
function munsellHueToIdx(hueStr) {
  const match = /^(\d+)([A-Z]+)$/.exec(hueStr)
  if (!match) return null
  const num = Number(match[1])
  const famIdx = FAMILIES.indexOf(match[2])
  if (famIdx < 0 || num < 1 || num > 10) return null
  return famIdx * 10 + (num - 1)
}

// マンセル色相環上の配置は v トーンの munsell 記号に揃え（MunsellHueWithPCCSHue
// と同じ）、アンカーの表示色のみ同一色相番号の b トーンに差し替える。
// 奇数色相の b トーンは明度・彩度が偶数色相と揃っておらず色相環上で浮くため、
// アンカーは偶数色相の b トーン（pccs_even12.json）だけに絞る。
// 例: 色相2 → 位置は v2 の "4R"(idx3)、色は b2 の #FA344D
const pccsV24 = JSON.parse(await readFile(PCCS_V24_PATH, "utf8"))
const pccsEven12 = JSON.parse(await readFile(PCCS_EVEN12_PATH, "utf8"))

// hueNumber(偶数) → b トーンの HEX
const bHexByHue = new Map(
  pccsEven12
    .filter((c) => /^b\d+$/.test(c.notation) && c.hueNumber != null)
    .map((c) => [c.hueNumber, c.hex])
)

const anchors = pccsV24
  .map((c) => {
    const huePart = c.munsell?.split(/\s+/)[0]
    const idx = huePart ? munsellHueToIdx(huePart) : null
    const hex = bHexByHue.get(c.hueNumber)
    return idx === null || !hex ? null : { idx, hex }
  })
  .filter(Boolean)
  .sort((a, b) => a.idx - b.idx)

if (anchors.length === 0) {
  throw new Error("PCCS v24 からマンセル色相アンカーを取得できませんでした")
}

// 隣接する2アンカー間を Lab 色空間で線形補間し、光学的に等間隔となるよう
// 補間する。色相環は循環するため最後のアンカーから先頭アンカーへ折り返す。
function interpolatedHex(idx) {
  for (let i = 0; i < anchors.length; i++) {
    const start = anchors[i]
    const end = anchors[(i + 1) % anchors.length]
    // start → end の循環距離（同一idxは色相環1周=100扱い）
    const span = ((end.idx - start.idx + 100) % 100) || 100
    const offset = (idx - start.idx + 100) % 100
    if (offset < span) {
      const t = offset / span
      return chroma.mix(start.hex, end.hex, t, "lab").hex().toUpperCase()
    }
  }
  // 全アンカーで網羅されるため通常到達しない
  return chroma(anchors[0].hex).hex().toUpperCase()
}

const result = {}
for (let idx = 0; idx < 100; idx++) {
  result[munsellHueLabel(idx)] = interpolatedHex(idx)
}

await writeFile(OUTPUT_PATH, JSON.stringify(result, null, 2) + "\n", "utf8")
console.log(
  `Wrote ${OUTPUT_PATH} (${Object.keys(result).length} hues, ${anchors.length} PCCS anchors)`
)
