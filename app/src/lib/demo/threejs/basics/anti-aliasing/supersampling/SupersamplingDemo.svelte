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
  ariaLabel="1画素を拡大して区画とサンプリング点を示した図、その点の色を平均して塗った画素、そして同じ手順で全画素を塗った画像を、左から順に並べた図。平均した色の画素からは、それを埋め戻した画像の中の1画素へ引き出し線が伸びる。点の数を増やすと図形側の点の割合が実際の面積比に近づき、画像の輪郭のギザギザが目立たなくなる（ホイールで拡大縮小）"
  createScene={createSupersamplingScene}
  {params}
  aspectRatio="2 / 1"
  camera={{ position: [0, 0, 3.5] }}
  orbit={{ enableRotate: false, minDistance: 2.5, maxDistance: 8 }}
  buildPane={(pane, p) => {
    pane.addBinding(p, "samples", { min: 1, max: 6, step: 1, label: "サンプリング点（縦横）" })
    pane.addBinding(p, "angle", { min: 0, max: 180, step: 1, label: "輪郭の向き" })
    pane.addBinding(p, "offset", { min: -0.5, max: 0.5, step: 0.01, label: "輪郭の位置" })
    pane.addBinding(p, "estimate", { readonly: true, label: "点による推定" })
    pane.addBinding(p, "exact", { readonly: true, label: "面積比（寄与率）" })
  }}
/>
