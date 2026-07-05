<script lang="ts">
  // ===== レイアウト =====
  const N = 4 // 1辺あたりの黒い正方形の数
  const SQUARE = 84 // 黒い正方形の一辺
  const STREET = 24 // 正方形の間を走る白い十字路（隙間）の幅
  const MARGIN = STREET // 図の外周の余白（十字路と同じ幅で揃える）

  // 図全体の一辺（余白 + 正方形 + 隙間）
  const SIZE = MARGIN * 2 + N * SQUARE + (N - 1) * STREET

  // ===== 色 =====
  const COL_SQUARE = "#000000" // 黒い正方形
  const COL_STREET = "#ffffff" // 白い十字路・背景

  // 各正方形の左上座標
  const squares = Array.from({ length: N * N }, (_, i) => {
    const col = i % N
    const row = Math.floor(i / N)
    return {
      x: MARGIN + col * (SQUARE + STREET),
      y: MARGIN + row * (SQUARE + STREET)
    }
  })
</script>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {SIZE} {SIZE}">
  <!-- 白い背景（十字路の白はこの面が透けて見える） -->
  <rect x="0" y="0" width={SIZE} height={SIZE} fill={COL_STREET} />

  <!-- 4×4 の黒い正方形。隙間が白い十字路を形づくる -->
  {#each squares as sq, i (i)}
    <rect x={sq.x} y={sq.y} width={SQUARE} height={SQUARE} fill={COL_SQUARE} />
  {/each}
</svg>
