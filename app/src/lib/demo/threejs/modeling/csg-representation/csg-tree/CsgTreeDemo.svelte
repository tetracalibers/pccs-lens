<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createCsgTreeScene, type CsgTreeParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする。
  // current は scene.ts が組み立てて書き戻す表示用の値なので、初期値は使われない
  const params: CsgTreeParams = { tree: "stackFirst", step: 0, current: "" }
</script>

<ThreeDemoCanvas
  ariaLabel="CSG木と、その木が表す立体を並べた3次元表示。左は葉に大小2枚の板と円柱、節点に集合演算の記号を置いた木構造の図で、右はそこまでの演算を適用した立体。まだ演算されていないプリミティブは半透明で置かれる。木を切り替えると途中の形は変わるが、最後はどちらも1段目に穴の開いた2段の階段になる"
  createScene={createCsgTreeScene}
  {params}
  aspectRatio="16 / 9"
  camera={{ position: [0, 0, 3.78] }}
  orbit={{ target: [0, 0, 0], enableRotate: false, minDistance: 2.4, maxDistance: 6.5 }}
  buildPane={(pane, p) => {
    pane.addBinding(p, "tree", {
      label: "CSG表現",
      options: { 積んでから穴を開ける: "stackFirst", 穴を開けてから積む: "drillFirst" }
    })
    pane.addBinding(p, "step", { min: 0, max: 2, step: 1, label: "演算を進める" })
    pane.addBinding(p, "current", { readonly: true, label: "適用されている演算" })
  }}
/>
