<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createLineParameterFormScene, type LineParameterFormParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする。
  // 初期値は、基準点が原点から離れた位置にあり、向きの成分 a・b がどちらも 0 でない状態にする
  // （x 方向にも y 方向にも進む向きから始めることで、a を 0 にしたときの変化が読み取れる）。
  // point は scene.ts が計算して書き戻す表示用の値なので、初期値は使われない
  const params: LineParameterFormParams = {
    p: -1.2,
    q: -0.6,
    a: 1,
    b: 0.8,
    t: 1.4,
    point: ""
  }
</script>

<!-- xy 平面をそのまま見る図なので、回り込みは付けずに正面から固定する（拡大縮小だけ残す）。
     camera.position は、軸を伸ばした範囲が初期表示で収まる距離にする -->
<ThreeDemoCanvas
  ariaLabel="直線のパラメータ表示をxy平面上に描いた図。点(p, q)を通り、x方向にa・y方向にb進む向きの直線が引かれ、tを整数にしたときの点が直線上に等間隔で並ぶ。tを動かすと、直線上の点(x, y)が基準点から離れていき、通った範囲が色の付いた線分で示される（ホイールで拡大縮小）"
  createScene={createLineParameterFormScene}
  {params}
  aspectRatio="3 / 2"
  camera={{ position: [0, 0, 7.6] }}
  orbit={{ enableRotate: false, minDistance: 3.5, maxDistance: 13 }}
  buildPane={(pane, p) => {
    pane.addBinding(p, "p", { min: -2, max: 2, step: 0.1, label: "p" })
    pane.addBinding(p, "q", { min: -2, max: 2, step: 0.1, label: "q" })
    pane.addBinding(p, "a", { min: -1.5, max: 1.5, step: 0.1, label: "a" })
    pane.addBinding(p, "b", { min: -1.5, max: 1.5, step: 0.1, label: "b" })
    pane.addBinding(p, "t", { min: -3, max: 3, step: 0.01, label: "t" })
    pane.addBinding(p, "point", { readonly: true, label: "(x, y)" })
  }}
/>
