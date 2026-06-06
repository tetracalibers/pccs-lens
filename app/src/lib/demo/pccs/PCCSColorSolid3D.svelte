<script lang="ts">
  import { onDestroy } from "svelte"
  import { browser } from "$app/environment"
  import { Canvas, T } from "@threlte/core"
  import { OrbitControls } from "@threlte/extras"
  import {
    BoxGeometry,
    Color,
    InstancedMesh,
    Matrix4,
    MeshBasicMaterial,
    Quaternion,
    Vector3
  } from "three"
  import chroma from "chroma-js"
  import { PCCS_ALL } from "$lib/data/pccs"

  // ===== PCCS の構成 =====
  /** 色相数（PCCS は 24 色相） */
  const HUE_COUNT = 24

  // ===== ワールド座標へのスケール =====
  // 位置は各色の実測 sRGB を CIELAB に変換して決める（Munsell 版が実測値を使うのと同様）。
  //   明度（縦）  = L*（0〜100）
  //   彩度（半径）= C*ab = √(a*² + b*²)
  //   色相（角度）= PCCS 色相番号（1〜24）
  // Lab はほぼ知覚均等なので、明度・彩度は同じ係数（1:1）でワールドへ写す。
  /** L* 1 あたりの高さ */
  const LIGHTNESS_UNIT = 0.1
  /** C*ab 1 あたりの半径方向距離 */
  const CHROMA_UNIT = 0.1

  // ===== チップ（色票）=====
  // 各チップは軸に平行な立方体（向きを揃えると敷き詰めた見た目になる）。
  // 一辺は隣接チップ間隔の中央値（≈ 0.78）よりやや大きめにして、できるだけ隙間なく
  // 敷き詰める（密集する中心部はやや重なるが、不透明なので塊として見える）。
  const CUBE = 0.85

  // ===== カメラ・操作 =====
  const CAMERA_FOV = 45
  // 初期カメラ位置はジオメトリから自動算出するため（後述の FIT_DISTANCE）、
  // LIGHTNESS_UNIT / CHROMA_UNIT を変更しても初期表示で色立体全体が収まる。
  /** 注視点から見た初期カメラ方向（方位 45°・仰角 22° の 3/4 ビュー） */
  const VIEW_AZIMUTH = Math.PI / 4
  const VIEW_ELEVATION = (22 * Math.PI) / 180
  /** フィット距離にどれだけ余白を足すか（1 でぴったり、>1 でわずかに引く） */
  const VIEW_MARGIN = 1.05
  // 真上・真下まで回り込むと色立体が線に潰れて見えるため、極角に余裕を持たせる
  const MIN_POLAR_ANGLE = Math.PI * 0.12
  const MAX_POLAR_ANGLE = Math.PI * 0.86

  type Chip = {
    key: string
    position: [number, number, number]
    color: string
  }

  function buildChips(): Chip[] {
    const chips: Chip[] = []
    const anglePerHue = (2 * Math.PI) / HUE_COUNT

    for (const color of PCCS_ALL) {
      const [lstar, astar, bstar] = chroma(color.hex).lab()
      const y = lstar * LIGHTNESS_UNIT

      // 無彩色（Bk + グレイ15色 + W = 17色）は中心の明度軸へ
      if (color.isNeutral || color.hueNumber == null) {
        chips.push({ key: color.notation, position: [0, y, 0], color: color.hex })
        continue
      }

      // 有彩色: 色相番号で角度、C*ab で半径
      const radius = Math.hypot(astar, bstar) * CHROMA_UNIT
      // 色相番号 1 を角度 0 に置き、時計回りに 24 等分。num と num+12 は 180°（補色）になる。
      const theta = (color.hueNumber - 1) * anglePerHue
      chips.push({
        key: color.notation,
        position: [Math.cos(theta) * radius, y, Math.sin(theta) * radius],
        color: color.hex
      })
    }

    return chips
  }

  const chips = buildChips()

  // 色立体の高さ中心（最小・最大 y の中点）。OrbitControls の注視点に使う。
  const CENTER_Y =
    chips.reduce((acc, ch) => Math.min(acc, ch.position[1]), Infinity) / 2 +
    chips.reduce((acc, ch) => Math.max(acc, ch.position[1]), -Infinity) / 2

  /**
   * 全チップを 1 つの THREE.InstancedMesh にまとめる。
   *
   * `<Instance>`（Threlte コンポーネント）を多数生成するとマウントが重くなるため、
   * 行列・色を JS のループで直接書き込む。描画は GPU インスタンシングで 1 ドローコール。
   * 全チップが同じ向き・同じ大きさの立方体なので、回転は単位回転・スケールは共通。
   */
  function buildInstancedMesh(): InstancedMesh {
    const mesh = new InstancedMesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial(), chips.length)
    const matrix = new Matrix4()
    const position = new Vector3()
    const quaternion = new Quaternion() // 単位回転（軸平行）
    const scale = new Vector3(CUBE, CUBE, CUBE)
    const color = new Color()

    chips.forEach((ch, i) => {
      position.set(ch.position[0], ch.position[1], ch.position[2])
      matrix.compose(position, quaternion, scale)
      mesh.setMatrixAt(i, matrix)
      mesh.setColorAt(i, color.set(ch.color))
    })

    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    // 全インスタンスが常に画面内にあるので個別カリングは不要（誤カリング防止のため無効化）
    mesh.frustumCulled = false
    return mesh
  }

  const colorSolid = buildInstancedMesh()

  onDestroy(() => {
    colorSolid.geometry.dispose()
    ;(colorSolid.material as MeshBasicMaterial).dispose()
  })

  // 注視点と、そこから見た初期カメラ方向（単位ベクトル）
  const TARGET: [number, number, number] = [0, CENTER_Y, 0]
  const VIEW_DIR: [number, number, number] = [
    Math.cos(VIEW_ELEVATION) * Math.cos(VIEW_AZIMUTH),
    Math.sin(VIEW_ELEVATION),
    Math.cos(VIEW_ELEVATION) * Math.sin(VIEW_AZIMUTH)
  ]

  /**
   * 全チップが視錐台にちょうど収まる最小カメラ距離（canvas にフィットさせる距離）。
   *
   * カメラ基底 (right, up, forward) を作り、各チップを right/up 軸へ射影する。
   * 点が画面に収まる条件は `|proj| ≤ (depth) * tan(fov/2)` なので、距離 D について
   * `D ≥ |proj| / tan(fov/2) − depth` を満たす最大値が必要距離になる。
   * 正方形 canvas（aspect=1）なので横 fov と縦 fov は等しく、両軸とも同じ tan を使う。
   * 立方体の大きさ（空間対角の半分）も加味してはみ出しを防ぐ。
   */
  function computeFitDistance(): number {
    const f: [number, number, number] = [-VIEW_DIR[0], -VIEW_DIR[1], -VIEW_DIR[2]]
    // right = normalize(cross(forward, worldUp(0,1,0)))
    const rl = Math.hypot(-f[2], f[0])
    const r: [number, number, number] = [-f[2] / rl, 0, f[0] / rl]
    // up = cross(right, forward)
    const u: [number, number, number] = [
      r[1] * f[2] - r[2] * f[1],
      r[2] * f[0] - r[0] * f[2],
      r[0] * f[1] - r[1] * f[0]
    ]
    const tanHalfFov = Math.tan((CAMERA_FOV * Math.PI) / 360)
    const chipR = 0.5 * Math.sqrt(3) * CUBE // 立方体の外接球半径

    let dist = 0
    for (const ch of chips) {
      const dx = ch.position[0] - TARGET[0]
      const dy = ch.position[1] - TARGET[1]
      const dz = ch.position[2] - TARGET[2]
      const depth = dx * f[0] + dy * f[1] + dz * f[2]
      const h = dx * r[0] + dy * r[1] + dz * r[2]
      const w = dx * u[0] + dy * u[1] + dz * u[2]
      const needH = (Math.abs(h) + chipR) / tanHalfFov - (depth - chipR)
      const needW = (Math.abs(w) + chipR) / tanHalfFov - (depth - chipR)
      dist = Math.max(dist, needH, needW)
    }
    return dist
  }

  const FIT_DISTANCE = computeFitDistance() * VIEW_MARGIN

  // 注視点から VIEW_DIR 方向へ FIT_DISTANCE 離した位置にカメラを置く
  const CAMERA_POSITION: [number, number, number] = [
    TARGET[0] + VIEW_DIR[0] * FIT_DISTANCE,
    TARGET[1] + VIEW_DIR[1] * FIT_DISTANCE,
    TARGET[2] + VIEW_DIR[2] * FIT_DISTANCE
  ]
  // ズーム範囲も初期距離を基準に決める
  const MIN_DISTANCE = FIT_DISTANCE * 0.45
  const MAX_DISTANCE = FIT_DISTANCE * 2.2
</script>

<div class="solid-3d" role="img" aria-label="PCCSの色立体の3次元表示（ドラッグで回転）">
  {#if browser}
    <Canvas>
      <T.PerspectiveCamera makeDefault fov={CAMERA_FOV} position={CAMERA_POSITION}>
        <OrbitControls
          enablePan={false}
          enableDamping
          target={[0, CENTER_Y, 0]}
          minDistance={MIN_DISTANCE}
          maxDistance={MAX_DISTANCE}
          minPolarAngle={MIN_POLAR_ANGLE}
          maxPolarAngle={MAX_POLAR_ANGLE}
        />
      </T.PerspectiveCamera>

      <!-- 全色票を 1 つの InstancedMesh にまとめて描画（陰影なし MeshBasicMaterial で hex を忠実表示） -->
      <T is={colorSolid} />
    </Canvas>
  {/if}
</div>

<style>
  .solid-3d {
    position: relative;
    width: 100%;
    aspect-ratio: 1 / 1;
    border: 1px solid light-dark(var(--color-body--dark), var(--color-body--light));
    /* OrbitControls のドラッグ中にページがスクロールしないようにする */
    touch-action: none;
    cursor: grab;
  }

  .solid-3d:active {
    cursor: grabbing;
  }
</style>
