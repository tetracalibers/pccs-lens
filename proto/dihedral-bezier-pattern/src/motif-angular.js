/**
 * 直線版：基本領域の上に描く模様を、直線だけで組み立てる。
 *
 * 曲線版（motif.js）と構図・配色のルールは共通で、輪郭の作り方だけが違う。
 * レベル曲線を折れ線に、閉曲線を多角形に、円を菱形に置き換えている。
 */

import {
  p,
  levelPolyline,
  boundaryPath,
  bandPath,
  polygonPath,
  regularPolygonPath,
} from './geometry.js'
import {
  bandLevels,
  assignBandColors,
  crossedColorsFactory,
  accentColor,
  ensureAllColorsUsed,
} from './composition.js'

/** 角ばった要素は直線の交わりを見せたいので、線の継ぎ目は尖らせる */
const SHARP = { cap: 'butt', join: 'miter' }

/**
 * 帯の境界の折れ数。すべての帯で同じ数を使うと歯の位置が揃い、
 * 同心のジグザグとして読める。
 */
function toothCount(rng) {
  return rng.int(4, 9)
}

/**
 * 符号を交互に振った揺らぎ。
 * 交互にすることで、ランダムな凹凸ではなく規則的な鋸歯になる。
 */
function alternating(rng, teeth, amount) {
  return Array.from(
    { length: teeth + 1 },
    (_, i) => (i % 2 === 0 ? 1 : -1) * amount * rng.float(0.5, 1),
  )
}

/** 帯の境界。隣の境界を追い越さない範囲に振幅を抑える */
function bandWobbles(rng, levels, j, teeth) {
  const outermost = levels.length - 1
  const gapPrev = levels[j] - levels[j - 1]
  const gapNext = j < outermost ? levels[j + 1] - levels[j] : 0.12
  let amount = (Math.min(gapPrev, gapNext) * 0.38) / levels[j]
  amount = Math.min(amount, 0.22)
  // 最外周はキャンバスからはみ出さないよう控えめに
  if (j === outermost) amount = Math.min(amount, 0.07)
  return alternating(rng, teeth, amount)
}

/** 単独の折れ線（帯に挟まれていないので、外周をはみ出さない範囲で振る） */
function lineWobbles(rng, level, teeth, maxLevel) {
  const room = Math.max(0.03, (maxLevel - level) / level)
  return alternating(rng, teeth, Math.min(rng.float(0.04, 0.14), room))
}

/** --exclude で名指しできる要素（doc.md の「ロゼッタ版が基本領域に描く要素」の表と対応） */
export const ROLES = [
  'band',
  'ribbon',
  'spoke',
  'petal',
  'shard',
  'blob',
  'dot',
  'center',
]

