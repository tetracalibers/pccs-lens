<script lang="ts">
  // ===== レイアウト定数 =====
  const PADDING = 24 // viewBox外周の余白
  const RADIUS = 90 // 碁石の半径（白・黒で共通）
  const CIRCLE_GAP = 80 // 2つの碁石の隙間
  const GUIDE_OFFSET = 6 // 碁石とガイド円の半径差
  const GUIDE_LINE_EXTEND = 28 // 水平ガイド線が両端の円から外側に延びる長さ
  const TEXT_TOP_GAP = 44 // 円の下端と説明テキスト基線の距離

  // ===== 線幅 =====
  const STROKE_GUIDE = 1.4

  // ===== フォント =====
  const FONT_SIZE_CAPTION = 18

  // ===== 色 =====
  const COL_BG = "darkslategray" // 中間グレー
  const COL_WHITE_STONE = "#fafafa"
  const COL_BLACK_STONE = "#161616"
  const COL_GUIDE = "var(--canvas-pen-water)" // 見やすい青系
  const COL_CAPTION = "var(--color-body--dark)"

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

  // 説明テキスト
  const CAPTION_Y = CY + GUIDE_R + TEXT_TOP_GAP
  const CAPTION_X = (GUIDE_LINE_X1 + GUIDE_LINE_X2) / 2

  // viewBox
  const WIDTH = GUIDE_LINE_X2 + PADDING
  const HEIGHT = CAPTION_Y + FONT_SIZE_CAPTION + PADDING
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

  <!-- 説明テキスト -->
  <text
    x={CAPTION_X}
    y={CAPTION_Y}
    text-anchor="middle"
    dominant-baseline="hanging"
    font-size={FONT_SIZE_CAPTION}
    fill={COL_CAPTION}
  >
    どちらも同じ直径
  </text>
</svg>
