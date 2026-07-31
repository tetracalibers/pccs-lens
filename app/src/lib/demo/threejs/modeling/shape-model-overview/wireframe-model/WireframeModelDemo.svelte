<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createWireframeModelScene, type WireframeModelParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする
  const params: WireframeModelParams = { showVertices: true }
</script>

<ThreeDemoCanvas
  ariaLabel="一角を欠いた直方体を頂点と稜線だけで表したワイヤフレームモデルの3次元表示（ドラッグで回転）"
  createScene={createWireframeModelScene}
  {params}
  aspectRatio="4 / 3"
  camera={{ position: [2.8, 2.2, 3.6] }}
  buildPane={(pane, p) => {
    pane.addBinding(p, "showVertices", { label: "頂点を表示" })
  }}
/>
