<script lang="ts">
  // ===== 地面（波線）のパラメータ =====
  const GROUND_HALF = 210 // 地面（波線）の半分の長さ
  const AMP = 6 // 波の振幅（凹凸の大きさ）
  const WAVELEN = 44 // 波の波長
  const WAVE_STEP = 3 // 波線をサンプリングする刻み幅

  // ===== 光線のパラメータ =====
  const RAY_LEN = 125 // 光線の長さ

  // ===== ラベル配置 =====
  const IN_LABEL_FRAC = 0.55 // 入射光ラベルを置く位置（反射点からの比率）
  const IN_LABEL_OFFSET = 32 // 入射光線からラベルまでの距離
  const REFL_LABEL_FRAC = 0.62 // 反射光ラベルを置く位置（反射点からの比率）
  const REFL_LABEL_OFFSET = 30 // 反射光線からラベルまでの距離
  const LABEL_HALF_W = 24 // ラベル文字の半幅（viewBox 算出用の概算）
  const LABEL_HALF_H = 10 // ラベル文字の半高（viewBox 算出用の概算）

  // ===== フォントサイズ =====
  const FONT_SIZE_RAY = 14

  // ===== 線幅 =====
  const STROKE_WIDTH_GROUND = 2.5
  const STROKE_WIDTH_RAY = 2.5

  // 光線の端点を地面の波の頂上にちょうど接する高さに持ち上げる量。
  // 地面と光線それぞれの線幅の半分を足すことで、線の内部に重ならず表面に接する。
  const SURFACE_GAP = (STROKE_WIDTH_GROUND + STROKE_WIDTH_RAY) / 2

  // ===== 矢の形状（タイプA） =====
  const ARROW_HEAD_VIEWBOX = 7 // marker viewBox の一辺
  const ARROW_HEAD_SIZE = 18 // 矢先のレンダリングサイズ（user space）
  // marker 内 polyline の stroke-width。線本体と見た目の太さを一致させる
  const ARROW_HEAD_STROKE = (STROKE_WIDTH_RAY * ARROW_HEAD_VIEWBOX) / ARROW_HEAD_SIZE

  // ===== 色 =====
  const COL_GROUND = "var(--color-body)"
  const COL_IN = "var(--canvas-pen-orange)" // 入射光
  const COL_REFL = "var(--canvas-pen-yellow)" // 反射光

  // ===== 余白 =====
  const PAD = 16

  // ===== 幾何計算（原点は地面中央、SVG は y 下向き・上が負） =====
  const toRad = (d: number) => (d * Math.PI) / 180

  type Pt = { x: number; y: number }

  // 波線（地面）の高さ。頂上（凸部）で最も上（y が最小）になる
  const wave = (x: number) => AMP * Math.sin((2 * Math.PI * x) / WAVELEN)

  // 波線のパス（細かくサンプリングした折れ線を丸めて滑らかに見せる）
  const N_SEG = Math.round((2 * GROUND_HALF) / WAVE_STEP)
  const groundPath = Array.from({ length: N_SEG + 1 }, (_, i) => {
    const x = -GROUND_HALF + i * WAVE_STEP
    return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${wave(x).toFixed(2)}`
  }).join(" ")

  // 各反射点の設定。入射角（θin）を少しずつ変え（＝異なる角度で入射）、
  // 反射角（θrefl）はバラバラにして拡散反射を表す。角度は鉛直から測り、右向きが正。
  type RaySpec = { x: number; thetaIn: number; thetaRefl: number }
  const RAY_SPECS: RaySpec[] = [
    { x: -143, thetaIn: -38, thetaRefl: 48 },
    { x: -55, thetaIn: -32, thetaRefl: -8 },
    { x: 33, thetaIn: -26, thetaRefl: 30 },
    { x: 121, thetaIn: -20, thetaRefl: 12 }
  ]

  // 各光線の座標を算出（反射点は波の頂上に接する高さに置く）
  const rays = RAY_SPECS.map((r) => {
    const P: Pt = { x: r.x, y: wave(r.x) - SURFACE_GAP }
    // 反射点から上向き（光源側・進行先側）を指す単位ベクトル
    const dIn: Pt = { x: Math.sin(toRad(r.thetaIn)), y: -Math.cos(toRad(r.thetaIn)) }
    const dRefl: Pt = { x: Math.sin(toRad(r.thetaRefl)), y: -Math.cos(toRad(r.thetaRefl)) }
    return {
      P,
      dIn,
      dRefl,
      source: { x: P.x + RAY_LEN * dIn.x, y: P.y + RAY_LEN * dIn.y }, // 入射光の始点
      inMid: { x: P.x + 0.5 * RAY_LEN * dIn.x, y: P.y + 0.5 * RAY_LEN * dIn.y }, // 入射光の矢じり位置
      reflMid: { x: P.x + 0.5 * RAY_LEN * dRefl.x, y: P.y + 0.5 * RAY_LEN * dRefl.y }, // 反射光の矢じり位置
      end: { x: P.x + RAY_LEN * dRefl.x, y: P.y + RAY_LEN * dRefl.y } // 反射光の終点
    }
  })

  // 入射光ラベル：最も左の光線の入射光の外側（左）に配置し、線に重ならないようにする
  const labelInRay = rays[0]
  const aIn: Pt = {
    x: labelInRay.P.x + IN_LABEL_FRAC * RAY_LEN * labelInRay.dIn.x,
    y: labelInRay.P.y + IN_LABEL_FRAC * RAY_LEN * labelInRay.dIn.y
  }
  const perpIn: Pt = { x: labelInRay.dIn.y, y: -labelInRay.dIn.x } // 光線の左側（外側）を向く法線
  const inLabel: Pt = {
    x: aIn.x + IN_LABEL_OFFSET * perpIn.x,
    y: aIn.y + IN_LABEL_OFFSET * perpIn.y
  }

  // 反射光ラベル：最も右の光線の反射光の外側（右）に配置し、線に重ならないようにする
  const labelReflRay = rays[rays.length - 1]
  const aRefl: Pt = {
    x: labelReflRay.P.x + REFL_LABEL_FRAC * RAY_LEN * labelReflRay.dRefl.x,
    y: labelReflRay.P.y + REFL_LABEL_FRAC * RAY_LEN * labelReflRay.dRefl.y
  }
  const perpRefl: Pt = { x: -labelReflRay.dRefl.y, y: labelReflRay.dRefl.x } // 光線の右側（外側）を向く法線
  const reflLabel: Pt = {
    x: aRefl.x + REFL_LABEL_OFFSET * perpRefl.x,
    y: aRefl.y + REFL_LABEL_OFFSET * perpRefl.y
  }

  // ===== viewBox（すべての要素とラベルを内包するよう算出） =====
  const bboxPts: Pt[] = [
    { x: -GROUND_HALF, y: -(AMP + STROKE_WIDTH_GROUND / 2) },
    { x: -GROUND_HALF, y: AMP + STROKE_WIDTH_GROUND / 2 },
    { x: GROUND_HALF, y: -(AMP + STROKE_WIDTH_GROUND / 2) },
    { x: GROUND_HALF, y: AMP + STROKE_WIDTH_GROUND / 2 },
    ...rays.flatMap((r) => [r.source, r.P, r.end]),
    { x: inLabel.x - LABEL_HALF_W, y: inLabel.y - LABEL_HALF_H },
    { x: inLabel.x + LABEL_HALF_W, y: inLabel.y + LABEL_HALF_H },
    { x: reflLabel.x - LABEL_HALF_W, y: reflLabel.y - LABEL_HALF_H },
    { x: reflLabel.x + LABEL_HALF_W, y: reflLabel.y + LABEL_HALF_H }
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
    <!-- 入射光の矢じり（オレンジ） -->
    <marker
      id="diffuse-arrow-in"
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
        stroke={COL_IN}
        stroke-width={ARROW_HEAD_STROKE}
        stroke-linecap="round"
        stroke-linejoin="round"
        transform="translate(1.1667 1.75)"
      />
    </marker>
    <!-- 反射光の矢じり（イエロー） -->
    <marker
      id="diffuse-arrow-refl"
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
        stroke={COL_REFL}
        stroke-width={ARROW_HEAD_STROKE}
        stroke-linecap="round"
        stroke-linejoin="round"
        transform="translate(1.1667 1.75)"
      />
    </marker>
  </defs>

  <!-- 地面を表す波線（凹凸のあるマットな面） -->
  <path
    d={groundPath}
    fill="none"
    stroke={COL_GROUND}
    stroke-width={STROKE_WIDTH_GROUND}
    stroke-linecap="round"
    stroke-linejoin="round"
  />

  {#each rays as ray, i (i)}
    <!-- 入射光（矢印は進行方向＝地面へ向かう） -->
    <polyline
      points="{ray.source.x},{ray.source.y} {ray.inMid.x},{ray.inMid.y} {ray.P.x},{ray.P.y}"
      fill="none"
      stroke={COL_IN}
      stroke-width={STROKE_WIDTH_RAY}
      stroke-linecap="round"
      stroke-linejoin="round"
      marker-mid="url(#diffuse-arrow-in)"
    />
    <!-- 反射光（矢印は進行方向＝地面から離れる。バラバラな方向へ散る） -->
    <polyline
      points="{ray.P.x},{ray.P.y} {ray.reflMid.x},{ray.reflMid.y} {ray.end.x},{ray.end.y}"
      fill="none"
      stroke={COL_REFL}
      stroke-width={STROKE_WIDTH_RAY}
      stroke-linecap="round"
      stroke-linejoin="round"
      marker-mid="url(#diffuse-arrow-refl)"
    />
  {/each}

  <!-- ラベル -->
  <text
    x={inLabel.x}
    y={inLabel.y}
    text-anchor="middle"
    dominant-baseline="central"
    font-size={FONT_SIZE_RAY}
    fill={COL_IN}
  >
    入射光
  </text>
  <text
    x={reflLabel.x}
    y={reflLabel.y}
    text-anchor="middle"
    dominant-baseline="central"
    font-size={FONT_SIZE_RAY}
    fill={COL_REFL}
  >
    反射光
  </text>
</svg>
