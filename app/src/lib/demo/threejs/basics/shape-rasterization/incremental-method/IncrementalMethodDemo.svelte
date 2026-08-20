<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createIncrementalMethodScene, type IncrementalMethodParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする。
  // incremental と direct は scene.ts が組み立てて書き戻す表示用の値なので、初期値は使われない
  const params: IncrementalMethodParams = {
    slope: 0.35,
    step: 4,
    incremental: "",
    direct: ""
  }
</script>

<ThreeDemoCanvas
  ariaLabel="画素の格子に引いた直線の上を、xを1ずつ進めながらyに傾きaを足していく図。1ステップごとに、x方向へ1、y方向へaだけ進む階段が伸び、求めたyが直線上の点として並ぶ（ホイールで拡大縮小）"
  createScene={createIncrementalMethodScene}
  {params}
  aspectRatio="16 / 9"
  camera={{ position: [0, 0, 4.0] }}
  orbit={{ enableRotate: false, minDistance: 2.5, maxDistance: 9 }}
  buildPane={(pane, p) => {
    pane.addBinding(p, "slope", { min: -0.6, max: 0.6, step: 0.01, label: "傾き a" })
    pane.addBinding(p, "step", { min: 0, max: 12, step: 1, label: "進めたステップ" })
    pane.addBinding(p, "incremental", { readonly: true, label: "増分法：前のy + a" })
    pane.addBinding(p, "direct", { readonly: true, label: "式：a × x + b" })
  }}
/>
