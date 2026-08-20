<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createScanlineFillScene, type ScanlineFillParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする。
  // crossingCount と spans は scene.ts が組み立てて書き戻す表示用の値なので、初期値は使われない
  const params: ScanlineFillParams = {
    row: 7,
    crossingCount: "",
    spans: ""
  }
</script>

<ThreeDemoCanvas
  ariaLabel="山が2つ並んだポリゴンの輪郭を重ねた画素格子に、走査線を1行ずつ下へずらしながら、走査線と輪郭の交点をもとに内側の区間を塗っていく図。交点は必ず偶数個できて、奇数番目の交点から次の偶数番目の交点までが塗られる（ホイールで拡大縮小）"
  createScene={createScanlineFillScene}
  {params}
  aspectRatio="16 / 9"
  camera={{ position: [0, 0, 4.2] }}
  orbit={{ enableRotate: false, minDistance: 2.5, maxDistance: 9 }}
  buildPane={(pane, p) => {
    pane.addBinding(p, "row", { min: 0, max: 15, step: 1, label: "走査線の行" })
    pane.addBinding(p, "crossingCount", { readonly: true, label: "交点の個数" })
    pane.addBinding(p, "spans", { readonly: true, label: "塗る区間" })
  }}
/>
