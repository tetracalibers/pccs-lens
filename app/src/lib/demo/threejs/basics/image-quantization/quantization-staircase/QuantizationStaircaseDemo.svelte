<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createQuantizationStaircaseScene, type QuantizationStaircaseParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする。
  // 段階の数は、1 段ずつを目で数えられる 4 段階から始める。入力の明るさは、一番近い段階が
  // 上側にあり、丸めのずれがはっきり見える位置に置く。
  // pixelValue と gap は scene.ts が計算して書き戻す表示用の値なので、初期値は使われない
  const params: QuantizationStaircaseParams = {
    levelCount: 4,
    input: 0.55,
    pixelValue: "",
    gap: ""
  }
</script>

<!-- グラフを正面から読む図なので、回り込みは付けずに固定する（拡大縮小だけ残す） -->
<ThreeDemoCanvas
  ariaLabel="量子化特性を階段状のグラフで表した図。横軸が入力の連続的な明るさ、縦軸が出力の画素値で、丸めが起きない場合を表す45度の直線と、一番近い段階に丸めた結果の階段が重ねてある。入力の明るさを動かすと、丸めた先の画素値と、丸めによって生じるずれが示される（ホイールで拡大縮小）"
  createScene={createQuantizationStaircaseScene}
  {params}
  aspectRatio="16 / 9"
  camera={{ position: [0, 0, 5.2] }}
  orbit={{ enableRotate: false, minDistance: 2.5, maxDistance: 9 }}
  buildPane={(pane, p) => {
    pane.addBinding(p, "levelCount", { min: 2, max: 16, step: 1, label: "段階の数" })
    pane.addBinding(p, "input", { min: 0, max: 1, step: 0.001, label: "入力の明るさ" })
    pane.addBinding(p, "pixelValue", { readonly: true, label: "出力の画素値" })
    pane.addBinding(p, "gap", { readonly: true, label: "丸めのずれ" })
  }}
/>
