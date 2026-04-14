<script lang="ts">
  import { PCCS_HUE_MAP } from "$lib/data/pccs"
  import { isLightColor } from "$lib/color/utils"

  interface Props {
    /** 色相環の外側の円の半径（px） */
    radius?: number
    /** 台形スウォッチの高さ（外周から内周までの距離, px） */
    swatchHeight?: number
  }

  let { radius = 220, swatchHeight = 55 }: Props = $props()

  const HUE_COUNT = 24
  const ANGLE_PER_HUE = (2 * Math.PI) / HUE_COUNT
  const HALF_ANGLE = ANGLE_PER_HUE / 2
  const TOP_HUE_NUM = 8
  // SVG座標系における「真上」の角度
  const TOP_ANGLE = -Math.PI / 2

  let R = $derived(radius)
  let r = $derived(Math.max(1, R - swatchHeight))
  // 色スウォッチ同士の隙間（外側・内側ともに同じ距離）
  let gap = $derived(Math.max(2, R * 0.018))

  // 台形スウォッチの中心（外辺中点と内辺中点の中点）の配置半径
  // 幾何対称性から全色相で共通の値になる
  let labelRadius = $derived(
    (gap / 2) * Math.sin(HALF_ANGLE) +
      ((Math.sqrt(Math.max(0, R * R - (gap / 2) ** 2)) +
        Math.sqrt(Math.max(0, r * r - (gap / 2) ** 2))) /
        2) *
        Math.cos(HALF_ANGLE)
  )

  let padding = $derived(R * 0.08)
  let size = $derived((R + padding) * 2)
  let cx = $derived(size / 2)
  let cy = $derived(size / 2)

  function hueAngle(num: number): number {
    // num=8 を真上、時計回りに num が増加
    return TOP_ANGLE + (num - TOP_HUE_NUM) * ANGLE_PER_HUE
  }

  /**
   * 色スウォッチの4頂点を計算。
   * 隣り合うスウォッチの境界線（gap の中心線）に平行で、gap/2 だけ内側に
   * オフセットした2本の直線を左右の辺とすることで、外側・内側どちらの
   * 辺同士の間隔も等しく gap になる台形を構築する。
   */
  function buildSwatchPath(num: number): string {
    const thetaC = hueAngle(num)
    const phiL = thetaC - HALF_ANGLE // 左隣との gap の中心角
    const phiR = thetaC + HALF_ANGLE // 右隣との gap の中心角

    // 左辺：gap 中心線に平行、スウォッチ中心側へ gap/2 だけオフセット
    const offLx = (gap / 2) * -Math.sin(phiL)
    const offLy = (gap / 2) * Math.cos(phiL)
    const dirLx = Math.cos(phiL)
    const dirLy = Math.sin(phiL)

    // 右辺：同様に反対側へオフセット
    const offRx = (gap / 2) * Math.sin(phiR)
    const offRy = (gap / 2) * -Math.cos(phiR)
    const dirRx = Math.cos(phiR)
    const dirRy = Math.sin(phiR)

    const half = gap / 2
    const tOuter = Math.sqrt(R * R - half * half)
    const tInner = Math.sqrt(r * r - half * half)

    const outerL = { x: offLx + tOuter * dirLx, y: offLy + tOuter * dirLy }
    const innerL = { x: offLx + tInner * dirLx, y: offLy + tInner * dirLy }
    const outerR = { x: offRx + tOuter * dirRx, y: offRy + tOuter * dirRy }
    const innerR = { x: offRx + tInner * dirRx, y: offRy + tInner * dirRy }

    const toSvg = (p: { x: number; y: number }) =>
      `${(cx + p.x).toFixed(3)},${(cy + p.y).toFixed(3)}`

    return `M ${toSvg(outerL)} L ${toSvg(outerR)} L ${toSvg(innerR)} L ${toSvg(innerL)} Z`
  }

  let hues = $derived(
    Array.from(PCCS_HUE_MAP.entries()).map(([num, data]) => {
      const angle = hueAngle(num)
      return {
        num,
        ...data,
        path: buildSwatchPath(num),
        label: {
          x: cx + labelRadius * Math.cos(angle),
          y: cy + labelRadius * Math.sin(angle)
        },
        textColor: isLightColor(data.color) ? "#222" : "#fff"
      }
    })
  )
</script>

<svg viewBox="0 0 {size} {size}" width={size} height={size} role="img" aria-label="PCCS色相環">
  {#each hues as hue (hue.num)}
    <path d={hue.path} fill={hue.color} />
  {/each}
  {#each hues as hue (hue.num)}
    <text class="symbol" x={hue.label.x} y={hue.label.y} font-size={14} fill={hue.textColor}>
      {hue.symbol}
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
