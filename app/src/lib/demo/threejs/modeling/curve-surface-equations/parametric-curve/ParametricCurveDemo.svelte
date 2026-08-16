<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createParametricCurveScene, type ParametricCurveParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする。
  // t の上限は、初期表示が閉じた円ではなく弧になる値にして、範囲を区切れることが先に目に入るようにする。
  // endPoint は scene.ts が計算して書き戻す表示用の値なので、初期値は使われない
  const params: ParametricCurveParams = {
    curve: "circle",
    tStart: 0,
    tEnd: Math.PI * 1.5,
    endPoint: ""
  }
</script>

<!-- camera.position は、らせんに切り替えて z 方向へ伸びても上端が見切れない距離にする -->
<ThreeDemoCanvas
  ariaLabel="パラメータ形式で表した曲線の3次元表示。パラメータtを等間隔に刻んで代入した点が並んでおり、tの下限と上限を動かすと描かれる範囲が変わる。曲線を円かららせんに切り替えると、xとyはそのままでzがtに比例して増え、点の並びがxy平面から離れて上へ伸びていく（ドラッグで回転、ホイールで拡大縮小）"
  createScene={createParametricCurveScene}
  {params}
  aspectRatio="3 / 2"
  camera={{ position: [3.2, 2.4, 3.9] }}
  orbit={{
    // 円が乗る xy 平面と、らせんが伸びる先の両方が視野に入る高さを注視点にする
    target: [0, 0.6, 0],
    minDistance: 3,
    maxDistance: 14
  }}
  buildPane={(pane, p) => {
    pane.addBinding(p, "curve", {
      options: { 円: "circle", らせん: "helix" },
      label: "曲線"
    })
    // 一周ぶん（0 から 2π まで）動かせる範囲にする
    pane.addBinding(p, "tStart", { min: 0, max: Math.PI * 2, step: 0.01, label: "tの下限" })
    pane.addBinding(p, "tEnd", { min: 0, max: Math.PI * 2, step: 0.01, label: "tの上限" })
    pane.addBinding(p, "endPoint", { readonly: true, label: "tの上限での点" })
  }}
/>
