<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createSurfaceModelScene, type SurfaceModelParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする
  const params: SurfaceModelParams = { separation: 0.7 }
</script>

<ThreeDemoCanvas
  ariaLabel="一角を欠いた直方体を面の集まりとして表したサーフェスモデルの3次元表示。手前下の角を斜めに切り取った欠片を離すと、中が空洞であることが見える（ドラッグで回転）"
  createScene={createSurfaceModelScene}
  {params}
  aspectRatio="4 / 3"
  camera={{ position: [4.35, 0.3, 4.35] }}
  orbit={{ enableZoom: false }}
  buildPane={(pane, p) => {
    pane.addBinding(p, "separation", { min: 0, max: 1.2, step: 0.01, label: "欠片を離す" })
  }}
/>
