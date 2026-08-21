<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createBresenhamSelectionScene, type BresenhamSelectionParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする。
  // judgement と update は scene.ts が組み立てて書き戻す表示用の値なので、初期値は使われない
  const params: BresenhamSelectionParams = {
    dy: 3,
    step: 2,
    judgement: "",
    update: ""
  }
</script>

<ThreeDemoCanvas
  ariaLabel="画素の格子に引いた線分を、判定変数dの符号だけで塗り進める図。次の列の候補として、いまと同じ行の画素と1つ下の行の画素が枠で示され、dが正なら下の行、0以下なら同じ行が選ばれる（ホイールで拡大縮小）"
  createScene={createBresenhamSelectionScene}
  {params}
  aspectRatio="16 / 9"
  camera={{ position: [0, 0, 4.0] }}
  orbit={{ enableRotate: false, minDistance: 2.5, maxDistance: 9 }}
  buildPane={(pane, p) => {
    pane.addBinding(p, "dy", { min: 0, max: 5, step: 1, label: "線分の高さ dy（dx = 8）" })
    pane.addBinding(p, "step", { min: 0, max: 8, step: 1, label: "進めたステップ" })
    pane.addBinding(p, "judgement", { readonly: true, label: "判定変数d" })
    pane.addBinding(p, "update", { readonly: true, label: "dの更新" })
  }}
/>
