<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createOrthographicScene, type OrthographicParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする
  const params: OrthographicParams = { depth: 1, showRays: true }
</script>

<ThreeDemoCanvas
  ariaLabel="断面が正方形の立体と、その向こう側に置かれた投影面。立体の各頂点から投影面へ垂直に下ろした投射線と、投影面に写った像が描かれる。像は正方形で、奥行き方向の稜線が潰れた隅に点が付く。奥行きを変えても像は変わらない（ドラッグで回転、ホイールで拡大縮小）"
  createScene={createOrthographicScene}
  {params}
  aspectRatio="16 / 10"
  camera={{ position: [3, 2.1, 4.1] }}
  orbit={{
    // このデモだけ回転を残す。投影面の正面へ回すと、形状の手前の面と像が重なって見える
    minDistance: 3,
    maxDistance: 12
  }}
  buildPane={(pane, p) => {
    pane.addBinding(p, "depth", {
      min: 0.2,
      max: 2,
      step: 0.05,
      format: (value: number) => value.toFixed(2),
      label: "奥行き"
    })
    pane.addBinding(p, "showRays", { label: "投射線を表示" })
  }}
/>
