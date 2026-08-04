<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createPerspectiveNormalizationScene, type PerspectiveNormalizationParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする
  const params: PerspectiveNormalizationParams = { progress: 0, flatten: 0 }
</script>

<ThreeDemoCanvas
  ariaLabel="透視投影のビューボリューム（四角錐台）が正規化ビューボリューム（直方体）へ変換されるようすの3次元表示。空間に置いた同じ大きさの立方体が5つあり、変換前の位置には暗い線が残る。変換が進むと立方体は奥にあるものほど中心へ寄って小さくなり、さらに奥行きを落とすとビューボリュームの前面に潰れて像になる（ドラッグで回転、ホイールで拡大縮小）"
  createScene={createPerspectiveNormalizationScene}
  {params}
  aspectRatio="16 / 10"
  camera={{ position: [6.8, 3, 4.2] }}
  orbit={{ target: [0, 0, 1.8], minDistance: 3, maxDistance: 20 }}
  buildPane={(pane, p) => {
    pane.addBinding(p, "progress", { min: 0, max: 1, step: 0.01, label: "正規化への変換" })
    pane.addBinding(p, "flatten", { min: 0, max: 1, step: 0.01, label: "奥行きを落とす" })
  }}
/>
