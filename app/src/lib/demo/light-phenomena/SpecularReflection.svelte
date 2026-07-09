<script lang="ts">
  // ===== 図の形状パラメータ =====
  const ANGLE_DEG = 45 // 入射角＝反射角（法線からの角度）
  const RAY_LEN = 200 // 光線の長さ
  const GROUND_HALF = 190 // 地面直線の半分の長さ
  const NORMAL_LEN = 170 // 法線（点線）の長さ（反射点から上向き）
  const ARC_R = 46 // 角度を表す扇形の半径

  // ===== ラベル配置 =====
  const RAY_LABEL_FRAC = 0.62 // 光線ラベルを置く位置（O からの比率）
  const RAY_LABEL_OFFSET = 30 // 光線からラベルまでの距離
  const LABEL_ANGLE_R = 82 // 角度ラベルを置く半径（二等分線上）
  const ARROW_FRAC = 0.5 // 矢じりを置く位置（O からの比率）

  // ===== フォントサイズ =====
  const FONT_SIZE_RAY = 16
  const FONT_SIZE_ANGLE = 15

  // ===== 線幅 =====
  const STROKE_WIDTH_GROUND = 2.5
  const STROKE_WIDTH_RAY = 2.5
  const STROKE_WIDTH_NORMAL = 1.6

  // 反射点（光線の交点）を地面の直線の上端にちょうど接する高さに持ち上げる量。
  // 地面と光線それぞれの線幅の半分を足すことで、V字の底が直線の上端に接し、線の内部に重ならない。
  const SURFACE_GAP = (STROKE_WIDTH_GROUND + STROKE_WIDTH_RAY) / 2

  // ===== 矢の形状（タイプA） =====
  const ARROW_HEAD_VIEWBOX = 7 // marker viewBox の一辺
  const ARROW_HEAD_SIZE = 18 // 矢先のレンダリングサイズ（user space）
  // marker 内 polyline の stroke-width。線本体と見た目の太さを一致させる
  const ARROW_HEAD_STROKE = (STROKE_WIDTH_RAY * ARROW_HEAD_VIEWBOX) / ARROW_HEAD_SIZE

  // ===== 色 =====
  const COL_GROUND = "var(--color-body)"
  const COL_NORMAL = "var(--canvas-pen-gray)" // 法線
  const COL_IN = "var(--canvas-pen-orange)" // 入射側
  const COL_REFL = "var(--canvas-pen-yellow)" // 反射側
  const SECTOR_OPACITY = 0.32

  // ===== 余白 =====
  const PAD = 24

  // ===== 幾何計算（O = 反射点を原点、SVG は y 下向き・上が負） =====
  const toRad = (d: number) => (d * Math.PI) / 180
  const TH = toRad(ANGLE_DEG)
  const HALF = toRad(ANGLE_DEG / 2)
  const S = Math.sin(TH)
  const C = Math.cos(TH)

  type Pt = { x: number; y: number }

  // 反射点（光線の交点）。地面の直線の上端に接する高さに置く
  const O: Pt = { x: 0, y: -SURFACE_GAP }

  // 地面
  const groundL: Pt = { x: -GROUND_HALF, y: 0 }
  const groundR: Pt = { x: GROUND_HALF, y: 0 }

  // 法線（地面の表面から反射点を通って上向きに伸ばす）
  const normalBase: Pt = { x: O.x, y: 0 }
  const normalTop: Pt = { x: O.x, y: O.y - NORMAL_LEN }

  // 光線の端点
  const inSource: Pt = { x: O.x - RAY_LEN * S, y: O.y - RAY_LEN * C } // 入射光の始点（左上）
  const reflEnd: Pt = { x: O.x + RAY_LEN * S, y: O.y - RAY_LEN * C } // 反射光の終点（右上）

  // 矢じりを置く中間点
  const inMid: Pt = { x: O.x - ARROW_FRAC * RAY_LEN * S, y: O.y - ARROW_FRAC * RAY_LEN * C }
  const reflMid: Pt = { x: O.x + ARROW_FRAC * RAY_LEN * S, y: O.y - ARROW_FRAC * RAY_LEN * C }

  // 扇形の弧の端点
  const arcNormal: Pt = { x: O.x, y: O.y - ARC_R }
  const arcIn: Pt = { x: O.x - ARC_R * S, y: O.y - ARC_R * C }
  const arcRefl: Pt = { x: O.x + ARC_R * S, y: O.y - ARC_R * C }

  // 扇形パス（法線 → 光線の向きへ弧を描く）
  const inSectorPath = `M ${O.x} ${O.y} L ${arcNormal.x} ${arcNormal.y} A ${ARC_R} ${ARC_R} 0 0 0 ${arcIn.x} ${arcIn.y} Z`
  const reflSectorPath = `M ${O.x} ${O.y} L ${arcNormal.x} ${arcNormal.y} A ${ARC_R} ${ARC_R} 0 0 1 ${arcRefl.x} ${arcRefl.y} Z`

  // 角度ラベル（角の二等分線上）
  const inAngleLabel: Pt = {
    x: O.x - LABEL_ANGLE_R * Math.sin(HALF),
    y: O.y - LABEL_ANGLE_R * Math.cos(HALF)
  }
  const reflAngleLabel: Pt = {
    x: O.x + LABEL_ANGLE_R * Math.sin(HALF),
    y: O.y - LABEL_ANGLE_R * Math.cos(HALF)
  }

  // 光線ラベル（各光線の外側＝地面寄りに配置し、線や扇形に重ならないようにする）
  const inRayPt: Pt = { x: O.x - RAY_LABEL_FRAC * RAY_LEN * S, y: O.y - RAY_LABEL_FRAC * RAY_LEN * C }
  const inRayLabel: Pt = {
    x: inRayPt.x - RAY_LABEL_OFFSET * C,
    y: inRayPt.y + RAY_LABEL_OFFSET * S
  }
  const reflRayPt: Pt = { x: O.x + RAY_LABEL_FRAC * RAY_LEN * S, y: O.y - RAY_LABEL_FRAC * RAY_LEN * C }
  const reflRayLabel: Pt = {
    x: reflRayPt.x + RAY_LABEL_OFFSET * C,
    y: reflRayPt.y + RAY_LABEL_OFFSET * S
  }

  // ===== viewBox =====
  const VB_X = -(GROUND_HALF + PAD)
  const VB_Y = -(NORMAL_LEN + SURFACE_GAP + PAD)
  const VB_W = 2 * (GROUND_HALF + PAD)
  const VB_H = NORMAL_LEN + SURFACE_GAP + 2 * PAD
  const viewBox = `${VB_X} ${VB_Y} ${VB_W} ${VB_H}`
