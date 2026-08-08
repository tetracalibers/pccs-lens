<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createObliqueScene, type ObliqueParams } from "./scene"

  /** プリセットで選べる図の名前 */
  type PresetName = "cavalier" | "cabinet"

  /**
   * カバリエ図とキャビネット図ちょうどになる奥行きの倍率。
   * スライダーでも合わせられる値だが、名前と数値の対応を示すために選べるようにする
   */
  const PRESETS: Record<PresetName, { depthScale: number }> = {
    cavalier: { depthScale: 1 },
    cabinet: { depthScale: 0.5 }
  }

  const PRESET_OPTIONS: Record<string, PresetName> = {
    カバリエ図: "cavalier",
    キャビネット図: "cabinet"
  }

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする。
  // 投射線が投影面となす角は scene.ts が計算して書き戻す表示用の値なので、初期値は使われない
  const params: ObliqueParams = {
    ...PRESETS.cavalier,
    depthAngleDeg: 45,
    showSkewed: false,
    rayAngle: ""
  }

  // プリセットの選択は scene.ts が読まない（倍率に移すだけ）ので、params とは分けて持つ
  const selection: { preset: PresetName } = { preset: "cavalier" }
</script>

<ThreeDemoCanvas
  ariaLabel="左に、投影面に面を接した立方体と、その投影面。立方体の各頂点から投影面へ斜めに引いた投射線と、投影面に写った像が描かれる。右に、その像を正面から見たもので、像の上の3つの座標軸と、縮まなかったときの軸の先を示す円が描かれる。奥行きの倍率と向きを変えると、像の上で奥行きの辺の長さと向きが変わる（左の図はドラッグで回転、ホイールで拡大縮小）"
  createScene={createObliqueScene}
  {params}
  aspectRatio="16 / 9"
  camera={{ position: [0, 0, 5.6] }}
  orbit={{
    // カメラは回さない。右の図は像を正面から読み取るためのもので、傾けると長さの比も角度も
    // 読めなくなるため。左の図だけを回す操作は scene.ts 側でドラッグに割り当てている。
    // カメラは xy 平面の正面（+z）に置いてあるので、ズームは図が正面のまま拡大縮小する動きになる
    enableRotate: false,
    minDistance: 3,
    maxDistance: 12
  }}
  buildPane={(pane, p) => {
    // 選ぶと 2 つの図ちょうどの倍率へ飛ぶ。飛んだあとにスライダーを動かしても選択はそのまま残る
    const preset = pane.addBinding(selection, "preset", {
      options: PRESET_OPTIONS,
      label: "代表的な図に合わせる"
    })
    const depthScale = pane.addBinding(p, "depthScale", {
      min: 0,
      max: 1,
      step: 0.01,
      format: (value: number) => value.toFixed(2),
      label: "奥行きの倍率"
    })
    pane.addBinding(p, "depthAngleDeg", {
      min: 15,
      max: 75,
      step: 1,
      format: (value: number) => `${value.toFixed(0)}°`,
      label: "奥行きの向き"
    })

    preset.on("change", (event) => {
      p.depthScale = PRESETS[event.value].depthScale
      // スライダーの表示を書き換えた値に追従させる
      depthScale.refresh()
    })

    pane.addBinding(p, "rayAngle", { readonly: true, label: "投射線が投影面となす角" })
    pane.addBinding(p, "showSkewed", { label: "スキューさせた形状を重ねる" })
  }}
/>
