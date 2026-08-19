<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createBicubicSurfaceScene, type BicubicSurfaceParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする。
  // どちらも 0 から始め、基準の高さに置いた制御点網と曲面が見えた状態にする
  const params: BicubicSurfaceParams = { cornerHeight: 0, innerHeight: 0 }
</script>

<!-- 曲面の奥行きを見るデモなので、回り込みを残す（ここまでの平面の図と違い、回して見る図）。
     注視点は制御点網と曲面が収まる高さに合わせる -->
<ThreeDemoCanvas
  ariaLabel="双3次ベジェ曲面の3次元表示（ドラッグで回転）。縦横4点ずつ、合わせて16個の制御点と、それらを縦横に結んだ制御点網を細い線で描き、そこから生成される曲面を重ねてある。四隅の制御点は色と大きさを変えて示し、曲面の4辺には境界にあたるベジェ曲線を重ねている。四隅の高さを動かすと曲面の隅がそれに付いていき、内側4点の高さを動かすと曲面の内側だけがふくらむ"
  createScene={createBicubicSurfaceScene}
  {params}
  aspectRatio="16 / 10"
  camera={{ position: [3.6, 3, 4.2] }}
  orbit={{ target: [0, 0.3, 0], minDistance: 3.5, maxDistance: 14 }}
  buildPane={(pane, p) => {
    pane.addBinding(p, "cornerHeight", { min: -0.8, max: 0.8, step: 0.01, label: "四隅の高さ" })
    pane.addBinding(p, "innerHeight", { min: -1.2, max: 1.2, step: 0.01, label: "内側4点の高さ" })
  }}
/>
