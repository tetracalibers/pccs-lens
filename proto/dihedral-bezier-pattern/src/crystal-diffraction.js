/**
 * 頂点の点群を X 線回折像として見直す。
 *
 * 点群 P = {p₁, p₂, …} の構造因子
 *
 *   S(k) = |Σ exp(-i k·p)|²
 *
 * を波数の平面で数える。周期のある格子なら鋭い点の格子になるが、
 * 準結晶では**周期が無いのに 10 回対称のピークが立つ**。
 * これを薄く敷くと「実空間のタイリング ＋ 逆空間の星」という重ね方ができる。
 *
 * 点の数だけ和をとるので、そのまま画像として敷き詰めると重い。
 * 粗い格子で数えてピーク（極大）だけを拾い、円として描く。
 */

/**
 * @param points 点群（画面の座標）
 * @param unit タイルの短辺の長さ。波数の目盛りをこれで決める
 * @param samples 波数の平面を何分割して数えるか（奇数にすると原点が格子に乗る）
 * @param kMaxUnits 数える波数の上限（2π/unit を 1 とする）
 * @param top 拾うピークの数
 */
export function diffractionPeaks({ points, unit, samples = 161, kMaxUnits = 2.2, top = 520 }) {
  if (points.length === 0) return []

  const cx = points.reduce((s, p) => s + p[0], 0) / points.length
  const cy = points.reduce((s, p) => s + p[1], 0) / points.length

  // 有限の点群をそのまま変換すると、切り口の段差がピークの裾を引く。
  // 外へ行くほど重みを落として（窓関数）、ピークを締める
  const radius = Math.max(
    ...points.map((p) => Math.hypot(p[0] - cx, p[1] - cy)),
    1e-9,
  )
  const xs = new Float64Array(points.length)
  const ys = new Float64Array(points.length)
  const ws = new Float64Array(points.length)
  points.forEach((p, i) => {
    xs[i] = p[0] - cx
    ys[i] = p[1] - cy
    const r = Math.hypot(xs[i], ys[i]) / radius
    ws[i] = 0.5 * (1 + Math.cos(Math.PI * Math.min(1, r)))
  })

  const kMax = (kMaxUnits * 2 * Math.PI) / unit
  const step = (2 * kMax) / (samples - 1)
  const grid = new Float64Array(samples * samples)

  for (let iy = 0; iy < samples; iy++) {
    const ky = -kMax + iy * step
    for (let ix = 0; ix < samples; ix++) {
      const kx = -kMax + ix * step
      let re = 0
      let im = 0
      for (let i = 0; i < xs.length; i++) {
        const phase = kx * xs[i] + ky * ys[i]
        re += ws[i] * Math.cos(phase)
        im += ws[i] * Math.sin(phase)
      }
      grid[iy * samples + ix] = re * re + im * im
    }
  }

  // 原点の輝点（直接透過光）は桁が違うので、拾う範囲から外す
  const kMin = step * 2.5
  const peaks = []
  for (let iy = 1; iy < samples - 1; iy++) {
    for (let ix = 1; ix < samples - 1; ix++) {
      const value = grid[iy * samples + ix]
      let isPeak = true
      for (let dy = -1; dy <= 1 && isPeak; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue
          if (grid[(iy + dy) * samples + ix + dx] > value) {
            isPeak = false
            break
          }
        }
      }
      if (!isPeak) continue

      // 格子の目より細かい位置を、放物線を当てて拾い直す
      const left = grid[iy * samples + ix - 1]
      const right = grid[iy * samples + ix + 1]
      const down = grid[(iy - 1) * samples + ix]
      const up = grid[(iy + 1) * samples + ix]
      const sx = quadraticPeak(left, value, right)
      const sy = quadraticPeak(down, value, up)
      const kx = -kMax + (ix + sx) * step
      const ky = -kMax + (iy + sy) * step
      // 数えるのは正方形の範囲だが、採るのは半径 kMax の円の中だけ。四隅まで採ると
      // 円の外に出た角のぶんだけリングが欠けて、10 回対称が崩れて見える
      const k = Math.hypot(kx, ky)
      if (k < kMin || k > kMax) continue
      peaks.push({ kx, ky, intensity: value })
    }
  }

  peaks.sort((a, b) => b.intensity - a.intensity)
  const strongest = peaks[0]?.intensity ?? 1
  const scale = (2 * Math.PI) / unit

  // |k| が等しいピークは 10 回対称のリングをなす。強さの順に上から切ると
  // リングが途中で欠けて対称性が崩れて見えるので、リング単位で採る
  const rings = new Map()
  for (const p of peaks) {
    if (p.intensity / strongest < 0.0006) continue
    // ピークの位置は放物線で拾い直しているので、|k| は同じリングでも少しばらつく。
    // 丸めを粗くして、同じリングが分かれないようにする
    const key = Math.round((Math.hypot(p.kx, p.ky) / scale) * 80)
    if (!rings.has(key)) rings.set(key, [])
    rings.get(key).push(p)
  }

  const kept = []
  for (const ring of [...rings.values()].sort((a, b) => b[0].intensity - a[0].intensity)) {
    if (kept.length + ring.length > top) continue
    kept.push(...ring)
  }

  return kept.map((p) => ({
    kx: p.kx,
    ky: p.ky,
    // いちばん強いピークを 1 とした相対値。強さは桁で違う（弱いピークとは 1000 倍）ので、
    // 見せ方の圧縮は描く側（`motif-crystal.js`）に任せる
    relative: p.intensity / strongest,
    k: Math.hypot(p.kx, p.ky) / scale,
    kMaxUnits,
  }))
}

/** 3 点に放物線を当てて、極大の位置を -0.5〜0.5 のずれで返す */
function quadraticPeak(a, b, c) {
  const denom = a - 2 * b + c
  if (Math.abs(denom) < 1e-12) return 0
  const shift = (0.5 * (a - c)) / denom
  return Math.max(-0.5, Math.min(0.5, shift))
}
