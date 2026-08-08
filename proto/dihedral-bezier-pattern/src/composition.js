/**
 * 曲線版・直線版で共通の「構図と配色」のルール。
 *
 * 背景は白固定なので、パレットの色はすべて模様の側で使い切る。
 * インデックスが小さい色ほど使用面積が大きくなるように重みを付ける。
 */

/**
 * 中心から外周までを分割するレベル（0 = 中心, 1 = 外周）。
 * ランダムな幅で分けるが、どの帯も潰れないよう幅の比を 0.6〜1.8 に収める。
 */
export function bandLevels(rng, colorCount) {
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

/**
 * 帯の色を決める。
 * インデックスが小さい色ほど選ばれやすくして、使用面積の大小関係をつくる。
 */
export function assignBandColors(rng, bandCount, colorCount) {
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
  for (let i = 0; i < colorCount; i++) {
    if (assigned.includes(i)) continue
    const slots = assigned
      .map((_, idx) => idx)
      .filter((idx) => assigned[idx - 1] !== i && assigned[idx + 1] !== i)
    if (slots.length > 0) assigned[rng.pick(slots)] = i
  }

  return assigned
}

/**
 * レベルの範囲が跨ぐ帯の色を返す関数を作る。
 * アクセントが下地と同色になって埋没するのを避けるために使う。
 */
export function crossedColorsFactory(levels, bandColors) {
  return (from, to = from) => {
    const lo = Math.min(from, to)
    const hi = Math.max(from, to)
    const crossed = []
    for (let j = 1; j < levels.length; j++) {
      if (levels[j] >= lo && levels[j - 1] <= hi) crossed.push(bandColors[j - 1])
    }
    return crossed
  }
}

/**
 * アクセント（面積の小さい要素）の色。
 * 使用面積を小さく保ちたいインデックスの大きい色を優先しつつ、
 * その要素が跨ぐ帯の色（= 下地）と同色になるのを避ける。
 */
export function accentColor(rng, colorCount, crossed) {
  const weights = Array.from({ length: colorCount }, (_, i) => i + 0.5)
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

/**
 * パレットの色を 1 つも取りこぼしていないか確かめ、
 * 使われていない色があれば makeFallback で補う。
 */
export function ensureAllColorsUsed(elements, center, colorCount, makeFallback) {
  const used = new Set(elements.map((e) => e.colorIndex))
  if (center) used.add(center.colorIndex)
  for (let i = 0; i < colorCount; i++) {
    if (used.has(i)) continue
    elements.push(makeFallback(i))
  }
}
