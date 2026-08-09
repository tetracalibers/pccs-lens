<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createReflectionSpreadScene, type ReflectionSpreadParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする。
  // 粗さは 0（正反射）から始める。記事が正反射 → 拡散反射の順で説明しているため
  const params: ReflectionSpreadParams = { incidenceDeg: 60, roughness: 0 }
</script>

<ThreeDemoCanvas
  ariaLabel="水平な面の複数の点に平行に届いた光が跳ね返る様子の3次元表示。表面の粗さを上げると、反射光が向きのそろった状態から半球状に散らばった状態へ変わる（ドラッグで回転）"
  createScene={createReflectionSpreadScene}
  {params}
  aspectRatio="4 / 3"
  camera={{ position: [3.2, 2.4, 4.2] }}
  orbit={{ target: [0, 0.5, 0], enableZoom: false, maxPolarAngle: Math.PI * 0.47 }}
  buildPane={(pane, p) => {
    pane.addBinding(p, "incidenceDeg", {
      min: 15,
      max: 80,
      step: 1,
      format: (value: number) => `${value.toFixed(0)}°`,
      label: "入射角"
    })
    pane.addBinding(p, "roughness", { min: 0, max: 1, step: 0.01, label: "表面の粗さ" })
  }}
/>
