<script lang="ts">
  // ===== レイアウト定数 =====
  const PADDING = 24 // viewBox外周の余白
  const RADIUS = 90 // 碁石の半径（白・黒で共通）
  const CIRCLE_GAP = 80 // 2つの碁石の隙間
  const GUIDE_OFFSET = 6 // 碁石とガイド円の半径差
  const GUIDE_LINE_EXTEND = 28 // 水平ガイド線が両端の円から外側に延びる長さ

  // ===== 線幅 =====
  const STROKE_GUIDE = 1.4

  // ===== 色 =====
  const COL_BG = "darkslategray" // 中間グレー
  const COL_WHITE_STONE = "#fafafa"
  const COL_BLACK_STONE = "#161616"
  const COL_GUIDE = "var(--canvas-pen-water)" // 見やすい青系

  // ===== 派生値 =====
  const GUIDE_R = RADIUS + GUIDE_OFFSET

  // 円の中心座標（白：左、黒：右）
  const CX_LEFT = PADDING + GUIDE_LINE_EXTEND + GUIDE_R
  const CX_RIGHT = CX_LEFT + RADIUS * 2 + CIRCLE_GAP
  const CY = PADDING + GUIDE_R

  // 直径を示す水平ガイド線
  const GUIDE_LINE_X1 = PADDING
  const GUIDE_LINE_X2 = CX_RIGHT + GUIDE_R + GUIDE_LINE_EXTEND
  const GUIDE_TOP_Y = CY - RADIUS
  const GUIDE_BOTTOM_Y = CY + RADIUS

  // viewBox
  const WIDTH = GUIDE_LINE_X2 + PADDING
  const HEIGHT = CY + GUIDE_R + PADDING
</script>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {WIDTH} {HEIGHT}">
  <!-- 背景：中間グレー -->
  <rect x="0" y="0" width={WIDTH} height={HEIGHT} fill={COL_BG} />

  <!-- 直径を示す水平ガイド線（上下） -->
  <line
    x1={GUIDE_LINE_X1}
    y1={GUIDE_TOP_Y}
    x2={GUIDE_LINE_X2}
    y2={GUIDE_TOP_Y}
    stroke={COL_GUIDE}
    stroke-width={STROKE_GUIDE}
    stroke-linecap="round"
  />
  <line
    x1={GUIDE_LINE_X1}
    y1={GUIDE_BOTTOM_Y}
    x2={GUIDE_LINE_X2}
    y2={GUIDE_BOTTOM_Y}
    stroke={COL_GUIDE}
    stroke-width={STROKE_GUIDE}
    stroke-linecap="round"
  />

  <!-- 白い碁石（左） -->
  <circle cx={CX_LEFT} cy={CY} r={RADIUS} fill={COL_WHITE_STONE} />

  <!-- 黒い碁石（右） -->
  <circle cx={CX_RIGHT} cy={CY} r={RADIUS} fill={COL_BLACK_STONE} />
</svg>
