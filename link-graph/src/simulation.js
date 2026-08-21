// d3-force によるレイアウト。fcose の一発計算をやめて、力学シミュレーションそのものを
// アニメーションとして見せる。
//
// 力の構成は次の 4 つ。前 3 つは d3-force の既製品だが、**ユニットごとの引力**だけは
// 既製品にないので自前で足している（同じ囲みのメンバーを重心へ引き、重心どうしは離す）。
// これがないと、同じユニットのページが必ずしも近くに来ないので囲みが伸びきってしまう。
//
//   charge  ノード同士の反発（forceManyBody）
//   link    エッジによる引力（forceLink）
//   center  全体を原点へ寄せる弱い引力（forceX / forceY）
//   unit    同じユニットを近づけ、ユニットどうしは離す（forceUnitCohesion）
//
// 解き切ったあとには**ラベルの縦重なりをほどく後処理**を通す（declutter.js）。当たり判定は円
// なので、ノードの右横に出る扁平なラベルの箱までは面倒を見られない。x は動かさず y だけを
// 掃き分ける形で、力の均衡（＝囲みの形）を崩さずにラベルを読めるようにする。
//
// **常時シミュレーションにはしない。** 初回ロード・再配置・表示項目の増減は、アニメーションを
// 見せずに裏で解き切ってから結果だけを渡す（`solve` / `settle`）。時間をかけて動かすのは
// ドラッグの揺り戻し（`nudge`）だけ。走査やフィルタのたびに全体が泳ぐと「さっき見ていた赤が
// どこへ行ったか」を追えなくなるため、再走査時は既存ノードを fx/fy で固定して増えた分だけを
// 落とし、落ち着いたところで固定を外す（fcose の fixedNodeConstraint と同じ役割）。

import { forceCollide, forceLink, forceManyBody, forceSimulation, forceX, forceY } from "d3-force"

import { separateLabels } from "./declutter.js"
import { NODE_SIZES, SIMULATION, SIMULATION_SEED } from "./theme.js"

