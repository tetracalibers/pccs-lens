<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createFocusDirectrixScene, type FocusDirectrixParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする。
  // y は頂点から離れたところから始めて、2 本の距離が斜めと横で長さの違うものに見えるようにする。
  // 距離の値は scene.ts が計算して書き戻す表示用の値なので、初期値は使われない
  const params: FocusDirectrixParams = {
    p: 0.5,
    y: 1.2,
    focusDistance: "",
    directrixDistance: ""
  }
</script>

<!-- 正面から見る平面の図なので回り込みは付けず、パネルを含めた全体が縦長にならないよう横長にする。
     camera.position と注視点は、放物線が最も横へ開くところ（p が下限のとき）まで収まる距離・位置にする -->
<ThreeDemoCanvas
  ariaLabel="放物線を、定点である焦点と定直線である準線から等しい距離にある点の集まりとして示した図。曲線上の点から焦点へ引いた斜めの線と、準線へ下ろした横向きの線が同じ色で描かれ、どちらの長さも同じ値になる。yを動かすと点が曲線上を動き、pを動かすと焦点と準線が原点から離れて放物線の開き方が変わる（ホイールで拡大縮小）"
  createScene={createFocusDirectrixScene}
  {params}
  aspectRatio="16 / 9"
  camera={{ position: [1.5, 0, 7] }}
  orbit={{ enableRotate: false, minDistance: 3.5, maxDistance: 12, target: [1.5, 0, 0] }}
  buildPane={(pane, p) => {
    // 頂点から焦点までの距離。準線は反対側の同じ距離にあるので、この 1 つで両方が動く
    pane.addBinding(p, "p", { min: 0.3, max: 1.2, step: 0.01, label: "p" })
    // 曲線上のどの点を見るか。対称軸を挟んで上下どちらへも動かせる
    pane.addBinding(p, "y", { min: -1.9, max: 1.9, step: 0.01, label: "y" })
    // 別々の式から求めた 2 つの距離。曲線上の点ではどこでも一致する
    pane.addBinding(p, "focusDistance", { readonly: true, label: "焦点までの距離" })
    pane.addBinding(p, "directrixDistance", { readonly: true, label: "準線までの距離" })
  }}
/>
