<script lang="ts">
  import { PCCS_HEX_MAP } from "$lib/data/pccs"

  // ===== パネル =====
  const PANEL_SIZE = 120 // 背景の正方形の一辺
  const GAP_X = 16 // パネル同士の横の隙間

  // ===== フォントサイズ =====
  const FONT_SIZE_SAMPLE = 60 // パネル内のサンプル文字

  // ===== 色 =====
  // すべてのパネルで共通する固定の文字色（明度対比のデモ対象なので出し分けない）
  const COL_TEXT = PCCS_HEX_MAP.get("Gy-8.5")!

  // ===== サンプル文字（1文字） =====
  const SAMPLE_TEXT = "あ"

  // ===== パネル定義（左ほど背景が明るく、右ほど暗い） =====
  const BG_NOTATIONS = ["Gy-6.0", "Gy-4.5", "Gy-3.0", "Bk"]
  const PANELS = BG_NOTATIONS.map((notation, i) => ({
    notation,
    bg: PCCS_HEX_MAP.get(notation)!,
    x: i * (PANEL_SIZE + GAP_X)
  }))

  // ===== レイアウト計算 =====
  const WIDTH = BG_NOTATIONS.length * PANEL_SIZE + (BG_NOTATIONS.length - 1) * GAP_X
  const HEIGHT = PANEL_SIZE
</script>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {WIDTH} {HEIGHT}">
  {#each PANELS as panel (panel.notation)}
    <rect x={panel.x} y="0" width={PANEL_SIZE} height={PANEL_SIZE} fill={panel.bg} />
    <text
      x={panel.x + PANEL_SIZE / 2}
      y={PANEL_SIZE / 2}
      text-anchor="middle"
      dominant-baseline="central"
      font-size={FONT_SIZE_SAMPLE}
      fill={COL_TEXT}
    >
      {SAMPLE_TEXT}
    </text>
  {/each}
</svg>
