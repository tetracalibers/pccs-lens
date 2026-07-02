<script lang="ts">
  import { PCCS_HEX_MAP } from "$lib/data/pccs"
  import { isLightColor } from "$lib/color/utils"

  // ===== 上段パネル（対比を起こす地と図） =====
  const PANEL_SIZE = 200 // 地の正方形の一辺
  const FIGURE_SIZE = 110 // 図の正方形の一辺
  const GAP_X = 28 // パネル同士の横の隙間

  // ===== 下段リビール（実際の色を同じ地に並べる） =====
  const SWATCH_SIZE = 90 // 実際の色見本の一辺
  const REVEAL_PAD = 22 // リビールの地の内側余白

  // ===== フォントサイズ =====
  const FONT_SIZE_PANEL_LABEL = 15 // パネル内の地ラベル
  const FONT_SIZE_CAPTION = 16 // 図の下のキャプション

  // ===== 余白（縦方向） =====
  const GAP_PANEL_LABEL = 22 // パネル上端からラベルのベースラインまで
  const GAP_CAPTION1 = 34 // パネル下端からキャプション1のベースラインまで
  const GAP_CAPTION1_REVEAL = 24 // キャプション1からリビールの地の上端まで
  const GAP_CAPTION2 = 30 // リビールの地の下端からキャプション2のベースラインまで

  // ===== 色 =====
  const COL_CAPTION = "var(--color-body)" // ページ背景上のキャプション文字色
  const COL_REVEAL_GROUND = PCCS_HEX_MAP.get("Gy-7.5")! // リビールの共通の地（中間明度）

  // ===== パネル定義 =====
  // 明度の異なる図を、それぞれ明度対比で「中間の明るさ」に寄せて同じに見せる。
  //   明るい地 → 図は実際より暗く見える（明るめの図を置く）
  //   暗い地   → 図は実際より明るく見える（暗めの図を置く）
  interface Panel {
    groundNotation: string
    figureNotation: string
    groundLabel: string
  }
  const PANELS: Panel[] = [
    { groundNotation: "Gy-9.0", figureNotation: "Gy-6.5", groundLabel: "明るい地" },
    { groundNotation: "Bk", figureNotation: "Gy-5.0", groundLabel: "暗い地" }
  ]

  // ===== レイアウト計算 =====
  const WIDTH = 2 * PANEL_SIZE + GAP_X

  const panels = PANELS.map((p, i) => {
    const x = i * (PANEL_SIZE + GAP_X)
    const groundHex = PCCS_HEX_MAP.get(p.groundNotation)!
    return {
      groundLabel: p.groundLabel,
      groundNotation: p.groundNotation,
      x,
      groundHex,
      figureHex: PCCS_HEX_MAP.get(p.figureNotation)!,
      figureX: x + (PANEL_SIZE - FIGURE_SIZE) / 2,
      figureY: (PANEL_SIZE - FIGURE_SIZE) / 2,
      labelColor: isLightColor(groundHex) ? "#000" : "#fff"
    }
  })

  const caption1Y = PANEL_SIZE + GAP_CAPTION1

  // リビール：実際の図の色を同じ地の上に隣り合わせて並べる
  const REVEAL_W = 2 * SWATCH_SIZE + 2 * REVEAL_PAD
  const REVEAL_H = SWATCH_SIZE + 2 * REVEAL_PAD
  const revealX = (WIDTH - REVEAL_W) / 2
  const revealY = caption1Y + GAP_CAPTION1_REVEAL
  const swatchY = revealY + REVEAL_PAD
  const swatches = PANELS.map((p, i) => ({
    figureNotation: p.figureNotation,
    figureHex: PCCS_HEX_MAP.get(p.figureNotation)!,
    x: revealX + REVEAL_PAD + i * SWATCH_SIZE
  }))

  const caption2Y = revealY + REVEAL_H + GAP_CAPTION2

  const HEIGHT = caption2Y + FONT_SIZE_CAPTION * 0.3
</script>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {WIDTH} {HEIGHT}">
  <!-- 上段：明度対比を起こすパネル -->
  {#each panels as panel (panel.groundNotation)}
    <rect x={panel.x} y="0" width={PANEL_SIZE} height={PANEL_SIZE} fill={panel.groundHex} />
    <text
      x={panel.x + PANEL_SIZE / 2}
      y={GAP_PANEL_LABEL}
      text-anchor="middle"
      font-size={FONT_SIZE_PANEL_LABEL}
      fill={panel.labelColor}
    >
      {panel.groundLabel}
    </text>
    <rect
      x={panel.figureX}
      y={panel.figureY}
      width={FIGURE_SIZE}
      height={FIGURE_SIZE}
      fill={panel.figureHex}
    />
  {/each}

  <!-- キャプション1：見た目 -->
  <text
    x={WIDTH / 2}
    y={caption1Y}
    text-anchor="middle"
    font-size={FONT_SIZE_CAPTION}
    fill={COL_CAPTION}
  >
    <tspan>背景の影響で、2つの図は</tspan><tspan font-weight="bold">同じ明るさに見える</tspan>
  </text>

  <!-- 下段：実際の色を同じ地に並べたリビール -->
  <rect x={revealX} y={revealY} width={REVEAL_W} height={REVEAL_H} fill={COL_REVEAL_GROUND} />
  {#each swatches as swatch (swatch.figureNotation)}
    <rect x={swatch.x} y={swatchY} width={SWATCH_SIZE} height={SWATCH_SIZE} fill={swatch.figureHex} />
  {/each}

  <!-- キャプション2：実際 -->
  <text
    x={WIDTH / 2}
    y={caption2Y}
    text-anchor="middle"
    font-size={FONT_SIZE_CAPTION}
    fill={COL_CAPTION}
  >
    <tspan>同じ地に並べると</tspan><tspan font-weight="bold">明るさの違いがわかる</tspan>
  </text>
</svg>
