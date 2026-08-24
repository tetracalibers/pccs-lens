/**
 * 準結晶版の組み立て。
 *
 * カイト＆ダート版は「タイルを塗る」だけだったが、こちらは同じタイリングを
 * **鉱物の標本**として見せるために、いくつかの層を重ねる。
 *
 * | 層 | 何を描くか |
 * | --- | --- |
 * | diffraction | 頂点の点群のフーリエ変換。10 回対称のピークを薄く敷く |
 * | tile | タイルの面。色分けにしたがって平らに塗る |
 * | edge | タイルの輪郭（構造そのものを見たいとき） |
 * | cleave | 頂点が乗る平行線族。結晶の劈開線・層として引く |
 * | network | 頂点と辺のネットワーク。節点は集まるタイルの内訳で大きさを変える |
 * | grain | 粒界。結晶核を複数置いたとき、粒の境目のタイルを沈める |
 *
 * 色分けは 3 通りから選ぶ（`--color-by`）。どれも最後に「見えている面積の
 * 大きい順」へ色番号を振り直すのは、他の版と同じ。
 */

import { polygonArea, PHI } from './kite-dart-geometry.js'
import { GROUPS as CLASS_GROUPS } from './motif-kite-dart.js'
import {
  orientationOf,
  tileCenter,
  crystallinity,
  stageOf,
  positionNoise,
  assignGrain,
  grainHalfPlanes,
  viewportHalfPlanes,
  clipLine,
  clipSegmentToDisc,
} from './crystal-geometry.js'
import { shadeHex, inkOf } from './color-utils.js'
import { BACKGROUND } from './palettes.js'

export const LAYERS = ['diffraction', 'tile', 'edge', 'cleave', 'network', 'grain']
export const COLOR_BY = ['orientation', 'class', 'zone']

/**
 * タイルの色分けの群。色数を k としたとき 0〜k-1 を返す。
 *
 * - orientation：軸の向き（36 度刻みの 10 系統）を k 等分する。結晶面の系統ごとに色が変わる
 * - class：カイト＆ダート版と同じ「どのタイルから生まれたか」
 * - zone：核からの距離。境目の半径を φ で縮めていくので、成長痕のような同心の輪になる
 */
function grouperFor(colorBy, colorCount, maxRadius) {
  if (colorBy === 'orientation') {
    return ({ orientation }) => Math.floor((orientation * colorCount) / 10)
  }
  if (colorBy === 'class') {
    const groups = CLASS_GROUPS[colorCount]
    if (!groups) throw new Error(`色数 ${colorCount} の分け方が定義されていません`)
    const index = new Map()
    groups.forEach((classes, i) => {
      for (const cls of classes) index.set(cls, i)
    })
    return ({ tile }) => index.get(tile.cls) ?? 0
  }
  return ({ distance }) => {
    const ratio = Math.max(distance, 1e-6) / maxRadius
    const ring = Math.floor(Math.log(1 / ratio) / Math.log(PHI))
    return Math.max(0, Math.min(colorCount - 1, ring))
  }
}

/**
 * 準結晶のモチーフを組み立てる。
 *
 * @param grains 核ごとのタイリング `{ nucleus, tiles, network, lines }`
 * @param peaks 回折のピーク（点群は核をまたいで 1 つにまとめたもの）
 * @param colors パレット
 * @param growth 結晶化の進み具合（0〜1）
 * @param cleaveOpacity 劈開線の濃さの倍率（0〜1）。太さは変えない
 * @returns `{ groups }` 描く順に並べた図形の束
 */
