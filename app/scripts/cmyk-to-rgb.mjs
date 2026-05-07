#!/usr/bin/env zx
import { $, argv } from "zx"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ICC_DIR = resolve(__dirname, "icc")
const JAPAN_COLOR_ICC = resolve(ICC_DIR, "JapanColor2011Coated.icc")
const SRGB_ICC = resolve(ICC_DIR, "sRGB.icc")

const cmykArg = argv._[0]
if (cmykArg === undefined) {
  console.error("Usage: npx zx scripts/cmyk-to-rgb.mjs <C,M,Y,K>")
  console.error("Example: npx zx scripts/cmyk-to-rgb.mjs 0,70,100,0")
  process.exit(1)
}

const parts = String(cmykArg)
  .split(",")
  .map((s) => s.trim())
if (parts.length !== 4 || parts.some((p) => p === "" || Number.isNaN(Number(p)))) {
  console.error(`Invalid CMYK input: "${cmykArg}". Expected format: C,M,Y,K (e.g., 0,70,100,0)`)
  process.exit(1)
}

const [c, m, y, k] = parts.map(Number)
const cmykExpr = `cmyk(${c}%,${m}%,${y}%,${k}%)`

$.verbose = false
const result = await $`magick -size 1x1 xc:${cmykExpr} -profile ${JAPAN_COLOR_ICC} -profile ${SRGB_ICC} txt:`

const match = result.stdout.match(/srgb\(([\d.]+)%,([\d.]+)%,([\d.]+)%\)/)
if (!match) {
  console.error("Failed to parse magick output:")
  console.error(result.stdout)
  process.exit(1)
}

const r = Math.round((parseFloat(match[1]) / 100) * 255)
const g = Math.round((parseFloat(match[2]) / 100) * 255)
const b = Math.round((parseFloat(match[3]) / 100) * 255)

console.log(`rgb(${r}, ${g}, ${b})`)
