<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createCrossingParityScene, type CrossingParityParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする。
  // side・passed・sequence は scene.ts が組み立てて書き戻す表示用の値なので、初期値は使われない
  const params: CrossingParityParams = {
    row: 7,
    traveled: 12.5,
    side: "",
    passed: "",
    sequence: ""
  }
</script>

<ThreeDemoCanvas
  ariaLabel="山が2つ並んだポリゴンの輪郭に走査線を1本引き、その走査線を左端から右へたどっていく図。輪郭との交点には左から順に番号が振られ、たどってきた区間は交点を境に領域の外側と内側で塗り分けられる。右端までたどると外側に戻り、越えた交点は偶数個になる（ホイールで拡大縮小）"
  createScene={createCrossingParityScene}
  {params}
  aspectRatio="16 / 9"
  camera={{ position: [0, 0, 4.4] }}
  orbit={{ enableRotate: false, minDistance: 2.5, maxDistance: 9 }}
  buildPane={(pane, p) => {
    pane.addBinding(p, "row", { min: 0, max: 15, step: 1, label: "走査線の位置" })
    pane.addBinding(p, "traveled", { min: 0, max: 24, step: 0.1, label: "たどった位置" })
    pane.addBinding(p, "side", { readonly: true, label: "今の位置" })
    pane.addBinding(p, "passed", { readonly: true, label: "越えた交点" })
    pane.addBinding(p, "sequence", { readonly: true, label: "たどった順" })
  }}
/>
