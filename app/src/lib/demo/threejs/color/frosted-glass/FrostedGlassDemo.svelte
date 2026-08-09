<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createFrostedGlassScene, type FrostedGlassParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする。
  // 粗さは 0（透明なガラス）から始める。記事が正透過 → 拡散透過の順で説明しているため。
  // glassType は scene.ts が計算して書き戻す表示用の値
  const params: FrostedGlassParams = { roughness: 0, glassType: "透明なガラス" }
</script>

<ThreeDemoCanvas
  ariaLabel="円・四角・細い縞を並べた面を、1枚の板ガラス越しに正面から見た3次元表示。ガラスの粗さを上げると、細いものから順に輪郭が読み取れないぼんやりとした見え方に変わる（ドラッグで回転）"
  createScene={createFrostedGlassScene}
  {params}
  aspectRatio="16 / 10"
  camera={{ position: [-0.73, 0.94, 5.05] }}
  orbit={{
    target: [0, 0, -0.2],
    enableZoom: false,
    // 奥の図形は手前のガラスより一回り小さいだけなので、横へ回り込むほど図形が板から
    // はみ出して見える。40 度あたりで端の図形が板の外へ出るため、その手前で止める
    minAzimuthAngle: -Math.PI * 0.2,
    maxAzimuthAngle: Math.PI * 0.2,
    minPolarAngle: Math.PI * 0.36,
    maxPolarAngle: Math.PI * 0.55
  }}
  buildPane={(pane, p) => {
    // 上限の 0.6 は、実際に動かして「向こう側がぼんやり見える」と読める上端として選んだ値。
    // scene.ts 側で倍率を掛けてからマテリアルへ渡すので、この数値がそのまま roughness ではない
    pane.addBinding(p, "roughness", { min: 0, max: 0.6, step: 0.01, label: "ガラスの粗さ" })
    pane.addBinding(p, "glassType", { readonly: true, label: "ガラスの種類" })
  }}
/>
