<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import {
    createNormalizationAfterTransformScene,
    type NormalizationAfterTransformParams
  } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする。
  // p・q はどちらも 0 でない値を初期値にして、4 隅の w' がすべて違う状態から始める。
  // t は 0（＝行列を掛けた直後）から始め、正規化は読者が進める。
  // wRange は scene.ts が計算して書き戻す表示用の値なので、初期値は使われない
  const params: NormalizationAfterTransformParams = {
    p: 0.4,
    q: 0.15,
    t: 0,
    wRange: ""
  }
</script>

<ThreeDemoCanvas
  ariaLabel="同次座標(x, y, w)のwを3本目の軸にとった3次元表示。w=1の平面上の正方形の4隅に3行3列の射影変換行列を掛けると、最下行のp・qによって変換後のw'が隅ごとに変わり、4隅が平面から浮き上がる。正規化のスライダを進めると、各隅が原点を通る直線に沿ってw=1の平面へ降り、遠近感のある四辺形になる（ドラッグで回転、ホイールで拡大縮小）"
  createScene={createNormalizationAfterTransformScene}
  {params}
  aspectRatio="3 / 2"
  camera={{ position: [4.2, 3, 5.2] }}
  orbit={{
    // 原点と w = 1 の平面の両方が視野に入るよう、注視点を両者の中間に置く
    target: [0, 0, 0.8],
    minDistance: 3.5,
    maxDistance: 14
  }}
  buildPane={(pane, values) => {
    // p・q を大きく振ると w' が 0 に近い隅ができて正規化後の点が平面の外へ飛ぶので、
    // 両方を端まで振っても 4 隅が平面に収まる範囲までにする
    pane.addBinding(values, "p", { min: -0.5, max: 0.5, step: 0.01, label: "p" })
    pane.addBinding(values, "q", { min: -0.5, max: 0.5, step: 0.01, label: "q" })
    pane.addBinding(values, "t", { min: 0, max: 1, step: 0.01, label: "t（正規化）" })
    pane.addBinding(values, "wRange", { readonly: true, label: "w'（隅ごと）" })
  }}
/>
