<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createPositionParameterScene, type PositionParameterParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする。
  // 画素の境目が見え、かつ色の変化も追える 12 画素から始める。
  // ratio と color は scene.ts が計算して書き戻す表示用の値なので、初期値は使われない
  const params: PositionParameterParams = {
    pixelCount: 12,
    index: 4,
    ratio: "",
    color: ""
  }
</script>

<!-- 帯を正面から見る図なので、回り込みは付けずに固定する（拡大縮小だけ残す） -->
<ThreeDemoCanvas
  ariaLabel="横一列に並べたN個の画素で描いたグラデーションの帯。左端の画素が色A、右端の画素が色Bで、注目している画素の色を帯の上に拡大して示す。上下には同じ色の並びが薄く重なり、この帯が画像の1行であることを表す。画素数を増やすと隣り合う画素の色の差が小さくなる（ホイールで拡大縮小）"
  createScene={createPositionParameterScene}
  {params}
  aspectRatio="16 / 9"
  camera={{ position: [0, 0, 3.55] }}
  orbit={{ enableRotate: false, minDistance: 2.2, maxDistance: 7 }}
  buildPane={(pane, p) => {
    // 上限は scene.ts があらかじめ作っておく画素の数に合わせる
    pane.addBinding(p, "pixelCount", { min: 3, max: 20, step: 1, label: "画素数 N" })
    pane.addBinding(p, "index", { min: 0, max: 19, step: 1, label: "注目画素 i" })
    pane.addBinding(p, "ratio", { readonly: true, label: "割合 t" })
    pane.addBinding(p, "color", { readonly: true, label: "画素の色" })
  }}
/>
