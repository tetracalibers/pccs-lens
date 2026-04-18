# 要求内容: JIS慣用色へのPCCS近似値追加

## 背景・目的

`app/src/lib/data/jis_colors.json` の各エントリ（130色）には、現状 `name` / `reading` / `hex` / `examLevel` / `munsell` のみが格納されており、PCCSとの対応関係がデータとして存在しない。

アプリ側で JIS慣用色 → PCCS近似色 の関係を参照するたびに色差計算を行うのは冗長であり、事前計算してデータに埋め込むことでアプリ実行時の計算コストを削減し、UI上での一貫した表示を保証したい。

## 変更・追加する機能

- `jis_colors.json` の各エントリに、PCCS近似色の配列 `approximatePccs` フィールドを追加する
- 事前計算用の Node.js スクリプト `app/scripts/add-pccs-approximations.mjs` を新規作成する
- `JISColor` 型定義 (`app/src/lib/data/types.ts`) に `approximatePccs` を追加する

## 近似の基準

- 色差計算アルゴリズム: **CIEDeltaE_2000**（`chroma.deltaE`）
- 比較対象のPCCS色: `PCCS_ALL`（全トーン×全色相 + 無彩色、`app/src/lib/data/pccs.ts` で定義されるもの）
- 採用ルール:
  - **1位（最も ΔE が小さい色）は ΔE の値にかかわらず必ず採用**（= 空配列にはしない）
  - 2位・3位は以下の **両方** を満たす場合のみ追加:
    - ΔE ≤ 10（絶対閾値）
    - ΔE ≤ 1位のΔE × 1.5（比率による切り捨て）
  - どちらかの条件を外れた時点で以降は全て切り捨て
  - 最大 3 件まで

## ユーザーストーリー

- **色分析UIの開発者として**、JIS慣用色を表示する際に、その色が「PCCSのどのトーン・色相に近いか」を事前計算済みのデータから即座に参照したい。色差計算を毎回クライアントで行わず、UIのレスポンスを素早く保ちたい。

## 受け入れ条件

1. `jis_colors.json` の全130エントリに `approximatePccs` フィールドが追加されている
2. `approximatePccs` は **必ず1件以上3件以下** の要素を持つ配列である（空配列は存在しない）
3. 配列の各要素は `{ notation: string, deltaE: number }` の形式で、`notation` は `PCCS_ALL` に存在する `notation` と一致する
4. 配列は `deltaE` 昇順でソートされている
5. 2位以降の要素は、ΔE ≤ 10 かつ 1位のΔE × 1.5 以下を満たしている
6. `JISColor` 型が更新され、`npm run check` で型エラーが出ない
7. スクリプトは冪等（同じ入力に対して何度実行しても同じ結果になる）
8. スクリプトの実行方法が `package.json` に記述されている（例: `npm run data:pccs-approx`）

## 制約事項

- スクリプト実行環境は追加依存なしの素の Node.js（`.mjs` 形式、`fs.readFile` でJSON読込）
- 既存の `chroma-js`（v3.2.0）のみを外部依存として使用
- `PCCS_ALL` は `pccs.ts` と同じデータソース（v24/s12/even12/odd12/neutral の5つのJSON）を結合して構築する
- `PCCS_HEX_MAP` に含まれる無彩色バケット（`W`/`ltGy`/`mGy`/`dkGy`/`Bk`）は `PCCS_ALL` 内の無彩色との重複となるため、近似候補には含めない
- `deltaE` は小数点2桁に丸めて保存する
