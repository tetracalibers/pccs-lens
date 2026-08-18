<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createLinearInterpolationScene, type LinearInterpolationParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする。
  // t は真ん中からずらして始める（0.5 だと 2 つの制御点にかかる比が同じ値になり、
  // 混合比が t で入れ替わることに気づきにくい）。
  // mix は scene.ts が計算して書き戻す表示用の値なので、初期値は使われない
  const params: LinearInterpolationParams = { t: 0.3, mix: "" }
</script>

<!-- 線分をそのまま正面から見る図なので、回り込みは付けずに固定する（拡大縮小だけ残す）。
     camera.position は、線分とラベルが初期表示で収まる距離にする -->
<ThreeDemoCanvas
  ariaLabel="2つの制御点P₀・P₁を結ぶ線分と、その上の点C(t)を描いた図。線分はC(t)を境に2つに分かれ、P₀側の長さがt、P₁側の長さが1 − tにあたる。tを動かすとC(t)が線分上を動き、2つの制御点にかかる混合比がパネルに表示される（ホイールで拡大縮小）"
  createScene={createLinearInterpolationScene}
  {params}
  aspectRatio="16 / 10"
  camera={{ position: [0, 0, 4.8] }}
  orbit={{ enableRotate: false, minDistance: 2.5, maxDistance: 9 }}
  buildPane={(pane, p) => {
    pane.addBinding(p, "t", { min: 0, max: 1, step: 0.01, label: "t (パラメータ)" })
    pane.addBinding(p, "mix", { readonly: true, label: "C(t)" })
  }}
/>
