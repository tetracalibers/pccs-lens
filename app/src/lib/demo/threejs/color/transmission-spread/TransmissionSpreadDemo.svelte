<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createTransmissionSpreadScene, type TransmissionSpreadParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする。
  // 拡散は 0（正透過）から始める。記事が正透過 → 拡散透過の順で説明しているため。
  // transmissionType は scene.ts が計算して書き戻す表示用の値
  const params: TransmissionSpreadParams = {
    incidenceDeg: 30,
    diffusion: 0,
    transmissionType: "正透過"
  }
</script>

<ThreeDemoCanvas
  ariaLabel="垂直に立てた板ガラスの複数の点に平行に届いた光が、板の中を通って反対側へ出ていく様子の3次元表示。拡散の度合いを上げると、出ていく光が向きのそろった状態からさまざまな方向へ散らばった状態へ変わる（ドラッグで回転）"
  createScene={createTransmissionSpreadScene}
  {params}
  aspectRatio="4 / 3"
  camera={{ position: [3.2, 2, 4.8] }}
  orbit={{ target: [0, 0.2, 0], enableZoom: false }}
  buildPane={(pane, p) => {
    pane.addBinding(p, "incidenceDeg", {
      min: 20,
      max: 60,
      step: 1,
      format: (value: number) => `${value.toFixed(0)}°`,
      label: "入射角"
    })
    pane.addBinding(p, "diffusion", { min: 0, max: 1, step: 0.01, label: "拡散の度合い" })
    pane.addBinding(p, "transmissionType", { readonly: true, label: "透過の種類" })
  }}
/>
