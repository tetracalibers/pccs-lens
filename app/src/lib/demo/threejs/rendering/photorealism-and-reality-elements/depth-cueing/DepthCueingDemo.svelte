<script lang="ts">
  import type { CameraOptions } from "$lib/demo/threejs/_shared/mount"
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createDepthCueingScene, type DepthCueingParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする
  const params: DepthCueingParams = { strength: 1.0 }

  // 左右に離して置いた立体は、画角が広いほど視点から見た角度が開き、画面の端ほど台形に歪む。
  // 引いた位置から狭い画角で写して、左右の歪み方の差を抑える
  const CAMERA: CameraOptions = { fov: 22, position: [0, 3.05, 13.4] }
</script>

<ThreeDemoCanvas
  ariaLabel="一角を欠いた直方体のワイヤフレーム表示を、すべての稜線を同じ輝度で描いたものと、視点から遠い稜線ほど輝度を落としたもので並べた3次元表示（ドラッグで回転）"
  createScene={createDepthCueingScene}
  {params}
  aspectRatio="16 / 9"
  camera={CAMERA}
  orbit={{
    enableZoom: false,
    // 左右の見比べが崩れないよう、正面から回り込みすぎない範囲に留める
    minAzimuthAngle: -Math.PI * 0.2,
    maxAzimuthAngle: Math.PI * 0.2,
    minPolarAngle: Math.PI * 0.28,
    maxPolarAngle: Math.PI * 0.72
  }}
  buildPane={(pane, p) => {
    pane.addBinding(p, "strength", { min: 0, max: 1, step: 0.01, label: "奥行きの効き" })
  }}
/>
