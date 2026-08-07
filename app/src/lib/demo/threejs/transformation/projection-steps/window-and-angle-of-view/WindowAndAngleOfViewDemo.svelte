<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createWindowAndAngleOfViewScene, type WindowAndAngleOfViewParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする。
  // angleOfView は scene.ts が計算して書き戻す表示用の値なので、初期値は使われない
  const params: WindowAndAngleOfViewParams = { windowSize: 1.6, planeDistance: 2, angleOfView: 0 }
</script>

<ThreeDemoCanvas
  ariaLabel="ウィンドウと画角の3次元表示。視点・視線・投影面上のウィンドウと、視点を頂点としてウィンドウの枠を通って奥へ伸びる四角錐、ウィンドウの左右の辺へ引いた2本の線がつくる角（ドラッグで回転、ホイールで拡大縮小）"
  createScene={createWindowAndAngleOfViewScene}
  {params}
  aspectRatio="16 / 10"
  camera={{ position: [5.5, 5, 4] }}
  orbit={{ target: [0, 0, 2.8], minDistance: 4, maxDistance: 20 }}
  buildPane={(pane, p) => {
    pane.addBinding(p, "windowSize", {
      min: 0.6,
      max: 2.6,
      step: 0.01,
      label: "ウィンドウの大きさ"
    })
    pane.addBinding(p, "planeDistance", {
      min: 0.6,
      max: 4,
      step: 0.01,
      label: "投影面までの距離"
    })
    pane.addBinding(p, "angleOfView", {
      readonly: true,
      format: (value: number) => `${value.toFixed(1)}°`,
      label: "画角"
    })
  }}
/>
