<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createHomogeneousLineScene, type HomogeneousLineParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする。
  // k は 1 だと (x, y, w) と点が重なってしまうので、初期値は定数倍が見える値にする。
  // scaled・normalized は scene.ts が計算して書き戻す表示用の値なので、初期値は使われない
  const params: HomogeneousLineParams = {
    x: 0.9,
    y: 0.6,
    w: 1.5,
    k: 1.6,
    scaled: "",
    normalized: ""
  }
</script>

<ThreeDemoCanvas
  ariaLabel="同次座標(x, y, w)のwを3本目の軸にとった3次元表示。原点を通る1本の直線の上に、同次座標(x, y, w)とそれをk倍した点が並び、直線がw=1の平面と交わる点が正規化後の座標(x/w, y/w, 1)になる（ドラッグで回転、ホイールで拡大縮小）"
  createScene={createHomogeneousLineScene}
  {params}
  aspectRatio="3 / 2"
  camera={{ position: [4.2, 3, 5.2] }}
  orbit={{
    // 原点と w = 1 の平面の両方が視野に入るよう、注視点を両者の中間に置く
    target: [0, 0, 0.8],
    minDistance: 3.5,
    maxDistance: 14
  }}
  buildPane={(pane, p) => {
    pane.addBinding(p, "x", { min: -1.2, max: 1.2, step: 0.01, label: "x" })
    pane.addBinding(p, "y", { min: -1.2, max: 1.2, step: 0.01, label: "y" })
    // w を 0 に近づけると正規化後の点が平面の外へ飛ぶので、平面に収まる範囲までにする
    pane.addBinding(p, "w", { min: 0.6, max: 1.8, step: 0.01, label: "w" })
    pane.addBinding(p, "k", { min: 0.3, max: 2, step: 0.01, label: "k（定数倍）" })
    pane.addBinding(p, "scaled", { readonly: true, label: "k倍した同次座標" })
    pane.addBinding(p, "normalized", { readonly: true, label: "wで割った座標" })
  }}
/>
