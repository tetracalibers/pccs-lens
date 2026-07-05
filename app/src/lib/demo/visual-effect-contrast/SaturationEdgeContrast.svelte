<script lang="ts">
  import chroma from "chroma-js"
  import { PCCS_HEX_MAP } from "$lib/data/pccs"

  // ===== 彩度の段階（赤 R を、彩度0＝無彩色グレイ→最高彩度へ） =====
  // 明度 L・色相 H を最高彩度の赤 (v2) に固定し、彩度 C だけを変える。
  // これにより明度対比・色相対比が混ざらない純粋な「彩度差」の段階になる。
  const GROUND_MAX_PCCS = "v2" // 最高彩度の赤（L・H・彩度上限の基準）
  const STEP_COUNT = 9

  // ===== レイアウト（Achromatic/ChromaticEdgeContrast と揃える） =====
  const CHIP_SIZE = 80 // 下段の正方形チップの一辺
  const CHIP_GAP = 24 // 下段チップ間の隙間
  const STRIP_HEIGHT = 80 // 上段ストリップの高さ
  const ROW_GAP = 18 // 上段と下段の縦の間隔
  const PADDING = 20 // 図全体の余白
  // 上段ストリップの境界に引く縦線の太さ。隣接ストリップ間で背景（白）が
  // 透けて見える隙間を埋め、色どうしがぴったり接するようにする
  const STROKE_TOP = 2

  // ===== 色 =====
  // 下段チップ間の隙間（＝背景）の色。チップと明確に分離させるため白にする
  const COL_GAP = "#ffffff"

  // ===== 派生値 =====
  // チップの中心間隔。上段ストリップの幅もこれに一致し、隣り合う隙間の中点で色が切り替わる
  const PITCH = CHIP_SIZE + CHIP_GAP
  const WIDTH = 2 * PADDING + STEP_COUNT * PITCH
  const HEIGHT = 2 * PADDING + STRIP_HEIGHT + ROW_GAP + CHIP_SIZE
  const TOP_Y = PADDING
  const BOTTOM_Y = PADDING + STRIP_HEIGHT + ROW_GAP

  // 最高彩度の赤から明度 L・色相 H・彩度上限 C を取得
  const [LCH_L, MAX_CHROMA, LCH_H] = chroma(PCCS_HEX_MAP.get(GROUND_MAX_PCCS) ?? "#000000").lch()
  // 彩度0（無彩色グレイ）から最高彩度まで等間隔。左＝低彩度、右＝高彩度
  const COLORS = Array.from({ length: STEP_COUNT }, (_, i) =>
    chroma.lch(LCH_L, (MAX_CHROMA * i) / (STEP_COUNT - 1), LCH_H).hex()
  )

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
