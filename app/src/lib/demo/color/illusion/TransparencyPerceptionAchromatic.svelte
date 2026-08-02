<script lang="ts">
  // ===== レイアウト =====
  const UNIT = 68 // 1マス（＝帯の幅）
  const N = 5 // 縦横それぞれ5分割し、2・4列目に帯を置く
  const SIZE = UNIT * N // 図全体の一辺
  const BW = UNIT // 帯の幅
  const POS_A = UNIT * 1 // 1本目の帯の開始位置
  const POS_B = UNIT * 3 // 2本目の帯の開始位置

  const WIDTH = SIZE
  const HEIGHT = SIZE

  // ===== 色（無彩色の帯）=====
  const COL_BG = "#ffffff" // 白背景
  const COL_V1 = "#444444" // 縦帯1：暗いグレイ
  const COL_V2 = "#a0a0a0" // 縦帯2：明るいグレイ
  const COL_H1 = "#787878" // 横帯1：中間グレイ
  const COL_H2 = "#c8c8c8" // 横帯2：ごく明るいグレイ

  // 前面の帯（横帯）を半透明フィルムとして背面の帯（縦帯）に重ねた色を作る。
  // blend-modeは使わず、重なり色をJS側で算出する
  const ALPHA_FRONT = 0.6 // 前面の帯の不透明度（1で完全に前面色、0で背面色）
  const hexToRgb = (hex: string): [number, number, number] =>
    [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number]
  const overlay = (front: string, back: string): string => {
    const f = hexToRgb(front)
    const b = hexToRgb(back)
    const comp = (i: number) =>
      Math.round(ALPHA_FRONT * f[i] + (1 - ALPHA_FRONT) * b[i])
        .toString(16)
        .padStart(2, "0")
    return `#${comp(0)}${comp(1)}${comp(2)}`
  }

  // ===== 帯の定義 =====
  const vBands = [
    { x: POS_A, fill: COL_V1 },
    { x: POS_B, fill: COL_V2 }
  ]
  const hBands = [
    { y: POS_A, fill: COL_H1 },
    { y: POS_B, fill: COL_H2 }
  ]

  // ===== 重なり領域（縦帯∩横帯）=====
  // 軸に平行な帯どうしの交差はそのまま矩形になる。その矩形を重なり色で塗る。
  // 横帯を前面、縦帯を背面として重ねるので、横帯が透けた膜のように見える
  const crossings = vBands.flatMap((v) =>
    hBands.map((h) => ({ x: v.x, y: h.y, fill: overlay(h.fill, v.fill) }))
  )
</script>

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {WIDTH} {HEIGHT}">
  <rect x="0" y="0" width={WIDTH} height={HEIGHT} fill={COL_BG} />

  <!-- 縦帯・横帯はどちらも不透明の単色 -->
  {#each vBands as v, i (i)}
    <rect x={v.x} y="0" width={BW} height={HEIGHT} fill={v.fill} />
  {/each}
  {#each hBands as h, i (i)}
    <rect x="0" y={h.y} width={WIDTH} height={BW} fill={h.fill} />
  {/each}

  <!-- 重なり領域だけを別色で塗る（縦帯と横帯の交差＝矩形） -->
  {#each crossings as c, i (i)}
    <rect x={c.x} y={c.y} width={BW} height={BW} fill={c.fill} />
  {/each}
</svg>
