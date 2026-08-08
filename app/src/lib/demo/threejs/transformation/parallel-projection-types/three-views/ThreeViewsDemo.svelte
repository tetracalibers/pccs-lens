<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createThreeViewsScene, type ThreeViewsParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする
  const params: ThreeViewsParams = { unfold: 0, showSolid: true }
</script>

<ThreeDemoCanvas
  ariaLabel="L字に切り欠いた立体と、それを囲む箱の手前・上・右にあたる3枚の投影面。各頂点から3枚へ引いた投射線と、写った正面図・平面図・側面図が描かれる。展開を上げると3枚が1枚の平面へ折り開かれ、正面図の上に平面図、右に側面図が並び、図のあいだに位置のそろいを示す対応線が現れる（ホイールで拡大縮小、回転はしない）"
  createScene={createThreeViewsScene}
  {params}
  aspectRatio="4 / 3"
  camera={{ position: [0, 0, 5.6] }}
  orbit={{
    // 折り開いた 3 枚を正面から読み取る図なので回転させない。
    // 畳んだ状態の立体としての見え方は、シーンの側で傾けて作っている
    enableRotate: false,
    minDistance: 3,
    maxDistance: 12
  }}
  buildPane={(pane, p) => {
    pane.addBinding(p, "unfold", {
      min: 0,
      max: 1,
      step: 0.01,
      format: (value: number) => value.toFixed(2),
      label: "展開"
    })
    pane.addBinding(p, "showSolid", { label: "立体を表示" })
  }}
/>
