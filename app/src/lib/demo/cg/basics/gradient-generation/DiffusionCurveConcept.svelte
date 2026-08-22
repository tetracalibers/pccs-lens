<script lang="ts">
  import { line, curveBasis } from "d3-shape"

  type Point = { x: number; y: number }

  // ===== SVG dimensions =====
  const WIDTH = 720
  const HEIGHT = 360
  const VIEWBOX_MARGIN = 2 // 枠線が viewBox の縁で切れないための余白

  const ID = "diffusion-curve-concept"

  // ===== 曲線 =====
  // curveBasis（一様3次B-スプライン）の制御点。
  // d3 は両端に短い直線を足すため、最初と最後の制御点は枠の外に置き、
  // 枠内（x: 0〜WIDTH）が必ず曲線部分になるようにしている
  const CURVE_POINTS: Point[] = [
    { x: -170, y: 196 },
    { x: -50, y: 206 },
    { x: 95, y: 224 },
    { x: 265, y: 140 },
    { x: 445, y: 202 },
    { x: 625, y: 124 },
    { x: 770, y: 146 },
    { x: 890, y: 156 }
  ]
  const STROKE_WIDTH_CURVE = 2.5

  // ===== 色の拡散 =====
  const DIFFUSE_REACH = 132 // 曲線から色が届く距離
  const DIFFUSE_STEPS = 48 // 濃淡を作る重ね塗りの枚数
  const DIFFUSE_ALPHA = 0.9 // 曲線上での色の濃さ
  const DIFFUSE_FALLOFF = 2 // 濃さの減衰の鋭さ（大きいほど色が曲線の近くに集まる）

  // ===== 拡散方向の矢印 =====
  const ARROW_ANCHORS = [0.17, 0.5, 0.83] // 曲線上の位置（媒介変数の比率）
  const ARROW_GAP = 16 // 曲線から矢印の始点までの距離
  const ARROW_LENGTH = 62
  const ARROW_STROKE_WIDTH = 2

  // ===== 矢の形状 =====
  const ARROW_HEAD_VIEWBOX = 7 // marker viewBox の一辺
  const ARROW_HEAD_SIZE = 18 // 矢先のレンダリングサイズ（user space）
  // marker 内 polyline の stroke-width。線本体と見た目の太さを一致させる
  const ARROW_HEAD_STROKE = (ARROW_STROKE_WIDTH * ARROW_HEAD_VIEWBOX) / ARROW_HEAD_SIZE

  // ===== 枠 =====
  const FRAME_RADIUS = 6
  const FRAME_STROKE_WIDTH = 1.5
  const FRAME_OPACITY = 0.3

  // ===== 色 =====
  const COL_FRAME = "var(--color-body)"
  const COL_CURVE = "var(--color-body)"
  const COL_UPPER = "var(--canvas-pen-water)" // 曲線の上側に指定した色
  const COL_LOWER = "var(--canvas-pen-orange)" // 曲線の下側に指定した色

  // ===== 曲線のパス =====
  const lineGen = line<Point>()
    .x((d) => d.x)
    .y((d) => d.y)
    .curve(curveBasis)

  const curvePath = lineGen(CURVE_POINTS) ?? ""

  // ===== 片側だけを塗るためのクリップ領域 =====
  // 曲線のパスを枠の外まで囲って閉じ、上側・下側それぞれの領域を作る
  const X_START = CURVE_POINTS[0].x
  const X_END = CURVE_POINTS[CURVE_POINTS.length - 1].x
  const REGION_OVERSHOOT = DIFFUSE_REACH + 40 // 枠外にはみ出させる量
  const UPPER_REGION = `${curvePath} L ${X_END},${-REGION_OVERSHOOT} L ${X_START},${-REGION_OVERSHOOT} Z`
  const LOWER_REGION = `${curvePath} L ${X_END},${HEIGHT + REGION_OVERSHOOT} L ${X_START},${HEIGHT + REGION_OVERSHOOT} Z`

  // ===== 濃淡の作り方 =====
  // 曲線を太さの違うストロークで重ね塗りし、片側にクリップする。
  // 太いものから順に重ねることで、曲線から離れるほど薄くなる falloff が、
  // 曲線の形に沿った形で得られる

  // 曲線から ratio（DIFFUSE_REACH を 1 とした距離）だけ離れた位置の、目標とする濃さ
  const targetOpacity = (ratio: number) => DIFFUSE_ALPHA * (1 - ratio) ** DIFFUSE_FALLOFF

  // step 枚目を塗る直前に残っている透過率
  const remainingTransmittance = (step: number) =>
    step > DIFFUSE_STEPS ? 1 : 1 - targetOpacity((step - 1) / DIFFUSE_STEPS)

  // 重ね塗りの累積が目標の濃さになるよう、1枚ごとの不透明度を逆算する。
  // 外側の帯ほど極端に薄くなるため、拡散の外縁に境目が出ない
  const DIFFUSE_BANDS = Array.from({ length: DIFFUSE_STEPS }, (_, index) => {
    const step = DIFFUSE_STEPS - index // 太いものから順に塗る
    return {
      width: (2 * DIFFUSE_REACH * step) / DIFFUSE_STEPS,
      opacity: 1 - remainingTransmittance(step) / remainingTransmittance(step + 1)
    }
  })

  // ===== 曲線上の位置と法線 =====
  // 一様3次B-スプライン（curveBasis と同じ曲線）を評価する。
  // 矢印を曲線に直交させるために、位置とあわせて接線も求める
  type SplinePoint = { x: number; y: number; nx: number; ny: number }

  function evalSpline(points: Point[], ratio: number): SplinePoint {
    const segments = points.length - 3
    const spanned = Math.min(Math.max(ratio, 0), 1) * segments
    const index = Math.min(Math.floor(spanned), segments - 1)
    const t = spanned - index
    const [p0, p1, p2, p3] = points.slice(index, index + 4)

    const at = (a0: number, a1: number, a2: number, a3: number) =>
      ((-a0 + 3 * a1 - 3 * a2 + a3) * t ** 3 +
        (3 * a0 - 6 * a1 + 3 * a2) * t ** 2 +
        (-3 * a0 + 3 * a2) * t +
        (a0 + 4 * a1 + a2)) /
      6
    const slope = (a0: number, a1: number, a2: number, a3: number) =>
      (3 * (-a0 + 3 * a1 - 3 * a2 + a3) * t ** 2 +
        2 * (3 * a0 - 6 * a1 + 3 * a2) * t +
        (-3 * a0 + 3 * a2)) /
      6

    const x = at(p0.x, p1.x, p2.x, p3.x)
    const y = at(p0.y, p1.y, p2.y, p3.y)
    const dx = slope(p0.x, p1.x, p2.x, p3.x)
    const dy = slope(p0.y, p1.y, p2.y, p3.y)
    const length = Math.hypot(dx, dy)

    // 曲線に直交する単位ベクトル（上向きに揃える）
    let nx = dy / length
    let ny = -dx / length
    if (ny > 0) {
      nx = -nx
      ny = -ny
    }

    return { x, y, nx, ny }
  }

  type Arrow = { x1: number; y1: number; x2: number; y2: number }

  // 曲線上の点から、法線方向へ伸ばした矢印。side で上下を切り替える
  const arrowAt = ({ x, y, nx, ny }: SplinePoint, side: 1 | -1): Arrow => ({
    x1: x + side * nx * ARROW_GAP,
    y1: y + side * ny * ARROW_GAP,
    x2: x + side * nx * (ARROW_GAP + ARROW_LENGTH),
    y2: y + side * ny * (ARROW_GAP + ARROW_LENGTH)
  })

  const ARROW_SAMPLES = ARROW_ANCHORS.map((ratio) => evalSpline(CURVE_POINTS, ratio))
  const upperArrows = ARROW_SAMPLES.map((sample) => arrowAt(sample, 1))
  const lowerArrows = ARROW_SAMPLES.map((sample) => arrowAt(sample, -1))
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="{-VIEWBOX_MARGIN} {-VIEWBOX_MARGIN} {WIDTH + VIEWBOX_MARGIN * 2} {HEIGHT +
    VIEWBOX_MARGIN * 2}"
