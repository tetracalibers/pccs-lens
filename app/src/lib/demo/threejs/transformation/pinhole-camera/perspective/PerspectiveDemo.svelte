<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createPerspectiveScene, type PerspectiveParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする
  const params: PerspectiveParams = { distance: 3 }
</script>

<ThreeDemoCanvas
  ariaLabel="同じ大きさの立方体4つを奥行き方向に並べ、投影面に写る像の大きさを比べる3次元表示。光学中心に近い立方体ほど像が大きくなる（ドラッグで回転）"
  createScene={createPerspectiveScene}
  {params}
  aspectRatio="16 / 10"
  camera={{ position: [7, 4, 8.5] }}
  orbit={{ target: [0.2, 0, 3], enableZoom: false }}
  buildPane={(pane, p) => {
    pane.addBinding(p, "distance", {
      min: 2.5,
      max: 4,
      step: 0.01,
      label: "手前の立方体までの距離"
    })
  }}
/>
