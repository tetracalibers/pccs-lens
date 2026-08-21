<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createGradientSurfaceScene, type GradientSurfaceParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする。
  // shape は scene.ts が書き戻す表示用の値なので、初期値は使われない
  const params: GradientSurfaceParams = {
    pattern: "conical",
    height: 0.85,
    showSurface: true,
    shape: ""
  }
</script>

<ThreeDemoCanvas
  ariaLabel="グラデーションを3次元の曲面として見せた図。下の平面に画素の位置（x・y）と値（灰色の濃淡）を、その上の曲面に同じ値を高さ（z）として表す。方向グラデーションは斜めに傾いた平面、放射グラデーションはすり鉢状の曲面になる（ドラッグで回転、ホイールで拡大縮小）"
  createScene={createGradientSurfaceScene}
  {params}
  aspectRatio="16 / 9"
  camera={{ position: [2.9, 2.5, 3.5] }}
  orbit={{ target: [0, 0.35, 0], minDistance: 3, maxDistance: 10, maxPolarAngle: 1.48 }}
  buildPane={(pane, p) => {
    pane.addBinding(p, "pattern", {
      label: "パターン",
      options: {
        "方向（線形）": "linear",
        "放射（ラジアル）": "radial",
        "角度（コニカル）": "conical"
      }
    })
    pane.addBinding(p, "showSurface", { label: "曲面を表示" })
    pane.addBinding(p, "height", { min: 0, max: 1, step: 0.01, label: "値の高さ" })
    pane.addBinding(p, "shape", { readonly: true, label: "曲面の形" })
  }}
/>
