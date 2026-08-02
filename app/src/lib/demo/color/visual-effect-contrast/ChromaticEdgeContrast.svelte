<script lang="ts">
  import { PCCS_HEX_MAP } from "$lib/data/pccs"

  // ===== 有彩色の段階（PCCS ビビッドトーンの色相） =====
  // 24(RP:赤紫) → 1 → 2(R:赤) → … → 8(Y:黄) と、暖色側を通って赤紫から黄へ推移する
  const HUES = [24, 1, 2, 3, 4, 5, 6, 7, 8]
  const TONE = "v"
  const STEP_COUNT = HUES.length

  // ===== レイアウト（AchromaticEdgeContrast と揃える） =====
  const CHIP_SIZE = 80 // 下段の正方形チップの一辺
  const CHIP_GAP = 24 // 下段チップ間の隙間
  const STRIP_HEIGHT = 80 // 上段ストリップの高さ
  const ROW_GAP = 18 // 上段と下段の縦の間隔
  const PADDING = 20 // 図全体の余白
  // 上段ストリップの境界に引く縦線の太さ。隣接ストリップ間で背景（白）が
  // 透けて見える隙間を埋め、色どうしがぴったり接するようにする
  const STROKE_TOP = 2

  // ===== 色 =====
  // 下段チップ間の隙間（＝背景）の色。有彩色チップと明確に分離させるため白にする
  const COL_GAP = "#ffffff"

  // ===== 派生値 =====
  // チップの中心間隔。上段ストリップの幅もこれに一致し、隣り合う隙間の中点で色が切り替わる
  const PITCH = CHIP_SIZE + CHIP_GAP
  const WIDTH = 2 * PADDING + STEP_COUNT * PITCH
  const HEIGHT = 2 * PADDING + STRIP_HEIGHT + ROW_GAP + CHIP_SIZE
  const TOP_Y = PADDING
  const BOTTOM_Y = PADDING + STRIP_HEIGHT + ROW_GAP

  // 赤紫（左）から黄（右）へ段階的に推移する有彩色
  const COLORS = HUES.map((hue) => PCCS_HEX_MAP.get(`${TONE}${hue}`) ?? "#000000")

  // 上段ストリップの内側境界（隣接する色の切り替わり位置）。
  // 各境界に、左側ストリップと同色の縦線を重ねて背景の透けを消す
  const BOUNDARIES = Array.from({ length: STEP_COUNT - 1 }, (_, i) => ({
    x: PADDING + (i + 1) * PITCH,
    color: COLORS[i]
  }))
</script>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {WIDTH} {HEIGHT}">
  <!-- 背景（下段チップ間の隙間の色） -->
  <rect x="0" y="0" width={WIDTH} height={HEIGHT} fill={COL_GAP} />

  <!-- 上段：隙間なしで連続して並ぶストリップ。境界で縁辺対比が現れる -->
  {#each COLORS as color, i (i)}
    <rect x={PADDING + i * PITCH} y={TOP_Y} width={PITCH} height={STRIP_HEIGHT} fill={color} />
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
  {#each COLORS as color, i (i)}
    <rect
      x={PADDING + CHIP_GAP / 2 + i * PITCH}
      y={BOTTOM_Y}
      width={CHIP_SIZE}
      height={CHIP_SIZE}
      fill={color}
    />
  {/each}
</svg>
