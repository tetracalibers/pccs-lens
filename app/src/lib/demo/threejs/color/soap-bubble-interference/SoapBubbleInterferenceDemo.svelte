<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import {
    createSoapBubbleInterferenceScene,
    MAX_THICKNESS_NM,
    MIN_THICKNESS_NM,
    type SoapBubbleInterferenceParams
  } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする。
  // 初期値は、注目点でも球の正面でも鮮やかな色が出る厚み。
  // むらは実際のシャボン玉に近い見た目になる値から始める。
  // 光路差と波長は scene.ts が計算して書き戻す表示用の値
  const params: SoapBubbleInterferenceParams = {
    thicknessNm: 400,
    unevenness: 0.6,
    opticalPathDifference: "",
    reinforcedWavelength: ""
  }
</script>

<ThreeDemoCanvas
  ariaLabel="シャボン玉を模した球の3次元表示。膜の外側と内側で反射した光が干渉し、膜の厚みと見る角度で決まる色が球面に現れる。球面の1点については、その点の膜を拡大した断面と、強め合っている波長の帯を並べて示す（ドラッグで回転）"
  createScene={createSoapBubbleInterferenceScene}
  {params}
  aspectRatio="16 / 10"
  camera={{ position: [0, 0, 5.2] }}
  orbit={{
    enableZoom: false,
    minAzimuthAngle: Math.PI * -0.14,
    maxAzimuthAngle: Math.PI * 0.3,
    minPolarAngle: Math.PI * 0.32,
    maxPolarAngle: Math.PI * 0.54
  }}
  buildPane={(pane, p) => {
    pane.addBinding(p, "thicknessNm", {
      min: MIN_THICKNESS_NM,
      max: MAX_THICKNESS_NM,
      step: 1,
      format: (value: number) => `${value.toFixed(0)} nm`,
      label: "膜の厚み"
    })
    pane.addBinding(p, "unevenness", { min: 0, max: 1, step: 0.01, label: "厚みのむら" })
    pane.addBinding(p, "opticalPathDifference", { readonly: true, label: "注目点の光路差" })
    pane.addBinding(p, "reinforcedWavelength", { readonly: true, label: "最も強め合う波長" })
  }}
/>
