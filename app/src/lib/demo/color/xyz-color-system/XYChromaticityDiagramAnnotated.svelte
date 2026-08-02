<script lang="ts">
  interface CMFPoint {
    nm: number
    value: number
  }

  // ===== SVG dimensions =====
  // x は 0〜0.8、y は 0〜0.9 を表示範囲とし、xy が等スケールになるよう
  // PLOT_HEIGHT = PLOT_WIDTH * (YMAX / XMAX) で算出する。
  const PLOT_WIDTH = 600
  const PLOT_LEFT = 120
  const PLOT_TOP = 50
  const MARGIN_RIGHT = 40
  const MARGIN_BOTTOM = 110

  // ===== 軸の範囲 =====
  const XMAX = 0.8
  const YMAX = 0.9

  const PLOT_HEIGHT = (PLOT_WIDTH * YMAX) / XMAX
  const TOTAL_WIDTH = PLOT_LEFT + PLOT_WIDTH + MARGIN_RIGHT
  const TOTAL_HEIGHT = PLOT_TOP + PLOT_HEIGHT + MARGIN_BOTTOM
  const PLOT_RIGHT = PLOT_LEFT + PLOT_WIDTH
  const PLOT_BOTTOM = PLOT_TOP + PLOT_HEIGHT

  // ===== 目盛り設定 =====
  const TICK_INTERVAL = 0.1
  const TICK_LENGTH = 8

  // ===== Tick / label sizes =====
  const FONT_SIZE_TICK_LABEL = 18
  const FONT_SIZE_AXIS_LABEL = 28

  // ===== ラベル位置オフセット =====
  const X_TICK_LABEL_OFFSET = 26 // PLOT_BOTTOM から数値ラベル中心まで
  const X_AXIS_LABEL_OFFSET = 72 // PLOT_BOTTOM から軸ラベル中心まで
  const Y_TICK_LABEL_OFFSET = 16 // PLOT_LEFT から数値ラベル右端まで
  const Y_AXIS_LABEL_OFFSET = 84 // PLOT_LEFT から軸ラベル中心まで

  // ===== Stroke widths =====
  const STROKE_WIDTH_AXIS = 2
  const STROKE_WIDTH_TICK = 1.5

  // ===== 色定数 =====
  const COL_AXIS = "var(--color-body)"
  const COL_LABEL = "var(--color-body)"

  // ===== カラーフィル =====
  // 元の xy 色度図と同じ色域の色を、薄く（低い不透明度で）表示する。
  const STEP = 0.01 // 色域内を細かなセルで塗り分ける際の刻み幅（色度座標の単位）
  const CELL_OVERLAP = 1.5 // セル同士の継ぎ目（白スジ）を防ぐ重なり(px)
  const GAMUT_FILL_OPACITY = 0.35 // 色域の塗りの薄さ（0〜1。小さいほど薄い）

  // ===== 境界線（スペクトル軌跡・純紫軌跡）とそのラベル =====
  const STROKE_WIDTH_LOCUS = 6
  const FONT_SIZE_CURVE_LABEL = 22
  const SPECTRAL_LABEL_OFFSET = 14 // スペクトル軌跡から外側へラベルを逃がす距離(px)
  const PURPLE_LABEL_OFFSET = 14 // 純紫軌跡から外側へラベルを逃がす距離(px)
  // スペクトル軌跡ラベルを沿わせる波長範囲（緑〜橙の上辺右側のなだらかな部分）
  const SPECTRAL_LABEL_NM_MIN = 525
  const SPECTRAL_LABEL_NM_MAX = 605

  // ===== 白色点 =====
  // 等エネルギー白色点 E。点を打ち、その上にラベルを表示する。
  const WHITE_X = 1 / 3
  const WHITE_Y = 1 / 3
  const WHITE_DOT_RADIUS = 6
  const WHITE_LABEL_GAP = 8 // 点の上端からラベル下端までの距離(px)
  const FONT_SIZE_WHITE_LABEL = 22

  // スペクトル軌跡を彩色するための波長→色の対応（SpectrumGradient.svelte と同一）
  const SPECTRUM_STOPS = [
    { nm: 405, color: "#4b0082" },
    { nm: 445, color: "#0000ff" },
    { nm: 480, color: "#00bfff" },
    { nm: 535, color: "#00ff00" },
    { nm: 580, color: "#ffff00" },
    { nm: 600, color: "#ff7f00" },
    { nm: 620, color: "#ff0000" },
    { nm: 780, color: "#7a0000" }
  ]
  // 純紫軌跡のグラデーション（青紫 → 赤）
  const COL_PURPLE_START = "#4b0082"
  const COL_PURPLE_END = "#7a0000"

  // SVG 内 id の衝突を避けるための固定サフィックス
  const ID = "xy-chromaticity-annotated"

  // ===== CIE 1931 等色関数（10nm 刻み, 2°視野標準観測者） =====
  // 色度座標を求めて馬蹄形（スペクトル軌跡）を構成するために用いる。
  const xBar: CMFPoint[] = [
    { nm: 380, value: 0.00137 },
    { nm: 390, value: 0.00424 },
    { nm: 400, value: 0.01431 },
    { nm: 410, value: 0.04351 },
    { nm: 420, value: 0.13438 },
    { nm: 430, value: 0.2839 },
    { nm: 440, value: 0.34828 },
    { nm: 450, value: 0.3362 },
    { nm: 460, value: 0.2908 },
    { nm: 470, value: 0.19536 },
    { nm: 480, value: 0.09564 },
    { nm: 490, value: 0.03201 },
    { nm: 500, value: 0.0049 },
    { nm: 510, value: 0.0093 },
    { nm: 520, value: 0.06327 },
    { nm: 530, value: 0.1655 },
    { nm: 540, value: 0.2904 },
    { nm: 550, value: 0.43345 },
    { nm: 560, value: 0.5945 },
    { nm: 570, value: 0.7621 },
    { nm: 580, value: 0.9163 },
    { nm: 590, value: 1.0263 },
    { nm: 600, value: 1.0622 },
    { nm: 610, value: 1.0026 },
    { nm: 620, value: 0.85445 },
    { nm: 630, value: 0.6424 },
    { nm: 640, value: 0.4479 },
    { nm: 650, value: 0.2835 },
    { nm: 660, value: 0.1649 },
    { nm: 670, value: 0.0874 },
    { nm: 680, value: 0.04677 },
    { nm: 690, value: 0.0227 },
    { nm: 700, value: 0.01136 }
  ]

  const yBar: CMFPoint[] = [
    { nm: 380, value: 0.00004 },
    { nm: 390, value: 0.00012 },
    { nm: 400, value: 0.0004 },
    { nm: 410, value: 0.00121 },
    { nm: 420, value: 0.004 },
    { nm: 430, value: 0.0116 },
    { nm: 440, value: 0.023 },
    { nm: 450, value: 0.038 },
    { nm: 460, value: 0.06 },
    { nm: 470, value: 0.09098 },
    { nm: 480, value: 0.13902 },
    { nm: 490, value: 0.20802 },
    { nm: 500, value: 0.323 },
    { nm: 510, value: 0.503 },
    { nm: 520, value: 0.71 },
    { nm: 530, value: 0.862 },
    { nm: 540, value: 0.954 },
    { nm: 550, value: 0.99495 },
    { nm: 560, value: 0.995 },
    { nm: 570, value: 0.952 },
    { nm: 580, value: 0.87 },
    { nm: 590, value: 0.757 },
    { nm: 600, value: 0.631 },
    { nm: 610, value: 0.503 },
    { nm: 620, value: 0.381 },
    { nm: 630, value: 0.265 },
    { nm: 640, value: 0.175 },
    { nm: 650, value: 0.107 },
    { nm: 660, value: 0.061 },
    { nm: 670, value: 0.032 },
    { nm: 680, value: 0.017 },
    { nm: 690, value: 0.00821 },
    { nm: 700, value: 0.0041 }
  ]

  const zBar: CMFPoint[] = [
    { nm: 380, value: 0.00645 },
    { nm: 390, value: 0.02005 },
    { nm: 400, value: 0.06785 },
    { nm: 410, value: 0.2074 },
    { nm: 420, value: 0.6456 },
    { nm: 430, value: 1.3856 },
    { nm: 440, value: 1.74706 },
    { nm: 450, value: 1.77211 },
    { nm: 460, value: 1.6692 },
    { nm: 470, value: 1.28764 },
    { nm: 480, value: 0.81295 },
    { nm: 490, value: 0.46518 },
    { nm: 500, value: 0.272 },
    { nm: 510, value: 0.1582 },
    { nm: 520, value: 0.07825 },
    { nm: 530, value: 0.04216 },
    { nm: 540, value: 0.0203 },
    { nm: 550, value: 0.00875 },
    { nm: 560, value: 0.0039 },
    { nm: 570, value: 0.0021 },
    { nm: 580, value: 0.00165 },
    { nm: 590, value: 0.0011 },
    { nm: 600, value: 0.0008 },
    { nm: 610, value: 0.00034 },
    { nm: 620, value: 0.00019 },
    { nm: 630, value: 0.00005 },
    { nm: 640, value: 0.00002 },
    { nm: 650, value: 0 },
    { nm: 660, value: 0 },
    { nm: 670, value: 0 },
    { nm: 680, value: 0 },
    { nm: 690, value: 0 },
    { nm: 700, value: 0 }
  ]

  interface LocusPoint {
    nm: number
    x: number
    y: number
  }

  // ===== スペクトル軌跡（色度座標） =====
  // 各波長の三刺激値から色度座標 x = X/(X+Y+Z), y = Y/(X+Y+Z) を求める。
  const locus: LocusPoint[] = xBar.map((d, i) => {
    const X = d.value
    const Y = yBar[i].value
    const Z = zBar[i].value
    const sum = X + Y + Z
    return { nm: d.nm, x: X / sum, y: Y / sum }
  })

  // ===== スペクトル軌跡を密にサンプリングした多角形 =====
  // centripetal Catmull-Rom（α=0.5）で軌跡を細かく補間し、なめらかな馬蹄形を得る。
  // 各点には区間内で線形補間した波長を持たせ、スペクトルの色での彩色に使う。
  const CR_ALPHA = 0.5
  const CR_SAMPLE_SPACING = 0.008 // サンプル点間隔（色度座標の単位）の目安

  const crDist = (a: LocusPoint, b: LocusPoint): number => Math.hypot(a.x - b.x, a.y - b.y)

  // 2 点をノット媒介変数 [ta, tb] で線形補間（ノットが一致する場合は端点を返す）
  function crLerp(a: LocusPoint, b: LocusPoint, ta: number, tb: number, t: number): LocusPoint {
    if (tb === ta) return a
    const w = (t - ta) / (tb - ta)
    return { nm: a.nm, x: a.x + (b.x - a.x) * w, y: a.y + (b.y - a.y) * w }
  }

  function catmullRomDensify(pts: LocusPoint[]): LocusPoint[] {
    const out: LocusPoint[] = []
    const n = pts.length
    for (let i = 0; i < n - 1; i++) {
      const p0 = pts[i === 0 ? 0 : i - 1]
      const p1 = pts[i]
      const p2 = pts[i + 1]
      const p3 = pts[i + 2 >= n ? n - 1 : i + 2]
      const t0 = 0
      const t1 = t0 + Math.pow(crDist(p0, p1), CR_ALPHA)
      const t2 = t1 + Math.pow(crDist(p1, p2), CR_ALPHA)
      const t3 = t2 + Math.pow(crDist(p2, p3), CR_ALPHA)
      const segments = Math.max(1, Math.round(crDist(p1, p2) / CR_SAMPLE_SPACING))
      for (let s = 0; s < segments; s++) {
        const t = t1 + ((t2 - t1) * s) / segments
        const a1 = crLerp(p0, p1, t0, t1, t)
        const a2 = crLerp(p1, p2, t1, t2, t)
        const a3 = crLerp(p2, p3, t2, t3, t)
        const b1 = crLerp(a1, a2, t0, t2, t)
        const b2 = crLerp(a2, a3, t1, t3, t)
        const pos = crLerp(b1, b2, t1, t2, t)
        // 波長は区間内で線形補間しておき、軌跡を波長の色で彩色する際に使う
        const nm = p1.nm + (p2.nm - p1.nm) * (s / segments)
        out.push({ nm, x: pos.x, y: pos.y })
      }
    }
    out.push(pts[n - 1])
    return out
  }

  const denseLocus: LocusPoint[] = catmullRomDensify(locus)

  // ===== 座標変換 =====
  const xAt = (x: number): number => PLOT_LEFT + (x / XMAX) * PLOT_WIDTH
  const yAt = (y: number): number => PLOT_BOTTOM - (y / YMAX) * PLOT_HEIGHT

  // ===== 色域境界のクリップパス =====
  // セルの塗りをこの多角形で切り取り、馬蹄形の形に収める。
  // 端（700nm → 380nm）を直線で結んで閉じた辺が純紫軌跡（line of purples）になる。
  const clipPath = "M " + denseLocus.map((p) => `${xAt(p.x)} ${yAt(p.y)}`).join(" L ") + " Z"

  // ===== 色度座標 (x, y) を sRGB 文字列へ変換 =====
  // 明るさ Y=1 として XYZ を復元し、sRGB へ線形変換する。
  // 負の成分は 0 にクランプし、最大成分で正規化して最も鮮やかな色として表示する。
  function gammaEncode(c: number): number {
    return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055
  }

  function xyToRGB(x: number, y: number): string {
    const X = x / y
    const Y = 1
    const Z = (1 - x - y) / y

    let r = 3.2406 * X - 1.5372 * Y - 0.4986 * Z
    let g = -0.9689 * X + 1.8758 * Y + 0.0415 * Z
    let b = 0.0557 * X - 0.204 * Y + 1.057 * Z

    r = Math.max(0, r)
    g = Math.max(0, g)
    b = Math.max(0, b)

    const max = Math.max(r, g, b)
    if (max > 0) {
      r /= max
      g /= max
      b /= max
    }

    const ri = Math.round(gammaEncode(r) * 255)
    const gi = Math.round(gammaEncode(g) * 255)
    const bi = Math.round(gammaEncode(b) * 255)
    return `rgb(${ri}, ${gi}, ${bi})`
  }

  // ===== 点が色域多角形の内側にあるかの判定（レイキャスティング） =====
  function isInside(px: number, py: number): boolean {
    let inside = false
    for (let i = 0, j = denseLocus.length - 1; i < denseLocus.length; j = i++) {
      const xi = denseLocus[i].x
      const yi = denseLocus[i].y
      const xj = denseLocus[j].x
      const yj = denseLocus[j].y
      if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
        inside = !inside
      }
    }
    return inside
  }

  interface Cell {
    cx: number
    cy: number
    color: string
  }

  // ===== 色域を塗りつぶすセル群 =====
  // セル内の 3×3 のサンプル点のいずれかが色域内にあれば描画対象とし、中心の色で塗る。
  // 実際の境界はクリップパスで切り取る。
  const HALF = STEP / 2
  const SAMPLE_OFFSETS = [-HALF, 0, HALF]
  const cells: Cell[] = (() => {
    const result: Cell[] = []
    const cols = Math.ceil(XMAX / STEP)
    const rows = Math.ceil(YMAX / STEP)
    for (let row = 0; row < rows; row++) {
      const cy = (row + 0.5) * STEP
      for (let col = 0; col < cols; col++) {
        const cx = (col + 0.5) * STEP
        let hit = false
        for (const ox of SAMPLE_OFFSETS) {
          for (const oy of SAMPLE_OFFSETS) {
            if (isInside(cx + ox, cy + oy)) {
              hit = true
              break
            }
          }
          if (hit) break
        }
        if (hit) {
          result.push({ cx, cy, color: xyToRGB(cx, cy) })
        }
      }
    }
    return result
  })()

  // セルの描画サイズ（px）。継ぎ目を防ぐため少しだけ大きくする。
  const cellW = (STEP / XMAX) * PLOT_WIDTH + CELL_OVERLAP
  const cellH = (STEP / YMAX) * PLOT_HEIGHT + CELL_OVERLAP

  // ===== スペクトル軌跡の彩色 =====
  // 波長 → 色（SPECTRUM_STOPS を線形補間）
  function parseHex(hex: string): [number, number, number] {
    return [
      parseInt(hex.slice(1, 3), 16),
      parseInt(hex.slice(3, 5), 16),
      parseInt(hex.slice(5, 7), 16)
    ]
  }
  function spectrumColorAt(nm: number): string {
    const stops = SPECTRUM_STOPS
    if (nm <= stops[0].nm) return stops[0].color
    const last = stops[stops.length - 1]
    if (nm >= last.nm) return last.color
    for (let i = 0; i < stops.length - 1; i++) {
      if (nm >= stops[i].nm && nm <= stops[i + 1].nm) {
        const t = (nm - stops[i].nm) / (stops[i + 1].nm - stops[i].nm)
        const c1 = parseHex(stops[i].color)
        const c2 = parseHex(stops[i + 1].color)
        const r = Math.round(c1[0] + (c2[0] - c1[0]) * t)
        const g = Math.round(c1[1] + (c2[1] - c1[1]) * t)
        const b = Math.round(c1[2] + (c2[2] - c1[2]) * t)
        return `rgb(${r}, ${g}, ${b})`
      }
    }
    return last.color
  }

  interface LocusSegment {
    x1: number
    y1: number
    x2: number
    y2: number
    color: string
  }
  // スペクトル軌跡を細かな線分に分け、各線分を波長の色で塗ることで
  // 曲線に沿ったスペクトルのグラデーションを表現する。
  const locusSegments: LocusSegment[] = denseLocus.slice(0, -1).map((p, i) => {
    const q = denseLocus[i + 1]
    return {
      x1: xAt(p.x),
      y1: yAt(p.y),
      x2: xAt(q.x),
      y2: yAt(q.y),
      color: spectrumColorAt((p.nm + q.nm) / 2)
    }
  })

  // 純紫軌跡（軌跡の両端 380nm と 700nm を結ぶ直線）の端点
  const violetEnd = denseLocus[0]
  const redEnd = denseLocus[denseLocus.length - 1]

  // ===== ラベルを線に沿わせるためのオフセットパス =====
  // 各点を、白色点 E から離れる法線方向へ offset(px) ずらした path を作り、
  // textPath で文字を線の外側に沿わせる。
  function offsetPathD(pts: LocusPoint[], offset: number): string {
    const ex = xAt(WHITE_X)
    const ey = yAt(WHITE_Y)
    const n = pts.length
    const coords: string[] = []
    for (let i = 0; i < n; i++) {
      const prev = pts[Math.max(0, i - 1)]
      const next = pts[Math.min(n - 1, i + 1)]
      const sx = xAt(pts[i].x)
      const sy = yAt(pts[i].y)
      let tx = xAt(next.x) - xAt(prev.x)
      let ty = yAt(next.y) - yAt(prev.y)
      const tl = Math.hypot(tx, ty) || 1
      tx /= tl
      ty /= tl
      let nx = -ty
      let ny = tx
      // 法線を外向き（E から離れる向き）に揃える
      if (nx * (sx - ex) + ny * (sy - ey) < 0) {
        nx = -nx
        ny = -ny
      }
      coords.push(`${sx + nx * offset} ${sy + ny * offset}`)
    }
    return "M " + coords.join(" L ")
  }

  // スペクトル軌跡ラベルのパス（上辺右側のなだらかな部分に沿わせる）
  const spectralLabelPathD = offsetPathD(
    denseLocus.filter((p) => p.nm >= SPECTRAL_LABEL_NM_MIN && p.nm <= SPECTRAL_LABEL_NM_MAX),
    SPECTRAL_LABEL_OFFSET
  )
  // 純紫軌跡ラベルのパス（青紫端 → 赤端、線の外側）
  const purpleLabelPathD = offsetPathD([violetEnd, redEnd], PURPLE_LABEL_OFFSET)

  // ===== 白色点の座標 =====
  const whiteCx = xAt(WHITE_X)
  const whiteCy = yAt(WHITE_Y)

  // ===== 目盛り生成 =====
  const xTicks = Array.from(
    { length: Math.round(XMAX / TICK_INTERVAL) + 1 },
    (_, i) => i * TICK_INTERVAL
  )
  const yTicks = Array.from(
    { length: Math.round(YMAX / TICK_INTERVAL) + 1 },
    (_, i) => i * TICK_INTERVAL
  )
  const formatTick = (v: number): string => (v === 0 ? "0" : v.toFixed(1))
