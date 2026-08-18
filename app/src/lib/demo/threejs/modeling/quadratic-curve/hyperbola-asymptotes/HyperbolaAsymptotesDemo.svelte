<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createHyperbolaAsymptotesScene, type HyperbolaAsymptotesParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする。
  // y は頂点に近い低いところから始めて、上へ動かすほど漸近線に近づいていく過程を残す。
  // 3 つの値は scene.ts が計算して書き戻す表示用の値なので、初期値は使われない
  const params: HyperbolaAsymptotesParams = {
    a: 0.8,
    y: 0.6,
    curveX: "",
    asymptoteX: "",
    gap: ""
  }
</script>

<!-- 正面から見る平面の図なので回り込みは付けず、パネルを含めた全体が縦長にならないよう横長にする。
     camera.position は、a と y をどちらも上限にしたときの点まで画面に収まる距離にする -->
<ThreeDemoCanvas
  ariaLabel="双曲線の標準形が表す2本の枝と、その漸近線を示した図。x = aとx = -aの2本の線に挟まれた帯には曲線が入らず、曲線は帯の右と左に分かれて現れる。原点を通る2本の漸近線に対し、同じ高さで曲線上の点と漸近線上の点を結んだ隔たりが描かれ、yを大きくするほど狭くなる。aを動かすと頂点の位置と漸近線の傾きが同時に変わる（ホイールで拡大縮小）"
  createScene={createHyperbolaAsymptotesScene}
  {params}
  aspectRatio="16 / 9"
  camera={{ position: [0, 0, 7.6] }}
  orbit={{ enableRotate: false, minDistance: 3.5, maxDistance: 14 }}
  buildPane={(pane, p) => {
    // 原点から頂点までの距離。漸近線の傾き b/a もこの値で変わる
    pane.addBinding(p, "a", { min: 0.4, max: 1.2, step: 0.01, label: "a" })
    // どの高さで曲線と漸近線を見比べるか。対称軸を挟んで上下どちらへも動かせる
    pane.addBinding(p, "y", { min: -2.6, max: 2.6, step: 0.01, label: "y" })
    // 右の枝で読んだ、その高さでの曲線の x と漸近線の x、そしてその隔たり
    pane.addBinding(p, "curveX", { readonly: true, label: "曲線の x" })
    pane.addBinding(p, "asymptoteX", { readonly: true, label: "漸近線の x" })
    pane.addBinding(p, "gap", { readonly: true, label: "隔たり" })
  }}
/>
