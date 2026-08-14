<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createSolidModelScene, type SolidModelParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする
  const params: SolidModelParams = { cut: false }
</script>

<ThreeDemoCanvas
  ariaLabel="一角を欠いた直方体の3次元表示。手前下の角を斜めに切ると、欠片が離れ、本体と欠片の両方に中身の詰まった断面が現れる（ドラッグで回転）"
  createScene={createSolidModelScene}
  {params}
  aspectRatio="4 / 3"
  camera={{ position: [4.35, -0.2, 4.35] }}
  orbit={{ target: [0, -0.5, 0], enableZoom: false }}
  buildPane={(pane, p) => {
    pane.addBinding(p, "cut", { label: "切断する" })
  }}
/>
