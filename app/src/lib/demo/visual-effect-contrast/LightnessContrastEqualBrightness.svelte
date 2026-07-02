<script lang="ts">
  import Icon from "@iconify/svelte"
  import { PCCS_HEX_MAP } from "$lib/data/pccs"

  // ===== パネル =====
  const PANEL_SIZE = 200 // 地の正方形の一辺
  const ICON_SIZE = 110 // 図（星アイコン）の一辺
  const GAP_X = 28 // パネル同士の横の隙間
  const GAP_Y = 28 // 行同士の縦の隙間

  // ===== 図 =====
  const ICON_ID = "bi:star-fill"
  // 明度の異なる2色。明度対比が働くと同じ明るさに寄って見える。
  const FIGURES = ["Gy-6.5", "Gy-5.0"]

  // ===== 各行の地 =====
  // 上段：地なし（ページ背景に直接置く）→ 図の明るさの違いがわかる
  // 下段：異なる地に並べる（明るい地＋暗い地）→ 図は同じ明るさに見える
  const ROWS: { grounds: string[] | null }[] = [{ grounds: null }, { grounds: ["Gy-9.0", "Bk"] }]

  // ===== レイアウト計算 =====
  const WIDTH = 2 * PANEL_SIZE + GAP_X
  const HEIGHT = 2 * PANEL_SIZE + GAP_Y

  const panels = ROWS.flatMap((row, r) =>
    FIGURES.map((figureNotation, c) => {
      const x = c * (PANEL_SIZE + GAP_X)
      const y = r * (PANEL_SIZE + GAP_Y)
      return {
        key: `${r}-${c}`,
        x,
        y,
        groundHex: row.grounds ? PCCS_HEX_MAP.get(row.grounds[c])! : null,
        figureHex: PCCS_HEX_MAP.get(figureNotation)!,
        iconX: x + (PANEL_SIZE - ICON_SIZE) / 2,
        iconY: y + (PANEL_SIZE - ICON_SIZE) / 2
      }
    })
  )
</script>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {WIDTH} {HEIGHT}">
  {#each panels as panel (panel.key)}
    {#if panel.groundHex}
      <rect x={panel.x} y={panel.y} width={PANEL_SIZE} height={PANEL_SIZE} fill={panel.groundHex} />
    {/if}
    <foreignObject x={panel.iconX} y={panel.iconY} width={ICON_SIZE} height={ICON_SIZE}>
      <div
        xmlns="http://www.w3.org/1999/xhtml"
        style="width: 100%; height: 100%; color: {panel.figureHex}; display: grid; place-items: center;"
      >
        <Icon icon={ICON_ID} width={ICON_SIZE} height={ICON_SIZE} />
      </div>
    </foreignObject>
  {/each}
</svg>
