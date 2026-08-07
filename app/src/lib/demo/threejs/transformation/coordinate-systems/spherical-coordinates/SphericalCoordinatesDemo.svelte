<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createSphericalCoordinatesScene, type SphericalCoordinatesParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする
  const params: SphericalCoordinatesParams = { r: 1.4, thetaDeg: 55, phiDeg: 40 }

  // z 軸を上に立てると、y 軸はワールドの奥（-z）を向く。
  // x 軸と y 軸の両方が手前へ来る向きから見ると、φ が手前を横切るので読みやすい
  const cameraPosition: [number, number, number] = [4.4, 3, -4.4]
</script>

<ThreeDemoCanvas
  ariaLabel="球面座標が指す1点の3次元表示。z軸を上に立てた3本の座標軸、原点から点までの線分（長さr）、z軸からの傾きθの扇形、xy平面へ投影した線分とx軸からの回転角φの扇形、点からz軸へおろした垂線、点までをx成分・y成分・z成分の順にたどる折れ線（ドラッグで回転、ホイールで拡大縮小）"
  createScene={createSphericalCoordinatesScene}
  {params}
  aspectRatio="16 / 10"
  camera={{ position: cameraPosition }}
  orbit={{
    minDistance: 3.5,
    maxDistance: 16,
    minPolarAngle: Math.PI * 0.06,
    maxPolarAngle: Math.PI * 0.94
  }}
  buildPane={(pane, p) => {
    pane.addBinding(p, "r", { min: 0.5, max: 1.8, step: 0.01, label: "r（原点からの距離）" })
    pane.addBinding(p, "thetaDeg", {
      min: 0,
      max: 180,
      step: 1,
      format: (value: number) => `${value.toFixed(0)}°`,
      label: "θ（z軸からの傾き）"
    })
    pane.addBinding(p, "phiDeg", {
      min: 0,
      max: 360,
      step: 1,
      format: (value: number) => `${value.toFixed(0)}°`,
      label: "φ（xy平面上の回転角）"
    })
  }}
/>
