/** 壁紙群版のコマンドラインと一括生成のループ */

import fs from 'node:fs'
import path from 'node:path'

import { createWallpaperDomain } from './wallpaper-geometry.js'
import { GROUP_NAMES } from './wallpaper-groups.js'
import { createRandom } from './random.js'
import { renderWallpaperSVG } from './render-wallpaper.js'
import {
  parseArgs,
  resolveSeed,
  readSize,
  readCount,
  readPalettes,
  resolveOutDir,
  finish,
} from './cli-shared.js'

/** --group の解釈。既定は 17 群すべて */
function parseGroups(value) {
  if (value === undefined || value === 'all') return GROUP_NAMES

  const groups = value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  const unknown = groups.filter((g) => !GROUP_NAMES.includes(g))
  if (groups.length === 0 || unknown.length > 0) {
    throw new Error(
      `--group に知らない壁紙群があります: ${unknown.join(', ') || value}\n` +
        `  指定できるのは all か、次の 17 群のコンマ区切り:\n  ${GROUP_NAMES.join(' ')}`,
    )
  }
  // 並び順は GROUP_NAMES にそろえる（一覧で見比べやすくするため）
  return GROUP_NAMES.filter((g) => groups.includes(g))
}

/** 基本領域を横に何枚並べるか。群をまたいでモチーフの大きさをそろえる基準 */
function readRepeat(value) {
  const repeat = Number(value ?? 5)
  if (!Number.isInteger(repeat) || repeat < 1 || repeat > 20) {
    throw new Error(`--repeat は 1〜20 の整数で指定してください（指定: ${value}）`)
  }
  return repeat
}

/**
 * --mark / --no-mark の解釈。
 * 既定は版ごとに違う（模様として見せる版は印なし、群を見比べる版は印あり）。
 */
function readMark(opts, markDefault) {
  if (opts.mark !== undefined && opts['no-mark'] !== undefined) {
    throw new Error('--mark と --no-mark は同時に指定できません')
  }
  if (opts['no-mark'] !== undefined) return false
  if (opts.mark !== undefined) return opts.mark !== 'false'
  return markDefault
}

function helpText(scriptName, title, markDefault) {
  return `${title}

  node src/${scriptName} [options]

  --group=<名前,...>    生成する壁紙群（既定: all = 17 群すべて）
                        ${GROUP_NAMES.join(' ')}
  --repeat=<1-20>       キャンバスの横幅あたりの基本領域の枚数（既定: 5）
                        群をまたいで基本領域の面積をそろえる基準になる
  --guide               すべての出力に対称性の要素（単位格子・基本領域・
                        回転中心・鏡・すべり鏡）を重ねる
  --mark / --no-mark    中心に非対称な印を置くか（既定: ${markDefault ? 'あり' : 'なし'}）
                        印があると、となりのコピーが回転・鏡映・すべり鏡の
                        どれなのかが見分けられる
  --size=<px>           出力サイズ（既定: 480）
  --seed=<数値|文字列>   乱数シード（既定: ランダム）
  --count=<数>          色数ごとの生成数（既定: 1）
  --color-count=<2-6>   生成する色数（既定: all = 2〜6。4,5 のようにコンマ区切りで複数可）
  --colors=#aaa,#bbb    パレット指定（2〜6色。指定時はその色数のみ生成）
  --out=<dir>           出力先ディレクトリ（既定: .generated/<pattern>/<timestamp>）
  --help                このヘルプ

  一覧 HTML は群ごとに節を分ける。節の中に生成した色数が並ぶ。
`
}

/**
 * 17 群 × 色数 2〜6 のパターンを一括生成する（--group・--color-count で絞れる）。
 * buildMotif が基本領域 1 枚ぶんの模様を作る関数。
 * markDefault は非対称な印を既定で置くかどうかで、版の目的によって変わる。
 */
export function run({ patternName, scriptName, title, buildMotif, markDefault = true }) {
  try {
    const opts = parseArgs(process.argv.slice(2))
    if (opts.help) {
      console.log(helpText(scriptName, title, markDefault))
      return
    }

    const size = readSize(opts.size)
    const count = readCount(opts.count)
    const groups = parseGroups(opts.group)
    const repeat = readRepeat(opts.repeat)
    const guide = opts.guide === 'true'
    const mark = readMark(opts, markDefault)

    const palettes = readPalettes(opts.colors, opts['color-count'])
    const outDir = resolveOutDir(opts.out, patternName)

    const baseSeed = resolveSeed(opts.seed)
    const started = performance.now()
    fs.mkdirSync(outDir, { recursive: true })

    // 基本領域の面積を群でそろえる。単位格子ではなく基本領域をそろえることで、
    // どの群でもモチーフが同じ大きさで現れ、並べ方の違いだけを見比べられる。
    const domainArea = (size / repeat) ** 2

    const entries = []

    for (const group of groups) {
      // 基本領域は色数や seed に依らないので、群ごとに 1 度だけ作る
      const domain = createWallpaperDomain({ group, domainArea })

      for (let variant = 0; variant < count; variant++) {
        for (const colors of palettes) {
          // seed に群を混ぜない。17 群で区画の構成と配色がそろい、
          // 対称性の違いだけを比べられるようにするため。
          const seed = (baseSeed + variant * 7919 + colors.length * 104729) >>> 0
          const rng = createRandom(seed)
          const motif = buildMotif({ domain, colorCount: colors.length, rng, mark })
          const suffix = count > 1 ? `-v${variant + 1}` : ''

          const filename = `${group}-${colors.length}colors${suffix}.svg`
          fs.writeFileSync(
            path.join(outDir, filename),
            renderWallpaperSVG({ domain, motif, colors, size, seed, guide }),
            'utf-8',
          )
          // 群ごとに節を分ける。節の中に色数が並ぶので、
          // 同じ群で色数を増やしたときの見え方を並べて比べられる
          entries.push({ filename, section: group, seed, colors })
        }
      }
    }

    finish({ outDir, entries, title, baseSeed, started })
  } catch (error) {
    console.error(`Error: ${error.message}`)
    process.exitCode = 1
  }
}
