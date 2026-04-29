<script lang="ts">
  import Icon from "@iconify/svelte"
  import { PCCS_HEX_MAP } from "$lib/data/pccs"

  let {
    figure,
    ground,
    iconId
  }: {
    figure: string
    ground: string
    iconId: string
  } = $props()

  // ===== SVG dimensions =====
  const SQ_SIZE = 200
  const ICON_SIZE = 110

  const SVG_W = SQ_SIZE
  const SVG_H = SQ_SIZE
  const ICON_X = (SVG_W - ICON_SIZE) / 2
  const ICON_Y = (SVG_H - ICON_SIZE) / 2

  const figureHex = $derived(PCCS_HEX_MAP.get(figure) ?? "#000000")
  const groundHex = $derived(PCCS_HEX_MAP.get(ground) ?? "#ffffff")
</script>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {SVG_W} {SVG_H}">
  <rect x="0" y="0" width={SVG_W} height={SVG_H} fill={groundHex} />
  <foreignObject x={ICON_X} y={ICON_Y} width={ICON_SIZE} height={ICON_SIZE}>
    <div
      xmlns="http://www.w3.org/1999/xhtml"
      style="width: 100%; height: 100%; color: {figureHex}; display: grid; place-items: center;"
    >
      <Icon icon={iconId} width={ICON_SIZE} height={ICON_SIZE} />
    </div>
  </foreignObject>
</svg>
