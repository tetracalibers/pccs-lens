<script lang="ts">
  // ===== SVG dimensions =====
  const SIZE = 320
  const CENTER = SIZE / 2

  // ===== Colors =====
  const COL_BG = "#ffffff"
  const COL_INK = "#000000"
  const COL_FRAME = "var(--color-body)"

  // ===== Layout constants =====
  const OUTER_RADIUS = 150 // 黒い大円の半径
  const DOT_RADIUS = 10 // 白い小円の半径
  const DOT_PITCH = 30 // 小円の中心間隔（縦・横とも同じ）
  const FRAME_STROKE_WIDTH = 1

  // ===== 小円の中心座標を生成 =====
  // 大円の中心を基準に、縦横グリッド状に配置する。
  // 中心が大円外にあっても、大円と少しでも重なる位置なら採用。
  // はみ出した部分は clipPath で切り取られる。
  function buildDots(): { cx: number; cy: number }[] {
    const dots: { cx: number; cy: number }[] = []
    // 中心が (OUTER_RADIUS + DOT_RADIUS) 内にあれば、円の一部が大円と重なる
    const reach = OUTER_RADIUS + DOT_RADIUS
    const startOffset = -Math.ceil(reach / DOT_PITCH) * DOT_PITCH
    const endOffset = Math.ceil(reach / DOT_PITCH) * DOT_PITCH
    for (let dy = startOffset; dy <= endOffset; dy += DOT_PITCH) {
      for (let dx = startOffset; dx <= endOffset; dx += DOT_PITCH) {
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

  <!-- 白背景 -->
  <rect x="0" y="0" width={SIZE} height={SIZE} fill={COL_BG} />

  <!-- 黒い大円 -->
  <circle cx={CENTER} cy={CENTER} r={OUTER_RADIUS} fill={COL_INK} />

  <!-- 縦横グリッド状に並ぶ白い小円（大円の縁で見切れる） -->
  <g clip-path="url(#skinner-clip)">
    {#each DOTS as dot, i (i)}
      <circle cx={dot.cx} cy={dot.cy} r={DOT_RADIUS} fill={COL_BG} />
    {/each}
  </g>

  <!-- 図領域を示す薄い枠 -->
  <circle
    cx={CENTER}
    cy={CENTER}
    r={OUTER_RADIUS}
    fill="none"
    stroke={COL_FRAME}
    stroke-width={FRAME_STROKE_WIDTH}
    opacity="0.4"
  />
</svg>
