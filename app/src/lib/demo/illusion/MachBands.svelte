<script lang="ts">
  // ===== SVG dimensions =====
  const WIDTH = 960
  const HEIGHT = 220

  // ===== レイアウト =====
  // 3領域の幅の比率（左プラトー : グラデーション : 右プラトー）
  const RATIO_PLATEAU_LEFT = 0.32
  const RATIO_GRADIENT = 0.36
  const PLATEAU_LEFT_W = WIDTH * RATIO_PLATEAU_LEFT
  const GRADIENT_W = WIDTH * RATIO_GRADIENT
  const PLATEAU_RIGHT_W = WIDTH - PLATEAU_LEFT_W - GRADIENT_W

  // グラデーション領域の左右境界X座標
  const X_GRAD_START = PLATEAU_LEFT_W
  const X_GRAD_END = PLATEAU_LEFT_W + GRADIENT_W

  // 隣接する面の継ぎ目（アンチエイリアスの隙間）を埋める縦線の太さ
  const STROKE_WIDTH_SEAM = 1.5

  // ===== 明度（グレイ） =====
  // 暗い面の明度 = グラデーションの暗端、明るい面の明度 = グラデーションの明端。
  // プラトーとグラデーションの端を一致させ、物理的な明度は連続させる
  // （境界にあるのは明度の段差ではなく「傾きの変化」だけ）
  const COL_DARK = "#4d4d4d"
  const COL_LIGHT = "#cccccc"
</script>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {WIDTH} {HEIGHT}">
  <defs>
    <linearGradient id="mach-gradient" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color={COL_DARK} />
      <stop offset="100%" stop-color={COL_LIGHT} />
    </linearGradient>
  </defs>

  <!-- 左：明るさが変わらない暗い面 -->
  <rect x="0" y="0" width={PLATEAU_LEFT_W} height={HEIGHT} fill={COL_DARK} />

  <!-- 中央：明るさがスムーズに変化する面 -->
  <rect x={X_GRAD_START} y="0" width={GRADIENT_W} height={HEIGHT} fill="url(#mach-gradient)" />

  <!-- 右：明るさが変わらない明るい面 -->
  <rect x={X_GRAD_END} y="0" width={PLATEAU_RIGHT_W} height={HEIGHT} fill={COL_LIGHT} />

  <!-- 継ぎ目を埋める縦線（境界の明度と一致させ、面を綺麗につなぐ） -->
  <line
    x1={X_GRAD_START}
    y1="0"
    x2={X_GRAD_START}
    y2={HEIGHT}
    stroke={COL_DARK}
    stroke-width={STROKE_WIDTH_SEAM}
  />
  <line
    x1={X_GRAD_END}
    y1="0"
    x2={X_GRAD_END}
    y2={HEIGHT}
    stroke={COL_LIGHT}
    stroke-width={STROKE_WIDTH_SEAM}
  />
</svg>
