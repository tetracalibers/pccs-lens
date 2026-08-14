<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createSolidModelScene, type SolidModelParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする
  const params: SolidModelParams = { separation: 0.7 }
</script>

<ThreeDemoCanvas
  ariaLabel="一角を欠いた直方体の手前下の角を斜めに切り取り、欠片を離した3次元表示。切り口には中身の詰まった断面が現れる（ドラッグで回転）"
  createScene={createSolidModelScene}
  {params}
  aspectRatio="4 / 3"
  camera={{ position: [4.35, -0.2, 4.35] }}
  orbit={{ target: [0, -0.5, 0], enableZoom: false }}
  buildPane={(pane, p) => {
    pane.addBinding(p, "separation", { min: 0, max: 1.2, step: 0.01, label: "欠片を離す" })
  }}
/>
