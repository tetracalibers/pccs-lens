<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createBrightnessTerrainScene, type BrightnessTerrainParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする
  const params: BrightnessTerrainParams = {
    sampleCount: 16,
    quantize: true,
    levelCount: 4,
    showSurface: true
  }
</script>

<ThreeDemoCanvas
  ariaLabel="画像のデジタル化の3次元表示。左にもとのアナログ画像をグレースケールの絵として置き、右にはそれを標本化・量子化した結果を、画素ごとの柱の高さと灰色の濃さで表した図を並べている（ドラッグで回転、ホイールで拡大縮小）"
  createScene={createBrightnessTerrainScene}
  {params}
  aspectRatio="16 / 9"
  camera={{ position: [1.4, 3.1, 4.4] }}
  orbit={{ target: [0, 0.25, 0], minDistance: 3, maxDistance: 18 }}
  buildPane={(pane, p) => {
    pane.addBinding(p, "sampleCount", { min: 2, max: 32, step: 1, label: "格子の分割数（1辺）" })
    pane.addBinding(p, "quantize", { label: "量子化する" })
    pane.addBinding(p, "levelCount", { min: 2, max: 16, step: 1, label: "明るさの段階数" })
    pane.addBinding(p, "showSurface", { label: "連続的な明るさを重ねる" })
  }}
/>
