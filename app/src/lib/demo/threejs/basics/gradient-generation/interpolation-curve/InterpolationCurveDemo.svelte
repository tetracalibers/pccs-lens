<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createInterpolationCurveScene, type InterpolationCurveParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする。
  // 前の節で見た線形補間から始め、そこからカーブを切り替えて違いを見られるようにする。
  // formula と midValue は scene.ts が書き戻す表示用の値なので、初期値は使われない
  const params: InterpolationCurveParams = {
    curve: "linear",
    formula: "",
    midValue: ""
  }
</script>

<!-- カーブと帯を見比べる図なので、回り込みは付けずに正面から固定する（拡大縮小だけ残す） -->
<ThreeDemoCanvas
  ariaLabel="補間関数のカーブと、その関数で塗ったグラデーションの帯を上下に並べた図。横軸は割合t、縦軸は補間した値。カーブが上に膨らむ区間ではグラデーションが速く明るくなり、寝ている区間では明るさがなかなか変わらない（ホイールで拡大縮小）"
  createScene={createInterpolationCurveScene}
  {params}
  aspectRatio="16 / 9"
  camera={{ position: [0, 0, 4.1] }}
  orbit={{ enableRotate: false, minDistance: 2.4, maxDistance: 8 }}
  buildPane={(pane, p) => {
    pane.addBinding(p, "curve", {
      label: "補間関数",
      options: {
        直線: "linear",
        "2次関数（加速）": "quadraticIn",
        "2次関数（減速）": "quadraticOut",
        対数関数: "logarithmic"
      }
    })
    pane.addBinding(p, "formula", { readonly: true, label: "式" })
    pane.addBinding(p, "midValue", { readonly: true, label: "中央（t = 0.5）の値" })
  }}
/>
