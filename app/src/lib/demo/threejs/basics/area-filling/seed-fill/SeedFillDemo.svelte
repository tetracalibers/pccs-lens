<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createSeedFillScene, type SeedFillParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする。
  // filled は scene.ts が組み立てて書き戻す表示用の値なので、初期値は使われない
  const params: SeedFillParams = {
    steps: 4,
    criterion: "boundary",
    connectivity: 4,
    filled: ""
  }
</script>

<ThreeDemoCanvas
  ariaLabel="画素の格子に描いた閉領域で、シード点から隣の画素へ塗りを広げていく図。左の部屋と右の部屋は角どうしが斜めに触れているだけで繋がっており、判定の基準と連結性を切り替えると塗り終わる範囲が変わる（ホイールで拡大縮小）"
  createScene={createSeedFillScene}
  {params}
  aspectRatio="16 / 9"
  camera={{ position: [0, 0, 4.2] }}
  orbit={{ enableRotate: false, minDistance: 2.5, maxDistance: 9 }}
  buildPane={(pane, p) => {
    pane.addBinding(p, "steps", { min: 0, max: 12, step: 1, label: "波及の歩数" })
    pane.addBinding(p, "criterion", {
      label: "判定の基準",
      options: { 境界色基準: "boundary", 内部色基準: "interior" }
    })
    pane.addBinding(p, "connectivity", {
      label: "連結性",
      options: { "4連結": 4, "8連結": 8 }
    })
    pane.addBinding(p, "filled", { readonly: true, label: "塗った画素" })
  }}
/>