</script>

<svg xmlns="http://www.w3.org/2000/svg" {viewBox}>
  <defs>
    <!-- 入射光の矢じり（青） -->
    <marker
      id="specular-arrow-in"
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
    <!-- 反射光の矢じり（オレンジ） -->
    <marker
      id="specular-arrow-refl"
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

  <!-- 入射角・反射角の扇形（色分け） -->
  <path d={inSectorPath} fill={COL_IN} opacity={SECTOR_OPACITY} />
  <path d={reflSectorPath} fill={COL_REFL} opacity={SECTOR_OPACITY} />

  <!-- 地面を表す直線 -->
  <line
    x1={groundL.x}
    y1={groundL.y}
    x2={groundR.x}
    y2={groundR.y}
    stroke={COL_GROUND}
    stroke-width={STROKE_WIDTH_GROUND}
    stroke-linecap="round"
  />

  <!-- 地面に垂直な法線（点線）：地面の表面から反射点を通って上へ -->
  <line
    x1={normalBase.x}
    y1={normalBase.y}
    x2={normalTop.x}
    y2={normalTop.y}
    stroke={COL_NORMAL}
    stroke-width={STROKE_WIDTH_NORMAL}
    stroke-dasharray="5 5"
  />

  <!-- 入射光（矢印は進行方向＝地面へ向かう） -->
  <polyline
    points="{inSource.x},{inSource.y} {inMid.x},{inMid.y} {O.x},{O.y}"
    fill="none"
    stroke={COL_IN}
    stroke-width={STROKE_WIDTH_RAY}
    stroke-linecap="round"
    stroke-linejoin="round"
    marker-mid="url(#specular-arrow-in)"
  />

  <!-- 反射光（矢印は進行方向＝地面から離れる） -->
  <polyline
    points="{O.x},{O.y} {reflMid.x},{reflMid.y} {reflEnd.x},{reflEnd.y}"
    fill="none"
    stroke={COL_REFL}
    stroke-width={STROKE_WIDTH_RAY}
    stroke-linecap="round"
    stroke-linejoin="round"
    marker-mid="url(#specular-arrow-refl)"
  />

  <!-- ラベル -->
  <text
    x={inRayLabel.x}
    y={inRayLabel.y}
    text-anchor="middle"
    dominant-baseline="central"
    font-size={FONT_SIZE_RAY}
    fill={COL_IN}
  >
    入射光
  </text>
  <text
    x={reflRayLabel.x}
    y={reflRayLabel.y}
    text-anchor="middle"
    dominant-baseline="central"
    font-size={FONT_SIZE_RAY}
    fill={COL_REFL}
  >
    反射光
  </text>
  <text
    x={inAngleLabel.x}
    y={inAngleLabel.y}
    text-anchor="middle"
    dominant-baseline="central"
    font-size={FONT_SIZE_ANGLE}
    fill={COL_IN}
  >
    入射角
  </text>
  <text
    x={reflAngleLabel.x}
    y={reflAngleLabel.y}
    text-anchor="middle"
    dominant-baseline="central"
    font-size={FONT_SIZE_ANGLE}
    fill={COL_REFL}
  >
    反射角
  </text>
</svg>
