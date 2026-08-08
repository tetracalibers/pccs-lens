<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createAxonometricScene, type AxonometricParams } from "./scene"

  /** プリセットで選べる向きの名前 */
  type PresetName = "isometric" | "dimetric" | "trimetric"

  /**
   * 3 種類の軸測投影ちょうどになる、投影面に垂直な向き。
   * スライダーを動かして偶然に合わせられる値ではないので、選んで飛べるようにする。
   *
   * - 等測：投影面に垂直な向きが (1, 1, 1) のとき。3 軸が投影面と等しい角をなす
   * - 二等測：x 軸と y 軸の縮み率が等しく、z 軸だけがその半分になるとき
   * - 不等測：3 軸の縮み率がどれも異なる向きの一例
   */
  const PRESETS: Record<PresetName, { azimuthDeg: number; elevationDeg: number }> = {
    isometric: { azimuthDeg: 45, elevationDeg: 35.26 },
    dimetric: { azimuthDeg: 20.7, elevationDeg: 19.47 },
    trimetric: { azimuthDeg: 55, elevationDeg: 45 }
  }

  const PRESET_OPTIONS: Record<string, PresetName> = {
    等測: "isometric",
    二等測: "dimetric",
    不等測: "trimetric"
  }

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする。
  // 縮み率・なす角・種類は scene.ts が計算して書き戻す表示用の値なので、初期値は使われない
  const params: AxonometricParams = { ...PRESETS.isometric, scales: "", angles: "", kind: "" }

  // プリセットの選択は scene.ts が読まない（角度に移すだけ）ので、params とは分けて持つ
  const selection: { preset: PresetName } = { preset: "isometric" }
</script>

<ThreeDemoCanvas
  ariaLabel="左に、座標軸に沿って置かれた立方体と、その向こう側に置かれた投影面。立方体の各頂点から投影面へ垂直に下ろした投射線と、投影面に写った像が描かれる。右に、その像を正面から見たもので、像の上の3つの座標軸と、縮まなかったときの軸の先を示す円が描かれる。投影面に垂直な向きを方位角・仰角で変えると、3軸の縮み率と軸どうしのなす角が変わる（ホイールで拡大縮小、回転はしない）"
  createScene={createAxonometricScene}
  {params}
  aspectRatio="16 / 9"
  camera={{ position: [0, 0, 5.6] }}
  orbit={{
    // 像を正面から読み取る図なので回転させない（軸のなす角と縮み率が正しく見えなくなる）。
    // カメラは xy 平面の正面（+z）に置いてあるので、ズームは図が正面のまま拡大縮小する動きになる
    enableRotate: false,
    minDistance: 3,
    maxDistance: 12
  }}
  buildPane={(pane, p) => {
    const asDegrees = (value: number) => `${value.toFixed(2)}°`

    // 選ぶと 3 種類ちょうどの向きへ飛ぶ。飛んだあとにスライダーを動かしても選択はそのまま残るので、
    // 今どの種類になっているかは下の「種類」で読む
    const preset = pane.addBinding(selection, "preset", {
      options: PRESET_OPTIONS,
      label: "プリセットへ合わせる"
    })
    const azimuth = pane.addBinding(p, "azimuthDeg", {
      min: 5,
      max: 85,
      step: 0.01,
      format: asDegrees,
      label: "方位角"
    })
    const elevation = pane.addBinding(p, "elevationDeg", {
      min: 5,
      max: 80,
      step: 0.01,
      format: asDegrees,
      label: "仰角"
    })

    preset.on("change", (event) => {
      p.azimuthDeg = PRESETS[event.value].azimuthDeg
      p.elevationDeg = PRESETS[event.value].elevationDeg
      // スライダーの表示を書き換えた値に追従させる
      azimuth.refresh()
      elevation.refresh()
    })

    pane.addBinding(p, "scales", { readonly: true, label: "縮み率（x / y / z）" })
    pane.addBinding(p, "angles", { readonly: true, label: "軸のなす角（xy / yz / zx）" })
    pane.addBinding(p, "kind", { readonly: true, label: "種類" })
  }}
/>
