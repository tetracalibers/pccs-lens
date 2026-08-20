<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createMoirePatternScene, type MoirePatternParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする。
  // 初期値は標本化定理を満たさない側から始める。もとには無い太い縞が右に現れている状態を先に見せ、
  // 標本点を増やしていくとそれが消えることを確かめられるようにする。
  // theorem と moire は scene.ts が計算して書き戻す表示用の値なので、初期値は使われない
  const params: MoirePatternParams = {
    frequency: 15,
    angle: 2,
    sampleCount: 26,
    theorem: "",
    moire: ""
  }
</script>

<!-- 2枚を見比べる図なので、回り込みは付けずに正面から固定する（拡大縮小だけ残す） -->
<ThreeDemoCanvas
  ariaLabel="細かい縞模様を格子状の標本点で読み取った結果を、もとの縞模様と並べた図。標本点の数が縞の細かさに対して足りないと、右の標本化した結果にはもとの画像には無い太い縞（モアレ）が現れる（ホイールで拡大縮小）"
  createScene={createMoirePatternScene}
  {params}
  aspectRatio="16 / 9"
  camera={{ position: [0, 0, 3.8] }}
  orbit={{ enableRotate: false, minDistance: 2, maxDistance: 8 }}
  buildPane={(pane, p) => {
    pane.addBinding(p, "frequency", { min: 4, max: 40, step: 1, label: "縞の細かさ（本）" })
    pane.addBinding(p, "angle", { min: 0, max: 90, step: 1, label: "縞の傾き（度）" })
    pane.addBinding(p, "sampleCount", { min: 4, max: 64, step: 1, label: "標本点の数（1辺）" })
    pane.addBinding(p, "theorem", { readonly: true, label: "標本化定理" })
    pane.addBinding(p, "moire", { readonly: true, label: "現れるモアレ" })
  }}
/>
