#!/usr/bin/env zx
import { $ } from "zx"
import { readFile, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import Color from "colorjs.io"
import { munsellToXyz } from "munsell"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ICC_DIR = resolve(__dirname, "icc")
const SRGB_ICC = resolve(ICC_DIR, "sRGB.icc")
const JAPAN_COLOR_ICC = resolve(ICC_DIR, "JapanColor2011Coated.icc")
const DATA_DIR = resolve(__dirname, "../src/lib/data")
const JIS_PATH = resolve(DATA_DIR, "jis_colors.json")

$.verbose = false

function munsellToSrgb(munsell) {
  const [x, y, z] = munsellToXyz(munsell)
  const color = new Color("xyz-d65", [x, y, z]).to("srgb").toGamut()
  const [r, g, b] = color.coords.map((v) => Math.round(Math.max(0, Math.min(1, v)) * 255))
  return { r, g, b }
}

async function srgbToCmyk({ r, g, b }) {
  const result = await $`magick -size 1x1 xc:${`rgb(${r},${g},${b})`} -profile ${SRGB_ICC} -intent relative -black-point-compensation -profile ${JAPAN_COLOR_ICC} txt:`
  const headerMatch = result.stdout.match(/# ImageMagick pixel enumeration: \d+,\d+,\d+,(\d+),cmyk/)
  if (!headerMatch) {
    throw new Error(`Failed to parse magick header for rgb(${r},${g},${b}):\n${result.stdout}`)
  }
  const maxValue = Number(headerMatch[1])
  const pixelMatch = result.stdout.match(/\b0,0: \(([\d,]+)\)/)
  if (!pixelMatch) {
    throw new Error(`Failed to parse magick pixel for rgb(${r},${g},${b}):\n${result.stdout}`)
  }
  const parts = pixelMatch[1].split(",").map((s) => Number(s.trim()))
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) {
    throw new Error(`Unexpected pixel values "${pixelMatch[1]}" for rgb(${r},${g},${b})`)
  }
  const [c, m, y, k] = parts.map((v) => Math.round((v / maxValue) * 100))
  return `${c},${m},${y},${k}`
}

async function main() {
  const json = JSON.parse(await readFile(JIS_PATH, "utf8"))
  const munsellCache = new Map()
  let updated = 0
  let skipped = 0

  for (const subfamily of Object.values(json)) {
    for (const color of subfamily.colors) {
      if (!color.munsell) {
        skipped++
        continue
      }
      let cmyk = munsellCache.get(color.munsell)
      if (cmyk === undefined) {
        const rgb = munsellToSrgb(color.munsell)
        cmyk = await srgbToCmyk(rgb)
        munsellCache.set(color.munsell, cmyk)
      }
      color.cmyk = cmyk
      updated++
    }
  }

  await writeFile(JIS_PATH, JSON.stringify(json), "utf8")
  console.log(`Updated cmyk on ${updated} entries (skipped ${skipped} without munsell).`)
  console.log(`Unique munsell notations converted: ${munsellCache.size}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
