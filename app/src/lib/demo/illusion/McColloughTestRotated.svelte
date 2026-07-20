<script lang="ts">
  // McColloughTestGrating（左半分縦縞・右半分横縞の白黒）を時計回りに90度回転させた図。
  // 縞の本数・間隔は回転前と同一で、中心まわりに rotate(90) を掛けるだけにしている。

  // ===== レイアウト =====（McColloughTestGrating と同一）
  const SIZE = 280 // 正方形の一辺
  const HALF = SIZE / 2 // 左右半分の境界（= 回転中心）

  // 回転前の左半分：縦縞（適応図に近い間隔。140 を整数本で割り切る）
  const STRIPE_LEFT = 14
  const N_LEFT = HALF / STRIPE_LEFT // 10

  // 回転前の右半分：横縞（奇数本にして上下端を黒にする）
  const N_RIGHT = 21
  const STRIPE_RIGHT = SIZE / N_RIGHT // ≈13.33

  // 境界の黒帯：縦縞と横縞が切り替わる境目を、他の縞と同じ幅で黒く仕切る（境界の右側にグリッドを揃えて置く）
  const BAND_W = STRIPE_LEFT

  // ===== 色 =====
  const COL_WHITE = "#ffffff"
  const COL_BLACK = "#000000"

  // 回転前の左半分：白黒の縦縞（左から黒・白を交互に並べる）
  const leftStripes = Array.from({ length: N_LEFT }, (_, i) => ({
    x: i * STRIPE_LEFT,
    fill: i % 2 === 0 ? COL_BLACK : COL_WHITE
  }))

  // 回転前の右半分：白黒の横縞（上下端が黒。上から黒・白を交互に並べる）
  const rightStripes = Array.from({ length: N_RIGHT }, (_, i) => ({
    y: i * STRIPE_RIGHT,
    fill: i % 2 === 0 ? COL_BLACK : COL_WHITE
  }))
</script>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {SIZE} {SIZE}">
  <!-- 回転前と同じ図を、中心まわりに時計回り90度回転させる（上半分＝横縞／下半分＝縦縞になる） -->
  <g transform="rotate(90 {HALF} {HALF})">
    <!-- 回転前の左半分：縦縞 -->
    {#each leftStripes as stripe, i (i)}
      <rect x={stripe.x} y="0" width={STRIPE_LEFT} height={SIZE} fill={stripe.fill} />
    {/each}

    <!-- 回転前の右半分：横縞 -->
    {#each rightStripes as stripe, i (i)}
      <rect x={HALF} y={stripe.y} width={HALF} height={STRIPE_RIGHT} fill={stripe.fill} />
    {/each}

    <!-- 縦縞と横縞が切り替わる境界を黒帯で仕切る（回転前の座標に置くので回転後も境界に一致する） -->
    <rect x={HALF} y="0" width={BAND_W} height={SIZE} fill={COL_BLACK} />
  </g>
</svg>
