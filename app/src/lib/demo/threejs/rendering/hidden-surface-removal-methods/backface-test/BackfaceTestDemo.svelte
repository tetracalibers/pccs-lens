<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createBackfaceTestScene, type BackfaceTestParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする。
  // 視点の方位 45 度は、立方体の 6 面がちょうど表 3 枚・裏 3 枚に分かれ、
  // 注目する面（+z の面）が鋭角の側に入る向き。
  // 表示用の 2 つの文字列は scene.ts が計算して書き戻すので、初期値は使われない
  const params: BackfaceTestParams = {
    eyeAzimuth: 45,
    cullBackFaces: false,
    measure: "",
    remaining: ""
  }
</script>

<!-- カメラは注目する面の正面から 35 度ほど回した位置に置く。
     面の向きと、そこから右手へ伸びる視点方向ベクトルの両方が見える構図になる -->
<ThreeDemoCanvas
  ariaLabel="半透明の立方体と、そこから離して置いた1つの視点の3次元表示。手前の1面にだけ、面に垂直な法線ベクトルと、面から視点へ向かう視点方向ベクトル、その2つがなす角を示す扇を添えている。視点の方位を動かすと扇の広がりが直角をまたいで変わり、鈍角になった面では視点方向ベクトルが立方体の内部を貫く。面の色は表を向いた面と裏を向いた面で分かれ、裏面を外すと裏を向いた面が消える（ドラッグで回転、ホイールで拡大縮小）"
  createScene={createBackfaceTestScene}
  {params}
  aspectRatio="16 / 9"
  camera={{ position: [-4.6, 3.2, 6.5] }}
  orbit={{
    // 視点マーカーとラベルが上に出るので、注視点を立方体の中心より少し上に置く
    target: [0, 0.2, 0],
    minDistance: 5,
    maxDistance: 16,
    // 真上・真下から見ると扇が潰れて読めなくなるため、極付近まで回さない
    minPolarAngle: Math.PI * 0.14,
    maxPolarAngle: Math.PI * 0.78
  }}
  buildPane={(pane, p) => {
    pane.addBinding(p, "eyeAzimuth", { min: -180, max: 180, step: 1, label: "視点の方位" })
    pane.addBinding(p, "cullBackFaces", { label: "裏面を外す" })
    pane.addBinding(p, "measure", { readonly: true, label: "nとeのなす角" })
    pane.addBinding(p, "remaining", { readonly: true, label: "残る面" })
  }}
/>
