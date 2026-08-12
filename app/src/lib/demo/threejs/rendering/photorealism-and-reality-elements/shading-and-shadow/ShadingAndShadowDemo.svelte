<script lang="ts">
  import type { CameraOptions } from "$lib/demo/threejs/_shared/mount"
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createShadingAndShadowScene, type ShadingAndShadowParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする
  const params: ShadingAndShadowParams = { azimuth: 35, elevation: 45 }

  // 左右に離して置いた立体は、画角が広いほど視点から見た角度が開き、画面の端ほど台形に歪む。
  // 引いた位置から狭い画角で写して、左右の歪み方の差を抑える。
  // 床に落ちた影を読み取れるよう、デプスキューイングのデモより見下ろす角度を強くしている
  const CAMERA: CameraOptions = { fov: 22, position: [0, 6.2, 12.2] }
</script>

<ThreeDemoCanvas
  ariaLabel="床に置いた一角を欠いた直方体を、陰影だけをつけた表示と、影を落とした表示で並べた3次元表示（ドラッグで回転）"
  createScene={createShadingAndShadowScene}
  {params}
  aspectRatio="16 / 9"
  camera={CAMERA}
  orbit={{
    enableZoom: false,
    // 左右の見比べが崩れないよう、正面から回り込みすぎない範囲に留める
    minAzimuthAngle: -Math.PI * 0.2,
    maxAzimuthAngle: Math.PI * 0.2,
    // 床の下へ回り込まない範囲に留める
    minPolarAngle: Math.PI * 0.15,
    maxPolarAngle: Math.PI * 0.42
  }}
  buildPane={(pane, p) => {
    pane.addBinding(p, "azimuth", { min: -80, max: 80, step: 1, label: "光源の方位" })
    pane.addBinding(p, "elevation", { min: 15, max: 80, step: 1, label: "光源の高さ" })
  }}
/>
