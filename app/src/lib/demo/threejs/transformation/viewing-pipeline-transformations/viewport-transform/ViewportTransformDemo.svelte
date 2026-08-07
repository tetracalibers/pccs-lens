<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createViewportTransformScene, type ViewportTransformParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする
  const params: ViewportTransformParams = { width: 300, height: 200, x: 170, y: 100, flipY: true }
</script>

<ThreeDemoCanvas
  ariaLabel="左に正規化デバイス座標系の断面（-1〜1の正方形、原点が中央でy軸が上向き）、右に画面とその中に置かれたビューポート（原点が左上でy軸が下向き）を並べた図。断面に写っている像が、ビューポートの中へ移されて描かれる。ビューポートの縦横比が画像に写す範囲の縦横比と食い違うと、像が引き伸ばされる（ホイールで拡大縮小）"
  createScene={createViewportTransformScene}
  {params}
  aspectRatio="16 / 9"
  camera={{ position: [0, 0.5, 5.4] }}
  orbit={{
    // 平面の図なので回転・パンはさせない（正面から見た向きが崩れる）。
    // カメラは xy 平面の正面（+z）に置いてあるので、ズームは図が正面のまま拡大縮小する動きになる
    target: [0, 0.5, 0],
    enableRotate: false,
    minDistance: 3,
    maxDistance: 12
  }}
  buildPane={(pane, p) => {
    const asPixels = (value: number) => `${value.toFixed(0)}px`
    pane.addBinding(p, "width", { min: 120, max: 440, step: 10, format: asPixels, label: "幅" })
    pane.addBinding(p, "height", { min: 80, max: 280, step: 10, format: asPixels, label: "高さ" })
    pane.addBinding(p, "x", { min: 0, max: 200, step: 10, format: asPixels, label: "左からの位置" })
    pane.addBinding(p, "y", { min: 0, max: 120, step: 10, format: asPixels, label: "上からの位置" })
    pane.addBinding(p, "flipY", { label: "y軸を反転" })
  }}
/>
