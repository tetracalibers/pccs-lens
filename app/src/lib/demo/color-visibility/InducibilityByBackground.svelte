<script lang="ts">
  import { PCCS_HEX_MAP } from "$lib/data/pccs"

  // ===== レイアウト定数 =====
  const SQ_SIZE = 100 // 正方形の一辺
  const GAP_X = 28 // 正方形同士の横方向の隙間
  const PAD_X = 32 // 背景長方形の左右パディング
  const PAD_Y = 24 // 背景長方形の上下パディング
  const GAP_Y = 16 // 上下の長方形同士の隙間
  const OUTLINE_STROKE_WIDTH = 1 // 白背景の枠線

  // ===== 色 =====
  const COL_WHITE_BG = "#ffffff"
  const COL_BLACK_BG = "#000000"
  const COL_OUTLINE = "var(--color-body)"

  // ===== 行ごとの並び順 =====
  const ROW_ON_WHITE = ["v5", "v8", "v2"]
  const ROW_ON_BLACK = ["v5", "v2", "v8"]

  // ===== 寸法 =====
  const ROW_W = 2 * PAD_X + 3 * SQ_SIZE + 2 * GAP_X
  const ROW_H = 2 * PAD_Y + SQ_SIZE
  const WIDTH = ROW_W
  const HEIGHT = 2 * ROW_H + GAP_Y

  const ROW_WHITE_Y = 0
  const ROW_BLACK_Y = ROW_H + GAP_Y
  const SQ_Y_OFFSET = PAD_Y

  function squareX(index: number): number {
    return PAD_X + index * (SQ_SIZE + GAP_X)
  }
</script>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {WIDTH} {HEIGHT}">
  <!-- 白背景の長方形 -->
  <rect
    x={OUTLINE_STROKE_WIDTH / 2}
    y={ROW_WHITE_Y + OUTLINE_STROKE_WIDTH / 2}
    width={ROW_W - OUTLINE_STROKE_WIDTH}
    height={ROW_H - OUTLINE_STROKE_WIDTH}
    fill={COL_WHITE_BG}
    stroke={COL_OUTLINE}
    stroke-width={OUTLINE_STROKE_WIDTH}
  />
  {#each ROW_ON_WHITE as notation, i (notation)}
    <rect
      x={squareX(i)}
      y={ROW_WHITE_Y + SQ_Y_OFFSET}
      width={SQ_SIZE}
      height={SQ_SIZE}
      fill={PCCS_HEX_MAP.get(notation) ?? "#000"}
    />
  {/each}

  <!-- 黒背景の長方形 -->
  <rect
    x="0"
    y={ROW_BLACK_Y}
    width={ROW_W}
    height={ROW_H}
    fill={COL_BLACK_BG}
    stroke={COL_OUTLINE}
    stroke-width={OUTLINE_STROKE_WIDTH}
  />
  {#each ROW_ON_BLACK as notation, i (notation)}
    <rect
      x={squareX(i)}
      y={ROW_BLACK_Y + SQ_Y_OFFSET}
      width={SQ_SIZE}
      height={SQ_SIZE}
      fill={PCCS_HEX_MAP.get(notation) ?? "#000"}
    />
  {/each}
</svg>
