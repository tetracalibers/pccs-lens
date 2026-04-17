<script lang="ts">
  import { PCCS_HEX_MAP } from "$lib/data/pccs"

  // ===== SVG dimensions =====
  const SIZE = 600
  const CX = SIZE / 2
  const CY = SIZE / 2
  const R = 200

  // ===== ラベルフォントサイズ =====
  const FONT_SIZE_PRIMARY = 36 // 原色ラベル（R・G・B・C・M・Y）
  const FONT_SIZE_NORMAL = 18 // 通常ラベル（10:YG など）

  // ===== ラベル配置半径 =====
  const CHAR_WIDTH_MONO = FONT_SIZE_NORMAL * 0.6 // 等幅フォントの字幅（px）
  const CHAR_HEIGHT_MONO = FONT_SIZE_NORMAL * 0.7 // 等幅フォントの字高（px）
  const LABEL_GAP_MIN = 16 // テキスト内端と円周の最小余白（px）
  const LABEL_R_PRIMARY = R + 52 // 大ラベル（G・C・M・Y・R・B）

  // ===== 矢印端点の内側縮め量 =====
  const ARROW_INSET = 2

  // ===== 型定義 =====
  interface HueLabel {
    index: number
    text: string
    isPrimary: boolean
    radius: number
  }

  interface ExtraPrimary {
    index: number
    text: string
  }

  interface ComplementPair {
    aIndex: number
    bIndex: number
    id: string
  }

  // ===== 角度・座標計算 =====
  /** 12等分インデックス（0 = Y = 上、時計回り）→ SVG 角度（ラジアン） */
  const angleAt = (idx: number): number => -Math.PI / 2 + (idx / 12) * 2 * Math.PI

  const pointAt = (idx: number, radius: number): { x: number; y: number } => {
    const a = angleAt(idx)
    return { x: CX + radius * Math.cos(a), y: CY + radius * Math.sin(a) }
  }

  /**
   * 通常ラベルの配置半径を計算する。
   * テキスト矩形が円に向かって投影する長さ（halfW×|cosα| + halfH×|sinα|）を円半径に加算し、
   * どの角度でもテキスト内端と円周の距離が LABEL_GAP_MIN になるよう設計する。
   * ─ 3/9時方向：halfW がそのまま投影 → 短いラベルほど小さい半径
   * ─ 12/6時方向：halfH のみ投影 → 最小半径
   */
  const normalLabelRadius = (text: string, idx: number): number => {
    const angle = angleAt(idx)
    const halfW = (text.length * CHAR_WIDTH_MONO) / 2
    const halfH = CHAR_HEIGHT_MONO / 2
    const projection = halfW * Math.abs(Math.cos(angle)) + halfH * Math.abs(Math.sin(angle))
    return R + projection + LABEL_GAP_MIN
  }

  // ===== 原色カラーマップ（PCCS_HEX_MAP から取得）=====
  const PRIMARY_COLORS: Record<string, string> = {
    R: PCCS_HEX_MAP.get("v3")!,
    G: PCCS_HEX_MAP.get("v12")!,
    B: PCCS_HEX_MAP.get("v19")!,
    C: PCCS_HEX_MAP.get("v16")!,
    M: PCCS_HEX_MAP.get("v24")!,
    Y: PCCS_HEX_MAP.get("v8")!
  }

  /** 原色ラベルの塗り色。原色でない場合は本文色にフォールバック */
  const primaryColor = (text: string): string => PRIMARY_COLORS[text] ?? "var(--color-body)"

  // ===== ラベル縁取り =====
  const COLOR_LABEL_OUTLINE = "#fff"
  const OUTLINE_STROKE_WIDTH = 3

  // ===== 12等分ラベル（Y を 0 番として時計回り）=====
  const PRIMARY_SET = new Set(["Y", "G", "C", "M"])

  const HUES = ["Y", "10:YG", "G", "14:BG", "C", "18:B", "20:V", "22:P", "M", "2:R", "4:rO", "6:yO"]
  const hueLabels: HueLabel[] = HUES.map((text, index) => ({
    index,
    text,
    isPrimary: PRIMARY_SET.has(text),
    radius: PRIMARY_SET.has(text) ? LABEL_R_PRIMARY : normalLabelRadius(text, index)
  }))

  // ===== 追加原色ラベル（R・B：12等分点の中間に配置）=====
  const extraPrimaries: ExtraPrimary[] = [
    { index: 5.5, text: "B" }, // 18:B と 20:V の中間
    { index: 10.5, text: "R" } // 4:rO と 6:yO の中間
  ]

  // ===== 三角形頂点インデックス =====
  const RGB_INDICES = [10.5, 2, 5.5] // R, G, B（点線）
  const CMY_INDICES = [4, 8, 0] // C, M, Y（実線）

  const toPolygonPoints = (indices: number[]): string =>
    indices
      .map((i) => {
        const p = pointAt(i, R)
        return `${p.x},${p.y}`
      })
      .join(" ")

  /**
   * 矢印の端点を弦方向に ARROW_INSET 分だけ縮めて返す。
   * 放射方向ではなく弦方向に縮めることで、延長線が必ず円上の頂点を指す。
   */
  const arrowEndpoints = (
    aIdx: number,
    bIdx: number
  ): { a: { x: number; y: number }; b: { x: number; y: number } } => {
    const a = pointAt(aIdx, R)
    const b = pointAt(bIdx, R)
    const dx = b.x - a.x
    const dy = b.y - a.y
    const len = Math.hypot(dx, dy)
    const ux = dx / len
    const uy = dy / len
    return {
      a: { x: a.x + ux * ARROW_INSET, y: a.y + uy * ARROW_INSET },
      b: { x: b.x - ux * ARROW_INSET, y: b.y - uy * ARROW_INSET }
    }
  }

  // ===== 補色ペア（両方向矢印）=====
  const complementPairs: ComplementPair[] = [
    { aIndex: 10.5, bIndex: 4, id: "rc" }, // R ↔ C
    { aIndex: 2, bIndex: 8, id: "gm" }, // G ↔ M
    { aIndex: 5.5, bIndex: 0, id: "by" } // B ↔ Y
  ]
