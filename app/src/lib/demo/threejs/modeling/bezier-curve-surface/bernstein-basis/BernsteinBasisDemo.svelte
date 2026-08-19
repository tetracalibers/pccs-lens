<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createBernsteinBasisScene, type BernsteinBasisParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする。
  // t は 4 本の重みがどれも 0 でない位置から始める（両端だと 1 本だけが 1 になった状態で、
  // 山を分け合っていることが初期表示から読み取れない）。
  // weights と total は scene.ts が計算して書き戻す表示用の値なので、初期値は使われない
  const params: BernsteinBasisParams = { t: 0.35, weights: "", total: "" }
</script>

<!-- グラフを正面から読む図なので、回り込みは付けずに固定する（拡大縮小だけ残す） -->
<ThreeDemoCanvas
  ariaLabel="3次のバーンスタイン基底関数のグラフ。横軸がパラメータt（0から1）、縦軸が重みで、4本の基底関数を色分けして重ねてある。tを動かすと縦の読み取り線が動き、その位置で各基底関数が取る重みが点で示される。右の積み上げ棒は4つの重みを積んだもので、どのtでも高さが1のまま変わらない（ホイールで拡大縮小）"
  createScene={createBernsteinBasisScene}
  {params}
  aspectRatio="16 / 9"
  camera={{ position: [0, 0, 4.9] }}
  orbit={{ enableRotate: false, minDistance: 3, maxDistance: 9 }}
  buildPane={(pane, p) => {
    pane.addBinding(p, "t", { min: 0, max: 1, step: 0.01, label: "t (パラメータ)" })
    // 4 つぶんの値は 1 行に収まらないので、複数行のモニターにして折り返す
    pane.addBinding(p, "weights", {
      readonly: true,
      multiline: true,
      rows: 2,
      label: "重み (B₀,₃ → B₃,₃)"
    })
    pane.addBinding(p, "total", { readonly: true, label: "合計" })
  }}
/>
