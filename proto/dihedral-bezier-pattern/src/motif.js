/**
 * 基本領域の上に描く模様を組み立てる。
 *
 * ここで作るのは「基本領域 1 枚ぶん」の要素だけ。
 * 二面体群の 2n 個の変換でコピーするのは generate.js 側の役目。
 */

import {
  v,
  p,
  levelCurve,
  curvePath,
  bandPath,
  closedSpline,
} from './geometry.js'

/** レベル曲線のサンプル点数（3 本の 3 次ベジェでつなぐ） */
const SAMPLES = 4

/**
 * 中心から外周までを分割するレベル（0 = 中心, 1 = 外周）。
 * ランダムな幅で分けるが、どの帯も潰れないよう幅の比を 0.6〜1.8 に収める。
 */
function bandLevels(rng, colorCount) {
  const count = Math.min(8, Math.max(3, colorCount + rng.int(0, 2)))
  const widths = Array.from({ length: count }, () => rng.float(0.6, 1.8))
  const total = widths.reduce((a, b) => a + b, 0)

  const levels = [0]
  let acc = 0
  for (let i = 0; i < count - 1; i++) {
    acc += widths[i] / total
    levels.push(acc)
  }
  levels.push(1)
  return levels
}

/** 隣の境界を追い越さない範囲で境界を揺らす */
function boundaryWobbles(rng, levels, j) {
  const outermost = levels.length - 1
  const gapPrev = levels[j] - levels[j - 1]
  const gapNext = j < outermost ? levels[j + 1] - levels[j] : 0.12
  let amount = (Math.min(gapPrev, gapNext) * 0.32) / levels[j]
  amount = Math.min(amount, 0.18)
  // 最外周はキャンバスからはみ出さないよう控えめに
  if (j === outermost) amount = Math.min(amount, 0.06)
  return rng.wobbles(SAMPLES, amount)
}

/**
 * 帯の色を決める。
 * インデックスが小さい色ほど選ばれやすくして、使用面積の大小関係をつくる。
 */
function assignBandColors(rng, bandCount, colorCount) {
  const weights = Array.from({ length: colorCount }, (_, i) => colorCount - i)
  const assigned = []

  for (let b = 0; b < bandCount; b++) {
    let c = 0
    for (let t = 0; t < 8; t++) {
      c = rng.weightedIndex(weights)
      // 隣り合う帯が同色だと帯の切れ目が消えてしまう
      if (b === 0 || c !== assigned[b - 1]) break
    }
    assigned.push(c)
  }

  // 一度も出てこない色があれば、隣と重複しない帯に割り当てる
  for (let i = 1; i < colorCount; i++) {
    if (assigned.includes(i)) continue
    const slots = assigned
      .map((_, idx) => idx)
      .filter((idx) => assigned[idx - 1] !== i && assigned[idx + 1] !== i)
    if (slots.length > 0) assigned[rng.pick(slots)] = i
  }

  return assigned
}

/**
 * アクセント（面積の小さい要素）の色。
 * 使用面積を小さく保ちたいインデックスの大きい色を優先しつつ、
 * その要素が跨ぐ帯の色（= 下地）と同色になって埋没するのを避ける。
 */
function accentColor(rng, colorCount, crossed) {
  const weights = Array.from({ length: colorCount }, (_, i) =>
    i === 0 ? 0.3 : i,
  )
  const candidates = weights.map((w, i) => (crossed.includes(i) ? 0 : w))
  if (candidates.some((w) => w > 0)) return rng.weightedIndex(candidates)

  // 下地にすべての色が出てくる場合は、下地としての登場が最も少ない色にする
  const frequency = new Array(colorCount).fill(0)
  for (const c of crossed) frequency[c]++
  let best = 0
  for (let i = 1; i < colorCount; i++) {
    if (frequency[i] < frequency[best]) best = i
  }
  return best
}

