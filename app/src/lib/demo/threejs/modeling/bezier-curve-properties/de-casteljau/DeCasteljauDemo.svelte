<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createDeCasteljauScene, MAX_LEVEL, MIN_LEVEL, type DeCasteljauParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする。
  // t は軌跡が少しだけ描かれた状態で始める（0 だと各段の点が制御点に重なり、
  // 段ごとに点が減っていく作図が読み取れない）。
  // level は下限の 3 から始め、記事が説明している 3 次ベジェ曲線の作図を最初に見せる
  const params: DeCasteljauParams = { t: 0.35, level: MIN_LEVEL }
</script>

<!-- 作図を正面から見る図なので、回り込みは付けずに固定する（拡大縮小だけ残す）。
     注視点は制御点とラベルが収まる高さに合わせる -->
<ThreeDemoCanvas
  ariaLabel="ベジェ曲線に対するド・カステリョの作図。制御点を結ぶ制御多角形を破線で描き、隣り合う2点を同じ割合で内分して得た点の列を、点が1つに減りきるまで段ごとに色を変えて重ねている。最後に残った1点が曲線上の点C(t)で、tを動かすと各段の点が動き、C(t)が通った跡が曲線として描かれる。段数を上げると制御点が1つ増え、内分を繰り返す段も1つ増える（ホイールで拡大縮小）"
  createScene={createDeCasteljauScene}
  {params}
  aspectRatio="16 / 10"
  camera={{ position: [0, 0.15, 5.2] }}
  orbit={{ target: [0, 0.15, 0], enableRotate: false, minDistance: 3, maxDistance: 10 }}
  buildPane={(pane, p) => {
    pane.addBinding(p, "t", { min: 0, max: 1, step: 0.01, label: "t (パラメータ)" })
    // 段数は作図全体の段数で、制御点の数はこれより 1 つ多くなる
    pane.addBinding(p, "level", { min: MIN_LEVEL, max: MAX_LEVEL, step: 1, label: "段数" })
  }}
/>
