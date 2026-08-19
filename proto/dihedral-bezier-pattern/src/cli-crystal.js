/** 準結晶版のコマンドラインと一括生成のループ */

import fs from 'node:fs'
import path from 'node:path'

import { buildTiling, KITE_WIDTH, polygonArea } from './kite-dart-geometry.js'
import {
  buildNetwork,
  cleaveLines,
  buildNuclei,
  assignGrain,
  grainHalfPlanes,
  clipPolygon,
  tileCenter,
  translateTiles,
} from './crystal-geometry.js'
import { diffractionPeaks } from './crystal-diffraction.js'
import { buildCrystalMotif, LAYERS, COLOR_BY } from './motif-crystal.js'
import { renderCrystalSVG } from './render-crystal.js'
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

const DEFAULT_LAYERS = ['diffraction', 'tile', 'cleave', 'network']

/** キャンバスの横幅あたりに並ぶカイトの枚数 */
function readRepeat(value) {
  const repeat = Number(value ?? 12)
  if (!Number.isInteger(repeat) || repeat < 2 || repeat > 40) {
    throw new Error(`--repeat は 2〜40 の整数で指定してください（指定: ${value}）`)
  }
  return repeat
}

function readNumber(value, fallback, { min, max, integer = false, name }) {
  const parsed = Number(value ?? fallback)
  const ok =
    Number.isFinite(parsed) &&
    parsed >= min &&
    parsed <= max &&
    (!integer || Number.isInteger(parsed))
  if (!ok) {
    throw new Error(
      `${name} は ${min}〜${max} の${integer ? '整数' : '数値'}で指定してください（指定: ${value}）`,
    )
  }
  return parsed
}

/** 描く層。指定が無ければ既定の組み合わせ（多結晶のときは粒界を足す） */
function readLayers(value, seeds) {
  if (value === undefined) {
    return seeds > 1 ? [...DEFAULT_LAYERS, 'grain'] : DEFAULT_LAYERS
  }
  const names = value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  const unknown = names.filter((name) => !LAYERS.includes(name))
  if (names.length === 0 || unknown.length > 0) {
    throw new Error(
      `--layers には ${LAYERS.join(' / ')} をコンマ区切りで指定してください（指定: ${value}）`,
    )
  }
  // 並びは LAYERS にそろえる（重ねる順は指定順ではなく決まっているため）
  return LAYERS.filter((name) => names.includes(name))
}

function readColorBy(value) {
  const name = value ?? 'orientation'
  if (!COLOR_BY.includes(name)) {
    throw new Error(`--color-by は ${COLOR_BY.join(' / ')} のいずれかです（指定: ${value}）`)
  }
  return name
}

function helpText() {
  return `準結晶（カイト＆ダートタイリングを結晶標本として描く）

  node src/generate-crystal.js [options]

  --repeat=<2-40>       キャンバスの横幅あたりのカイトの枚数（既定: 12）
  --layers=<名前,…>     描く層（既定: ${DEFAULT_LAYERS.join(',')}、核が複数なら + grain）
                        ${LAYERS.join(' / ')}
  --color-by=<方式>     タイルの色分け（既定: orientation）
                        orientation = 軸の向きの 10 系統を色数ぶんに分ける
                        class       = どのタイルから生まれたか（カイト＆ダート版と同じ）
                        zone        = 核からの距離。境目の半径が φ で縮む成長痕
  --cleave=<0-5>        劈開線の粗さ（既定: 3）。1 増やすごとに線の間隔が φ 倍になる
  --cleave-opacity=<0-1> 劈開線の濃さの倍率（既定: 1）。太さは変えずに淡くする。
                        面を描かず劈開線だけを見るときに濃すぎるのを抑える
  --growth=<0-1>        結晶化の進み具合（既定: 1）。境目は 線 → 半透明 → 結晶面 と変わる
  --frames=<1-24>       growth を 0 から振ってコマを出す（既定: 1）
  --seeds=<1-8>         結晶核の数（既定: 1）。2 以上で多結晶になり、粒界が出る
  --size=<px>           出力サイズ（既定: 480）
  --seed=<数値|文字列>   乱数シード（既定: ランダム）
                        seed が決めるのは全体の向きと結晶核の位置だけ。
                        タイリング自体は分割規則で一意に決まる
  --count=<数>          切り取り方の生成数（既定: 1）
  --color-count=<2-6>   生成する色数（既定: all = 2〜6。4,5 のようにコンマ区切りで複数可）
  --colors=#aaa,#bbb    パレット指定（2〜6色。指定時はその色数のみ生成）
  --out=<dir>           出力先ディレクトリ（既定: .generated/crystal/<timestamp>）
  --help                このヘルプ

  結晶核は画面の中心（多結晶なら各核）に置く。核のまわりだけが完全な 5 回対称で、
  外へ行くほど非周期になる ——「マクロでは対称、ローカルでは非周期」という
  準結晶の見え方をそのまま絵にしている。
`
}

