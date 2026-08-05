<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createCylindricalCoordinatesScene, type CylindricalCoordinatesParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする
  const params: CylindricalCoordinatesParams = { r: 1.2, thetaDeg: 50, z: 0.9 }

  // z 軸を上に立てると、y 軸はワールドの奥（-z）を向く。
  // x 軸と y 軸の両方が手前へ来る向きから見ると、θ が手前を横切るので読みやすい
  const cameraPosition: [number, number, number] = [4.4, 3, -4.4]
</script>

<ThreeDemoCanvas
  ariaLabel="円柱座標が指す1点の3次元表示。z軸を上に立てた3本の座標軸、xy平面上で原点から伸びる線分（長さr）、x軸からの回転角θの扇形、その線分の先から点までの縦の線分（高さz）、θを1周させたときに点が描く円（ドラッグで回転、ホイールで拡大縮小）"
  createScene={createCylindricalCoordinatesScene}
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
    pane.addBinding(p, "r", { min: 0.4, max: 1.8, step: 0.01, label: "r（xy平面上の距離）" })
    pane.addBinding(p, "thetaDeg", {
      min: 0,
      max: 360,
      step: 1,
      format: (value: number) => `${value.toFixed(0)}°`,
      label: "θ（xy平面上の回転角）"
    })
    pane.addBinding(p, "z", { min: -1.5, max: 1.5, step: 0.01, label: "z（高さ）" })
  }}
/>
