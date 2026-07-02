#!/usr/bin/env node
/**
 * 明度対比で「明度の異なる2つの図が同じ明るさに見えるか」を見積もる開発用チェック。
 *
 * 対象: src/lib/demo/visual-effect-contrast/LightnessContrastEqualBrightness.svelte の下段
 * （＝異なる地に図を置いて同明度に見せる行）。
 *
 * モデル: 見かけL* = 図のL* − k・(地のL* − 図のL*)
 *   - L* は CIELAB の明度（chroma.js）。知覚的にほぼ等歩度。
 *   - k は同時対比の効き具合を表す係数。左右の見かけL*が一致する「必要な k」を逆算し、
 *     現実的な k（およそ 0.1〜0.2）と比べて、そろう見込みがあるかを判定する。
 *
 * 注意（保証ではなく目安）:
 *   - 方向（明るい図を明るい地／暗い図を暗い地に置けば歩み寄る）は確定できるが、
 *     完全な等価は保証できない。効きは図の面積・形（星アイコンは面積が小さく弱い）、
 *     表示ガンマ、ライト/ダーク、観察者差に依存する。最終確認は必ず目視で行うこと。
 *
 * 実行:
 *   node scripts/check-lightness-contrast.mjs
 *   node scripts/check-lightness-contrast.mjs <左図> <右図> <左地> <右地>
 *     例) node scripts/check-lightness-contrast.mjs Gy-7.0 Gy-4.5 "#f0f0f0" Bk
 *   図・地はいずれも PCCS表記（Gy-7.0, Bk, W …）または hex（#f0f0f0）で指定できる。
 */
import chroma from "chroma-js"
import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))

// ===== コンポーネントの既定値（変更したらここも合わせる） =====
const DEFAULT = {
  figureLeft: "Gy-7.5",
  figureRight: "Gy-5.0",
  groundLeft: "#f0f0f0",
  groundRight: "Bk"
}

// 現実的な同時対比の効き（この上限を超える必要 k は「対比だけでは無理」の目安）
const REALISTIC_K = 0.2

// ===== PCCS無彩色の 表記→hex 対応を読み込む =====
const neutral = JSON.parse(
  readFileSync(resolve(__dirname, "../src/lib/data/pccs_neutral.json"), "utf8")
)
const PCCS_NEUTRAL = new Map(neutral.map((c) => [c.notation, c.hex]))

/** PCCS表記 or hex を hex に解決する */
function toHex(token) {
  if (token.startsWith("#")) return token
  const hex = PCCS_NEUTRAL.get(token)
  if (!hex) {
    console.error(`Unknown color: "${token}" (PCCS無彩色の表記 または #hex を指定してください)`)
    process.exit(1)
  }
  return hex
}

const L = (hex) => chroma(hex).lab()[0]

// ===== 入力（CLI引数があれば優先） =====
const [aL, aR, gL, gR] = process.argv.slice(2)
const input = {
  figureLeft: aL ?? DEFAULT.figureLeft,
  figureRight: aR ?? DEFAULT.figureRight,
  groundLeft: gL ?? DEFAULT.groundLeft,
  groundRight: gR ?? DEFAULT.groundRight
}

const Ll = L(toHex(input.figureLeft))
const Lr = L(toHex(input.figureRight))
const Bl = L(toHex(input.groundLeft))
const Br = L(toHex(input.groundRight))

// ===== 出力 =====
const f = (n) => n.toFixed(1)
console.log("■ 図（実際の色）")
console.log(`  左 ${input.figureLeft.padEnd(8)} L* = ${f(Ll)}`)
console.log(`  右 ${input.figureRight.padEnd(8)} L* = ${f(Lr)}`)
console.log(`  実際の明度差 ΔL* = ${f(Math.abs(Ll - Lr))}  ← 上段（基準）で見える差`)
console.log("")
console.log("■ 地")
console.log(`  左 ${input.groundLeft.padEnd(8)} L* = ${f(Bl)}`)
console.log(`  右 ${input.groundRight.padEnd(8)} L* = ${f(Br)}`)
console.log("")

// 左右の見かけL*が一致する必要な k を逆算
//   Ll − k(Bl−Ll) = Lr − k(Br−Lr)  ⇒  k = (Ll−Lr) / ((Bl−Ll) − (Br−Lr))
const denom = Bl - Ll - (Br - Lr)
const requiredK = (Ll - Lr) / denom

console.log("■ 見積もり")
if (!Number.isFinite(requiredK) || Math.abs(denom) < 1e-6) {
  console.log("  地の配置が対比を生まない（左右の地がほぼ同じ）ため判定不能。")
  process.exit(0)
}
if (requiredK < 0) {
  console.log(`  必要な対比係数 k = ${requiredK.toFixed(2)} （負）`)
  console.log(
    "  ✗ 地の明暗が逆で、対比は図を「遠ざける」方向。明るい図は明るい地／暗い図は暗い地へ。"
  )
  process.exit(0)
}

console.log(`  同明度に見せるのに必要な対比係数 k = ${requiredK.toFixed(2)}`)
console.log(`  （現実的な効きの目安 k ≈ 0〜${REALISTIC_K}）`)

let verdict
if (requiredK <= REALISTIC_K) verdict = "◎ 現実的な範囲でそろう見込み"
else if (requiredK <= REALISTIC_K * 1.75) verdict = "△ 効きが強めに出る環境なら…（境界的）"
else verdict = "✗ 対比だけでは難しい。図の明度差（ΔL*）を詰めるのが確実"
console.log(`  判定: ${verdict}`)
console.log("")

console.log("■ k ごとの見かけL*（左 / 右 / 残差）")
for (const k of [0.1, 0.15, 0.2]) {
  const apL = Ll - k * (Bl - Ll)
  const apR = Lr - k * (Br - Lr)
  console.log(`  k=${k.toFixed(2)}:  ${f(apL)} / ${f(apR)}  残差 ${f(apL - apR)}`)
}