/**
 * 準結晶を一括生成する。
 *
 * 重い計算（タイリング・頂点ネットワーク・劈開線・回折）は切り取り方ごとに
 * 1 度だけ行い、コマと色数のぶんは組み立て直すだけにする。
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
    const seeds = readNumber(opts.seeds, 1, { min: 1, max: 8, integer: true, name: '--seeds' })
    const frames = readNumber(opts.frames, 1, { min: 1, max: 24, integer: true, name: '--frames' })
    const growth = readNumber(opts.growth, 1, { min: 0, max: 1, name: '--growth' })
    const cleave = readNumber(opts.cleave, 3, { min: 0, max: 5, integer: true, name: '--cleave' })
    const cleaveOpacity = readNumber(opts['cleave-opacity'], 1, {
      min: 0,
      max: 1,
      name: '--cleave-opacity',
    })
    const layers = readLayers(opts.layers, seeds)
    const colorBy = readColorBy(opts['color-by'])

    const palettes = readPalettes(opts.colors, opts['color-count'])
    const outDir = resolveOutDir(opts.out, 'crystal')

    const baseSeed = resolveSeed(opts.seed)
    const started = performance.now()
    fs.mkdirSync(outDir, { recursive: true })

    const unit = size / (repeat * KITE_WIDTH)
    const radius = (size * Math.SQRT2) / 2
    const entries = []

    for (let variant = 0; variant < count; variant++) {
      // seed に色数もコマ番号も混ぜない。同じ結晶を色数とコマだけ変えて並べる
      const seed = (baseSeed + variant * 7919) >>> 0
      const rng = createRandom(seed)

      const nuclei = buildNuclei({ count: seeds, rng, size })
      const grains = nuclei.map((nucleus, index) => {
        // 核ごとに自分の座標系でタイリングを作り、画面の座標へ移す
        const tiling = buildTiling({
          unit,
          baseAngle: nucleus.angle,
          view: { x: -nucleus.center[0], y: -nucleus.center[1], radius },
        })
        const moved = translateTiles(tiling.tiles, nucleus.center)

        // 塗るのは粒の領域で切った形。ただし向きや親子の情報はもとの形から取るので、
        // 切った形は draw として別に持つ
        const planes = grainHalfPlanes(nuclei, index)
        const tiles =
          planes.length === 0
            ? moved.map((tile) => ({ ...tile, draw: tile.points }))
            : moved
                .map((tile) => ({ ...tile, draw: clipPolygon(tile.points, planes) }))
                .filter((tile) => tile.draw.length >= 3 && polygonArea(tile.draw) > unit * unit * 1e-4)

        // ネットワークと劈開線は切る前のタイルから作る（節点を格子から外さないため）
        const own = moved.filter((tile) => assignGrain(tileCenter(tile), nuclei).index === index)
        const network = buildNetwork(own, unit)
        const lines = cleaveLines({
          vertices: network.vertices,
          baseAngle: nucleus.angle,
          unit,
          inflate: cleave,
        })
        return { index, nucleus, tiles, network, lines }
      })

      const points = grains.flatMap((grain) => grain.network.vertices.map((v) => v.point))
      const peaks = layers.includes('diffraction') ? diffractionPeaks({ points, unit }) : []

      for (let frame = 0; frame < frames; frame++) {
        const stage = (growth * (frame + 1)) / frames
        for (const colors of palettes) {
          const motif = buildCrystalMotif({
            grains,
            nuclei,
            peaks,
            colors,
            colorBy,
            layers,
            unit,
            size,
            growth: stage,
            cleaveOpacity,
          })

          const suffix =
            (count > 1 ? `-v${variant + 1}` : '') +
            (frames > 1 ? `-f${String(frame + 1).padStart(2, '0')}` : '')
          const filename = `crystal-${colors.length}colors${suffix}.svg`
          fs.writeFileSync(
            path.join(outDir, filename),
            renderCrystalSVG({
              motif,
              colors,
              size,
              seed,
              unit,
              growth: stage,
              layers,
              note:
                `color-by: ${colorBy} / seeds: ${seeds} / cleave: ${cleave}` +
                ` / cleave-opacity: ${cleaveOpacity}`,
            }),
            'utf-8',
          )
          entries.push({
            filename,
            section: frames > 1 ? `growth ${Math.round(stage * 100)}%` : 'crystal',
            seed,
            colors,
          })
        }
      }
    }

    finish({
      outDir,
      entries,
      title: '準結晶（カイト＆ダート）',
      baseSeed,
      started,
    })
  } catch (error) {
    console.error(`Error: ${error.message}`)
    process.exitCode = 1
  }
}
