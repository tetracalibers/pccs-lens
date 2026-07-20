<script lang="ts">
  // McColloughTestRotated（白黒・90度回転版）の着色版。
  // 回転後の「下半分の白＝薄いピンク／上半分の白＝薄い緑」にする。
  // 回転前の左半分は回転後に上半分へ、回転前の右半分は回転後に下半分へ回り込むため、
  // 回転前の左半分の白＝緑、回転前の右半分の白＝ピンク、として着色してから回転させる。

  // ===== レイアウト =====（McColloughTestRotated と同一）
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
  const COL_BLACK = "#000000"
  const COL_PINK = "var(--pastel-pink)" // 白部分を塗る薄いピンク（回転後の下半分）
  const COL_GREEN = "var(--pastel-green)" // 白部分を塗る薄い緑（回転後の上半分）

  // 回転前の左半分：黒と薄い緑の縦縞（回転後に上半分になる。左から黒・緑を交互に並べる）
  const leftStripes = Array.from({ length: N_LEFT }, (_, i) => ({
    x: i * STRIPE_LEFT,
    fill: i % 2 === 0 ? COL_BLACK : COL_GREEN
  }))

  // 回転前の右半分：黒と薄いピンクの横縞（回転後に下半分になる。上から黒・ピンクを交互に並べる）
  const rightStripes = Array.from({ length: N_RIGHT }, (_, i) => ({
    y: i * STRIPE_RIGHT,
    fill: i % 2 === 0 ? COL_BLACK : COL_PINK
  }))
</script>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {SIZE} {SIZE}">
  <!-- 着色した図を、中心まわりに時計回り90度回転させる（上半分＝緑の横縞／下半分＝ピンクの縦縞になる） -->
  <g transform="rotate(90 {HALF} {HALF})">
    <!-- 回転前の左半分：緑の縦縞 -->
    {#each leftStripes as stripe, i (i)}
      <rect x={stripe.x} y="0" width={STRIPE_LEFT} height={SIZE} fill={stripe.fill} />
    {/each}

    <!-- 回転前の右半分：ピンクの横縞 -->
    {#each rightStripes as stripe, i (i)}
      <rect x={HALF} y={stripe.y} width={HALF} height={STRIPE_RIGHT} fill={stripe.fill} />
    {/each}

    <!-- 縦縞と横縞が切り替わる境界を黒帯で仕切る（回転前の座標に置くので回転後も境界に一致する） -->
    <rect x={HALF} y="0" width={BAND_W} height={SIZE} fill={COL_BLACK} />
  </g>
</svg>
