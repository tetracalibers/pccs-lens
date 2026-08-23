<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createHermiteFunctionsScene, type HermiteFunctionsParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする。
  // t は 4 本の重みがどれも 0 でない位置から始める（両端だと 2 本が 0 に潰れた状態で、
  // 4 本が値を分け合っていることが初期表示から読み取れない）。
  // values と slopes は scene.ts が計算して書き戻す表示用の値なので、初期値は使われない
  const params: HermiteFunctionsParams = { t: 0.3, values: "", slopes: "" }
</script>

<!-- グラフを正面から読む図なので、回り込みは付けずに固定する（拡大縮小だけ残す） -->
<ThreeDemoCanvas
  ariaLabel="4つのエルミート関数のグラフ。横軸がパラメータt（0から1）、縦軸が重みで、H₀からH₃の4本を色分けして重ねてある。H₀とH₁は両端で1に達し、H₂とH₃は両端で0になりながら、t=0とt=1で傾きが1になる接線を破線で示している。tを動かすと縦の読み取り線が動き、その位置で各関数が取る重みが点で示される（ホイールで拡大縮小）"
  createScene={createHermiteFunctionsScene}
  {params}
  aspectRatio="16 / 9"
  camera={{ position: [0, 0, 5.2] }}
  orbit={{ enableRotate: false, minDistance: 3, maxDistance: 10 }}
  buildPane={(pane, p) => {
    pane.addBinding(p, "t", { min: 0, max: 1, step: 0.01, label: "t (パラメータ)" })
    // 4 つぶんの値は 1 行に収まらないので、複数行のモニターにして 1 行 1 つで並べる
    // （scene.ts が改行で区切った文字列を書き戻す）
    pane.addBinding(p, "values", { readonly: true, multiline: true, rows: 4, label: "重み" })
    pane.addBinding(p, "slopes", { readonly: true, multiline: true, rows: 4, label: "傾き" })
  }}
/>