</script>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {TOTAL_WIDTH} {TOTAL_HEIGHT}">
  <defs>
    <clipPath id="gamut-clip-{ID}">
      <path d={clipPath} />
    </clipPath>
    <!-- 純紫軌跡のグラデーション（青紫 → 赤）。両端の座標に沿わせる -->
    <linearGradient
      id="purple-line-grad-{ID}"
      gradientUnits="userSpaceOnUse"
      x1={xAt(violetEnd.x)}
      y1={yAt(violetEnd.y)}
      x2={xAt(redEnd.x)}
      y2={yAt(redEnd.y)}
    >
      <stop offset="0" stop-color={COL_PURPLE_START} />
      <stop offset="1" stop-color={COL_PURPLE_END} />
    </linearGradient>
    <!-- ラベルを沿わせるためのオフセットパス -->
    <path id="spectral-label-path-{ID}" d={spectralLabelPathD} fill="none" />
    <path id="purple-label-path-{ID}" d={purpleLabelPathD} fill="none" />
  </defs>

  <!-- 馬蹄形の内部：元の色域の色を薄く（低い不透明度で）表示 -->
  <g clip-path="url(#gamut-clip-{ID})" shape-rendering="crispEdges" opacity={GAMUT_FILL_OPACITY}>
    {#each cells as cell, i (i)}
      <rect
        x={xAt(cell.cx) - cellW / 2}
        y={yAt(cell.cy) - cellH / 2}
        width={cellW}
        height={cellH}
        fill={cell.color}
      />
    {/each}
  </g>

  <!-- スペクトル軌跡（波長の色のグラデーション） -->
  <g stroke-width={STROKE_WIDTH_LOCUS} stroke-linecap="round">
    {#each locusSegments as seg, i (i)}
      <line x1={seg.x1} y1={seg.y1} x2={seg.x2} y2={seg.y2} stroke={seg.color} />
    {/each}
  </g>

  <!-- 純紫軌跡（青紫 → 赤のグラデーション） -->
  <line
    x1={xAt(violetEnd.x)}
    y1={yAt(violetEnd.y)}
    x2={xAt(redEnd.x)}
    y2={yAt(redEnd.y)}
    stroke="url(#purple-line-grad-{ID})"
    stroke-width={STROKE_WIDTH_LOCUS}
    stroke-linecap="round"
  />

  <!-- 各境界線の外側に沿うラベル -->
  <g fill={COL_LABEL} font-size={FONT_SIZE_CURVE_LABEL} font-family="var(--font-ja-base)">
    <text dominant-baseline="auto">
      <textPath href="#spectral-label-path-{ID}" startOffset="50%" text-anchor="middle">
        スペクトル軌跡
      </textPath>
    </text>
    <text dominant-baseline="hanging">
      <textPath href="#purple-label-path-{ID}" startOffset="50%" text-anchor="middle">
        純紫軌跡
      </textPath>
    </text>
  </g>

  <!-- 白色点とそのラベル -->
  <circle cx={whiteCx} cy={whiteCy} r={WHITE_DOT_RADIUS} fill={COL_AXIS} />
  <text
    x={whiteCx}
    y={whiteCy - WHITE_DOT_RADIUS - WHITE_LABEL_GAP}
    text-anchor="middle"
    dominant-baseline="auto"
    font-family="var(--font-ja-base)"
    font-size={FONT_SIZE_WHITE_LABEL}
    fill={COL_LABEL}
  >
    白色点
  </text>

  <!-- 横軸 -->
  <line
    x1={PLOT_LEFT}
    y1={PLOT_BOTTOM}
    x2={PLOT_RIGHT}
    y2={PLOT_BOTTOM}
    stroke={COL_AXIS}
    stroke-width={STROKE_WIDTH_AXIS}
  />

  <!-- 縦軸 -->
  <line
    x1={PLOT_LEFT}
    y1={PLOT_TOP}
    x2={PLOT_LEFT}
    y2={PLOT_BOTTOM}
    stroke={COL_AXIS}
    stroke-width={STROKE_WIDTH_AXIS}
  />

  <!-- 横軸の目盛り -->
  <g stroke={COL_AXIS} stroke-width={STROKE_WIDTH_TICK}>
    {#each xTicks as v (v)}
      <line x1={xAt(v)} y1={PLOT_BOTTOM} x2={xAt(v)} y2={PLOT_BOTTOM + TICK_LENGTH} />
    {/each}
  </g>

  <!-- 縦軸の目盛り -->
  <g stroke={COL_AXIS} stroke-width={STROKE_WIDTH_TICK}>
    {#each yTicks as v (v)}
      <line x1={PLOT_LEFT} y1={yAt(v)} x2={PLOT_LEFT - TICK_LENGTH} y2={yAt(v)} />
    {/each}
  </g>

  <!-- 横軸の数値ラベル -->
  <g fill={COL_LABEL} font-size={FONT_SIZE_TICK_LABEL} text-anchor="middle">
    {#each xTicks as v (v)}
      <text x={xAt(v)} y={PLOT_BOTTOM + X_TICK_LABEL_OFFSET} dominant-baseline="central">
        {formatTick(v)}
      </text>
    {/each}
  </g>

  <!-- 縦軸の数値ラベル -->
  <g fill={COL_LABEL} font-size={FONT_SIZE_TICK_LABEL} text-anchor="end">
    {#each yTicks as v (v)}
      <text x={PLOT_LEFT - Y_TICK_LABEL_OFFSET} y={yAt(v)} dominant-baseline="central">
        {formatTick(v)}
      </text>
    {/each}
  </g>

  <!-- 横軸ラベル「x」 -->
  <text
    x={(PLOT_LEFT + PLOT_RIGHT) / 2}
    y={PLOT_BOTTOM + X_AXIS_LABEL_OFFSET}
    text-anchor="middle"
    dominant-baseline="central"
    font-family="var(--font-math-base), var(--font-ja-base)"
    font-style="italic"
    font-size={FONT_SIZE_AXIS_LABEL}
    fill={COL_LABEL}
  >
    x
  </text>

  <!-- 縦軸ラベル「y」 -->
  <text
    x={PLOT_LEFT - Y_AXIS_LABEL_OFFSET}
    y={(PLOT_TOP + PLOT_BOTTOM) / 2}
    text-anchor="middle"
    dominant-baseline="central"
    font-family="var(--font-math-base), var(--font-ja-base)"
    font-style="italic"
    font-size={FONT_SIZE_AXIS_LABEL}
    fill={COL_LABEL}
  >
    y
  </text>
</svg>
