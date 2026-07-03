<script lang="ts">
  import Icon from "@iconify/svelte"
  // 配色（図・地）は config に集約。同明度に見えるかのテストと共有する。
  import { FIGURE_HEXES, ROW_GROUNDS } from "./lightnessContrastEqualBrightness.config"

  // ===== パネル =====
  const PANEL_SIZE = 200 // 地の正方形の一辺
  const ICON_SIZE = 110 // 図（星アイコン）の一辺
  const GAP_X = 28 // パネル同士の横の隙間
  const GAP_Y = 28 // 行同士の縦の隙間

  // ===== 図 =====
  const ICON_ID = "mynaui:flower-solid"

  // ===== レイアウト計算 =====
  const WIDTH = 2 * PANEL_SIZE + GAP_X
  const HEIGHT = 2 * PANEL_SIZE + GAP_Y

  const panels = ROW_GROUNDS.flatMap((grounds, r) =>
    FIGURE_HEXES.map((figureHex, c) => {
      const x = c * (PANEL_SIZE + GAP_X)
      const y = r * (PANEL_SIZE + GAP_Y)
      return {
        key: `${r}-${c}`,
        x,
        y,
        groundHex: grounds[c],
        figureHex,
        iconX: x + (PANEL_SIZE - ICON_SIZE) / 2,
        iconY: y + (PANEL_SIZE - ICON_SIZE) / 2
      }
    })
  )
</script>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {WIDTH} {HEIGHT}">
  {#each panels as panel (panel.key)}
    <rect x={panel.x} y={panel.y} width={PANEL_SIZE} height={PANEL_SIZE} fill={panel.groundHex} />
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