export function buildCrystalMotif({
  grains,
  nuclei,
  peaks,
  colors,
  colorBy,
  layers,
  unit,
  size,
  growth,
  cleaveOpacity = 1,
}) {
  const half = size / 2
  const corner = half * Math.SQRT2
  const band = unit * 4
  const radius = growth * (corner + band)
  const ink = inkOf(colors)
  const group = grouperFor(colorBy, colors.length, corner)
  const shown = (p) => Math.abs(p[0]) < half && Math.abs(p[1]) < half

  /* --- タイルを並べ、群ごとの面積を数える --- */

  const areas = new Array(colors.length).fill(0)
  const placed = []
  for (const grain of grains) {
    for (const tile of grain.tiles) {
      const center = tileCenter(tile)
      const distance = Math.hypot(
        center[0] - grain.nucleus.center[0],
        center[1] - grain.nucleus.center[1],
      )
      // 結晶化の境目を円のままにすると縁が機械的に見えるので、タイルごとに揺らす
      const wobble = (positionNoise(center, unit) - 0.5) * band * 0.9
      const value = crystallinity(distance + wobble, radius, band)
      const stage = stageOf(value)
      if (stage === 0) continue

      const orientation = orientationOf(tile, grain.nucleus.angle)
      const index = group({ tile, orientation, distance })
      // 描くのは粒の領域で切った形。向きや親子はもとの形から取る
      const shape = tile.draw ?? tile.points
      if (shown(center) && stage === 3) areas[index] += polygonArea(shape)
      placed.push({ shape, center, index, stage })
    }
  }

  // 色はインデックスが小さいほど使用面積が大きい
  const rank = areas
    .map((area, index) => ({ area, index }))
    .sort((a, b) => b.area - a.area)
    .map(({ index }) => index)
  const colorOf = new Array(colors.length)
  rank.forEach((g, colorIndex) => {
    colorOf[g] = colorIndex
  })

  /* --- 層を組み立てる --- */

  const groups = []
  const wants = (name) => layers.includes(name)

  if (wants('tile')) {
    const fills = []
    const nascent = []

    for (const item of placed) {
      let color = colors[colorOf[item.index]]

      // 粒界にかかったタイルは沈める。割れ目の線だけより、境目に厚みが出る
      const margin = nuclei.length > 1 ? assignGrain(item.center, nuclei).margin : Infinity
      const onBoundary = wants('grain') && margin < unit * 1.1
      if (onBoundary) color = shadeHex(color, -0.3)

      if (item.stage === 1) {
        // 析出しかけの縁は面を持たず、輪郭だけが見える
        pushSegments(nascent, item.shape)
        continue
      }
      fills.push({
        points: item.shape,
        color,
        opacity: item.stage === 2 ? 0.45 : 1,
      })
    }

    groups.push({ kind: 'fill', name: 'tile', items: fills })
    if (nascent.length > 0) {
      groups.push({
        kind: 'stroke',
        name: 'nascent',
        stroke: ink,
        width: Math.max(0.5, unit * 0.022),
        opacity: 0.35,
        segments: nascent,
      })
    }
  }

  if (wants('edge')) {
    const segments = []
    for (const item of placed) pushSegments(segments, item.shape)
    groups.push({
      kind: 'stroke',
      name: 'edge',
      stroke: ink,
      width: Math.max(0.5, unit * 0.028),
      opacity: 0.5,
      segments,
    })
  }

  if (wants('cleave')) {
    groups.push(...cleaveLayer({ grains, nuclei, ink, half, radius, unit, alpha: cleaveOpacity }))
  }

  if (wants('network')) {
    // タイルの面の上に重ねるときは控えめにする。面が無ければ格子そのものが
    // 主役になるので、そのままの濃さで描く
    const weight = wants('tile') ? 0.5 : 1
    groups.push(...networkLayer({ grains, ink, unit, radius, corner, half, weight }))
  }

  if (wants('grain') && nuclei.length > 1) {
    const segments = grainBoundaries(nuclei, half)
    if (segments.length > 0) {
      // 割れ目として見せるので、背景色で溝を空けてから細い線を 1 本入れる
      groups.push({
        kind: 'stroke',
        name: 'grain-gap',
        stroke: BACKGROUND,
        width: Math.max(2, unit * 0.16),
        opacity: 0.9,
        segments,
      })
      groups.push({
        kind: 'stroke',
        name: 'grain',
        stroke: ink,
        width: Math.max(0.8, unit * 0.05),
        opacity: 0.6,
        segments,
      })
    }
  }

  // 回折像はいちばん上に薄く重ねる。背面に置くとタイルの面に隠れて見えない
  if (wants('diffraction') && peaks.length > 0) {
    groups.push(diffractionLayer(peaks, ink, half))
  }

  return { groups, ink, tiles: placed.length }
}

/* --- 各層 --- */

/**
 * 回折像。逆空間の波数を、上限がちょうど画面の半分になるように写す。
 * ピークの強さで円の大きさと濃さを決める。
 *
 * 強さは 3 桁にわたるので、そのまま大きさに使うと数個の輝点しか見えない。
 * 天体写真と同じように、べき乗で強さを圧縮してから大きさに写す。
 */
function diffractionLayer(peaks, ink, half) {
  const scale = (half * 0.94) / peaks[0].kMaxUnits
  const items = peaks.map((peak) => {
    const norm = Math.hypot(peak.kx, peak.ky) || 1
    const strength = peak.relative ** 0.15
    return {
      c: [(peak.kx / norm) * peak.k * scale, (peak.ky / norm) * peak.k * scale],
      r: Math.max(0.9, strength ** 2 * half * 0.028),
      opacity: 0.1 + strength ** 2 * 0.42,
    }
  })
  return { kind: 'dot', name: 'diffraction', color: ink, items }
}

