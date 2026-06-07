<script lang="ts">
  import { PCCS_HEX_MAP } from "$lib/data/pccs"
  import chroma from "chroma-js"

  // ===== 等色相面の構成 =====
  // 中央の無彩色軸（0s）を挟み、左半分に 8：Y（黄）、右半分に 20：V（青紫）を置く。
  // 縦軸 = 明度（上ほど高明度）、横軸 = 彩度（中央 0s から外側ほど高彩度）。
  // 黄は明度 8.0、青紫は明度 3.5 で最も鮮やかになり（出典: PCCS/JIS）、
  // 等色相面は左上（黄の鮮やか）と右下（青紫の鮮やか）へ傾いた形になる。

  // 縦軸（明度）: 上から 9.5 → 1.5 の 9 段階
  const LIGHTNESS_ROWS = [9.5, 8.5, 7.5, 6.5, 5.5, 4.5, 3.5, 2.5, 1.5]
  // 横軸（彩度）: 左 9s … 中央 0s … 右 9s の 11 列
  const SAT_LABELS = ["9s", "7s", "5s", "3s", "1s", "0s", "1s", "3s", "5s", "7s", "9s"]
  const GRAY_COL = 5

  const N_COLS = 11
  const N_ROWS = LIGHTNESS_ROWS.length // 9

  // ===== 色の決め方 =====
  // 中間色はトーンの実色ではなく、純色 8：Y / 20：V と白・黒を基準に補間して求める。
  // 各半分を三角形（白・黒・純色）とみなし、CIELAB 上で重心座標による線形補間を行うことで、
  // 明度（縦）も彩度（横）も等間隔に変化させる。純色の頂点には実際の純色をそのまま置く。
  //   - 無彩色軸（0s, col5）: 白〜黒の等間隔グラデーション
  //   - 純色の頂点: 8：Y は明度 8.0（行 8.5 と 7.5 の境界）、20：V は明度 3.5
  const VIVID_LEFT = chroma(PCCS_HEX_MAP.get("v8")!).lab() // 8：Y（col 0〜5 で使用）
  const VIVID_RIGHT = chroma(PCCS_HEX_MAP.get("v20")!).lab() // 20：V（col 6〜10 で使用）
  const APEX_LEFT: [number, number] = [0, 1.5] // 8：Y 頂点（9s・明度8.0＝行8.5と7.5の中間）
  const APEX_RIGHT: [number, number] = [N_COLS - 1, 6] // 20：V 頂点（9s・明度3.5）
  const WHITE_LAB = chroma(PCCS_HEX_MAP.get("W")!).lab()
  const BLACK_LAB = chroma(PCCS_HEX_MAP.get("Bk")!).lab()

  // 各列の塗りつぶし範囲（明度の上端〜下端）。中央 0s から外側ほど狭まる等色相面の輪郭。
  // 並び: 9s,7s,5s,3s,1s(=8:Y側) / 0s / 1s,3s,5s,7s,9s(=20:V側)
  const FILL_LIGHT: [number, number][] = [
    [8.5, 7.5], // 9s（8：Y）頂点（明度8.0が8.5と7.5に半分ずつまたがる）
    [8.5, 5.5], // 7s（8：Y）
    [8.5, 3.5], // 5s（8：Y）
    [8.5, 2.5], // 3s（8：Y）
    [8.5, 2.5], // 1s（8：Y）
    [9.5, 1.5], // 0s（無彩色軸）
    [8.5, 1.5], // 1s（20：V）
    [8.5, 2.5], // 3s（20：V）
    [7.5, 2.5], // 5s（20：V）
    [5.5, 2.5], // 7s（20：V）
    [3.5, 3.5] // 9s（20：V）頂点
  ]

  // 三角形 A(白) B(黒) C(純色) に対する点 P の重心座標
  function barycentric(
    px: number,
    py: number,
    a: [number, number],
    b: [number, number],
    c: [number, number]
  ): [number, number, number] {
    const d = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1])
    const wa = ((b[1] - c[1]) * (px - c[0]) + (c[0] - b[0]) * (py - c[1])) / d
    const wb = ((c[1] - a[1]) * (px - c[0]) + (a[0] - c[0]) * (py - c[1])) / d
    return [wa, wb, 1 - wa - wb]
  }

  // 白・黒・純色の Lab を重心座標で補間してセル色を求める（三角形外は線形外挿）
  const A: [number, number] = [GRAY_COL, 0] // 白（0s・明度9.5）
  const B: [number, number] = [GRAY_COL, N_ROWS - 1] // 黒（0s・明度1.5）
  function colorAt(col: number, row: number): string {
    const vivid = col <= GRAY_COL ? VIVID_LEFT : VIVID_RIGHT
    const c = col <= GRAY_COL ? APEX_LEFT : APEX_RIGHT
    const [wa, wb, wc] = barycentric(col, row, A, B, c)
    const L = wa * WHITE_LAB[0] + wb * BLACK_LAB[0] + wc * vivid[0]
    const aa = wa * WHITE_LAB[1] + wb * BLACK_LAB[1] + wc * vivid[1]
    const bb = wa * WHITE_LAB[2] + wb * BLACK_LAB[2] + wc * vivid[2]
    return chroma.lab(L, aa, bb).hex()
  }

  // 指定された各列の明度範囲を塗りつぶす（col 0 の頂点は半セルずらして別途描画）
  type Cell = { col: number; row: number; fill: string }
  function buildCells(): Cell[] {
    const result: Cell[] = []
    FILL_LIGHT.forEach(([topLight, botLight], col) => {
      if (col === APEX_STRADDLE_COL) return
      const top = LIGHTNESS_ROWS.indexOf(topLight)
      const bot = LIGHTNESS_ROWS.indexOf(botLight)
      for (let row = top; row <= bot; row++) result.push({ col, row, fill: colorAt(col, row) })
    })
    return result
  }

  // 8：Y の純色（明度8.0）は行 8.5 の下半分＋行 7.5 の上半分にまたがるよう半セルずらして塗る
  const APEX_STRADDLE_COL = 0
  const APEX_STRADDLE_ROW = LIGHTNESS_ROWS.indexOf(8.5) // 上端の行（8.5）
  const APEX_STRADDLE_HEX = PCCS_HEX_MAP.get("v8")!

  const cells = buildCells()

  // ===== レイアウト =====
  const CELL = 38
  const PAD_TOP = 10
  const PAD_RIGHT = 10
  const PAD_LEFT = 66 // 明度ラベル＋数値
  const PAD_BOTTOM = 50 // 彩度数値＋ラベル

  const GRID_LEFT = PAD_LEFT
  const GRID_TOP = PAD_TOP
  const GRID_W = N_COLS * CELL
  const GRID_H = N_ROWS * CELL
  const WIDTH = PAD_LEFT + GRID_W + PAD_RIGHT
  const HEIGHT = PAD_TOP + GRID_H + PAD_BOTTOM

  const cellX = (col: number) => GRID_LEFT + col * CELL
  const cellY = (row: number) => GRID_TOP + row * CELL

  // ===== 色・線・フォント =====
  const COL_GRID = "light-dark(#c4c4c4, #555)"
  const COL_TEXT = "var(--color-body)"
  const GRID_STROKE_W = 1
  const FONT_SIZE_NUM = 13
  const FONT_SIZE_AXIS = 14

  const SAT_LABEL_Y = GRID_TOP + GRID_H + 16
  const SAT_AXIS_Y = SAT_LABEL_Y + 18

  const rows = Array.from({ length: N_ROWS }, (_, i) => i)
  const cols = Array.from({ length: N_COLS }, (_, i) => i)
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 {WIDTH} {HEIGHT}"
  role="img"
  aria-label="PCCSの等色相面（左 8：Y・右 20：V、縦軸=明度・横軸=彩度）"