</script>

<div class="wrapper">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {SIZE} {SIZE}">
    <defs>
      <!-- 両方向矢印マーカー（SpectrumRange.svelte と統一） -->
      <marker id="pcw-aL" markerWidth="9" markerHeight="10" refX="1" refY="5" orient="auto">
        <polyline
          points="8,1 1,5 8,9"
          fill="var(--canvas-pen-pink)"
          stroke="var(--canvas-pen-pink)"
          stroke-width="1"
          stroke-linejoin="round"
        />
      </marker>
      <marker id="pcw-aR" markerWidth="9" markerHeight="10" refX="8" refY="5" orient="auto">
        <polyline
          points="1,1 8,5 1,9"
          fill="var(--canvas-pen-pink)"
          stroke="var(--canvas-pen-pink)"
          stroke-width="1"
          stroke-linejoin="round"
        />
      </marker>
    </defs>

    <!-- 円 -->
    <circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--canvas-pen-gray)" stroke-width="2" />

    <!-- CMY 三角形（実線）-->
    <polygon
      points={toPolygonPoints(CMY_INDICES)}
      fill="none"
      stroke="var(--canvas-pen-gray)"
      stroke-width="1.5"
    />

    <!-- RGB 三角形（点線）-->
    <polygon
      points={toPolygonPoints(RGB_INDICES)}
      fill="none"
      stroke="var(--canvas-pen-gray)"
      stroke-width="1.5"
      stroke-dasharray="6 4"
    />

    <!-- 補色ペア両方向矢印 -->
    {#each complementPairs as pair (pair.id)}
      {@const { a, b } = arrowEndpoints(pair.aIndex, pair.bIndex)}
      <line
        x1={a.x}
        y1={a.y}
        x2={b.x}
        y2={b.y}
        stroke="var(--canvas-pen-pink)"
        stroke-width="2"
        marker-start="url(#pcw-aL)"
        marker-end="url(#pcw-aR)"
      />
    {/each}

    <!-- 12等分ラベル -->
    {#each hueLabels as lbl (lbl.index)}
      {@const p = pointAt(lbl.index, lbl.radius)}
      {#if lbl.isPrimary}
        <!-- 縁取り -->
        <text
          x={p.x}
          y={p.y}
          text-anchor="middle"
          dominant-baseline="central"
          font-size={FONT_SIZE_PRIMARY}
          font-weight="bold"
          font-family="var(--font-classic)"
          fill="none"
          stroke={COLOR_LABEL_OUTLINE}
          stroke-width={OUTLINE_STROKE_WIDTH}
          stroke-linejoin="round"
        >
          {lbl.text}
        </text>
        <!-- 塗り -->
        <text
          x={p.x}
          y={p.y}
          text-anchor="middle"
          dominant-baseline="central"
          font-size={FONT_SIZE_PRIMARY}
          font-weight="bold"
          font-family="var(--font-classic)"
          fill={primaryColor(lbl.text)}
        >
          {lbl.text}
        </text>
      {:else}
        <text
          x={p.x}
          y={p.y}
          text-anchor="middle"
          dominant-baseline="central"
          font-size={FONT_SIZE_NORMAL}
          font-family="var(--font-mono)"
          fill="var(--canvas-pen-gray)"
        >
          {lbl.text}
        </text>
      {/if}
    {/each}

    <!-- 追加原色ラベル（R・B）-->
    {#each extraPrimaries as prim (prim.text)}
      {@const p = pointAt(prim.index, LABEL_R_PRIMARY)}
      <!-- 縁取り -->
      <text
        x={p.x}
        y={p.y}
        text-anchor="middle"
        dominant-baseline="central"
        font-size={FONT_SIZE_PRIMARY}
        font-weight="bold"
        font-family="var(--font-classic)"
        fill="none"
        stroke={COLOR_LABEL_OUTLINE}
        stroke-width={OUTLINE_STROKE_WIDTH}
        stroke-linejoin="round"
      >
        {prim.text}
      </text>
      <!-- 塗り -->
      <text
        x={p.x}
        y={p.y}
        text-anchor="middle"
        dominant-baseline="central"
        font-size={FONT_SIZE_PRIMARY}
        font-weight="bold"
        font-family="var(--font-classic)"
        fill={primaryColor(prim.text)}
      >
        {prim.text}
      </text>
    {/each}
  </svg>
</div>

<style>
  .wrapper {
    width: 100%;
  }

  .wrapper svg {
    display: block;
    width: 100%;
    height: auto;

    max-width: 400px;
    margin-inline: auto;
  }
</style>
