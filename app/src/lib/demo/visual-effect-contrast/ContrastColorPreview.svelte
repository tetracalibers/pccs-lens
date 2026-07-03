<script lang="ts">
  import Icon from "@iconify/svelte"
  import { PCCS_HEX_MAP } from "$lib/data/pccs"
  import { isLightColor } from "$lib/color/utils"
  import { ankiMode } from "$lib/state/anki.svelte"

  interface Props {
    figure: string
    ground: string
    iconId?: string
    figureLabel?: string
    groundLabel?: string
  }

  let {
    figure,
    ground,
    iconId = "mynaui:flower-solid",
    figureLabel,
    groundLabel,
  }: Props = $props()

  // ===== SVG dimensions =====
  const SQ_SIZE = 200
  const ICON_SIZE = 110

  const SVG_W = SQ_SIZE
  const SVG_H = SQ_SIZE
  const ICON_X = (SVG_W - ICON_SIZE) / 2
  const ICON_Y = (SVG_H - ICON_SIZE) / 2

  // ===== ラベル定数 =====
  const FIGURE_LABEL_FONT_SIZE = 12
  const GROUND_LABEL_FONT_SIZE = 14
  const GROUND_LABEL_PAD = 10

  const figureHex = $derived(PCCS_HEX_MAP.get(figure) ?? "#000000")
  const groundHex = $derived(PCCS_HEX_MAP.get(ground) ?? "#ffffff")

  const figureLabelColor = $derived(isLightColor(figureHex) ? "#000" : "#fff")
  const groundLabelColor = $derived(isLightColor(groundHex) ? "#000" : "#fff")

  const isAnki = $derived(ankiMode.isAnki)
</script>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {SVG_W} {SVG_H}">
  <rect x="0" y="0" width={SVG_W} height={SVG_H} fill={groundHex} />

  {#if groundLabel}
    <text
      x={SVG_W - GROUND_LABEL_PAD}
      y={SVG_H - GROUND_LABEL_PAD}
      text-anchor="end"
      dominant-baseline="alphabetic"
      font-size={GROUND_LABEL_FONT_SIZE}
      font-weight="bold"
      fill={groundLabelColor}
    >
      {isAnki ? "" : groundLabel}
    </text>
  {/if}

  <foreignObject x={ICON_X} y={ICON_Y} width={ICON_SIZE} height={ICON_SIZE}>
    <div
      xmlns="http://www.w3.org/1999/xhtml"
      style="width: 100%; height: 100%; color: {figureHex}; display: grid; place-items: center;"
    >
      <Icon icon={iconId} width={ICON_SIZE} height={ICON_SIZE} />
    </div>
  </foreignObject>

  {#if figureLabel}
    <text
      x={SVG_W / 2}
      y={SVG_H / 2}
      text-anchor="middle"
      dominant-baseline="central"
      font-size={FIGURE_LABEL_FONT_SIZE}
      font-weight="bold"
      fill={figureLabelColor}
    >
      {isAnki ? "" : figureLabel}
    </text>
  {/if}
</svg>
