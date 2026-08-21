<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createLinearInterpolationScene, type LinearInterpolationParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする。
  // 割合は、両端のどちらにも寄っていないことがひと目でわかる位置から始める
  const params: LinearInterpolationParams = {
    t: 0.35
  }
</script>

<!-- 帯を正面から読む図なので、回り込みは付けずに固定する（拡大縮小だけ残す） -->
<ThreeDemoCanvas
  ariaLabel="線形補間によるグラデーションの図。2色AとBの間を補間した帯があり、割合tにあたる位置に補間の結果f(t)を指す線が立っている。帯の左右のAとBの下には、それぞれの色が何パーセント混ぜ合わされているかが表示される（ホイールで拡大縮小）"
  createScene={createLinearInterpolationScene}
  {params}
  aspectRatio="16 / 9"
  camera={{ position: [0, 0, 3] }}
  orbit={{ enableRotate: false, minDistance: 2, maxDistance: 7 }}
  buildPane={(pane, p) => {
    pane.addBinding(p, "t", { min: 0, max: 1, step: 0.01, label: "割合 t" })
  }}
/>
