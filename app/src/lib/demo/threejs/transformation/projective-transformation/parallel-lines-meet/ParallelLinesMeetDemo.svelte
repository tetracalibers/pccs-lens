<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createParallelLinesMeetScene, type ParallelLinesMeetParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする。
  // 初期値は、2 つの消点がどちらも図に収まる値にする。
  // 消点の座標は scene.ts が計算して書き戻す表示用の値なので、初期値は使われない
  const params: ParallelLinesMeetParams = {
    p: 0.35,
    q: 0.3,
    horizontalVanishing: "",
    verticalVanishing: ""
  }
</script>

<ThreeDemoCanvas
  ariaLabel="変換前は等間隔の格子が入った正方形に、3行3列の射影変換行列を掛けた結果を正面から見た平面の表示。最下行のp・qを動かすと、等間隔だった格子が片側へ詰まり、変換前は平行だった横線の束・縦線の束が、それぞれ1つの消点へ集まる。2つの消点を通る直線（無限遠直線の像）も引かれる（ホイールで拡大縮小、回転はしない）"
  createScene={createParallelLinesMeetScene}
  {params}
  aspectRatio="3 / 2"
  camera={{ position: [0.7, 0.9, 7] }}
  orbit={{
    // 平面の図なので回転させない。2 つの消点が右上に出るので、注視点をそちらへ寄せる
    target: [0.7, 0.9, 0],
    enableRotate: false,
    minDistance: 3,
    maxDistance: 14
  }}
  buildPane={(pane, values) => {
    // p・q を 0 にすると、その向きの束は平行のまま（アフィン変換と同じ）になり、
    // 大きくするほど消点が近づく。どちらも 0 以上にして、2 つの消点が図に収まるようにする
    pane.addBinding(values, "p", { min: 0, max: 0.4, step: 0.01, label: "p" })
    pane.addBinding(values, "q", { min: 0, max: 0.4, step: 0.01, label: "q" })
    pane.addBinding(values, "horizontalVanishing", { readonly: true, label: "横線の消点" })
    pane.addBinding(values, "verticalVanishing", { readonly: true, label: "縦線の消点" })
  }}
/>
