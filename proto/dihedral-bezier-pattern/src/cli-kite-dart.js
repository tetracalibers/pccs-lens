/** カイト＆ダートタイリング版のコマンドラインと一括生成のループ */

import fs from 'node:fs'
import path from 'node:path'

import { buildTiling, KITE_WIDTH } from './kite-dart-geometry.js'
import { buildKiteDartMotif } from './motif-kite-dart.js'
import { renderPenroseSVG } from './render-penrose.js'
import { createRandom } from './random.js'
import {
  parseArgs,
  resolveSeed,
  readSize,
  readCount,
  readPalettes,
  resolveOutDir,
  finish,
} from './cli-shared.js'

/** キャンバスの横幅あたりに並ぶカイトの枚数 */
function readRepeat(value) {
  const repeat = Number(value ?? 8)
  if (!Number.isInteger(repeat) || repeat < 2 || repeat > 40) {
    throw new Error(`--repeat は 2〜40 の整数で指定してください（指定: ${value}）`)
  }
  return repeat
}

function helpText() {
  return `カイト＆ダートタイリング（ペンローズ P2: 凧形と矢じり形）

  node src/generate-kite-dart.js [options]

  --repeat=<2-40>       キャンバスの横幅あたりのカイトの枚数（既定: 8）
  --outline             タイルの輪郭を背景色の細線で描く（既定: なし）
  --size=<px>           出力サイズ（既定: 480）
  --seed=<数値|文字列>   乱数シード（既定: ランダム）
                        seed は切り取る位置と向きを決める。タイリング自体は
                        分割規則で一意に決まるので、seed では変わらない
  --count=<数>          切り取り方の生成数（既定: 1）
  --color-count=<2-6>   生成する色数（既定: all = 2〜6。4,5 のようにコンマ区切りで複数可）
  --colors=#aaa,#bbb    パレット指定（2〜6色。指定時はその色数のみ生成）
  --out=<dir>           出力先ディレクトリ（既定: .generated/kite-dart/<timestamp>）
  --help                このヘルプ

  同じ切り取り方のまま色数だけを変えて並べるので、色数による見え方の違いを比べられる。
`
}

/**
 * 色数 2〜6 のカイト＆ダートタイリングを一括生成する。
 *
 * タイリングは分割規則で決まっていて乱数の余地がないので、
 * seed は「どこをどの向きで切り取るか」に使う。
 */
export function run() {
  try {
    const opts = parseArgs(process.argv.slice(2))
    if (opts.help) {
      console.log(helpText())
      return
    }

    const size = readSize(opts.size)
    const count = readCount(opts.count)
    const repeat = readRepeat(opts.repeat)
    const outline = opts.outline === 'true'

    const palettes = readPalettes(opts.colors, opts['color-count'])
    const outDir = resolveOutDir(opts.out, 'kite-dart')

    const baseSeed = resolveSeed(opts.seed)
    const started = performance.now()
    fs.mkdirSync(outDir, { recursive: true })

    const unit = size / (repeat * KITE_WIDTH)
    const entries = []

    for (let variant = 0; variant < count; variant++) {
      // seed に色数を混ぜない。色数を変えても同じ切り取り方になり、
      // 配色の違いだけを見比べられるようにするため
      const seed = (baseSeed + variant * 7919) >>> 0
      const rng = createRandom(seed)

      // 種の太陽は 5 回対称なので、向きは 72 度ぶん振れば全部の見え方を尽くせる
      const baseAngle = rng.float(0, (2 * Math.PI) / 5)
      // 切り取る位置。中心付近ばかりにならないよう、半径は面積が一様になるようにとる
      const spread = size * 2
      const distance = spread * Math.sqrt(rng.next())
      const direction = rng.float(0, 2 * Math.PI)
      const view = {
        x: distance * Math.cos(direction),
        y: distance * Math.sin(direction),
        radius: (size * Math.SQRT2) / 2,
      }

      const tiling = buildTiling({ unit, baseAngle, view })
      const viewport = { x: view.x, y: view.y, half: size / 2 }

      for (const colors of palettes) {
        const motif = buildKiteDartMotif({
          tiles: tiling.tiles,
          colorCount: colors.length,
          viewport,
        })

        const suffix = count > 1 ? `-v${variant + 1}` : ''
        const filename = `kite-dart-${colors.length}colors${suffix}.svg`
        fs.writeFileSync(
          path.join(outDir, filename),
          renderPenroseSVG({
            motif,
            colors,
            size,
            seed,
            view,
            side: tiling.unit,
            outline,
            label: 'Penrose P2 (kite/dart)',
          }),
          'utf-8',
        )
        entries.push({ filename, section: 'kite-dart', seed, colors })
      }
    }

    finish({
      outDir,
      entries,
      title: 'カイト＆ダートタイリング',
      baseSeed,
      started,
    })
  } catch (error) {
    console.error(`Error: ${error.message}`)
    process.exitCode = 1
  }
}
