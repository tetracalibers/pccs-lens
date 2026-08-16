<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createConicSectionScene, type ConicSectionParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする。
  // 傾きの初期値は、円でも放物線でもない「はっきりした楕円」が最初に目に入る値にする。
  // generatrixTilt と curveName は scene.ts が書き戻す表示用の値なので、初期値は使われない
  const params: ConicSectionParams = {
    tilt: 35,
    generatrixTilt: "",
    curveName: ""
  }
</script>

<!-- 円錐面は上下に長いので、縦長の canvas にして、上下の端まで収まる距離にカメラを置く -->
<ThreeDemoCanvas
  ariaLabel="頂点を挟んで上下に広がる円錐面を、1枚の平面で切ったところの3次元表示。平面の傾きを動かすと切り口の曲線が変わり、母線より緩い傾きでは閉じた楕円、母線と同じ傾きでは放物線、それより急な傾きでは上下の円錐にまたがる2本の枝の双曲線になる（ドラッグで回転、ホイールで拡大縮小）"
  createScene={createConicSectionScene}
  {params}
  aspectRatio="4 / 5"
  camera={{ position: [1.7, 1.5, 7.2] }}
  orbit={{ minDistance: 5, maxDistance: 18 }}
  buildPane={(pane, p) => {
    // 上限は、双曲線の 2 本の枝が十分に開いて見えるところまで
    pane.addBinding(p, "tilt", { min: 0, max: 80, step: 1, label: "平面の傾き（度）" })
    pane.addBinding(p, "generatrixTilt", { readonly: true, label: "母線の傾き（度）" })
    pane.addBinding(p, "curveName", { readonly: true, label: "切り口" })
  }}
/>
