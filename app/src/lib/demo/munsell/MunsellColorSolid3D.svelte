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

  /** 無彩色軸チップ（中心列）の一辺 */
  const NEUTRAL_CHIP_SIZE = 0.38

  // ===== カメラ・操作 =====
  /** 色立体の高さ中心（V=5 のワールド y）。OrbitControls の注視点に使う */
  const CENTER_Y = 5 * VALUE_UNIT
  const CAMERA_FOV = 45
  const CAMERA_POSITION: [number, number, number] = [13, 7.5, 13]
  const MIN_DISTANCE = 8
  const MAX_DISTANCE = 32
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
          const radialD = CHROMA_FILL * CHROMA_STEP * CHROMA_UNIT
          const height = VALUE_FILL * VALUE_UNIT
          chips.push({
            key: `h${hue40}-v${v}-c${c}`,
            position: [dirX * r, y, dirZ * r],
            rotationY,
            scale: [tangentialW, height, radialD],
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
        scale: [NEUTRAL_CHIP_SIZE, VALUE_FILL * VALUE_UNIT, NEUTRAL_CHIP_SIZE],
        // 彩度 0 の無彩色（色相に依らずグレースケール）
        color: mhvcToHex(0, v, 0)
      })
    }

    return chips
  }

  const chips = buildChips()
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

  <p class="hint">ドラッグで回転・スクロールで拡大縮小</p>
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

  .hint {
    position: absolute;
    inset-block-end: 0.25rem;
    inset-inline: 0;
    margin: 0;
    text-align: center;
    font-size: 0.75rem;
    color: var(--color-body);
    opacity: 0.6;
    pointer-events: none;
  }
</style>
