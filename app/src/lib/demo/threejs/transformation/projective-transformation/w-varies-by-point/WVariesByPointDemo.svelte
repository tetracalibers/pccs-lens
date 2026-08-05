<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createWVariesByPointScene, type WVariesByPointParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする。
  // p・q はどちらも 0 でない値を初期値にして、w' が入力の位置で変わる状態から始める。
  // x・y は、格子の点と重ならない位置を初期値にする。
  // wAtPoint・wRange は scene.ts が計算して書き戻す表示用の値なので、初期値は使われない
  const params: WVariesByPointParams = {
    p: 0.4,
    q: 0.15,
    x: 0.55,
    y: -0.55,
    wAtPoint: "",
    wRange: ""
  }
</script>

<ThreeDemoCanvas
  ariaLabel="同次座標(x, y, w)のwを3本目の軸にとった3次元表示。w=1の平面に並ぶ入力点それぞれに3行3列の射影変換行列を掛け、変換後のw'を高さとする柱を立てている。最下行のp・qを動かすと柱の高さが入力の位置ごとに変わり、柱の先端が並ぶ面が傾く。p・qがどちらも0のときは柱の高さがすべて1になり、先端はw=1の平面に揃う（ドラッグで回転、ホイールで拡大縮小）"
  createScene={createWVariesByPointScene}
  {params}
  aspectRatio="3 / 2"
  camera={{ position: [4.4, 3.2, 5] }}
  orbit={{
    // 柱の足もと（w = 0）と先端の両方が視野に入るよう、注視点を中ほどの高さに置く
    target: [0, 0, 0.9],
    minDistance: 3.5,
    maxDistance: 14
  }}
  buildPane={(pane, values) => {
    // p・q を端まで振っても、格子のいちばん端の点の w' が 0 を下回らない範囲までにする
    pane.addBinding(values, "p", { min: -0.4, max: 0.4, step: 0.01, label: "p" })
    pane.addBinding(values, "q", { min: -0.4, max: 0.4, step: 0.01, label: "q" })
    // 注目する点は、格子を並べた正方形の中だけを動かせるようにする
    pane.addBinding(values, "x", { min: -1.1, max: 1.1, step: 0.01, label: "x（入力）" })
    pane.addBinding(values, "y", { min: -1.1, max: 1.1, step: 0.01, label: "y（入力）" })
    pane.addBinding(values, "wAtPoint", { readonly: true, label: "w'（この点）" })
    pane.addBinding(values, "wRange", { readonly: true, label: "w'（格子全体）" })
  }}
/>