/**
 * 劈開線。粒の領域と、結晶化が届いた範囲で切る。
 *
 * `alpha` は濃さの倍率（`--cleave-opacity`）。太さは変えないので、頂点の多い線と
 * 少ない線の太さの差はそのまま残り、全体だけが淡くなる。
 */
function cleaveLayer({ grains, nuclei, ink, half, radius, unit, alpha }) {
  const box = viewportHalfPlanes(half)
  const strong = []
  const faint = []

  for (const grain of grains) {
    const planes = [...box, ...grainHalfPlanes(nuclei, grain.index)]
    for (const line of grain.lines) {
      const segment = clipLine(line, planes)
      if (!segment) continue
      const clipped = clipSegmentToDisc(segment, grain.nucleus.center, radius)
      if (!clipped) continue
      ;(line.strength > 0.55 ? strong : faint).push(clipped)
    }
  }

  return [
    { kind: 'stroke', name: 'cleave', stroke: ink, width: unit * 0.05, opacity: 0.42 * alpha, segments: strong },
    { kind: 'stroke', name: 'cleave-faint', stroke: ink, width: unit * 0.03, opacity: 0.22 * alpha, segments: faint },
  ].filter((g) => g.segments.length > 0 && g.opacity > 0)
}

/**
 * 頂点ネットワーク。
 *
 * 辺は細く、節点は集まるタイルの内訳で描き分ける。カイト 5 枚（太陽）と
 * ダート 5 枚（星）だけが 5 回対称なので、この 2 つは十角形の節点にする。
 */
function networkLayer({ grains, ink, unit, radius, corner, half, weight }) {
  const segments = []
  const dots = []
  const stars = []
  const inside = (p) => Math.abs(p[0]) < half + unit && Math.abs(p[1]) < half + unit
  // 中心から外へ向かって薄れさせる。中心ほど結晶らしく、外ほど崩れて見える
  const fade = (p) => weight * (0.35 + 0.65 * (1 - Math.min(1, Math.hypot(...p) / corner)))

  for (const grain of grains) {
    const center = grain.nucleus.center
    const reach = (p) => Math.hypot(p[0] - center[0], p[1] - center[1]) < radius

    for (const edge of grain.network.edges) {
      const mid = [(edge.a[0] + edge.b[0]) / 2, (edge.a[1] + edge.b[1]) / 2]
      if (!reach(mid) || !inside(mid)) continue
      segments.push([edge.a, edge.b])
    }

    for (const vertex of grain.network.vertices) {
      if (!reach(vertex.point) || !inside(vertex.point)) continue
      const symmetric = vertex.valence === 5 && (vertex.kites === 5 || vertex.darts === 5)
      const item = {
        c: vertex.point,
        r: unit * (0.035 + vertex.valence * 0.013) * (0.6 + 0.4 * weight),
        opacity: fade(vertex.point),
      }
      if (symmetric) stars.push({ ...item, r: unit * 0.14 * (0.6 + 0.4 * weight) })
      else dots.push(item)
    }
  }

  const groups = [
    { kind: 'stroke', name: 'network', stroke: ink, width: unit * 0.022, opacity: 0.3 * weight, segments },
    { kind: 'dot', name: 'node', color: ink, items: dots },
  ]
  if (stars.length > 0) {
    groups.push({ kind: 'decagon', name: 'node-star', color: ink, items: stars })
  }
  return groups.filter((g) => (g.segments ?? g.items).length > 0)
}

/**
 * 粒界。2 つの核の垂直二等分線を、その 2 つの粒の領域と画面で切る。
 * タイルは境目で切れているので、この線がそのまま断面の割れ目になる。
 */
function grainBoundaries(nuclei, half) {
  const box = viewportHalfPlanes(half)
  const segments = []

  for (let i = 0; i < nuclei.length; i++) {
    for (let j = i + 1; j < nuclei.length; j++) {
      const a = nuclei[i].center
      const b = nuclei[j].center
      const gap = Math.hypot(b[0] - a[0], b[1] - a[1])
      if (gap < 1e-9) continue
      const nx = (b[0] - a[0]) / gap
      const ny = (b[1] - a[1]) / gap
      const line = { nx, ny, offset: (nx * (a[0] + b[0])) / 2 + (ny * (a[1] + b[1])) / 2 }
      const clipped = clipLine(line, [...box, ...grainHalfPlanes(nuclei, i)])
      if (clipped) segments.push(clipped)
    }
  }

  return segments
}

/* --- 小道具 --- */

function pushSegments(out, points) {
  for (let i = 0; i < points.length; i++) {
    out.push([points[i], points[(i + 1) % points.length]])
  }
}

