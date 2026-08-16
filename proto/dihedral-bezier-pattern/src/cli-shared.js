/** 生成スクリプトで共通のコマンドライン解釈と、出力の後始末 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { randomSeed, hashSeed } from './random.js'
import { DEFAULT_PALETTES, COLOR_COUNTS, parsePalette } from './palettes.js'
import { renderIndexHTML } from './render.js'

const PACKAGE_ROOT = fileURLToPath(new URL('..', import.meta.url))

export function parseArgs(argv) {
  const opts = {}
  for (const arg of argv) {
    const m = /^--([\w-]+)(?:=(.*))?$/.exec(arg)
    if (!m) throw new Error(`不明な引数: ${arg}`)
    opts[m[1]] = m[2] ?? 'true'
  }
  return opts
}

export function resolveSeed(value) {
  if (value === undefined) return randomSeed()
  return /^\d+$/.test(value) ? Number(value) >>> 0 : hashSeed(value)
}

export function readSize(value) {
  const size = Number(value ?? 480)
  if (!Number.isFinite(size) || size < 64) {
    throw new Error(`--size は 64 以上の数値で指定してください（指定: ${value}）`)
  }
  return size
}

export function readCount(value) {
  const count = Number(value ?? 1)
  if (!Number.isInteger(count) || count < 1) {
    throw new Error(`--count は 1 以上の整数で指定してください（指定: ${value}）`)
  }
  return count
}

/** --color-count の解釈。既定は 2〜6 すべて */
function parseColorCounts(value) {
  if (value === undefined || value === 'all') return COLOR_COUNTS

  const counts = value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map(Number)
  if (counts.length === 0 || counts.some((k) => !COLOR_COUNTS.includes(k))) {
    throw new Error(
      `--color-count は ${COLOR_COUNTS[0]}〜${COLOR_COUNTS.at(-1)} の整数を` +
        `コンマ区切りで指定してください（指定: ${value}）`,
    )
  }
  // 並び順は COLOR_COUNTS にそろえる（一覧で色数の少ない順に並べるため）
  return COLOR_COUNTS.filter((k) => counts.includes(k))
}

/**
 * --exclude の解釈。描きたくない要素の名前をコンマ区切りで受ける。
 * 並びは allowed にそろえるので、指定順が違っても同じ Set になる。
 */
export function readExcluded(value, allowed) {
  if (value === undefined) return new Set()

  const names = value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  const unknown = names.filter((name) => !allowed.includes(name))
  if (names.length === 0 || unknown.length > 0) {
    throw new Error(
      `--exclude には ${allowed.join(' / ')} をコンマ区切りで指定してください` +
        `（指定: ${value}）`,
    )
  }
  return new Set(allowed.filter((name) => names.includes(name)))
}

/**
 * 生成するパレット。
 * --colors があればその 1 つ、無ければ --color-count で選んだ色数の既定パレット。
 */
export function readPalettes(colors, colorCount) {
  if (colors) {
    if (colorCount !== undefined) {
      throw new Error('--colors は色数まで決まるので、--color-count とは同時に指定できません')
    }
    return [parsePalette(colors)]
  }
  return parseColorCounts(colorCount).map((k) => DEFAULT_PALETTES[k])
}

function timestamp() {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return (
    `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}` +
    `-T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`
  )
}

export function resolveOutDir(value, patternName) {
  return value
    ? path.resolve(value)
    : path.join(PACKAGE_ROOT, '.generated', patternName, timestamp())
}

/** 一覧 HTML を書き出して、生成結果をコンソールに報告する */
export function finish({ outDir, entries, title, baseSeed, started }) {
  fs.writeFileSync(
    path.join(outDir, 'index.html'),
    renderIndexHTML(title, entries),
    'utf-8',
  )

  const elapsed = (performance.now() - started).toFixed(1)
  const shown = (name) => path.relative(process.cwd(), path.join(outDir, name))
  console.log(`Seed: ${baseSeed}`)
  // 枚数が多いときは 1 枚ずつ並べても読めないので、まとめて件数で示す
  if (entries.length > 12) {
    console.log(
      `Generated: ${entries.length} files in ${path.relative(process.cwd(), outDir)}`,
    )
  } else {
    for (const e of entries) console.log(`Generated: ${shown(e.filename)}`)
  }
  console.log(`Index: ${shown('index.html')}`)
  console.log(`Time: ${elapsed}ms`)
}
