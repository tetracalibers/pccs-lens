<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createViewTransformScene, type ViewTransformParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする
  const params: ViewTransformParams = { azimuth: 25, elevation: 18, distance: 2.1, roll: 0 }
</script>

<ThreeDemoCanvas
  ariaLabel="ワールド座標系とカメラ座標系を左右に並べた3次元表示。同じ3体の物体とカメラが両方に置かれ、左ではカメラだけが動いて物体は動かず、右ではカメラが原点に固定されて場面全体が逆向きに動く（ドラッグで回転、ホイールで拡大縮小）"
  createScene={createViewTransformScene}
  {params}
  aspectRatio="16 / 10"
  camera={{ position: [1.2, 2.6, 7.2] }}
  orbit={{ target: [0, 0.3, 0], minDistance: 4, maxDistance: 22 }}
  buildPane={(pane, p) => {
    pane.addBinding(p, "azimuth", { min: -180, max: 180, step: 1, label: "カメラを横に回す（方位角）" })
    pane.addBinding(p, "elevation", { min: -25, max: 70, step: 1, label: "カメラを上下に回す（仰角）" })
    pane.addBinding(p, "distance", { min: 1.6, max: 2.4, step: 0.01, label: "距離" })
    pane.addBinding(p, "roll", { min: -60, max: 60, step: 1, label: "上方向の傾き" })
  }}
/>
