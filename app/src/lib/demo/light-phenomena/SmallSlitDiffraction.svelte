<script lang="ts">
  // ===== 波のパラメータ =====
  const WAVELEN = 30 // 波長（回折波面どうしの間隔。スリットから最初の波面までも同じ）
  const N_DIFFRACTED = 5 // 回折波面（半円）の本数

  // ===== 障壁とスリット =====
  const BARRIER_W = 10 // 障壁の厚み
  const SLIT_HALF = 6 // スリットの半幅。波長（30）より狭い＝「小さなスリット」
  const BARRIER_MARGIN = 26 // 最外の回折波面より外へ障壁を伸ばす量
  const BARRIER_R = 3 // 障壁の角丸

  // ===== 進行方向を示す矢印 =====
  const IN_ARROW_LEN = 180 // 回折前の光（入射矢印）の長さ
  const IN_ARROW_GAP = 10 // 障壁の入射面から入射矢印の矢先までの隙間
  const OUT_ARROW_ANGLES = [-60, -30, 0, 30, 60] // 回折波が広がる方向（0が正面、負が上）
  const OUT_ARROW_GAP = 10 // スリットの出口から放射矢印の始点までの距離
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
  const COL_ARROW_IN = "var(--canvas-pen-orange)" // 回折前の光
  const COL_ARROW_OUT = "var(--canvas-pen-yellow)" // 回折後の光
  const COL_BARRIER = "var(--color-body)" // 障壁

  // ===== 余白 =====
  const PAD = 16

  // ===== 幾何計算（原点はスリットの出口。SVG は y 下向き・上が負） =====
  const toRad = (d: number) => (d * Math.PI) / 180

  type Pt = { x: number; y: number }

  // 回折波面の半径。スリットを点波源として、波長ごとに半円が広がる
  const diffractedRadii = Array.from({ length: N_DIFFRACTED }, (_, i) => (i + 1) * WAVELEN)
  const R_MAX = diffractedRadii[diffractedRadii.length - 1]

  // 障壁は最外の回折波面より外側まで伸ばし、波が回り込む余地がないことを示す
  const BARRIER_HALF_H = R_MAX + BARRIER_MARGIN
  const BARRIER_LEFT = -BARRIER_W // 障壁の入射側の面（出口面が x = 0）
  const BARRIER_PART_H = BARRIER_HALF_H - SLIT_HALF // スリットで分かれた上下それぞれの高さ

  // 回折前の光。スリットの中心軸（y = 0）に沿って左から進み、穴の手前で止める
  const inArrow = {
    x1: BARRIER_LEFT - IN_ARROW_GAP - IN_ARROW_LEN,
    x2: BARRIER_LEFT - IN_ARROW_GAP,
    y: 0
  }

  // 回折後の光。スリットを出た直後から放射状に広がり、最外の回折波面を突き抜けて伸びる
  const OUT_ARROW_R1 = OUT_ARROW_GAP
  const OUT_ARROW_R2 = R_MAX + OUT_ARROW_OVERSHOOT
  const outArrows = OUT_ARROW_ANGLES.map((deg) => {
    const c = Math.cos(toRad(deg))
    const s = Math.sin(toRad(deg))
    return {
      from: { x: OUT_ARROW_R1 * c, y: OUT_ARROW_R1 * s } as Pt,
      to: { x: OUT_ARROW_R2 * c, y: OUT_ARROW_R2 * s } as Pt
    }
  })

  // ===== viewBox（すべての要素を内包するよう算出） =====
  const bboxPts: Pt[] = [
    { x: BARRIER_LEFT, y: -BARRIER_HALF_H },
    { x: BARRIER_LEFT, y: BARRIER_HALF_H },
    { x: R_MAX, y: 0 },
    { x: 0, y: -R_MAX },
    { x: 0, y: R_MAX },
    { x: inArrow.x1, y: inArrow.y },
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
    <!-- 回折前の光の矢じり（オレンジ） -->
    <marker
      id="slit-diffraction-arrow-in"
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
        stroke={COL_ARROW_IN}
        stroke-width={ARROW_HEAD_STROKE}
        stroke-linecap="round"
        stroke-linejoin="round"
        transform="translate(1.1667 1.75)"
      />
    </marker>
    <!-- 回折後の光の矢じり（イエロー） -->
    <marker
      id="slit-diffraction-arrow-out"
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
        stroke={COL_ARROW_OUT}
        stroke-width={ARROW_HEAD_STROKE}
        stroke-linecap="round"
        stroke-linejoin="round"
        transform="translate(1.1667 1.75)"
      />
    </marker>
  </defs>

  <!-- 回折前の光（スリットへ向かって直進する） -->
  <line
    x1={inArrow.x1}
    y1={inArrow.y}
    x2={inArrow.x2}
    y2={inArrow.y}
    stroke={COL_ARROW_IN}
    stroke-width={STROKE_WIDTH_ARROW}
    stroke-linecap="round"
    marker-end="url(#slit-diffraction-arrow-in)"
  />

  <!-- 回折波の波面（スリットを中心に半円状に広がる） -->
  {#each diffractedRadii as r (r)}
    <path
      d="M 0 {-r} A {r} {r} 0 0 1 0 {r}"
      fill="none"
      stroke={COL_WAVE}
      stroke-width={STROKE_WIDTH_WAVE}
      stroke-linecap="round"
    />
  {/each}

  <!-- 回折後の光の進行方向（スリットから放射状に広がる） -->
  {#each outArrows as a, i (i)}
    <line
      x1={a.from.x}
      y1={a.from.y}
      x2={a.to.x}
      y2={a.to.y}
      stroke={COL_ARROW_OUT}
      stroke-width={STROKE_WIDTH_ARROW}
      stroke-linecap="round"
      marker-end="url(#slit-diffraction-arrow-out)"
    />
  {/each}

  <!-- 障壁（中央に小さなスリットが開いている） -->
  <rect
    x={BARRIER_LEFT}
    y={-BARRIER_HALF_H}
    width={BARRIER_W}
    height={BARRIER_PART_H}
    rx={BARRIER_R}
    fill={COL_BARRIER}
  />
  <rect
    x={BARRIER_LEFT}
    y={SLIT_HALF}
    width={BARRIER_W}
    height={BARRIER_PART_H}
    rx={BARRIER_R}
    fill={COL_BARRIER}
  />
</svg>
