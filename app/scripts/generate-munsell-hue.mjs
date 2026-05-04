import { writeFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"
import chroma from "chroma-js"

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_PATH = resolve(__dirname, "../src/lib/data/munsell_hue.json")

// マンセル表色系の10色相族（順序は色相環における時計回り）
const FAMILIES = ["R", "YR", "Y", "GY", "G", "BG", "B", "PB", "P", "RP"]

// 各色相族の中央（5X）に位置するアンカー色。Munsell色相環における代表色とみなして
// 10アンカーで色相環を10等分する。
const ANCHORS = [
  "rgb(255, 84, 92)", // 5R
  "rgb(231, 119, 0)", // 5YR
  "rgb(239, 200, 0)", // 5Y
  "rgb(149, 191, 0)", // 5GY
  "rgb(0, 181, 107)", // 5G
  "rgb(0, 181, 169)", // 5BG
  "rgb(0, 175, 243)", // 5B
  "rgb(26, 153, 251)", // 5PB
  "rgb(194, 115, 233)", // 5P
  "rgb(249, 88, 163)" // 5RP
]

// 1色相族 = 10ステップ（1X..10X）。アンカーは各族の5番目に位置するため、
// アンカー間（5X→5(X+1)）も10ステップで補間する。
const STEPS_PER_SEGMENT = 10

// idx 0..99 → "1R", "2R", ..., "10R", "1YR", ..., "10RP"
function munsellHueLabel(idx) {
  const num = (idx % 10) + 1
  const fam = FAMILIES[Math.floor(idx / 10)]
  return `${num}${fam}`
}

// アンカーが置かれている idx は 4, 14, 24, ..., 94（各色相族の "5X"）。
// 隣接する2アンカー間をLab色空間で線形補間し、見た目上の等間隔を確保する。
function interpolatedHex(idx) {
  const offset = (((idx - 4) % 100) + 100) % 100
  const segment = Math.floor(offset / STEPS_PER_SEGMENT)
  const t = (offset % STEPS_PER_SEGMENT) / STEPS_PER_SEGMENT
  const start = ANCHORS[segment]
  const end = ANCHORS[(segment + 1) % ANCHORS.length]
  return chroma.mix(start, end, t, "lab").hex().toUpperCase()
}

const result = {}
for (let idx = 0; idx < 100; idx++) {
  result[munsellHueLabel(idx)] = interpolatedHex(idx)
}

await writeFile(OUTPUT_PATH, JSON.stringify(result, null, 2) + "\n", "utf8")
console.log(`Wrote ${OUTPUT_PATH} (${Object.keys(result).length} hues)`)
