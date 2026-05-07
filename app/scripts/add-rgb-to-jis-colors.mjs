#!/usr/bin/env zx
import { $ } from "zx"
import { readFile, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ICC_DIR = resolve(__dirname, "icc")
const JAPAN_COLOR_ICC = resolve(ICC_DIR, "JapanColor2011Coated.icc")
const SRGB_ICC = resolve(ICC_DIR, "sRGB.icc")
const DATA_DIR = resolve(__dirname, "../src/lib/data")
const JIS_PATH = resolve(DATA_DIR, "jis_colors.json")

$.verbose = false

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

function hexToRgb(hex) {
  const h = String(hex).replace(/^#/, "")
  if (!/^[0-9a-fA-F]{6}$/.test(h)) {
    throw new Error(`Invalid hex input: "${hex}". Expected 6-digit hex like "#abcdef".`)
  }
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgb(${r}, ${g}, ${b})`
}

function withRgbBeforeHex(color, rgb) {
  const result = {}
  for (const [key, value] of Object.entries(color)) {
    if (key === "hex") {
      result.rgb = rgb
    }
    result[key] = value
  }
  return result
}

async function main() {
  const json = JSON.parse(await readFile(JIS_PATH, "utf8"))
  const cmykCache = new Map()
  let fromCmyk = 0
  let fromHex = 0

  for (const subfamily of Object.values(json)) {
    const next = []
    for (const color of subfamily.colors) {
      let rgb
      if (color.cmyk) {
        if (!cmykCache.has(color.cmyk)) {
          cmykCache.set(color.cmyk, await cmykToRgb(color.cmyk))
        }
        rgb = cmykCache.get(color.cmyk)
        fromCmyk++
      } else {
        rgb = hexToRgb(color.hex)
        fromHex++
      }
      next.push(withRgbBeforeHex(color, rgb))
    }
    subfamily.colors = next
  }

  await writeFile(JIS_PATH, JSON.stringify(json), "utf8")
  console.log(`Updated ${fromCmyk + fromHex} entries (cmyk: ${fromCmyk}, hex: ${fromHex}).`)
  console.log(`Unique CMYK values converted: ${cmykCache.size}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
