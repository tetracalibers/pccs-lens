<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createSincInterpolationScene, type SincInterpolationParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする。
  // 初期値は sinc 関数 1 本だけを重ねた状態にする。1 本の形（自分の標本点で標本値に届き、
  // ほかの標本点ではちょうど 0 を通る）を見てから、本数を増やしていける
  const params: SincInterpolationParams = {
    termCount: 1,
    showTerms: true,
    showSource: true
  }
</script>

<!-- 波を正面から読む図なので、回り込みは付けずに固定する（拡大縮小だけ残す） -->
<ThreeDemoCanvas
  ariaLabel="標本値から連続信号を復元する補間の図。横軸が位置、縦軸が明るさで、各標本値に重ねるsinc関数を1本ずつ足し合わせていくと、重ね合わせた波がもとの波に近づいていく（ホイールで拡大縮小）"
  createScene={createSincInterpolationScene}
  {params}
  aspectRatio="16 / 9"
  camera={{ position: [0, 0, 4.5] }}
  orbit={{ enableRotate: false, minDistance: 2.5, maxDistance: 9 }}
  buildPane={(pane, p) => {
    pane.addBinding(p, "termCount", {
      min: 0,
      max: 13,
      step: 1,
      label: "重ね合わせる標本点の数"
    })
    pane.addBinding(p, "showTerms", { label: "sinc関数を1本ずつ表示" })
    pane.addBinding(p, "showSource", { label: "もとの波を表示" })
  }}
/>