>
  <defs>
    <clipPath id="frame-{ID}">
      <rect x="0" y="0" width={WIDTH} height={HEIGHT} rx={FRAME_RADIUS} />
    </clipPath>
    <clipPath id="upper-{ID}">
      <path d={UPPER_REGION} />
    </clipPath>
    <clipPath id="lower-{ID}">
      <path d={LOWER_REGION} />
    </clipPath>

    <marker
      id="arrow-upper-{ID}"
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
        stroke={COL_UPPER}
        stroke-width={ARROW_HEAD_STROKE}
        stroke-linecap="round"
        stroke-linejoin="round"
        transform="translate(1.1667 1.75)"
      />
    </marker>
    <marker
      id="arrow-lower-{ID}"
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
        stroke={COL_LOWER}
        stroke-width={ARROW_HEAD_STROKE}
        stroke-linecap="round"
        stroke-linejoin="round"
        transform="translate(1.1667 1.75)"
      />
    </marker>
  </defs>

  <g clip-path="url(#frame-{ID})">
    <!-- 上側へ拡散する色 -->
    <g clip-path="url(#upper-{ID})">
      {#each DIFFUSE_BANDS as band}
        <path
          d={curvePath}
          fill="none"
          stroke={COL_UPPER}
          stroke-width={band.width}
          stroke-opacity={band.opacity}
        />
      {/each}
    </g>

    <!-- 下側へ拡散する色 -->
    <g clip-path="url(#lower-{ID})">
      {#each DIFFUSE_BANDS as band}
        <path
          d={curvePath}
          fill="none"
          stroke={COL_LOWER}
          stroke-width={band.width}
          stroke-opacity={band.opacity}
        />
      {/each}
    </g>

    <!-- 拡散していく向き -->
    {#each upperArrows as arrow}
      <line
        x1={arrow.x1}
        y1={arrow.y1}
        x2={arrow.x2}
        y2={arrow.y2}
        stroke={COL_UPPER}
        stroke-width={ARROW_STROKE_WIDTH}
        stroke-linecap="round"
        marker-end="url(#arrow-upper-{ID})"
      />
    {/each}
    {#each lowerArrows as arrow}
      <line
        x1={arrow.x1}
        y1={arrow.y1}
        x2={arrow.x2}
        y2={arrow.y2}
        stroke={COL_LOWER}
        stroke-width={ARROW_STROKE_WIDTH}
        stroke-linecap="round"
        marker-end="url(#arrow-lower-{ID})"
      />
    {/each}

    <!-- 作り手が指定した1本の曲線 -->
    <path
      d={curvePath}
      fill="none"
      stroke={COL_CURVE}
      stroke-width={STROKE_WIDTH_CURVE}
      stroke-linecap="round"
    />
  </g>

  <rect
    x="0"
    y="0"
    width={WIDTH}
    height={HEIGHT}
    rx={FRAME_RADIUS}
    fill="none"
    stroke={COL_FRAME}
    stroke-width={FRAME_STROKE_WIDTH}
    stroke-opacity={FRAME_OPACITY}
  />
</svg>
