<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createHyperbolicFunctionsScene, type HyperbolicFunctionsParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする。
  // t は正の側の途中から始めて、辿ってきた跡と「まだ辿っていない範囲」を両方残す。
  // cosh・sinh は scene.ts が計算して書き戻す表示用の値なので、初期値は使われない
  const params: HyperbolicFunctionsParams = {
    t: 1.1,
    cosh: "",
    sinh: ""
  }
</script>

<!-- 2 つの図を左右に並べるので、canvas は横長にする。
     camera.position は、両方の図が初期表示で収まる距離にする（回り込みは付けず正面から固定） -->
<ThreeDemoCanvas
  ariaLabel="左に双曲線関数のグラフ、右に双曲線を並べた図。グラフは横軸がtで、cosh tとsinh tの2本の曲線が描かれ、cosh tは値1より下へ来ない。右の双曲線では、その2つの値を座標にとった点が右側の枝の上を動く。tを動かすと、グラフ上の2つの値と双曲線上の点が連動して変わる（ホイールで拡大縮小）"
  createScene={createHyperbolicFunctionsScene}
  {params}
  aspectRatio="16 / 9"
  camera={{ position: [0.24, 0, 6.3] }}
  orbit={{ enableRotate: false, minDistance: 3.5, maxDistance: 12 }}
  buildPane={(pane, p) => {
    // t は負の側から正の側まで、双曲線の枝を端から端まで辿れる範囲にする
    pane.addBinding(p, "t", { min: -2, max: 2, step: 0.01, label: "t" })
    // 今の t に対する値。グラフの縦の位置と、双曲線上の点の座標の両方に対応する
    pane.addBinding(p, "cosh", { readonly: true, label: "cosh t" })
    pane.addBinding(p, "sinh", { readonly: true, label: "sinh t" })
  }}
/>
