<script lang="ts">
  import { PCCS_HEX_MAP } from "$lib/data/pccs"

  // ===== レイアウト =====
  const N = 8 // 1辺あたりのマスの数
  const CELL = 44 // 1マスの一辺
  const SIZE = N * CELL // 図全体の一辺

  // ===== 色 =====
  // 明度がほぼ等しく色相が大きく異なる2色（赤と緑）で市松模様を作る。
  // 明度差がないため境界が曖昧になり、市松模様の形がとらえにくくなる（リープマン効果）。
  const COL_A = PCCS_HEX_MAP.get("v3")! // 赤
  const COL_B = PCCS_HEX_MAP.get("v13")! // 緑

  // COL_B で塗るマス（市松状に一つおき）。背景を COL_A で塗り、この上にだけ重ねる
  const cellsB = Array.from({ length: N * N }, (_, i) => ({
    col: i % N,
    row: Math.floor(i / N)
  })).filter(({ row, col }) => (row + col) % 2 === 1)
</script>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {SIZE} {SIZE}">
  <!-- 背景を一方の色で塗りつぶす（マス間の隙間を防ぐ） -->
  <rect x="0" y="0" width={SIZE} height={SIZE} fill={COL_A} />

  <!-- もう一方の色のマスだけを市松状に重ねる -->
  {#each cellsB as cell, i (i)}
    <rect x={cell.col * CELL} y={cell.row * CELL} width={CELL} height={CELL} fill={COL_B} />
  {/each}
</svg>
