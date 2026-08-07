<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createUpDirectionScene, type UpDirectionParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする
  const params: UpDirectionParams = { roll: 0 }
</script>

<ThreeDemoCanvas
  ariaLabel="左に3体の物体とカメラを置いた場面、右にそのカメラに写る像の枠を並べた3次元表示。カメラの視点の位置と視線の向きは固定され、上方向だけが視線を軸に回る。上方向を傾けると、枠の中の像がその分だけ傾いて写る（ドラッグで回転、ホイールで拡大縮小）"
  createScene={createUpDirectionScene}
  {params}
  aspectRatio="16 / 10"
  camera={{ position: [0.6, 2.4, 7.8] }}
  orbit={{ target: [0, 0.8, 0.2], minDistance: 4, maxDistance: 20 }}
  buildPane={(pane, p) => {
    pane.addBinding(p, "roll", { min: -180, max: 180, step: 1, label: "上方向の傾き" })
  }}
/>
