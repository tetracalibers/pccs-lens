// ラベルの縦重なりをほどく後処理。**x は 1px も動かさず、y だけを掃き分ける。**
//
// ノード同士の当たり判定（simulation.js の forceCollide）は円なので、「縦は近いが横は遠い」と
// 「縦も横も近い」を区別できない。ところがラベルはノードの右横に出る 1 行のテキストで、実体は
// 幅 100px 前後・高さ 16px の扁平な箱になる（169 ページのタイトルは中央値 9 文字・最大 19 文字）。
// ノードの間隔（中心間 25px 前後）よりラベルの方がはるかに横長なので、横位置はほとんどの組で
// 重なっていて、読めるかどうかは縦の間隔だけで決まっている。
//
// **全ノードに一律の縦間隔は与えない。** 169 ノード × 16px = 2700px の縦帯になり、レイアウト
// 全体（全部 ON で 1300px 角）より縦に伸びて、ユニットのかたまりが読めなくなる。ほどくのは「箱が横方向でも
// 重なっている組」だけに絞る。これが本当に必要な条件で、それ以外の組は縦にいくら近くてもよい。
//
// 手順は 2 段（＋最後に全体の重心を元の高さへ戻す）。
//
//   1. relax … 重なっている組を上下へ半分ずつ押し合う。全体が片側へ寄らないよう、
//               大半はここで解消する
//   2. sweep … 上から順に置き直し、残った重なりを下へ逃がす。置いたノードは以降動かさないので、
//               この 1 巡で**全ての組が条件を満たすことが保証される**
//
// `fx`/`fy` で固定されたノードは動かさない。増えた分だけを落ち着かせる `settle` では既存の
// ノードが固定されているので、動くのは新しく置かれたノードだけになる（再走査のたびに全体が
// ずれると「さっき見ていた赤がどこへ行ったか」を追えなくなる）。

import { LABEL_MARGIN_X, LABEL_SEPARATION, NODE_SIZES } from "./theme.js"

const radiusOf = (node) => (NODE_SIZES[node.state] ?? NODE_SIZES.published) / 2

/**
 * 間隔の判定の許容誤差（px）。
 *
 * `y = 相手の y + 必要な間隔` と置いたのに、引き算で戻すと丸めで間隔をわずかに下回ることがある
 * （`535.27 - 519.27` が `15.999999999999943` になる、というたぐい）。素の `>=` で見ると
 * 「ちょうど接している」が永遠に「重なっている」と判定されて、押しのけが止まらなくなる。
 */
const EPSILON = 1e-6

/** 横方向で重なっているか。重なっていない組は、縦にいくら近くても手を出さない。 */
const overlapsX = (a, b) => a.left < b.right && b.left < a.right

/** この 2 つが縦に確保すべき間隔。 */
const needed = (a, b) => a.half + b.half + LABEL_SEPARATION.padding

/**
 * ラベルが縦に重ならないよう y を掃き分ける。ノードの `y` を直接書き換える。
 *
 * @param {Array<{ id: string, state: string, x: number, y: number, fy?: number }>} nodes
 * @param {object} options
 * @param {(id: string) => number} options.labelWidth ラベルの実寸（px）
 */
export const separateLabels = (nodes, { labelWidth }) => {
  if (nodes.length < 2) return

  // 箱は「点 + その右のラベル」。左端は点の左端、右端はラベルの右端。
  const boxes = nodes.map((node) => {
    const radius = radiusOf(node)
    return {
      node,
      fixed: node.fy !== undefined,
      left: node.x - radius,
      right: node.x + radius + LABEL_MARGIN_X + labelWidth(node.id),
      // ラベルより点が大きいノード（リンク切れ・本文なし）は、点が隣のラベルを隠さない高さを採る。
      half: Math.max(LABEL_SEPARATION.halfHeight, radius)
    }
  })

  const pairs = []
  for (let i = 0; i < boxes.length; i += 1) {
    for (let j = i + 1; j < boxes.length; j += 1) {
      const a = boxes[i]
      const b = boxes[j]
      // 両方とも固定されている組は、どちらも動かせないので見なくてよい。
      if (a.fixed && b.fixed) continue
      if (overlapsX(a, b)) pairs.push([a, b])
    }
  }
  if (pairs.length === 0) return

  const centerBefore = boxes.reduce((total, box) => total + box.node.y, 0) / boxes.length

  // --- 1) 対称にほどく ---
  for (let pass = 0; pass < LABEL_SEPARATION.relaxPasses; pass += 1) {
    let resolved = true

    for (const [a, b] of pairs) {
      const need = needed(a, b)
      const delta = b.node.y - a.node.y
      const distance = Math.abs(delta)
      if (distance + EPSILON >= need) continue

      resolved = false
      // 完全に同じ高さのときは決め打ちの向きへ逃がす（デッドロックの回避）。
      const sign = delta === 0 ? 1 : Math.sign(delta)
      const deficit = need - distance

      // 相手が固定されているときは、動ける側が deficit を全部引き受ける。
      if (a.fixed) b.node.y += deficit * sign
      else if (b.fixed) a.node.y -= deficit * sign
      else {
        a.node.y -= (deficit / 2) * sign
        b.node.y += (deficit / 2) * sign
      }
    }

    if (resolved) break
  }

  // --- 2) 残りを下へ逃がして保証する ---
  // 固定されたノードを先に置き、あとは上から順に。押しのける向きを下だけに限れば、
  // 「置いたノードは以降動かない」が成り立つので 1 巡で条件を満たせる。
  const order = [...boxes].sort((a, b) => Number(b.fixed) - Number(a.fixed) || a.node.y - b.node.y)

  const placed = []
  for (const box of order) {
    if (box.fixed) {
      placed.push(box)
      continue
    }

    let y = box.node.y
    // 下へずらすと別のノードに当たることがあるので、当たらなくなるまで繰り返す。
    let moved = true
    while (moved) {
      moved = false
      for (const other of placed) {
        if (!overlapsX(box, other)) continue
        const need = needed(box, other)
        if (Math.abs(y - other.node.y) + EPSILON >= need) continue
        y = other.node.y + need
        moved = true
      }
    }

    box.node.y = y
    placed.push(box)
  }

  // --- 3) 重心を戻す ---
  // 下へ逃がした分だけ全体が沈むので、元の高さへ引き戻す。固定されたノードがあるときは
  // その座標が基準なので、動かさない（全体をずらすと固定の意味がなくなる）。
  if (boxes.some((box) => box.fixed)) return

  const centerAfter = boxes.reduce((total, box) => total + box.node.y, 0) / boxes.length
  const shift = centerBefore - centerAfter
  for (const box of boxes) box.node.y += shift
}
