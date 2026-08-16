/**
 * 曲線版：基本領域の上に描く模様を、ベジェ曲線で組み立てる。
 *
 * ここで作るのは「基本領域 1 枚ぶん」の要素だけ。
 * 二面体群の 2n 個の変換でコピーするのは render.js 側の役目。
 */

import {
  v,
  p,
  levelCurve,
  boundaryPath,
  bandPath,
  closedSpline,
} from './geometry.js'
import {
  bandLevels,
  assignBandColors,
  crossedColorsFactory,
  accentColor,
  ensureAllColorsUsed,
} from './composition.js'

/** レベル曲線のサンプル点数（3 本の 3 次ベジェでつなぐ） */
const SAMPLES = 4

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

/** --exclude で名指しできる要素（doc.md の「ロゼッタ版が基本領域に描く要素」の表と対応） */
export const ROLES = ['band', 'ribbon', 'spoke', 'petal', 'blob', 'dot', 'center']

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
  const wobbles = levels.map((_, j) =>
    j === 0 ? null : boundaryWobbles(rng, levels, j),
  )
  const curves = levels.map((lv, j) =>
    j === 0 ? null : levelCurve(domain, lv, wobbles[j]),
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
      d: bandPath(curves[j - 1], curves[j]),
      colorIndex: bandColors[j - 1],
      hairline: true,
    })
  }

  const crossedColors = crossedColorsFactory(levels, bandColors)

  // --- リボン（レベル曲線のストローク） ---
  const ribbonCount = rng.int(1, 3)
  for (let i = 0; i < ribbonCount; i++) {
    // リボン自身の揺らぎ（最大 6%）の分も見込んで上限を取る
    const level = capLevel(rng.float(0.15, 0.97), 1.07)
    const curve = levelCurve(
      domain,
      level,
      rng.wobbles(SAMPLES, rng.float(0.01, 0.06)),
    )
    push('ribbon', {
      kind: 'stroke',
      d: boundaryPath(curve),
      colorIndex: accentColor(rng, colorCount, crossedColors(level)),
      width: rng.float(1.2, 4.5) * unit,
    })
  }

  // --- スポーク（半径方向にしなった線） ---
  const spokeCount = rng.int(0, 2)
  for (let i = 0; i < spokeCount; i++) {
    const theta = rng.float(0.18, 0.82) * alpha
    const fromLevel = rng.float(0.08, 0.4)
    const toLevel = capLevel(rng.float(0.6, 0.99))
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
    push('spoke', {
      kind: 'stroke',
      d: `M${p(from)}C${p(c1)} ${p(c2)} ${p(to)}`,
      colorIndex: accentColor(rng, colorCount, crossedColors(fromLevel, toLevel)),
      width: rng.float(1.2, 3.5) * unit,
    })
  }

  // --- 花弁（中心から外へ伸びる葉状の閉曲線） ---
  if (rng.chance(0.55)) {
    const tipLevel = capLevel(rng.float(0.5, 0.97))
    const tip = pointAt(tipLevel, alpha * rng.float(0.42, 0.58))
    // 制御点をすべて基本領域（凸領域）の内側に置くので、曲線もはみ出さない
    const c1 = pointAt(tipLevel * rng.float(0.2, 0.5), alpha * rng.float(0.05, 0.3))
    const c2 = pointAt(tipLevel * rng.float(0.6, 0.95), alpha * rng.float(0.1, 0.4))
    const c3 = pointAt(tipLevel * rng.float(0.6, 0.95), alpha * rng.float(0.6, 0.9))
    const c4 = pointAt(tipLevel * rng.float(0.2, 0.5), alpha * rng.float(0.7, 0.95))
    push('petal', {
      kind: 'fill',
      d: `M0,0C${p(c1)} ${p(c2)} ${p(tip)}C${p(c3)} ${p(c4)} 0,0Z`,
      colorIndex: accentColor(rng, colorCount, crossedColors(0, tipLevel)),
    })
  }

  // --- ブロブ（基本領域の内側に収まるランダムな閉曲線） ---
  const blobCount = rng.int(0, 3)
  for (let i = 0; i < blobCount; i++) {
    const level = capLevel(rng.float(0.18, 0.88))
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
    push('blob', {
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
    const level = capLevel(rng.float(0.15, 0.92))
    const center = pointAt(level, rng.float(0.2, 0.8) * alpha)
    const r = Math.min(clearance(center) * 0.8, rng.float(1.5, 5) * unit)
    if (r < 1) continue
    push('dot', {
      kind: 'circle',
      cx: center[0],
      cy: center[1],
      r,
      colorIndex: accentColor(rng, colorCount, crossedColors(level)),
    })
  }

  // --- 中心（不動点なのでコピーせず 1 個だけ描く） ---
  const centerElement = rng.chance(0.7)
    ? {
        kind: 'circle',
        cx: 0,
        cy: 0,
        r: rng.float(4, 16) * unit,
        colorIndex: accentColor(rng, colorCount, crossedColors(0)),
      }
    : null
  const center = exclude.has('center') ? null : centerElement

  // --- パレットの色をすべて使い切る ---
  ensureAllColorsUsed(elements, center, colorCount, (colorIndex) => ({
    kind: 'stroke',
    d: boundaryPath(
      levelCurve(domain, capLevel(rng.float(0.2, 0.95), 1.04), rng.wobbles(SAMPLES, 0.03)),
    ),
    colorIndex,
    width: rng.float(2, 4) * unit,
  }))

  return { elements, center, levels, bandColors }
}
