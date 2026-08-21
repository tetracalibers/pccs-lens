<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createPlanarGradientScene, type PlanarGradientParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする。
  // 角度は、方向グラデーションが斜めになる値から始める（軸に沿った向きだけではないことが分かる）
  const params: PlanarGradientParams = {
    angle: 30,
    showIsolines: false
  }
</script>

<!-- 3 枚を見比べる図なので、回り込みは付けずに正面から固定する（拡大縮小だけ残す） -->
<ThreeDemoCanvas
  ariaLabel="同じ線形補間を、位置から割合tを求める規則だけ変えて塗った3枚の画像。左は一方向に沿った直線距離、中央は中心からの距離、右は中心まわりの角度をtとしたもので、それぞれ帯状・同心円状・扇状のグラデーションになる（ホイールで拡大縮小）"
  createScene={createPlanarGradientScene}
  {params}
  aspectRatio="16 / 9"
  camera={{ position: [0, 0, 4.35] }}
  orbit={{ enableRotate: false, minDistance: 2.6, maxDistance: 9 }}
  buildPane={(pane, p) => {
    pane.addBinding(p, "angle", { min: 0, max: 360, step: 1, label: "向きの角度" })
    pane.addBinding(p, "showIsolines", { label: "tの等値線" })
  }}
/>