export function buildMotif({ domain, colorCount, rng, exclude = new Set() }) {
  const { alpha, pointAt, clearance } = domain
  const unit = domain.radius / 200 // 線幅・点の大きさのスケール
  const elements = []

  /**
   * 要素を積む。除外された要素も組み立てまでは今までどおり行うので、
   * rng の消費列が変わらない（= 同じ seed の絵からその要素だけが消える）。
   */
  const push = (role, element) => {
    if (!exclude.has(role)) elements.push(element)
  }

  // --- 帯（面積を担う主要素） ---
  const levels = bandLevels(rng, colorCount)
  const teeth = toothCount(rng)
  // 階段状にすると、鋸歯ではなく城壁のような凹凸になる
  const stepped = rng.chance(0.3)
  const wobbles = levels.map((_, j) =>
    j === 0 ? null : bandWobbles(rng, levels, j, teeth),
  )
  const boundaries = levels.map((lv, j) =>
    j === 0 ? null : levelPolyline(domain, lv, wobbles[j], { step: stepped }),
  )
  const bandColors = assignBandColors(rng, levels.length - 1, colorCount)

  // 最外周の帯が最も内側へ凹むレベル。
  // ここを超えるアクセントは模様の外へ飛び出して見えるので、上限として使う。
  const outerLimit = 1 + Math.min(...wobbles[levels.length - 1])
  /** headroom は、その要素自身がさらに外へ振れる余地の分 */
  const capLevel = (level, headroom = 1.005) =>
    Math.min(level, outerLimit / headroom)

  for (let j = 1; j < levels.length; j++) {
    push('band', {
      kind: 'fill',
      d: bandPath(boundaries[j - 1], boundaries[j]),
      colorIndex: bandColors[j - 1],
      hairline: true,
      join: 'miter',
    })
  }

  const crossedColors = crossedColorsFactory(levels, bandColors)

  // --- リボン（折れ線のストローク） ---
  const ribbonCount = rng.int(1, 3)
  for (let i = 0; i < ribbonCount; i++) {
    const level = capLevel(rng.float(0.15, 0.97))
    const line = levelPolyline(domain, level, lineWobbles(rng, level, teeth, outerLimit), {
      step: rng.chance(0.3),
    })
    push('ribbon', {
      kind: 'stroke',
      d: boundaryPath(line),
      colorIndex: accentColor(rng, colorCount, crossedColors(level)),
      width: rng.float(1.6, 4.5) * unit,
      // 端点は鏡映線をまたぐので、丸めておかないとコピーとの間に欠けが出る
      cap: 'round',
      join: 'miter',
    })
  }

  // --- スポーク（まっすぐな放射線） ---
  const spokeCount = rng.int(0, 2)
  for (let i = 0; i < spokeCount; i++) {
    const theta = rng.float(0.18, 0.82) * alpha
    const fromLevel = rng.float(0.08, 0.4)
    const toLevel = capLevel(rng.float(0.6, 0.99))
    push('spoke', {
      kind: 'stroke',
      d: `M${p(pointAt(fromLevel, theta))}L${p(pointAt(toLevel, theta))}`,
      colorIndex: accentColor(rng, colorCount, crossedColors(fromLevel, toLevel)),
      // 細すぎると意図した線ではなく傷のように見えるので、曲線版より下限を上げる
      width: rng.float(2, 5) * unit,
      ...SHARP,
    })
  }

  // --- 花弁（中心から外へ伸びる凧形） ---
  if (rng.chance(0.55)) {
    const tipLevel = capLevel(rng.float(0.5, 0.97))
    // 頂点をすべて基本領域（凸領域）の内側に置くので、多角形もはみ出さない
    const tip = pointAt(tipLevel, alpha * rng.float(0.42, 0.58))
    const left = pointAt(tipLevel * rng.float(0.25, 0.7), alpha * rng.float(0.05, 0.35))
    const right = pointAt(tipLevel * rng.float(0.25, 0.7), alpha * rng.float(0.65, 0.95))
    push('petal', {
      kind: 'fill',
      d: polygonPath([[0, 0], left, tip, right]),
      colorIndex: accentColor(rng, colorCount, crossedColors(0, tipLevel)),
      join: 'miter',
    })
  }

  // --- 破片（基本領域の内側に置くランダムな三角形） ---
  const shardCount = rng.int(0, 2)
  for (let i = 0; i < shardCount; i++) {
    const levelsOf = Array.from({ length: 3 }, () => capLevel(rng.float(0.12, 0.95)))
    const points = levelsOf.map((lv) => pointAt(lv, rng.float(0.05, 0.95) * alpha))
    push('shard', {
      kind: 'fill',
      d: polygonPath(points),
      colorIndex: accentColor(
        rng,
        colorCount,
        crossedColors(Math.min(...levelsOf), Math.max(...levelsOf)),
      ),
      join: 'miter',
    })
  }

  // --- ブロブ（基本領域の内側に収まるランダムな多角形） ---
  const blobCount = rng.int(0, 3)
  for (let i = 0; i < blobCount; i++) {
    const level = capLevel(rng.float(0.18, 0.88))
    const theta = rng.float(0.28, 0.72) * alpha
    const center = pointAt(level, theta)
    const room = clearance(center)
    if (room < 4 * unit) continue
    const radius = room * rng.float(0.45, 0.9)
    const count = rng.int(3, 6)
    const turn = rng.float(0, Math.PI * 2)
    const points = Array.from({ length: count }, (_, k) => {
      const a = turn + (Math.PI * 2 * k) / count + rng.float(-0.15, 0.15)
      const r = radius * rng.float(0.7, 1)
      return [center[0] + r * Math.cos(a), center[1] + r * Math.sin(a)]
    })
    const spread = radius / domain.maxRadiusAt(theta)
    push('blob', {
      kind: 'fill',
      d: polygonPath(points),
      colorIndex: accentColor(
        rng,
        colorCount,
        crossedColors(level - spread, level + spread),
      ),
      join: 'miter',
    })
  }

  // --- 点（正方形・菱形） ---
  const dotCount = rng.int(0, 4)
  for (let i = 0; i < dotCount; i++) {
    const level = capLevel(rng.float(0.15, 0.92))
    const center = pointAt(level, rng.float(0.2, 0.8) * alpha)
    const r = Math.min(clearance(center) * 0.8, rng.float(2, 6) * unit)
    if (r < 1) continue
    const turn = rng.chance(0.5) ? Math.PI / 4 : 0
    const points = Array.from({ length: 4 }, (_, k) => {
      const a = turn + (Math.PI / 2) * k
      return [center[0] + r * Math.cos(a), center[1] + r * Math.sin(a)]
    })
    push('dot', {
      kind: 'fill',
      d: polygonPath(points),
      colorIndex: accentColor(rng, colorCount, crossedColors(level)),
      join: 'miter',
    })
  }

  // --- 中心（不動点なのでコピーせず 1 個だけ描く。対称性に合わせた正 n 角形） ---
  const centerElement = rng.chance(0.7)
    ? {
        kind: 'fill',
        d: regularPolygonPath(
          domain.n,
          rng.float(4, 16) * unit,
          rng.chance(0.5) ? alpha : 0,
        ),
        colorIndex: accentColor(rng, colorCount, crossedColors(0)),
        join: 'miter',
      }
    : null
  const center = exclude.has('center') ? null : centerElement

  // --- パレットの色をすべて使い切る ---
  ensureAllColorsUsed(elements, center, colorCount, (colorIndex) => {
    const level = capLevel(rng.float(0.2, 0.95))
    return {
      kind: 'stroke',
      d: boundaryPath(
        levelPolyline(domain, level, lineWobbles(rng, level, teeth, outerLimit)),
      ),
      colorIndex,
      width: rng.float(2, 4) * unit,
      cap: 'round',
      join: 'miter',
    }
  })

  return { elements, center, levels, bandColors }
}
