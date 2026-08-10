<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createRefractionAtSurfaceScene, type RefractionAtSurfaceParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする。
  // 斜めに入った状態から始める（垂直に入れると曲がらず、屈折の図として読めないため）。
  // refractionDeg は scene.ts が計算して書き戻す表示用の値
  const params: RefractionAtSurfaceParams = { incidenceDeg: 45, refractionDeg: "32°" }
</script>

<ThreeDemoCanvas
  ariaLabel="空気から水へ斜めに入った光が水面で向きを変える様子の3次元表示。法線から測った入射角と屈折角、および屈折せずに直進した場合の道すじが示される（ドラッグで回転）"
  createScene={createRefractionAtSurfaceScene}
  {params}
  aspectRatio="4 / 3"
  camera={{ position: [0.8, 0.75, 4.1] }}
  orbit={{
    target: [0, 0.05, 0],
    enableZoom: false,
    minPolarAngle: Math.PI * 0.2,
    maxPolarAngle: Math.PI * 0.5,
    minAzimuthAngle: -Math.PI * 0.22,
    maxAzimuthAngle: Math.PI * 0.22
  }}
  buildPane={(pane, p) => {
    pane.addBinding(p, "incidenceDeg", {
      min: 0,
      max: 80,
      step: 1,
      format: (value: number) => `${value.toFixed(0)}°`,
      label: "入射角"
    })
    pane.addBinding(p, "refractionDeg", { readonly: true, label: "屈折角" })
  }}
/>
