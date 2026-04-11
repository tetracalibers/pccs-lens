<script lang="ts">
  // ===== 型定義 =====
  interface GradientStop {
    nm: number
    color: string
  }

  interface Section {
    label: string
    range: string
    nmStart: number
    nmEnd: number
    color: string
    id: string
  }

  interface ColorBlock {
    label: string
    nmStart: number
    nmEnd: number
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
  const Y_TITLE_1 = 30
  const Y_TITLE_2 = 58
  const Y_FULL_ARROW = 76
  const GAP_ARROW_TO_SEC = 40 // 全域矢印 → セクションラベル間の余白 (px)
  const Y_SEC_LABEL = Y_FULL_ARROW + GAP_ARROW_TO_SEC
  const Y_SEC_RANGE = Y_SEC_LABEL + 22
  const Y_SEC_ARROW = Y_SEC_RANGE + 16
  const GAP_SEC_TO_BAND = 15 // セクション矢印 → スペクトル帯間の余白 (px)
  const BAND_TOP = Y_SEC_ARROW + GAP_SEC_TO_BAND
  const BAND_HEIGHT = 150
  const BAND_BOTTOM = BAND_TOP + BAND_HEIGHT
  const MAJOR_TICK_LEN = 25
  const MINOR_TICK_LEN = 10
  const Y_TICK_LABEL = BAND_BOTTOM + 25
  const BLOCK_TOP = Y_TICK_LABEL + 18
  const BLOCK_HEIGHT = 52
  const BLOCK_GAP = 1 // 隣接ブロック間の隙間 (px)
  const HEIGHT = BLOCK_TOP + BLOCK_HEIGHT + 20 // 下余白 20px

  // ===== 色定数 =====
  const COL_AXIS = "#3c3c3c"

  // ===== グラデーションストップ =====
  // 同じ nm を 2 回続けることでハードエッジを表現
  const gradientStops: GradientStop[] = [
    { nm: 380, color: "#6a00ff" },
    { nm: 430, color: "#4b00ff" },
    { nm: 430, color: "#4b00ff" },
    { nm: 460, color: "#003cff" },
    { nm: 460, color: "#003cff" },
    { nm: 500, color: "#00b7ff" },
    { nm: 500, color: "#00b7ff" },
    { nm: 530, color: "#00ff80" },
    { nm: 570, color: "#00ff00" },
    { nm: 570, color: "#00ff00" },
    { nm: 590, color: "#ffff00" },
    { nm: 590, color: "#ffff00" },
    { nm: 610, color: "#ff7f00" },
    { nm: 610, color: "#ff7f00" },
    { nm: 700, color: "#ff0000" },
    { nm: 780, color: "#7a0000" }
  ]

  const gradientOffset = (nm: number): number => (nm - NM_MIN) / (NM_MAX - NM_MIN)

  // ===== 波長域セクション (矢印 + ラベル) =====
  const sections: Section[] = [
    {
      label: "短波長",
      range: `${NM_MIN}nm ~ 500nm`,
      nmStart: NM_MIN,
      nmEnd: 500,
      color: "var(--canvas-pen-blue)",
      id: "b"
    },
    {
      label: "中波長",
      range: "500nm ~ 600nm",
      nmStart: 500,
      nmEnd: 600,
      color: "var(--canvas-pen-green)",
      id: "g"
    },
    {
      label: "長波長",
      range: `600nm ~ ${NM_MAX}nm`,
      nmStart: 600,
      nmEnd: NM_MAX,
      color: "var(--canvas-pen-red)",
      id: "r"
    }
  ]

  // ===== 目盛り =====
  const majorTicks = [400, 450, 500, 550, 600, 650, 700, 750]
  const minorTicks = Array.from(
    { length: Math.round((NM_MAX - NM_MIN) / 10) + 1 },
    (_, i) => NM_MIN + i * 10
  )

  // ===== 色ブロック =====
  const colorBlocks: ColorBlock[] = [
    { label: "紫", nmStart: 380, nmEnd: 430, fill: "#6A00FF" },
    { label: "藍", nmStart: 430, nmEnd: 460, fill: "#003CFF" },
    { label: "青", nmStart: 460, nmEnd: 500, fill: "#0094FF" },
    { label: "緑", nmStart: 500, nmEnd: 570, fill: "#00E600" },
    { label: "黄", nmStart: 570, nmEnd: 590, fill: "#FFE600" },
    { label: "橙", nmStart: 590, nmEnd: 610, fill: "#FF7F00" },
    { label: "赤", nmStart: 610, nmEnd: 780, fill: "#FF0000" }
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
      <linearGradient id="visibleSpectrum" x1="0" y1="0" x2="1" y2="0">
        {#each gradientStops as stop, i (i)}
          <stop offset={gradientOffset(stop.nm)} stop-color={stop.color} />
        {/each}
      </linearGradient>

      <!-- 全域矢印マーカー (黒) -->
      <!-- markerWidth=9, markerHeight=10: 高さ7・半底辺4 で正三角形に近い比率 (4/7 ≈ 1/√3) -->
      <marker id="aL-k" markerWidth="9" markerHeight="10" refX="1" refY="5" orient="auto">
        <polyline
          points="8,1 1,5 8,9"
          fill="none"
          stroke="var(--color-body)"
          stroke-width="1"
          stroke-linejoin="round"
        />
      </marker>
      <marker id="aR-k" markerWidth="9" markerHeight="10" refX="8" refY="5" orient="auto">
        <polyline
          points="1,1 8,5 1,9"
          fill="none"
          stroke="var(--color-body)"
          stroke-width="1"
          stroke-linejoin="round"
        />
      </marker>

      <!-- 各セクションの矢印マーカー -->
      {#each sections as sec (sec.id)}
        <marker id="aL-{sec.id}" markerWidth="9" markerHeight="10" refX="1" refY="5" orient="auto">
          <polyline
            points="8,1 1,5 8,9"
            fill="none"
            stroke={sec.color}
            stroke-width="1"
            stroke-linejoin="round"
          />
        </marker>
        <marker id="aR-{sec.id}" markerWidth="9" markerHeight="10" refX="8" refY="5" orient="auto">
          <polyline
            points="1,1 8,5 1,9"
            fill="none"
            stroke={sec.color}
            stroke-width="1"
            stroke-linejoin="round"
          />
        </marker>
      {/each}
    </defs>

    <!-- タイトル -->
    <text x={WIDTH / 2} y={Y_TITLE_1} text-anchor="middle" font-size="22" fill="var(--color-body)">
      可視範囲
    </text>
    <text x={WIDTH / 2} y={Y_TITLE_2} text-anchor="middle" font-size="22" fill="var(--color-body)">
      {NM_MIN}nm ~ {NM_MAX}nm
    </text>

    <!-- 全域両端矢印 -->
    <line
      x1={X_START}
      y1={Y_FULL_ARROW}
      x2={X_END}
      y2={Y_FULL_ARROW}
      stroke="var(--color-body)"
      stroke-width="2"
      marker-start="url(#aL-k)"
      marker-end="url(#aR-k)"
    />

    <!-- 波長域セクション -->
    {#each sections as sec (sec.id)}
      {@const midX = (xAt(sec.nmStart) + xAt(sec.nmEnd)) / 2}
      <text
        x={midX}
        y={Y_SEC_LABEL}
        text-anchor="middle"
        font-size="20"
        font-weight="bold"
        fill={sec.color}
      >
        {sec.label}
      </text>
      <text x={midX} y={Y_SEC_RANGE} text-anchor="middle" font-size="19" fill={sec.color}>
        {sec.range}
      </text>
      <line
        x1={xAt(sec.nmStart)}
        y1={Y_SEC_ARROW}
        x2={xAt(sec.nmEnd)}
        y2={Y_SEC_ARROW}
        stroke={sec.color}
        stroke-width="2"
        marker-start="url(#aL-{sec.id})"
        marker-end="url(#aR-{sec.id})"
      />
    {/each}

    <!-- スペクトル帯 -->
    <rect
      x={X_START}
      y={BAND_TOP}
      width={SPECTRUM_W}
      height={BAND_HEIGHT}
      fill="url(#visibleSpectrum)"
    />

    <!-- 軸 -->
    <line
      x1={X_START}
      y1={BAND_BOTTOM}
      x2={X_END}
      y2={BAND_BOTTOM}
      stroke={COL_AXIS}
      stroke-width="2"
      shape-rendering="crispEdges"
    />

    <!-- 主目盛り (25px) -->
    <g stroke={COL_AXIS} stroke-width="2" shape-rendering="crispEdges">
      {#each majorTicks as nm (nm)}
        <line x1={xAt(nm)} y1={BAND_BOTTOM - MAJOR_TICK_LEN} x2={xAt(nm)} y2={BAND_BOTTOM} />
      {/each}
    </g>

    <!-- 補助目盛り (10px, 10nm 間隔) -->
    <g stroke={COL_AXIS} stroke-width="1" opacity="0.65" shape-rendering="crispEdges">
      {#each minorTicks as nm (nm)}
        <line x1={xAt(nm)} y1={BAND_BOTTOM - MINOR_TICK_LEN} x2={xAt(nm)} y2={BAND_BOTTOM} />
      {/each}
    </g>

    <!-- 目盛りラベル -->
    <g fill={COL_AXIS} font-size="18" text-anchor="middle">
      {#each majorTicks as nm (nm)}
        <text x={xAt(nm)} y={Y_TICK_LABEL} fill="var(--color-body)">{nm}</text>
      {/each}
    </g>

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
        fill="white"
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
