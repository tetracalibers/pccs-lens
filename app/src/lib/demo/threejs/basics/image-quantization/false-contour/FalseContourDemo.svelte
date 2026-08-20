<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createFalseContourScene, type FalseContourParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする。
  // 初期値は擬似輪郭がうっすら見える 5 ビット（32段階）から始める。段差が出るか出ないかの
  // ところを先に見せておくと、ビット数を下げたときに帯が現れていく過程を追える。
  // levelCount と contourCount は scene.ts が計算して書き戻す表示用の値なので、初期値は使われない
  const params: FalseContourParams = {
    bitCount: 5,
    levelCount: "",
    contourCount: ""
  }
</script>

<!-- 2枚を見比べる図なので、回り込みは付けずに正面から固定する（拡大縮小だけ残す） -->
<ThreeDemoCanvas
  ariaLabel="なだらかに明るさが変わるグラデーションを量子化した結果を、もとのグラデーションと並べた図。ビット数が小さいと、右の量子化した結果では滑らかだった濃淡が帯に分かれ、帯と帯の境目に等高線のような擬似輪郭が現れる（ホイールで拡大縮小）"
  createScene={createFalseContourScene}
  {params}
  aspectRatio="16 / 9"
  camera={{ position: [0, 0, 3.8] }}
  orbit={{ enableRotate: false, minDistance: 2, maxDistance: 8 }}
  buildPane={(pane, p) => {
    pane.addBinding(p, "bitCount", { min: 1, max: 8, step: 1, label: "ビット数" })
    pane.addBinding(p, "levelCount", { readonly: true, label: "量子化レベル数" })
    pane.addBinding(p, "contourCount", { readonly: true, label: "段の境目" })
  }}
/>
