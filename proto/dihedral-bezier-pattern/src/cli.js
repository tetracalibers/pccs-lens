/** 曲線版・直線版で共通のコマンドラインと一括生成のループ */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { createDomain } from './geometry.js'
import { createRandom, randomSeed, hashSeed } from './random.js'
import { DEFAULT_PALETTES, COLOR_COUNTS, parsePalette } from './palettes.js'
import { renderSVG, renderIndexHTML } from './render.js'

const PACKAGE_ROOT = fileURLToPath(new URL('..', import.meta.url))
const N_CANDIDATES = [5, 6, 7, 8, 9, 10, 12]

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

function helpText(scriptName, title) {
  return `${title}

  node src/${scriptName} [options]

  --n=<3-24>            正 n 角形の対称性（既定: 実行ごとにランダム）
  --size=<px>           出力サイズ（既定: 480）
  --seed=<数値|文字列>   乱数シード（既定: ランダム）
  --count=<数>          色数ごとの生成数（既定: 1）
  --shape=polygon|circle 模様を収める形（既定: polygon）
  --colors=#aaa,#bbb    パレット指定（2〜6色。指定時はその色数のみ生成）
  --out=<dir>           出力先ディレクトリ（既定: .generated/<pattern>/<timestamp>）
  --help                このヘルプ
`
}

/**
 * 色数 2〜6 のパターンを一括生成する。
 * buildMotif が基本領域 1 枚ぶんの模様を作る関数で、ここが曲線版・直線版の違い。
 */
export function run({ patternName, scriptName, title, buildMotif }) {
  try {
    const opts = parseArgs(process.argv.slice(2))
    if (opts.help) {
      console.log(helpText(scriptName, title))
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
      : path.join(PACKAGE_ROOT, '.generated', patternName, timestamp())

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
      renderIndexHTML(title, entries),
      'utf-8',
    )

    const elapsed = (performance.now() - started).toFixed(1)
    const shown = (name) => path.relative(process.cwd(), path.join(outDir, name))
    console.log(`Seed: ${baseSeed}`)
    for (const e of entries) console.log(`Generated: ${shown(e.filename)}`)
    console.log(`Index: ${shown('index.html')}`)
    console.log(`Time: ${elapsed}ms`)
  } catch (error) {
    console.error(`Error: ${error.message}`)
    process.exitCode = 1
  }
}
