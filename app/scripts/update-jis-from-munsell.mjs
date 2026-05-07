import { readFile, writeFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"
import Color from "colorjs.io"
import { munsellToXyz } from "munsell"
import { $ } from "zx"

Color.defaults.deltaE = "2000"

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = resolve(__dirname, "../src/lib/data")
const ICC_DIR = resolve(__dirname, "icc")
const JAPAN_COLOR_ICC = resolve(ICC_DIR, "JapanColor2011Coated.icc")
const SRGB_ICC = resolve(ICC_DIR, "sRGB.icc")

const DELTA_E_ABS_THRESHOLD = 10
const DELTA_E_RATIO_THRESHOLD = 1.5
const MAX_RESULTS = 3

$.verbose = false

async function readJson(filename) {
  const path = resolve(DATA_DIR, filename)
  const text = await readFile(path, "utf8")
  return JSON.parse(text)
}

async function loadPccsAll() {
  const [v24, even12, neutral] = await Promise.all([
    readJson("pccs_v24.json"),
    readJson("pccs_even12.json"),
    readJson("pccs_neutral.json")
  ])
  return [...v24, ...even12, ...neutral]
}

function munsellToDisplayRgb(munsell) {
  const [x, y, z] = munsellToXyz(munsell)
  const color = new Color("xyz-d65", [x, y, z]).to("srgb").toGamut({ space: "srgb", method: "css" })
  const [r, g, b] = color.coords.map((v) => Math.round(Math.max(0, Math.min(1, v)) * 255))
  return `rgb(${r}, ${g}, ${b})`
}

async function cmykToRgb(cmyk) {
  const parts = String(cmyk)
    .split(",")
    .map((s) => s.trim())
  if (parts.length !== 4 || parts.some((p) => p === "" || Number.isNaN(Number(p)))) {
    throw new Error(`Invalid CMYK input: "${cmyk}". Expected format: C,M,Y,K`)
  }
  const [c, m, y, k] = parts.map(Number)
  const cmykExpr = `cmyk(${c}%,${m}%,${y}%,${k}%)`
  const result = await $`magick -size 1x1 xc:${cmykExpr} -profile ${JAPAN_COLOR_ICC} -profile ${SRGB_ICC} txt:`
  const match = result.stdout.match(/srgb\(([\d.]+)%,([\d.]+)%,([\d.]+)%\)/)
  if (!match) {
    throw new Error(`Failed to parse magick output for "${cmyk}":\n${result.stdout}`)
  }
  const r = Math.round((parseFloat(match[1]) / 100) * 255)
  const g = Math.round((parseFloat(match[2]) / 100) * 255)
  const b = Math.round((parseFloat(match[3]) / 100) * 255)
  return `rgb(${r}, ${g}, ${b})`
}

function computeApproximatePccs(jisRgb, pccsColors) {
  const jisColor = new Color(jisRgb)
  const candidates = pccsColors
    .map((p) => ({
      notation: p.notation,
      deltaE: jisColor.deltaE(p.color)
    }))
    .sort((a, b) => a.deltaE - b.deltaE)

  const result = [candidates[0]]
  const firstDeltaE = candidates[0].deltaE

  for (let i = 1; i < candidates.length && result.length < MAX_RESULTS; i++) {
    const c = candidates[i]
    if (c.deltaE > DELTA_E_ABS_THRESHOLD) break
    if (c.deltaE > firstDeltaE * DELTA_E_RATIO_THRESHOLD) break
    result.push(c)
  }

  return result.map((r) => ({
    notation: r.notation,
    deltaE: Number(r.deltaE.toFixed(2))
  }))
}

async function main() {
  const pccsAll = await loadPccsAll()
  const pccsColors = pccsAll.map((p) => ({ notation: p.notation, color: new Color(p.hex) }))
  const jisPath = resolve(DATA_DIR, "jis_colors.json")
  const jisColorsBySubfamily = JSON.parse(await readFile(jisPath, "utf8"))
  const allColors = Object.values(jisColorsBySubfamily).flatMap((sub) => sub.colors)

  const cmykCache = new Map()
  let fromCmyk = 0
  let fromMunsell = 0

  for (const jis of allColors) {
    if (jis.cmyk) {
      if (!cmykCache.has(jis.cmyk)) {
        cmykCache.set(jis.cmyk, await cmykToRgb(jis.cmyk))
      }
      jis.rgb = cmykCache.get(jis.cmyk)
      fromCmyk++
    } else {
      jis.rgb = munsellToDisplayRgb(jis.munsell)
      fromMunsell++
    }
    jis.approximatePccs = computeApproximatePccs(jis.rgb, pccsColors)
  }

  await writeFile(jisPath, JSON.stringify(jisColorsBySubfamily), "utf8")

  const total = allColors.length
  const withOnlyOne = allColors.filter((c) => c.approximatePccs.length === 1).length
  const maxed = allColors.filter((c) => c.approximatePccs.length === MAX_RESULTS).length
  console.log(`Updated rgb + approximatePccs on ${total} entries (cmyk: ${fromCmyk}, munsell: ${fromMunsell}).`)
  console.log(`  1 candidate:  ${withOnlyOne}`)
  console.log(`  ${MAX_RESULTS} candidates: ${maxed}`)

  const largeFirstDeltaE = allColors
    .filter((c) => c.approximatePccs[0].deltaE > DELTA_E_ABS_THRESHOLD)
    .map(
      (c) =>
        `  - ${c.name} (${c.hex}): ${c.approximatePccs[0].notation} ΔE=${c.approximatePccs[0].deltaE}`
    )
  if (largeFirstDeltaE.length > 0) {
    console.log(`\nEntries whose 1st ΔE > ${DELTA_E_ABS_THRESHOLD}:`)
    console.log(largeFirstDeltaE.join("\n"))
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
