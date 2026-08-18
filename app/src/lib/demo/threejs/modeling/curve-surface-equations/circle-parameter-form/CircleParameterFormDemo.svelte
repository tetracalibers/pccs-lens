<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createCircleParameterFormScene, type CircleParameterFormParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする。
  // θ は半周を過ぎたところから始めて、点列と円弧が「まだ描かれていない範囲」を残す。
  // thetaRad・point は scene.ts が計算して書き戻す表示用の値なので、初期値は使われない
  const params: CircleParameterFormParams = {
    r: 2,
    thetaDeg: 225,
    thetaRad: "",
    point: ""
  }
</script>

<!-- xy 平面をそのまま見る図なので、回り込みは付けずに正面から固定する（拡大縮小だけ残す）。
     camera.position は、軸を伸ばした範囲が初期表示で収まる距離にする -->
<ThreeDemoCanvas
  ariaLabel="円のパラメータ表示をxy平面上に描いた図。原点を中心とする半径rの円周と、x軸から測った角度θ、原点から円周上の点へ引いた半径が示される。θを動かすと、θを一定の刻みで刻んだ点が0から順に円周上に現れ、そこまでの円弧が色の付いた線で描かれる（ホイールで拡大縮小）"
  createScene={createCircleParameterFormScene}
  {params}
  aspectRatio="4 / 3"
  camera={{ position: [0, 0, 9] }}
  orbit={{ enableRotate: false, minDistance: 4, maxDistance: 15 }}
  buildPane={(pane, p) => {
    pane.addBinding(p, "r", { min: 0.6, max: 2.8, step: 0.1, label: "r" })
    // 円周をちょうど 1 周ぶん動かせるようにする。刻みは点列の間隔（15 度）を割り切る値にする
    pane.addBinding(p, "thetaDeg", { min: 0, max: 360, step: 1, label: "θ（度）" })
    pane.addBinding(p, "thetaRad", { readonly: true, label: "θ（ラジアン）" })
    pane.addBinding(p, "point", { readonly: true, label: "(x, y)" })
  }}
/>
