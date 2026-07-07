<script lang="ts">
  // ===== レイアウト =====
  const N = 8 // 1辺あたりのマスの数
  const CELL = 44 // 1マスの一辺
  const SIZE = N * CELL // 図全体の一辺

  // ===== 色 =====
  // 鮮やかなピンクと鮮やかなブルー。明度（L*）をほぼ揃えてある（ともに約58）ため、
  // 色相・彩度は大きく異なるのに明度差がなく、市松模様の境界が曖昧になる（リープマン効果）。
  // 青は本来暗く、PCCS の鮮やかな青（v17 など）ではピンクと等明度にできないため、
  // 明るめの鮮やかな青を用いている（PCCS 外の色）。
  const COL_A = "#FF3399" // 鮮やかなピンク（L*≈58）
  const COL_B = "#0E8CFF" // 鮮やかなブルー（L*≈58）

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
