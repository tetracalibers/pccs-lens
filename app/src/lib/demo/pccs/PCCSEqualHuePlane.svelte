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
  const LEFT_SATS = [9, 7, 5, 3, 1] // 左半分（col 0〜4）の彩度
  const RIGHT_SATS = [1, 3, 5, 7, 9] // 右半分（col 6〜10）の彩度
  const GRAY_COL = 5

  const N_COLS = 11
  const N_ROWS = LIGHTNESS_ROWS.length // 9

  // ===== 各トーンの配置（彩度 sat・明度 light）=====
  // 明度は各色のマンセル明度（≒ PCCS 明度）、彩度は v トーンを 9s として
  // マンセルクロマを正規化し、奇数列 {1,3,5,7,9} に丸めて決めている。
  type Placement = { notation: string; sat: number; light: number }
  const HUE_8: Placement[] = [
    { notation: "v8", sat: 9, light: 8.5 },
    { notation: "b8", sat: 7, light: 8.5 },
    { notation: "s8", sat: 7, light: 7.5 },
    { notation: "dp8", sat: 7, light: 6.5 },
    { notation: "lt8", sat: 5, light: 8.5 },
    { notation: "sf8", sat: 5, light: 7.5 },
    { notation: "d8", sat: 5, light: 6.5 },
    { notation: "p8", sat: 3, light: 9.5 },
    { notation: "dk8", sat: 3, light: 4.5 },
    { notation: "ltg8", sat: 1, light: 7.5 },
    { notation: "g8", sat: 1, light: 4.5 },
    { notation: "dkg8", sat: 1, light: 2.5 }
  ]
  const HUE_20: Placement[] = [
    { notation: "v20", sat: 9, light: 3.5 },
    { notation: "b20", sat: 7, light: 5.5 },
    { notation: "s20", sat: 7, light: 3.5 },
    { notation: "dp20", sat: 7, light: 2.5 },
    { notation: "lt20", sat: 5, light: 6.5 },
    { notation: "sf20", sat: 5, light: 5.5 },
    { notation: "d20", sat: 5, light: 3.5 },
    { notation: "p20", sat: 3, light: 7.5 },
    { notation: "dk20", sat: 3, light: 2.5 },
    { notation: "ltg20", sat: 1, light: 6.5 },
    { notation: "g20", sat: 1, light: 3.5 },
    { notation: "dkg20", sat: 1, light: 1.5 }
  ]

  const colOf = (sats: number[], offset: number, sat: number) => offset + sats.indexOf(sat)
  const rowOf = (light: number) => LIGHTNESS_ROWS.indexOf(light)

  const grayHex = (light: number) =>
    PCCS_HEX_MAP.get(light === 9.5 ? "W" : light === 1.5 ? "Bk" : `Gy-${light.toFixed(1)}`)!

  // 列ごとに上端〜下端の明度行を実トーンから決め（＝等色相面の輪郭）、
  // その範囲内をトーン間の Lab 補間で塗りつぶす。範囲外のセルは塗らず形を表す。
  type Cell = { col: number; row: number; fill: string }
  function buildCells(): Cell[] {
    const colAnchors = new Map<number, { row: number; hex: string }[]>()
    const add = (col: number, row: number, hex: string) => {
      if (!colAnchors.has(col)) colAnchors.set(col, [])
      colAnchors.get(col)!.push({ row, hex })
    }

    // 中央の無彩色軸
    LIGHTNESS_ROWS.forEach((light, row) => add(GRAY_COL, row, grayHex(light)))
    // 有彩色（8：Y / 20：V）
    for (const p of HUE_8) add(colOf(LEFT_SATS, 0, p.sat), rowOf(p.light), PCCS_HEX_MAP.get(p.notation)!)
    for (const p of HUE_20) add(colOf(RIGHT_SATS, 6, p.sat), rowOf(p.light), PCCS_HEX_MAP.get(p.notation)!)

    const cells: Cell[] = []
    for (const [col, anchors] of colAnchors) {
      anchors.sort((a, b) => a.row - b.row)
      const minRow = anchors[0].row
      const maxRow = anchors[anchors.length - 1].row
      for (let row = minRow; row <= maxRow; row++) {
        const exact = anchors.find((a) => a.row === row)
        if (exact) {
          cells.push({ col, row, fill: exact.hex })
          continue
        }
        // 上下のアンカーで挟んで Lab 補間
        let lo = anchors[0]
        let hi = anchors[anchors.length - 1]
        for (let i = 0; i < anchors.length - 1; i++) {
          if (anchors[i].row <= row && anchors[i + 1].row >= row) {
            lo = anchors[i]
            hi = anchors[i + 1]
            break
          }
        }
        const t = (row - lo.row) / (hi.row - lo.row)
        cells.push({ col, row, fill: chroma.mix(lo.hex, hi.hex, t, "lab").hex() })
      }
    }
    return cells
  }

  const fillMap = new Map(buildCells().map((c) => [`${c.col}-${c.row}`, c.fill]))

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
  <!-- グリッド（11×9）。等色相面に含まれるセルだけ色で塗る -->
  {#each rows as row (row)}
    {#each cols as col (col)}
      <rect
        x={cellX(col)}
        y={cellY(row)}
        width={CELL}
        height={CELL}
        fill={fillMap.get(`${col}-${row}`) ?? "none"}
        stroke={COL_GRID}
        stroke-width={GRID_STROKE_W}
      />
    {/each}
  {/each}

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
