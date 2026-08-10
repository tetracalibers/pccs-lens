<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import {
    createSoapBubbleInterferenceScene,
    MAX_THICKNESS_NM,
    MIN_THICKNESS_NM,
    type SoapBubbleInterferenceParams
  } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする。
  // 初期値は、正面あたりで黄緑が強め合う厚み。むらは実際のシャボン玉に近い見た目になる値から始める
  const params: SoapBubbleInterferenceParams = { thicknessNm: 320, unevenness: 0.6 }
</script>

<ThreeDemoCanvas
  ariaLabel="シャボン玉を模した球の3次元表示。膜の外側と内側で反射した光が干渉し、膜の厚みと見る角度で決まる色が球面に現れる（ドラッグで回転）"
  createScene={createSoapBubbleInterferenceScene}
  {params}
  camera={{ position: [0, 0, 3.2] }}
  orbit={{ enableZoom: false }}
  buildPane={(pane, p) => {
    pane.addBinding(p, "thicknessNm", {
      min: MIN_THICKNESS_NM,
      max: MAX_THICKNESS_NM,
      step: 1,
      format: (value: number) => `${value.toFixed(0)} nm`,
      label: "膜の厚み"
    })
    pane.addBinding(p, "unevenness", { min: 0, max: 1, step: 0.01, label: "厚みのむら" })
  }}
/>
