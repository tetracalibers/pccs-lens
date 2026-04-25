<script lang="ts">
  // ===== 型定義 =====
  interface GradientStop {
    nm: number
    color: string
  }

  interface ColorBlock {
    label: string
    nmStart: number
    nmEnd: number
    fill: string
    textFill: string
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
  const GAP_BAND_TO_BLOCK = 18 // スペクトル帯 → 色ブロック間の余白 (px)
  const BLOCK_TOP = BAND_BOTTOM + GAP_BAND_TO_BLOCK
  const BLOCK_HEIGHT = 52
  const BLOCK_GAP = 1 // 隣接ブロック間の隙間 (px)
  const HEIGHT = BLOCK_TOP + BLOCK_HEIGHT

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

  // ===== 色ブロック =====
  // 各ブロックの fill は、その範囲内のスペクトル帯の代表色 (グラデーションストップ or 中点の補間色)
  const colorBlocks: ColorBlock[] = [
    { label: "青紫", nmStart: 380, nmEnd: 400, fill: "#4B0082", textFill: "white" },
    { label: "藍", nmStart: 400, nmEnd: 420, fill: "#1E00CD", textFill: "white" },
    { label: "青", nmStart: 420, nmEnd: 490, fill: "#0000FF", textFill: "white" },
    { label: "緑", nmStart: 490, nmEnd: 585, fill: "#00FF00", textFill: "black" },
    { label: "黄", nmStart: 585, nmEnd: 625, fill: "#FFFF00", textFill: "black" },
    { label: "橙", nmStart: 625, nmEnd: 685, fill: "#FF7F00", textFill: "black" },
    { label: "赤", nmStart: 685, nmEnd: 780, fill: "#FF0000", textFill: "white" }
  ]

  const LAST_BLOCK = colorBlocks.length - 1

  /** ブロックの左端 x (先頭以外は隙間分ずらす) */
  const blockX = (nmStart: number, i: number): number => xAt(nmStart) + (i === 0 ? 0 : BLOCK_GAP)
  /** ブロックの右端 x (末尾以外は隙間分縮める) */
  const blockEndX = (nmEnd: number, i: number): number =>
    xAt(nmEnd) - (i === LAST_BLOCK ? 0 : BLOCK_GAP)
  /** ブロックの幅 */
  const blockW = (nmStart: number, nmEnd: number, i: number): number =>
    blockEndX(nmEnd, i) - blockX(nmStart, i)
  /** ラベル中心 x */
  const blockCX = (nmStart: number, nmEnd: number, i: number): number =>
    (blockX(nmStart, i) + blockEndX(nmEnd, i)) / 2
</script>

<div class="wrapper">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {WIDTH} {HEIGHT}">
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

    <!-- 色ブロック -->
    {#each colorBlocks as block, i (block.nmStart)}
      {@const bx = blockX(block.nmStart, i)}
      {@const bw = blockW(block.nmStart, block.nmEnd, i)}
      {@const cx = blockCX(block.nmStart, block.nmEnd, i)}
      <rect x={bx} y={BLOCK_TOP} width={bw} height={BLOCK_HEIGHT} fill={block.fill} rx="4" />
      <text
        x={cx}
        y={BLOCK_TOP + BLOCK_HEIGHT / 2}
        font-size="18"
        fill={block.textFill}
        text-anchor="middle"
        dominant-baseline="central"
      >
        {block.label}
      </text>
    {/each}
  </svg>
</div>

<style>
  .wrapper {
    width: 100%;
  }

  .wrapper svg {
    display: block;
    width: 100%;
    height: auto;
    padding-block: 1rem;
    box-sizing: border-box;
  }
</style>
