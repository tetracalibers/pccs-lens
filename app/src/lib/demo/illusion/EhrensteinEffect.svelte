<script lang="ts">
  // ===== レイアウト =====
  const NI = 5 // 1辺あたりの格子線（＝十字路）の数
  const CELL = 70 // 格子線どうしの間隔
  const OVERHANG = CELL / 2 // 外周の十字路から外へ伸ばす格子線の長さ
  const MARGIN = 20 // 図の外周の余白

  // ===== 線・ギャップ =====
  const STROKE_WIDTH_GRID = 3 // 黒い格子線の太さ
  const GAP_RADIUS = 16 // 十字路の抜けた部分（白い円）の半径
  const STROKE_WIDTH_RING = 3 // 抜けた部分を囲む実線の太さ

  // ===== 色 =====
  const COL_GRID = "#000000" // 黒い格子線
  const COL_BG = "#ffffff" // 白背景・抜けた部分
  const COL_RING = "#000000" // 抜けた部分を囲む実線

  // 十字路（交点）の位置（水平線・垂直線で共通）
  const LINE_POS = Array.from(
    { length: NI },
    (_, i) => MARGIN + OVERHANG + i * CELL
  )
  // 格子線を描く範囲（両端を OVERHANG ぶん外へ伸ばす）
  const LINE_START = LINE_POS[0] - OVERHANG
  const LINE_END = LINE_POS[NI - 1] + OVERHANG

  // 図全体の一辺（余白 + 伸ばした格子）
  const SIZE = LINE_END + MARGIN

  // 十字路（交点）の座標
  const intersections = LINE_POS.flatMap((y, row) =>
    LINE_POS.map((x, col) => ({ x, y, row, col }))
  )

  // 実線で囲む十字路（中央から1区画右下）
  const RING_ROW = 3
  const RING_COL = 3
  const ringPoint = intersections.find(
    (p) => p.row === RING_ROW && p.col === RING_COL
  )!
</script>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {SIZE} {SIZE}">
  <!-- 白い背景 -->
  <rect x="0" y="0" width={SIZE} height={SIZE} fill={COL_BG} />

  <!-- 黒い格子線 -->
  {#each LINE_POS as pos, i (i)}
    <!-- 水平線 -->
    <line
      x1={LINE_START}
      y1={pos}
      x2={LINE_END}
      y2={pos}
      stroke={COL_GRID}
      stroke-width={STROKE_WIDTH_GRID}
    />
    <!-- 垂直線 -->
    <line
      x1={pos}
      y1={LINE_START}
      x2={pos}
      y2={LINE_END}
      stroke={COL_GRID}
      stroke-width={STROKE_WIDTH_GRID}
    />
  {/each}

  <!-- 各十字路を白い円で抜く -->
  {#each intersections as p, i (i)}
    <circle cx={p.x} cy={p.y} r={GAP_RADIUS} fill={COL_BG} />
  {/each}

  <!-- 1箇所だけ、抜けた部分を実線で囲む -->
  <circle
    cx={ringPoint.x}
    cy={ringPoint.y}
    r={GAP_RADIUS}
    fill="none"
    stroke={COL_RING}
    stroke-width={STROKE_WIDTH_RING}
  />
</svg>
