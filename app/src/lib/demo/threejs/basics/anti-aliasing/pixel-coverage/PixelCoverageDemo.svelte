<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createPixelCoverageScene, type PixelCoverageParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする
  const params: PixelCoverageParams = {
    slope: 0.45,
    thickness: 0.55,
    columns: 9,
    showValues: true,
    showOutline: true
  }
</script>

<ThreeDemoCanvas
  ariaLabel="画素の格子に斜めの帯を重ね、その帯が各画素をどれだけ覆っているか（寄与率）を、塗りの濃さと数値で示した図。図形の傾き・太さや画素数を変えると、各画素の寄与率が変わる（ホイールで拡大縮小）"
  createScene={createPixelCoverageScene}
  {params}
  aspectRatio="16 / 9"
  camera={{ position: [0, 0, 3.5] }}
  orbit={{ enableRotate: false, minDistance: 2, maxDistance: 8 }}
  buildPane={(pane, p) => {
    pane.addBinding(p, "slope", { min: -1, max: 1, step: 0.01, label: "図形の傾き" })
    pane.addBinding(p, "thickness", { min: 0.2, max: 1, step: 0.01, label: "図形の太さ" })
    pane.addBinding(p, "columns", { min: 6, max: 12, step: 3, label: "横の画素数" })
    pane.addBinding(p, "showValues", { label: "寄与率を数値で表示" })
    pane.addBinding(p, "showOutline", { label: "連続な図形の輪郭を表示" })
  }}
/>
