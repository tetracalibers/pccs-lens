#!/usr/bin/env node
/**
 * 二面体群 D_n の対称性をもつベジェ曲線パターンを SVG として一括生成する。
 *
 *   node src/generate.js [--n=8] [--size=480] [--seed=12345]
 *                        [--count=1] [--shape=polygon|circle] [--colors=#fff,#000]
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { createDomain } from './geometry.js'
import { buildMotif } from './motif.js'
import { createRandom, randomSeed, hashSeed } from './random.js'
import { DEFAULT_PALETTES, COLOR_COUNTS, parsePalette } from './palettes.js'

const PACKAGE_ROOT = fileURLToPath(new URL('..', import.meta.url))
const N_CANDIDATES = [5, 6, 7, 8, 9, 10, 12]

const num = (x) => String(Math.round(x * 100) / 100)

// --- SVG の組み立て ---

function renderElement(el, colors) {
  const color = colors[el.colorIndex]

  if (el.kind === 'circle') {
    return `<circle cx="${num(el.cx)}" cy="${num(el.cy)}" r="${num(el.r)}" fill="${color}"/>`
  }

  if (el.kind === 'stroke') {
    return (
      `<path d="${el.d}" fill="none" stroke="${color}"` +
      ` stroke-width="${num(el.width)}" stroke-linecap="round"/>`
    )
  }

  // 隣り合うコピーの継ぎ目に出るアンチエイリアスの隙間を、同色のヘアラインで埋める
  const hairline = el.hairline
    ? ` stroke="${color}" stroke-width="0.7" stroke-linejoin="round"`
    : ''
  return `<path d="${el.d}" fill="${color}"${hairline}/>`
}

function renderSVG({ domain, motif, colors, size, seed }) {
  const center = size / 2

  const motifBody = motif.elements
    .map((el) => `      ${renderElement(el, colors)}`)
    .join('\n')

  // 二面体群の 2n 個の合同変換で基本領域の模様をコピーする
  const copies = domain.transforms
    .map((t) => `    <use href="#motif" xlink:href="#motif" transform="${t}"/>`)
    .join('\n')

  const centerDot = motif.center
    ? `\n    <circle cx="0" cy="0" r="${num(motif.center.r)}" fill="${colors[motif.center.colorIndex]}"/>`
    : ''

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <!-- dihedral group D${domain.n} / colors: ${colors.join(' ')} / seed: ${seed} -->
  <rect width="${size}" height="${size}" fill="${colors[0]}"/>
  <defs>
    <g id="motif">
${motifBody}
    </g>
  </defs>
  <g transform="translate(${num(center)},${num(center)})">
${copies}${centerDot}
  </g>
</svg>
`
}

function renderIndexHTML(entries) {
  const cards = entries
    .map(
      (e) => `    <figure>
      <img src="./${e.filename}" width="320" height="320" alt="${e.filename}">
      <figcaption>
        <strong>${e.colors.length}色</strong> / D${e.n} / seed ${e.seed}
        <span class="swatches">${e.colors
          .map((c) => `<i style="background:${c}"></i>`)
          .join('')}</span>
      </figcaption>
    </figure>`,
    )
    .join('\n')

  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<title>二面体群ベジェパターン</title>
<style>
  body { margin: 0; padding: 24px; background: #2a2a2a; color: #eee;
         font-family: system-ui, sans-serif; }
  main { display: flex; flex-wrap: wrap; gap: 24px; }
  figure { margin: 0; }
  img { display: block; width: 320px; height: auto; background: #fff; }
  figcaption { margin-top: 8px; font-size: 13px; display: flex;
               align-items: center; gap: 8px; }
  .swatches { display: inline-flex; gap: 2px; }
  .swatches i { width: 12px; height: 12px; display: block; }
</style>
</head>
<body>
<main>
${cards}
</main>
</body>
</html>
`
}

// --- CLI ---

function parseArgs(argv) {
  const opts = {}
  for (const arg of argv) {
    const m = /^--([\w-]+)(?:=(.*))?$/.exec(arg)
    if (!m) throw new Error(`不明な引数: ${arg}`)
    opts[m[1]] = m[2] ?? 'true'
  }
  return opts
}

function resolveSeed(value) {
  if (value === undefined) return randomSeed()
  return /^\d+$/.test(value) ? Number(value) >>> 0 : hashSeed(value)
}

function timestamp() {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return (
    `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}` +
    `-T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`
  )
}

const HELP = `二面体群ベジェパターン生成

  node src/generate.js [options]

  --n=<3-24>            正 n 角形の対称性（既定: 実行ごとにランダム）
  --size=<px>           出力サイズ（既定: 480）
  --seed=<数値|文字列>   乱数シード（既定: ランダム）
  --count=<数>          色数ごとの生成数（既定: 1）
  --shape=polygon|circle 模様を収める形（既定: polygon）
  --colors=#aaa,#bbb    パレット指定（2〜6色。指定時はその色数のみ生成）
  --out=<dir>           出力先ディレクトリ（既定: .generated/<timestamp>）
  --help                このヘルプ
`

function main() {
  const opts = parseArgs(process.argv.slice(2))
  if (opts.help) {
    console.log(HELP)
    return
  }

  const size = Number(opts.size ?? 480)
  if (!Number.isFinite(size) || size < 64) {
    throw new Error(`--size は 64 以上の数値で指定してください（指定: ${opts.size}）`)
  }

  const shape = opts.shape ?? 'polygon'
  if (shape !== 'polygon' && shape !== 'circle') {
    throw new Error(`--shape は polygon か circle（指定: ${shape}）`)
  }

  const count = Number(opts.count ?? 1)
  if (!Number.isInteger(count) || count < 1) {
    throw new Error(`--count は 1 以上の整数で指定してください（指定: ${opts.count}）`)
  }

  let fixedN = null
  if (opts.n !== undefined) {
    fixedN = Number(opts.n)
    if (!Number.isInteger(fixedN) || fixedN < 3 || fixedN > 24) {
      throw new Error(`--n は 3〜24 の整数で指定してください（指定: ${opts.n}）`)
    }
  }

  const palettes = opts.colors
    ? [parsePalette(opts.colors)]
    : COLOR_COUNTS.map((k) => DEFAULT_PALETTES[k])

  const outDir = opts.out
    ? path.resolve(opts.out)
    : path.join(PACKAGE_ROOT, '.generated', timestamp())

  const baseSeed = resolveSeed(opts.seed)
  const started = performance.now()
  fs.mkdirSync(outDir, { recursive: true })

  const entries = []

  for (let variant = 0; variant < count; variant++) {
    // n はバリアント単位で決める（同じバリアント内では色数によらず同じ n）
    const variantRng = createRandom((baseSeed + variant * 7919) >>> 0)
    const n = fixedN ?? variantRng.pick(N_CANDIDATES)
    const domain = createDomain({ n, radius: size * 0.44, shape })

    for (const colors of palettes) {
      const seed = (baseSeed + variant * 7919 + colors.length * 104729) >>> 0
      const rng = createRandom(seed)
      const motif = buildMotif({ domain, colorCount: colors.length, rng })
      const svg = renderSVG({ domain, motif, colors, size, seed })

      const suffix = count > 1 ? `-v${variant + 1}` : ''
      const filename = `d${n}-${colors.length}colors${suffix}.svg`
      fs.writeFileSync(path.join(outDir, filename), svg, 'utf-8')
      entries.push({ filename, n, seed, colors })
    }
  }

  fs.writeFileSync(
    path.join(outDir, 'index.html'),
    renderIndexHTML(entries),
    'utf-8',
  )

  const elapsed = (performance.now() - started).toFixed(1)
  console.log(`Seed: ${baseSeed}`)
  for (const e of entries) {
    console.log(`Generated: ${path.relative(process.cwd(), path.join(outDir, e.filename))}`)
  }
  console.log(`Index: ${path.relative(process.cwd(), path.join(outDir, 'index.html'))}`)
  console.log(`Time: ${elapsed}ms`)
}

try {
  main()
} catch (error) {
  console.error(`Error: ${error.message}`)
  process.exitCode = 1
}
