<script lang="ts">
  // ===== 波のパラメータ =====
  const WAVELEN = 30 // 波長（回折波面どうしの間隔。凸部から最初の波面までも同じ）
  const N_DIFFRACTED = 5 // 回折波面（半円）の本数

  // ===== 面と凸部 =====
  const BUMP_R = 7 // 凸部の半径。波長（30）より小さい＝「小さな凸部」
  const SURFACE_H = 10 // 面の厚み
  const SURFACE_MARGIN = 26 // 最外の回折波面より外へ面を伸ばす量

  // ===== 進行方向を示す矢印 =====
  const IN_ARROW_LEAD = 24 // 入射矢印の始点が最外の回折波面より外にある量
  const IN_ARROW_GAP = 10 // 凸部の表面から入射矢印の矢先までの隙間
  const OUT_ARROW_ANGLES = [-65, -30, 30, 65] // 回折波が広がる方向（真上が0、負が左）
  const OUT_ARROW_GAP = 10 // 凸部の表面から放射矢印の始点までの距離
  const OUT_ARROW_OVERSHOOT = 24 // 放射矢印が最外の回折波面より外へ突き抜ける量

  // ===== 線幅 =====
  const STROKE_WIDTH_WAVE = 1.4
  const STROKE_WIDTH_ARROW = 2.5

  // ===== 矢の形状（タイプA） =====
  const ARROW_HEAD_VIEWBOX = 7 // marker viewBox の一辺
  const ARROW_HEAD_SIZE = 16 // 矢先のレンダリングサイズ（user space）
  // marker 内 polyline の stroke-width。線本体と見た目の太さを一致させる
  const ARROW_HEAD_STROKE = (STROKE_WIDTH_ARROW * ARROW_HEAD_VIEWBOX) / ARROW_HEAD_SIZE

  // ===== 色 =====
  const COL_WAVE = "var(--canvas-pen-water)" // 回折後の波面
  const COL_ARROW = "var(--canvas-pen-orange)" // 光の進行方向
  const COL_SURFACE = "var(--color-body)" // 面と凸部

  // ===== 余白 =====
  const PAD = 16

  // ===== 幾何計算（原点は凸部の中心。SVG は y 下向き・上が負） =====
  const toRad = (d: number) => (d * Math.PI) / 180

  type Pt = { x: number; y: number }

  // 回折波面の半径。凸部を点波源として、波長ごとに半円が広がる
  const diffractedRadii = Array.from({ length: N_DIFFRACTED }, (_, i) => (i + 1) * WAVELEN)
  const R_MAX = diffractedRadii[diffractedRadii.length - 1]

  // 面は最外の回折波面より外側まで伸ばし、波が凸部だけから広がっていることを示す
  const SURFACE_HALF_W = R_MAX + SURFACE_MARGIN

  // 面（y = 0 が表面）の中央に、半円状の小さな凸部を持つ輪郭
  const surfacePath = [
    `M ${-SURFACE_HALF_W} 0`,
    `L ${-BUMP_R} 0`,
    `A ${BUMP_R} ${BUMP_R} 0 0 1 ${BUMP_R} 0`,
    `L ${SURFACE_HALF_W} 0`,
    `L ${SURFACE_HALF_W} ${SURFACE_H}`,
    `L ${-SURFACE_HALF_W} ${SURFACE_H}`,
    "Z"
  ].join(" ")

  // 回折前の光。凸部の真上から下りてきて、凸部の手前で止める
  const inArrow = {
    x: 0,
    y1: -(R_MAX + IN_ARROW_LEAD),
    y2: -(BUMP_R + IN_ARROW_GAP)
  }

  // 回折後の光。凸部のすぐ外から放射状に広がり、最外の回折波面を突き抜けて伸びる
  const OUT_ARROW_R1 = BUMP_R + OUT_ARROW_GAP
  const OUT_ARROW_R2 = R_MAX + OUT_ARROW_OVERSHOOT
  const outArrows = OUT_ARROW_ANGLES.map((deg) => {
    // 真上（0度）を基準に、面の上側の半空間へ広がる向き
    const dx = Math.sin(toRad(deg))
    const dy = -Math.cos(toRad(deg))
    return {
      from: { x: OUT_ARROW_R1 * dx, y: OUT_ARROW_R1 * dy } as Pt,
      to: { x: OUT_ARROW_R2 * dx, y: OUT_ARROW_R2 * dy } as Pt
    }
  })

  // ===== viewBox（すべての要素を内包するよう算出） =====
  const bboxPts: Pt[] = [
    { x: -SURFACE_HALF_W, y: 0 },
    { x: SURFACE_HALF_W, y: SURFACE_H },
    { x: -R_MAX, y: 0 },
    { x: R_MAX, y: 0 },
    { x: 0, y: -R_MAX },
    { x: inArrow.x, y: inArrow.y1 },
    ...outArrows.flatMap((a) => [a.from, a.to])
  ]
  const xs = bboxPts.map((p) => p.x)
  const ys = bboxPts.map((p) => p.y)
  const minX = Math.min(...xs) - PAD
  const minY = Math.min(...ys) - PAD
  const VB_W = Math.max(...xs) + PAD - minX
  const VB_H = Math.max(...ys) + PAD - minY
  const viewBox = `${minX} ${minY} ${VB_W} ${VB_H}`
</script>

<svg xmlns="http://www.w3.org/2000/svg" {viewBox}>
  <defs>
    <!-- 進行方向の矢じり -->
    <marker
      id="bump-diffraction-arrow"
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
        stroke={COL_ARROW}
        stroke-width={ARROW_HEAD_STROKE}
        stroke-linecap="round"
        stroke-linejoin="round"
        transform="translate(1.1667 1.75)"
      />
    </marker>
  </defs>

  <!-- 回折波の波面（凸部を中心に半円状に広がる） -->
  {#each diffractedRadii as r (r)}
    <path
      d="M {-r} 0 A {r} {r} 0 0 1 {r} 0"
      fill="none"
      stroke={COL_WAVE}
      stroke-width={STROKE_WIDTH_WAVE}
      stroke-linecap="round"
    />
  {/each}

  <!-- 回折前の光（凸部へ向かって直進する） -->
  <line
    x1={inArrow.x}
    y1={inArrow.y1}
    x2={inArrow.x}
    y2={inArrow.y2}
    stroke={COL_ARROW}
    stroke-width={STROKE_WIDTH_ARROW}
    stroke-linecap="round"
    marker-end="url(#bump-diffraction-arrow)"
  />

  <!-- 回折後の光の進行方向（凸部から放射状に広がる） -->
  {#each outArrows as a, i (i)}
    <line
      x1={a.from.x}
      y1={a.from.y}
      x2={a.to.x}
      y2={a.to.y}
      stroke={COL_ARROW}
      stroke-width={STROKE_WIDTH_ARROW}
      stroke-linecap="round"
      marker-end="url(#bump-diffraction-arrow)"
    />
  {/each}

  <!-- 面（中央に小さな凸部がある） -->
  <path d={surfacePath} fill={COL_SURFACE} />
</svg>
