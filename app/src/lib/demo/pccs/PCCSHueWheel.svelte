<script lang="ts">
  import { arc } from "d3-shape"
  import { PCCS_HUE_MAP } from "$lib/data/pccs"
  import { isLightColor } from "$lib/color/utils"
  import { ankiMode } from "$lib/state/anki.svelte"

  interface Props {
    /** 色相環の外側の円の半径（px） */
    radius?: number
    /** スウォッチの高さ（外周から内周までの距離, px） */
    swatchHeight?: number
  }

  let { radius = 220, swatchHeight = 55 }: Props = $props()

  // ===== セグメント仕様 =====
  // 24 セグメント、各 15°。num k のセグメントは [(k-1)·SA, k·SA]。
  const HUE_COUNT = 24
  const SEGMENT_ANGLE = (2 * Math.PI) / HUE_COUNT

  // ===== 角度オフセット =====
  // num=8 の中心を 12 時に揃える。
  // num=8 のセグメント中心は 7.5·SA なので、これを 0 にする。
  const TOP_HUE_NUM = 8
  const ANGLE_OFFSET = -(TOP_HUE_NUM - 0.5) * SEGMENT_ANGLE

  // ===== フォント =====
  const FONT_SIZE_LABEL = 14

  // ===== 半径 =====
  let R_OUTER = $derived(radius)
  let R_INNER = $derived(Math.max(1, radius - swatchHeight))
  // 隣接スウォッチ間の隙間（midRadius における弧長相当）
  let gap = $derived(Math.max(2, radius * 0.018))
  let midRadius = $derived((R_OUTER + R_INNER) / 2)
  let padAngle = $derived(gap / midRadius)

  // ===== ViewBox =====
  let PADDING = $derived(radius * 0.08)
  let VB_R = $derived(R_OUTER + PADDING)
  let viewBox = $derived(`${-VB_R} ${-VB_R} ${2 * VB_R} ${2 * VB_R}`)

  type Segment = {
    key: number
    symbol: string
    color: string
    textColor: string
    path: string
    /** 12 時 = 0、CW を正とする中心角度（度） */
    midAngleDeg: number
  }

  // 12 時 = 0、CW 正の角度を SVG 座標へ変換（原点中心）
  function pointAt(angleDeg: number, r: number): [number, number] {
    const t = ((angleDeg - 90) * Math.PI) / 180
    return [r * Math.cos(t), r * Math.sin(t)]
  }

  let segments: Segment[] = $derived.by(() => {
    const arcGen = arc<{ x0: number; x1: number }>()
      .startAngle((d) => d.x0 + ANGLE_OFFSET)
      .endAngle((d) => d.x1 + ANGLE_OFFSET)
      .innerRadius(R_INNER)
      .outerRadius(R_OUTER)
      .padAngle(padAngle)
      .padRadius(midRadius)

    return Array.from(PCCS_HUE_MAP.entries()).map(([num, data]) => {
      const x0 = (num - 1) * SEGMENT_ANGLE
      const x1 = num * SEGMENT_ANGLE
      const midAng = (((x0 + x1) / 2 + ANGLE_OFFSET) * 180) / Math.PI
      return {
        key: num,
        symbol: data.symbol,
        color: data.color,
        textColor: isLightColor(data.color) ? "#222" : "#fff",
        path: arcGen({ x0, x1 }) ?? "",
        midAngleDeg: midAng
      }
    })
  })
  
  const isAnki = $derived(ankiMode.isAnki)
</script>

<svg xmlns="http://www.w3.org/2000/svg" {viewBox} role="img" aria-label="PCCS色相環">
  <!-- 24 色相のスウォッチ -->
  {#each segments as seg (seg.key)}
    <path d={seg.path} fill={seg.color} />
  {/each}

  <!-- ラベル（回転なし、扇形の中央に配置）-->
  {#each segments as seg (seg.key)}
    {@const [lx, ly] = pointAt(seg.midAngleDeg, midRadius)}
    <text class="symbol" x={lx} y={ly} font-size={FONT_SIZE_LABEL} fill={seg.textColor}>
      {isAnki ? "" : seg.symbol}
    </text>
  {/each}
</svg>

<style>
  svg {
    display: block;
    max-width: 100%;
    height: auto;
  }

  .symbol {
    font-family: var(--font-mono);
    text-anchor: middle;
    dominant-baseline: central;
  }
</style>
