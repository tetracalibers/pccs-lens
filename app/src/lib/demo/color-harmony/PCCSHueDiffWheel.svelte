<script lang="ts">
  import { PCCS_HUE_MAP } from "$lib/data/pccs"
  import { isLightColor } from "$lib/color/utils"

  interface Props {
    /** 基準となる色相の番号（1〜24） */
    baseHue?: number
    /** 色相環の外側の円の半径（px） */
    radius?: number
    /** 台形スウォッチの高さ（外周から内周までの距離, px） */
    swatchHeight?: number
    /** 色相スウォッチ選択時のコールバック */
    onSelectHue?: (hueNumber: number) => void
  }

  let { baseHue = 8, radius = 220, swatchHeight = 55, onSelectHue }: Props = $props()

  let selectedHue = $state<number | null>(null)

  function handleSelectHue(num: number) {
    selectedHue = num
    onSelectHue?.(num)
  }

  const HUE_COUNT = 24
  const ANGLE_PER_HUE = (2 * Math.PI) / HUE_COUNT
  const HALF_ANGLE = ANGLE_PER_HUE / 2
  const TOP_HUE_NUM = 8
  // SVG座標系における「真上」の角度
  const TOP_ANGLE = -Math.PI / 2

  // 矢印マーカーの描画サイズ（markerHeight 相当, px）。markerWidth は 9:10 の比率で算出
  const ARROW_SIZE = 12

  // 直線A〜Eの、基準色相からのハーフステップオフセット（隙間の位置）
  const RADIAL_LINE_OFFSETS = [0.5, 1.5, 3.5, 7.5, 10.5]

  // 各色相差範囲とその中心オフセット（基準色相からのステップ数）とラベル
  // 各範囲は基準色相の左右に対称に現れるが、0 と「11–12」は片側のみ
  const DIFF_RANGES: { label: string; offsets: number[] }[] = [
    { label: "同一", offsets: [0] },
    { label: "隣接", offsets: [-1, 1] },
    { label: "類似", offsets: [-2.5, 2.5] },
    { label: "中差", offsets: [-5.5, 5.5] },
    { label: "対照", offsets: [-9, 9] },
    { label: "補色", offsets: [12] }
  ]

  let R = $derived(radius)
  let r = $derived(Math.max(1, R - swatchHeight))
  // 色スウォッチ同士の隙間（外側・内側ともに同じ距離）
  let gap = $derived(Math.max(2, R * 0.018))

  // 外側レイヤーの半径
  let diffNumberRadius = $derived(R + 22)
  let rangeLabelRadius = $derived(R + 52)
  let arcRadius = $derived(R + 84)
  // 円弧（矢印）とラベルの間の余白。ラベルは円弧の外側に沿って描画される
  const ARC_LABEL_GAP = 20
  // 下半分の円弧では textPath が反時計回りになり文字のアセンダーが円弧側を向くため、
  // その分だけテキストパス半径を外側にオフセットして見かけの隙間を揃える補正値
  const ARC_LABEL_FONT_HEIGHT = 10
  // 隣り合う円弧の矢印先端どうしの間隔（px）。
  // 各弧は両端を ARROW_GAP / 2 px 分だけ内側に縮めることで実現する
  const ARROW_GAP = 8
  // 放射状直線の外端
  let lineOuterRadius = $derived(arcRadius)

  let padding = $derived(32)
  let outerExtent = $derived(arcRadius + ARC_LABEL_GAP + ARC_LABEL_FONT_HEIGHT + padding)
  let size = $derived(outerExtent * 2)
  let cx = $derived(size / 2)
  let cy = $derived(size / 2)

  let labelRadius = $derived(
    (gap / 2) * Math.sin(HALF_ANGLE) +
      ((Math.sqrt(Math.max(0, R * R - (gap / 2) ** 2)) +
        Math.sqrt(Math.max(0, r * r - (gap / 2) ** 2))) /
        2) *
        Math.cos(HALF_ANGLE)
  )

  function hueAngle(num: number): number {
    // num=8 を真上、時計回りに num が増加
    return TOP_ANGLE + (num - TOP_HUE_NUM) * ANGLE_PER_HUE
  }

  /** 色相番号 num から基準色相までの色相差（0〜12） */
  function hueDiff(num: number): number {
    const d = (((num - baseHue) % HUE_COUNT) + HUE_COUNT) % HUE_COUNT
    return d <= 12 ? d : HUE_COUNT - d
  }

  function polarToCartesian(angle: number, rad: number) {
    return { x: cx + rad * Math.cos(angle), y: cy + rad * Math.sin(angle) }
  }

  /**
   * 色スウォッチの4頂点を計算。
   * 隣り合うスウォッチの境界線（gap の中心線）に平行で、gap/2 だけ内側に
   * オフセットした2本の直線を左右の辺とすることで、外側・内側どちらの
   * 辺同士の間隔も等しく gap になる台形を構築する。
   */
  function buildSwatchPath(num: number): string {
    const thetaC = hueAngle(num)
    const phiL = thetaC - HALF_ANGLE
    const phiR = thetaC + HALF_ANGLE

    const offLx = (gap / 2) * -Math.sin(phiL)
    const offLy = (gap / 2) * Math.cos(phiL)
    const dirLx = Math.cos(phiL)
    const dirLy = Math.sin(phiL)

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

  function buildArcPath(startAngle: number, endAngle: number, rad: number): string {
    const span = endAngle - startAngle
    const largeArc = Math.abs(span) > Math.PI ? 1 : 0
    const s = polarToCartesian(startAngle, rad)
    const e = polarToCartesian(endAngle, rad)
    return `M ${s.x.toFixed(3)} ${s.y.toFixed(3)} A ${rad} ${rad} 0 ${largeArc} 1 ${e.x.toFixed(3)} ${e.y.toFixed(3)}`
  }

  /**
   * 上向きに読めるテキストパスを構築する。
   * 円弧の中間点が上半分にあれば時計回り、下半分にあれば反時計回りに描くことで、
   * textPath 上の文字が常に正しい向きで並ぶ。
   *
   * 下半分の反時計回りパスでは文字のアセンダーが中心（円弧）側を向くため、
   * ARC_LABEL_FONT_HEIGHT 分だけ半径を大きくして見かけの隙間を揃える。
   */
  function buildTextArcPath(startAngle: number, endAngle: number): string {
    const midAngle = (startAngle + endAngle) / 2
    const span = Math.abs(endAngle - startAngle)
    const largeArc = span > Math.PI ? 1 : 0
    const upper = Math.sin(midAngle) < 0
    const rad = arcRadius + ARC_LABEL_GAP + (upper ? 0 : ARC_LABEL_FONT_HEIGHT)
    if (upper) {
      const s = polarToCartesian(startAngle, rad)
      const e = polarToCartesian(endAngle, rad)
      return `M ${s.x.toFixed(3)} ${s.y.toFixed(3)} A ${rad} ${rad} 0 ${largeArc} 1 ${e.x.toFixed(3)} ${e.y.toFixed(3)}`
    } else {
      const s = polarToCartesian(endAngle, rad)
      const e = polarToCartesian(startAngle, rad)
      return `M ${s.x.toFixed(3)} ${s.y.toFixed(3)} A ${rad} ${rad} 0 ${largeArc} 0 ${e.x.toFixed(3)} ${e.y.toFixed(3)}`
    }
  }

  // 色相スウォッチ
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

  // 放射状直線
  let radialLines = $derived(
    RADIAL_LINE_OFFSETS.flatMap((offset) =>
      [offset, -offset].map((signedOffset) => {
        const angle = hueAngle(baseHue) + signedOffset * ANGLE_PER_HUE
        const end = polarToCartesian(angle, lineOuterRadius)
        return { x1: cx, y1: cy, x2: end.x, y2: end.y, key: signedOffset }
      })
    )
  )

  // 色相差の数字ラベル（24個）
  let diffNumbers = $derived(
    Array.from(PCCS_HUE_MAP.keys()).map((num) => {
      const angle = hueAngle(num)
      const p = polarToCartesian(angle, diffNumberRadius)
      return { num, diff: hueDiff(num), x: p.x, y: p.y }
    })
  )

  // 色相差範囲ラベル（同一/隣接/類似/中差/対照/補色）
  let rangeLabels = $derived(
    DIFF_RANGES.flatMap(({ label, offsets }) =>
      offsets.map((offset) => {
        const angle = hueAngle(baseHue) + offset * ANGLE_PER_HUE
        const p = polarToCartesian(angle, rangeLabelRadius)
        return { label, x: p.x, y: p.y, key: `${label}-${offset}` }
      })
    )
  )

  // 基準色相の強調扇形（色スウォッチ・「0」・「同一」を包む）
  let baseSectorPath = $derived.by(() => {
    const angle = hueAngle(baseHue)
    // 「同一」/「隣接」の境界 = 放射状直線A（±0.5ステップ）の角度
    const startAngle = angle - HALF_ANGLE
    const endAngle = angle + HALF_ANGLE
    const outerR = arcRadius
    const s = polarToCartesian(startAngle, outerR)
    const e = polarToCartesian(endAngle, outerR)
    // 扇角 = ANGLE_PER_HUE (15°) なので largeArc は常に 0
    return `M ${cx.toFixed(3)} ${cy.toFixed(3)} L ${s.x.toFixed(3)} ${s.y.toFixed(3)} A ${outerR} ${outerR} 0 0 1 ${e.x.toFixed(3)} ${e.y.toFixed(3)} Z`
  })

  // 外周円弧
  // 直線Cどうし（±3.5）を基準側で結ぶ弧 → 共通性
  // 直線CとD（3.5 ↔ 7.5、-3.5 ↔ -7.5）→ やや違い（2本）
  // 直線Dどうし（7.5 → 12 → -7.5 = 16.5）を補色側で結ぶ弧 → 対照性
  let arcs = $derived.by(() => {
    const ba = hueAngle(baseHue)
    // 各弧の両端を半ギャップ分だけ内側に縮め、対向する矢印間に ARROW_GAP px の隙間を作る
    const gapAngle = ARROW_GAP / 2 / arcRadius
    const toArc = (startOffset: number, endOffset: number, label: string, key: string) => {
      const startAngle = ba + startOffset * ANGLE_PER_HUE + gapAngle
      const endAngle = ba + endOffset * ANGLE_PER_HUE - gapAngle
      return {
        key,
        label,
        arcPath: buildArcPath(startAngle, endAngle, arcRadius),
        textPath: buildTextArcPath(startAngle, endAngle),
        textPathId: `hue-diff-arc-text-${key}`
      }
    }
    return [
      toArc(-3.5, 3.5, "色相に共通性がある", "common"),
      toArc(3.5, 7.5, "色相にやや違いがある", "somewhat-r"),
      toArc(-7.5, -3.5, "色相にやや違いがある", "somewhat-l"),
      toArc(7.5, 16.5, "色相に対照性がある", "contrast")
    ]
  })
</script>

<svg viewBox="0 0 {size} {size}" width={size} height={size}>
  <defs>
    <!--
      矢印マーカー（SpectrumRange と同形状のオープンシェブロン）。
      orient="auto-start-reverse" により marker-start では 180° 反転して左向きになる。
      viewBox は 9×10 固定、ARROW_SIZE で実際の描画サイズを制御する。
    -->
    <marker
      id="hue-diff-arrow"
      viewBox="0 0 9 10"
      refX="8"
      refY="5"
      markerWidth={ARROW_SIZE * 0.9}
      markerHeight={ARROW_SIZE}
      orient="auto-start-reverse"
    >
      <polyline
        points="1,1 8,5 1,9"
        fill="none"
        stroke="var(--color-body)"
        stroke-width="1"
        stroke-linejoin="round"
      />
    </marker>
    {#each arcs as arc (arc.key)}
      <path id={arc.textPathId} d={arc.textPath} fill="none" />
    {/each}
  </defs>

  <!-- 基準色相の強調扇形（スウォッチより下に描画） -->
  <path class="base-sector" d={baseSectorPath} />

  <!-- 色相スウォッチ（インタラクティブ） -->
  {#each hues as hue (hue.num)}
    <g
      data-hue-swatch
      role="button"
      tabindex="0"
      aria-label="色相 {hue.num} {hue.symbol}"
      aria-pressed={selectedHue === hue.num}
      onclick={() => handleSelectHue(hue.num)}
      onkeydown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          handleSelectHue(hue.num)
        }
      }}
    >
      <!--
        キーボードフォーカスリング。スウォッチ fill より先に描画することで、
        stroke の外半分のみがスウォッチ間の隙間に露出して見える。
      -->
      <path class="hue-focus-ring" d={hue.path} fill="none" style="pointer-events: none;" />
      <path d={hue.path} fill={hue.color} />
      <text
        class="symbol"
        x={hue.label.x}
        y={hue.label.y}
        font-size={14}
        fill={hue.textColor}
        style="pointer-events: none; user-select: none;"
      >
        {hue.symbol}
      </text>
    </g>
  {/each}

  <!-- 選択中の色相のアウトライン（全スウォッチより上に描画） -->
  {#if selectedHue !== null}
    {@const sel = hues.find((h) => h.num === selectedHue)}
    {#if sel}
      <path class="selected-hue-outline" d={sel.path} fill="none" style="pointer-events: none;" />
    {/if}
  {/if}

  <!-- 放射状直線 -->
  {#each radialLines as line, i (i)}
    <line class="radial-line" x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} />
  {/each}

  <!-- 色相差の数字 -->
  {#each diffNumbers as d (d.num)}
    <text class="diff-number" class:diff-number--base={d.diff === 0} x={d.x} y={d.y} font-size={13}>
      {d.diff}
    </text>
  {/each}

  <!-- 色相差範囲ラベル -->
  {#each rangeLabels as r (r.key)}
    <text
      class="range-label"
      class:range-label--base={r.label === "同一"}
      x={r.x}
      y={r.y}
      font-size={14}
    >
      {r.label}
    </text>
  {/each}

  <!-- 外周円弧（双方向矢印）とラベル -->
  {#each arcs as arc (arc.key)}
    <path
      class="outer-arc"
      d={arc.arcPath}
      marker-start="url(#hue-diff-arrow)"
      marker-end="url(#hue-diff-arrow)"
    />
    <text class="arc-label" font-size={13}>
      <textPath href="#{arc.textPathId}" startOffset="50%" text-anchor="middle">
        {arc.label}
      </textPath>
    </text>
  {/each}
</svg>

<style>
  svg {
    display: block;
    max-width: 100%;
    height: auto;
  }

  [data-hue-swatch] {
    outline: none;
    cursor: pointer;
  }

  /*
   * キーボードフォーカスリング。ToneImageDiagram の focus-ring と同パターン。
   * スウォッチ fill より先に描画されているため、stroke の外半分のみ隙間に露出する。
   */
  [data-hue-swatch]:focus :global(.hue-focus-ring) {
    stroke: Highlight;
    stroke-width: 3;
  }

  /*
   * クリック選択中のアウトライン。全スウォッチより後に描画することで
   * 隣接スウォッチに隠れず確実に表示される。
   * stroke は外半分（隙間側）と内半分（スウォッチ上）の両方に現れる。
   */
  .selected-hue-outline {
    stroke: white;
    stroke-width: 2.5;
  }

  .symbol {
    font-family: var(--font-mono);
    text-anchor: middle;
    dominant-baseline: central;
  }

  .base-sector {
    fill: #d8d8d8;
  }

  .radial-line {
    stroke: var(--color-body);
    stroke-width: 1;
  }

  .diff-number {
    font-family: var(--font-mono);
    text-anchor: middle;
    dominant-baseline: central;
    fill: var(--color-body);
  }

  .range-label {
    text-anchor: middle;
    dominant-baseline: central;
    fill: var(--color-body);
  }

  .outer-arc {
    fill: none;
    stroke: var(--color-body);
    stroke-width: 1.25;
  }

  .arc-label {
    fill: var(--color-body);
  }

  .diff-number--base,
  .range-label--base {
    fill: var(--color-body--light);
  }
</style>
