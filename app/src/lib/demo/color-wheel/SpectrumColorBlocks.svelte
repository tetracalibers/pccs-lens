<script lang="ts">
  // ===== 型定義 =====
  interface GradientStop {
    nm: number
    color: string
  }

  interface ColorBlock {
    label: string
    /** スペクトル帯における代表色の波長 (この点に円の中心を配置) */
    nm: number
    fill: string
  }

  // ===== SVG dimensions =====
  const WIDTH = 960

  // ===== Spectrum parameters =====
  const NM_MIN = 380
  const NM_MAX = 780
  const X_START = 0
  const X_END = WIDTH
  const SPECTRUM_W = X_END - X_START
  const PX_PER_NM = SPECTRUM_W / (NM_MAX - NM_MIN)

  /** 波長 (nm) → x 座標 */
  const xAt = (nm: number): number => X_START + (nm - NM_MIN) * PX_PER_NM

  // ===== 縦方向レイアウト =====
  const BAND_TOP = 0
  const BAND_HEIGHT = 150
  const BAND_BOTTOM = BAND_TOP + BAND_HEIGHT
  const GAP_BAND_TO_CIRCLE = 18 // スペクトル帯 → 円間の余白 (px)
  const CIRCLE_RADIUS = 22
  const CIRCLE_CY = BAND_BOTTOM + GAP_BAND_TO_CIRCLE + CIRCLE_RADIUS
  const GAP_CIRCLE_TO_LABEL = 12
  const LABEL_FONT_SIZE = 22
  const LABEL_Y = CIRCLE_CY + CIRCLE_RADIUS + GAP_CIRCLE_TO_LABEL // 文字上端 (dominant-baseline="hanging")
  const HEIGHT = LABEL_Y + LABEL_FONT_SIZE + 6

  // ===== ViewBox =====
  // 円ラベル (text-anchor="middle") が viewBox 端で切れないよう左右に padding を設ける
  const PADDING_X = 24
  const viewBox = `${-PADDING_X} 0 ${WIDTH + 2 * PADDING_X} ${HEIGHT}`

  // ===== グラデーションストップ =====
  const gradientStops: GradientStop[] = [
    { nm: 380, color: "#4b0082" },
    { nm: 430, color: "#0000ff" },
    { nm: 480, color: "#00bfff" },
    { nm: 510, color: "#00ff80" },
    { nm: 550, color: "#00ff00" },
    { nm: 600, color: "#ffff00" },
    { nm: 640, color: "#ffb000" },
    { nm: 670, color: "#ff7f00" },
    { nm: 700, color: "#ff0000" },
    { nm: 780, color: "#7a0000" }
  ]

  const gradientOffset = (nm: number): number => (nm - NM_MIN) / (NM_MAX - NM_MIN)

  // ===== 色ブロック (円) =====
  const colorBlocks: ColorBlock[] = [
    { label: "青紫", nm: 380, fill: "#4B0082" },
    { label: "藍", nm: 410, fill: "#1E00CD" },
    { label: "青", nm: 430, fill: "#0000FF" },
    { label: "緑", nm: 550, fill: "#00FF00" },
    { label: "黄", nm: 600, fill: "#FFFF00" },
    { label: "橙", nm: 670, fill: "#FF7F00" },
    { label: "赤", nm: 700, fill: "#FF0000" }
  ]
</script>

<svg xmlns="http://www.w3.org/2000/svg" {viewBox}>
  <defs>
    <!-- 可視光スペクトルグラデーション -->
    <linearGradient id="visibleSpectrumColorBlocks" x1="0" y1="0" x2="1" y2="0">
      {#each gradientStops as stop, i (i)}
        <stop offset={gradientOffset(stop.nm)} stop-color={stop.color} />
      {/each}
    </linearGradient>
  </defs>

  <!-- スペクトル帯 -->
  <rect
    x={X_START}
    y={BAND_TOP}
    width={SPECTRUM_W}
    height={BAND_HEIGHT}
    fill="url(#visibleSpectrumColorBlocks)"
  />

  <!-- 色ブロック (円) と ラベル -->
  {#each colorBlocks as block (block.label)}
    {@const cx = xAt(block.nm)}
    <circle {cx} cy={CIRCLE_CY} r={CIRCLE_RADIUS} fill={block.fill} />
    <text
      x={cx}
      y={LABEL_Y}
      font-size={LABEL_FONT_SIZE}
      fill="var(--color-body)"
      text-anchor="middle"
      dominant-baseline="hanging"
    >
      {block.label}
    </text>
  {/each}
</svg>

<style>
  svg {
    display: block;
    width: 100%;
    height: auto;
    padding-block: 1rem;
    box-sizing: border-box;
  }
</style>
