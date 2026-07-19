<script lang="ts">
  // ===== レイアウト =====（McColloughTestGrating と同一）
  const SIZE = 280 // 正方形の一辺
  const HALF = SIZE / 2 // 左右半分の境界

  // 左半分：縦縞（適応図に近い間隔。140 を整数本で割り切る）
  const STRIPE_LEFT = 14
  const N_LEFT = HALF / STRIPE_LEFT // 10

  // 右半分：横縞（奇数本にして上下端を黒にする）
  const N_RIGHT = 21
  const STRIPE_RIGHT = SIZE / N_RIGHT // ≈13.33

  // ===== 色 =====
  const COL_BLACK = "#000000"
  const COL_PINK = "var(--pastel-pink)" // 左半分の白部分を塗る薄いピンク
  const COL_GREEN = "var(--pastel-green)" // 右半分の白部分を塗る薄い緑

  // 左半分：黒と薄いピンクの縦縞（左から黒・ピンクを交互に並べる）
  const leftStripes = Array.from({ length: N_LEFT }, (_, i) => ({
    x: i * STRIPE_LEFT,
    fill: i % 2 === 0 ? COL_BLACK : COL_PINK
  }))

  // 右半分：黒と薄い緑の横縞（上下端が黒。上から黒・緑を交互に並べる）
  const rightStripes = Array.from({ length: N_RIGHT }, (_, i) => ({
    y: i * STRIPE_RIGHT,
    fill: i % 2 === 0 ? COL_BLACK : COL_GREEN
  }))
</script>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {SIZE} {SIZE}">
  <!-- 左半分：縦縞 -->
  {#each leftStripes as stripe, i (i)}
    <rect x={stripe.x} y="0" width={STRIPE_LEFT} height={SIZE} fill={stripe.fill} />
  {/each}

  <!-- 右半分：横縞 -->
  {#each rightStripes as stripe, i (i)}
    <rect x={HALF} y={stripe.y} width={HALF} height={STRIPE_RIGHT} fill={stripe.fill} />
  {/each}
</svg>
