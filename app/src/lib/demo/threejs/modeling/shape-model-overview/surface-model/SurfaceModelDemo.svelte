<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createSurfaceModelScene, type SurfaceModelParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする
  const params: SurfaceModelParams = { openFace: true }
</script>

<ThreeDemoCanvas
  ariaLabel="一角を欠いた直方体を面の集まりとして表したサーフェスモデルの3次元表示（ドラッグで回転）"
  createScene={createSurfaceModelScene}
  {params}
  aspectRatio="4 / 3"
  camera={{ position: [2.8, 2.8, 3.6] }}
  orbit={{ enableZoom: false }}
  buildPane={(pane, p) => {
    pane.addBinding(p, "openFace", { label: "上の面を外す" })
  }}
/>
