<script lang="ts">
  import { PCCS_HEX_MAP } from "$lib/data/pccs"

  interface Props {
    bg: string
    fg: string
    stroke: string
    text?: string
    maxW?: number
  }

  let { bg, fg, stroke, text = "Hello World!", maxW = 400 }: Props = $props()

  const bgColor = $derived(PCCS_HEX_MAP.get(bg)!)
  const fgColor = $derived(PCCS_HEX_MAP.get(fg)!)
  const strokeColor = $derived(PCCS_HEX_MAP.get(stroke)!)

  // ===== SVG dimensions =====
  const WIDTH = 400
  const HEIGHT = 100

  // ===== Text settings =====
  const FONT_SIZE = 44
  const STROKE_WIDTH = 4
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 {WIDTH} {HEIGHT}"
  style:max-width="{maxW}px"
  style:width="100%"
  style:height="auto"
  style:display="block"
>
  <rect width={WIDTH} height={HEIGHT} fill={bgColor} />
  <text
    x={WIDTH / 2}
    y={HEIGHT / 2}
    text-anchor="middle"
    dominant-baseline="central"
    fill={fgColor}
    stroke={strokeColor}
    stroke-width={STROKE_WIDTH}
    stroke-linejoin="round"
    paint-order="stroke"
    font-size={FONT_SIZE}
    font-family="var(--font-bold-text-demo)"
  >
    {text}
  </text>
</svg>
