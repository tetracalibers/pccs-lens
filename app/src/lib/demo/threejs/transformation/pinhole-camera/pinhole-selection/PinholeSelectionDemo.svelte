<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createPinholeSelectionScene, type PinholeSelectionParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする
  const params: PinholeSelectionParams = { pointX: -0.35, pointY: 0.6 }
</script>

<ThreeDemoCanvas
  ariaLabel="ピンホールカメラの3次元表示。被写体上の1点から四方八方へ出た光のうち、ほとんどは穴のある面に当たって止まり、穴へまっすぐ向かった光だけが通り抜けて、箱の奥の面に1つの明るい点を作る（ドラッグで回転）"
  createScene={createPinholeSelectionScene}
  {params}
  aspectRatio="16 / 10"
  camera={{ position: [4.5, 3, 6.5] }}
  orbit={{ target: [0, 0, 0.7], enableZoom: false }}
  buildPane={(pane, p) => {
    pane.addBinding(p, "pointX", { min: -0.85, max: 0.85, step: 0.01, label: "光を出す点（横）" })
    pane.addBinding(p, "pointY", { min: -1, max: 1, step: 0.01, label: "光を出す点（縦）" })
  }}
/>
