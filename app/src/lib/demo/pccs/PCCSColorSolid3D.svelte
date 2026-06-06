<script lang="ts">
  import { onDestroy } from "svelte"
  import { browser } from "$app/environment"
  import { Canvas, T } from "@threlte/core"
  import { OrbitControls } from "@threlte/extras"
  import {
    BoxGeometry,
    BufferGeometry,
    Color,
    InstancedMesh,
    Matrix4,
    MeshBasicMaterial,
    NoToneMapping,
    Quaternion,
    SphereGeometry,
    Vector3
  } from "three"
  import chroma from "chroma-js"
  import { PCCS_ALL } from "$lib/data/pccs"

  // ===== PCCS の構成 =====
  /** 色相数（PCCS は 24 色相） */
  const HUE_COUNT = 24

  // ===== ワールド座標へのスケール =====
  // 位置は各色の実測 sRGB を CIELAB に変換して決める（Munsell 版が実測値を使うのと同様）。
  //   明度（縦）  = L*（0〜100）の実測値
  //   彩度（半径）= トーンごとの平均 C*ab（同一トーンは全色相で同半径＝上から見て正円になる）
  //   色相（角度）= PCCS 色相番号（1〜24）
  // 明度（縦）の係数を彩度（横）より大きくして、横から見たときに縦長の色立体にする。
  // 無彩色軸の球（最小間隔 ≈ 4.67 L*）が重ならないよう、直径 / 4.67 ≈ 0.182 以上にしている。
  /** L* 1 あたりの高さ。大きいほど縦長（≈0.182 未満だと無彩色軸の球が重なる）。 */
  const LIGHTNESS_UNIT = 0.13
  /** C*ab 1 あたりの半径方向距離 */
  const CHROMA_UNIT = 0.1

  // ===== チップ（色票）=====
  // 各チップは球。直径は隣接チップ間隔の中央値（≈ 0.78）よりやや大きめにして、できるだけ
  // 隙間なく敷き詰める（密集する中心部はやや重なるが、不透明なので塊として見える）。
  const CHIP_DIAMETER = 0.85
  /** 球の分割数（多いほど滑らかだが頂点が増える） */
  const SPHERE_SEGMENTS = 16

  // 球の当たり判定半径（フィット計算と near/far の算出に使う）。立方体側は CUBE_SIDE 確定後に算出。
  const SPHERE_RADIUS = 0.5 * CHIP_DIAMETER

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
    shape: "sphere" | "cube"
    color: string
  }

  function buildChips(): Chip[] {
    const chips: Chip[] = []
    const anglePerHue = (2 * Math.PI) / HUE_COUNT

    // 上から見て正円にするため、半径は「トーンごとの平均 C*ab」で決める（同じトーンは全色相で
    // 同じ半径＝同心円になる）。高さ(L*)は各色の実測値のまま残し、特有の傾いた構造を保つ。
    type Chromatic = { notation: string; hex: string; tone: string; hueNumber: number; y: number }
    const chromatic: Chromatic[] = []
    const toneCstar = new Map<string, { sum: number; count: number }>()

    for (const color of PCCS_ALL) {
      const [lstar, astar, bstar] = chroma(color.hex).lab()
      const y = lstar * LIGHTNESS_UNIT

      // 無彩色（Bk + グレイ15色 + W = 17色）は中心の明度軸へ。立方体で描く。
      if (color.isNeutral || color.hueNumber == null) {
        chips.push({ key: color.notation, position: [0, y, 0], shape: "cube", color: color.hex })
        continue
      }

      const tone = color.toneSymbol ?? ""
      chromatic.push({ notation: color.notation, hex: color.hex, tone, hueNumber: color.hueNumber, y })
      const acc = toneCstar.get(tone) ?? { sum: 0, count: 0 }
      acc.sum += Math.hypot(astar, bstar)
      acc.count += 1
      toneCstar.set(tone, acc)
    }

    // 有彩色: 色相番号で角度、トーン平均 C*ab で半径
    for (const c of chromatic) {
      const acc = toneCstar.get(c.tone)!
      const radius = (acc.sum / acc.count) * CHROMA_UNIT
      // 色相番号 1 を角度 0 に置き、時計回りに 24 等分。num と num+12 は 180°（補色）になる。
      const theta = (c.hueNumber - 1) * anglePerHue
      chips.push({
        key: c.notation,
        position: [Math.cos(theta) * radius, c.y, Math.sin(theta) * radius],
        shape: "sphere",
        color: c.hex
      })
    }

    return chips
  }

  const chips = buildChips()
  const sphereChips = chips.filter((c) => c.shape === "sphere")
  const cubeChips = chips.filter((c) => c.shape === "cube")

  // 無彩色の立方体は縦に重なると、重なった不透明面が回転中に z ファイティング（チラつき）を
  // 起こす。隣り合う無彩色チップの最小間隔より少し小さい一辺にして重なり・接触を防ぐ
  // （球より大きくはしない）。LIGHTNESS_UNIT を変えても自動追従する。
  const cubeYs = cubeChips.map((c) => c.position[1]).sort((a, b) => a - b)
  let minNeutralGap = Infinity
  for (let i = 1; i < cubeYs.length; i++) {
    minNeutralGap = Math.min(minNeutralGap, cubeYs[i] - cubeYs[i - 1])
  }
  const CUBE_SIDE = Math.min(CHIP_DIAMETER, minNeutralGap * 0.92)
  const CUBE_RADIUS = 0.5 * Math.sqrt(3) * CUBE_SIDE // 立方体の外接球半径

  // 色立体の高さ中心（最小・最大 y の中点）。OrbitControls の注視点に使う。
  const CENTER_Y =
    chips.reduce((acc, ch) => Math.min(acc, ch.position[1]), Infinity) / 2 +
    chips.reduce((acc, ch) => Math.max(acc, ch.position[1]), -Infinity) / 2

  /**
   * 指定ジオメトリとチップ群から 1 つの THREE.InstancedMesh を作る。
   *
   * `<Instance>`（Threlte コンポーネント）を多数生成するとマウントが重くなるため、
   * 行列・色を JS のループで直接書き込む。描画は形状ごとに 1 ドローコール。
   * 各チップは単位回転で、メッシュ内では同じ大きさ（引数 size）。
   * ジオメトリは基準サイズ 1（球は直径 1・立方体は一辺 1）とし、size 倍する。
   */
  function buildInstancedMesh(geometry: BufferGeometry, items: Chip[], size: number): InstancedMesh {
    const mesh = new InstancedMesh(geometry, new MeshBasicMaterial(), items.length)
    const matrix = new Matrix4()
    const position = new Vector3()
    const quaternion = new Quaternion() // 単位回転
    const scale = new Vector3(size, size, size)
    const color = new Color()

    items.forEach((ch, i) => {
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

  // 有彩色チップは球、無彩色軸チップは（縦の重なりを避けて小さめにした）立方体で描画する
  const sphereSolid = buildInstancedMesh(
    new SphereGeometry(0.5, SPHERE_SEGMENTS, SPHERE_SEGMENTS),
    sphereChips,
    CHIP_DIAMETER
  )
  const cubeSolid = buildInstancedMesh(new BoxGeometry(1, 1, 1), cubeChips, CUBE_SIDE)

  onDestroy(() => {
    for (const mesh of [sphereSolid, cubeSolid]) {
      mesh.geometry.dispose()
      ;(mesh.material as MeshBasicMaterial).dispose()
    }
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
   * 球の半径も加味してはみ出しを防ぐ。
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

    let dist = 0
    for (const ch of chips) {
      const dx = ch.position[0] - TARGET[0]
      const dy = ch.position[1] - TARGET[1]
      const dz = ch.position[2] - TARGET[2]
      const depth = dx * f[0] + dy * f[1] + dz * f[2]
      const h = dx * r[0] + dy * r[1] + dz * r[2]
      const w = dx * u[0] + dy * u[1] + dz * u[2]
      const chipR = ch.shape === "cube" ? CUBE_RADIUS : SPHERE_RADIUS
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

  // 近接面・遠方面をシーンにぴったり合わせて深度精度を上げ、チップ同士の z ファイティング
  // （回転時のチラつき）を防ぐ。three 既定の near=0.1 / far≈2000 は精度が粗く、
  // 中心軸付近で重なる面がチラつく原因になる。
  const BOUNDING_RADIUS = chips.reduce((m, ch) => {
    const dx = ch.position[0] - TARGET[0]
    const dy = ch.position[1] - TARGET[1]
    const dz = ch.position[2] - TARGET[2]
    const radius = ch.shape === "cube" ? CUBE_RADIUS : SPHERE_RADIUS
    return Math.max(m, Math.hypot(dx, dy, dz) + radius)
  }, 0)
  const NEAR = Math.max(0.1, (MIN_DISTANCE - BOUNDING_RADIUS) * 0.8)
  const FAR = MAX_DISTANCE + BOUNDING_RADIUS
</script>

<div class="solid-3d" role="img" aria-label="PCCSの色立体の3次元表示（ドラッグで回転）">
  {#if browser}
    <!-- Threlte の既定は AgX トーンマッピングで鮮やかな色が褪せるため無効化し、hex を忠実に出す -->
    <Canvas toneMapping={NoToneMapping}>
      <T.PerspectiveCamera
        makeDefault
        fov={CAMERA_FOV}
        position={CAMERA_POSITION}
        near={NEAR}
        far={FAR}
      >
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

      <!-- 有彩色は球、無彩色軸は立方体。陰影なし MeshBasicMaterial で hex を忠実表示 -->
      <T is={sphereSolid} />
      <T is={cubeSolid} />
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
