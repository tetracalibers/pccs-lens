<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createPolarAndCartesianScene, type PolarAndCartesianParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする。
  // x・y は scene.ts が計算して書き戻す表示用の値なので、初期値は使われない
  const params: PolarAndCartesianParams = { r: 1.4, thetaDeg: 35, x: 0, y: 0 }
</script>

<ThreeDemoCanvas
  ariaLabel="平面上の1点を極座標と直交座標の両方で示した図。x軸とy軸、原点から点までの線分（長さr）、x軸からの角度θの扇形、x軸に沿う隣辺（r cosθ）とy軸に平行な対辺（r sinθ）でできた直角三角形"
  createScene={createPolarAndCartesianScene}
  {params}
  aspectRatio="3 / 2"
  camera={{ position: [0, 0, 7] }}
  orbit={false}
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
