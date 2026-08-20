<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createAlphaBlendingScene, type AlphaBlendingParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする。
  // blended は scene.ts が組み立てて書き戻す表示用の値なので、初期値は使われない
  const params: AlphaBlendingParams = {
    alpha: 0.7,
    figure: { r: 255, g: 200, b: 87 },
    background: { r: 61, g: 111, b: 168 },
    blended: ""
  }
</script>

<ThreeDemoCanvas
  ariaLabel="寄与率αだけ図形が覆った画素と、その寄与率で図形の色と背景の色を混ぜて塗った画素を並べた図。下の帯には、αを0から1まで動かしたときの画素の色が並ぶ（ホイールで拡大縮小）"
  createScene={createAlphaBlendingScene}
  {params}
  aspectRatio="16 / 9"
  camera={{ position: [0, 0, 3.7] }}
  orbit={{ enableRotate: false, minDistance: 2.5, maxDistance: 8 }}
  buildPane={(pane, p) => {
    pane.addBinding(p, "alpha", { min: 0, max: 1, step: 0.01, label: "寄与率 α" })
    pane.addBinding(p, "figure", { label: "図形の色 C_fg" })
    pane.addBinding(p, "background", { label: "背景の色 C_bg" })
    pane.addBinding(p, "blended", { readonly: true, label: "画素の色 C" })
  }}
/>
