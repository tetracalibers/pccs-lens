<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createErrorIncrementScene, type ErrorIncrementParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする。
  // error と judgement は scene.ts が組み立てて書き戻す表示用の値なので、初期値は使われない
  const params: ErrorIncrementParams = {
    slope: 0.35,
    step: 2,
    error: "",
    judgement: ""
  }
</script>

<ThreeDemoCanvas
  ariaLabel="画素の格子に引いた直線を、誤差と0.5の大小だけで塗り進める図。1つ前に塗った画素の中心から直線までの隔たりが誤差として示され、それが画素の境目（0.5）を越えた列では、塗る画素が1行ぶん進む（ホイールで拡大縮小）"
  createScene={createErrorIncrementScene}
  {params}
  aspectRatio="16 / 9"
  camera={{ position: [0, 0, 4.0] }}
  orbit={{ enableRotate: false, minDistance: 2.5, maxDistance: 9 }}
  buildPane={(pane, p) => {
    pane.addBinding(p, "slope", { min: 0, max: 0.6, step: 0.01, label: "傾き a" })
    pane.addBinding(p, "step", { min: 0, max: 8, step: 1, label: "進めたステップ" })
    pane.addBinding(p, "error", { readonly: true, label: "更新後の誤差 e" })
    pane.addBinding(p, "judgement", { readonly: true, label: "判定：e + a と 0.5" })
  }}
/>
