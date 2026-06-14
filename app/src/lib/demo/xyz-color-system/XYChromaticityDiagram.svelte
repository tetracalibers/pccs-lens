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
  // 色域内を細かなセルで塗り分ける際の刻み幅（色度座標の単位）
  const STEP = 0.01
  // セル同士の継ぎ目（白スジ）を防ぐためのレンダリング上の重なり（px）
  const CELL_OVERLAP = 1.5

  // SVG 内 id の衝突を避けるための固定サフィックス
  const ID = "xy-chromaticity"

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
  // 色域の塗り（セル選択）に使う多角形を、表示に使う d3 の Catmull-Rom 曲線に
  // 合わせるため、同じ centripetal Catmull-Rom（α=0.5）で軌跡を細かく補間する。
  // x・y は等倍スケールのため、色度座標空間でのサンプリングで曲線形状が一致する。
  // これを怠ると、点間隔が広い 500〜510nm 付近で塗りが曲線に届かず白く残る。
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
        out.push(crLerp(b1, b2, t1, t2, t))
      }
    }
    out.push(pts[n - 1])
    return out
  }

  const denseLocus: LocusPoint[] = catmullRomDensify(locus)

  // ===== 座標変換 =====
  const xAt = (x: number): number => PLOT_LEFT + (x / XMAX) * PLOT_WIDTH
  const yAt = (y: number): number => PLOT_BOTTOM - (y / YMAX) * PLOT_HEIGHT

  // ===== 色域境界（スペクトル軌跡 + 純紫軌跡）のクリップパス =====
  // 内外判定（isInside）と同一の denseLocus 多角形からクリップパスを作り、
  // 塗りのセル選択と境界形状を完全に一致させる。
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
  // クリップに使う曲線と一致させるため、密にサンプリングした denseLocus を用いる。
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
  // セル内の 3×3 のサンプル点（四隅・各辺の中点・中心）のいずれかが色域内にあれば
  // 描画対象とし、中心の色で塗る。実際の境界はクリップパスで切り取る。
  // 四隅だけの判定では、赤端のような鋭い角でセルを取りこぼして白く残るため、
  // サンプル点を増やして角付近まで確実にセルを拾う。
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
  </defs>

  <!-- 色域の塗りつぶし（多数のセルを色域境界でクリップ） -->
  <g clip-path="url(#gamut-clip-{ID})" shape-rendering="crispEdges">
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
