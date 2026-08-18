<script lang="ts">
  import ThreeDemoCanvas from "$lib/demo/threejs/_shared/ThreeDemoCanvas.svelte"
  import { createEllipseFrameScene, type EllipseFrameParams } from "./scene"

  // Tweakpane が直接書き換え、scene.ts が毎フレーム読む。$state ではなくプレーンオブジェクトにする。
  // 初期値は平行移動だけを与えた状態にして、X が x だけの式になっていることが先に目に入るようにする。
  // substitutedX・substitutedY は scene.ts が計算して書き戻す表示用の値なので、初期値は使われない
  const params: EllipseFrameParams = {
    centerX: 0.8,
    centerY: 0.5,
    angleDeg: 0,
    pointDeg: 55,
    substitutedX: "",
    substitutedY: ""
  }
</script>

<!-- xy 平面をそのまま見る図なので、回り込みは付けずに正面から固定する（拡大縮小だけ残す）。
     パネルの行数が多いので canvas は横長にし、軸を伸ばした範囲が収まる距離にカメラを置く -->
<ThreeDemoCanvas
  ariaLabel="xy平面上に置いた楕円の図。楕円の中心と対称軸にとったX軸・Y軸が、画面のx軸・y軸と重ねて描かれている。楕円上に選んだ1点から両方の軸へ線が下ろされ、同じ点がXとYでも、xとyでも読めることが示される。平行移動量と回転角を動かすと、XとYを画面の座標で表した1次式が変わる（ホイールで拡大縮小）"
  createScene={createEllipseFrameScene}
  {params}
  aspectRatio="16 / 9"
  camera={{ position: [0, 0, 7] }}
  orbit={{ enableRotate: false, minDistance: 3.5, maxDistance: 13 }}
  buildPane={(pane, p) => {
    // 平行移動量は、楕円が座標軸の目盛りの内側に収まる範囲にする
    pane.addBinding(p, "centerX", { min: -1.6, max: 1.6, step: 0.05, label: "平行移動 x" })
    pane.addBinding(p, "centerY", { min: -1.2, max: 1.2, step: 0.05, label: "平行移動 y" })
    // 180 度まで動かせるようにして、90 度で対称軸がふたたび座標軸に重なることも見られるようにする
    pane.addBinding(p, "angleDeg", { min: 0, max: 180, step: 1, label: "回転角（度）" })
    pane.addBinding(p, "pointDeg", { min: 0, max: 360, step: 1, label: "点の位置（度）" })
    // 標準形に代入することになる X・Y を、画面の座標 x・y で表した式
    pane.addBinding(p, "substitutedX", { readonly: true, label: "X =" })
    pane.addBinding(p, "substitutedY", { readonly: true, label: "Y =" })
  }}
/>
