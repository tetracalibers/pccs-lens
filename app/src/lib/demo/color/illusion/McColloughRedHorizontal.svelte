<script lang="ts">
  import { PCCS_HEX_MAP } from "$lib/data/pccs"

  // ===== レイアウト =====
  const SIZE = 280 // 正方形の一辺
  const N_STRIPES = 21 // 横縞の本数（奇数にして上下端を黒にする）
  const STRIPE = SIZE / N_STRIPES // 縞1本の幅

  // ===== 色 =====
  const COL_RED = PCCS_HEX_MAP.get("v2")! // 赤の縞（PCCS v2）
  const COL_BLACK = "#000000" // 黒の縞

  // 各縞の y 座標と色（上下端が黒になるよう、端から黒・赤を交互に並べる）
  const stripes = Array.from({ length: N_STRIPES }, (_, i) => ({
    y: i * STRIPE,
    fill: i % 2 === 0 ? COL_BLACK : COL_RED
  }))
</script>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {SIZE} {SIZE}">
  {#each stripes as stripe, i (i)}
    <rect x="0" y={stripe.y} width={SIZE} height={STRIPE} fill={stripe.fill} />
  {/each}
</svg>
