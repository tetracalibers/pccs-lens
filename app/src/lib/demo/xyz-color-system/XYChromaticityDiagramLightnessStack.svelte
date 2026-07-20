<script lang="ts">
  interface CMFPoint {
    nm: number
    value: number
  }

  // ===== レイアウト（斜投影による積層） =====
  // 1 枚の xy 色度図を「斜投影された水平面」として描き、明度ごとに縦に積み重ねる。
  // 上の層ほど明るく、下の層ほど暗い色度図になる。
  const PROJ_W = 360 // 内部プロット空間（正面図）の幅。斜投影行列で各層へ変換する
  const N_LAYERS = 3 // 積み重ねる色度図の枚数（明るさ 1.0 / 0.70 / 0.40 の3枚）
  const LAYER_GAP = 108 // 隣り合う層の垂直間隔

  // x軸・y軸の画面ベクトル（色度 0→最大値 での画面変位）。斜投影の向きを決める。
  // x軸・y軸をともに右上へ伸ばし、赤端（x が最大）が右上へ向くようにする。
  const XAXIS_VEC_X = 325 // x軸：右方向の伸び
  const XAXIS_VEC_Y = -40 // x軸：縦方向の伸び（正で下＝赤端が右下、負で上＝赤端が右上）
  const YAXIS_VEC_X = -40 // y軸：横方向の伸び（小さいほど開き角が広がる。負でY軸より左＝向こう側へ倒れる）
  const YAXIS_VEC_Y = -120 // y軸：上方向の伸び（負で上向き＝奥行き）

  // ===== 軸の範囲（参考: XYChromaticityDiagram.svelte と同じ） =====
  const XMAX = 0.8
  const YMAX = 0.9

  // ===== 各層の明るさ =====
  // 最上層 = 1.0（最も明るい・最も鮮やか）、最下層 = B_MIN（最も暗い）。
  // 暗さは色域の上に黒を不透明度 (1 - 明るさ) で重ねて表現する。
  const B_MIN = 0.4

  // ===== 色域フィル用の内部プロット空間 =====
  // 色域は一度だけこの空間に描き、各層は <use> で参照して斜投影行列で配置する。
  const PG_W = PROJ_W
  const PG_H = (PG_W * YMAX) / XMAX

  // 色域内を細かなセルで塗り分ける際の刻み幅（色度座標の単位）
  const STEP = 0.01
  // セル同士の継ぎ目（白スジ）を防ぐためのレンダリング上の重なり（プロット空間 px）
  // 斜投影で縦方向が圧縮されるため、縦の重なりは大きめにとる。
  const CELL_OVERLAP_X = 1.5
  const CELL_OVERLAP_Y = 3.5

  // ===== Stroke / サイズ =====
  const STROKE_WIDTH_ROD = 3 // 無彩色軸（白色点を貫く棒）の太さ

  // ===== ラベル =====
  const FONT_SIZE_LABEL = 24

  // ===== 矢の形状（タイプA）：座標軸の矢印に使う =====
  const ARROW_STROKE_WIDTH = 3
  const ARROW_HEAD_VIEWBOX = 7 // marker viewBox の一辺
  const ARROW_HEAD_SIZE = 20 // 矢先のレンダリングサイズ（user space）
  const ARROW_HEAD_STROKE = (ARROW_STROKE_WIDTH * ARROW_HEAD_VIEWBOX) / ARROW_HEAD_SIZE

  // ===== 白色点（等エネルギー白色点 E） =====
  const WHITE_X = 1 / 3
  const WHITE_Y = 1 / 3

  // ===== 色定数 =====
  const COL_AXIS = "var(--color-body)"
  const COL_LABEL = "var(--color-body)"

  // SVG 内 id の衝突を避けるための固定サフィックス
  const ID = "xy-chromaticity-lightness-stack"

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
  const locus: LocusPoint[] = xBar.map((d, i) => {
    const X = d.value
    const Y = yBar[i].value
    const Z = zBar[i].value
    const sum = X + Y + Z
    return { nm: d.nm, x: X / sum, y: Y / sum }
  })

  // ===== スペクトル軌跡を密にサンプリングした多角形 =====
  // centripetal Catmull-Rom（α=0.5）で軌跡を細かく補間し、なめらかな馬蹄形を得る。
  const CR_ALPHA = 0.5
  const CR_SAMPLE_SPACING = 0.008

  const crDist = (a: LocusPoint, b: LocusPoint): number => Math.hypot(a.x - b.x, a.y - b.y)

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

  // ===== 色域フィル用プロット空間の座標変換 =====
  // PLOT_LEFT = 0, PLOT_TOP = 0 とした 1 枚分の「正面図」座標。
  const gx = (x: number): number => (x / XMAX) * PG_W
  const gy = (y: number): number => PG_H - (y / YMAX) * PG_H

  // ===== 色域境界（スペクトル軌跡 + 純紫軌跡）のクリップパス =====
  const clipPath = "M " + denseLocus.map((p) => `${gx(p.x)} ${gy(p.y)}`).join(" L ") + " Z"

  // ===== 色度座標 (x, y) を sRGB 文字列へ変換（明るさ Y=1 の最も鮮やかな色） =====
  function gammaEncode(c: number): number {
    return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055
  }

  function xyToRGB255(x: number, y: number): [number, number, number] {
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

    return [
      Math.round(gammaEncode(r) * 255),
      Math.round(gammaEncode(g) * 255),
      Math.round(gammaEncode(b) * 255)
    ]
  }

  function xyToRGB(x: number, y: number): string {
    const [ri, gi, bi] = xyToRGB255(x, y)
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

  // ===== 色域を塗りつぶすセル群（一度だけ計算し、各層で共有する） =====
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

  const cellW = (STEP / XMAX) * PG_W + CELL_OVERLAP_X
  const cellH = (STEP / YMAX) * PG_H + CELL_OVERLAP_Y

  // ===== 斜投影 =====
  // プロット空間 (gx, gy) → 画面座標へのアフィン変換 matrix(a b c d e f)。
  // gx = (x/XMAX)*PG_W, gy = PG_H - (y/YMAX)*PG_H。x軸・y軸の画面ベクトルから導く。
  const M_A = XAXIS_VEC_X / PG_W
  const M_B = XAXIS_VEC_Y / PG_W
  const M_C = -YAXIS_VEC_X / PG_H
  const M_D = -YAXIS_VEC_Y / PG_H
  const M_E = YAXIS_VEC_X

  // 色度座標 (x, y) を第 L 層の画面座標へ投影する（ラベルや軸の配置に使う）。
  const projX = (x: number, y: number): number =>
    (x / XMAX) * XAXIS_VEC_X + (y / YMAX) * YAXIS_VEC_X
  const projY = (x: number, y: number, layer: number): number =>
    layer * LAYER_GAP + (x / XMAX) * XAXIS_VEC_Y + (y / YMAX) * YAXIS_VEC_Y

  // 各層の明るさ（最上層 = 1.0 → 最下層 = B_MIN）
  const layerBrightness = (index: number): number => 1 - (index / (N_LAYERS - 1)) * (1 - B_MIN)

  interface Layer {
    index: number
    matrix: string
    overlay: number // 暗くするための黒の不透明度（最上層は 0）
  }
  const layers: Layer[] = Array.from({ length: N_LAYERS }, (_, index) => {
    const brightness = layerBrightness(index)
    const f = index * LAYER_GAP + YAXIS_VEC_Y
    return {
      index,
      matrix: `matrix(${M_A} ${M_B} ${M_C} ${M_D} ${M_E} ${f})`,
      overlay: 1 - brightness
    }
  })

  // ===== 無彩色軸が貫く白色点の画面 x（軸・ラベルの配置に使う） =====
  const whitePointX = projX(WHITE_X, WHITE_Y)

  // ===== 無彩色軸のうち「白色点より上」を前面に描くセグメント =====
  // 各層で白色点から少し上まで棒を前面に重ね、色度図を貫いて見せる。
  const ROD_PIERCE_UP = 55 // 白色点より上に前面表示する長さ（画面 px）
  const rodFrontSegments = Array.from({ length: N_LAYERS }, (_, index) => {
    const wy = projY(WHITE_X, WHITE_Y, index)
    return { y1: wy - ROD_PIERCE_UP, y2: wy }
  })

  // ===== 全層の色域を囲むバウンディングボックス =====
  // x は層に依らず一定。y は最上層（index 0）が最も高く、最下層が最も低い。
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  for (const p of denseLocus) {
    const sx = projX(p.x, p.y)
    minX = Math.min(minX, sx)
    maxX = Math.max(maxX, sx)
    minY = Math.min(minY, projY(p.x, p.y, 0))
    maxY = Math.max(maxY, projY(p.x, p.y, N_LAYERS - 1))
  }

  // ===== 無彩色軸（白色点を貫く棒）の上下端 =====
  const ROD_TOP_Y = minY - 40
  const ROD_BOTTOM_Y = maxY + 22

  // ===== 座標軸（xy 平面）=====
  // x軸（斜め右上）・y軸（斜め左上・奥行き）を最下段の色度図の原点で交わらせる。
  // 縦の輝度方向（Y軸）は無彩色軸（白色点を貫く棒）が兼ねる。
  const BASE_LAYER = N_LAYERS - 1
  const ORIGIN_SX = projX(0, 0) // 原点（x=0, y=0）の画面 x
  const ORIGIN_SY = projY(0, 0, BASE_LAYER) // 原点の画面 y（最下段の原点）
  const AXIS_EXT = 24 // 軸を色域の端より少し先へ伸ばす量

  // x軸：原点から (XMAX, 0) 方向（斜め右上）へ、少し先まで
  const xCornerSX = projX(XMAX, 0)
  const xCornerSY = projY(XMAX, 0, BASE_LAYER)
  const xAxisLen = Math.hypot(xCornerSX - ORIGIN_SX, xCornerSY - ORIGIN_SY)
  const XAXIS_END_SX = xCornerSX + (AXIS_EXT * (xCornerSX - ORIGIN_SX)) / xAxisLen
  const XAXIS_END_SY = xCornerSY + (AXIS_EXT * (xCornerSY - ORIGIN_SY)) / xAxisLen

  // y軸：原点から (0, YMAX) 方向（斜め左上・奥行き）へ、少し先まで
  const yCornerSX = projX(0, YMAX)
  const yCornerSY = projY(0, YMAX, BASE_LAYER)
  const yAxisLen = Math.hypot(yCornerSX - ORIGIN_SX, yCornerSY - ORIGIN_SY)
  const YAXIS_END_SX = yCornerSX + (AXIS_EXT * (yCornerSX - ORIGIN_SX)) / yAxisLen
  const YAXIS_END_SY = yCornerSY + (AXIS_EXT * (yCornerSY - ORIGIN_SY)) / yAxisLen

  // 軸ラベル（x・y いずれも矢の先＝矢印の延長上に置く）
  const LABEL_TIP_GAP = 20 // 矢の先からラベル中心までの距離
  const XLABEL_X = XAXIS_END_SX + (LABEL_TIP_GAP * (xCornerSX - ORIGIN_SX)) / xAxisLen
  const XLABEL_Y = XAXIS_END_SY + (LABEL_TIP_GAP * (xCornerSY - ORIGIN_SY)) / xAxisLen
  const YLABEL_X = YAXIS_END_SX + (LABEL_TIP_GAP * (yCornerSX - ORIGIN_SX)) / yAxisLen
  const YLABEL_Y = YAXIS_END_SY + (LABEL_TIP_GAP * (yCornerSY - ORIGIN_SY)) / yAxisLen

  // ===== 「Y」ラベル（無彩色軸＝Y軸の上向き矢印の先） =====
  const ROD_LABEL_X = whitePointX
  const ROD_LABEL_Y = ROD_TOP_Y - 26 // 上向き矢じり分＋余白だけ上へ

  // ===== viewBox（中身にフィットさせる） =====
  const VB_LEFT = Math.min(minX, YLABEL_X - 14) - 6
  const VB_TOP = ROD_LABEL_Y - 16 // Y ラベル（無彩色軸上端）まで含める
  const VB_RIGHT = Math.max(maxX, XLABEL_X + 14)
  const VB_BOTTOM = Math.max(ROD_BOTTOM_Y, XAXIS_END_SY + 22) + 8
  const VB_WIDTH = VB_RIGHT - VB_LEFT
  const VB_HEIGHT = VB_BOTTOM - VB_TOP
</script>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="{VB_LEFT} {VB_TOP} {VB_WIDTH} {VB_HEIGHT}">
  <defs>
    <clipPath id="gamut-clip-{ID}">
      <path d={clipPath} />
    </clipPath>
    <!-- 色域の塗り（一度だけ定義し、各層から <use> で参照する） -->
    <g id="gamut-{ID}" clip-path="url(#gamut-clip-{ID})">
      {#each cells as cell, i (i)}
        <rect
          x={gx(cell.cx) - cellW / 2}
          y={gy(cell.cy) - cellH / 2}
          width={cellW}
          height={cellH}
          fill={cell.color}
        />
      {/each}
    </g>
    <!-- 矢じり（タイプA）：座標軸の矢印用 -->
    <marker
      id="arrow-{ID}"
      viewBox="0 0 {ARROW_HEAD_VIEWBOX} {ARROW_HEAD_VIEWBOX}"
      refX={ARROW_HEAD_VIEWBOX / 2}
      refY={ARROW_HEAD_VIEWBOX / 2}
      markerWidth={ARROW_HEAD_SIZE}
      markerHeight={ARROW_HEAD_SIZE}
      markerUnits="userSpaceOnUse"
      orient="auto-start-reverse"
    >
      <polyline
        points="0,3.5 3.5,1.75 0,0"
        fill="none"
        stroke={COL_AXIS}
        stroke-width={ARROW_HEAD_STROKE}
        stroke-linecap="round"
        stroke-linejoin="round"
        transform="translate(1.1667 1.75)"
      />
    </marker>
  </defs>

  <!-- 無彩色軸（＝Y軸。白色点を貫く棒）：各層より背面に描き、上端に上向き矢印 -->
  <line
    x1={whitePointX}
    y1={ROD_TOP_Y}
    x2={whitePointX}
    y2={ROD_BOTTOM_Y}
    stroke={COL_AXIS}
    stroke-width={STROKE_WIDTH_ROD}
    stroke-linecap="round"
    marker-start="url(#arrow-{ID})"
  />

  <!-- 各層の色度図（明るい層が上、暗い層が下） -->
  {#each layers as layer (layer.index)}
    <use href="#gamut-{ID}" transform={layer.matrix} />
    {#if layer.overlay > 0}
      <!-- 下の層ほど黒を重ねて暗くする -->
      <path d={clipPath} transform={layer.matrix} fill="#000000" opacity={layer.overlay} />
    {/if}
  {/each}

  <!-- 座標軸：x軸（斜め右上）・y軸（斜め左上）を原点で交わらせる -->
  <line
    x1={ORIGIN_SX}
    y1={ORIGIN_SY}
    x2={XAXIS_END_SX}
    y2={XAXIS_END_SY}
    stroke={COL_AXIS}
    stroke-width={ARROW_STROKE_WIDTH}
    stroke-linecap="round"
    marker-end="url(#arrow-{ID})"
  />
  <line
    x1={ORIGIN_SX}
    y1={ORIGIN_SY}
    x2={YAXIS_END_SX}
    y2={YAXIS_END_SY}
    stroke={COL_AXIS}
    stroke-width={ARROW_STROKE_WIDTH}
    stroke-linecap="round"
    marker-end="url(#arrow-{ID})"
  />

  <!-- 無彩色軸：白色点より上の区間を前面に描き、各色度図を貫いて見せる -->
  {#each rodFrontSegments as seg, i (i)}
    <line
      x1={whitePointX}
      y1={seg.y1}
      x2={whitePointX}
      y2={seg.y2}
      stroke={COL_AXIS}
      stroke-width={STROKE_WIDTH_ROD}
      stroke-linecap="round"
    />
  {/each}

  <!-- 座標軸ラベル -->
  <text
    x={XLABEL_X}
    y={XLABEL_Y}
    text-anchor="middle"
    dominant-baseline="central"
    font-family="var(--font-ja-base)"
    font-size={FONT_SIZE_LABEL}
    fill={COL_LABEL}
  >
    x
  </text>
  <text
    x={YLABEL_X}
    y={YLABEL_Y}
    text-anchor="middle"
    dominant-baseline="central"
    font-family="var(--font-ja-base)"
    font-size={FONT_SIZE_LABEL}
    fill={COL_LABEL}
  >
    y
  </text>

  <!-- 「Y」ラベル（無彩色軸＝Y軸の上向き矢印の先） -->
  <text
    x={ROD_LABEL_X}
    y={ROD_LABEL_Y}
    text-anchor="middle"
    dominant-baseline="central"
    font-family="var(--font-ja-base)"
    font-size={FONT_SIZE_LABEL}
    fill={COL_LABEL}
  >
    Y
  </text>
</svg>
