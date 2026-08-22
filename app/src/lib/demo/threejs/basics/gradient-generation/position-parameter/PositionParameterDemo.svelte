<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createPositionParameterScene, type PositionParameterParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする。
  // pixelCount・ratio・color は scene.ts が組み立てて書き戻す表示用の値なので、初期値は使われない
  const params: PositionParameterParams = {
    index: 4,
    pixelCount: "",
    ratio: "",
    color: ""
  }
</script>

<!-- 帯を正面から見る図なので、回り込みは付けずに固定する（拡大縮小だけ残す） -->
<ThreeDemoCanvas
  ariaLabel="横一列に並べた12個の画素で描いたグラデーションの帯。左端の画素が色A、右端の画素が色Bで、注目している画素をその位置で枠で囲み、その画素の色を示す。注目画素を左右に動かすと、始点からの割合tに応じてその色が変わる（ホイールで拡大縮小）"
  createScene={createPositionParameterScene}
  {params}
  aspectRatio="16 / 9"
  camera={{ position: [0, 0, 2.8] }}
  orbit={{ enableRotate: false, minDistance: 1.6, maxDistance: 7 }}
  buildPane={(pane, p) => {
    // 上限は scene.ts の画素数 N に合わせる（右端の画素の番号は N - 1）
    pane.addBinding(p, "index", { min: 0, max: 11, step: 1, label: "注目画素 i" })
    pane.addBinding(p, "pixelCount", { readonly: true, label: "画素数 N" })
    pane.addBinding(p, "ratio", { readonly: true, label: "割合 t" })
    pane.addBinding(p, "color", { readonly: true, label: "画素の色" })
  }}
/>
