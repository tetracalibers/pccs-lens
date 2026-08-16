<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createStandardToGeneralScene, type StandardToGeneralParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする。
  // 初期値は平行移動だけを与えた状態にして、1 次の項が現れる一方で xy の項が 0 のままであることが
  // 先に目に入るようにする。a から f は scene.ts が計算して書き戻すので、初期値は使われない
  const params: StandardToGeneralParams = {
    tx: 0.6,
    ty: 0.4,
    angleDeg: 0,
    a: 0,
    b: 0,
    c: 0,
    d: 0,
    e: 0,
    f: 0
  }

  // 係数が 0 のときに丸めの残りで -0.00 と出ないようにする
  const formatCoefficient = (value: number) =>
    Math.abs(value) < 0.005 ? "0.00" : value.toFixed(2)
</script>

<ThreeDemoCanvas
  ariaLabel="xy平面上に置いた楕円の図。原点を中心とする標準形の楕円を淡く残したまま、それを平行移動・回転させた楕円を対称軸つきで重ねて描いてあり、平行移動量と回転角を動かすと、一般形 ax² + bxy + cy² + dx + ey + f = 0 の6つの係数の値が連動して変わる（ホイールで拡大縮小）"
  createScene={createStandardToGeneralScene}
  {params}
  camera={{ position: [0, 0, 7] }}
  orbit={{
    // 平面の図なので回転・パンはさせない（正面から見た向きが崩れると、対称軸と座標軸を見比べられない）
    enableRotate: false,
    minDistance: 3,
    maxDistance: 12
  }}
  buildPane={(pane, p) => {
    // 平行移動量は、楕円が座標軸の目盛りの内側に収まる範囲にする
    pane.addBinding(p, "tx", { min: -1, max: 1, step: 0.01, label: "平行移動 tx" })
    pane.addBinding(p, "ty", { min: -1, max: 1, step: 0.01, label: "平行移動 ty" })
    // 180 度まで動かせるようにして、90 度で対称軸がふたたび座標軸に重なることも見られるようにする
    pane.addBinding(p, "angleDeg", {
      min: 0,
      max: 180,
      step: 1,
      format: (value: number) => `${value.toFixed(0)}°`,
      label: "回転角"
    })
    // 一般形 ax² + bxy + cy² + dx + ey + f = 0 の係数。どの項につく係数かをラベルに添える
    const terms: [keyof StandardToGeneralParams, string][] = [
      ["a", "a（x²）"],
      ["b", "b（xy）"],
      ["c", "c（y²）"],
      ["d", "d（x）"],
      ["e", "e（y）"],
      ["f", "f（定数）"]
    ]
    for (const [key, label] of terms) {
      pane.addBinding(p, key, { readonly: true, format: formatCoefficient, label })
    }
  }}
/>
