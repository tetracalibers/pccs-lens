<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import {
    CAMERA_POSITION,
    createCompactDiscDiffractionScene,
    MAX_LIGHT_ANGLE_DEG,
    MAX_TILT_DEG,
    MIN_LIGHT_ANGLE_DEG,
    MIN_TILT_DEG,
    type CompactDiscDiffractionParams
  } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする。
  // 初期値は、ディスクが立体として読め、かつ注目点にはっきりした色が出る傾きと光の向き。
  // 光路差と波長は scene.ts が計算して書き戻す表示用の値
  const params: CompactDiscDiffractionParams = {
    tiltDeg: 15,
    lightAngleDeg: 30,
    opticalPathDifference: "",
    reinforcedWavelength: ""
  }

  const formatDegrees = (value: number) => `${value.toFixed(0)}°`
</script>

<ThreeDemoCanvas
  ariaLabel="コンパクトディスクを模した円盤の3次元表示。記録面に並んだトラックで回折した光が干渉し、ディスクの傾きと光を当てる向きで決まる色が虹のように現れる。記録面の1点については、その点のピットを拡大した断面と、強め合っている波長のグラフを並べて示す（ドラッグで見る向きを変えられる）"
  createScene={createCompactDiscDiffractionScene}
  {params}
  aspectRatio="16 / 10"
  camera={{ position: CAMERA_POSITION }}
  orbit={{
    enableZoom: false,
    // 回り込みは狭い範囲に留める。ディスクを正面寄りに見る構図が前提で、
    // 解説パネルの配置もディスクが画面の左上に来ることを当て込んでいる
    minAzimuthAngle: Math.PI * -0.1,
    maxAzimuthAngle: Math.PI * 0.1,
    minPolarAngle: Math.PI * 0.34,
    maxPolarAngle: Math.PI * 0.54
  }}
  buildPane={(pane, p) => {
    pane.addBinding(p, "tiltDeg", {
      min: MIN_TILT_DEG,
      max: MAX_TILT_DEG,
      step: 1,
      format: formatDegrees,
      label: "ディスクの傾き"
    })
    pane.addBinding(p, "lightAngleDeg", {
      min: MIN_LIGHT_ANGLE_DEG,
      max: MAX_LIGHT_ANGLE_DEG,
      step: 1,
      format: formatDegrees,
      label: "光を当てる向き"
    })
    pane.addBinding(p, "opticalPathDifference", { readonly: true, label: "注目点の光路差" })
    pane.addBinding(p, "reinforcedWavelength", { readonly: true, label: "最も強め合う波長" })
  }}
/>
