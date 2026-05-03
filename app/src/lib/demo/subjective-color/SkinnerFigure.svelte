<script lang="ts">
  // ===== SVG dimensions =====
  const SIZE = 280
  const CENTER = SIZE / 2

  // ===== Colors =====
  const COL_BG = "#ffffff"
  const COL_INK = "#000000"

  // ===== Layout constants =====
  const OUTER_RADIUS = 140 // 黒い大円の半径
  const DOT_RADIUS = 12 // 白い小円の半径
  const WHITE_RATIO = 0.55 // 黒地に対する白い小円の面積占有率（0〜π/(2√3) ≈ 0.907）

  // 縦・斜めの線上に小円が並ぶ六方格子（hex packing）。
  // 列は垂直に揃い、隣り合う列は縦方向に PITCH_Y/2 ずれて配置される。
  // 列間隔は PITCH_X = PITCH_Y * √3/2 となるように取り、隣接3点が正三角形を作る
  // → これにより各点が縦と60°方向の斜め直線にも整列する。
  // 単位胞（幅 2*PITCH_X × 高さ PITCH_Y）に円が2つ入るため
  // 占有率 = π·r² / (PITCH_X * PITCH_Y) を満たすよう PITCH_Y を逆算する。
  const DOT_PITCH_Y = DOT_RADIUS * Math.sqrt((2 * Math.PI) / (Math.sqrt(3) * WHITE_RATIO))
  const DOT_PITCH_X = (DOT_PITCH_Y * Math.sqrt(3)) / 2

  // ===== 小円の中心座標を生成 =====
  // 大円の中心を基準に、六方格子状に配置する。
  // 中心が大円外にあっても、大円と少しでも重なる位置なら採用。
  // はみ出した部分は clipPath で切り取られる。
  function buildDots(): { cx: number; cy: number }[] {
    const dots: { cx: number; cy: number }[] = []
    // 中心が (OUTER_RADIUS + DOT_RADIUS) 内にあれば、円の一部が大円と重なる
    const reach = OUTER_RADIUS + DOT_RADIUS
    const colMax = Math.ceil(reach / DOT_PITCH_X)
    const rowMax = Math.ceil(reach / DOT_PITCH_Y) + 1
    for (let c = -colMax; c <= colMax; c++) {
      const dx = c * DOT_PITCH_X
      const yOffset = c % 2 === 0 ? 0 : DOT_PITCH_Y / 2
      for (let r = -rowMax; r <= rowMax; r++) {
        const dy = r * DOT_PITCH_Y + yOffset
        if (Math.hypot(dx, dy) <= reach) {
          dots.push({ cx: CENTER + dx, cy: CENTER + dy })
        }
      }
    }
    return dots
  }

  const DOTS = buildDots()
</script>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {SIZE} {SIZE}">
  <defs>
    <!-- 大円の内側に小円を切り取るためのクリップ領域 -->
    <clipPath id="skinner-clip">
      <circle cx={CENTER} cy={CENTER} r={OUTER_RADIUS} />
    </clipPath>
  </defs>

  <!-- 黒い大円 -->
  <circle cx={CENTER} cy={CENTER} r={OUTER_RADIUS} fill={COL_INK} stroke="none" />

  <!-- 縦横グリッド状に並ぶ白い小円（大円の縁で見切れる） -->
  <g clip-path="url(#skinner-clip)">
    {#each DOTS as dot, i (i)}
      <circle cx={dot.cx} cy={dot.cy} r={DOT_RADIUS} fill={COL_BG} />
    {/each}
  </g>
</svg>
