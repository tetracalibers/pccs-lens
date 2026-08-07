<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createFocalLengthScene, type FocalLengthParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする。
  // magnification は scene.ts が計算して書き戻す表示用の値なので、初期値は使われない
  const params: FocalLengthParams = { focalLength: 1.2, showRays: true, magnification: 0 }
</script>

<ThreeDemoCanvas
  ariaLabel="ピンホールカメラモデルの焦点距離の3次元表示。被写体から光学中心へ向かう光線の束はそのままに、投影面が光軸に沿って動き、像が焦点距離に比例して拡大縮小する（ドラッグで回転）"
  createScene={createFocalLengthScene}
  {params}
  aspectRatio="16 / 10"
  camera={{ position: [4.5, 3, 6.5] }}
  orbit={{ target: [0, 0, 1.5], enableZoom: false }}
  buildPane={(pane, p) => {
    pane.addBinding(p, "focalLength", { min: 0.4, max: 2.4, step: 0.01, label: "焦点距離" })
    pane.addBinding(p, "showRays", { label: "光線を表示" })
    pane.addBinding(p, "magnification", {
      readonly: true,
      format: (value: number) => `×${value.toFixed(2)}`,
      label: "像の倍率"
    })
  }}
/>
