/** ロゼッタ模様（曲線版・直線版）で共通のコマンドラインと一括生成のループ */

import fs from 'node:fs'
import path from 'node:path'

import { createDomain } from './geometry.js'
import { createRandom } from './random.js'
import { renderSVG } from './render.js'
import {
  parseArgs,
  resolveSeed,
  readSize,
  readCount,
  readPalettes,
  resolveOutDir,
  finish,
} from './cli-shared.js'

const N_CANDIDATES = [5, 6, 7, 8, 9, 10, 12]

/**
 * --n の解釈。
 * `8` なら単一、`4,24` または `4-24` なら 4〜24 の全ての n（範囲）。
 */
function parseNOption(value) {
  if (value === undefined) return null

  const parts = value
    .split(/[,-]/)
    .map((s) => s.trim())
    .filter(Boolean)
  const numbers = parts.map(Number)

  if (numbers.some((x) => !Number.isInteger(x) || x < 3 || x > 24)) {
    throw new Error(`--n は 3〜24 の整数で指定してください（指定: ${value}）`)
  }
  if (numbers.length === 1) return numbers
  if (numbers.length !== 2) {
    throw new Error(
      `--n は 8（単一）か 4,24（範囲）の形式で指定してください（指定: ${value}）`,
    )
  }

  const [from, to] = numbers
  if (from > to) {
    throw new Error(`--n の範囲は小さいほうを先に書いてください（指定: ${value}）`)
  }
  return Array.from({ length: to - from + 1 }, (_, i) => from + i)
}

function helpText(scriptName, title) {
  return `${title}

  node src/${scriptName} [options]

  --n=<3-24>            正 n 角形の対称性（既定: 実行ごとにランダム）
                        --n=4,24 のように書くと 4〜24 を範囲で一括生成する
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

    const size = readSize(opts.size)
    const count = readCount(opts.count)

    const shape = opts.shape ?? 'polygon'
    if (shape !== 'polygon' && shape !== 'circle') {
      throw new Error(`--shape は polygon か circle（指定: ${shape}）`)
    }

    const fixedNs = parseNOption(opts.n)
    const palettes = readPalettes(opts.colors)
    const outDir = resolveOutDir(opts.out, patternName)

    const baseSeed = resolveSeed(opts.seed)
    const started = performance.now()
    fs.mkdirSync(outDir, { recursive: true })

    const entries = []

    for (let variant = 0; variant < count; variant++) {
      // n を指定しなかったときは、バリアント単位でランダムに 1 つ選ぶ
      const variantRng = createRandom((baseSeed + variant * 7919) >>> 0)
      const ns = fixedNs ?? [variantRng.pick(N_CANDIDATES)]

      for (const n of ns) {
        const domain = createDomain({ n, radius: size * 0.44, shape })

        for (const colors of palettes) {
          // seed に n を混ぜない。n を変えても帯の構成と配色がそろい、
          // 対称性の次数だけを比べられるようにするため。
          const seed = (baseSeed + variant * 7919 + colors.length * 104729) >>> 0
          const rng = createRandom(seed)
          const motif = buildMotif({ domain, colorCount: colors.length, rng })
          const svg = renderSVG({ domain, motif, colors, size, seed })

          const suffix = count > 1 ? `-v${variant + 1}` : ''
          const filename = `d${n}-${colors.length}colors${suffix}.svg`
          fs.writeFileSync(path.join(outDir, filename), svg, 'utf-8')
          entries.push({ filename, section: `D${n}`, seed, colors })
        }
      }
    }

    finish({ outDir, entries, title, baseSeed, started })
  } catch (error) {
    console.error(`Error: ${error.message}`)
    process.exitCode = 1
  }
}
