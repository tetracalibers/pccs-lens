<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createConnectivitySpreadScene, type ConnectivitySpreadParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする。
  // reached4 と reached8 は scene.ts が組み立てて書き戻す表示用の値なので、初期値は使われない
  const params: ConnectivitySpreadParams = {
    steps: 2,
    reached4: "",
    reached8: ""
  }
</script>

<ThreeDemoCanvas
  ariaLabel="画素の格子を2つ並べ、中心の画素から近傍をたどって届く画素を塗った図。左は4連結（上下左右の4方向を隣とみなす）、右は8連結（斜め4方向を加えた8方向を隣とみなす）で、たどった歩数を増やすと4連結は菱形、8連結は正方形に広がる（ホイールで拡大縮小）"
  createScene={createConnectivitySpreadScene}
  {params}
  aspectRatio="16 / 9"
  camera={{ position: [0, 0, 4.3] }}
  orbit={{ enableRotate: false, minDistance: 2.5, maxDistance: 9 }}
  buildPane={(pane, p) => {
    pane.addBinding(p, "steps", { min: 0, max: 3, step: 1, label: "たどった歩数" })
    pane.addBinding(p, "reached4", { readonly: true, label: "4連結で届いた画素" })
    pane.addBinding(p, "reached8", { readonly: true, label: "8連結で届いた画素" })
  }}
/>
