<script lang="ts">
  import { PCCS_HEX_MAP } from "$lib/data/pccs"

  // ===== レイアウト =====
  const NI = 5 // 1辺あたりの格子線（＝十字路）の数
  const CELL = 70 // 格子線どうしの間隔
  const OVERHANG = CELL / 2 // 外周の十字路から外へ伸ばす格子線の長さ
  const MARGIN = 20 // 図の外周の余白

  // ===== 線・ギャップ =====
  const STROKE_WIDTH_GRID = 4 // 黒い格子線の太さ
  const GAP_RADIUS = 16 // 十字路の抜けた部分（白い円）の半径
  const STROKE_WIDTH_BRIDGE = 4 // 十字路をつなぐ色線の太さ
  const BRIDGE_OVERLAP = 2 // 色線を黒い格子線へ重ねる長さ（つなぎ目を隠す）
  const BRIDGE_HALF = GAP_RADIUS + BRIDGE_OVERLAP // 色線の中心から端までの長さ

  // ===== 色 =====
  const COL_GRID = "#000000" // 黒い格子線
  const COL_BG = "#ffffff" // 白背景・抜けた部分
  // 十字路をつなぐ色線の色（上の行から順に）
  const COL_ROW = [
    PCCS_HEX_MAP.get("v2")!, // 赤
    PCCS_HEX_MAP.get("v8")!, // 黄
    PCCS_HEX_MAP.get("b12")!, // 緑
    "var(--canvas-pen-water)", // シアン
    "var(--canvas-pen-blue)" // 青
  ]

  // 十字路（交点）の位置（水平線・垂直線で共通）
  const LINE_POS = Array.from({ length: NI }, (_, i) => MARGIN + OVERHANG + i * CELL)
  // 格子線を描く範囲（両端を OVERHANG ぶん外へ伸ばす）
  const LINE_START = LINE_POS[0] - OVERHANG
  const LINE_END = LINE_POS[NI - 1] + OVERHANG

  // 図全体の一辺（余白 + 伸ばした格子）
  const SIZE = LINE_END + MARGIN

  // 十字路（交点）の座標
  const intersections = LINE_POS.flatMap((y, row) => LINE_POS.map((x, col) => ({ x, y, row, col })))
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

  <!-- 抜けた十字路を色線でつなぐ（色は行ごとに変える） -->
  {#each intersections as p, i (i)}
    <!-- 水平方向の色線 -->
    <line
      x1={p.x - BRIDGE_HALF}
      y1={p.y}
      x2={p.x + BRIDGE_HALF}
      y2={p.y}
      stroke={COL_ROW[p.row]}
      stroke-width={STROKE_WIDTH_BRIDGE}
    />
    <!-- 垂直方向の色線 -->
    <line
      x1={p.x}
      y1={p.y - BRIDGE_HALF}
      x2={p.x}
      y2={p.y + BRIDGE_HALF}
      stroke={COL_ROW[p.row]}
      stroke-width={STROKE_WIDTH_BRIDGE}
    />
  {/each}
</svg>
