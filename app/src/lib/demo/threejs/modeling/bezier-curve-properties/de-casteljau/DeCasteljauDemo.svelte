<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createDeCasteljauScene, type DeCasteljauParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする。
  // t は軌跡が少しだけ描かれた状態で始める（0 だと各段の点が制御点に重なり、
  // 段ごとに点が減っていく作図が読み取れない）
  const params: DeCasteljauParams = { t: 0.35 }
</script>

<!-- 作図を正面から見る図なので、回り込みは付けずに固定する（拡大縮小だけ残す）。
     注視点は制御点とラベルが収まる高さに合わせる -->
<ThreeDemoCanvas
  ariaLabel="3次ベジェ曲線に対するド・カステリョの作図。4つの制御点を結ぶ制御多角形を破線で描き、その3辺を同じ割合で内分した3点、それらを結んだ2本の線分を内分した2点、さらにその線分を内分した1点を、段ごとに色を変えて重ねている。最後に残った1点が曲線上の点C(t)で、tを動かすと各段の点が動き、C(t)が通った跡が曲線として描かれる（ホイールで拡大縮小）"
  createScene={createDeCasteljauScene}
  {params}
  aspectRatio="16 / 10"
  camera={{ position: [0, 0.15, 5.2] }}
  orbit={{ target: [0, 0.15, 0], enableRotate: false, minDistance: 3, maxDistance: 10 }}
  buildPane={(pane, p) => {
    pane.addBinding(p, "t", { min: 0, max: 1, step: 0.01, label: "t (パラメータ)" })
  }}
/>
