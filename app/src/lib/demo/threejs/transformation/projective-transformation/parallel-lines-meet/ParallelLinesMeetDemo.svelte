<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createParallelLinesMeetScene, type ParallelLinesMeetParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする。
  // 初期値は同じ変換を3次元側から見せる正規化のデモと揃える。
  // intersection は scene.ts が計算して書き戻す表示用の値なので、初期値は使われない
  const params: ParallelLinesMeetParams = {
    p: 0.4,
    q: 0.15,
    intersection: ""
  }
</script>

<ThreeDemoCanvas
  ariaLabel="変換前は等間隔の格子が入った正方形に、3行3列の射影変換行列を掛けた結果を正面から見た平面の表示。最下行のp・qを動かすと、等間隔だった格子が片側へ詰まり、変換前は平行だった上下2辺を延長すると1点で交わる（ホイールで拡大縮小、回転はしない）"
  createScene={createParallelLinesMeetScene}
  {params}
  aspectRatio="3 / 2"
  camera={{ position: [0.5, 0, 7] }}
  orbit={{
    // 平面の図なので回転させない。交点が右側に出るので、注視点を少し右へ寄せる
    target: [0.5, 0, 0],
    enableRotate: false,
    minDistance: 3,
    maxDistance: 14
  }}
  buildPane={(pane, values) => {
    // p を 0 にすると 2 辺は平行のまま（アフィン変換と同じ）になり、
    // 大きくするほど交点が近づく。p・q を両方端まで振っても w' は正のままにする
    pane.addBinding(values, "p", { min: 0, max: 0.5, step: 0.01, label: "p" })
    pane.addBinding(values, "q", { min: -0.2, max: 0.2, step: 0.01, label: "q" })
    pane.addBinding(values, "intersection", { readonly: true, label: "2辺の交点" })
  }}
/>
