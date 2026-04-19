import { readFile, writeFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"
import chroma from "chroma-js"

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = resolve(__dirname, "../src/lib/data")

const DELTA_E_ABS_THRESHOLD = 10
const DELTA_E_RATIO_THRESHOLD = 1.5
const MAX_RESULTS = 3

async function readJson(filename) {
  const path = resolve(DATA_DIR, filename)
  const text = await readFile(path, "utf8")
  return JSON.parse(text)
}

async function loadPccsAll() {
  const [v24, s12, even12, odd12, neutral] = await Promise.all([
    readJson("pccs_v24.json"),
    readJson("pccs_s12.json"),
    readJson("pccs_even12.json"),
    readJson("pccs_odd12.json"),
    readJson("pccs_neutral.json")
  ])
  return [...v24, ...s12, ...even12, ...odd12, ...neutral]
}

function computeApproximatePccs(jisHex, pccsAll) {
  const candidates = pccsAll
    .map((p) => ({
      notation: p.notation,
      deltaE: chroma.deltaE(jisHex, p.hex)
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
  const jisPath = resolve(DATA_DIR, "jis_colors.json")
  const jisColorsBySubfamily = JSON.parse(await readFile(jisPath, "utf8"))
  const allColors = Object.values(jisColorsBySubfamily).flatMap((sub) => sub.colors)

  for (const jis of allColors) {
    jis.approximatePccs = computeApproximatePccs(jis.hex, pccsAll)
  }

  await writeFile(jisPath, JSON.stringify(jisColorsBySubfamily), "utf8")

  const total = allColors.length
  const withOnlyOne = allColors.filter((c) => c.approximatePccs.length === 1).length
  const maxed = allColors.filter((c) => c.approximatePccs.length === MAX_RESULTS).length
  console.log(`Updated ${total} entries.`)
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
