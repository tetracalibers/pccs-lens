<script lang="ts">
  import type { CameraOptions } from "$lib/demo/threejs/_shared/mount"
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createShadingAndShadowScene, type ShadingAndShadowParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする
  const params: ShadingAndShadowParams = { azimuth: 80, elevation: 55 }

  // 左右に離して置いた立体は、画角が広いほど視点から見た角度が開き、画面の端ほど台形に歪む。
  // ここでは左右を同じ向きに置いて光の当たり方まで揃えているので、その歪みを立体の向きで
  // 補正することができない。かわりに大きく引いた位置から狭い画角で写して、歪み自体を抑える。
  // 段の上を向いた面に落ちる影を読み取れるよう、他のデモより見下ろす角度を強くしている
  const CAMERA: CameraOptions = { fov: 11, position: [0, 15.4, 22] }
</script>

<ThreeDemoCanvas
  ariaLabel="3段の階段状の立体を、陰影だけをつけた表示と、段差が下の段に落とす影までつけた表示で並べた3次元表示（ドラッグで回転）"
  createScene={createShadingAndShadowScene}
  {params}
  aspectRatio="16 / 9"
  camera={CAMERA}
  orbit={{
    enableZoom: false,
    // 左右の見比べが崩れないよう、正面から回り込みすぎない範囲に留める
    minAzimuthAngle: -Math.PI * 0.2,
    maxAzimuthAngle: Math.PI * 0.2,
    // 段の上を向いた面が見えなくなるほど水平に近づかない範囲に留める
    minPolarAngle: Math.PI * 0.15,
    maxPolarAngle: Math.PI * 0.38
  }}
  buildPane={(pane, p) => {
    // 光を正面寄りから真横寄りまで動かす範囲。どこでも段差の影が段の面に落ちる
    pane.addBinding(p, "azimuth", { min: 40, max: 110, step: 1, label: "光源の方位" })
    pane.addBinding(p, "elevation", { min: 40, max: 80, step: 1, label: "光源の高さ" })
  }}
/>
