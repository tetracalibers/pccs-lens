<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createPointAndDirectionScene, type PointAndDirectionParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする。
  // tx・ty は、2 点が w 軸から離れた位置に出る値から始める。
  // Q の向きは軸と重ならない角度にして、方向ベクトルの矢印が x 軸と見分けられるようにする。
  // point・direction は scene.ts が計算して書き戻す表示用の値なので、初期値は使われない
  const params: PointAndDirectionParams = {
    tx: 0.85,
    ty: 0.65,
    angle: 35,
    length: 1.1,
    point: "",
    direction: ""
  }
</script>

<ThreeDemoCanvas
  ariaLabel="同次座標(x, y, w)のwを3本目の軸にとった3次元表示。位置を表す2点P・Qはw=1の平面に乗り、その差として得られる方向ベクトルQ−Pはwが0なのでw=0の平面に寝ている。tx・tyを動かすと、同じ平行移動の行列を掛けているにもかかわらず、点だけがw=1の平面内を動き、方向ベクトルはまったく動かない（ドラッグで回転、ホイールで拡大縮小）"
  createScene={createPointAndDirectionScene}
  {params}
  aspectRatio="3 / 2"
  camera={{ position: [4.2, 3, 5.2] }}
  orbit={{
    // w = 0 の平面と w = 1 の平面の両方が視野に入るよう、注視点を両者の中間に置く
    target: [0, 0, 0.5],
    minDistance: 3.5,
    maxDistance: 14
  }}
  buildPane={(pane, p) => {
    // 移動量と距離は、移動後の 2 点が w = 1 の平面に収まる範囲までにする
    pane.addBinding(p, "tx", { min: -1, max: 1, step: 0.01, label: "tx" })
    pane.addBinding(p, "ty", { min: -1, max: 1, step: 0.01, label: "ty" })
    pane.addBinding(p, "angle", { min: 0, max: 360, step: 1, label: "Qの向き" })
    pane.addBinding(p, "length", { min: 0.4, max: 1.2, step: 0.01, label: "PからQまでの距離" })
    pane.addBinding(p, "point", { readonly: true, label: "点 P" })
    pane.addBinding(p, "direction", { readonly: true, label: "方向ベクトル Q − P" })
  }}
/>
