<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import {
    createParametricSurfaceMappingScene,
    type ParametricSurfaceMappingParams
  } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする。
  // u・v は、強調する 2 本の線が領域に引いた線と重ならない位置から始める。
  // point は scene.ts が計算して書き戻す表示用の値なので、初期値は使われない
  const params: ParametricSurfaceMappingParams = {
    u: 0.28,
    v: 0.62,
    point: ""
  }
</script>

<!-- camera.position は、左右に並べた 2 つの図が初期表示で両端まで収まる距離にする -->
<ThreeDemoCanvas
  ariaLabel="パラメトリック曲面の対応の3次元表示。左はuとvが張る平面上の正方形の領域で、等間隔の線が引かれている。右はその領域を写し取った空間中の曲面で、同じ本数の線が曲がった線として乗っている。u・vを動かすと、左で選んだ点と縦横の線、右でそれに対応する点と2本の曲線が同時に動く（ドラッグで回転、ホイールで拡大縮小）"
  createScene={createParametricSurfaceMappingScene}
  {params}
  aspectRatio="2 / 1"
  camera={{ position: [0, 1.4, 6.6] }}
  orbit={{
    minDistance: 4,
    maxDistance: 18
  }}
  buildPane={(pane, p) => {
    pane.addBinding(p, "u", { min: 0, max: 1, step: 0.01, label: "u" })
    pane.addBinding(p, "v", { min: 0, max: 1, step: 0.01, label: "v" })
    pane.addBinding(p, "point", { readonly: true, label: "対応する曲面上の点" })
  }}
/>