export function buildMotif({ domain, colorCount, rng }) {
  const { alpha, pointAt, clearance } = domain
  const unit = domain.radius / 200 // 線幅・点の大きさのスケール
  const elements = []

  // --- 帯（面積を担う主要素） ---
  const levels = bandLevels(rng, colorCount)
  const curves = levels.map((lv, j) =>
    j === 0 ? null : levelCurve(domain, lv, boundaryWobbles(rng, levels, j)),
  )
  const bandColors = assignBandColors(rng, levels.length - 1, colorCount)

  for (let j = 1; j < levels.length; j++) {
    elements.push({
      kind: 'fill',
      d: bandPath(curves[j - 1], curves[j]),
      colorIndex: bandColors[j - 1],
      hairline: true,
    })
  }

  /** レベルの範囲 [from, to] が跨ぐ帯の色（アクセントが埋没しないよう避ける） */
  const crossedColors = (from, to = from) => {
    const lo = Math.min(from, to)
    const hi = Math.max(from, to)
    const crossed = []
    for (let j = 1; j < levels.length; j++) {
      if (levels[j] >= lo && levels[j - 1] <= hi) crossed.push(bandColors[j - 1])
    }
    return crossed
  }

  // --- リボン（レベル曲線のストローク） ---
  const ribbonCount = rng.int(1, 3)
  for (let i = 0; i < ribbonCount; i++) {
    const level = rng.float(0.15, 0.97)
    const curve = levelCurve(
      domain,
      level,
      rng.wobbles(SAMPLES, rng.float(0.01, 0.06)),
    )
    elements.push({
      kind: 'stroke',
      d: curvePath(curve),
      colorIndex: accentColor(rng, colorCount, crossedColors(level)),
      width: rng.float(1.2, 4.5) * unit,
    })
  }

  // --- スポーク（半径方向にしなった線） ---
  const spokeCount = rng.int(0, 2)
  for (let i = 0; i < spokeCount; i++) {
    const theta = rng.float(0.18, 0.82) * alpha
    const fromLevel = rng.float(0.08, 0.4)
    const toLevel = rng.float(0.6, 0.99)
    const from = pointAt(fromLevel, theta)
    const to = pointAt(toLevel, theta)
    const delta = v.sub(to, from)
    const length = v.len(delta)
    const dir = v.norm(delta)
    const normal = [-dir[1], dir[0]]
    const mid = v.scale(v.add(from, to), 0.5)
    const maxBend = Math.min(length * 0.22, clearance(mid) * 0.8)
    const bend = rng.float(-maxBend, maxBend)
    const c1 = v.add(v.add(from, v.scale(dir, length / 3)), v.scale(normal, bend))
    const c2 = v.add(v.sub(to, v.scale(dir, length / 3)), v.scale(normal, bend))
    elements.push({
      kind: 'stroke',
      d: `M${p(from)}C${p(c1)} ${p(c2)} ${p(to)}`,
      colorIndex: accentColor(rng, colorCount, crossedColors(fromLevel, toLevel)),
      width: rng.float(1.2, 3.5) * unit,
    })
  }

  // --- 花弁（中心から外へ伸びる葉状の閉曲線） ---
  if (rng.chance(0.55)) {
    const tipLevel = rng.float(0.5, 0.97)
    const tip = pointAt(tipLevel, alpha * rng.float(0.42, 0.58))
    // 制御点をすべて基本領域（凸領域）の内側に置くので、曲線もはみ出さない
    const c1 = pointAt(tipLevel * rng.float(0.2, 0.5), alpha * rng.float(0.05, 0.3))
    const c2 = pointAt(tipLevel * rng.float(0.6, 0.95), alpha * rng.float(0.1, 0.4))
    const c3 = pointAt(tipLevel * rng.float(0.6, 0.95), alpha * rng.float(0.6, 0.9))
    const c4 = pointAt(tipLevel * rng.float(0.2, 0.5), alpha * rng.float(0.7, 0.95))
    elements.push({
      kind: 'fill',
      d: `M0,0C${p(c1)} ${p(c2)} ${p(tip)}C${p(c3)} ${p(c4)} 0,0Z`,
      colorIndex: accentColor(rng, colorCount, crossedColors(0, tipLevel)),
    })
  }

  // --- ブロブ（基本領域の内側に収まるランダムな閉曲線） ---
  const blobCount = rng.int(0, 3)
  for (let i = 0; i < blobCount; i++) {
    const level = rng.float(0.18, 0.88)
    const theta = rng.float(0.28, 0.72) * alpha
    const center = pointAt(level, theta)
    const room = clearance(center)
    if (room < 4 * unit) continue
    const radius = room * rng.float(0.45, 0.85)
    const count = rng.int(5, 8)
    const points = Array.from({ length: count }, (_, k) => {
      const a = (Math.PI * 2 * k) / count + rng.float(-0.18, 0.18)
      const r = radius * rng.float(0.6, 1.05)
      return [center[0] + r * Math.cos(a), center[1] + r * Math.sin(a)]
    })
    const spread = radius / domain.maxRadiusAt(theta)
    elements.push({
      kind: 'fill',
      d: closedSpline(points),
      colorIndex: accentColor(
        rng,
        colorCount,
        crossedColors(level - spread, level + spread),
      ),
    })
  }

  // --- 点 ---
  const dotCount = rng.int(0, 4)
  for (let i = 0; i < dotCount; i++) {
    const level = rng.float(0.15, 0.92)
    const center = pointAt(level, rng.float(0.2, 0.8) * alpha)
    const r = Math.min(clearance(center) * 0.8, rng.float(1.5, 5) * unit)
    if (r < 1) continue
    elements.push({
      kind: 'circle',
      cx: center[0],
      cy: center[1],
      r,
      colorIndex: accentColor(rng, colorCount, crossedColors(level)),
    })
  }

  // --- 中心（不動点なのでコピーせず 1 個だけ描く） ---
  const center = rng.chance(0.7)
    ? {
        r: rng.float(4, 16) * unit,
        colorIndex: accentColor(rng, colorCount, crossedColors(0)),
      }
    : null

  // --- パレットの色をすべて使い切る ---
  const used = new Set(elements.map((e) => e.colorIndex))
  if (center) used.add(center.colorIndex)
  for (let i = 1; i < colorCount; i++) {
    if (used.has(i)) continue
    const level = rng.float(0.2, 0.95)
    elements.push({
      kind: 'stroke',
      d: curvePath(levelCurve(domain, level, rng.wobbles(SAMPLES, 0.03))),
      colorIndex: i,
      width: rng.float(2, 4) * unit,
    })
  }

  return { elements, center, levels, bandColors }
}
