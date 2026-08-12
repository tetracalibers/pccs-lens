<script lang="ts">
  import type { CameraOptions } from "$lib/demo/threejs/_shared/mount"
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createSmoothShadingScene, type SmoothShadingParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする
  const params: SmoothShadingParams = { segments: 10 }

  // 左右に離して置いた球は、画角が広いほど視点から見た角度が開き、画面の端ほど歪む。
  // 引いた位置から狭い画角で写して、左右の歪み方の差を抑える
  const CAMERA: CameraOptions = { fov: 22, position: [0, 3.05, 13.4] }
</script>

<ThreeDemoCanvas
  ariaLabel="ポリゴンで近似した球を、ポリゴンごとに明るさを一定にした表示と、濃淡を連続させたスムーズシェーディングの表示で並べた3次元表示（ドラッグで回転）"
  createScene={createSmoothShadingScene}
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
    pane.addBinding(p, "segments", { min: 4, max: 48, step: 1, label: "分割数" })
  }}
/>
