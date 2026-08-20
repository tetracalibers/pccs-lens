<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createSupersamplingScene, type SupersamplingParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする。
  // estimate と exact は scene.ts が組み立てて書き戻す表示用の値なので、初期値は使われない
  const params: SupersamplingParams = {
    samples: 3,
    angle: 60,
    offset: 0.12,
    estimate: "",
    exact: ""
  }
</script>

<ThreeDemoCanvas
  ariaLabel="図形の輪郭がかかった画素を格子状の区画に分け、各区画の中心で色を取ったサンプリング点と、その色を平均して塗った画素を並べた図。点の数を増やすと、図形側の点の割合が実際の面積比に近づく（ホイールで拡大縮小）"
  createScene={createSupersamplingScene}
  {params}
  aspectRatio="16 / 9"
  camera={{ position: [0, 0, 3.0] }}
  orbit={{ enableRotate: false, minDistance: 2, maxDistance: 7 }}
  buildPane={(pane, p) => {
    pane.addBinding(p, "samples", { min: 1, max: 6, step: 1, label: "サンプリング点（縦横）" })
    pane.addBinding(p, "angle", { min: 0, max: 180, step: 1, label: "輪郭の向き" })
    pane.addBinding(p, "offset", { min: -0.5, max: 0.5, step: 0.01, label: "輪郭の位置" })
    pane.addBinding(p, "estimate", { readonly: true, label: "点による推定" })
    pane.addBinding(p, "exact", { readonly: true, label: "面積比（寄与率）" })
  }}
/>
