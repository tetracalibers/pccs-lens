<script lang="ts">
  // ===== 無彩色の段階数 =====
  const STEP_COUNT = 8

  // ===== 無彩色の明るさ範囲（0–255 のグレイ値。左端＝暗、右端＝明） =====
  const GRAY_MIN = 55
  const GRAY_MAX = 220

  // ===== レイアウト =====
  const CHIP_SIZE = 80 // 下段の正方形チップの一辺
  const CHIP_GAP = 24 // 下段チップ間の隙間
  const STRIP_HEIGHT = 80 // 上段ストリップの高さ
  const ROW_GAP = 18 // 上段と下段の縦の間隔
  const PADDING = 20 // 図全体の余白
  // 上段ストリップの境界に引く縦線の太さ。隣接ストリップ間で背景（白）が
  // 透けて見える隙間を埋め、色どうしがぴったり接するようにする
  const STROKE_TOP = 2

  // ===== 色 =====
  // 下段チップ間の隙間（＝背景）の色。無彩色チップと明確に分離させるため白にする
  const COL_GAP = "#ffffff"

  // ===== 派生値 =====
  // チップの中心間隔。上段ストリップの幅もこれに一致し、隣り合う隙間の中点で色が切り替わる
  const PITCH = CHIP_SIZE + CHIP_GAP
  const WIDTH = 2 * PADDING + STEP_COUNT * PITCH
  const HEIGHT = 2 * PADDING + STRIP_HEIGHT + ROW_GAP + CHIP_SIZE
  const TOP_Y = PADDING
  const BOTTOM_Y = PADDING + STRIP_HEIGHT + ROW_GAP

  // 0–255 のグレイ値を #rrggbb に変換する
  function grayHex(value: number): string {
    const clamped = Math.max(0, Math.min(255, Math.round(value)))
    const h = clamped.toString(16).padStart(2, "0")
    return `#${h}${h}${h}`
  }

  // 左（暗）から右（明）へ均等に明るくなる無彩色の段階
  const GRAYS = Array.from({ length: STEP_COUNT }, (_, i) =>
    grayHex(GRAY_MIN + ((GRAY_MAX - GRAY_MIN) * i) / (STEP_COUNT - 1))
  )

  // 上段ストリップの内側境界（隣接する色の切り替わり位置）。
  // 各境界に、左側ストリップと同色の縦線を重ねて背景の透けを消す
  const BOUNDARIES = Array.from({ length: STEP_COUNT - 1 }, (_, i) => ({
    x: PADDING + (i + 1) * PITCH,
    color: GRAYS[i]
  }))
</script>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {WIDTH} {HEIGHT}">
  <!-- 背景（下段チップ間の隙間の色） -->
  <rect x="0" y="0" width={WIDTH} height={HEIGHT} fill={COL_GAP} />

  <!-- 上段：隙間なしで連続して並ぶストリップ。境界で縁辺対比が現れる -->
  {#each GRAYS as gray, i (i)}
    <rect x={PADDING + i * PITCH} y={TOP_Y} width={PITCH} height={STRIP_HEIGHT} fill={gray} />
  {/each}

  <!-- 上段ストリップ境界の縦線。背景が透けてできる白い隙間を埋める -->
  {#each BOUNDARIES as boundary, i (i)}
    <line
      x1={boundary.x}
      y1={TOP_Y}
      x2={boundary.x}
      y2={TOP_Y + STRIP_HEIGHT}
      stroke={boundary.color}
      stroke-width={STROKE_TOP}
    />
  {/each}

  <!-- 下段：隙間を空けて並ぶ正方形チップ。境界が接しないため縁辺対比が起きない。
       各チップは上段ストリップの中央に位置し、上段の色の切り替わりが隙間の中点にくる -->
  {#each GRAYS as gray, i (i)}
    <rect
      x={PADDING + CHIP_GAP / 2 + i * PITCH}
      y={BOTTOM_Y}
      width={CHIP_SIZE}
      height={CHIP_SIZE}
      fill={gray}
    />
  {/each}
</svg>
