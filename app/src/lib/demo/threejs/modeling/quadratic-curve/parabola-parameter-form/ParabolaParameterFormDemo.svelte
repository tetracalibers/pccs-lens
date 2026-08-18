<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createParabolaParameterFormScene, type ParabolaParameterFormParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする。
  // t は正の側の途中から始めて、頂点を通ってきた跡と「まだ描かれていない範囲」を両方残す。
  // x・y は scene.ts が計算して書き戻す表示用の値なので、初期値は使われない
  const params: ParabolaParameterFormParams = {
    p: 0.6,
    t: 0.9,
    x: "",
    y: ""
  }
</script>

<!-- xy 平面をそのまま見る図なので、回り込みは付けずに正面から固定する（拡大縮小だけ残す）。
     camera.position は、軸を伸ばした範囲が初期表示で収まる距離にする -->
<ThreeDemoCanvas
  ariaLabel="放物線のパラメータ表示をxy平面上に描いた図。x = pt²、y = 2pt で表される放物線が原点を頂点として右向きに開き、tを等間隔に刻んだ点が並んでいる。tを動かすと、点が下側の枝から頂点を通って上側の枝へ進み、そこまでの跡が色の付いた線で描かれる（ホイールで拡大縮小）"
  createScene={createParabolaParameterFormScene}
  {params}
  aspectRatio="16 / 9"
  camera={{ position: [0.3, 0, 7.6] }}
  orbit={{ enableRotate: false, minDistance: 4, maxDistance: 14 }}
  buildPane={(pane, p) => {
    // t は負の側から正の側まで、頂点をまたいで動かせるようにする
    pane.addBinding(p, "t", { min: -1.6, max: 1.6, step: 0.01, label: "t" })
    pane.addBinding(p, "p", { min: 0.3, max: 0.9, step: 0.05, label: "p" })
    // 今の t に対する座標。式のどちらから来た値かが分かるようラベルに式を添える
    pane.addBinding(p, "x", { readonly: true, label: "x = pt²" })
    pane.addBinding(p, "y", { readonly: true, label: "y = 2pt" })
  }}
/>