>
  <!-- 色の塗り（グリッド線の下） -->
  {#each cells as cell (`${cell.col}-${cell.row}`)}
    <rect x={cellX(cell.col)} y={cellY(cell.row)} width={CELL} height={CELL} fill={cell.fill} />
  {/each}

  <!-- グリッド線（11×9・全セル） -->
  {#each rows as row (row)}
    {#each cols as col (col)}
      <rect
        x={cellX(col)}
        y={cellY(row)}
        width={CELL}
        height={CELL}
        fill="none"
        stroke={COL_GRID}
        stroke-width={GRID_STROKE_W}
      />
    {/each}
  {/each}

  <!-- 8：Y 純色: 行8.5の下半分＋行7.5の上半分（半セルずらし）。
       グリッド線の上に重ね、背後の罫線を隠して1つのセルに見せる -->
  <rect
    x={cellX(APEX_STRADDLE_COL)}
    y={cellY(APEX_STRADDLE_ROW) + CELL / 2}
    width={CELL}
    height={CELL}
    fill={APEX_STRADDLE_HEX}
    stroke={COL_GRID}
    stroke-width={GRID_STROKE_W}
  />

  <!-- 明度（縦軸）の数値 -->
  {#each LIGHTNESS_ROWS as light, row (light)}
    <text
      x={GRID_LEFT - 8}
      y={cellY(row) + CELL / 2}
      text-anchor="end"
      dominant-baseline="central"
      font-size={FONT_SIZE_NUM}
      font-family="var(--font-mono)"
      style="fill: {COL_TEXT};"
    >
      {light.toFixed(1)}
    </text>
  {/each}

  <!-- 明度（縦軸）のラベル -->
  <text
    x={16}
    y={GRID_TOP + GRID_H / 2}
    writing-mode="vertical-rl"
    text-anchor="middle"
    font-size={FONT_SIZE_AXIS}
    style="fill: {COL_TEXT};"
  >
    Lightness
  </text>

  <!-- 彩度（横軸）の数値 -->
  {#each SAT_LABELS as label, col (col)}
    <text
      x={cellX(col) + CELL / 2}
      y={SAT_LABEL_Y}
      text-anchor="middle"
      dominant-baseline="hanging"
      font-size={FONT_SIZE_NUM}
      font-family="var(--font-mono)"
      style="fill: {COL_TEXT};"
    >
      {label}
    </text>
  {/each}

  <!-- 彩度（横軸）のラベル -->
  <text
    x={GRID_LEFT + GRID_W / 2}
    y={SAT_AXIS_Y}
    text-anchor="middle"
    dominant-baseline="hanging"
    font-size={FONT_SIZE_AXIS}
    style="fill: {COL_TEXT};"
  >
    Saturation
  </text>
</svg>
