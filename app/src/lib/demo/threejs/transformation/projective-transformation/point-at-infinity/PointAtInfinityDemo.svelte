<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createPointAtInfinityScene, type PointAtInfinityParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする。
  // p・q は、交点が w = 1 平面の内側に落ちる大きさから始める。
  // 向きは軸と重ならない角度にして、無限遠点の直線が x 軸と見分けられるようにする。
  // transformedW・intersection は scene.ts が計算して書き戻す表示用の値なので、初期値は使われない
  const params: PointAtInfinityParams = {
    p: 0.7,
    q: 0.3,
    angle: 25,
    transformedW: "",
    intersection: ""
  }
</script>

<ThreeDemoCanvas
  ariaLabel="同次座標(x, y, w)のwを3本目の軸にとった3次元表示。wが0の無限遠点(x, y, 0)が並ぶ直線はw=0の平面に寝ていて、w=1の平面と平行なので交わらない。最下行のp・qを0でない値にすると、変換後の(x', y', w')が並ぶ直線が傾いてw=1の平面上の1点で交わり、平面上の平行な2直線の像もその点を通る（ドラッグで回転、ホイールで拡大縮小）"
  createScene={createPointAtInfinityScene}
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
    // p・q をどちらも 0 にするとアフィン変換になり、無限遠点は無限遠点のまま写る
    pane.addBinding(values, "p", { min: 0, max: 1, step: 0.01, label: "p" })
    pane.addBinding(values, "q", { min: -0.5, max: 0.5, step: 0.01, label: "q" })
    // 向きを 180 度回した無限遠点は同じ点を指すので、半回転ぶんで全方向をたどれる
    pane.addBinding(values, "angle", { min: 0, max: 180, step: 1, label: "無限遠点の向き" })
    pane.addBinding(values, "transformedW", { readonly: true, label: "w'" })
    pane.addBinding(values, "intersection", { readonly: true, label: "平面との交点" })
  }}
/>
