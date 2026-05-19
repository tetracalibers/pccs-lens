<script lang="ts">
  import chroma from "chroma-js"
  import { PCCS_HEX_MAP } from "$lib/data/pccs"

  // ===== レイアウト定数 =====
  const NUM_SQUARES = 5
  const OUTER_SIZE = 300 // 最外側の正方形の一辺
  const SIZE_STEP = 30 // 内側に1段進むごとに左右で減少する量
  const PADDING = 0 // viewBox外周の余白

  // ===== 明度ステップ =====
  // chroma.brighten は amount=1 で CIELAB の L* を +18 する
  const LIGHTNESS_STEP = 0.5

  // ===== 基準色 =====
  // 進出色の代表として暖色の vivid トーン（橙赤）を採用
  const BASE_PCCS = "v3"
  const BASE_HEX = PCCS_HEX_MAP.get(BASE_PCCS)!

  // ===== 派生値 =====
  const WIDTH = OUTER_SIZE + PADDING * 2
  const HEIGHT = OUTER_SIZE + PADDING * 2

  // 外側 (i=0) から内側 (i=NUM_SQUARES-1) へ向けて明度を上げる
  const squares = Array.from({ length: NUM_SQUARES }, (_, i) => {
    const size = OUTER_SIZE - i * SIZE_STEP * 2
    const offset = i * SIZE_STEP
    const color = chroma(BASE_HEX)
      .brighten(i * LIGHTNESS_STEP)
      .hex()
    return {
      x: PADDING + offset,
      y: PADDING + offset,
      size,
      color
    }
  })
</script>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {WIDTH} {HEIGHT}">
  {#each squares as sq, i (i)}
    <rect x={sq.x} y={sq.y} width={sq.size} height={sq.size} fill={sq.color} />
  {/each}
</svg>
