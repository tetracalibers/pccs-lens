<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createPolarAndCartesianScene, type PolarAndCartesianParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする。
  // x・y は scene.ts が計算して書き戻す表示用の値なので、初期値は使われない
  const params: PolarAndCartesianParams = { r: 1.4, thetaDeg: 35, x: 0, y: 0 }
</script>

<ThreeDemoCanvas
  ariaLabel="平面上の1点を極座標と直交座標の両方で示した図。x軸とy軸、原点から点までの線分（長さr）、x軸からの角度θの扇形、x軸に沿う隣辺（r cosθ）とy軸に平行な対辺（r sinθ）でできた直角三角形（ホイールで拡大縮小。寄るほど直角三角形が視野の中心へ来る）"
  createScene={createPolarAndCartesianScene}
  {params}
  aspectRatio="3 / 2"
  camera={{ position: [0, 0, 7] }}
  orbit={{
    // 平面の図なので回転・パンはさせない（正面から見た向きが崩れる／図を見失う）。
    // カメラは xy 平面の正面（+z）に置いてあるので、ズームは図が正面のまま拡大縮小する動きになる。
    // 近づく側は三角形を詳しく見るために初期位置の 1/3 弱まで、
    // 遠ざかる側は図全体に余白がつく 2 倍までを上限にする
    enableRotate: false,
    minDistance: 2.5,
    maxDistance: 14,
    // 寄り先は直角三角形の中心（原点と点の中間）。原点を中心に拡大すると、
    // 三角形は画面の隅に寄って辺やラベルが枠から外れてしまうため、
    // 寄るほど視野の中心を三角形へ移す。θ を動かせば寄り先もその三角形へ付いていく
    zoomFocus: () => [params.x / 2, params.y / 2, 0]
  }}
  buildPane={(pane, p) => {
    pane.addBinding(p, "r", { min: 0.4, max: 1.8, step: 0.01, label: "r（原点からの距離）" })
    pane.addBinding(p, "thetaDeg", {
      min: 0,
      max: 360,
      step: 1,
      format: (value: number) => `${value.toFixed(0)}°`,
      label: "θ（x軸から測った角度）"
    })
    pane.addBinding(p, "x", {
      readonly: true,
      format: (value: number) => value.toFixed(2),
      label: "x = r cosθ"
    })
    pane.addBinding(p, "y", {
      readonly: true,
      format: (value: number) => value.toFixed(2),
      label: "y = r sinθ"
    })
  }}
/>
