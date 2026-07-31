<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createSolidModelScene, type SolidModelParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする
  const params: SolidModelParams = { model: "solid", cutY: 1 }
</script>

<ThreeDemoCanvas
  ariaLabel="一角を欠いた直方体を水平面で切ったときの断面の3次元表示。サーフェスモデルとソリッドモデルを切り替えられる（ドラッグで回転）"
  createScene={createSolidModelScene}
  {params}
  aspectRatio="4 / 3"
  camera={{ position: [2.8, 2.8, 3.6] }}
  orbit={{ enableZoom: false }}
  buildPane={(pane, p) => {
    pane.addBinding(p, "model", {
      label: "モデル",
      options: { サーフェスモデル: "surface", ソリッドモデル: "solid" }
    })
    pane.addBinding(p, "cutY", { min: -0.9, max: 1, step: 0.01, label: "切る高さ" })
  }}
/>
