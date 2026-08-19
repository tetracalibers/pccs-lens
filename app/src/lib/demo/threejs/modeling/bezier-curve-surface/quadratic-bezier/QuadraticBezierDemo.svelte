<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createQuadraticBezierScene, type QuadraticBezierParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする。
  // t は軌跡が少しだけ描かれた状態で始める（0 だと軌跡が 1 点に潰れ、t で伸びていくことに気づきにくい）。
  // mix は scene.ts が計算して書き戻す表示用の値なので、初期値は使われない
  const params: QuadraticBezierParams = { t: 0.35, mix: "" }
</script>

<!-- 2 本の線分と束を正面から見る図なので、回り込みは付けずに固定する（拡大縮小だけ残す）。
     注視点は図の中心（制御点の高さの真ん中あたり）に合わせる -->
<ThreeDemoCanvas
  ariaLabel="3つの制御点P₀・P₁・P₂を結ぶ2本の線分を、それぞれ10等分した図。同じ番号の分点どうしを結んだ線分の束が、内側に曲線を浮かび上がらせる。tを動かすと束のうち1本が選ばれ、その線分をさらに同じ割合で分けた点C(t)が動いて、通った跡が曲線として描かれる（ホイールで拡大縮小）"
  createScene={createQuadraticBezierScene}
  {params}
  aspectRatio="16 / 10"
  camera={{ position: [0, 0.3, 5.2] }}
  orbit={{ target: [0, 0.3, 0], enableRotate: false, minDistance: 3, maxDistance: 10 }}
  buildPane={(pane, p) => {
    pane.addBinding(p, "t", { min: 0, max: 1, step: 0.01, label: "t (パラメータ)" })
    pane.addBinding(p, "mix", { readonly: true, label: "C(t)" })
  }}
/>
