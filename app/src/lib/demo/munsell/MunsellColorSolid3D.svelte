<script lang="ts">
  import { browser } from "$app/environment"
  import { Canvas, T } from "@threlte/core"
  import { InstancedMesh, Instance, OrbitControls } from "@threlte/extras"
  import { mhvcToHex } from "munsell"
  // マンセル・リノーテーション・データ（http://www.rit-mcsl.org/MunsellRenotation/all.dat）
  // 由来の「各色相・各明度における実測上の最高彩度」テーブル。
  // 色立体の凹凸（色の木 = color tree 形状）はこの実測境界によって決まる。
  import { maxChromaTable } from "munsell/dist/src/MRD.js"

  // ===== マンセルのサンプリング設定 =====
  /** 色相分割数（2.5 ステップ × 40）。maxChromaTable の行インデックス hue40 と一致する */
  const HUE_COUNT = 40
  /** 明度の描画範囲（V=0 黒・V=10 白は無彩色軸の極として別途描画する） */
  const VALUE_MIN = 1
  const VALUE_MAX = 9
  /** 彩度ステップ（マンセル標準は 2 刻み） */
  const CHROMA_STEP = 2

  // ===== ワールド座標へのスケール =====
  /** 明度 1 段あたりの高さ */
  const VALUE_UNIT = 1
  /** 彩度 1 段あたりの半径方向距離 */
  const CHROMA_UNIT = 0.3

  // ===== チップ（色票）の充填率 =====
  // 各チップは「割り当てられたセル」の何割を占めるか。1 未満で隙間を作り、
  // 個々の色票が判別できるようにする。
  const HUE_FILL = 0.82 // 接線方向（隣の色相との隙間）
  const CHROMA_FILL = 0.86 // 半径方向（隣の彩度との隙間）
  const VALUE_FILL = 0.86 // 高さ方向（隣の明度との隙間）

  // 半径方向の奥行きと高さは全チップ共通（接線方向の幅だけ半径に応じて変わる）。
  // 無彩色軸チップもこの寸法を使い、他の色票と同じ大きさにする。
  const CHIP_RADIAL_DEPTH = CHROMA_FILL * CHROMA_STEP * CHROMA_UNIT
  const CHIP_HEIGHT = VALUE_FILL * VALUE_UNIT

  // ===== カメラ・操作 =====
  /** 色立体の高さ中心（V=5 のワールド y）。OrbitControls の注視点に使う */
  const CENTER_Y = 5 * VALUE_UNIT
  const CAMERA_FOV = 45
  // 初期カメラ位置はジオメトリの外接球から自動算出するため（後述の FIT_DISTANCE）、
  // VALUE_UNIT / CHROMA_UNIT を変更しても初期表示で色立体全体が収まる。
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
    /** Y 軸回りの回転。色票の奥行き面を半径方向の外側へ向ける */
    rotationY: number
    scale: [number, number, number]
    color: string
  }

  /** hue40（0..39）→ munsell.js の hue100 表記 */
  function hue40ToHue100(hue40: number): number {
    return (hue40 * 2.5) % 100
  }

  function buildChips(): Chip[] {
    const chips: Chip[] = []
    const anglePerHue = (2 * Math.PI) / HUE_COUNT

    // --- 有彩色のチップ ---
    for (let hue40 = 0; hue40 < HUE_COUNT; hue40++) {
      const hue100 = hue40ToHue100(hue40)
      const theta = hue40 * anglePerHue
      // 色票の奥行き(local +z)を半径方向外側 (cosθ, 0, sinθ) に向けるための Y 回転
      const rotationY = Math.PI / 2 - theta
      const dirX = Math.cos(theta)
      const dirZ = Math.sin(theta)

      for (let v = VALUE_MIN; v <= VALUE_MAX; v++) {
        const maxC = maxChromaTable[hue40][v]
        if (!maxC) continue
        const y = v * VALUE_UNIT
        for (let c = CHROMA_STEP; c <= maxC; c += CHROMA_STEP) {
          const r = c * CHROMA_UNIT
          const tangentialW = HUE_FILL * anglePerHue * r
          chips.push({
            key: `h${hue40}-v${v}-c${c}`,
            position: [dirX * r, y, dirZ * r],
            rotationY,
            scale: [tangentialW, CHIP_HEIGHT, CHIP_RADIAL_DEPTH],
            color: mhvcToHex(hue100, v, c)
          })
        }
      }
    }

    // --- 無彩色軸（中心列）。V=0 黒 〜 V=10 白 ---
    for (let v = 0; v <= 10; v++) {
      chips.push({
        key: `n-v${v}`,
        position: [0, v * VALUE_UNIT, 0],
        rotationY: 0,
        scale: [CHIP_RADIAL_DEPTH, CHIP_HEIGHT, CHIP_RADIAL_DEPTH],
        // 彩度 0 の無彩色（色相に依らずグレースケール）
        color: mhvcToHex(0, v, 0)
      })
    }

    return chips
  }

  const chips = buildChips()

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
   * チップの大きさ（空間対角の半分）も加味してはみ出しを防ぐ。
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
      const chipR = 0.5 * Math.hypot(ch.scale[0], ch.scale[1], ch.scale[2])
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

<div class="solid-3d" role="img" aria-label="マンセル色立体の3次元表示（ドラッグで回転）">
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

      <!-- 色票は MeshBasicMaterial（陰影なし）で塗り、各 hex を正確な見た目で表示する -->
      <!-- limit=確保数 / range=描画数。range の既定値は 1000 のため、全チップを描くには明示指定が必要 -->
      <InstancedMesh limit={chips.length} range={chips.length}>
        <T.BoxGeometry />
        <T.MeshBasicMaterial />

        {#each chips as chip (chip.key)}
          <Instance
            position={chip.position}
            rotation={[0, chip.rotationY, 0]}
            scale={chip.scale}
            color={chip.color}
          />
        {/each}
      </InstancedMesh>
    </Canvas>
  {/if}
</div>

<style>
  .solid-3d {
    position: relative;
    width: 100%;
    aspect-ratio: 1 / 1;
    /* OrbitControls のドラッグ中にページがスクロールしないようにする */
    touch-action: none;
    cursor: grab;
  }

  .solid-3d:active {
    cursor: grabbing;
  }
</style>