/** mulberry32。シードから決定的な擬似乱数列を作る。 */
const createRandom = (seed) => {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** ユニットが占めると想定する半径。メンバーが多いほど広く見積もる。 */
const unitRadius = (count) => Math.sqrt(count) * SIMULATION.unitRadiusPerNode

/**
 * ユニットごとの引力。d3-force のカスタム力。
 *
 * 1. 同じ `unit` を持つノードを、そのユニットの重心へ引く
 * 2. ユニットの重心どうしが `半径の和` より近ければ、メンバーごと押し合って離す
 *
 * `unit` が null のノード（ゴースト・リンク切れ・所属不明）は囲みの外に置くので、
 * どちらの対象にもしない。
 */
const forceUnitCohesion = () => {
  /** @type {Array<{ unit: string | null, x: number, y: number, vx: number, vy: number }>} */
  let nodes = []

  const force = (alpha) => {
    /** @type {Map<string, { x: number, y: number, count: number }>} */
    const centers = new Map()
    for (const node of nodes) {
      if (!node.unit) continue
      const center = centers.get(node.unit) ?? { x: 0, y: 0, count: 0 }
      center.x += node.x
      center.y += node.y
      center.count += 1
      centers.set(node.unit, center)
    }
    if (centers.size === 0) return

    for (const center of centers.values()) {
      center.x /= center.count
      center.y /= center.count
    }

    // 1) 重心へ引く
    const cohesion = SIMULATION.unitCohesion * alpha
    for (const node of nodes) {
      if (!node.unit) continue
      const center = centers.get(node.unit)
      node.vx += (center.x - node.x) * cohesion
      node.vy += (center.y - node.y) * cohesion
    }

    // 2) 重心どうしを離す。ずらす量はいったんユニット単位で求めて、メンバー全員に同じだけ配る。
    const list = [...centers]
    /** @type {Map<string, { x: number, y: number }>} */
    const shift = new Map(list.map(([id]) => [id, { x: 0, y: 0 }]))

    for (let i = 0; i < list.length; i += 1) {
      const [idA, a] = list[i]
      for (let j = i + 1; j < list.length; j += 1) {
        const [idB, b] = list[j]
        let dx = b.x - a.x
        let dy = b.y - a.y
        let distance = Math.hypot(dx, dy)
        // 完全に重なっているときは決め打ちの方向へ逃がす（0 除算とデッドロックの回避）。
        if (distance === 0) {
          dx = 1
          dy = 0
          distance = 1
        }
        const wanted = unitRadius(a.count) + unitRadius(b.count)
        if (distance >= wanted) continue

        const push = (((wanted - distance) / distance) * SIMULATION.unitSeparation * alpha) / 2
        const shiftA = shift.get(idA)
        const shiftB = shift.get(idB)
        shiftA.x -= dx * push
        shiftA.y -= dy * push
        shiftB.x += dx * push
        shiftB.y += dy * push
      }
    }

    for (const node of nodes) {
      if (!node.unit) continue
      const delta = shift.get(node.unit)
      node.vx += delta.x
      node.vy += delta.y
    }
  }

  force.initialize = (next) => {
    nodes = next
  }

  return force
}

/**
 * シミュレーションを作る。
 *
 * @param {object} handlers
 * @param {() => void} handlers.onTick 毎フレーム。座標を Cytoscape へ流し込む
 * @param {() => void} handlers.onSettle 落ち着いたとき（固定の解除もここで行う）
 * @param {(id: string) => number} handlers.labelWidth ラベルの実寸（px）。縦重なりの判定に使う
 */
export const createSimulation = ({ onTick, onSettle, labelWidth }) => {
  const random = createRandom(SIMULATION_SEED)

  /** @type {Map<string, object>} id → シミュレーションのノード。座標はここが持つ。 */
  const byId = new Map()

  /** @type {Map<string, { x: number, y: number }>} ユニットの初期位置（円周上のスロット）。 */
  let unitSlots = new Map()

  let running = false

  const linkForce = forceLink([])
    .id((node) => node.id)
    .distance(SIMULATION.linkDistance)

  const simulation = forceSimulation([])
    .randomSource(createRandom(SIMULATION_SEED))
    .velocityDecay(SIMULATION.velocityDecay)
    .force(
      "charge",
      forceManyBody().strength(SIMULATION.chargeStrength).distanceMax(SIMULATION.chargeDistanceMax)
    )
    .force("link", linkForce)
    .force(
      "collide",
      forceCollide().radius(
        (node) => (NODE_SIZES[node.state] ?? NODE_SIZES.published) / 2 + SIMULATION.collidePadding
      )
    )
    .force("unit", forceUnitCohesion())
    .force("x", forceX(0).strength(SIMULATION.centerStrength))
    .force("y", forceY(0).strength(SIMULATION.centerStrength))
    .stop()

  /** 固定（fx/fy）を全て外す。落ち着いたあとは自由にしておき、次の再配置で動けるようにする。 */
  const release = () => {
    for (const node of byId.values()) {
      delete node.fx
      delete node.fy
    }
  }

  /**
   * ラベルの縦重なりをほどく。落ち着いた形が決まったところで 1 回だけ通す。
   *
   * ヘッダーのチップで絞り込まれているノードも対象に含める。絞り込みは配置に触らない決まりなので、
   * 絞り込みのたびに縦の間隔が変わってしまうと「配置は動かない」が崩れる。
   */
  const declutter = () => {
    separateLabels([...byId.values()], { labelWidth })
  }

  simulation.on("tick", onTick)
  simulation.on("end", () => {
    running = false
    release()
    declutter()
    onSettle()
  })

  const jitter = () => (random() - 0.5) * SIMULATION.jitter

  /**
   * 走査結果・フィルタの結果に合わせてノードとリンクを入れ替える。
   *
   * 生き残ったノードは座標を保つ。ユニットが変わったノード（本体 ⇄ ゴースト）は
   * 座標は引き継ぐが固定はしない。
   *
   * @param {object} input
   * @param {Array<{ id: string, state: string, unit: string | null }>} input.nodes
   * @param {Array<{ source: string, target: string }>} input.links
   * @param {string[]} input.unitOrder 初期位置のスロットを割り当てる順（走査結果のユニット順）
   * @param {boolean} input.pin 生き残ったノードを現在の座標に固定するか
   * @returns {{ added: number }} 新しく置かれたノードの数
   */
  const sync = ({ nodes: input, links: inputLinks, unitOrder, pin }) => {
    // --- ユニットの初期位置（円周上のスロット）---
    const present = new Set()
    for (const node of input) if (node.unit) present.add(node.unit)
    const ordered = unitOrder.filter((id) => present.has(id))
    unitSlots = new Map(
      ordered.map((id, index) => {
        const angle = (index / Math.max(ordered.length, 1)) * Math.PI * 2
        return [
          id,
          {
            x: Math.cos(angle) * SIMULATION.ringRadius,
            y: Math.sin(angle) * SIMULATION.ringRadius
          }
        ]
      })
    )

    // --- 既知ノードから、ユニットごとの現在の重心を出す（新規ノードをそこへ置くため）---
    /** @type {Map<string, { x: number, y: number, count: number }>} */
    const known = new Map()
    for (const node of byId.values()) {
      if (!node.unit || !present.has(node.unit)) continue
      const center = known.get(node.unit) ?? { x: 0, y: 0, count: 0 }
      center.x += node.x
      center.y += node.y
      center.count += 1
      known.set(node.unit, center)
    }
    for (const center of known.values()) {
      center.x /= center.count
      center.y /= center.count
    }

    /** ユニットの「置き場所」。既にメンバーがいればその重心、いなければ円周上のスロット。 */
    const anchor = (unit) => known.get(unit) ?? unitSlots.get(unit) ?? { x: 0, y: 0 }

    // --- 隣接（囲みの外のノードを、リンク元の近くへ置くため）---
    /** @type {Map<string, string[]>} */
    const neighbors = new Map()
    const addNeighbor = (from, to) => {
      const list = neighbors.get(from)
      if (list) list.push(to)
      else neighbors.set(from, [to])
    }
    for (const link of inputLinks) {
      addNeighbor(link.source, link.target)
      addNeighbor(link.target, link.source)
    }

    const unitOf = new Map(input.map((node) => [node.id, node.unit]))

    /** 囲みの外のノードの置き場所。リンク相手の平均に寄せ、相手がいなければ外周へ逃がす。 */
    const looseAnchor = (id, index) => {
      let x = 0
      let y = 0
      let count = 0
      for (const other of neighbors.get(id) ?? []) {
        const existing = byId.get(other)
        if (existing) {
          x += existing.x
          y += existing.y
          count += 1
          continue
        }
        const unit = unitOf.get(other)
        if (unit) {
          const point = anchor(unit)
          x += point.x
          y += point.y
          count += 1
        }
      }
      if (count > 0) return { x: x / count, y: y / count }

      const angle = (index / Math.max(input.length, 1)) * Math.PI * 2
      const radius = SIMULATION.ringRadius * 1.6
      return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius }
    }

    // --- ノードの入れ替え ---
    const next = []
    const fresh = new Set()

    input.forEach((item, index) => {
      const existing = byId.get(item.id)

      if (existing && existing.unit === item.unit) {
        existing.state = item.state
        next.push(existing)
        return
      }

      const seed = item.unit ? anchor(item.unit) : looseAnchor(item.id, index)
      const node = {
        id: item.id,
        state: item.state,
        unit: item.unit,
        x: existing ? existing.x : seed.x + jitter(),
        y: existing ? existing.y : seed.y + jitter(),
        vx: 0,
        vy: 0
      }
      next.push(node)
      fresh.add(item.id)
    })

    byId.clear()
    for (const node of next) {
      if (pin && !fresh.has(node.id)) {
        node.fx = node.x
        node.fy = node.y
      } else {
        delete node.fx
        delete node.fy
      }
      byId.set(node.id, node)
    }

    simulation.nodes(next)
    // forceLink は渡したオブジェクトの source / target を書き換えるので、毎回作り直す。
    linkForce.links(inputLinks.map((link) => ({ source: link.source, target: link.target })))

    return { added: fresh.size }
  }

  /** 全ノードをユニットの初期位置へ戻す。初回と明示的な再配置で「ほどける」動きを作る。 */
  const reseed = () => {
    for (const node of byId.values()) {
      const seed = node.unit ? (unitSlots.get(node.unit) ?? { x: 0, y: 0 }) : { x: 0, y: 0 }
      node.x = seed.x + jitter()
      node.y = seed.y + jitter()
      node.vx = 0
      node.vy = 0
      delete node.fx
      delete node.fy
    }
  }

  /**
   * シミュレーションを回す。
   *
   * @param {object} options
   * @param {number} options.alpha 初期エネルギー（1 で全力、小さいほど控えめ）
   * @param {number} options.decay エネルギーの減衰。小さいほど長く動く
   */
  const run = ({ alpha, decay }) => {
    if (byId.size === 0) return
    running = true
    simulation.alpha(alpha).alphaDecay(decay).alphaTarget(0).restart()
  }

  /**
   * アニメーションを見せずに一気に落ち着かせる。
   *
   * d3 の `tick()` は tick イベントを飛ばさないので、途中の状態は Cytoscape へ渡らない
   * （= 配置が決まるまでのチラつきが出ない）。指定した回数で alpha が alphaMin まで落ちる
   * ように減衰を逆算して回す。
   */
  const solveQuietly = ({ alpha, ticks }) => {
    if (byId.size === 0) return
    const decay = 1 - Math.pow(simulation.alphaMin() / alpha, 1 / ticks)
    simulation.alpha(alpha).alphaDecay(decay).alphaTarget(0).tick(ticks)
  }

  /** 初回ロードと「再配置」。ユニットの中心から解き直す（過程は見せない）。 */
  const solve = () => {
    reseed()
    solveQuietly({ alpha: 1, ticks: SIMULATION.solveTicks })
    declutter()
  }

  /**
   * 表示項目が増えたぶんだけを落ち着かせる（過程は見せない）。
   *
   * 既存ノードは `sync` の `pin` で現在の座標に固定してあるので、動くのは増えた分だけ。
   */
  const settle = () => {
    solveQuietly({ alpha: SIMULATION.settleAlpha, ticks: SIMULATION.settleTicks })
    // 既存のノードは `sync` の `pin` で固定したままなので、ここで動くのも増えた分だけ。
    declutter()
  }

  /** ドラッグを離したあとの揺り戻し。ここだけは動きを見せる。 */
  const nudge = () => {
    run({ alpha: SIMULATION.dragAlpha, decay: SIMULATION.dragAlphaDecay })
  }

  const stop = () => {
    if (!running) return
    running = false
    simulation.stop()
    release()
    // 止めた瞬間にラベルが戻るので、その形でも重ならないようにしておく。
    declutter()
    onSettle()
  }

  /** ドラッグ中のノードを掴んだ位置に縛る。 */
  const hold = (id, position) => {
    const node = byId.get(id)
    if (!node) return
    node.fx = position.x
    node.fy = position.y
    node.x = position.x
    node.y = position.y
  }

  /** ドラッグを離したノードを自由にする。 */
  const drop = (id) => {
    const node = byId.get(id)
    if (!node) return
    delete node.fx
    delete node.fy
  }

  return {
    sync,
    solve,
    settle,
    nudge,
    stop,
    hold,
    drop,
    /** 固定を外す。動かさずに済んだときも、次のドラッグで周りが反応できるようにしておく。 */
    unpin: release,
    isRunning: () => running,
    nodes: () => [...byId.values()]
  }
}
