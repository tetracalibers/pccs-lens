<script lang="ts">
  import { PCCS_HEX_MAP } from "$lib/data/pccs"

  // ===== レイアウト =====
  const SIZE = 280 // 正方形の一辺
  const N_STRIPES = 21 // 縦縞の本数（奇数にして左右端を黒にする）
  const STRIPE = SIZE / N_STRIPES // 縞1本の幅

  // ===== 色 =====
  const COL_GREEN = PCCS_HEX_MAP.get("v12")! // 緑の縞（PCCS v12）
  const COL_BLACK = "#000000" // 黒の縞

  // 各縞の x 座標と色（左右端が黒になるよう、端から黒・緑を交互に並べる）
  const stripes = Array.from({ length: N_STRIPES }, (_, i) => ({
    x: i * STRIPE,
    fill: i % 2 === 0 ? COL_BLACK : COL_GREEN
  }))
</script>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {SIZE} {SIZE}">
  {#each stripes as stripe, i (i)}
    <rect x={stripe.x} y="0" width={STRIPE} height={SIZE} fill={stripe.fill} />
  {/each}
</svg>
