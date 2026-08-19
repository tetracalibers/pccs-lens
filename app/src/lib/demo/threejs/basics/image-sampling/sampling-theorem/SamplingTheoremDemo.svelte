<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createSamplingTheoremScene, type SamplingTheoremParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする。
  // 初期値は標本化定理を満たす側（1 周期あたり 4 点）から始める。まず復元された波がもとの波に
  // 重なる状態を見せておくと、標本化を粗くしたときのずれが読み取りやすい。
  // samplesPerPeriod と reconstruction は scene.ts が計算して書き戻す表示用の値なので、初期値は使われない
  const params: SamplingTheoremParams = {
    frequency: 6,
    sampleCount: 24,
    showSincTerms: false,
    samplesPerPeriod: "",
    reconstruction: ""
  }
</script>

<!-- 波を正面から読む図なので、回り込みは付けずに固定する（拡大縮小だけ残す） -->
<ThreeDemoCanvas
  ariaLabel="明暗が正弦波状に変化する信号を標本化した図。横軸が位置、縦軸が明るさで、もとの波、標本点、標本値から復元された波が色分けして重ねてある。標本化周波数がもとの波の空間周波数の2倍以上あれば復元された波はもとの波に重なり、下回るとそれよりゆるやかなエイリアスに変わる（ホイールで拡大縮小）"
  createScene={createSamplingTheoremScene}
  {params}
  aspectRatio="16 / 9"
  camera={{ position: [0, 0, 4.5] }}
  orbit={{ enableRotate: false, minDistance: 2.5, maxDistance: 9 }}
  buildPane={(pane, p) => {
    pane.addBinding(p, "frequency", {
      min: 1,
      max: 16,
      step: 0.25,
      label: "縞の空間周波数（本）"
    })
    pane.addBinding(p, "sampleCount", {
      min: 4,
      max: 48,
      step: 1,
      label: "標本化周波数（標本点の数）"
    })
    pane.addBinding(p, "showSincTerms", { label: "sinc関数の内訳を表示" })
    pane.addBinding(p, "samplesPerPeriod", { readonly: true, label: "1周期あたりの標本点数" })
    pane.addBinding(p, "reconstruction", { readonly: true, label: "復元される波" })
  }}
/>
